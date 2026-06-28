
// // backend/service/googleDrive.js
// const fs = require("fs");
// const { google } = require("googleapis");
// require("dotenv").config();

// const {
//   GOOGLE_CLIENT_ID,
//   GOOGLE_CLIENT_SECRET,
//   GOOGLE_REFRESH_TOKEN,
//   GOOGLE_REDIRECT_URI,
//   GOOGLE_DRIVE_FOLDER_ID,
// } = process.env;

// // STEP 1: Setup OAuth2 Client
// const oAuth2Client = new google.auth.OAuth2(
//   GOOGLE_CLIENT_ID,
//   GOOGLE_CLIENT_SECRET,
//   GOOGLE_REDIRECT_URI
// );

// oAuth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

// const drive = google.drive({ version: "v3", auth: oAuth2Client });

// // STEP 2: Upload function
// // async function uploadReportToDrive(filePath, fileName, mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
// //   try {
// //     const fileMetadata = {
// //       name: fileName,
// //       parents: [GOOGLE_DRIVE_FOLDER_ID], // upload to the target folder
// //     };

// //     const media = {
// //       mimeType,
// //       body: fs.createReadStream(filePath),
// //     };

// //     const response = await drive.files.create({
// //       requestBody: fileMetadata,
// //       media,
// //       fields: "id, name",
// //     });

// //     console.log("✅ File uploaded to Drive:", response.data);
// //     return response.data.id;
// //   } catch (err) {
// //     console.error("❌ Drive upload failed:", err.message);
// //     throw err;
// //   }
// // }

// async function uploadReportToDrive(filePath, fileName, mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
//   try {
//     // Step 1: Search for existing file with the same name
//     const list = await drive.files.list({
//       q: `name='${fileName}' and '${GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed = false`,
//       fields: "files(id, name)",
//       spaces: "drive",
//     });

//     const existingFile = list.data.files?.[0];

//     const media = {
//       mimeType,
//       body: fs.createReadStream(filePath),
//     };

//     if (existingFile) {
//       // Step 2A: If exists, update it
//       const response = await drive.files.update({
//         fileId: existingFile.id,
//         media,
//       });

//       console.log("✅ File updated on Drive:", response.data);
//       return response.data.id;
//     } else {
//       // Step 2B: If not exists, create new
//       const response = await drive.files.create({
//         requestBody: {
//           name: fileName,
//           parents: [GOOGLE_DRIVE_FOLDER_ID],
//         },
//         media,
//         fields: "id, name",
//       });

//       console.log("✅ New file created on Drive:", response.data);
//       return response.data.id;
//     }
//   } catch (err) {
//     console.error("❌ Drive upload failed:", err.message);
//     throw err;
//   }
// }


// module.exports = { uploadReportToDrive };


// backend/service/googleDrive.js
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

require("dotenv").config();

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
  GOOGLE_REDIRECT_URI,
  GOOGLE_DRIVE_FOLDER_ID,
} = process.env;

// ✅ OAuth2 setup
const oAuth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

const drive = google.drive({ version: "v3", auth: oAuth2Client });

/**
 * ✅ Upload or update Excel file on Google Drive
 */
async function uploadReportToDrive(
  filePath,
  fileName,
  mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
) {
  try {
    const list = await drive.files.list({
      q: `name='${fileName}' and '${GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed = false`,
      fields: "files(id, name)",
      spaces: "drive",
    });

    const existingFile = list.data.files?.[0];

    const media = {
      mimeType,
      body: fs.createReadStream(filePath),
    };

    if (existingFile) {
      const response = await drive.files.update({
        fileId: existingFile.id,
        media,
      });
      console.log("✅ File updated on Drive:", response.data);
      return response.data.id;
    } else {
      const response = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [GOOGLE_DRIVE_FOLDER_ID],
        },
        media,
        fields: "id, name",
      });
      console.log("✅ New file created on Drive:", response.data);
      return response.data.id;
    }
  } catch (err) {
    console.error("❌ Drive upload failed:", err.message);
    throw err;
  }
}

/**
 * ✅ Find a file by name in target folder
 */
async function getDriveFileByName(fileName) {
  try {
    const list = await drive.files.list({
      q: `name='${fileName}' and '${GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed = false`,
      fields: "files(id, name)",
      spaces: "drive",
    });

    return list.data.files?.[0] || null;
  } catch (err) {
    console.error("❌ Error finding file on Drive:", err.message);
    return null;
  }
}

/**
 * ✅ Download a Drive file by ID into localPath
 */
// ... existing code ...

async function downloadDriveFile(fileId) {
  try {
    const tempPath = path.join(__dirname, `../temp_download_${Date.now()}.xlsx`);
    const dest = fs.createWriteStream(tempPath);

    const res = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" }
    );

    // Wait for download and grab the buffer
    const buffer = await new Promise((resolve, reject) => {
      res.data
        .pipe(dest)
        .on("finish", () => {
          const buf = fs.readFileSync(tempPath);
          fs.unlinkSync(tempPath);
          resolve(buf);
        })
        .on("error", reject);
    });
console.log("✅ File  buffer:", buffer);
    return buffer;              // ←🔥 THIS LINE
  } catch (err) {
    console.error("❌ Error downloading file:", err);
    throw err;
  }
}


module.exports = {
  uploadReportToDrive,
  getDriveFileByName,
  downloadDriveFile,
};
