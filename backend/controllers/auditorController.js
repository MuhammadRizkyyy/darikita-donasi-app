const Donation = require("../models/Donation");
const Cause = require("../models/Cause");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

// @desc    Get auditor dashboard statistics
// @route   GET /api/auditor/stats
// @access  Private/Auditor
exports.getAuditorStats = async (req, res) => {
  try {
    // Total causes
    const totalCauses = await Cause.countDocuments();
    const activeCauses = await Cause.countDocuments({ status: "active" });

    // Donation statistics
    const totalDonationsResult = await Donation.aggregate([
      { $match: { status: "verified" } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalDonations = totalDonationsResult[0] || {
      totalAmount: 0,
      count: 0,
    };

    // Distributed amount
    const distributedResult = await Donation.aggregate([
      { $match: { distributionStatus: { $in: ["distributed", "used"] } } },
      {
        $group: {
          _id: null,
          distributedAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const distributed = distributedResult[0] || {
      distributedAmount: 0,
      count: 0,
    };

    // Pending audit
    const pendingAudit = await Donation.countDocuments({
      auditStatus: { $in: ["pending_audit", "audit_in_progress"] },
    });

    // Donations by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const donationsByMonth = await Donation.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          status: "verified",
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Donations by category
    const donationsByCategory = await Donation.aggregate([
      { $match: { status: "verified" } },
      {
        $lookup: {
          from: "causes",
          localField: "cause",
          foreignField: "_id",
          as: "causeData",
        },
      },
      { $unwind: "$causeData" },
      {
        $group: {
          _id: "$causeData.category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Transparency vs Donations (per cause)
    const causesTransparency = await Cause.aggregate([
      {
        $project: {
          title: 1,
          currentAmount: 1,
          disbursedAmount: 1,
          remainingFunds: {
            $subtract: ["$currentAmount", "$disbursedAmount"],
          },
          disbursementPercentage: {
            $cond: [
              { $eq: ["$currentAmount", 0] },
              0,
              {
                $multiply: [
                  { $divide: ["$disbursedAmount", "$currentAmount"] },
                  100,
                ],
              },
            ],
          },
        },
      },
      { $sort: { currentAmount: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalCauses,
          activeCauses,
          totalDonationAmount: totalDonations.totalAmount,
          totalDonationCount: totalDonations.count,
          distributedAmount: distributed.distributedAmount,
          distributedCount: distributed.count,
          remainingAmount:
            totalDonations.totalAmount - distributed.distributedAmount,
          pendingAudit,
        },
        charts: {
          donationsByMonth,
          donationsByCategory,
          causesTransparency,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching auditor stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching auditor statistics",
      error: error.message,
    });
  }
};

// @desc    Get all donations for audit
// @route   GET /api/auditor/donations
// @access  Private/Auditor
exports.getAllDonationsForAudit = async (req, res) => {
  try {
    const { status, auditStatus, startDate, endDate } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (auditStatus) filter.auditStatus = auditStatus;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const donations = await Donation.find(filter)
      .populate("user", "name email")
      .populate("cause", "title category")
      .populate("verifiedBy", "name")
      .populate("auditedBy", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: donations.length,
      data: donations,
    });
  } catch (error) {
    console.error("Error fetching donations:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching donations for audit",
      error: error.message,
    });
  }
};

// @desc    Get single donation with full details
// @route   GET /api/auditor/donations/:id
// @access  Private/Auditor
exports.getDonationDetail = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate("user", "name email phone")
      .populate(
        "cause",
        "title category description targetAmount currentAmount"
      )
      .populate("verifiedBy", "name email")
      .populate("auditedBy", "name email");

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found",
      });
    }

    res.json({
      success: true,
      data: donation,
    });
  } catch (error) {
    console.error("Error fetching donation detail:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching donation detail",
      error: error.message,
    });
  }
};

// @desc    Mark donation as audited
// @route   PUT /api/auditor/donations/:id/audit
// @access  Private/Auditor
exports.markDonationAudited = async (req, res) => {
  try {
    const { auditStatus, auditNotes } = req.body;

    if (!["audit_verified", "audit_flagged"].includes(auditStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid audit status",
      });
    }

    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found",
      });
    }

    // Update audit status
    donation.auditStatus = auditStatus;
    donation.auditedBy = req.user.id;
    donation.auditedAt = Date.now();
    donation.auditNotes = auditNotes || "";

    await donation.save();

    // Create audit log
    await AuditLog.create({
      actor: req.user.id,
      action: "audit_report_verified",
      targetType: "Donation",
      targetId: donation._id,
      changes: {
        auditStatus: {
          from: "pending_audit",
          to: auditStatus,
        },
      },
      metadata: {
        description: `Donation ${donation._id} marked as ${auditStatus}`,
      },
    });

    res.json({
      success: true,
      message: "Donation audit status updated successfully",
      data: donation,
    });
  } catch (error) {
    console.error("Error updating audit status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating audit status",
      error: error.message,
    });
  }
};

