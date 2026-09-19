/* ============================================================================
   HOAS REPORT GENERATORS
   PDF + EXCEL
   ============================================================================ */

const HOAS_PRIMARY = [79, 70, 229];
const HOAS_PURPLE = [124, 58, 237];

const DARK = [31, 41, 55];
const MUTED = [107, 114, 128];
const LIGHT_BG = [248, 250, 252];
const WHITE = [255, 255, 255];

const STATUS_COLORS = {
  approved: [22, 163, 74],
  pending: [234, 179, 8],
  denied: [220, 38, 38],
  suspended: [239, 68, 68],
  active: [22, 163, 74],
  inactive: [107, 114, 128],
};

const EXCEL_COLORS = {
  primary: "4F46E5",
  purple: "7C3AED",
  blue: "2563EB",
  green: "16A34A",
  amber: "D97706",
  red: "DC2626",
  slate: "475569",
  light: "F8FAFC",
  border: "E2E8F0",
  white: "FFFFFF",
  black: "111827",
};

/* ============================================================================
   GENERAL HELPERS
   ============================================================================ */

export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);

  anchor.click();

  anchor.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

export function generateTimestamp() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function safe(value, fallback = "N/A") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function numberOrZero(value) {
  const n = Number(value);

  return Number.isFinite(n) ? n : 0;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function getPhone(item = {}) {
  return (
    item.phone || item.phoneNumber || item.mobile || item.mobileNumber || ""
  );
}

function getStudentId(student = {}) {
  return (
    student.studentId ||
    student.rollNumber ||
    student.idNumber ||
    student.registrationNumber ||
    student.admissionNumber ||
    ""
  );
}

function getCollegeName(item = {}, fallback = "") {
  return (
    item.collegeName || item.college || item.college?.name || fallback || ""
  );
}
function formatDate(value) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatCurrency(value) {
  const amount = numberOrZero(value);

  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

function normalizeStatus(value) {
  return safe(value, "unknown").trim().toLowerCase();
}

function getStatusCounts(list = []) {
  return list.reduce(
    (acc, item) => {
      const status = normalizeStatus(item.status);

      if (status === "approved") acc.approved++;
      else if (status === "pending") acc.pending++;
      else if (status === "denied") acc.denied++;
      else if (status === "suspended") acc.suspended++;
      else acc.other++;

      return acc;
    },
    {
      approved: 0,
      pending: 0,
      denied: 0,
      suspended: 0,
      other: 0,
    },
  );
}

function calculateFeeStats(students = []) {
  return students.reduce(
    (acc, student) => {
      const total = numberOrZero(student.feeDetails?.totalFee);

      const paid = numberOrZero(student.feeDetails?.paidFee);

      acc.totalFees += total;
      acc.totalPaid += paid;
      acc.totalBalance += Math.max(total - paid, 0);

      return acc;
    },
    {
      totalFees: 0,
      totalPaid: 0,
      totalBalance: 0,
    },
  );
}

function getVerificationStats(students = []) {
  return students.reduce(
    (acc, student) => {
      if (
        String(student.managementVerification || "").toLowerCase() ===
        "verified"
      ) {
        acc.managementVerified++;
      }

      if (
        String(student.wardenVerification || "").toLowerCase() === "verified"
      ) {
        acc.wardenVerified++;
      }

      return acc;
    },
    {
      managementVerified: 0,
      wardenVerified: 0,
    },
  );
}

/* ============================================================================
   PDF HELPERS
   ============================================================================ */

function drawPdfTitle(pdf, { title, subtitle, scope, generatedAt }) {
  const pageWidth = pdf.internal.pageSize.getWidth();

  pdf.setFillColor(...HOAS_PRIMARY);

  pdf.roundedRect(14, 12, pageWidth - 28, 24, 4, 4, "F");

  pdf.setTextColor(...WHITE);

  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");

  pdf.text("HOAS", 22, 22);

  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");

  pdf.text("Hostel Operations and Administration System", 22, 28);

  pdf.setFontSize(8);

  pdf.text(`Generated: ${generatedAt}`, pageWidth - 22, 22, {
    align: "right",
  });

  pdf.setTextColor(...DARK);

  pdf.setFontSize(17);
  pdf.setFont("helvetica", "bold");

  pdf.text(title, pageWidth / 2, 48, {
    align: "center",
  });

  if (subtitle) {
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...MUTED);

    pdf.text(subtitle, pageWidth / 2, 55, {
      align: "center",
    });
  }

  if (scope) {
    pdf.setFontSize(9);

    pdf.text(`Scope: ${scope}`, pageWidth / 2, 62, {
      align: "center",
    });
  }

  return 70;
}

function drawPdfSectionTitle(pdf, title, y) {
  const pageWidth = pdf.internal.pageSize.getWidth();

  pdf.setFillColor(...LIGHT_BG);

  pdf.roundedRect(14, y, pageWidth - 28, 10, 2, 2, "F");

  pdf.setTextColor(...HOAS_PRIMARY);

  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");

  pdf.text(title, 19, y + 6.5);

  return y + 15;
}

function drawPdfKpis(pdf, kpis, startY) {
  const pageWidth = pdf.internal.pageSize.getWidth();

  const gap = 4;

  const cardWidth = (pageWidth - 28 - gap * 3) / 4;

  const cardHeight = 26;

  kpis.forEach((kpi, index) => {
    const x = 14 + index * (cardWidth + gap);

    pdf.setFillColor(...(kpi.color || HOAS_PRIMARY));

    pdf.roundedRect(x, startY, cardWidth, cardHeight, 3, 3, "F");

    pdf.setTextColor(...WHITE);

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");

    pdf.text(kpi.label, x + 5, startY + 7);

    pdf.setFontSize(15);
    pdf.setFont("helvetica", "bold");

    pdf.text(String(kpi.value), x + 5, startY + 19);
  });

  return startY + cardHeight + 10;
}

function drawPdfKeyValueTable(pdf, rows, startY) {
  let y = startY;

  rows.forEach(([label, value]) => {
    const pageWidth = pdf.internal.pageSize.getWidth();

    pdf.setFillColor(...LIGHT_BG);

    pdf.roundedRect(14, y, pageWidth - 28, 8, 1.5, 1.5, "F");

    pdf.setTextColor(...MUTED);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");

    pdf.text(safe(label), 19, y + 5);

    pdf.setTextColor(...DARK);
    pdf.setFont("helvetica", "normal");

    pdf.text(safe(value), 70, y + 5);

    y += 10;
  });

  return y + 4;
}

function addPdfFooter(pdf) {
  const pageCount = pdf.internal.getNumberOfPages();

  const pageHeight = pdf.internal.pageSize.getHeight();

  const pageWidth = pdf.internal.pageSize.getWidth();

  for (let page = 1; page <= pageCount; page++) {
    pdf.setPage(page);

    pdf.setDrawColor(226, 232, 240);

    pdf.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);

    pdf.setTextColor(...MUTED);

    pdf.setFontSize(7);

    pdf.text(
      "HOAS - Hostel Operations and Administration System",
      14,
      pageHeight - 9,
    );

    pdf.text(`Page ${page} of ${pageCount}`, pageWidth - 14, pageHeight - 9, {
      align: "right",
    });
  }
}

