const express = require("express");
const Coupon = require("../models/Coupon");
const router = express.Router();

// ✅ Middleware to Prevent Abuse - Now Checks User Per Coupon
const checkAbuse = async (req, res, next) => {
  const userIp = req.ip;

  // ✅ Check if user already owns an **active** (unexpired) coupon
  const existingClaim = await Coupon.findOne({
    assignedTo: userIp,
    updatedAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) }, // Last 10 min
    status: "claimed",
  });

  if (existingClaim) {
    return res.status(429).json({
      message: "⏳ You have recently claimed a coupon. Wait 10 minutes before claiming again.",
    });
  }

  next();
};

// ✅ Get Available Coupons for Users
router.get("/available", async (req, res) => {
  try {
    const coupons = await Coupon.find({ status: "available" });
    res.json(coupons);
  } catch (err) {
    console.error("❌ Error fetching available coupons:", err);
    res.status(500).json({ message: "Server error while fetching available coupons." });
  }
});

// ✅ Claim an Available Coupon (Allows Multiple Users)
router.get("/claim", checkAbuse, async (req, res) => {
  try {
    const userIp = req.ip;

    // ✅ Get the first available coupon
    const coupon = await Coupon.findOneAndUpdate(
      { status: "available" }, // Find an available coupon
      { status: "claimed", assignedTo: userIp, updatedAt: new Date() }, // Assign to user
      { new: true }
    );

    if (!coupon) {
      return res.status(404).json({
        message: "❌ No coupons available at the moment. Try again later.",
      });
    }

    // ✅ Set a cookie to prevent multiple claims for 10 minutes
    res.cookie("claimed", true, { maxAge: 10 * 60 * 1000, httpOnly: true });

    res.json({ message: "🎉 Coupon successfully claimed!", coupon: coupon.code });
  } catch (err) {
    console.error("❌ Error claiming coupon:", err);
    res.status(500).json({ message: "Error while claiming coupon." });
  }
});

// ✅ Claim a Specific Coupon by ID
router.put("/claim/:id", checkAbuse, async (req, res) => {
  try {
    const { id } = req.params;
    const userIp = req.ip;

    const coupon = await Coupon.findOneAndUpdate(
      { _id: id, status: "available" },
      { status: "claimed", assignedTo: userIp, updatedAt: new Date() },
      { new: true }
    );

    if (!coupon) {
      return res.status(404).json({ message: "❌ Coupon not found or already claimed." });
    }

    res.cookie("claimed", true, { maxAge: 10 * 60 * 1000, httpOnly: true });

    res.json({ message: "🎉 Coupon claimed successfully!", coupon });
  } catch (err) {
    console.error("❌ Error claiming coupon:", err);
    res.status(500).json({ message: "Error while claiming coupon." });
  }
});

// ✅ Admin - Add New Coupons
router.post("/admin/add", async (req, res) => {
  try {
    const { code } = req.body;
    const newCoupon = new Coupon({ code, status: "available" });
    await newCoupon.save();
    res.status(201).json({ message: "✅ Coupon added successfully!" });
  } catch (err) {
    console.error("❌ Error adding coupon:", err);
    res.status(500).json({ message: "Error while adding coupon." });
  }
});

module.exports = router;