// @desc    Get audit logs
// @route   GET /api/auditor/logs
// @access  Private/Auditor
exports.getAuditLogs = async (req, res) => {
  try {
    const { action, startDate, endDate, limit = 50 } = req.query;
    let filter = {};

    if (action) filter.action = action;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(filter)
      .populate("actor", "name email role")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const totalLogs = await AuditLog.countDocuments(filter);

    res.json({
      success: true,
      count: logs.length,
      total: totalLogs,
      data: logs,
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching audit logs",
      error: error.message,
    });
  }
};

// @desc    Generate audit report (PDF data)
// @route   GET /api/auditor/report
// @access  Private/Auditor
exports.generateAuditReport = async (req, res) => {
  try {
    const { startDate, endDate, causeId, status } = req.query;
    let filter = { status: "verified" };

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (causeId) filter.cause = causeId;
    if (status) filter.auditStatus = status;

    const donations = await Donation.find(filter)
      .populate("user", "name email")
      .populate("cause", "title category")
      .populate("auditedBy", "name")
      .sort({ createdAt: -1 });

    // Calculate statistics
    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
    const verifiedCount = donations.filter(
      (d) => d.auditStatus === "audit_verified"
    ).length;
    const flaggedCount = donations.filter(
      (d) => d.auditStatus === "audit_flagged"
    ).length;
    const pendingCount = donations.filter(
      (d) => d.auditStatus === "pending_audit"
    ).length;

    // Distributed vs remaining
    const distributedAmount = donations
      .filter((d) => d.distributionStatus === "distributed")
      .reduce((sum, d) => sum + d.amount, 0);

    const reportData = {
      summary: {
        totalTransactions: donations.length,
        totalAmount,
        verifiedCount,
        flaggedCount,
        pendingCount,
        distributedAmount,
        remainingAmount: totalAmount - distributedAmount,
      },
      donations: donations.map((d) => ({
        _id: d._id,
        date: d.createdAt,
        donor: {
          name: d.user?.name || "Anonymous",
          email: d.user?.email || "-",
        },
        cause: {
          title: d.cause?.title || "N/A",
          category: d.cause?.category || "N/A",
        },
        amount: d.amount,
        status: d.status,
        distributionStatus: d.distributionStatus,
        auditStatus: d.auditStatus,
        auditedBy: d.auditedBy?.name || "-",
        auditedAt: d.auditedAt || null,
        auditNotes: d.auditNotes || "-",
      })),
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        causeId: causeId || null,
        status: status || null,
      },
      generatedAt: new Date(),
      generatedBy: {
        name: req.user.name,
        email: req.user.email,
      },
    };

    res.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error("Error generating audit report:", error);
    res.status(500).json({
      success: false,
      message: "Error generating audit report",
      error: error.message,
    });
  }
};