/* ============================================================================
   PDF GENERATOR
   ============================================================================ */

export async function generatePdfReport({
  title = "HOAS Report",
  subtitle,
  stats = {},
  studentsList = [],
  wardensList = [],
  collegesList = [],
  collegeName,
  collegeEmail,
  collegeLocation,
}) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const pdf = new jsPDF("p", "mm", "a4");

  const students = studentsList || [];
  const wardens = wardensList || [];
  const colleges = collegesList || [];

  const generatedAt = formatDateTime(new Date());

  pdf.setProperties({
    title,
    subject: "HOAS Administrative Report",
    author: "HOAS",
    creator: "HOAS",
  });

  let y = drawPdfTitle(pdf, {
    title,
    subtitle,
    scope: collegeName || subtitle || "All Colleges",
    generatedAt,
  });

  /* ------------------------------------------------------------------------ */
  /* SUMMARY                                                                   */
  /* ------------------------------------------------------------------------ */

  y = drawPdfSectionTitle(pdf, "Executive Summary", y);

  y = drawPdfKpis(
    pdf,
    [
      {
        label: "Students",
        value: stats.students ?? students.length,
        color: HOAS_PRIMARY,
      },
      {
        label: "Wardens",
        value: stats.wardens ?? wardens.length,
        color: HOAS_PURPLE,
      },
      {
        label: "Colleges",
        value: stats.colleges ?? colleges.length,
        color: [37, 99, 235],
      },
      {
        label: "Generated",
        value: formatDate(new Date()),
        color: [22, 163, 74],
      },
    ],
    y,
  );

  /* ------------------------------------------------------------------------ */
  /* ORGANIZATION DETAILS                                                     */
  /* ------------------------------------------------------------------------ */

  if (collegeName || collegeEmail || collegeLocation) {
    y = drawPdfSectionTitle(pdf, "Organization Details", y);

    y = drawPdfKeyValueTable(
      pdf,
      [
        ["Organization", collegeName || "All Colleges"],
        ["Email", collegeEmail || "N/A"],
        ["Location", collegeLocation || "N/A"],
      ],
      y,
    );
  }

  /* ------------------------------------------------------------------------ */
  /* STATUS SUMMARY                                                            */
  /* ------------------------------------------------------------------------ */

  const studentStatus = getStatusCounts(students);

  const wardenStatus = getStatusCounts(wardens);

  y = drawPdfSectionTitle(pdf, "Status Summary", y);

  autoTable(pdf, {
    startY: y,
    head: [["Category", "Approved", "Pending", "Denied", "Suspended", "Other"]],
    body: [
      [
        "Students",
        studentStatus.approved,
        studentStatus.pending,
        studentStatus.denied,
        studentStatus.suspended,
        studentStatus.other,
      ],
      [
        "Wardens",
        wardenStatus.approved,
        wardenStatus.pending,
        wardenStatus.denied,
        wardenStatus.suspended,
        wardenStatus.other,
      ],
    ],
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: DARK,
    },
    headStyles: {
      fillColor: HOAS_PRIMARY,
      textColor: WHITE,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: {
      left: 14,
      right: 14,
    },
  });

  y = pdf.lastAutoTable.finalY + 12;

  /* ------------------------------------------------------------------------ */
  /* FEE SUMMARY                                                               */
  /* ------------------------------------------------------------------------ */

  if (students.length > 0) {
    const fees = calculateFeeStats(students);

    const verification = getVerificationStats(students);

    y = drawPdfSectionTitle(
      pdf,
      "Student Financial and Verification Summary",
      y,
    );

    autoTable(pdf, {
      startY: y,
      head: [["Metric", "Value"]],
      body: [
        ["Total Fees", formatCurrency(fees.totalFees)],
        ["Fees Collected", formatCurrency(fees.totalPaid)],
        ["Outstanding Balance", formatCurrency(fees.totalBalance)],
        ["Management Verified", verification.managementVerified],
        ["Warden Verified", verification.wardenVerified],
      ],
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: HOAS_PURPLE,
        textColor: WHITE,
        fontStyle: "bold",
      },
      margin: {
        left: 14,
        right: 14,
      },
    });

    y = pdf.lastAutoTable.finalY + 12;
  }

  /* ------------------------------------------------------------------------ */
  /* COLLEGES                                                                  */
  /* ------------------------------------------------------------------------ */

  if (colleges.length > 0) {
    if (y > 235) {
      pdf.addPage();
      y = 20;
    }

    y = drawPdfSectionTitle(pdf, `Colleges Overview (${colleges.length})`, y);

    autoTable(pdf, {
      startY: y,
      head: [["#", "College", "Email", "Location", "Students", "Wardens"]],
      body: colleges.map((college, index) => [
        index + 1,
        safe(college.name),
        safe(college.email),
        safe(college.location),
        numberOrZero(college.studentsCount),
        numberOrZero(college.wardensCount),
      ]),
      theme: "grid",
      styles: {
        fontSize: 7,
        cellPadding: 2.5,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: HOAS_PRIMARY,
        textColor: WHITE,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 243, 255],
      },
      columnStyles: {
        0: { cellWidth: 10 },
        4: { cellWidth: 18 },
        5: { cellWidth: 18 },
      },
      margin: {
        left: 14,
        right: 14,
      },
      didDrawPage: () => {
        pdf.setFontSize(7);
      },
    });

    y = pdf.lastAutoTable.finalY + 12;
  }

  /* ------------------------------------------------------------------------ */
  /* STUDENTS                                                                  */
  /* ------------------------------------------------------------------------ */

  if (students.length > 0) {
    pdf.addPage();
    y = 20;

    y = drawPdfSectionTitle(
      pdf,
      `Students - Detailed Register (${students.length})`,
      y,
    );

    autoTable(pdf, {
      startY: y,
      head: [
        [
          "#",
          "Name",
          "Email",
          "Status",
          "Student ID",
          "College",
          "Block",
          "Room",
          "Phone",
        ],
      ],
      body: students.map((student, index) => [
        index + 1,
        safe(student.name),
        safe(student.email),
        safe(student.status),
        safe(student.studentId || student.rollNumber || student.idNumber),
        safe(student.collegeName || collegeName),
        safe(student.hostelBlock),
        safe(student.roomNumber),
        safe(student.phone || student.phoneNumber),
      ]),
      theme: "grid",
      styles: {
        fontSize: 6.5,
        cellPadding: 2,
        overflow: "linebreak",
        valign: "middle",
      },
      headStyles: {
        fillColor: HOAS_PRIMARY,
        textColor: WHITE,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 8 },
      },
      margin: {
        left: 10,
        right: 10,
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 3) {
          const status = normalizeStatus(data.cell.raw);

          const color = STATUS_COLORS[status];

          if (color) {
            data.cell.styles.textColor = color;
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });

    y = pdf.lastAutoTable.finalY + 12;
  }

  /* ------------------------------------------------------------------------ */
  /* WARDENS                                                                   */
  /* ------------------------------------------------------------------------ */

  if (wardens.length > 0) {
    pdf.addPage();
    y = 20;

    y = drawPdfSectionTitle(
      pdf,
      `Wardens - Detailed Register (${wardens.length})`,
      y,
    );

    autoTable(pdf, {
      startY: y,
      head: [
        [
          "#",
          "Name",
          "Email",
          "Status",
          "Employee ID",
          "Designation",
          "College",
          "Block",
          "Phone",
        ],
      ],
      body: wardens.map((warden, index) => [
        index + 1,
        safe(warden.name),
        safe(warden.email),
        safe(warden.status),
        safe(warden.employeeId),
        safe(warden.designation),
        safe(warden.collegeName || collegeName),
        safe(warden.hostelBlock),
        safe(warden.phone || warden.phoneNumber),
      ]),
      theme: "grid",
      styles: {
        fontSize: 6.5,
        cellPadding: 2,
        overflow: "linebreak",
        valign: "middle",
      },
      headStyles: {
        fillColor: HOAS_PURPLE,
        textColor: WHITE,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [250, 245, 255],
      },
      margin: {
        left: 10,
        right: 10,
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 3) {
          const status = normalizeStatus(data.cell.raw);

          const color = STATUS_COLORS[status];

          if (color) {
            data.cell.styles.textColor = color;
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });
  }

  /* ------------------------------------------------------------------------ */
  /* FOOTER                                                                    */
  /* ------------------------------------------------------------------------ */

  addPdfFooter(pdf);

  return pdf;
}

/* ============================================================================
   EXCEL HELPERS
   ============================================================================ */

function styleExcelHeader(row) {
  row.height = 26;

  row.eachCell((cell) => {
    cell.font = {
      bold: true,
      color: EXCEL_COLORS.white,
      size: 10,
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: EXCEL_COLORS.primary,
      },
    };

    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };

    cell.border = {
      top: {
        style: "thin",
        color: {
          argb: EXCEL_COLORS.border,
        },
      },
      bottom: {
        style: "thin",
        color: {
          argb: EXCEL_COLORS.border,
        },
      },
      left: {
        style: "thin",
        color: {
          argb: EXCEL_COLORS.border,
        },
      },
      right: {
        style: "thin",
        color: {
          argb: EXCEL_COLORS.border,
        },
      },
    };
  });
}

