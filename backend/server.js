require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");
const auditorRoutes = require("./routes/auditor");

// Initialize express
const app = express();

// Connect to database
connectDB();

// ✅ Debug Middleware (optional, untuk troubleshooting)
app.use((req, res, next) => {
  const origin = req.get("origin");
  console.log(`📨 ${req.method} ${req.path} from ${origin || "no-origin"}`);
  next();
});

// ✅ CORS Configuration
const allowedOrigins = [
  // Local development
  "http://localhost:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
  // Production - Vercel
  "https://darikita.vercel.app",
  "https://darikita-git-main-muhammadrizkyyy.vercel.app",
];

// Add FRONTEND_URL from environment if exists
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.indexOf(origin) !== -1) {
        console.log("✅ CORS allowed:", origin);
        callback(null, true);
      } else {
        console.log("⚠️ CORS origin not in whitelist:", origin);
        // ⚠️ TEMPORARY: Allow all for debugging
        // Change to callback(new Error('Not allowed by CORS')) in production
        callback(null, true);
      }
    },
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
  })
);

// ✅ Handle preflight requests explicitly
app.options("*", cors());

// Body parser middleware
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

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API Health Check OK",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
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

// Conditional server start (for local development)
if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════╗
  ║                                       ║
  ║      🚀 DariKita Server Running      ║
  ║                                       ║
  ║      Environment: ${(process.env.NODE_ENV || "development").padEnd(14)}║
  ║      Port: ${PORT.toString().padEnd(28)}║
  ║      URL: http://localhost:${PORT.toString().padEnd(12)}║
  ║                                       ║
  ╚═══════════════════════════════════════╝
    `);
  });
} else {
  console.log("🚀 DariKita API running on Vercel Serverless");
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  if (process.env.NODE_ENV !== "production") {
    process.exit(1);
  }
});

// Export app for Vercel Serverless
module.exports = app;
