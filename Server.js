// backend/server.js
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { uploadReportToDrive } = require("./service/googleDrive");
const { appendReportToExcelDrive } = require("./service/excelService");
const { appendStyledReportToExcelDrive } = require("./service/exportStyledExcel");
const { appendReport } = require("./service/googleSheetsAppend");
require("dotenv").config();

const {
  User,
  Report,
  ActivityLog,
  Session,
  TimeSpent,
  ReportImage,
  ReportActivity,
  DeviceInfo,
} = require("./models/models");

const app = express();

app.set("trust proxy", true);
app.use(express.json());
// app.use(cors());
app.use(cors({
  origin: '*',
}));


const JWT_SECRET = process.env.JWT_SECRET

const reportUpload = multer({
  dest: path.join(__dirname, "uploads"), // temporary local folder
});

const upload = multer({ dest: "uploads/" });
// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

async function commitTimeForUser(userId) {
  // find all valid sessions
  const sessions = await Session.find({ user: userId, valid: true });
  for (let session of sessions) {
    const deltaMinutes = Math.floor(
      (Date.now() - session.createdAt.getTime()) / 60000
    );
    console.log(`⏱️  Recording ${deltaMinutes}min for session ${session._id}`);

    await TimeSpent.findOneAndUpdate(
      { user: userId },
      { $inc: { minutes: deltaMinutes } },
      { upsert: true, new: true }
    );

    session.valid = false;
    await session.save();
  }
}

async function logActivity(userId, action, req) {
  // Try X-Forwarded-For first, then fall back to req.ip, then socket
  const forwarded = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded)
    ? forwarded[0]
    : typeof forwarded === "string"
      ? forwarded.split(",")[0].trim()
      : req.ip || req.socket.remoteAddress || "unknown";

  await ActivityLog.create({
    user: userId,
    action,
    ip, // now a guaranteed string
    userAgent: req.get("User-Agent"),
  });
}

// Middleware: Authenticate JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.sendStatus(401);
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return res.sendStatus(403);
    req.user = payload; // { id, role }
    next();
  });
}

// Middleware: Admin-only
function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") return res.sendStatus(403);
  next();
}
function requireAgent(req, res, next) {
  const allowedRoles = ["project-engineer", "fitter", "electrician"];
  if (!allowedRoles.includes(req.user.role)) return res.sendStatus(403);
  next();
}


function requireManager(req, res, next) {
  if (req.user.role !== "project-manager") return res.sendStatus(403);
  next();
}

app.get("/", async (req, res) => {
  res.json({ msg: "Welcome to Report-It API!" });
});
// --- AUTH ROUTES ---

// Sign Up
app.post("/api/auth/signup", async (req, res) => {
  const { name, email, password, contact, role } = req.body;
  if (!name || !email || !password || !contact)
    return res.status(400).json({ msg: "Missing fields" });
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ msg: "Email already in use" });

  const hash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    password: hash,
    contact,
    role,
  });
  res.status(201).json({ msg: "Registered — awaiting admin approval" });
});

// Login
app.post("/api/auth/login", async (req, res) => { 
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ msg: "Invalid credentials" });
  if (!user.isApproved)
    return res.status(403).json({ msg: "Account not approved yet" });
  if (!(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ msg: "Invalid credentials" });

  // ✨ Flush any old sessions so timeSpent never resets if they closed browser instead of logging out
  try {
    await commitTimeForUser(user._id);
  } catch (e) {
    console.error("Error committing time on login:", e);
  }

  // Issue JWT
  const payload = { id: user._id, role: user.role };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "8h" });

  // Create new session
  await Session.create({
    user: user._id,
    expiresAt: new Date(Date.now() + 8 * 3600000),
  });

  await logActivity(user._id, "login", req);

  res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
});

// Get profile
// app.get("/api/auth/me", authenticateToken, async (req, res) => {
//   const user = await User.findById(
//     req.user.id,
//     "-password -resetPasswordToken -twoFactor.secret"
//   );
//   res.json({ user });
// });