function styleExcelTitle(worksheet, title, subtitle, columnCount) {
  worksheet.mergeCells(1, 1, 1, columnCount);

  const titleCell = worksheet.getCell(1, 1);

  titleCell.value = title;

  titleCell.font = {
    bold: true,
    size: 18,
    color: EXCEL_COLORS.white,
  };

  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: EXCEL_COLORS.primary,
    },
  };

  titleCell.alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  worksheet.getRow(1).height = 34;

  if (subtitle) {
    worksheet.mergeCells(2, 1, 2, columnCount);

    const subtitleCell = worksheet.getCell(2, 1);

    subtitleCell.value = subtitle;

    subtitleCell.font = {
      italic: true,
      size: 10,
      color: EXCEL_COLORS.slate,
    };

    subtitleCell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };

    worksheet.getRow(2).height = 24;
  }
}

function applyExcelBorders(worksheet, startRow, endRow, startCol, endCol) {
  for (let rowNumber = startRow; rowNumber <= endRow; rowNumber += 1) {
    for (let colNumber = startCol; colNumber <= endCol; colNumber += 1) {
      const cell = worksheet.getCell(rowNumber, colNumber);

      cell.border = {
        top: {
          style: "thin",
          color: {
            argb: EXCEL_COLORS.border,
          },
        },
        bottom: {
          style: "thin",
          color: {
            argb: EXCEL_COLORS.border,
          },
        },
        left: {
          style: "thin",
          color: {
            argb: EXCEL_COLORS.border,
          },
        },
        right: {
          style: "thin",
          color: {
            argb: EXCEL_COLORS.border,
          },
        },
      };
    }
  }
}

