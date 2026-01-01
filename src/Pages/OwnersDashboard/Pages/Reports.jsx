import { useState } from 'react';
import { ClipLoader } from 'react-spinners';
import Header from '../../../components/OwnerServices/header';
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
  const [reportType, setReportType] = useState('pdf');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await downloadReport(reportType, password);
    } catch (err) {
      console.error('Download failed', err);
      alert('Failed to download report: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Reports" />
      <div className="p-6 text-white">
        <div className="max-w-md mx-auto bg-gray-800 rounded-lg shadow-md p-8 mt-10">
          <h2 className="text-2xl font-bold mb-6 text-center">Download College Report</h2>
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-bold mb-2">Report Format</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="reportType"
                    value="pdf"
                    checked={reportType === 'pdf'}
                    onChange={() => setReportType('pdf')}
                    className="form-radio h-5 w-5 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-300">PDF</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="reportType"
                    autoComplete='none'
                    value="json"
                    checked={reportType === 'json'}
                    onChange={() => setReportType('json')}
                    className="form-radio h-5 w-5 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-300">JSON</span>
                </label>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="password">
                Report Password
              </label>
              {/* Hidden dummy fields to discourage browser autofill/save-password prompts */}
              <input type="text" name="__fake_username" autoComplete="username" style={{ display: 'none' }} />
              <input type="password" name="__fake_password" autoComplete="new-password" style={{ display: 'none' }} />

              <input
                id="password"
                name="report_pw"
                type="password"
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a password to lock the file"
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-center">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center disabled:bg-gray-500"
              >
                {loading ? <ClipLoader color="#ffffff" size={20} /> : 'Download Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}