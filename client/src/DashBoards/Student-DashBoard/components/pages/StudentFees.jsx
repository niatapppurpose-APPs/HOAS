import { useEffect, useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { storage } from '../../../../firebase/firebaseConfig';
import { getStudentFeeDetails, uploadStudentFeeProof } from '../../../../firebase/cloudFunctions';
import StudentHeader from '../layout/StudentHeader';
import { useToast } from '../../../../components/Toast';

const statusBadgeClass = (status) => {
  if (status === 'fully_paid') return 'bg-green-100 text-green-700 border border-green-200';
  if (status === 'partially_paid') return 'bg-amber-100 text-amber-700 border border-amber-200';
  return 'bg-red-100 text-red-700 border border-red-200';
};

const StudentFees = () => {
  const { isCollapsed, setIsCollapsed } = useOutletContext();
  const { user } = useAuth();
  const toast = useToast();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState('');

  const loadRecord = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const result = await getStudentFeeDetails(user.uid);
      setRecord(result.record || null);
      setPreview(result.record?.proofImage || '');
    } catch (error) {
      toast.error(error.message || 'Unable to load fee details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecord();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const handleProofUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setUploading(true);
    try {
      const path = `fee-proofs/${user.uid}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      const snap = await uploadBytes(storageRef, file, { contentType: file.type });
      const downloadUrl = await getDownloadURL(snap.ref);
      await uploadStudentFeeProof(downloadUrl);
      toast.success('Proof uploaded successfully');
      await loadRecord();
    } catch (error) {
      toast.error(error.message || 'Failed to upload proof');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <StudentHeader
        title="My Fee Status"
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div className="pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="rounded-2xl border p-4 sm:p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
          {loading ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading fee details...</p>
          ) : !record ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No fee record found. Please contact management.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{record.studentName || 'Student'}</h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Student ID: {record.studentId}</p>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="rounded-xl p-3 border" style={{ borderColor: 'var(--border-primary)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Amount</p>
                  <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{record.totalAmount}</p>
                </div>
                <div className="rounded-xl p-3 border" style={{ borderColor: 'var(--border-primary)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Paid Amount</p>
                  <p className="text-xl font-bold text-emerald-600">{record.paidAmount}</p>
                </div>
                <div className="rounded-xl p-3 border" style={{ borderColor: 'var(--border-primary)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Remaining Amount</p>
                  <p className="text-xl font-bold text-rose-600">{record.remainingAmount}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusBadgeClass(record.paymentStatus)}`}>
                  {record.paymentStatus === 'fully_paid' ? 'Fully Paid' : record.paymentStatus === 'partially_paid' ? 'Partially Paid' : 'Pending'}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Management: {record.isVerifiedByManagement ? 'Verified' : 'Pending'}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Warden: {record.isVerifiedByWarden ? 'Verified' : 'Pending'}</span>
              </div>

              <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}>
                <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Upload Payment Proof</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleProofUpload(e.target.files?.[0])}
                  disabled={uploading}
                />
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Only image files, up to 5MB.</p>

                {preview && (
                  <div className="mt-3">
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Current Proof Preview</p>
                    <img src={preview} alt="Payment proof" className="max-h-64 rounded-lg border" style={{ borderColor: 'var(--border-primary)' }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StudentFees;