function applyStatusStyle(cell) {
  const status = normalizeStatus(cell?.value);

  let color = EXCEL_COLORS.slate;

  if (status === "approved" || status === "active" || status === "online") {
    color = EXCEL_COLORS.green;
  } else if (status === "pending") {
    color = EXCEL_COLORS.amber;
  } else if (status === "denied" || status === "suspended") {
    color = EXCEL_COLORS.red;
  }

  cell.font = {
    bold: true,
    color,
  };
}

function setColumnWidths(worksheet, widths) {
  widths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });
}

function columnLetter(columnNumber) {
  let result = "";

  let number = Number(columnNumber);

  while (number > 0) {
    const remainder = (number - 1) % 26;

    result = String.fromCharCode(65 + remainder) + result;

    number = Math.floor((number - 1) / 26);
  }

  return result;
}

function formatExcelDate(value) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date;
}

/* ============================================================================
   EMPTY DATA STATE
   ============================================================================ */

function addEmptyState(worksheet, rowNumber, columnCount, message) {
  worksheet.mergeCells(rowNumber, 1, rowNumber, columnCount);

  const cell = worksheet.getCell(rowNumber, 1);

  cell.value = message;

  cell.font = {
    italic: true,
    color: EXCEL_COLORS.slate,
    size: 11,
  };

  cell.alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: EXCEL_COLORS.light,
    },
  };

  worksheet.getRow(rowNumber).height = 30;
}

