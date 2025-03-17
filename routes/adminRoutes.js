const express = require("express");
const Admin = require("../models/Admin");
const Coupon = require("../models/Coupon"); // Added missing import for coupons
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const router = express.Router();

// Admin login with debug logs
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("🔍 Debug - Login Attempt:", username);

    const admin = await Admin.findOne({ username });
    if (!admin) {
      console.log("❌ Debug - Admin not found");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare the plain text password with the hashed password stored in the database
    const isMatch = await bcrypt.compare(password, admin.password);
    console.log("🔍 Debug - Password Match:", isMatch);
    if (!isMatch) {
      console.log("❌ Debug - Incorrect Password");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token valid for 1 hour
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } catch (err) {
    console.error("❌ Error during login:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Middleware to verify the admin's JWT token
const verifyToken = (req, res, next) => {
  try {
    let token = req.headers["authorization"];
    if (!token) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Remove "Bearer " prefix if present
    if (token.startsWith("Bearer ")) {
      token = token.slice(7);
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.log("❌ Debug - Invalid Token");
        return res.status(403).json({ message: "Invalid token" });
      }
      req.admin = decoded;
      next();
    });
  } catch (err) {
    console.error("❌ Token verification error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Protected admin route: Get all coupons
router.get("/coupons", verifyToken, async (req, res) => {
  try {
    console.log("🔍 Debug - Admin accessing coupons");
    const coupons = await Coupon.find();
    res.json(coupons);
  } catch (err) {
    console.error("❌ Error fetching coupons:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin route: Update coupon details (toggle availability, update coupon code, etc.)
router.put("/coupon/update/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    // updateData can include fields like status, code, etc.
    const updateData = req.body;
    const coupon = await Coupon.findByIdAndUpdate(id, updateData, { new: true });
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    res.json({ message: "Coupon updated successfully", coupon });
  } catch (err) {
    console.error("Error updating coupon:", err);
    res.status(500).json({ message: "Error updating coupon" });
  }
});

module.exports = router;
