const express = require("express");
const {
  getCauses,
  getCause, // ✅ Changed from getCauseById
  createCause,
  updateCause,
  deleteCause,
  updateCauseProgress, // ✅ Changed from addCauseUpdate
} = require("../controllers/causeController");
const { protect } = require("../middleware/auth");
const { roleCheck } = require("../middleware/roleCheck");
const { upload } = require("../config/cloudinary");

const router = express.Router();

// Public routes
router.get("/", getCauses);
router.get("/:id", getCause); // ✅ Fixed

// Protected routes - Admin only
router.post(
  "/",
  protect,
  roleCheck(["admin"]),
  upload.single("image"), // Handle single image upload
  createCause
);

router.put(
  "/:id",
  protect,
  roleCheck(["admin"]),
  upload.single("image"), // Handle image upload on update
  updateCause
);

router.delete("/:id", protect, roleCheck(["admin"]), deleteCause);

router.post(
  "/:id/progress", // ✅ Changed from /updates to /progress
  protect,
  roleCheck(["admin"]),
  upload.array("images", 5), // Allow multiple images for progress updates (max 5)
  updateCauseProgress // ✅ Fixed function name
);

module.exports = router;