/* ============================================================================
   OVERVIEW SHEET
   ============================================================================ */

function buildOverviewSheet(
  workbook,
  {
    title = "HOAS Report",
    subtitle = "",
    collegeName = "",
    collegeEmail = "",
    collegeLocation = "",
    stats = {},
    students = [],
    wardens = [],
    colleges = [],
  },
) {
  const worksheet = workbook.addWorksheet("Overview");

  const safeStudents = asArray(students);

  const safeWardens = asArray(wardens);

  const safeColleges = asArray(colleges);

  const studentStatus = getStatusCounts(safeStudents);

  const wardenStatus = getStatusCounts(safeWardens);

  styleExcelTitle(
    worksheet,
    "HOAS Administrative Report",
    `${title} | ${subtitle || collegeName || "All Colleges"}`,
    6,
  );

  worksheet.mergeCells("A4:F4");

  worksheet.getCell("A4").value = `Generated: ${formatDateTime(new Date())}`;

  worksheet.getCell("A4").font = {
    italic: true,
    color: EXCEL_COLORS.slate,
    size: 9,
  };

  worksheet.getCell("A4").alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  /* ───────────────── KPI ───────────────── */

  const kpis = [
    ["Total Students", stats?.students ?? safeStudents.length],
    ["Total Wardens", stats?.wardens ?? safeWardens.length],
    ["Total Colleges", stats?.colleges ?? safeColleges.length],
    ["Approved Students", studentStatus.approved],
    ["Approved Wardens", wardenStatus.approved],
    ["Pending Accounts", studentStatus.pending + wardenStatus.pending],
  ];

  kpis.forEach(([label, value], index) => {
    const column = index + 1;

    const headerCell = worksheet.getCell(6, column);

    const valueCell = worksheet.getCell(7, column);

    headerCell.value = label;

    headerCell.font = {
      bold: true,
      size: 9,
      color: EXCEL_COLORS.white,
    };

    headerCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: EXCEL_COLORS.primary,
      },
    };

    headerCell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };

    valueCell.value = numberOrZero(value);

    valueCell.font = {
      bold: true,
      size: 18,
      color: EXCEL_COLORS.black,
    };

    valueCell.alignment = {
      horizontal: "center",
      vertical: "middle",
    };
  });

  worksheet.getRow(6).height = 28;

  worksheet.getRow(7).height = 34;

  /* ───────────────── Organization ───────────────── */

  let row = 10;

  worksheet.getCell(row, 1).value = "Organization Details";

  worksheet.getCell(row, 1).font = {
    bold: true,
    size: 13,
    color: EXCEL_COLORS.primary,
  };

  row += 1;

  const metadata = [
    ["Organization", collegeName || "All Colleges"],
    ["Email", collegeEmail || "N/A"],
    ["Location", collegeLocation || "N/A"],
  ];

  metadata.forEach(([label, value]) => {
    worksheet.getCell(row, 1).value = label;

    worksheet.getCell(row, 2).value = value;

    worksheet.getCell(row, 1).font = {
      bold: true,
    };

    row += 1;
  });

  row += 1;

  /* ───────────────── Status ───────────────── */

  worksheet.getCell(row, 1).value = "Status Summary";

  worksheet.getCell(row, 1).font = {
    bold: true,
    size: 13,
    color: EXCEL_COLORS.primary,
  };

  row += 1;

  const statusHeaders = [
    "Category",
    "Approved",
    "Pending",
    "Denied",
    "Suspended",
    "Other",
  ];

  worksheet.getRow(row).values = statusHeaders;

  styleExcelHeader(worksheet.getRow(row));

  row += 1;

  worksheet.getRow(row).values = [
    "Students",
    studentStatus.approved,
    studentStatus.pending,
    studentStatus.denied,
    studentStatus.suspended,
    studentStatus.other,
  ];

  row += 1;

  worksheet.getRow(row).values = [
    "Wardens",
    wardenStatus.approved,
    wardenStatus.pending,
    wardenStatus.denied,
    wardenStatus.suspended,
    wardenStatus.other,
  ];

  row += 2;

  /* ───────────────── Fees ───────────────── */

  if (safeStudents.length > 0) {
    const fees = calculateFeeStats(safeStudents);

    worksheet.getCell(row, 1).value = "Fee Summary";

    worksheet.getCell(row, 1).font = {
      bold: true,
      size: 13,
      color: EXCEL_COLORS.primary,
    };

    row += 1;

    const feeRows = [
      ["Total Fees", fees.totalFees],
      ["Fees Collected", fees.totalPaid],
      ["Outstanding Balance", fees.totalBalance],
    ];

    feeRows.forEach(([label, value]) => {
      worksheet.getCell(row, 1).value = label;

      worksheet.getCell(row, 2).value = value;

      worksheet.getCell(row, 2).numFmt = '"₹"#,##0.00';

      row += 1;
    });
  }

  setColumnWidths(worksheet, [24, 24, 18, 16, 16, 16]);

  worksheet.views = [
    {
      state: "frozen",
      ySplit: 4,
    },
  ];

  applyExcelBorders(worksheet, 10, Math.max(row - 1, 10), 1, 6);

  return worksheet;
}

