import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../../../components/Toast';
import ManagementHeader from '../components/layout/ManagementHeader';
import {
  getManagementFeeRecords,
  uploadFeeData,
  verifyFeeByManagement,
} from '../../../firebase/cloudFunctions';
import { CheckCircle2, FileSpreadsheet, Filter, UploadCloud } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'fully_paid', label: 'Fully Paid' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'pending', label: 'Pending' },
];

const statusBadgeClass = (status) => {
  if (status === 'fully_paid') return 'bg-green-100 text-green-700 border border-green-200';
  if (status === 'partially_paid') return 'bg-amber-100 text-amber-700 border border-amber-200';
  return 'bg-red-100 text-red-700 border border-red-200';
};

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const data = String(reader.result || '');
      const encoded = data.includes(',') ? data.split(',')[1] : data;
      resolve(encoded);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const FeeManagement = () => {
  const { isCollapsed, setIsCollapsed } = useOutletContext();
  const toast = useToast();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [manualRow, setManualRow] = useState({ studentId: '', totalAmount: '', paidAmount: '' });

  const fetchRecords = async (status = filter) => {
    setLoading(true);
    try {
      const result = await getManagementFeeRecords(status);
      setRecords(Array.isArray(result.records) ? result.records : []);
    } catch (error) {
      toast.error(error.message || 'Failed to load fee records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(filter);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      (r.studentName || '').toLowerCase().includes(q) ||
      (r.studentId || '').toLowerCase().includes(q)
    );
  }, [records, search]);

  const handleFileUpload = async (file) => {
    if (!file) return;
    const isCsvOrExcel = /\.(csv|xlsx|xls)$/i.test(file.name);
    if (!isCsvOrExcel) {
      toast.error('Upload a CSV or Excel file');
      return;
    }

    setUploading(true);
    try {
      const fileBase64 = await toBase64(file);
      const result = await uploadFeeData({
        fileBase64,
        fileName: file.name,
      });
      const skipped = Number(result?.skipped || 0);
      const imported = Number(result?.created || 0) + Number(result?.updated || 0);

      if (imported > 0) {
        toast.success(`Upload complete: ${result.created} created, ${result.updated} updated${skipped ? `, ${skipped} skipped` : ''}`);
      } else {
        const firstReason = result?.errors?.[0]?.reason || 'No matching students were found for the uploaded IDs';
        toast.error(`Upload failed: ${firstReason}`);
      }

      if (skipped && result?.errors?.length) {
        const sample = result.errors.slice(0, 3).map((entry) => `${entry.studentId}: ${entry.reason}`).join(' | ');
        toast.warning(`Skipped rows sample - ${sample}`);
      }
      await fetchRecords(filter);
    } catch (error) {
      toast.error(error.message || 'Fee upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleManualAdd = async () => {
    if (!manualRow.studentId || !manualRow.totalAmount) {
      toast.error('studentId and totalAmount are required');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadFeeData({
        records: [{
          studentId: manualRow.studentId.trim(),
          totalAmount: Number(manualRow.totalAmount),
          paidAmount: Number(manualRow.paidAmount || 0),
        }],
      });

      const imported = Number(result?.created || 0) + Number(result?.updated || 0);
      if (!imported) {
        const firstReason = result?.errors?.[0]?.reason || 'Student was not found under your management scope';
        toast.error(`Manual add failed: ${firstReason}`);
        return;
      }

      setManualRow({ studentId: '', totalAmount: '', paidAmount: '' });
      toast.success(`Manual fee row uploaded (${result.created ? 'created' : 'updated'})`);
      await fetchRecords(filter);
    } catch (error) {
      toast.error(error.message || 'Manual upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleVerify = async (studentUid) => {
    try {
      await verifyFeeByManagement(studentUid);
      toast.success('Record verified and forwarded to warden');
      await fetchRecords(filter);
    } catch (error) {
      toast.error(error.message || 'Verification failed');
    }
  };

  const exportCsv = () => {
    if (!filteredRecords.length) {
      toast.warning('No records to export');
      return;
    }

    const rows = filteredRecords.map((r) => ({
      studentName: r.studentName,
      studentId: r.studentId,
      totalAmount: r.totalAmount,
      paidAmount: r.paidAmount,
      remainingAmount: r.remainingAmount,
      paymentStatus: r.paymentStatus,
      isVerifiedByManagement: r.isVerifiedByManagement,
      isVerifiedByWarden: r.isVerifiedByWarden,
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : '',
    }));

    const sheet = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(sheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `fee-records-${Date.now()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <ManagementHeader
        title="Fee Management"
        pendingCount={records.filter((r) => !r.isVerifiedByWarden).length}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div className="pt-20 sm:pt-24 px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5">
        <div className="rounded-2xl border p-4 sm:p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
          <div className="flex items-center gap-2 mb-4">
            <UploadCloud className="w-5 h-5 text-indigo-500" />
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Upload Fee Data</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="border border-dashed rounded-xl p-4 cursor-pointer" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}>
              <input
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => handleFileUpload(e.target.files?.[0])}
                disabled={uploading}
              />
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Drag and drop or click to upload CSV/Excel</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Required columns: studentId, totalAmount, paidAmount</p>
                </div>
              </div>
            </label>

            <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}>
              <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Manual Entry</p>
              <div className="grid grid-cols-3 gap-2">
                <input className="px-3 py-2 rounded-lg border text-sm" placeholder="studentId" value={manualRow.studentId} onChange={(e) => setManualRow((prev) => ({ ...prev, studentId: e.target.value }))} />
                <input className="px-3 py-2 rounded-lg border text-sm" placeholder="totalAmount" type="number" value={manualRow.totalAmount} onChange={(e) => setManualRow((prev) => ({ ...prev, totalAmount: e.target.value }))} />
                <input className="px-3 py-2 rounded-lg border text-sm" placeholder="paidAmount" type="number" value={manualRow.paidAmount} onChange={(e) => setManualRow((prev) => ({ ...prev, paidAmount: e.target.value }))} />
              </div>
              <button onClick={handleManualAdd} disabled={uploading} className="mt-3 px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white font-semibold disabled:opacity-60">
                Add Row
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border p-4 sm:p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 rounded-lg border text-sm">
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by student name or ID"
                className="px-3 py-2 rounded-lg border text-sm min-w-[220px]"
              />
            </div>
            <button onClick={exportCsv} className="px-3 py-2 text-sm rounded-lg border">Export CSV</button>
          </div>

          {loading ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading records...</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left" style={{ color: 'var(--text-muted)' }}>
                    <th className="py-2">Student</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Total</th>
                    <th className="py-2">Paid</th>
                    <th className="py-2">Remaining</th>
                    <th className="py-2">Management</th>
                    <th className="py-2">Warden</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="border-t" style={{ borderColor: 'var(--border-primary)' }}>
                      <td className="py-2">
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{record.studentName}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{record.studentId}</p>
                      </td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusBadgeClass(record.paymentStatus)}`}>
                          {record.paymentStatus === 'fully_paid' ? 'Fully Paid' : record.paymentStatus === 'partially_paid' ? 'Partially Paid' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-2">{record.totalAmount}</td>
                      <td className="py-2">{record.paidAmount}</td>
                      <td className="py-2">{record.remainingAmount}</td>
                      <td className="py-2">{record.isVerifiedByManagement ? 'Verified' : 'Pending'}</td>
                      <td className="py-2">{record.isVerifiedByWarden ? 'Verified' : 'Pending'}</td>
                      <td className="py-2">
                        <button
                          onClick={() => handleVerify(record.id)}
                          disabled={record.isVerifiedByManagement}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border disabled:opacity-60"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verify
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filteredRecords.length && <p className="text-sm py-3" style={{ color: 'var(--text-muted)' }}>No fee records found.</p>}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FeeManagement;
