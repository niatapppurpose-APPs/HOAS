import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../../../../components/Toast';
import WardenHeader from '../layout/WardenHeader';
import { getWardenFeeRecords, verifyFeeByWarden } from '../../../../firebase/cloudFunctions';

const statusBadgeClass = (status) => {
  if (status === 'fully_paid') return 'bg-green-100 text-green-700 border border-green-200';
  if (status === 'partially_paid') return 'bg-amber-100 text-amber-700 border border-amber-200';
  return 'bg-red-100 text-red-700 border border-red-200';
};

const WardenFeeVerification = () => {
  const { isCollapsed, setIsCollapsed } = useOutletContext();
  const toast = useToast();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteMap, setNoteMap] = useState({});
  const [search, setSearch] = useState('');

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const result = await getWardenFeeRecords();
      setRecords(Array.isArray(result.records) ? result.records : []);
    } catch (error) {
      toast.error(error.message || 'Failed to load warden fee queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      (r.studentName || '').toLowerCase().includes(q) ||
      (r.studentId || '').toLowerCase().includes(q)
    );
  }, [records, search]);

  const submit = async (studentId, approved) => {
    try {
      await verifyFeeByWarden(studentId, approved, noteMap[studentId] || '');
      toast.success(approved ? 'Record approved by warden' : 'Record rejected by warden');
      await fetchRecords();
    } catch (error) {
      toast.error(error.message || 'Failed to submit warden verification');
    }
  };

  return (
    <>
      <WardenHeader
        title="Fee Verification"
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div className="pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 pb-8 space-y-4">
        <div className="rounded-2xl border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Records Sent By Management</h2>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student"
              className="px-3 py-2 rounded-lg border text-sm min-w-[220px]"
            />
          </div>
        </div>

        <div className="rounded-2xl border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
          {loading ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p>
          ) : (
            <div className="space-y-4">
              {filtered.map((record) => (
                <div key={record.id} className="rounded-xl border p-4" style={{ borderColor: 'var(--border-primary)' }}>
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{record.studentName}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{record.studentId}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusBadgeClass(record.paymentStatus)}`}>
                          {record.paymentStatus === 'fully_paid' ? 'Fully Paid' : record.paymentStatus === 'partially_paid' ? 'Partially Paid' : 'Pending'}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Total: {record.totalAmount}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Paid: {record.paidAmount}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Remaining: {record.remainingAmount}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {record.proofImage ? (
                        <a href={record.proofImage} target="_blank" rel="noreferrer" className="text-xs underline text-blue-600">View Proof</a>
                      ) : (
                        <span className="text-xs text-red-500">No proof uploaded</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 grid md:grid-cols-[1fr_auto_auto] gap-2">
                    <input
                      placeholder="Optional note"
                      className="px-3 py-2 rounded-lg border text-sm"
                      value={noteMap[record.id] || ''}
                      onChange={(e) => setNoteMap((prev) => ({ ...prev, [record.id]: e.target.value }))}
                    />
                    <button
                      onClick={() => submit(record.id, true)}
                      disabled={!record.proofImage || record.isVerifiedByWarden}
                      className="px-3 py-2 rounded-lg text-sm bg-emerald-600 text-white font-semibold disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => submit(record.id, false)}
                      className="px-3 py-2 rounded-lg text-sm bg-rose-600 text-white font-semibold"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
              {!filtered.length && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No records to review.</p>}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default WardenFeeVerification;
