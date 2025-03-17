require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const app = express();

// ✅ Middleware Configuration
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// ✅ Database Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1); // Exit if DB connection fails
  });

// ✅ Rate Limiting: Prevent Abuse
const claimLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Allow up to 10 claims per minute
  message: { message: "Too many requests, please wait before trying again." },
});

app.use("/api/coupons/claim", claimLimiter); // Apply only to claim route

// ✅ Import Routes
const couponRoutes = require("./routes/couponRoutes");
const adminRoutes = require("./routes/adminRoutes");

// ✅ Use Routes
app.use("/api/coupons", couponRoutes);
app.use("/api/admin", adminRoutes);

// ✅ Global Error Handling (Prevents Crashes)
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
