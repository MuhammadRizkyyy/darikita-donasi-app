require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");
const auditorRoutes = require("./routes/auditor");

// Initialize express
const app = express();

// Connect to database
connectDB();

// ✅ CORS Configuration - SIMPLE & PERMISSIVE FOR DEBUGGING
const corsOptions = {
  origin: true, // Allow all origins temporarily
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Handle preflight

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/causes", require("./routes/causes"));
app.use("/api/donations", require("./routes/donations"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/midtrans", require("./routes/midtrans"));
app.use("/api/reports", require("./routes/report"));
app.use("/api/transparency", require("./routes/transparency"));
app.use("/api/auditor", auditorRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "DariKita API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API Health Check OK",
    timestamp: new Date().toISOString(),
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
  });
});

const PORT = process.env.PORT || 5000;

// Conditional server start
if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`🚀 DariKita Server Running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
