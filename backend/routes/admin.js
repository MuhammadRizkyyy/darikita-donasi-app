const express = require("express");
const {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllDonationsAdmin,
  verifyDonation,
  updateDistributionStatus,
} = require("../controllers/adminController");
const { protect } = require("../middleware/auth");
const { roleCheck } = require("../middleware/roleCheck");

const router = express.Router();

// All routes require admin role
router.use(protect);
router.use(roleCheck(["admin"]));

// Dashboard Stats
router.get("/stats", getDashboardStats);

// User Management
router.get("/users", getAllUsers);
router.put("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

// Donation Management
router.get("/donations", getAllDonationsAdmin);
router.put("/donations/:id/verify", verifyDonation);
router.put("/donations/:id/distribution", updateDistributionStatus);

module.exports = router;
