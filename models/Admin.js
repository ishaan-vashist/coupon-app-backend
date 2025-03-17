const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Hash password before saving with error handling
AdminSchema.pre("save", async function (next) {
  try {
    // Only hash the password if it has been modified
    if (!this.isModified("password")) return next();

    // If the password already appears hashed, skip hashing.
    if (this.password && this.password.startsWith("$2") && this.password.length === 60) {
      return next();
    }

    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Admin", AdminSchema);
