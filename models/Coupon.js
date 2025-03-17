const mongoose = require("mongoose");

const CouponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    status: { type: String, default: "available" },
    assignedTo: { type: String, default: null },
  },
  { timestamps: true } //Ensure timestamps are enabled
);

module.exports = mongoose.model("Coupon", CouponSchema);
