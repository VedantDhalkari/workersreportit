const jwt = require("jsonwebtoken");
const {
  User,
  Session,
  DeviceInfo,
} = require("../models/models");

exports.registerDevice = async (req, res) => {
  console.log(" /api/device/register API called");

  const { macId, deviceName } = req.body;

  if (!macId || !deviceName) {
    return res.status(400).json({ msg: "Missing macId or deviceName" });
  }

  try {
    const existing = await DeviceInfo.findOne({ macId });

    if (existing) {
      return res.status(200).json({ msg: "Device already registered" });
    }

    await DeviceInfo.create({
      user: req.user.id,
      macId,
      deviceName,
      hasLoggedInOnce: true,
    });

    res.status(201).json({ msg: "Device registered" });
  } catch (err) {
    console.error("Device register error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.checkDevice = async (req, res) => {
  console.log(" /api/device/check API called");

  const { macId } = req.body;
  if (!macId) return res.status(400).json({ msg: "Missing macId" });

  try {
    const device = await DeviceInfo.findOne({ macId }).populate("user");

    if (!device || !device.hasLoggedInOnce || !device.user.isApproved) {
      return res.status(404).json({ msg: "No valid device found" });
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
        id: device.user._id,
        name: device.user.name,
        role: device.user.role,
      },
    });
  } catch (err) {
    console.error("Device auto-login error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
