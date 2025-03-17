const express = require("express");
const Coupon = require("../models/Coupon");
const router = express.Router();

// Middleware to prevent abuse (IP and Cookie-based tracking)
const checkAbuse = async (req, res, next) => {
  const userIp = req.ip;

  // Check IP-based abuse: if a coupon has already been claimed from this IP
  const existingClaim = await Coupon.findOne({ assignedTo: userIp });
  if (existingClaim) {
    return res.status(429).json({ message: "Wait before claiming again! (IP limit)" });
  }

  // Check cookie-based abuse: if a "claimed" cookie exists, block the claim
  if (req.cookies && req.cookies.claimed) {
    return res.status(429).json({ message: "Wait before claiming again! (Browser limit)" });
  }

  next();
};

// Get available coupons (For Users to Choose)
router.get("/available", async (req, res) => {
  try {
    const coupons = await Coupon.find({ status: "available" });
    res.json(coupons);
  } catch (err) {
    console.error("Error fetching available coupons:", err);
    res.status(500).json({ message: "Error fetching available coupons" });
  }
});

// Get available coupon (Round Robin - Auto Assign)
router.get("/claim", checkAbuse, async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ status: "available" }).sort({ timestamp: 1 });
    if (!coupon) {
      return res.status(404).json({ message: "No coupons available" });
    }

    // Mark coupon as claimed and record the IP address
    coupon.status = "claimed";
    coupon.assignedTo = req.ip;
    await coupon.save();

    // Set a cookie to prevent additional claims from the same browser for a cooldown period (e.g., 1 minute)
    res.cookie("claimed", true, { maxAge: 60000, httpOnly: true });

    res.json({ coupon: coupon.code });
  } catch (err) {
    console.error("Error claiming coupon:", err);
    res.status(500).json({ message: "Error claiming coupon" });
  }
});

// Admin - Add new coupons
router.post("/admin/add", async (req, res) => {
  try {
    const { code } = req.body;
    const newCoupon = new Coupon({ code, status: "available" });
    await newCoupon.save();
    res.status(201).json({ message: "Coupon added successfully" });
  } catch (err) {
    console.error("Error adding coupon:", err);
    res.status(500).json({ message: "Error adding coupon" });
  }
});

module.exports = router;
