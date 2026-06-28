// 📁 backend/service/exportStyledExcel.js
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const { Mutex } = require("async-mutex");
const {
  uploadReportToDrive,
  getDriveFileByName,
  downloadDriveFile,
} = require("./googleDrive");

const mutex = new Mutex();
const FILE_NAME = "precimac_reports_online.xlsx";

async function appendStyledReportToExcelDrive(report) {
  const release = await mutex.acquire();
  let tempPath = null;

  try {
    // 1. Prepare temp path & workbook
    const timestamp = Date.now();
    tempPath = path.join(__dirname, `../temp_${timestamp}.xlsx`);
    const workbook = new ExcelJS.Workbook();

    // 2. Download existing Excel (if any)
    const existing = await getDriveFileByName(FILE_NAME);
    if (existing) {
      const buffer = await downloadDriveFile(existing.id);
      if (buffer) await workbook.xlsx.load(buffer);
    }

    // 3. Grab or create ONLY the “Precimac Reports” sheet
    let sheet = workbook.getWorksheet("Precimac Reports");
    if (!sheet) {
      sheet = workbook.addWorksheet("Precimac Reports");
    }

    // 4. **Always re‑apply columns (header row + key mapping)**
    sheet.columns = getColumns();
    styleHeaderRow(sheet);

    // 5. Build the new row
    const now = new Date(report.createdAt || Date.now());
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const srNo = sheet.rowCount; // header is row 1, first data = rowCount 1

    sheet.addRow({
      srNo,
      date,
      time,
      agentName: report.createdBy,
      projectId: report.projectNumber,
      projectName: report.projectName,
      customer: report.customer,
      workDone: Array.isArray(report.workDone) && report.workDone.length
        ? report.workDone.join(", ")
        : report.workDone || "N/A",
      status: report.status || "Pending",
      nextActionFromPrecimac: report.nextActionFromPrecimac || "-",
      nextActionFromCustomer: report.nextActionFromCustomer || "-",
      location: report.location?.address || "Unknown",
    });

    // 6. Style the freshly‑added row
    sheet.lastRow.eachCell(cell => {
      cell.alignment = { vertical: "middle", horizontal: "left" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // 7. Save & upload back to Drive
    await workbook.xlsx.writeFile(tempPath);
    await uploadReportToDrive(tempPath, FILE_NAME);

    console.log("✅ Report appended & uploaded correctly!");
  } catch (err) {
    console.error("❌ appendStyledReportToExcelDrive Error:", err);
    throw err;
  } finally {
    if (tempPath && fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    release();
  }
}

/** Defines your headers + keys + widths */
function getColumns() {
  return [
    { header: "Sr. No.", key: "srNo", width: 8 },
    { header: "Date", key: "date", width: 12 },
    { header: "Time", key: "time", width: 10 },
    { header: "Engineer Name", key: "agentName", width: 20 },
    { header: "Project ID", key: "projectId", width: 15 },
    { header: "Project Name", key: "projectName", width: 25 },
    { header: "Customer", key: "customer", width: 20 },
    { header: "Work Done", key: "workDone", width: 40 },
    { header: "Status", key: "status", width: 15 },
    { header: "Next action from Precimac", key: "nextActionFromPrecimac", width: 30 },
    { header: "Next action from Customer", key: "nextActionFromCustomer", width: 30 },
    { header: "Location", key: "location", width: 25 },
  ];
}

/** Styles row 1 (headers) */
function styleHeaderRow(sheet) {
  const hdr = sheet.getRow(1);
  hdr.font = { bold: true };
  hdr.alignment = { vertical: "middle", horizontal: "center" };
  hdr.eachCell(cell => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFB6D7A8" },
    };
  });
}

module.exports = { appendStyledReportToExcelDrive };