/* ============================================================================
   STUDENTS SHEET
   ============================================================================ */

function buildStudentsSheet(workbook, studentsList, fallbackCollegeName = "") {
  const worksheet = workbook.addWorksheet("Students");

  const students = asArray(studentsList);

  const headers = [
    "#",
    "Name",
    "Email",
    "Phone",
    "Status",
    "Student ID",
    "College",
    "Hostel Block",
    "Room",
    "Course",
    "Branch",
    "Year",
    "Total Fee",
    "Paid Fee",
    "Balance",
    "Management Verification",
    "Warden Verification",
    "Online",
    "Created",
  ];

  worksheet.addRow(headers);

  styleExcelHeader(worksheet.getRow(1));

  const rows = students.map((student, index) => {
    const totalFee = numberOrZero(student?.feeDetails?.totalFee);

    const paidFee = numberOrZero(student?.feeDetails?.paidFee);

    const balance = Math.max(totalFee - paidFee, 0);

    return [
      index + 1,
      safe(student?.name),
      safe(student?.email),
      safe(getPhone(student)),
      safe(student?.status),
      safe(getStudentId(student)),
      safe(getCollegeName(student, fallbackCollegeName)),
      safe(student?.hostelBlock),
      safe(student?.roomNumber),
      safe(student?.course),
      safe(student?.branch),
      safe(student?.year),
      totalFee,
      paidFee,
      balance,
      safe(student?.managementVerification),
      safe(student?.wardenVerification),
      student?.isOnline ? "Online" : "Offline",
      formatExcelDate(student?.createdAt),
    ];
  });

  /* Data rows */

  rows.forEach((rowValues) => {
    worksheet.addRow(rowValues);
  });

  /* Formatting */

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    row.height = 22;

    row.alignment = {
      vertical: "middle",
      wrapText: true,
    };

    applyStatusStyle(row.getCell(5));

    row.getCell(13).numFmt = '"₹"#,##0.00';

    row.getCell(14).numFmt = '"₹"#,##0.00';

    row.getCell(15).numFmt = '"₹"#,##0.00';

    if (row.getCell(18).value === "Online") {
      applyStatusStyle(row.getCell(18));
    }

    if (row.getCell(19).value instanceof Date) {
      row.getCell(19).numFmt = "dd-mmm-yyyy hh:mm";
    }
  });

  setColumnWidths(worksheet, [
    6, // #
    24, // Name
    32, // Email
    16, // Phone
    14, // Status
    18, // Student ID
    28, // College
    20, // Hostel
    14, // Room
    20, // Course
    20, // Branch
    12, // Year
    15, // Total
    15, // Paid
    15, // Balance
    24, // Management
    22, // Warden
    12, // Online
    20, // Created
  ]);

  worksheet.views = [
    {
      state: "frozen",
      ySplit: 1,
    },
  ];

  /*
   * IMPORTANT:
   * Do not call worksheet.addTable() when
   * there are no data rows.
   */
  if (rows.length > 0) {
    worksheet.autoFilter = {
      from: "A1",
      to: `S${rows.length + 1}`,
    };
  } else {
    addEmptyState(
      worksheet,
      3,
      headers.length,
      "No student records available for this report.",
    );
  }
  return worksheet;
}

