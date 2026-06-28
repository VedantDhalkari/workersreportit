// backend/models/models.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * User Schema
 * - roles: admin, field-agent, manager
 * - 2FA optional
 * - approval flow (admin must approve before login)
 * - password reset tokens with TTL index
 */
const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true }, // store hashed pw!
    contact: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "project-engineer", "project-manager","electrician","fitter"],
      default: "project-engineer",
    },
    isApproved: { type: Boolean, default: false },
    // Two‐Factor Auth (e.g. TOTP secret)
    twoFactor: {
      enabled: { type: Boolean, default: false },
      secret: { type: String },
    },
    // Password reset
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  {
    timestamps: true,
  }
);

// auto-delete password reset tokens when expired
UserSchema.index({ resetPasswordExpires: 1 }, { expireAfterSeconds: 0 });

/**
 * Report Schema
 * - each entry from a field agent
 * - geolocation
 * - priority
 * - timestamps
 */
// const ReportSchema = new Schema(
//   {
//     agent: {
//       type: Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },
//     projectNumber: { type: String, required: true, index: true },
//     customer: { type: String, default: "" },

//     // accept an array of strings
//     workDone: {
//       type: [String],
//       default: [],
//     },

//     priority: {
//       type: String,
//       enum: ["low", "medium", "high"],
//       default: "medium",
//     },

//     // make the entire location object optional
//     location: {
//       type: {
//         latitude: Number,
//         longitude: Number,
//       },
//       required: false,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

const ReportSchema = new Schema(
  {
    // 👷‍♂️ Who submitted the report (their user _id)
    agent: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // 🏷️ Project name (required)
    projectName: {
      type: String,
      required: true,
      index: true,
    },

    projectNumber: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    customer: {
      type: String,
      default: "",
    },

    // ✅ Array of work entries
    workDone: {
      type: [String],
      default: [],
    },

    // 🔖 Priority (required)
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      required: true,
    },

    // 🚦 Status (required)
    status: {
      type: String,
      enum: ["Open", "In-Progress", "Done", "Closed"],
      default: "Open",
      required: true,
    },

    // 👤 Name of the user who created this report
    createdBy: {
      type: String,
      required: true,
    },

    // 🌍 Geolocation (optional)
    location: {
      type: {
        latitude: Number,
        longitude: Number,
        address: String,
      },
      required: false,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

/**
 * ActivityLog Schema
 * - track user actions: login, logout, report‐submit, etc.
 */
const ActivityLogSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: { type: String, required: true },
    ip: { type: String },
    userAgent: { type: String },
  },
  {
    timestamps: true,
  }
);

/**
 * Session Schema
 * - manual session store for timeout / invalidation
 * - TTL index on expiresAt
 */
const SessionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  valid: { type: Boolean, default: true },
});

// auto-remove expired sessions
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// at the bottom of backend/models/models.js

const TimeSpentSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    minutes: {
      type: Number,
      default: 0,
      // total cumulative minutes
    },
  },
  { timestamps: true }
);

const ImageSchema = new Schema(
  {
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
  },
  { _id: false }
);

const ReportImageSchema = new Schema(
  {
    report: { type: Schema.Types.ObjectId, ref: "Report", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    images: {
      type: [ImageSchema],
      validate: [(arr) => arr.length <= 5, "Up to 5 images only"],
    },
  },
  { timestamps: true }
);


const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const reportActivitySchema = new mongoose.Schema({
  report: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true },
  comments: [commentSchema],
});

//Mobile Device Info Schema
// - track devices used by users
const DeviceInfoSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    macId: {
      type: String,
      required: true,
      unique: true,
    },
    deviceName: { type: String, required: true },
    hasLoggedInOnce: { type: Boolean, default: false },
  },
  { timestamps: true }
);





// Export all models
module.exports = {
  User: mongoose.model("User", UserSchema),
  Report: mongoose.model("Report", ReportSchema),
  ActivityLog: mongoose.model("ActivityLog", ActivityLogSchema),
  Session: mongoose.model("Session", SessionSchema),
  TimeSpent: mongoose.model("TimeSpent", TimeSpentSchema),
  ReportImage: mongoose.model("ReportImage", ReportImageSchema),
  ReportActivity: mongoose.model('ReportActivity', reportActivitySchema),
  DeviceInfo: mongoose.model("DeviceInfo", DeviceInfoSchema),

};
