require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");
const auditorRoutes = require("./routes/auditor");

// Initialize express
const app = express();

// Connect to database
connectDB();

// ✅ UPDATED: CORS Configuration untuk Production
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        // Local development
        "http://localhost:3000",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        // ⭐ Production - Tambahkan Vercel URLs
        process.env.FRONTEND_URL, // Dari environment variable
        "https://darikita-frontend.vercel.app", // Frontend Vercel URL
        "https://darikita-frontend-git-main-yourusername.vercel.app", // Preview deployments
      ];

      // Filter out undefined values
      const validOrigins = allowedOrigins.filter(Boolean);

      if (validOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log("⚠️ CORS origin:", origin);
        // ⚠️ For production, change this to: callback(new Error('Not allowed by CORS'));
        callback(null, true); // Allow anyway for now
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "DariKita API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "DariKita API is running",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
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
  });
});

const PORT = process.env.PORT || 5000;

// ✅ UPDATED: Conditional server start (for Vercel Serverless)
if (process.env.NODE_ENV !== "production" || process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════╗
  ║                                       ║
  ║      🚀 DariKita Server Running      ║
  ║                                       ║
  ║      Environment: ${process.env.NODE_ENV || "development"}              ║
  ║      Port: ${PORT}                         ║
  ║      URL: http://localhost:${PORT}       ║
  ║                                       ║
  ╚═══════════════════════════════════════╝
    `);
  });
} else {
  console.log("🚀 DariKita API running on Vercel Serverless");
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log(`❌ Error: ${err.message}`);
  if (process.env.NODE_ENV !== "production") {
    process.exit(1);
  }
});

// ✅ EXPORT untuk Vercel Serverless Functions
module.exports = app;
