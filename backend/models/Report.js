const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add a report title"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["monthly", "cause", "annual", "audit"],
      required: true,
    },
    period: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },
    cause: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cause",
    },
    summary: {
      totalDonations: {
        type: Number,
        default: 0,
      },
      totalAmount: {
        type: Number,
        default: 0,
      },
      totalDistributed: {
        type: Number,
        default: 0,
      },
      totalDonors: {
        type: Number,
        default: 0,
      },
    },
    details: {
      type: String,
      maxlength: [5000, "Details cannot be more than 5000 characters"],
    },
    proofDocuments: [
      {
        title: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ["draft", "published", "verified"],
      default: "draft",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: {
      type: Date,
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
reportSchema.index({ type: 1, status: 1 });
reportSchema.index({ "period.startDate": 1, "period.endDate": 1 });

module.exports = mongoose.model("Report", reportSchema);
