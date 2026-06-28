// 📁 service/excelService.js
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const { Mutex } = require("async-mutex");
const { uploadReportToDrive, getOrCreateDriveFile } = require("./googleDrive");
require("dotenv").config();

const mutex = new Mutex();
const TEMP_NAME = "precimac_reports_online.xlsx";

async function appendReportToExcelDrive(report) {
  const release = await mutex.acquire();
  try {
    const tempPath = path.join(__dirname, `../temp_${Date.now()}.xlsx`);

    // const fileId = await getOrCreateDriveFile(TEMP_NAME);

    // Step 1: Download file
    const { google } = require("googleapis");
    const auth = require("./googleDrive").oauth2Client;
    const drive = google.drive({ version: "v3", auth });

    const dest = fs.createWriteStream(tempPath);
    const res = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" }
    );
    await new Promise((resolve, reject) => {
      res.data.pipe(dest);
      dest.on("finish", resolve);
      dest.on("error", reject);
    });

    // Step 2: Modify Excel
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(tempPath);

    let sheet = workbook.getWorksheet("Precimac Reports");
    if (!sheet) {
      sheet = workbook.addWorksheet("Precimac Reports");
      sheet.columns = [
        { header: "Sr. No.", key: "srNo", width: 10 },
        { header: "Date", key: "date", width: 15 },
        { header: "Time", key: "time", width: 12 },
        { header: "Engineer Name", key: "agentName", width: 20 },
        { header: "Project ID", key: "projectId", width: 15 },
        { header: "Project Name", key: "projectName", width: 25 },
        { header: "Customer", key: "customer", width: 20 },
        { header: "Work Done", key: "workDone", width: 40 },
        { header: "Status", key: "status", width: 15 },
        { header: "Next action from Precimac", key: "nextActionFromPrecimac", width: 25 },
        { header: "Next action from Customer", key: "nextActionFromCustomer", width: 25 },
        { header: "Location", key: "location", width: 25 },
      ];
      sheet.getRow(1).font = { bold: true };
    }

    const createdAt = new Date(report.createdAt || Date.now());
    const date = createdAt.toLocaleDateString();
    const time = createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    sheet.addRow({
      srNo: sheet.rowCount,
      date,
      time,
      agentName: report.createdBy || "N/A",
      projectId: report.projectNumber,
      projectName: report.projectName,
      customer: report.customer,
      workDone: Array.isArray(report.workDone) ? report.workDone.join(", ") : report.workDone,
      status: report.status,
      nextActionFromPrecimac: report.nextActionFromPrecimac || "Pending",
      nextActionFromCustomer: report.nextActionFromCustomer || "Pending",
      location: report.location?.address || "N/A",
    });

    await workbook.xlsx.writeFile(tempPath);

    // Step 3: Re-upload
    await uploadReportToDrive(tempPath, TEMP_NAME);

    fs.unlinkSync(tempPath);
    console.log("✅ Excel updated and pushed to Drive");
  } catch (err) {
    console.error("❌ Error in appendReportToExcelDrive:", err);
  } finally {
    release();
  }
}

module.exports = {
  appendReportToExcelDrive,
};
