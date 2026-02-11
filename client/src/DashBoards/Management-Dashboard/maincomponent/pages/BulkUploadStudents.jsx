import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../../firebase/firebaseConfig';
import { bulkCreateStudents } from '../../../../firebase/cloudFunctions';
import { useAuth } from '../../../../context/AuthContext';
import { useTheme } from '../../../../context/ThemeContext';
import { useToast } from '../../../../components/Toast';
import {
    Upload, FileSpreadsheet, X, CheckCircle2, AlertTriangle,
    Clock, Users, Loader2, Download, Eye, ChevronDown, ChevronUp
} from 'lucide-react';

/**
 * BulkUploadStudents - Modal component for uploading Excel sheet of students
 * Flow: Upload Excel → Preview data → Confirm → Create accounts → Show results
 */
const BulkUploadStudents = ({ isOpen, onClose, collegeName }) => {
    const { userData, user } = useAuth();
    const { isDark } = useTheme();
    const toast = useToast();
    const fileInputRef = useRef(null);

    // States
    const [step, setStep] = useState('upload'); // upload, preview, uploading, done
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [dragActive, setDragActive] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [estimatedTime, setEstimatedTime] = useState(0);
    const [results, setResults] = useState(null);
    const [showErrors, setShowErrors] = useState(false);
    const timerRef = useRef(null);

    const college = collegeName || userData?.collegeName || 'Unknown College';

    // Parse Excel file
    const parseExcel = (fileData) => {
        try {
            const workbook = XLSX.read(fileData, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // Skip header row and empty rows
            const headers = jsonData[0];
            const students = [];

            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row || row.length === 0 || !row[1]) continue; // Skip empty rows

                // Map columns: S.No, Name, (empty), StudentId, (empty), G-Mail
                students.push({
                    sno: row[0] || i,
                    name: String(row[1] || '').trim(),
                    studentId: String(row[3] || '').trim(),
                    email: String(row[5] || '').trim(),
                });
            }

            return students.filter(s => s.name && s.email);
        } catch (err) {
            console.error('Error parsing Excel:', err);
            toast.error('Failed to parse Excel file. Please check the format.');
            return [];
        }
    };

    // Handle file drop
    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
            processFile(droppedFile);
        } else {
            toast.warning('Please upload an Excel file (.xlsx or .xls)');
        }
    }, []);

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            processFile(selectedFile);
        }
    };

    const processFile = (selectedFile) => {
        setFile(selectedFile);
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const students = parseExcel(data);
            if (students.length > 0) {
                setParsedData(students);
                setStep('preview');
                toast.success(`Found ${students.length} students in the file!`);
            } else {
                toast.error('No valid student data found in the file.');
                setFile(null);
            }
        };
        reader.readAsArrayBuffer(selectedFile);
    };

    // Start timer
    const startTimer = (totalStudents) => {
        const estimated = Math.ceil(totalStudents * 1.2); // ~1.2 seconds per student
        setEstimatedTime(estimated);
        setElapsedTime(0);

        timerRef.current = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    // Upload and create students
    const handleUpload = async () => {
        setStep('uploading');
        startTimer(parsedData.length);

        try {
            // Step 1: Upload Excel to Firebase Storage for download link
            let downloadUrl = '';
            try {
                const storageRef = ref(storage, `bulk-uploads/${college}/${Date.now()}_${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                downloadUrl = await getDownloadURL(snapshot.ref);
            } catch (storageErr) {
                console.warn('Could not upload to storage:', storageErr);
                // Continue without download URL
            }

            // Step 2: Call cloud function to create all students
            const result = await bulkCreateStudents({
                students: parsedData,
                collegeName: college,
                managementId: userData?.uid || user?.uid,
                downloadUrl
            });

            stopTimer();
            setResults(result.results);
            setStep('done');

            if (result.results.created > 0) {
                toast.success(`🎉 ${result.results.created} students created successfully!`);
            }
            if (result.results.failed > 0) {
                toast.warning(`${result.results.failed} students failed to create.`);
            }

        } catch (err) {
            stopTimer();
            console.error('Bulk upload error:', err);
            toast.error(`Upload failed: ${err.message}`);
            setStep('preview'); // Go back to preview to retry
        }
    };

    // Reset everything
    const handleReset = () => {
        setStep('upload');
        setFile(null);
        setParsedData([]);
        setUploadProgress(0);
        setElapsedTime(0);
        setEstimatedTime(0);
        setResults(null);
        setShowErrors(false);
        stopTimer();
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Close modal
    const handleClose = () => {
        handleReset();
        onClose();
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    if (!isOpen) return null;

    // Colors based on theme
    const bg = isDark ? '#111827' : '#ffffff';
    const bgSecondary = isDark ? '#1f2937' : '#f8fafc';
    const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
    const textSecondary = isDark ? '#94a3b8' : '#64748b';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => e.target === e.currentTarget && step !== 'uploading' && handleClose()}
        >
            <div
                className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
                style={{ backgroundColor: bg, border: `1px solid ${border}`, maxHeight: '90vh' }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 py-4"
                    style={{ borderBottom: `1px solid ${border}` }}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                            <FileSpreadsheet className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold" style={{ color: textPrimary }}>
                                Bulk Upload Students
                            </h2>
                            <p className="text-xs" style={{ color: textSecondary }}>{college}</p>
                        </div>
                    </div>
                    {step !== 'uploading' && (
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-lg transition-colors hover:bg-red-500/10"
                            style={{ color: textSecondary }}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="px-6 py-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>

                    {/* STEP 1: UPLOAD */}
                    {step === 'upload' && (
                        <div className="space-y-4">
                            {/* Drop Zone */}
                            <div
                                className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${dragActive ? 'scale-[1.02]' : ''}`}
                                style={{
                                    borderColor: dragActive ? '#4f46e5' : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'),
                                    backgroundColor: dragActive
                                        ? (isDark ? 'rgba(79,70,229,0.1)' : 'rgba(99,102,241,0.05)')
                                        : bgSecondary
                                }}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <Upload
                                    className="w-12 h-12 mx-auto mb-4"
                                    style={{ color: dragActive ? '#4f46e5' : textSecondary }}
                                />
                                <p className="text-base font-semibold mb-1" style={{ color: textPrimary }}>
                                    {dragActive ? 'Drop your file here!' : 'Drag & drop your Excel file'}
                                </p>
                                <p className="text-sm" style={{ color: textSecondary }}>
                                    or click to browse • Supports .xlsx and .xls
                                </p>
                            </div>

                            {/* Format Guide */}
                            <div
                                className="rounded-xl p-4"
                                style={{ backgroundColor: isDark ? 'rgba(79,70,229,0.1)' : 'rgba(99,102,241,0.05)', border: `1px solid ${isDark ? 'rgba(79,70,229,0.2)' : 'rgba(99,102,241,0.15)'}` }}
                            >
                                <p className="text-sm font-semibold mb-2" style={{ color: '#6366f1' }}>
                                    📋 Expected Excel Format
                                </p>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs" style={{ color: textSecondary }}>
                                        <thead>
                                            <tr style={{ borderBottom: `1px solid ${border}` }}>
                                                <th className="py-2 px-3 text-left">S.No</th>
                                                <th className="py-2 px-3 text-left">Name</th>
                                                <th className="py-2 px-3 text-left">StudentId</th>
                                                <th className="py-2 px-3 text-left">G-Mail</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="py-1.5 px-3">1</td>
                                                <td className="py-1.5 px-3">Shaik Ayaan</td>
                                                <td className="py-1.5 px-3">STU001</td>
                                                <td className="py-1.5 px-3">ayaan@niat.com</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <p className="text-xs mt-2" style={{ color: textSecondary }}>
                                    � A random password will be auto-generated for each student
                                </p>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: PREVIEW */}
                    {step === 'preview' && (
                        <div className="space-y-4">
                            {/* File Info */}
                            <div
                                className="flex items-center gap-3 rounded-xl p-3"
                                style={{ backgroundColor: bgSecondary, border: `1px solid ${border}` }}
                            >
                                <FileSpreadsheet className="w-8 h-8" style={{ color: '#16a34a' }} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate" style={{ color: textPrimary }}>{file?.name}</p>
                                    <p className="text-xs" style={{ color: textSecondary }}>
                                        {parsedData.length} students found • {(file?.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                                    style={{ borderColor: border, color: textSecondary }}
                                >
                                    Change File
                                </button>
                            </div>

                            {/* Preview Table */}
                            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${border}` }}>
                                <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: bgSecondary }}>
                                    <Eye className="w-4 h-4" style={{ color: '#6366f1' }} />
                                    <span className="text-sm font-semibold" style={{ color: textPrimary }}>Preview</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                                        {parsedData.length} rows
                                    </span>
                                </div>
                                <div className="overflow-x-auto" style={{ maxHeight: '300px' }}>
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr style={{ backgroundColor: bgSecondary, borderBottom: `1px solid ${border}` }}>
                                                <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: textSecondary }}>#</th>
                                                <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: textSecondary }}>Name</th>
                                                <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: textSecondary }}>Student ID</th>
                                                <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: textSecondary }}>Email</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parsedData.map((student, idx) => (
                                                <tr
                                                    key={idx}
                                                    style={{ borderBottom: `1px solid ${border}` }}
                                                    className="transition-colors"
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <td className="px-4 py-2.5" style={{ color: textSecondary }}>{student.sno}</td>
                                                    <td className="px-4 py-2.5 font-medium" style={{ color: textPrimary }}>{student.name}</td>
                                                    <td className="px-4 py-2.5">
                                                        <span className="px-2 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                                                            {student.studentId}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5" style={{ color: textSecondary }}>{student.email}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Estimated Time */}
                            <div
                                className="flex items-center gap-3 rounded-xl p-3"
                                style={{ backgroundColor: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.05)', border: `1px solid ${isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.15)'}` }}
                            >
                                <Clock className="w-5 h-5" style={{ color: '#f59e0b' }} />
                                <div>
                                    <p className="text-sm font-medium" style={{ color: isDark ? '#fbbf24' : '#d97706' }}>
                                        Estimated time: ~{formatTime(Math.ceil(parsedData.length * 1.2))}
                                    </p>
                                    <p className="text-xs" style={{ color: textSecondary }}>
                                        Creating {parsedData.length} student accounts in Firebase
                                    </p>
                                </div>
                            </div>

                            {/* Upload Button */}
                            <button
                                onClick={handleUpload}
                                className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
                                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 4px 15px rgba(79,70,229,0.4)' }}
                            >
                                <Upload className="w-5 h-5" />
                                Upload & Create {parsedData.length} Students
                            </button>
                        </div>
                    )}

                    {/* STEP 3: UPLOADING (Progress) */}
                    {step === 'uploading' && (
                        <div className="text-center space-y-6 py-6">
                            {/* Spinner */}
                            <div className="relative w-24 h-24 mx-auto">
                                <div
                                    className="absolute inset-0 rounded-full animate-spin"
                                    style={{
                                        border: '4px solid transparent',
                                        borderTopColor: '#4f46e5',
                                        borderRightColor: '#7c3aed'
                                    }}
                                />
                                <div className="absolute inset-2 rounded-full flex items-center justify-center" style={{ backgroundColor: bgSecondary }}>
                                    <Users className="w-8 h-8" style={{ color: '#6366f1' }} />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold mb-1" style={{ color: textPrimary }}>
                                    Creating Student Accounts...
                                </h3>
                                <p className="text-sm" style={{ color: textSecondary }}>
                                    Processing {parsedData.length} students for {college}
                                </p>
                            </div>

                            {/* Timer */}
                            <div
                                className="inline-flex items-center gap-3 px-5 py-3 rounded-xl"
                                style={{ backgroundColor: bgSecondary, border: `1px solid ${border}` }}
                            >
                                <Clock className="w-5 h-5 animate-pulse" style={{ color: '#f59e0b' }} />
                                <div className="text-left">
                                    <p className="text-xs" style={{ color: textSecondary }}>Time elapsed</p>
                                    <p className="text-xl font-bold font-mono" style={{ color: '#f59e0b' }}>
                                        {formatTime(elapsedTime)}
                                    </p>
                                </div>
                                <div className="w-px h-10" style={{ backgroundColor: border }} />
                                <div className="text-left">
                                    <p className="text-xs" style={{ color: textSecondary }}>Estimated</p>
                                    <p className="text-xl font-bold font-mono" style={{ color: textSecondary }}>
                                        ~{formatTime(estimatedTime)}
                                    </p>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? '#374151' : '#e2e8f0' }}>
                                <div
                                    className="h-full rounded-full transition-all duration-1000"
                                    style={{
                                        width: `${Math.min((elapsedTime / estimatedTime) * 100, 95)}%`,
                                        background: 'linear-gradient(90deg, #4f46e5, #7c3aed)'
                                    }}
                                />
                            </div>

                            <p className="text-xs" style={{ color: textSecondary }}>
                                ⚠️ Please do not close this window
                            </p>
                        </div>
                    )}

                    {/* STEP 4: DONE */}
                    {step === 'done' && results && (
                        <div className="space-y-4">
                            {/* Success Banner */}
                            <div className="text-center py-4">
                                <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}>
                                    <CheckCircle2 className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold" style={{ color: textPrimary }}>
                                    Upload Complete! 🎉
                                </h3>
                                <p className="text-sm mt-1" style={{ color: textSecondary }}>
                                    Completed in {formatTime(elapsedTime)}
                                </p>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="text-center p-4 rounded-xl" style={{ backgroundColor: isDark ? 'rgba(22,163,74,0.1)' : '#f0fdf4', border: `1px solid ${isDark ? 'rgba(22,163,74,0.2)' : '#bbf7d0'}` }}>
                                    <p className="text-2xl font-bold" style={{ color: '#16a34a' }}>{results.created}</p>
                                    <p className="text-xs font-medium" style={{ color: isDark ? '#4ade80' : '#16a34a' }}>Created</p>
                                </div>
                                <div className="text-center p-4 rounded-xl" style={{ backgroundColor: isDark ? 'rgba(234,179,8,0.1)' : '#fffbeb', border: `1px solid ${isDark ? 'rgba(234,179,8,0.2)' : '#fde68a'}` }}>
                                    <p className="text-2xl font-bold" style={{ color: '#eab308' }}>{results.skipped}</p>
                                    <p className="text-xs font-medium" style={{ color: isDark ? '#fbbf24' : '#d97706' }}>Skipped</p>
                                </div>
                                <div className="text-center p-4 rounded-xl" style={{ backgroundColor: isDark ? 'rgba(220,38,38,0.1)' : '#fef2f2', border: `1px solid ${isDark ? 'rgba(220,38,38,0.2)' : '#fecaca'}` }}>
                                    <p className="text-2xl font-bold" style={{ color: '#dc2626' }}>{results.failed}</p>
                                    <p className="text-xs font-medium" style={{ color: isDark ? '#f87171' : '#dc2626' }}>Failed</p>
                                </div>
                            </div>

                            {/* Errors Accordion */}
                            {results.errors && results.errors.length > 0 && (
                                <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${isDark ? 'rgba(220,38,38,0.2)' : '#fecaca'}` }}>
                                    <button
                                        onClick={() => setShowErrors(!showErrors)}
                                        className="w-full flex items-center justify-between px-4 py-3 transition-colors"
                                        style={{ backgroundColor: isDark ? 'rgba(220,38,38,0.1)' : '#fef2f2' }}
                                    >
                                        <span className="flex items-center gap-2 text-sm font-medium" style={{ color: isDark ? '#f87171' : '#dc2626' }}>
                                            <AlertTriangle className="w-4 h-4" />
                                            {results.errors.length} issue{results.errors.length > 1 ? 's' : ''} found
                                        </span>
                                        {showErrors ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                    {showErrors && (
                                        <div className="px-4 py-3 space-y-2">
                                            {results.errors.map((err, i) => (
                                                <div key={i} className="flex items-start gap-2 text-xs" style={{ color: textSecondary }}>
                                                    <span className="font-mono shrink-0">#{err.index}</span>
                                                    <span className="font-medium" style={{ color: textPrimary }}>{err.name}</span>
                                                    <span>— {err.reason}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Info Note */}
                            <div
                                className="rounded-xl p-4"
                                style={{
                                    backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff',
                                    border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : '#bfdbfe'}`,
                                    borderLeft: '4px solid #3b82f6'
                                }}
                            >
                                <p className="text-xs" style={{ color: isDark ? '#93c5fd' : '#1e40af' }}>
                                    <strong>📧 Email sent</strong> to naitapppurpose@gmail.com with the student list and download link.
                                    <br />
                                    <strong>🔑 Random passwords</strong> were generated for each student. Check the email for the full credentials list.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleReset}
                                    className="flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all border"
                                    style={{ borderColor: border, color: textPrimary, backgroundColor: bgSecondary }}
                                >
                                    <Upload className="w-4 h-4" />
                                    Upload More
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="flex-1 py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all"
                                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BulkUploadStudents;
