import { useState } from 'react';
import { ClipLoader } from 'react-spinners';
import Header from '../../../components/OwnerServices/header';

const Reports = () => {
  const [reportType, setReportType] = useState('pdf');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    console.log('Generating report:', { reportType, password });
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  return (
    <>
      <Header title="Reports" />
      <div className="p-6 text-white">
        <div className="max-w-md mx-auto bg-gray-800 rounded-lg shadow-md p-8 mt-10">
          <h2 className="text-2xl font-bold mb-6 text-center">Download College Report</h2>
          <form onSubmit={handleSubmit}>
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
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a password to lock the file"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex items-center justify-center">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline disabled:bg-gray-500 flex items-center justify-center"
                disabled={loading}
              >
                {loading ? <ClipLoader color="#ffffff" size={20} /> : 'Download Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Reports;
