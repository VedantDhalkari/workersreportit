// 📁 backend/service/googleSheetsAppend.js

const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

// --- Google Auth ---
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

// --- Spreadsheet Info ---
const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
const sheetName = 'Precimac Reports';
const range = `'${sheetName}'`; // Tab name (quoted for safety)

// --- Main Append Function ---
async function appendReport(report) {
  const now = new Date(report.createdAt || Date.now());

  // 🕒 Format date and time in IST (12hr format)
  const date = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });

  const time = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });

  // 🧾 Row structure (Sr. No left blank for formula)
  const row = [
    '', // Let Google Sheet formula auto-increment Sr. No.
    date,
    time,
    report.createdBy || '-',
    report.projectNumber || '-',
    report.projectName || '-',
    report.customer || '-',
    Array.isArray(report.workDone)
      ? report.workDone.join(', ')
      : report.workDone || 'N/A',
    report.status || 'Pending',
    report.nextActionFromPrecimac || '-',
    report.nextActionFromCustomer || '-',
    report.location?.address || 'Unknown',
  ];

  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      // insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [row],
        majorDimension: 'ROWS',
      },
    });

    console.log('✅ Report appended to Google Sheet:', response.statusText);
    return response.data;
  } catch (error) {
    console.error('❌ Google Sheets Append Error:', error.message);
    if (error.response) {
      console.error('📦 Response:', error.response.data);
      console.error('🚨 Status Code:', error.response.status);
    }
    throw error;
  }
}

module.exports = { appendReport };
