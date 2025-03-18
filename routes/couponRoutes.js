const express = require("express");
const Coupon = require("../models/Coupon");
const router = express.Router();

// Middleware to prevent abuse (IP and Cookie-based tracking)
const checkAbuse = async (req, res, next) => {
  const userIp = req.ip;

  // ✅ Check if this user has already claimed a coupon in the last 10 minutes
  const existingClaim = await Coupon.findOne({
    assignedTo: userIp,
    updatedAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) }, // Last 10 minutes
  });

  if (existingClaim) {
    return res.status(429).json({
      message:
        "⏳ You have recently claimed a coupon. Please wait 10 minutes before claiming again.",
    });
  }

  // ✅ Browser-based restriction (Prevents spam from same browser)
  if (req.cookies && req.cookies.claimed) {
    return res.status(429).json({
      message: "⏳ Please wait 10 minutes before claiming another coupon! (Browser limit)",
    });
  }

  next();
};

// ✅ Get available coupons (For Users to Choose)
router.get("/available", async (req, res) => {
  try {
    const coupons = await Coupon.find({ status: "available" }); // Only fetch available ones
    res.json(coupons);
  } catch (err) {
    console.error("❌ Error fetching available coupons:", err);
    res.status(500).json({ message: "Server error while fetching available coupons" });
  }
});

// ✅ Claim an available coupon (Each user gets a different one)
router.get("/claim", checkAbuse, async (req, res) => {
  try {
    const coupon = await Coupon.findOneAndUpdate(
      { status: "available" }, // ✅ Find an available coupon
      { status: "claimed", assignedTo: req.ip, updatedAt: new Date() }, // Assign to user
      { new: true }
    );

    if (!coupon) {
      return res.status(404).json({
        message: "❌ No coupons available at the moment. Please try again later.",
      });
    }

    // ✅ Set a cookie to prevent additional claims from the same browser for 10 minutes
    res.cookie("claimed", true, { maxAge: 10 * 60 * 1000, httpOnly: true });

    res.json({ message: "🎉 Coupon successfully claimed!", coupon: coupon.code });
  } catch (err) {
    console.error("❌ Error claiming coupon:", err);
    res.status(500).json({ message: "Error while claiming coupon" });
  }
});

// ✅ Claim a specific coupon by ID
router.put("/claim/:id", checkAbuse, async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findOneAndUpdate(
      { _id: id, status: "available" }, // Find a specific available coupon
      { status: "claimed", assignedTo: req.ip, updatedAt: new Date() }, // Assign to user
      { new: true }
    );

    if (!coupon) {
      return res.status(404).json({ message: "❌ Coupon not found or already claimed." });
    }

    res.cookie("claimed", true, { maxAge: 10 * 60 * 1000, httpOnly: true });
    res.json({ message: "🎉 Coupon claimed successfully!", coupon });
  } catch (err) {
    console.error("❌ Error claiming coupon:", err);
    res.status(500).json({ message: "Error while claiming coupon" });
  }
});

// ✅ Admin - Add new coupons
router.post("/admin/add", async (req, res) => {
  try {
    const { code } = req.body;
    const newCoupon = new Coupon({ code, status: "available" });
    await newCoupon.save();
    res.status(201).json({ message: "✅ Coupon added successfully!" });
  } catch (err) {
    console.error("❌ Error adding coupon:", err);
    res.status(500).json({ message: "Error while adding coupon" });
  }
});

module.exports = router;
