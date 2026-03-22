import * as XLSX from 'xlsx';

/**
 * Auto-detect column indices from header names.
 */
export const detectColumns = (headerRow) => {
    let nameCol = -1, studentIdCol = -1, emailCol = -1, snoCol = -1;

    headerRow.forEach((header, idx) => {
        const h = String(header || '').trim().toLowerCase();
        if (!h) return;

        if (snoCol === -1 && /^(s\.?\s*no|sl\.?\s*no|sr\.?\s*no|serial|#)$/.test(h)) {
            snoCol = idx;
        } else if (nameCol === -1 && /name/.test(h)) {
            nameCol = idx;
        } else if (emailCol === -1 && /(e[-\s]?mail|g[-\s]?mail|gmail)/.test(h)) {
            emailCol = idx;
        } else if (studentIdCol === -1 && /(student|roll|reg|enrol)/.test(h) && !/mail/.test(h)) {
            studentIdCol = idx;
        }
    });

    return { nameCol, studentIdCol, emailCol, snoCol };
};

/**
 * Parse an Excel file buffer into an array of student objects.
 * Returns [] if parsing fails or no data found.
 */
export const parseExcel = (fileData) => {
    const workbook = XLSX.read(fileData, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length < 2) return [];

    const headerRow = jsonData[0] || [];
    let { nameCol, studentIdCol, emailCol, snoCol } = detectColumns(headerRow);

    // Fallback to position-based detection if headers not recognized
    if (nameCol === -1 || emailCol === -1) {
        const colCount = headerRow.length;
        if (colCount >= 6) {
            snoCol = 0; nameCol = 1; studentIdCol = 3; emailCol = 5;
        } else {
            snoCol = 0; nameCol = 1; studentIdCol = 2; emailCol = 3;
        }
        console.warn('Column headers not recognized, using position-based mapping:', { snoCol, nameCol, studentIdCol, emailCol });
    } else {
        console.log('Auto-detected columns:', { snoCol, nameCol, studentIdCol, emailCol });
    }

    const students = [];
    for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;

        const name = String(row[nameCol] || '').trim();
        const email = String(row[emailCol] || '').trim();

        if (!name || !email) continue;

        students.push({
            sno: snoCol >= 0 ? (row[snoCol] || i) : i,
            name,
            studentId: studentIdCol >= 0 ? String(row[studentIdCol] || '').trim() : '',
            email,
        });
    }

    return students;
};

/**
 * Format seconds into a human-readable time string.
 */
export const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};
