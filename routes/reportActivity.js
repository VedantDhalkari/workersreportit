// routes/reportActivity.js
const express = require("express");
const router = express.Router();
const { ReportActivity } = require("./models/models");
const authenticateToken = require("../middlewares/authenticateToken");

// Fetch activities for a report
router.get("/:reportId", authenticateToken, async (req, res) => {
  try {
    const activity = await ReportActivity.findOne({
      report: req.params.reportId,
    }).populate("comments.user", "name");
    res.json(activity || { comments: [] });
  } catch (err) {
    console.error("Fetch activity error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Post a comment to a report
router.post("/:reportId/comment", authenticateToken, async (req, res) => {
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
});

module.exports = router;
