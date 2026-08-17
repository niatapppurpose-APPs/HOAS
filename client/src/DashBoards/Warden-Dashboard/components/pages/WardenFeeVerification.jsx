import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../../../../components/Toast';
import WardenHeader from '../layout/WardenHeader';
import { useAuth } from '../../../../context/AuthContext';
import { getWardenFeeRecords } from '../../../../firebase/cloudFunctions';
import { Search, CheckCircle2, Clock, FileText, Image as ImageIcon, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import Avatar from '../../../../components/OwnerServices/Avatar';

const statusMap = {
  'fully_paid': { label: 'Fully Paid', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  'partially_paid': { label: 'Partially Paid', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  'unpaid': { label: 'Unpaid', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
};

const WardenFeeVerification = () => {
  const { isCollapsed, setIsCollapsed } = useOutletContext();
  const toast = useToast();
  const { userData } = useAuth();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');
  const [minPendingFee, setMinPendingFee] = useState(0);
  const [hoveredDoc, setHoveredDoc] = useState(null);

  const fetchRecords = async () => {
    if (!userData?.collegeId) return;
    setLoading(true);
    try {
      const { records } = await getWardenFeeRecords();
      const list = (records || []).map(fee => {
        const isVerified = fee.status === 'verified' || fee.status === 'paid';
        const proof = fee.proofImageUrl || null;
        return {
          id: fee._id,
          studentName: fee.studentName || 'Unnamed',
          studentId: fee.studentId || 'N/A',
          photoURL: fee.studentPhoto || '',
          totalAmount: fee.amount || 0,
          paidAmount: isVerified ? (fee.amount || 0) : 0,
          remainingAmount: isVerified ? 0 : (fee.amount || 0),
          paymentStatus: isVerified ? 'fully_paid' : 'unpaid',
          proofImage: proof,
          proofType: proof && /\.pdf($|\?)/i.test(proof) ? 'pdf' : 'image',
          proofName: fee.month ? `${fee.month} ${fee.year} receipt` : 'Document',
          isVerifiedByWarden: fee.status === 'verified',
        };
      });
      setRecords(list);
    } catch (error) {
      toast.error(error.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.collegeId]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      // Filter by min pending fee
      if (r.remainingAmount < minPendingFee) return false;

      const q = search.trim().toLowerCase();
      if (!q) return true;

      if (searchFilter === 'name') return (r.studentName || '').toLowerCase().includes(q);
      if (searchFilter === 'id') return (r.studentId || '').toLowerCase().includes(q);
      if (searchFilter === 'status') return (r.paymentStatus || '').toLowerCase().includes(q);

      return (
        (r.studentName || '').toLowerCase().includes(q) ||
        (r.studentId || '').toLowerCase().includes(q) ||
        (r.paymentStatus || '').toLowerCase().includes(q)
      );
    });
  }, [records, search, searchFilter, minPendingFee]);

  return (
    <>
      <WardenHeader
        title="Student Fee Reports"
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div className="pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 pb-12 w-full max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="rounded-3xl p-6 md:p-8 border shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6"
             style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent mb-2">Student Fee Details</h2>
            <p className="font-medium" style={{ color: 'var(--text-muted)' }}>Review student fee reports and verify attached proofs.</p>
          </div>
          
          <div className="flex flex-col gap-4 w-full md:w-auto">
            {/* Amazon-style Search Bar */}
            <div className="flex items-center p-1.5 rounded-2xl border-2 border-transparent focus-within:border-orange-500/30 transition-all overflow-hidden"
                 style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <select
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-bold py-2 px-2 cursor-pointer hover:opacity-80 transition-opacity"
                style={{ color: 'var(--text-secondary)' }}
              >
                <option value="all" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>All</option>
                <option value="name" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>Name</option>
                <option value="id" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>ID</option>
                <option value="status" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>Status</option>
              </select>
              <div className="w-[1px] h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
              <Search className="w-5 h-5 opacity-50 ml-2 shrink-0" style={{ color: 'var(--text-primary)' }} />
              <input
                type="text"
                placeholder={`Search by ${searchFilter === 'all' ? 'any' : searchFilter}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 pl-2 pr-4 py-2 bg-transparent border-none outline-none focus:ring-0 text-sm font-medium min-w-[200px]"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>

            {/* Range Slider for Pending Fee */}
            <div className="flex items-center justify-between md:justify-start gap-4 px-4 py-3 rounded-2xl border transition-all"
                 style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Min Pending Fee</span>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>₹{minPendingFee.toLocaleString()}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="200000" 
                step="5000"
                value={minPendingFee} 
                onChange={(e) => setMinPendingFee(Number(e.target.value))}
                className="w-24 sm:w-32 accent-orange-500 cursor-pointer"
                title="Filter by Minimum Pending Fee"
              />
            </div>
          </div>
        </div>

        {/* List Section */}
        <div className="rounded-3xl border shadow-sm overflow-visible min-h-[50vh]"
             style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64" style={{ color: 'var(--text-muted)' }}>
               <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-3" />
               <p className="text-sm font-medium animate-pulse">Scanning records...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64" style={{ color: 'var(--text-muted)' }}>
               <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                 <FileText className="w-8 h-8 opacity-40" />
               </div>
               <p className="text-sm font-bold opacity-80 mb-4">No fee reports matched your criteria.</p>
               {(search.trim() || minPendingFee > 0) && (
                 <button
                    onClick={() => { setSearch(''); setMinPendingFee(0); }}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 transition-colors"
                 >
                    Clear Filters
                 </button>
               )}
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
              {filtered.map((record) => {
                const isPdf = record.proofType === 'pdf';
                const sMap = statusMap[record.paymentStatus] || statusMap['unpaid'];
                
                return (
                  <div key={record.id} className="p-4 sm:p-6 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 relative hover:bg-orange-500/5 hover:bg-opacity-5">
                    
                    {/* Left: Student Identity */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <Avatar name={record.studentName} image={record.photoURL} size="lg"  />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>
                            {record.studentName}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold border shrink-0 ${sMap.bg} ${sMap.color} shadow-sm`}>
                            {sMap.label}
                          </span>
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-widest truncate" style={{ color: 'var(--text-muted)' }}>
                          ID: {record.studentId}
                        </p>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-4 shrink-0 overflow-visible z-10 w-full md:w-auto">
                      
                      {record.proofImage ? (
                        <div 
                           className="relative flex items-center"
                           onMouseEnter={() => setHoveredDoc(record.id)}
                           onMouseLeave={() => setHoveredDoc(null)}
                        >
                          <a href={record.proofImage} target="_blank" rel="noreferrer" className="group flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:py-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white transition-all border border-orange-500/20 duration-300">
                            {isPdf ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                            <span className="text-xs font-bold">Preview Record</span>
                            <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                          </a>

                          {hoveredDoc === record.id && (
                            <div className="absolute top-10 right-0 md:top-1/2 md:-translate-y-1/2 md:-left-[360px] z-[99] w-[300px] sm:w-[350px] border shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-2 pointer-events-none transform origin-top md:origin-right h-auto max-h-[400px]"
                                 style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                              <div className="px-3 py-2 flex items-center justify-between border-b" style={{ borderColor: 'var(--border-primary)' }}>
                                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{isPdf ? 'PDF Render' : 'Image Preview'}</p>
                                <span className="text-[10px] px-2 py-0.5 rounded font-mono truncate max-w-[120px]" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                                  {record.proofName || "Doc"}
                                </span>
                              </div>
                              <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border mt-2 flex items-center justify-center p-1" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}>
                                {isPdf ? (
                                  <iframe src={`${record.proofImage}#toolbar=0`} title="Preview" className="w-full h-full rounded-lg pointer-events-none bg-white" />
                                ) : (
                                  <img src={record.proofImage} className="w-full h-full object-contain rounded-lg" alt="Proof" />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="px-3 py-1.5 sm:py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 border-dashed"
                             style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-muted)' }}>
                          <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" /> <span className="">No Proof</span>
                        </div>
                      )}

                      <div className="w-px h-6 sm:h-8 hidden md:block" style={{ backgroundColor: 'var(--border-primary)' }}></div>

                      <div className="flex items-center">
                        {record.isVerifiedByWarden ? (
                          <div className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5 shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> WV: Verified
                          </div>
                        ) : (
                          <div className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-[10px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5 shadow-sm">
                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> WV: Pending
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default WardenFeeVerification;