app.post("/api/auth/logout", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // ✨ Commit time for this session too
    await commitTimeForUser(userId);

    await logActivity(userId, "logout", req);
    return res.json({ msg: "Logged out and time recorded" });
  } catch (err) {
    console.error("Logout Error:", err);
    return res.status(500).json({ msg: "Logout failed" });
  }
});

// --- REPORT ROUTES ---
// Create a report
// backend/server.js (or wherever you define routes)

app.post("/api/reports", authenticateToken, async (req, res) => {
  try {
    // Pull everything off the body that your schema now needs
    const { projectName, projectNumber, customer, workDone, priority, status, location, } =
      req.body;

    // 🔍 Fetch the full user to get their name
    const userDoc = await User.findById(req.user.id).select("name");
    if (!userDoc) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Create the report with ALL required fields
    const report = await Report.create({
      agent: req.user.id,
      createdBy: userDoc.name, // string name
      projectName, // required now
      projectNumber,
      customer,
      workDone,
      priority,
      status, // required now
      location: location && location.latitude && location.longitude
        ? {
          latitude: location.latitude,
          longitude: location.longitude,
           address: location.address || undefined,
        }
        : undefined,
    });

    // Log the creation activity
    await logActivity(req.user.id, "create-report", req);

    // Return the new report
    return res.status(201).json({ report });
  } catch (err) {
    console.error("Error creating report:", err);

    // Duplicate key (unique index) error
    if (err.code === 11000 && err.keyPattern?.projectNumber) {
      return res
        .status(400)
        .json({ field: "projectNumber", msg: "Project number already exists" });
    }

    // Mongoose validation errors
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res
        .status(400)
        .json({ msg: "Validation failed", errors: messages });
    }

    return res.status(500).json({ msg: "Server error" });
  }

});

// Get reports (admin sees all; agents see their own)
app.get("/api/reports", authenticateToken, async (req, res) => {
  // Return absolutely all reports to the client
  const reports = await Report.find({}).populate("agent", "name email role");
  res.json({ reports });
});



//---------- Report Device route end  -----------

// --- ADMIN ROUTES ---

