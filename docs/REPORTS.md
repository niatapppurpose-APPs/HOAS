# Reports Page: Implementation Guide

This document describes how to implement a reports page where an Owner can download college-specific reports as PDF or JSON, protected with a single password. It includes a Node.js example that uses the filesystem and a CLI tool to encrypt PDFs.

## Goals
- Allow Owners to download a college's report in `pdf` or `json` format
- Produce a password-protected PDF (single shared password configurable via env)
- Use Node.js filesystem APIs to generate and store the files temporarily
- Return the file as a download and clean up temp files

## High-level options

- Option A (recommended for full control): Run a small Node/Express service (or Cloud Run) where you can install `qpdf` and run CLI encryption. Use `pdfkit` to create PDFs and `fs` for file I/O.
- Option B (Firebase Functions): Generate JSON and PDF in the function; if you need password protection, deploy a separate service (Cloud Run) to perform encryption or consider delivering the file inside a passworded ZIP (but browser-side unzip requires password entry).

## Requirements

- Node.js (14+ / 18+)
- npm packages: `express`, `pdfkit` (for PDF generation)
- `qpdf` installed on the server (for PDF password encryption using CLI)

## Install `qpdf`

- Linux: `sudo apt install qpdf`
- macOS: `brew install qpdf`
- Windows: install from https://qpdf.sourceforge.io/ or use Chocolatey: `choco install qpdf`

## Example: Node/Express endpoint (pdf + json)

Notes: This example uses the filesystem to write temporary files and `qpdf` to encrypt the PDF using a password stored in `REPORT_PASSWORD` environment variable.

```js
// server.js (minimal example)
const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
const PDFDocument = require('pdfkit');
const { execSync } = require('child_process');

const app = express();
app.use(express.json());

const REPORT_PASSWORD = process.env.REPORT_PASSWORD || 'change-me';

function generatePdf(reportData, outPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(outPath);
    doc.pipe(stream);
    doc.fontSize(18).text('College Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(JSON.stringify(reportData, null, 2));
    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

app.get('/api/reports/:collegeId', async (req, res) => {
  const { collegeId } = req.params;
  const format = (req.query.format || 'pdf').toLowerCase();

  // TODO: Replace with real DB fetch
  const reportData = { collegeId, generatedAt: new Date().toISOString(), stats: { students: 120, wardens: 4 } };

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'report-'));
  try {
    if (format === 'json') {
      const filePath = path.join(tmpDir, `${collegeId}-report.json`);
      fs.writeFileSync(filePath, JSON.stringify(reportData, null, 2), 'utf8');
      res.download(filePath, `${collegeId}-report.json`, (err) => { fs.rmSync(tmpDir, { recursive: true, force: true }); });
      return;
    }

    // PDF flow
    const pdfPath = path.join(tmpDir, `${collegeId}-report.pdf`);
    const encryptedPdfPath = path.join(tmpDir, `${collegeId}-report-protected.pdf`);

    await generatePdf(reportData, pdfPath);

    // Use qpdf to encrypt the PDF with a user-password (no owner password)
    // Command: qpdf --encrypt user-password owner-password key-length -- in.pdf out.pdf
    // We set owner password empty and 256-bit encryption
    const safePassword = REPORT_PASSWORD.replace(/\s/g, '_');
    execSync(`qpdf --encrypt ${safePassword} \"\" 256 -- ${pdfPath} ${encryptedPdfPath}`);

    res.download(encryptedPdfPath, `${collegeId}-report.pdf`, (err) => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });
  } catch (err) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    console.error(err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

app.listen(8080, () => console.log('Reports service listening on 8080'));
```

## Frontend: React download button (fetching blob)

Example using `fetch` to download the protected PDF and trigger browser save dialog.

```jsx
// DownloadButton.jsx
function DownloadButton({ collegeId, format = 'pdf' }) {
  const handleDownload = async () => {
    const res = await fetch(`/api/reports/${collegeId}?format=${format}`, { credentials: 'include' });
    if (!res.ok) { alert('Download failed'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${collegeId}-report.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  return <button onClick={handleDownload}>Download Report</button>;
}
```

## Security notes

- Store `REPORT_PASSWORD` in your environment (e.g., `.env`, Cloud Run secret, or secret manager). Do NOT expose it in client code.
- If using Firebase Functions, running `qpdf` may not be supported in the environment; use Cloud Run or a VM for encryption, or return an unencrypted PDF and rely on secure download links + short TTL.
- Consider per-report passwords or owner-provided password if stronger granularity is needed.

## Filesystem usage tips

- Use `fs.mkdtempSync` (or async equivalent) to create a temporary directory and remove it after sending the file.
- Keep files in OS temp directory and remove them even on error (use try/catch/finally).

## Next steps / integration

1. Decide where encryption will run: Cloud Run / Express (recommended) or Cloud Functions (limited).
2. Add `REPORT_PASSWORD` as an environment secret.
3. Implement route in your backend and wire a frontend `DownloadButton` in the Owner UI (e.g., `OwnersDashboard/Pages/Reports.jsx`).
4. Optionally log downloads and restrict by Owner's college access.

----

If you want, I can scaffold a minimal Express service with this route in your repo or add a Firebase-friendly JSON-only implementation. Which would you prefer?
