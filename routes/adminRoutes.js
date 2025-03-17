const express = require("express");
const Admin = require("../models/Admin");
const Coupon = require("../models/Coupon"); // Import Coupon model
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

//  Ensure `claim-history` is correctly defined
router.get("/claim-history", verifyToken, async (req, res) => {
  try {
    const claimedCoupons = await Coupon.find({ status: "claimed" })
      .select("code assignedTo updatedAt") //  Ensure updatedAt is selected
      .sort({ updatedAt: -1 });

    res.json(claimedCoupons);
  } catch (err) {
    console.error("❌ Error fetching claim history:", err);
    res.status(500).json({ message: "Error fetching claim history" });
  }
});


// ✅ Protected admin route: Get all coupons
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

// ✅ Admin route: Update coupon status (toggle availability)
router.put("/coupon/update/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // Only updating status
    console.log(`🔄 Debug - Updating coupon ${id} with status: ${status}`);

    const coupon = await Coupon.findByIdAndUpdate(id, { status }, { new: true });
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });

    res.json({ message: "✅ Coupon updated successfully", coupon });
  } catch (err) {
    console.error("❌ Error updating coupon:", err);
    res.status(500).json({ message: "Error updating coupon" });
  }
});

// ✅ Admin route: Delete a coupon
router.delete("/coupon/delete/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑 Debug - Deleting coupon with ID: ${id}`);

    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });

    res.json({ message: "✅ Coupon deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting coupon:", err);
    res.status(500).json({ message: "Error deleting coupon" });
  }
});

module.exports = router;
