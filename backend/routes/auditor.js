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

const router = express.Router();

// All routes require auditor role
router.use(protect);
router.use(roleCheck(["auditor"]));

// Dashboard & Statistics
router.get("/stats", getAuditorStats);

// Donation Audit Management
router.get("/donations", getAllDonationsForAudit);
router.get("/donations/:id", getDonationDetail);
router.put(
  "/donations/:id/audit",
  logAudit("audit_report_verified", "Donation"),
  markDonationAudited
);

// Audit Logs
router.get("/logs", getAuditLogs);

// Reports
router.get("/report", generateAuditReport);

module.exports = router;
