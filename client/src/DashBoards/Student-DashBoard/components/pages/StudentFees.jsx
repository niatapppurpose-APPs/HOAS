import { useEffect, useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { db, storage } from '../../../../firebase/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import StudentHeader from '../layout/StudentHeader';
import { useToast } from '../../../../components/Toast';
import { Wallet, IndianRupee, Clock, AlertCircle, UploadCloud, FileText, CheckCircle2, ShieldCheck, UserCheck, Loader2 } from 'lucide-react';

const StudentFees = () => {
  const { isCollapsed, setIsCollapsed } = useOutletContext();
  const { user } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [feeReports, setFeeReports] = useState([]);

  const loadRecord = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const udata = userDoc.data();
        let paymentStatus = 'unpaid';
        if (udata.feeDetails?.totalFee > 0 && udata.feeDetails?.pendingFee === 0) paymentStatus = 'fully_paid';
        else if (udata.feeDetails?.paidFee > 0) paymentStatus = 'partially_paid';

        let reports = udata.feeReports || [];
        if (udata.feeProofImage && reports.length === 0) {
          // Backward compatibility for single proof
          reports = [{
            url: udata.feeProofImage,
            type: udata.feeProofType || 'image',
            name: udata.feeProofName || 'Payment_Proof',
            uploadedAt: new Date().toISOString()
          }];
        }

        setRecord({
           studentName: udata.fullName,
           studentId: udata.studentId,
           totalAmount: udata.feeDetails?.totalFee || 0,
           paidAmount: udata.feeDetails?.paidFee || 0,
           remainingAmount: udata.feeDetails?.pendingFee || 0,
           paymentStatus,
           isVerifiedByManagement: udata.managementVerification === 'Verify',
           isVerifiedByWarden: udata.wardenVerification === 'Verify',
        });
        setFeeReports(reports);
      }
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
    const isImage = file.type.startsWith('image/');
    const isPDF = file.type === 'application/pdf';
    
    if (!isImage && !isPDF) {
      toast.error('Please upload an image or a PDF file');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (feeReports.length >= 12) {
      toast.error('You can only upload up to 12 fee reports.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    try {
      const path = `fee-proofs/${user.uid}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      const snap = await uploadBytes(storageRef, file, { contentType: file.type });
      const downloadUrl = await getDownloadURL(snap.ref);
      
      const fileTypeLabel = isPDF ? 'pdf' : 'image';
      
      const newReport = {
        url: downloadUrl,
        type: fileTypeLabel,
        name: file.name,
        uploadedAt: new Date().toISOString()
      };

      const updatedReports = [...feeReports, newReport];
      
      await updateDoc(doc(db, 'users', user.uid), { 
        feeReports: updatedReports,
        // Keep the latest proof updated for backward compatibility with management dashboards
        feeProofImage: downloadUrl,
        feeProofType: fileTypeLabel,
        feeProofName: file.name
      });
      toast.success('Proof uploaded successfully');
      await loadRecord();
    } catch (error) {
      toast.error(error.message || 'Failed to upload proof');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const statusMap = {
    'fully_paid': { label: 'Fully Paid', color: 'text-emerald-600', icon: CheckCircle2 },
    'partially_paid': { label: 'Partially Paid', color: 'text-amber-600', icon: Clock },
    'unpaid': { label: 'Unpaid', color: 'text-rose-600', icon: AlertCircle },
  };

  return (
    <>
      <StudentHeader
        title="Fee Overview"
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div className="pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 pb-12 w-full max-w-6xl mx-auto">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 rounded-3xl border shadow-sm animate-pulse min-h-[50vh]"
               style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
            <p className="font-medium" style={{ color: 'var(--text-muted)' }}>Retrieving your fee data...</p>
          </div>
        ) : !record ? (
          <div className="p-12 text-center rounded-3xl border shadow-sm flex flex-col items-center"
               style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <Wallet className="w-10 h-10 opacity-30" style={{ color: 'var(--text-primary)' }} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No Fee Record Found</h3>
            <p className="max-w-md" style={{ color: 'var(--text-muted)' }}>We couldn't locate any fee structures assigned to your account. Please check back later or contact your hostel management.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 xl:gap-8">
            
            {/* Left Column: Stats & Breakdown */}
            <div className="space-y-6">
              {/* Main Identity Card */}
              <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden border border-indigo-500/50">
                <div className="absolute top-0 right-0 p-8 opacity-10 blur-2xl pointer-events-none">
                  <Wallet className="w-64 h-64" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold mb-1 drop-shadow-md">{record.studentName || 'Student'}</h2>
                      <p className="text-indigo-100/80 font-medium tracking-wide">ID: {record.studentId || 'N/A'}</p>
                    </div>
                    <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 font-semibold shadow-sm`}>
                      {(() => {
                        const sMap = statusMap[record.paymentStatus] || statusMap['unpaid'];
                        const SIcon = sMap.icon;
                        return (
                          <>
                            <SIcon className="w-5 h-5 flex-shrink-0" />
                            <span>{sMap.label}</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-colors">
                      <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1">Total Fee Amount</p>
                      <p className="text-2xl sm:text-3xl font-black flex items-center gap-1 font-mono">
                        <IndianRupee className="w-5 h-5 sm:w-6 sm:h-6 opacity-70" /> {record.totalAmount}
                      </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-colors">
                      <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1">Remaining Due</p>
                      <p className="text-2xl sm:text-3xl font-black flex items-center gap-1 text-rose-200 font-mono">
                        <IndianRupee className="w-5 h-5 sm:w-6 sm:h-6 opacity-70" /> {record.remainingAmount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Verification Checks */}
              <div className="rounded-3xl p-6 sm:p-8 border shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Verification Stage</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Management */}
                  <div className={`rounded-2xl p-4 border flex items-start gap-4 transition-all ${record.isVerifiedByManagement ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-transparent border-dashed'}`}
                       style={!record.isVerifiedByManagement ? { borderColor: 'var(--border-disabled)' } : {}}>
                    <div className={`p-3 rounded-xl flex-shrink-0 ${record.isVerifiedByManagement ? 'bg-emerald-500/20 text-emerald-500' : 'opacity-40'}`}
                         style={!record.isVerifiedByManagement ? { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' } : {}}>
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Management</p>
                      <p className={`text-sm mt-0.5 font-medium ${record.isVerifiedByManagement ? 'text-emerald-500' : 'opacity-60'}`}
                         style={!record.isVerifiedByManagement ? { color: 'var(--text-muted)' } : {}}>
                        {record.isVerifiedByManagement ? 'Cleared & Approved' : 'Pending Review'}
                      </p>
                    </div>
                  </div>
                  {/* Warden */}
                  <div className={`rounded-2xl p-4 border flex items-start gap-4 transition-all ${record.isVerifiedByWarden ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-transparent border-dashed'}`}
                       style={!record.isVerifiedByWarden ? { borderColor: 'var(--border-disabled)' } : {}}>
                    <div className={`p-3 rounded-xl flex-shrink-0 ${record.isVerifiedByWarden ? 'bg-emerald-500/20 text-emerald-500' : 'opacity-40'}`}
                         style={!record.isVerifiedByWarden ? { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' } : {}}>
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Hostel Warden</p>
                      <p className={`text-sm mt-0.5 font-medium ${record.isVerifiedByWarden ? 'text-emerald-500' : 'opacity-60'}`}
                         style={!record.isVerifiedByWarden ? { color: 'var(--text-muted)' } : {}}>
                        {record.isVerifiedByWarden ? 'Clearance Granted' : 'Pending Verification'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Upload Tool & Preview */}
            <div className="rounded-3xl border shadow-sm flex flex-col overflow-hidden relative"
                 style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
              <div className="p-6 sm:p-8 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Payment Documentation</h3>
                <p className="text-sm mb-6 block" style={{ color: 'var(--text-muted)' }}>
                  Securely upload your payment receipt. Both Wardens and Management use this reference to clear your account.
                </p>

                <div 
                  className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all ${uploading ? 'opacity-50 pointer-events-none' : 'hover:border-indigo-500/50 hover:bg-indigo-500/5'}`}
                  style={{ borderColor: 'var(--border-disabled)', backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleProofUpload(e.target.files?.[0])}
                    disabled={uploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    title="Click to Choose Document"
                  />
                  {uploading ? (
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                  ) : (
                    <>
                      <div className="w-14 h-14 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center mb-4 border border-indigo-500/20">
                        <UploadCloud className="w-7 h-7" />
                      </div>
                      <p className="font-bold text-center" style={{ color: 'var(--text-primary)' }}>Click to upload or drag & drop</p>
                      <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>Images or PDF (max. 5MB)</p>
                    </>
                  )}
                </div>
              </div>

              {/* Seamless Preview Area */}
              <div className="flex-1 p-6 sm:p-8 relative" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                 <div className="flex justify-between items-center mb-4">
                   <h4 className="text-xs font-bold tracking-wider uppercase opacity-50" style={{ color: 'var(--text-primary)' }}>Saved Documents</h4>
                   <span className="text-xs font-bold px-2 py-1 bg-indigo-500/10 text-indigo-500 rounded-md">{feeReports.length}/12</span>
                 </div>
                 {feeReports.length > 0 ? (
                   <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                     {feeReports.map((report, index) => (
                       <div key={index} className="relative group min-w-full shrink-0 snap-center border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                         {report.type === 'pdf' ? (
                           <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4">
                             <div className="flex items-center gap-4 min-w-0">
                               <div className="p-3 bg-red-500/10 text-red-500 rounded-xl shrink-0">
                                 <FileText className="w-7 h-7 sm:w-8 sm:h-8" />
                               </div>
                               <div className="min-w-0">
                                 <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{report.name || 'payment_receipt.pdf'}</p>
                                 <p className="text-[10px] sm:text-xs mt-1 uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>
                                   {report.uploadedAt ? new Date(report.uploadedAt).toLocaleDateString() : 'PDF Document'}
                                 </p>
                               </div>
                             </div>
                             <a href={report.url} target="_blank" rel="noreferrer" className="text-indigo-500 font-bold text-xs sm:text-sm bg-indigo-500/10 px-4 py-2 sm:py-2.5 rounded-lg hover:bg-indigo-500/20 transition-colors z-20 shrink-0 text-center flex-1 sm:flex-none">
                               View Full File
                             </a>
                           </div>
                         ) : (
                           <a href={report.url} target="_blank" rel="noreferrer" className="block relative aspect-video sm:aspect-square md:aspect-auto lg:aspect-[4/3] w-full overflow-hidden cursor-zoom-in"
                              style={{ backgroundColor: 'var(--bg-primary)' }}>
                             <img src={report.url} alt={`Payment proof ${index + 1}`} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 p-2" />
                             <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                             <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded border border-white/10">
                               <span className="text-white text-[10px] font-bold">
                                 {report.uploadedAt ? new Date(report.uploadedAt).toLocaleDateString() : `Image ${index + 1}`}
                               </span>
                             </div>
                           </a>
                         )}
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="h-full min-h-[150px] w-full border-2 border-dashed rounded-2xl flex items-center justify-center text-sm font-medium opacity-50"
                        style={{ borderColor: 'var(--border-disabled)', color: 'var(--text-primary)', backgroundColor: 'transparent' }}>
                      No document attached yet
                   </div>
                 )}
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  );
};

export default StudentFees;
