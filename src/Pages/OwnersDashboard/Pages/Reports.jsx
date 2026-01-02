import { useState } from 'react';
import { ClipLoader } from 'react-spinners';
import Header from '../../../components/OwnerServices/header';
import { FileText, Download, Lock, Calendar, FileJson, FileType } from 'lucide-react';
// --------------------------------Report Download code -------------------------------

// This function extracts the filename from server response headers
// Example: "attachment; filename=report.pdf" → returns "report.pdf"
function parseFilename(contentDisposition) {
  // If no header is provided, return null
  if (!contentDisposition) return null;
  
  // Look for "filename=" in the header text
  if (contentDisposition.includes('filename=')) {
    // Split the text at "filename=" and get the part after it
    const parts = contentDisposition.split('filename=');
    let filename = parts[1]; // Get everything after "filename="
    
    // Remove quotes if they exist
    filename = filename.replace(/"/g, ''); // Remove all quote marks
    
    // Remove anything after semicolon (;) if it exists
    if (filename.includes(';')) {
      filename = filename.split(';')[0];
    }
    
    // Clean up the filename (remove %20 and other encoded characters)
    filename = decodeURIComponent(filename.trim());
    
    return filename;
  }
  
  // If we didn't find "filename=", return null
  return null;
}

// This function triggers a file download in the browser
// It creates a temporary link, clicks it automatically, then cleans up
function saveBlob(blob, filename) {
  // Step 1: Create a temporary URL that points to the file data in memory
  const temporaryUrl = URL.createObjectURL(blob);
  
  // Step 2: Create an invisible download link
  const downloadLink = document.createElement('a');
  downloadLink.href = temporaryUrl;          // Point to our file
  downloadLink.download = filename;           // Set the download filename
  
  // Step 3: Add link to page (required for Firefox)
  document.body.appendChild(downloadLink);
  
  // Step 4: Automatically click the link to start download
  downloadLink.click();
  
  // Step 5: Clean up - remove the link from page
  downloadLink.remove();
  
  // Step 6: Free up memory by removing the temporary URL
  URL.revokeObjectURL(temporaryUrl);
}

async function downloadReport(type, password) {
  // Step 1: Build the API URL with the report type (pdf or json)
  const apiUrl = `http://localhost:5000/download/${type}`;
  
  // Step 2: Send request to server with the password
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }), // Send password to server
  });

  // Step 3: Check if the request was successful
  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(errorMessage || `Server error: ${response.status}`);
  }

  // Step 4: Handle the response based on report type
  if (type === 'pdf') {
    // For PDF: Download the file directly
    const pdfBlob = await response.blob(); // Get the PDF file data
    
    // Get the filename from server response headers
    const contentDisposition = response.headers.get('content-disposition') || '';
    const filename = parseFilename(contentDisposition) || 'report.pdf';
    
    // Trigger download in browser
    saveBlob(pdfBlob, filename);
  } else {
    // For JSON: Get data, format it nicely, then download
    const jsonData = await response.json(); // Get the JSON data
    
    // Convert JSON to a formatted string with 2-space indentation
    const formattedJson = JSON.stringify(jsonData, null, 2);
    
    // Create a blob (file) from the formatted JSON
    const jsonBlob = new Blob([formattedJson], { type: 'application/json' });
    
    // Trigger download in browser
    saveBlob(jsonBlob, 'report.json');
  }
}
// -------------------------------------------------------------------------------------------------------------------------
export default function Reports() {
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadingFormat, setDownloadingFormat] = useState(null);

  // TODO: Replace with actual college data from props/context
  const collegeInfo = {
    name: "NIAT Engineering College",
    location: "Bangalore, Karnataka",
    id: "CLG-2024-001"
  };

  // TODO: Replace with actual reports data from backend
  const reportsData = [
    {
      id: 1,
      name: "Student Access Report",
      description: "Complete student enrollment and access logs",
      generatedDate: new Date(2026, 0, 1, 14, 30),
      type: "both", // pdf, json, or both
      isPasswordProtected: true,
    },
    {
      id: 2,
      name: "Admin Activity Report",
      description: "Administrative actions and system changes",
      generatedDate: new Date(2026, 0, 1, 10, 15),
      type: "both",
      isPasswordProtected: false,
    },
    {
      id: 3,
      name: "Hostel Occupancy Report",
      description: "Room allocation and occupancy statistics",
      generatedDate: new Date(2025, 11, 31, 16, 45),
      type: "both",
      isPasswordProtected: true,
    },
    {
      id: 4,
      name: "Financial Summary",
      description: "Fee collection and payment records",
      generatedDate: new Date(2025, 11, 30, 9, 0),
      type: "both",
      isPasswordProtected: true,
    },
  ];

  const handleDownload = async (reportId, format) => {
    setDownloadingId(reportId);
    setDownloadingFormat(format);
    try {
      // TODO: Implement actual download logic
      await downloadReport(format, ''); // You can add password prompt if needed
      console.log(`Downloading report ${reportId} as ${format}`);
    } catch (err) {
      console.error('Download failed', err);
      alert('Failed to download report: ' + (err.message || err));
    } finally {
      setDownloadingId(null);
      setDownloadingFormat(null);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <>
      <Header title="Reports Board" />
      
      {/* Main Container */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Header with College Context */}
        <section className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Reports Board</h2>
              <p className="text-slate-400 mt-1">Download reports for the selected college</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400">Total Reports:</span>
              <span className="text-white font-semibold">{reportsData.length}</span>
            </div>
          </div>

          {/* College Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 border border-indigo-500/30">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-white font-semibold">College:</span>
            <span className="text-white">{collegeInfo.name}</span>
          </div>
        </section>

        {/* Reports List */}
        <section className="space-y-3">
          {reportsData.map((report) => (
            <div
              key={report.id}
              className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600/50 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* Left: Report Info */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex-shrink-0">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <h3 className="text-white font-semibold text-lg">
                        {report.name}
                      </h3>
                      {report.isPasswordProtected && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30">
                          <Lock className="w-3 h-3 text-amber-400" />
                          <span className="text-amber-400 text-xs font-medium">Protected</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-slate-400 text-sm mb-2">
                      {report.description}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      {/* College Badge */}
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-medium">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {collegeInfo.name}
                      </span>
                      
                      {/* Date & Time */}
                      <div className="flex items-center gap-2 text-slate-500 text-xs">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(report.generatedDate)}</span>
                        <span>•</span>
                        <span>{formatTime(report.generatedDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Download PDF */}
                  {(report.type === 'pdf' || report.type === 'both') && (
                    <button
                      onClick={() => handleDownload(report.id, 'pdf')}
                      disabled={downloadingId === report.id}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium text-sm transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 disabled:from-slate-700 disabled:to-slate-700 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                      {downloadingId === report.id && downloadingFormat === 'pdf' ? (
                        <ClipLoader color="#ffffff" size={16} />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>PDF</span>
                    </button>
                  )}

                  {/* Download JSON */}
                  {(report.type === 'json' || report.type === 'both') && (
                    <button
                      onClick={() => handleDownload(report.id, 'json')}
                      disabled={downloadingId === report.id}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-medium text-sm transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 disabled:from-slate-700 disabled:to-slate-700 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                      {downloadingId === report.id && downloadingFormat === 'json' ? (
                        <ClipLoader color="#ffffff" size={16} />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>JSON</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Empty State (if no reports) */}
        {reportsData.length === 0 && (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-12 text-center">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Reports Available</h3>
            <p className="text-slate-400 max-w-md mx-auto">
              Reports for {collegeInfo.name} will appear here once generated.
            </p>
          </div>
        )}
      </div>
    </>
  );
}