/* ============================================================================
   WARDENS SHEET
   ============================================================================ */

function buildWardensSheet(workbook, wardensList, fallbackCollegeName = "") {
  const worksheet = workbook.addWorksheet("Wardens");

  const wardens = asArray(wardensList);

  const headers = [
    "#",
    "Name",
    "Email",
    "Phone",
    "Status",
    "Employee ID",
    "Designation",
    "Department",
    "College",
    "Hostel Block",
    "Online",
    "Created",
  ];

  worksheet.addRow(headers);

  styleExcelHeader(worksheet.getRow(1));

  const rows = wardens.map((warden, index) => [
    index + 1,
    safe(warden?.name),
    safe(warden?.email),
    safe(getPhone(warden)),
    safe(warden?.status),
    safe(warden?.employeeId),
    safe(warden?.designation),
    safe(warden?.department),
    safe(getCollegeName(warden, fallbackCollegeName)),
    safe(warden?.hostelBlock),
    warden?.isOnline ? "Online" : "Offline",
    formatExcelDate(warden?.createdAt),
  ]);

  rows.forEach((rowValues) => {
    worksheet.addRow(rowValues);
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    row.height = 22;

    row.alignment = {
      vertical: "middle",
      wrapText: true,
    };

    applyStatusStyle(row.getCell(5));

    if (row.getCell(11).value === "Online") {
      applyStatusStyle(row.getCell(11));
    }

    if (row.getCell(12).value instanceof Date) {
      row.getCell(12).numFmt = "dd-mmm-yyyy hh:mm";
    }
  });

  setColumnWidths(worksheet, [6, 24, 32, 16, 14, 18, 20, 20, 28, 20, 12, 20]);

  worksheet.views = [
    {
      state: "frozen",
      ySplit: 1,
    },
  ];

  if (rows.length > 0) {
    worksheet.autoFilter = {
      from: "A1",
      to: `L${rows.length + 1}`,
    };
  } else {
    addEmptyState(
      worksheet,
      3,
      headers.length,
      "No warden records available for this report.",
    );
  }

  return worksheet;
}

