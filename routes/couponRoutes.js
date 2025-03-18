const express = require("express");
const Coupon = require("../models/Coupon");
const router = express.Router();

// Middleware to prevent abuse (IP and Cookie-based tracking)
const checkAbuse = async (req, res, next) => {
  const userIp = req.ip;

  // ✅ Allow new claims after 10 minutes
  const existingClaim = await Coupon.findOne({
    assignedTo: userIp,
    updatedAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // 10 minutes cooldown
  });

  if (existingClaim) {
    return res.status(429).json({ message: "⏳ You have recently claimed a coupon. Please wait 10 minutes before claiming again." });
  }

  // ✅ Reduce cookie restriction to 10 minutes
  if (req.cookies && req.cookies.claimed) {
    return res.status(429).json({ message: "⏳ Please wait 10 minutes before claiming another coupon! (Browser limit)" });
  }

  next();
};

// Get available coupons (For Users to Choose)
router.get("/available", async (req, res) => {
  try {
    const coupons = await Coupon.find({ status: "available" });
    res.json(coupons);
  } catch (err) {
    console.error("❌ Error fetching available coupons:", err);
    res.status(500).json({ message: "Server error while fetching available coupons" });
  }
});

// Get available coupon (Round Robin - Auto Assign)
router.get("/claim", checkAbuse, async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ status: "available" }).sort({ timestamp: 1 });
    if (!coupon) {
      return res.status(404).json({ message: "❌ No coupons available at the moment. Please try again later." });
    }

    // Mark coupon as claimed and record the IP address
    coupon.status = "claimed";
    coupon.assignedTo = req.ip;
    await coupon.save();

    // Set a cookie to prevent additional claims from the same browser for 10 minutes
    res.cookie("claimed", true, { maxAge: 10 * 60 * 1000, httpOnly: true });

    res.json({ message: "🎉 Coupon successfully claimed!", coupon: coupon.code });
  } catch (err) {
    console.error("❌ Error claiming coupon:", err);
    res.status(500).json({ message: "Error while claiming coupon" });
  }
});

// Claim a specific coupon by ID
router.put("/claim/:id", checkAbuse, async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findOne({ _id: id, status: "available" });

    if (!coupon) {
      return res.status(404).json({ message: "❌ Coupon not found or already claimed." });
    }

    // Mark coupon as claimed
    coupon.status = "claimed";
    coupon.assignedTo = req.ip;
    await coupon.save();

    res.cookie("claimed", true, { maxAge: 10 * 60 * 1000, httpOnly: true });
    res.json({ message: "🎉 Coupon claimed successfully!", coupon });
  } catch (err) {
    console.error("❌ Error claiming coupon:", err);
    res.status(500).json({ message: "Error while claiming coupon" });
  }
});

// Admin - Add new coupons
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