app.get(
  "/api/admin/pending-users",
  authenticateToken,
  requireAdmin,
  async (_req, res) => {
    console.log("Api working of pending users...");
    try {
      const users = await User.find(
        { role: { $ne: "admin" } }, // Exclude admin users
        "name email role createdAt" // Include necessary fields
      ).lean();
      res.json({ users });
    } catch (err) {
      console.error("Error fetching users:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Approve or revoke a user

// ==================================================================================================
// backend/server.js (or routes/users.js)
app.get(
  "/api/admin/users",
  authenticateToken,
  requireAdmin,
  async (_req, res) => {
    try {
      // Fetch every non-admin user, include isApproved flag
      const users = await User.find(
        { role: { $ne: "admin" } },
        "name email role isApproved createdAt"
      ).lean();

      return res.json({ users });
    } catch (err) {
      console.error("Error fetching users:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// Get user details
app.get(
  "/api/admin/users/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      res.json({ user });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Get user-specific logs
app.get(
  "/api/admin/users/:id/logs",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const logs = await ActivityLog.find({ user: req.params.id })
        .sort("-createdAt")
        .lean();
      res.json({ logs });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }
);
// ==================================================================================================

app.post(
  "/api/admin/users/:id/:action",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const { id, action } = req.params;
    // Only allow "approve" or "revoke"
    if (!["approve", "revoke"].includes(action)) {
      return res.status(400).json({ msg: "Invalid action" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isApproved: action === "approve" },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    await logActivity(req.user.id, `${action}-user:${id}`, req);
    res.json({ user });
  }
);

// View activity logs
app.get(
  "/api/admin/logs",
  authenticateToken,
  requireAdmin,
  async (_req, res) => {
    const logs = await ActivityLog.find()
      .populate("user", "name")
      .sort("-createdAt");
    res.json({ logs });
  }
);

app.get(
  "/api/admin/online",
  authenticateToken,
  requireAdmin,
  async (_req, res) => {
    const now = new Date();
    const sessions = await Session.find({
      valid: true,
      expiresAt: { $gt: now },
    }).lean();
    const onlineUsers = [...new Set(sessions.map((s) => s.user.toString()))];
    res.json({ onlineUsers });
  }
);

//==========================DASHBOARD========================

// Example API endpoints
app.get(
  "/api/admin/dashboard-stats",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const stats = {
        totalUsers: await User.countDocuments(),
        pendingApprovals: await User.countDocuments({ isApproved: false }),
        activeReports: await Report.countDocuments({
          status: { $in: ["Open", "In-Progress"] },
        }),
      };
      res.json({ stats });
    } catch (err) {
      console.error("Dashboard Stats Error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Field‐agent stats (only agents)

app.get(
  "/api/agent/dashboard-stats",
  authenticateToken,
  requireAgent,
  async (req, res) => {
    try {
      const userId = req.user.id || req.user._id;

      const totalReports = await Report.countDocuments({ agent: userId });

      // get the cumulative minutes so far
      const ts = await TimeSpent.findOne({ user: userId }).lean();
      const totalMinutes = ts.minutes;
      console.log("Total minutes:", totalMinutes);

      return res.json({
        totalReports,
        minutes: totalMinutes,
      });
    } catch (err) {
      console.error("Dashboard Stats Error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// Manager stats (only managers)
app.get(
  "/api/manager/dashboard-stats",
  authenticateToken,
  requireManager,
  async (req, res) => {
    try {
      const stats = {
        teamReports: await Report.countDocuments(),
        completedProjects: await Report.countDocuments({
          status: "Done",
        }),
        ongoingProjects: await Report.countDocuments({
          status: "In-Progress",
        }),
      };
      res.json({ stats });
    } catch (err) {
      console.error("Dashboard Stats Error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// POST /api/reports/upload-img-blob
app.post(
  "/api/reports/upload-img-blob",
  authenticateToken,
  upload.array("images", 5),
  async (req, res) => {
    try {
      const { reportId } = req.body;
      if (!reportId) {
        return res.status(400).json({ msg: "reportId is required" });
      }

      // Build image docs from buffer + mimetype
      const images = req.files.map((f) => {
        const fileData = fs.readFileSync(f.path);
        const imageObj = {
          data: fileData,
          contentType: f.mimetype,
        };
        // Clean up temporary file
        try { fs.unlinkSync(f.path); } catch (e) { console.error("Unlink error:", e); }
        return imageObj;
      });

      // Create the document
      const doc = await ReportImage.create({
        report: reportId,
        user: req.user.id,
        images,
      });

      res.json({
        msg: "Images uploaded as blobs!",
        count: doc.images.length,
      });
    } catch (err) {
      console.error("Error uploading blobs:", err);
      res.status(500).json({ msg: "Server error during image upload" });
    }
  }
);

// routes/images.js

app.get("/api/reports/:id/images", async (req, res) => {
  try {
    const reportId = req.params.id;
    const imageDocs = await ReportImage.find({ report: reportId });

    if (!imageDocs.length) {
      return res.status(404).json({ msg: "No images found for this report" });
    }

    const payload = imageDocs.flatMap((doc) =>
      doc.images.map((img) => ({
        contentType: img.contentType,
        data: img.data.toString("base64"),
      }))
    );

    res.json({ images: payload });
  } catch (err) {
    console.error("Error fetching images:", err);
    res.status(500).json({ msg: "Server error during image fetch" });
  }
});


// Fetch activities
app.get(
  "/api/report-activity/:reportId",
  authenticateToken,
  async (req, res) => {
    try {
      const activity = await ReportActivity.findOne({
        report: req.params.reportId,
      }).populate("comments.user", "name role");
      res.json(activity || { comments: [] });
    } catch (err) {
      console.error("Fetch activity error:", err);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

// Post a comment
app.post(
  "/api/report-activity/:reportId/comment",
  authenticateToken,
  async (req, res) => {
    try {
      const { message } = req.body;
      if (!message)
        return res.status(400).json({ msg: "Comment cannot be empty" });

      let activity = await ReportActivity.findOne({
        report: req.params.reportId,
      });

      if (!activity) {
        activity = new ReportActivity({
          report: req.params.reportId,
          comments: [],
        });
      }

      activity.comments.push({ user: req.user.id, message });
      await activity.save();

      res.status(201).json({ msg: "Comment added", activity });
    } catch (err) {
      console.error("Add comment error:", err);
      res.status(500).json({ msg: "Server error" });
    }
  }
);


//Mobile Device Info
// =========================================================================================================

// --- DEVICE ROUTES ---
// Register device (first login from app)


app.post("/api/device/register", async (req, res) => {
  console.log(" /api/device/register API called");

  const { macId, deviceName, userId } = req.body;

  if (!macId || !deviceName || !userId) {
    return res.status(400).json({ msg: "Missing macId, deviceName, or userId" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // 💣 Prevent reuse of same macId (by any user)
    const existingMac = await DeviceInfo.findOne({ macId });
    if (existingMac) {
      return res.status(409).json({ msg: "❌ Device already registered by another user" });
    }

    // 💣 Prevent user from registering another device (1 device per user)
    const existingDevice = await DeviceInfo.findOne({ user: userId });
    if (existingDevice) {
      return res.status(403).json({
        msg: "❌ You have already registered a device. Only 1 device is allowed per user.",
      });
    }

    // ❗Only mark user as unapproved if currently approved
    if (user.isApproved) {
      await User.findByIdAndUpdate(userId, {
        isApproved: false,
        deviceNote: "Login attempt from a new device - admin approval required",
      });
    }

    // ✅ Register device
    await DeviceInfo.create({
      user: userId,
      macId,
      deviceName,
      hasLoggedInOnce: true,
    });

    
    return res.status(201).json({
      msg: "✅ Device registered successfully. Awaiting admin approval.",
    });

  } catch (err) {
    console.error("❌ Device register error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
});





app.post("/api/device/check", async (req, res) => {
  console.log(" /api/device/check API called");

  const { macId } = req.body;
  if (!macId) return res.status(400).json({ msg: "Missing macId" });

  try {
    const device = await DeviceInfo.findOne({ macId }).populate("user");

    if (!device) {
      return res.status(404).json({ msg: "Device not registered. Contact admin." });
    }

    if (!device.user) {
      return res.status(404).json({ msg: "User linked to device not found" });
    }

    if (!device.hasLoggedInOnce) {
      return res.status(403).json({ msg: "Device not authorized" });
    }

    if (!device.user.isApproved) {
      return res.status(403).json({ msg: "User not approved by admin" });
    }

    const token = jwt.sign(
      { id: device.user._id, role: device.user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    await Session.create({
      user: device.user._id,
      expiresAt: new Date(Date.now() + 8 * 3600000),
    });

    await logActivity(device.user._id, "auto-login", req);

    res.json({
      token,
      user: {
        _id: device.user._id, // 👈 FIXED HERE
        name: device.user.name,
        role: device.user.role,
      },
    });
  } catch (err) {
    console.error("❌ Device auto-login error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});




app.get("/api/auth/me-list", async (req, res) => {
  console.log(" /me-list API called");
  try {
    const users = await User.find({ isApproved: true }).select("name contact isApproved role");

    // Attach JWT token to each user
    const usersWithTokens = users.map(user => ({
      _id: user._id,
      name: user.name,
      contact: user.contact,
      role: user.role,
      isApproved: user.isApproved,
      token: jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" }) // 🔑 Add token
    }));

    res.json({ users: usersWithTokens });
  } catch (err) {
    console.error("Error fetching users list:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get currently logged-in user info
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  // console.log(" /me API called");
  try {
    const user = await User.findById(req.user.id).select("name role");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.json({
      name: user.name,
      role: user.role,
      // employeeId: user.employeeId || null,
      date: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error fetching current user info:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

//---------- Report Device route -----------

// app.post("/api/device/reports", authenticateToken, async (req, res) => {
//   console.log(" /api/device/reports API called");
//   try {
//     const { projectName, projectNumber, customer, workDone, priority, status, location } = req.body;

//     const userDoc = await User.findById(req.user.id).select("name");
//     if (!userDoc) return res.status(404).json({ msg: "User not found" });

//     const report = {
//       createdAt: new Date(),
//       createdBy: userDoc.name,
//       projectNumber,
//       projectName,
//       customer,
//       workDone,
//       status,
//       priority,
//       location: location?.address ? location : { address: "Unknown" },
//     };

//     // ✅ Append to Excel
//     appendReportToExcelDrive(report).catch((err) =>
//       console.error("Excel append error:", err)
//     );

//     await logActivity(req.user.id, "device-report-excel-only", req);

//     // ✅ Always return a consistent JSON structure
//     return res.status(201).json({
//       msg: "Report received and exported to Excel.",
//       report: null,  // Important: return 'report' key even if null
//     });
//   } catch (err) {
//     console.error("Device Report Error:", err);
//     return res.status(500).json({ msg: "Server error" });
//   }
// });


// app.post("/api/device/reports", authenticateToken, async (req, res) => {
//   try {
//     const { projectName, projectNumber, customer, workDone, status, location, nextActionFromPrecimac, nextActionFromCustomer } = req.body;

//     // ✅ Fetch user name from auth
//     const userDoc = await User.findById(req.user.id).select("name");
//     if (!userDoc) return res.status(404).json({ msg: "User not found" });

//     // ✅ Compose the report (no DB storage)
//     const report = {
//       createdAt: new Date(),
//       createdBy: userDoc.name,
//       projectNumber,
//       projectName,
//       customer,
//       workDone,
//       status,
//       nextActionFromPrecimac,
//       nextActionFromCustomer,
//       location: location?.address ? location : { address: "Unknown" },
//     };

//     // ✅ Send to Excel only
//     await appendReportToExcelDrive(report);

//     // ✅ Log user action
//     await logActivity(req.user.id, "device-report-excel-only", req);

//     return res.status(201).json({ msg: "Report received and exported to Excel.", report });
//   } catch (err) {
//     console.error("Device Report Error:", err);
//     return res.status(500).json({ msg: "Server error" });
//   }
// });

// 📁 /api/device/upload-to-drive
app.post("/api/device/upload-to-drive", authenticateToken, async (req, res) => {
  try {
    const {
      projectName,
      projectNumber,
      customer,
      workDone,
      status,
      location,
      nextActionFromPrecimac,
      nextActionFromCustomer,
    } = req.body;

    // ✅ Get user name from token
    const userDoc = await User.findById(req.user.id).select("name");
    if (!userDoc) return res.status(404).json({ msg: "User not found" });

    const report = {
      createdAt: new Date(),
      createdBy: userDoc.name,
      projectNumber,
      projectName,
      customer,
      workDone,
      status,
      nextActionFromPrecimac,
      nextActionFromCustomer,
      location: location?.address ? location : { address: "Unknown" },
    };

    // ✅ Styled Excel + Upload
    await appendReport(report);
    // await appendStyledReportToExcelDrive(report);

    // ✅ Log activity
    await logActivity(req.user.id, "device-report-upload-to-drive", req);

    return res.status(201).json({ msg: "Report exported to Drive." });
  } catch (err) {
    console.error("❌ Upload-to-Drive Error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
});


// --- EXPORTS ---





app.post("/api/upload-to-drive", upload.single("report"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).send("No file received");

    const fileId = await uploadReportToDrive(file.path, file.originalname, file.mimetype);

    // Optional: delete local file after uploading
    fs.unlink(file.path, () => null);

    res.status(200).json({ message: "File uploaded", fileId });
  } catch (err) {
    console.error("Drive upload error:", err);
    res.status(500).json({ error: err.message });
  }
});



// 404 handler
app.use((_, res) => res.status(404).json({ msg: "Not Found" }));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
