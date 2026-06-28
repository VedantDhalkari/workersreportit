// // src/components/exportStyledExcel.jsx
// import * as ExcelJS from "exceljs";
// import { saveAs } from "file-saver";
// import axios from "axios";
// import { API } from "../context/AuthContext";

// /**
//  * Converts a Base64 string to a Uint8Array.
//  * @param {string} base64 - The base64 encoded string.
//  * @returns {Uint8Array}
//  */
// function base64ToUint8Array(base64) {
//   try {
//     const binaryString = atob(base64);
//     const len = binaryString.length;
//     const bytes = new Uint8Array(len);
//     for (let i = 0; i < len; i++) {
//       bytes[i] = binaryString.charCodeAt(i);
//     }
//     return bytes;
//   } catch (error) {
//     console.error("Failed to decode base64 string:", error);
//     return new Uint8Array(0); // Return empty array on failure
//   }
// }

// async function uploadToDrive(fileBlob) {
//   const formData = new FormData();
//   formData.append("report", fileBlob, "precimac_reports_online.xlsx");

//   try {
//     await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/upload-to-drive`, formData);
//     alert("Uploaded to Google Drive!");
//   } catch (err) {
//     console.error("Drive upload error:", err);
//     alert("Failed to upload to Drive.");
//   }
// }




// export function useStyledExport(data) {
//   const exportStyledExcel = async () => {
//     if (!data || !data.length) {
//       return alert("No reports to export! 📭");
//     }

//     // --- STEP 1: Fetch all images concurrently ---
//     console.log("Fetching images for reports...");
//     const imagePromises = data.map((report) =>
//       API.get(`/reports/${report._id}/images`)
//         .then((res) => ({ reportId: report._id, images: res.data.images || [] }))
//         .catch((err) => {
//           console.warn(`Could not fetch images for report ${report._id}:`, err);
//           return { reportId: report._id, images: [] };
//         })
//     );

//     const settledImages = await Promise.all(imagePromises);
//     const imageMap = {};
//     let maxImages = 0;

//     for (const item of settledImages) {
//       imageMap[item.reportId] = item.images;
//       if (item.images.length > maxImages) {
//         maxImages = item.images.length;
//       }
//     }

//     console.log("Image fetching complete. Max images in any report:", maxImages);

//     // --- STEP 2A: Build the Regular Report Excel (NO IMAGES) ---
//     const wb1 = new ExcelJS.Workbook();
//     const ws1 = wb1.addWorksheet("Precimac Reports");

//     ws1.columns = [
//       { header: "Project ID", key: "projectNumber", width: 15 },
//       { header: "Project Name", key: "projectName", width: 25 },
//       { header: "Agent Name", key: "createdBy", width: 20 },
//       { header: "Customer", key: "customer", width: 20 },
//       { header: "Work Done", key: "workDone", width: 30 },
//       { header: "Date", key: "date", width: 15 },
//       { header: "Status", key: "status", width: 12 },
//       { header: "Priority", key: "priority", width: 12 },
//     ];

//     ws1.getRow(1).font = { bold: true };

//     for (const r of data) {
//       ws1.addRow({
//         projectNumber: r.projectNumber,
//         projectName: r.projectName,
//         createdBy: r.agent?.name || "N/A",
//         customer: r.customer,
//         workDone: Array.isArray(r.workDone) ? r.workDone.join(", ") : r.workDone,
//         date: new Date(r.createdAt).toLocaleDateString(),
//         status: r.status,
//         priority: r.priority,
//       });
//     }

//     ws1.autoFilter = "A1:H1";
//     ws1.views = [{ state: "frozen", ySplit: 1 }];

//     const buffer1 = await wb1.xlsx.writeBuffer();
//     const blob1 = new Blob([buffer1], {
//       type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//     });
//     saveAs(blob1, "precimac_reports_online.xlsx");
//     await uploadToDrive(blob1); // Optional: Remove if not needed

//     // --- STEP 2B: Build the Images Report Excel ---
//     const wb2 = new ExcelJS.Workbook();
//     const ws2 = wb2.addWorksheet("Images Data");

