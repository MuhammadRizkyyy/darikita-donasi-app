// backend/config/cloudinary.js - UPDATE
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for cause images
const causeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "darikita/causes",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, height: 800, crop: "limit" }],
  },
});

// ✅ NEW: Storage for audit documents (PDF)
const auditStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "darikita/audit-documents",
    allowed_formats: ["pdf", "jpg", "jpeg", "png"],
    resource_type: "auto", // Important for PDF
  },
});

// Upload for cause images
const uploadCauseImage = multer({
  storage: causeStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// ✅ NEW: Upload for audit documents
const uploadAuditDocument = multer({
  storage: auditStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for PDF
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and image files are allowed"), false);
    }
  },
});

module.exports = {
  cloudinary,
  uploadCauseImage,
  uploadAuditDocument,
};
