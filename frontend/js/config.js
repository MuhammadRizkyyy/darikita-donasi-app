// js/config.js
// Auto-detect environment and set API URL

const isProduction =
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1";

// ⭐ TAMBAHKAN /api DI AKHIR!
const VERCEL_BACKEND_URL =
  "https://darikita-donasi-czih8a48-rizkys-projects-2760545d.vercel.app/api";

window.API_BASE_URL = isProduction
  ? VERCEL_BACKEND_URL
  : "http://localhost:5000/api";

console.log("🌐 Environment:", isProduction ? "PRODUCTION" : "DEVELOPMENT");
console.log("🔗 API Base URL:", window.API_BASE_URL);