/* ============================================================================
   COLLEGES SHEET
   ============================================================================ */

function buildCollegesSheet(workbook, collegesList) {
  const worksheet = workbook.addWorksheet("Colleges");

  const colleges = asArray(collegesList);

  const headers = ["#", "College", "Email", "Location", "Students", "Wardens"];

  worksheet.addRow(headers);

  styleExcelHeader(worksheet.getRow(1));

  const rows = colleges.map((college, index) => [
    index + 1,
    safe(college?.name),
    safe(college?.email),
    safe(college?.location),
    numberOrZero(college?.studentsCount),
    numberOrZero(college?.wardensCount),
  ]);

  rows.forEach((rowValues) => {
    worksheet.addRow(rowValues);
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    row.height = 22;

    row.alignment = {
      vertical: "middle",
      wrapText: true,
    };
  });

  setColumnWidths(worksheet, [6, 38, 32, 32, 14, 14]);

  worksheet.views = [
    {
      state: "frozen",
      ySplit: 1,
    },
  ];

  if (rows.length > 0) {
    worksheet.autoFilter = {
      from: "A1",
      to: `F${rows.length + 1}`,
    };
  } else {
    addEmptyState(
      worksheet,
      3,
      headers.length,
      "No college records available for this report.",
    );
  }

  return worksheet;
}

/* ============================================================================
   EXCEL GENERATOR
   ============================================================================ */

export async function generateExcelReport({
  title = "HOAS Report",
  subtitle = "",
  collegeName = "",
  collegeEmail = "",
  collegeLocation = "",
  stats = {},
  studentsList = [],
  wardensList = [],
  collegesList = [],
}) {
  try {
    const ExcelJSModule = await import("exceljs");

    const Workbook = ExcelJSModule.Workbook || ExcelJSModule.default?.Workbook;

    if (!Workbook) {
      throw new Error("ExcelJS Workbook could not be loaded.");
    }

    const workbook = new Workbook();

    workbook.creator = "HOAS";

    workbook.lastModifiedBy = "HOAS";

    workbook.created = new Date();

    workbook.modified = new Date();

    workbook.company = "HOAS";

    workbook.subject = title;

    workbook.title = "HOAS Administrative Report";

    workbook.description =
      "Generated by the Hostel Operations and Administration System";

    workbook.calcProperties = {
      fullCalcOnLoad: true,
      forceFullCalc: true,
      calcMode: "auto",
    };

    const students = asArray(studentsList);

    const wardens = asArray(wardensList);

    const colleges = asArray(collegesList);

    /*
     * Sheet 1
     */
    buildOverviewSheet(workbook, {
      title,
      subtitle,
      collegeName,
      collegeEmail,
      collegeLocation,
      stats: stats || {},
      students,
      wardens,
      colleges,
    });

    /*
     * Sheet 2
     */
    buildStudentsSheet(workbook, students, collegeName);

    /*
     * Sheet 3
     */
    buildWardensSheet(workbook, wardens, collegeName);

    /*
     * Sheet 4
     */
    buildCollegesSheet(workbook, colleges);

    const buffer = await workbook.xlsx.writeBuffer();

    return buffer;
  } catch (error) {
    console.error("Excel report generation failed:", error);

    throw error;
  }
}
