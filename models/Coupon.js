const mongoose = require("mongoose");

const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  status: { type: String, enum: ["available", "claimed"], default: "available" },
  assignedTo: { type: String, default: null }, // Stores IP or User ID
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Coupon", CouponSchema);
