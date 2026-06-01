import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import ManagementHeader from "../components/layout/ManagementHeader";
import {  FileText, Search, Filter, Download, FileSpreadsheet, CheckCircle2, AlertTriangle, Clock, Loader2, ExternalLink } from "lucide-react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../firebase/firebaseConfig";
import { useAuth } from "../../../context/AuthContext";
import "../ManagementDashboard.css";

const Reports = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilter, setSearchFilter] = useState("all");
  const { isCollapsed, setIsCollapsed } = useOutletContext();
  const { userData, user } = useAuth();

  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper: Extract storage path from a Firebase download URL
  const getStoragePathFromUrl = (url) => {
    try {
      if (!url) return null;
      // URL format: https://firebasestorage.googleapis.com/v0/b/[bucket]/o/[path]?alt=media&token=...
      const baseUrl = "https://firebasestorage.googleapis.com/v0/b/";
      if (!url.startsWith(baseUrl)) return null;

      const pathStartIndex = url.indexOf("/o/") + 3;
      const pathEndIndex = url.indexOf("?");
      let encodedPath = url.substring(pathStartIndex, pathEndIndex !== -1 ? pathEndIndex : undefined);
      return decodeURIComponent(encodedPath);
    } catch (e) {
      console.error("Error parsing URL:", e);
      return null;
    }
  };

  // Fetch bulk upload history
  useEffect(() => {
    if (!user?.uid) return;

    // Filter by the uploader's UID — most reliable tenant isolation
    console.log("Fetching uploads for management:", user.uid);

    try {
      const q = query(
        collection(db, "bulkUploads"),
        where("uploadedBy", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        console.log("Snapshot received, docs count:", snapshot.docs.length);

        // Process uploads and generate fresh download URLs if needed
        const uploadsData = await Promise.all(snapshot.docs.map(async (doc) => {
          const data = doc.data();
          let validDownloadUrl = data.downloadUrl;

          // Attempt to refresh the download URL using the client SDK
          // This fixes the "412 Service Account" error by using the current user's token
          if (data.downloadUrl) {
            const storagePath = getStoragePathFromUrl(data.downloadUrl);
            if (storagePath) {
              try {
                const storageRef = ref(storage, storagePath);
                validDownloadUrl = await getDownloadURL(storageRef);
              } catch (err) {
                console.warn(`Failed to refresh URL for ${storagePath}:`, err);
                // Fallback to original if refresh fails
              }
            }
          }

          return {
            id: doc.id,
            ...data,
            downloadUrl: validDownloadUrl
          };
        }));

        console.log("Uploads data processed");
        setUploads(uploadsData);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching bulk uploads:", error);
        // Fallback: try without ordering to see if it's an index issue
        if (error.code === 'failed-precondition') {
          console.log("Index missing, retrying without sort...");
          const simpleQ = query(
            collection(db, "bulkUploads"),
            where("uploadedBy", "==", user.uid)
          );
          onSnapshot(simpleQ, async (snap) => {
            const dataPromises = snap.docs.map(async d => {
              const data = d.data();
              let validUrl = data.downloadUrl;
              if (data.downloadUrl) {
                const storagePath = getStoragePathFromUrl(data.downloadUrl);
                if (storagePath) {
                  try {
                    const sRef = ref(storage, storagePath);
                    validUrl = await getDownloadURL(sRef);
                  } catch (e) { }
                }
              }
              return { id: d.id, ...data, downloadUrl: validUrl };
            });
            const data = await Promise.all(dataPromises);
            data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setUploads(data);
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      });
      return () => unsubscribe();
    } catch (err) {
      console.error("Setup error:", err);
      setLoading(false);
    }
  }, [user?.uid]);

  const filteredUploads = uploads.filter(upload => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    if (searchFilter === "email") return upload.uploadedByEmail?.toLowerCase().includes(term);
    if (searchFilter === "date") return new Date(upload.createdAt).toLocaleDateString().includes(term);

    // all
    return (
      upload.uploadedByEmail?.toLowerCase().includes(term) ||
      new Date(upload.createdAt).toLocaleDateString().includes(term)
    );
  });

  return (
    <>
      <ManagementHeader
        title="Reports"
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div className="pt-20 sm:pt-24 px-3 sm:px-4 lg:px-8 py-4 sm:pb-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FileText className="w-8 h-8 text-indigo-500" />
              Reports & History
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              View system reports and track bulk upload activities
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors">
            <Download size={18} />
            Generate New Report
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 max-w-md flex items-center p-1.5 rounded-xl border transition-all focus-within:ring-2 focus-within:ring-indigo-500/50" 
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <select
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-gray-100 dark:bg-white/5 border-none outline-none text-xs font-bold py-2.5 px-3 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <option value="all" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>All</option>
              <option value="email" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>Email</option>
              <option value="date" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>Date</option>
            </select>
            <div className="w-[1px] h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>
            <Search size={18} className="text-gray-400 flex-shrink-0 ml-1" />
            <input
              type="text"
              placeholder={`Search by ${searchFilter === 'all' ? 'any' : searchFilter}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none outline-none px-2 py-1"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
            <Filter size={18} />
            Filter
          </button>
        </div>

        {/* Bulk Uploads History Table */}
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="font-semibold text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              Bulk Upload History
            </h3>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
              {filteredUploads.length} Records
            </span>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading history...</p>
              </div>
            ) : filteredUploads.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }} />
                <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>No uploads found</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  Upload student data to see history here
                </p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                    <th className="px-6 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Date & Time</th>
                    <th className="px-6 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Uploaded By</th>
                    <th className="px-6 py-3 font-medium text-center" style={{ color: 'var(--text-secondary)' }}>Total</th>
                    <th className="px-6 py-3 font-medium text-center" style={{ color: 'var(--text-secondary)' }}>Status</th>
                    <th className="px-6 py-3 font-medium text-right" style={{ color: 'var(--text-secondary)' }}>Original File</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                  {filteredUploads.map((upload) => (
                    <tr key={upload.id} className="group hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                          <span style={{ color: 'var(--text-primary)' }}>
                            {new Date(upload.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {new Date(upload.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            {upload.uploadedByEmail?.split('@')[0]}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {upload.uploadedByEmail}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {upload.totalStudents}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <div className="flex flex-col items-center" title="Successful">
                            <span className="text-xs text-emerald-600 font-bold">{upload.createdCount}</span>
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          </div>
                          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
                          <div className="flex flex-col items-center" title="Failed">
                            <span className="text-xs text-red-600 font-bold">{upload.failedCount}</span>
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {upload.downloadUrl ? (
                          <a
                            href={upload.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                            style={{
                              backgroundColor: 'green',
                              color: '#ffffffff',
                            }}
                          >
                            <FileSpreadsheet className="w-3 h-3" />
                               Excel
                            <ExternalLink className="w-3 h-3 opacity-50" />
                          </a>
                        ) : (
                          <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                            Not available
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Reports;