//     // Define static headers
//     const imageColumns = [
//       { header: "Project ID", key: "projectNumber", width: 15 },
//       { header: "Project Name", key: "projectName", width: 25 },
//       { header: "Agent Name", key: "createdBy", width: 20 },
//       { header: "Date Created", key: "date", width: 15 },
//     ];

//     // Add dynamic image columns
//     for (let i = 0; i < maxImages; i++) {
//       imageColumns.push({
//         header: `Image ${i + 1}`,
//         key: `image${i + 1}`,
//         width: 25,
//       });
//     }

//     ws2.columns = imageColumns;
//     ws2.getRow(1).font = { bold: true };

//     for (const r of data) {
//       const row = ws2.addRow({
//         projectNumber: r.projectNumber,
//         projectName: r.projectName,
//         createdBy: r.agent?.name || "N/A",
//         date: new Date(r.createdAt).toLocaleDateString(),
//       });

//       const images = imageMap[r._id] || [];

//       if (images.length > 0) {
//         row.height = 100;

//         for (let j = 0; j < images.length; j++) {
//           try {
//             const imageData = images[j];
//             if (!imageData?.data) continue;

//             const buffer = base64ToUint8Array(imageData.data);
//             if (buffer.length === 0) continue;

//             const extension = imageData.contentType?.split("/")?.[1] || "jpeg";

//             const imageId = wb2.addImage({
//               buffer: buffer,
//               extension: extension,
//             });

//             const imageColumnIndex = 4 + j; // after the 4 static columns
//             ws2.addImage(imageId, {
//               tl: { col: imageColumnIndex, row: row.number - 1 },
//               ext: { width: 130, height: 130 },
//             });
//           } catch (error) {
//             console.error(`Image error for report ${r._id}`, error);
//           }
//         }
//       }
//     }

//     ws2.autoFilter = `A1:${String.fromCharCode(65 + imageColumns.length - 1)}1`;
//     ws2.views = [{ state: "frozen", ySplit: 1 }];

//     const buffer2 = await wb2.xlsx.writeBuffer();
//     const blob2 = new Blob([buffer2], {
//       type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//     });
//     saveAs(blob2, "precimac_images_data.xlsx");
//   };

//   return exportStyledExcel;
// }




// src/components/exportStyledExcel.jsx
import * as ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import axios from "axios";
import { API } from "../context/AuthContext";

async function uploadToDrive(fileBlob) {
  const formData = new FormData();
  formData.append("report", fileBlob, "precimac_reports_online.xlsx");

  try {
    await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/upload-to-drive`, formData);
    alert("Uploaded to Google Drive!");
  } catch (err) {
    console.error("Drive upload error:", err);
    alert("Failed to upload to Drive.");
  }
}

export function useStyledExport(data) {
  const exportStyledExcel = async () => {
    if (!data || !data.length) {
      return alert("No reports to export! 📭");
    }

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Precimac Reports");

    ws.columns = [
      { header: "Sr. No.", key: "srNo", width: 10 },
      { header: "Date", key: "date", width: 15 },
      { header: "Time", key: "time", width: 12 },
      { header: "Engineer Name", key: "agentName", width: 20 },
      { header: "Project ID", key: "projectId", width: 15 },
      { header: "Project Name", key: "projectName", width: 25 },
      { header: "Customer", key: "customer", width: 20 },
      { header: "Work Done", key: "workDone", width: 40 },
      { header: "Status", key: "status", width: 15 },
      { header: "Priority", key: "priority", width: 12 },
      { header: "Location", key: "location", width: 20 },
    ];

    ws.getRow(1).font = { bold: true };

    data.forEach((r, index) => {
      const createdAt = new Date(r.createdAt);
      const date = createdAt.toLocaleDateString();
      const time = createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      ws.addRow({
        srNo: index + 1,
        date: date,
        time: time,
        agentName: r.agent?.name || "N/A",
        projectId: r.projectNumber,
        projectName: r.projectName,
        customer: r.customer,
        workDone: Array.isArray(r.workDone) ? r.workDone.join(", ") : r.workDone,
        status: r.status,
        priority: r.priority,
        location: r.location?.address || "N/A",
      });
    });

    ws.autoFilter = "A1:K1";
    ws.views = [{ state: "frozen", ySplit: 1 }];

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, "precimac_reports_online.xlsx");
    await uploadToDrive(blob);
  };

  return exportStyledExcel;
}
