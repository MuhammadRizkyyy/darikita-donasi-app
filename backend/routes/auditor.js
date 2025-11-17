// backend/routes/auditor.js
const express = require("express");
const {
  getAuditorStats,
  getAllDonationsForAudit,
  getDonationDetail,
  markDonationAudited,
  getAuditLogs,
  generateAuditReport,
} = require("../controllers/auditorController");
const { protect } = require("../middleware/auth");
const { roleCheck } = require("../middleware/roleCheck");
const { logAudit } = require("../middleware/auditLogger");
const { uploadAuditDocument } = require("../config/cloudinary"); // ✅ NEW

const router = express.Router();

router.use(protect);
router.use(roleCheck(["auditor"]));

router.get("/stats", getAuditorStats);
router.get("/donations", getAllDonationsForAudit);
router.get("/donations/:id", getDonationDetail);

// ✅ UPDATED: Tambah uploadAuditDocument.single("auditDocument")
router.put(
  "/donations/:id/audit",
  uploadAuditDocument.single("auditDocument"), // Handle file upload
  logAudit("audit_report_verified", "Donation"),
  markDonationAudited
);

router.get("/logs", getAuditLogs);
router.get("/report", generateAuditReport);

module.exports = router;
