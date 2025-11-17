// =====================================================
// AUDITOR.JS - Auditor Dashboard Logic
// =====================================================

// Check authentication on page load
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Auditor Dashboard initialized");

  // Check if user is logged in
  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("userData");

  if (!token || !userData) {
    console.log("❌ Not authenticated, redirecting to login");
    showNotification("Silakan login terlebih dahulu", "warning");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
    return;
  }

  try {
    const user = JSON.parse(userData);

    // Check if user is auditor role
    if (user.role !== "auditor") {
      console.log("⚠️ Wrong role:", user.role);
      showNotification(
        "Akses ditolak. Ini adalah halaman khusus auditor.",
        "error"
      );
      setTimeout(() => {
        redirectBasedOnRole(user.role);
      }, 2000);
      return;
    }

    console.log("✅ User authenticated:", user.name);

    // Initialize dashboard
    await initializeDashboard();
  } catch (error) {
    console.error("❌ Error parsing user data:", error);
    localStorage.clear();
    window.location.href = "login.html";
  }
});

// =====================================================
// INITIALIZE DASHBOARD
// =====================================================
async function initializeDashboard() {
  try {
    console.log("📊 Loading auditor dashboard...");

    // Setup event listeners
    setupEventListeners();

    // Load dashboard data
    await loadDashboardStats();

    console.log("✅ Auditor dashboard loaded successfully");
  } catch (error) {
    console.error("❌ Error initializing dashboard:", error);
    showNotification(
      "Gagal memuat dashboard. Silakan refresh halaman.",
      "error"
    );
  }
}

// =====================================================
// SETUP EVENT LISTENERS
// =====================================================
function setupEventListeners() {
  // Logout button
  document
    .getElementById("logout-btn")
    ?.addEventListener("click", handleLogout);

  // Sidebar toggle (mobile)
  document
    .getElementById("sidebar-toggle")
    ?.addEventListener("click", toggleSidebar);
  document
    .getElementById("sidebar-overlay")
    ?.addEventListener("click", toggleSidebar);

  // Navigation links
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", handleNavigation);
  });

  // Filter buttons
  document
    .getElementById("btn-filter-donations")
    ?.addEventListener("click", filterDonations);
  document
    .getElementById("btn-filter-logs")
    ?.addEventListener("click", filterAuditLogs);
  document
    .getElementById("btn-generate-report")
    ?.addEventListener("click", generateAuditReport);
}

// =====================================================
// LOAD DASHBOARD STATS
// =====================================================
async function loadDashboardStats() {
  try {
    showLoading("Memuat statistik...");

    const response = await window.API.auditor.getStats();

    if (response.success) {
      const { overview, charts } = response.data;

      // Update auditor name - FIXED: handle different userData structures
      const userData = JSON.parse(localStorage.getItem("userData"));
      const auditorName = userData.user?.name || userData.name || "Auditor";
      document.getElementById("auditor-name").textContent = auditorName;

      // Update statistics cards
      document.getElementById("stat-total-donations").textContent =
        formatCurrency(overview.totalDonationAmount);
      document.getElementById("stat-distributed").textContent = formatCurrency(
        overview.distributedAmount
      );
      document.getElementById("stat-remaining").textContent = formatCurrency(
        overview.remainingAmount
      );
      document.getElementById("stat-pending-audit").textContent =
        overview.pendingAudit;

      // Display charts
      displayTransparencyChart(charts.causesAudit);
      displayCategoryChart(charts.donationsByCategory);

      // Load recent audits
      await loadRecentAudits();
    }

    hideLoading();
  } catch (error) {
    console.error("❌ Error loading dashboard stats:", error);
    hideLoading();
    showNotification("Gagal memuat statistik dashboard", "error");
  }
}

// =====================================================
// DISPLAY TRANSPARENCY CHART (Per Program Audit Status)
// =====================================================
function displayTransparencyChart(data) {
  const container = document.getElementById("transparency-chart");
  container.innerHTML = "";

  if (!data || data.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-chart-pie text-4xl mb-2"></i>
        <p>Belum ada data program untuk diaudit</p>
      </div>
    `;
    return;
  }

  data.slice(0, 5).forEach((cause) => {
    const percentage = cause.disbursementPercentage || 0;
    const remaining = cause.remainingFunds || 0;
    const auditStatusColors = {
      pending_audit: "bg-yellow-50 border-yellow-200",
      audit_verified: "bg-green-50 border-green-200",
      audit_flagged: "bg-red-50 border-red-200",
      audit_in_progress: "bg-blue-50 border-blue-200",
    };

    const auditStatusIcons = {
      pending_audit: { icon: "fa-clock", color: "yellow" },
      audit_verified: { icon: "fa-check-circle", color: "green" },
      audit_flagged: { icon: "fa-exclamation-circle", color: "red" },
      audit_in_progress: { icon: "fa-hourglass-start", color: "blue" },
    };

    const statusInfo = auditStatusIcons[cause.auditStatus] || auditStatusIcons.pending_audit;

    const item = document.createElement("div");
    item.className = `border-2 rounded-lg p-4 hover:bg-opacity-75 transition-colors cursor-pointer ${
      auditStatusColors[cause.auditStatus] || auditStatusColors.pending_audit
    }`;
    item.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <i class="fas ${statusInfo.icon} text-${statusInfo.color}-600"></i>
          <h4 class="font-semibold text-gray-900 text-sm">${cause.title}</h4>
        </div>
        <span class="text-xs font-bold text-gray-700">${percentage.toFixed(1)}% Disalurkan</span>
      </div>
      <div class="w-full bg-gray-300 rounded-full h-2 mb-2">
        <div class="h-2 rounded-full ${
          percentage >= 80
            ? "bg-green-500"
            : percentage >= 50
            ? "bg-blue-500"
            : "bg-orange-500"
        }" style="width: ${percentage}%"></div>
      </div>
      <div class="flex items-center justify-between text-xs text-gray-600 mb-2">
        <span>Terkumpul: ${formatCurrency(cause.currentAmount)}</span>
        <span>Sisa: ${formatCurrency(remaining)}</span>
      </div>
      <div class="text-xs text-gray-500 flex items-center gap-1">
        <i class="fas fa-info-circle"></i>
        <span>Audit Status: <strong>${
          cause.auditStatus === "pending_audit"
            ? "Menunggu"
            : cause.auditStatus === "audit_verified"
            ? "Verified"
            : cause.auditStatus === "audit_flagged"
            ? "Flagged"
            : "Sedang Diaudit"
        }</strong></span>
      </div>
    `;
    item.onclick = () => viewCauseAuditDetail(cause._id);
    container.appendChild(item);
  });
}

// =====================================================
// DISPLAY CATEGORY CHART
// =====================================================
function displayCategoryChart(data) {
  const container = document.getElementById("category-chart");
  container.innerHTML = "";

  if (!data || data.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-tags text-4xl mb-2"></i>
        <p>Belum ada data kategori</p>
      </div>
    `;
    return;
  }

  const categories = {
    pendidikan: { icon: "fa-graduation-cap", color: "blue" },
    kesehatan: { icon: "fa-heartbeat", color: "red" },
    sosial: { icon: "fa-hands-helping", color: "green" },
    bencana: { icon: "fa-house-damage", color: "orange" },
    lingkungan: { icon: "fa-leaf", color: "emerald" },
    infrastruktur: { icon: "fa-building", color: "gray" },
    lainnya: { icon: "fa-ellipsis-h", color: "purple" },
  };

  const totalAmount = data.reduce((sum, cat) => sum + cat.total, 0);

  data.forEach((category) => {
    const catInfo = categories[category._id] || categories.lainnya;
    const percentage = ((category.total / totalAmount) * 100).toFixed(1);

    const item = document.createElement("div");
    item.className =
      "border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors";
    item.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-${
            catInfo.color
          }-100 rounded-lg flex items-center justify-center mr-3">
            <i class="fas ${catInfo.icon} text-${catInfo.color}-600"></i>
          </div>
          <div>
            <h4 class="font-semibold text-gray-900 text-sm capitalize">${
              category._id
            }</h4>
            <p class="text-xs text-gray-500">${category.count} donasi</p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-sm font-bold text-gray-900">${formatCurrency(
            category.total
          )}</p>
          <p class="text-xs text-gray-500">${percentage}%</p>
        </div>
      </div>
    `;
    container.appendChild(item);
  });
}

// =====================================================
// LOAD RECENT AUDITS
// =====================================================
async function loadRecentAudits() {
  try {
    const response = await window.API.auditor.getAuditLogs({ limit: 5 });

    const container = document.getElementById("recent-audits");
    container.innerHTML = "";

    if (response.success && response.data.length > 0) {
      response.data.forEach((log) => {
        const item = createAuditLogItem(log);
        container.appendChild(item);
      });
    } else {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <i class="fas fa-clipboard-list text-4xl mb-2"></i>
          <p>Belum ada aktivitas audit</p>
        </div>
      `;
    }
  } catch (error) {
    console.error("❌ Error loading recent audits:", error);
  }
}

// =====================================================
// NAVIGATION HANDLER
// =====================================================
function handleNavigation(e) {
  e.preventDefault();
  const section = e.currentTarget.getAttribute("data-section");

  // Update active nav
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("bg-blue-50", "text-blue-600");
    link.classList.add("text-gray-700");
  });
  e.currentTarget.classList.add("bg-blue-50", "text-blue-600");
  e.currentTarget.classList.remove("text-gray-700");

  // Hide all sections
  document.querySelectorAll(".section-content").forEach((sec) => {
    sec.classList.add("hidden");
  });

  // Show selected section
  const targetSection = document.getElementById(`section-${section}`);
  if (targetSection) {
    targetSection.classList.remove("hidden");

    // Load section data
    switch (section) {
      case "verify-donations":
        loadCausesForAudit();
        break;
      case "audit-logs":
        loadAuditLogs();
        break;
      case "reports":
        loadCausesForReport();
        break;
    }
  }

  // Close sidebar on mobile
  if (window.innerWidth < 1024) {
    toggleSidebar();
  }
}

// =====================================================
// LOAD CAUSES FOR AUDIT (Changed from Donations)
// =====================================================
async function loadCausesForAudit(filters = {}) {
  try {
    showLoading("Memuat data program untuk audit...");

    // ✨ Changed from getAllDonations to getAllCauses
    const response = await window.API.auditor.getAllCauses(filters);

    const container = document.getElementById("donations-list");
    container.innerHTML = "";

    if (response.success && response.data.length > 0) {
      const wrapper = document.createElement("div");
      wrapper.className = "divide-y divide-gray-200";

      response.data.forEach((cause) => {
        // ✨ Changed from createDonationItem to createCauseAuditItem
        const item = createCauseAuditItem(cause);
        wrapper.appendChild(item);
      });

      container.appendChild(wrapper);
    } else {
      container.innerHTML = `
        <div class="text-center py-12 text-gray-500">
          <i class="fas fa-inbox text-5xl mb-4"></i>
          <p class="text-lg font-medium">Tidak ada program ditemukan</p>
        </div>
      `;
    }

    hideLoading();
  } catch (error) {
    console.error("❌ Error loading causes:", error);
    hideLoading();
    showNotification("Gagal memuat data program", "error");
  }
}

// =====================================================
// CREATE CAUSE AUDIT ITEM (Changed from Donation)
// =====================================================
function createCauseAuditItem(cause) {
  const div = document.createElement("div");
  div.className = "p-6 hover:bg-gray-50 transition-colors";

  const auditStatusColors = {
    pending_audit: "bg-yellow-100 text-yellow-800",
    audit_in_progress: "bg-blue-100 text-blue-800",
    audit_verified: "bg-green-100 text-green-800",
    audit_flagged: "bg-red-100 text-red-800",
  };

  const auditStatusLabels = {
    pending_audit: "Pending Audit",
    audit_in_progress: "Sedang Diaudit",
    audit_verified: "Verified",
    audit_flagged: "Flagged",
  };

  const stats = cause.donationStats || {
    totalReceived: 0,
    totalDisbursed: 0,
    totalDonations: 0,
  };

  div.innerHTML = `
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div class="flex-1">
        <div class="flex items-center mb-2">
          <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
            <i class="fas fa-heart text-blue-600"></i>
          </div>
          <div>
            <h3 class="font-bold text-gray-900">${cause.title}</h3>
            <p class="text-sm text-gray-600">Kategori: ${cause.category} • ${
    stats.totalDonations
  } donasi</p>
          </div>
        </div>
        <div class="ml-13 space-y-1">
          <p class="text-sm text-gray-700">
            <span class="font-semibold">Dana Masuk:</span> ${formatCurrency(
              stats.totalReceived
            )}
          </p>
          <p class="text-sm text-gray-700">
            <span class="font-semibold">Dana Keluar:</span> ${formatCurrency(
              stats.totalDisbursed
            )}
          </p>
          <p class="text-sm text-gray-700">
            <span class="font-semibold">Sisa Dana:</span> ${formatCurrency(
              cause.remainingFunds || stats.totalReceived - stats.totalDisbursed
            )}
          </p>
          ${
            cause.auditedBy
              ? `
            <p class="text-xs text-gray-500">
              Diaudit oleh: ${cause.auditedBy?.name || "Unknown"} pada ${new Date(
                  cause.auditedAt
                ).toLocaleDateString("id-ID")}
            </p>
          `
              : ""
          }
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="px-3 py-1 rounded-lg text-sm font-semibold ${
          auditStatusColors[cause.auditStatus] ||
          auditStatusColors.pending_audit
        }">
          ${auditStatusLabels[cause.auditStatus] || "Pending"}
        </span>
        <button
          onclick="viewCauseAuditDetail('${cause._id}')"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <i class="fas fa-eye mr-1"></i>Detail & Audit
        </button>
      </div>
    </div>
  `;

  return div;
}

// =====================================================
// VIEW CAUSE AUDIT DETAIL (Changed from Donation)
// =====================================================
async function viewCauseAuditDetail(causeId) {
  try {
    showLoading("Memuat detail program...");

    // ✨ Changed from getDonationDetail to getCauseDetail
    const response = await window.API.auditor.getCauseDetail(causeId);

    if (response.success) {
      const { cause, donations, stats } = response.data;
      showCauseAuditModal(cause, donations, stats);
    }

    hideLoading();
  } catch (error) {
    console.error("❌ Error loading cause detail:", error);
    hideLoading();
    showNotification("Gagal memuat detail program", "error");
  }
}

// =====================================================
// SHOW CAUSE AUDIT MODAL (Changed from Donation)
// =====================================================
function showCauseAuditModal(cause, donations, stats) {
  const modal = document.getElementById("donation-detail-modal");
  const auditDisabled =
    cause.auditStatus === "audit_verified" ||
    cause.auditStatus === "audit_flagged";

  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-xl max-w-4xl w-full">
      <!-- Modal Header -->
      <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl z-10">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">${cause.title}</h2>
            <p class="text-sm text-gray-600 mt-1">
              <i class="fas fa-tag mr-1"></i>
              <span class="capitalize">${cause.category}</span>
            </p>
          </div>
          <button onclick="closeDonationModal()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>
      </div>

      <!-- Modal Body -->
      <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        <!-- Program Info -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 class="font-bold text-gray-900 mb-3">Informasi Program</h3>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <p class="text-sm text-gray-600">Kategori</p>
              <p class="font-semibold text-gray-900 capitalize">${cause.category}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Status</p>
              <p class="font-semibold text-gray-900 capitalize">${cause.status}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Target Dana</p>
              <p class="font-semibold text-gray-900">${formatCurrency(cause.targetAmount)}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Dana Terkumpul</p>
              <p class="font-semibold text-green-600 text-lg">${formatCurrency(stats.totalReceived)}</p>
            </div>
          </div>
        </div>

        <!-- Financial Summary -->
        <div class="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
          <h3 class="font-bold text-gray-900 mb-4">Ringkasan Dana (Transparansi)</h3>
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
              <p class="text-xs text-gray-600 mb-1">Dana Masuk</p>
              <p class="text-2xl font-bold text-green-600">${formatCurrency(stats.totalReceived)}</p>
              <p class="text-xs text-gray-500 mt-1">${stats.totalDonations} transaksi</p>
            </div>
            <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
              <p class="text-xs text-gray-600 mb-1">Dana Keluar</p>
              <p class="text-2xl font-bold text-blue-600">${formatCurrency(stats.totalDisbursed)}</p>
              <p class="text-xs text-gray-500 mt-1">${Math.round((stats.totalDisbursed / stats.totalReceived * 100))}% disalurkan</p>
            </div>
            <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-orange-500">
              <p class="text-xs text-gray-600 mb-1">Sisa Dana</p>
              <p class="text-2xl font-bold text-orange-600">${formatCurrency(stats.totalReceived - stats.totalDisbursed)}</p>
              <p class="text-xs text-gray-500 mt-1">${Math.round(((stats.totalReceived - stats.totalDisbursed) / stats.totalReceived * 100))}% sisa</p>
            </div>
          </div>
        </div>

        <!-- Donations List -->
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 class="font-bold text-gray-900 mb-3">
            <i class="fas fa-list mr-2"></i>
            Daftar Donasi dalam Program Ini
          </h3>
          <div class="space-y-2 max-h-64 overflow-y-auto">
            ${
              donations && donations.length > 0
                ? donations
                    .map(
                      (d) => `
              <div class="bg-white rounded-lg p-3 border border-gray-200">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-semibold text-gray-900">${d.user?.name || "Anonymous"}</p>
                    <p class="text-xs text-gray-500">${new Date(d.createdAt).toLocaleDateString("id-ID")}</p>
                  </div>
                  <p class="text-sm font-bold text-green-600">${formatCurrency(d.amount)}</p>
                </div>
                <p class="text-xs text-gray-600 mt-1">
                  Status: <span class="font-semibold">${
                    d.status === "verified" ? "✓ Verified" : "Pending"
                  }</span> | Distribusi: <span class="font-semibold">${
                      d.distributionStatus === "distributed"
                        ? "Disalurkan"
                        : d.distributionStatus === "used"
                        ? "Digunakan"
                        : "Pending"
                    }</span>
                </p>
              </div>
            `
                    )
                    .join("")
                : `<p class="text-gray-500 text-center py-4">Tidak ada donasi</p>`
            }
          </div>
        </div>

        <!-- Audit Document -->
        ${
          cause.auditDocument
            ? `
        <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 class="font-bold text-gray-900 mb-3 flex items-center">
            <i class="fas fa-file-pdf text-red-600 mr-2"></i>
            Dokumen Audit yang Telah Diupload
          </h3>
          <a href="${cause.auditDocument}" target="_blank" 
             class="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            <i class="fas fa-download mr-2"></i>Download Dokumen Audit
          </a>
        </div>
        `
            : ""
        }

        <!-- Audit Form -->
        <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 class="font-bold text-gray-900 mb-3">Verifikasi Audit Program</h3>
          <form id="audit-form" onsubmit="submitCauseAudit(event, '${cause._id}')">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Status Audit Program</label>
                <div class="flex gap-4">
                  <label class="flex items-center cursor-pointer ${
                    auditDisabled ? "opacity-50" : ""
                  }">
                    <input type="radio" name="auditStatus" value="audit_verified" ${
                      cause.auditStatus === "audit_verified" ? "checked" : ""
                    } ${auditDisabled ? "disabled" : ""} class="mr-2" required>
                    <span class="text-gray-700">✓ Verified - Program Transparan</span>
                  </label>
                  <label class="flex items-center cursor-pointer ${
                    auditDisabled ? "opacity-50" : ""
                  }">
                    <input type="radio" name="auditStatus" value="audit_flagged" ${
                      cause.auditStatus === "audit_flagged" ? "checked" : ""
                    } ${auditDisabled ? "disabled" : ""} class="mr-2" required>
                    <span class="text-gray-700">⚠ Flagged - Ada Masalah</span>
                  </label>
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Catatan Audit</label>
                <textarea
                  name="auditNotes"
                  rows="4"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Masukkan hasil audit program, catatan transparansi, rekomendasi, dll..."
                  ${auditDisabled ? "disabled" : ""}
                >${cause.auditNotes || ""}</textarea>
              </div>

              <!-- File Upload -->
              ${
                !auditDisabled
                  ? `
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  <i class="fas fa-file-pdf text-red-600 mr-1"></i>
                  Upload Dokumen Audit (PDF/Image) - Opsional
                </label>
                <input 
                  type="file" 
                  id="auditDocument" 
                  name="auditDocument"
                  accept=".pdf,.jpg,.jpeg,.png"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 
                         file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 
                         file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition-colors"
                >
                <p class="text-xs text-gray-500 mt-1">
                  <i class="fas fa-info-circle mr-1"></i>
                  Format: PDF, JPG, PNG (Maksimal 10MB)
                </p>
              </div>
              `
                  : ""
              }

              ${
                cause.auditedBy
                  ? `
                <div class="bg-white border border-gray-200 rounded-lg p-3">
                  <p class="text-sm text-gray-600">Terakhir diaudit oleh:</p>
                  <p class="font-semibold text-gray-900">${cause.auditedBy?.name || "Unknown"}</p>
                  <p class="text-xs text-gray-500">${new Date(cause.auditedAt).toLocaleString(
                    "id-ID"
                  )}</p>
                </div>
              `
                  : ""
              }

              ${
                !auditDisabled
                  ? `
                <button
                  type="submit"
                  class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <i class="fas fa-check-circle mr-2"></i>Simpan Audit Program
                </button>
              `
                  : `
                <div class="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <i class="fas fa-check-circle text-green-600 text-2xl mb-2"></i>
                  <p class="text-sm text-green-700 font-medium">Program sudah diaudit</p>
                </div>
              `
              }
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove("hidden");
}

// =====================================================
// SUBMIT CAUSE AUDIT (Changed from Donation)
// =====================================================
async function submitCauseAudit(event, causeId) {
  event.preventDefault();

  const form = event.target;
  const auditStatus = form.auditStatus.value;
  const auditNotes = form.auditNotes.value;
  const auditDocumentFile = document.getElementById("auditDocument")?.files[0];

  try {
    showLoading("Menyimpan audit program...");

    // ✨ Use FormData if there's a file, JSON otherwise
    let requestData;

    if (auditDocumentFile) {
      requestData = new FormData();
      requestData.append("auditStatus", auditStatus);
      requestData.append("auditNotes", auditNotes);
      requestData.append("auditDocument", auditDocumentFile);

      console.log("📤 Uploading with file:", auditDocumentFile.name);
    } else {
      requestData = {
        auditStatus,
        auditNotes,
      };

      console.log("📤 Submitting without file");
    }

    // ✨ Changed from markAsAudited to markCauseAudited
    const response = await window.API.auditor.markCauseAudited(
      causeId,
      requestData
    );

    if (response.success) {
      showNotification("Audit program berhasil disimpan!", "success");
      closeDonationModal();
      loadCausesForAudit(); // Refresh list - changed from loadDonationsForVerification
    }

    hideLoading();
  } catch (error) {
    console.error("❌ Error submitting audit:", error);
    hideLoading();
    showNotification(error.message || "Gagal menyimpan audit", "error");
  }
}

// =====================================================
// CLOSE DONATION MODAL
// =====================================================
function closeDonationModal() {
  const modal = document.getElementById("donation-detail-modal");
  modal.classList.add("hidden");
}

// Make it global
window.closeDonationModal = closeDonationModal;
window.viewCauseAuditDetail = viewCauseAuditDetail;
window.submitCauseAudit = submitCauseAudit;

// =====================================================
// LOAD AUDIT LOGS
// =====================================================
async function loadAuditLogs(filters = {}) {
  try {
    showLoading("Memuat audit logs...");

    const response = await window.API.auditor.getAuditLogs(filters);

    const container = document.getElementById("audit-logs-list");
    container.innerHTML = "";

    if (response.success && response.data.length > 0) {
      const wrapper = document.createElement("div");
      wrapper.className = "divide-y divide-gray-200";

      response.data.forEach((log) => {
        const item = createAuditLogItem(log);
        wrapper.appendChild(item);
      });

      container.appendChild(wrapper);
    } else {
      container.innerHTML = `
        <div class="text-center py-12 text-gray-500">
          <i class="fas fa-clipboard-list text-5xl mb-4"></i>
          <p class="text-lg font-medium">Tidak ada audit log ditemukan</p>
        </div>
      `;
    }

    hideLoading();
  } catch (error) {
    console.error("❌ Error loading audit logs:", error);
    hideLoading();
    showNotification("Gagal memuat audit logs", "error");
  }
}

// =====================================================
// CREATE AUDIT LOG ITEM
// =====================================================
function createAuditLogItem(log) {
  const div = document.createElement("div");
  div.className = "p-6 hover:bg-gray-50 transition-colors";

  const actionIcons = {
    donation_verified: { icon: "fa-check-circle", color: "green" },
    donation_distributed: { icon: "fa-hand-holding-usd", color: "blue" },
    cause_created: { icon: "fa-plus-circle", color: "purple" },
    user_role_changed: { icon: "fa-user-cog", color: "orange" },
    audit_report_verified: { icon: "fa-clipboard-check", color: "teal" },
  };

  const actionInfo = actionIcons[log.action] || {
    icon: "fa-info-circle",
    color: "gray",
  };

  div.innerHTML = `
    <div class="flex items-start">
      <div class="w-10 h-10 bg-${
        actionInfo.color
      }-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
        <i class="fas ${actionInfo.icon} text-${actionInfo.color}-600"></i>
      </div>
      <div class="flex-1">
        <div class="flex items-center justify-between mb-1">
          <h4 class="font-semibold text-gray-900">${log.action
            .replace(/_/g, " ")
            .toUpperCase()}</h4>
          <span class="text-sm text-gray-500">${new Date(
            log.createdAt
          ).toLocaleString("id-ID")}</span>
        </div>
        <p class="text-sm text-gray-700 mb-1">
          <span class="font-medium">${log.actor?.name || "Unknown"}</span>
          ${log.metadata?.description ? `- ${log.metadata.description}` : ""}
        </p>
        <p class="text-xs text-gray-500">Target: ${log.targetType} ${
    log.targetId ? `(ID: ${log.targetId})` : ""
  }</p>
      </div>
    </div>
  `;

  return div;
}

// =====================================================
// FILTER CAUSES (Changed from Donations)
// =====================================================
function filterDonations() {
  const auditStatus = document.getElementById("filter-audit-status").value;
  const category = document.getElementById("filter-status").value; // Changed - filter by category not status
  const startDate = document.getElementById("filter-start-date").value;

  const filters = {};
  if (auditStatus) filters.auditStatus = auditStatus;
  if (category) filters.category = category; // Changed - filter by category
  if (startDate) filters.startDate = startDate;

  loadCausesForAudit(filters); // Changed from loadDonationsForVerification
}

// =====================================================
// FILTER AUDIT LOGS
// =====================================================
function filterAuditLogs() {
  const action = document.getElementById("filter-log-action").value;
  const date = document.getElementById("filter-log-date").value;

  const filters = {};
  if (action) filters.action = action;
  if (date) filters.startDate = date;

  loadAuditLogs(filters);
}

// =====================================================
// LOAD CAUSES FOR REPORT
// =====================================================
async function loadCausesForReport() {
  try {
    const response = await window.API.causes.getAll();

    if (response.success) {
      const select = document.getElementById("report-cause-filter");
      select.innerHTML = '<option value="">Semua Program</option>';

      // Extract unique categories
      const categories = new Set(response.data.map(c => c.category));
      
      // Create category options
      categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error("❌ Error loading causes:", error);
  }
}

// =====================================================
// GENERATE AUDIT REPORT (Now for Causes)
// =====================================================
async function generateAuditReport() {
  try {
    showLoading("Menggenerate laporan audit program...");

    const startDate = document.getElementById("report-start-date").value;
    const endDate = document.getElementById("report-end-date").value;
    const category = document.getElementById("report-cause-filter").value; // Changed from causeId
    const auditStatus = document.getElementById("report-audit-status").value;

    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (category) filters.category = category; // Changed from causeId
    if (auditStatus) filters.auditStatus = auditStatus;

    const response = await window.API.auditor.generateReport(filters);

    if (response.success) {
      generateCauseAuditPDF(response.data);
      showNotification("Laporan audit program berhasil di-generate!", "success");
    }

    hideLoading();
  } catch (error) {
    console.error("❌ Error generating report:", error);
    hideLoading();
    showNotification("Gagal generate laporan audit", "error");
  }
}

// =====================================================
// GENERATE CAUSE AUDIT PDF
// =====================================================
function generateCauseAuditPDF(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Colors
  const primaryColor = [30, 64, 175]; // Blue-800
  const secondaryColor = [147, 51, 234]; // Purple-600
  const headerBg = [243, 232, 255]; // Purple-100

  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // ===== HEADER =====
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.roundedRect(margin, margin, 15, 15, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("❤", margin + 4.5, margin + 11);

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(20);
  doc.setFont(undefined, "bold");
  doc.text("DARIKITA", margin + 18, margin + 8);

  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Platform Donasi Digital", margin + 18, margin + 13);

  // Report title
  doc.setFillColor(headerBg[0], headerBg[1], headerBg[2]);
  doc.rect(margin, margin + 20, pageWidth - 2 * margin, 25, "F");

  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("LAPORAN AUDIT TRANSPARANSI PROGRAM DONASI", margin + 5, margin + 28);

  let yPos = margin + 36;

  // ===== AUDITOR INFO =====
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(`Auditor: ${data.generatedBy.name}`, margin + 5, yPos);

  yPos += 6;
  doc.text(`Email: ${data.generatedBy.email}`, margin + 5, yPos);

  yPos += 6;
  const reportDate = new Date(data.generatedAt).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.text(`Tanggal Generate: ${reportDate}`, margin + 5, yPos);

  // Period info
  if (data.filters.startDate || data.filters.endDate) {
    yPos += 6;
    const startStr = data.filters.startDate
      ? new Date(data.filters.startDate).toLocaleDateString("id-ID")
      : "-";
    const endStr = data.filters.endDate
      ? new Date(data.filters.endDate).toLocaleDateString("id-ID")
      : "-";
    doc.text(`Periode: ${startStr} s.d ${endStr}`, margin + 5, yPos);
  }

  yPos += 12;

  // ===== SUMMARY BOX =====
  doc.setFillColor(headerBg[0], headerBg[1], headerBg[2]);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 30, 2, 2, "F");

  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("RINGKASAN AUDIT PROGRAM:", margin + 5, yPos + 7);

  yPos += 13;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  const summaryData = [
    `Total Program: ${data.summary.totalPrograms}`,
    `Total Dana: ${formatCurrency(data.summary.totalAmount)}`,
    `Verified: ${data.summary.verifiedCount}`,
    `Flagged: ${data.summary.flaggedCount}`,
    `Pending: ${data.summary.pendingCount}`,
  ];

  summaryData.forEach((text, idx) => {
    const xOffset = idx < 3 ? margin + 5 : margin + 100;
    const yOffset = yPos + (idx % 3) * 6;
    doc.text(text, xOffset, yOffset);
  });

  yPos += 24;

  // ===== TRANSPARENCY SUMMARY =====
  doc.setFillColor(219, 234, 254); // Blue-100
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 15, 2, 2, "F");

  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.setTextColor(30, 64, 175);
  doc.text("TRANSPARANSI PENYALURAN:", margin + 5, yPos + 6);

  yPos += 10;
  doc.setTextColor(0, 0, 0);
  doc.text(
    `Dana Disalurkan: ${formatCurrency(data.summary.distributedAmount)}`,
    margin + 5,
    yPos
  );
  doc.text(
    `Sisa Dana: ${formatCurrency(data.summary.remainingAmount)}`,
    margin + 100,
    yPos
  );

  yPos += 12;

  // ===== CAUSES AUDIT TABLE =====
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("DETAIL AUDIT PROGRAM DONASI:", margin, yPos);

  yPos += 8;

  const tableData = data.causes.map((c, index) => [
    (index + 1).toString(),
    c.title.length > 20 ? c.title.substring(0, 20) + "..." : c.title,
    formatCurrency(c.totalReceived),
    formatCurrency(c.totalDisbursed),
    `${c.disbursementPercentage}%`,
    c.auditStatus === "audit_verified"
      ? "Verified"
      : c.auditStatus === "audit_flagged"
      ? "Flagged"
      : "Pending",
  ]);

  doc.autoTable({
    startY: yPos,
    head: [["No", "Nama Program", "Dana Masuk", "Dana Keluar", "% Disalur", "Status Audit"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [147, 51, 234], // Purple-600
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [0, 0, 0],
    },
    alternateRowStyles: {
      fillColor: [250, 245, 255], // Purple-50
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { halign: "left", cellWidth: 40 },
      2: { halign: "right", cellWidth: 28 },
      3: { halign: "right", cellWidth: 28 },
      4: { halign: "center", cellWidth: 18 },
      5: { halign: "center", cellWidth: 25 },
    },
    margin: { left: margin, right: margin },
  });

  // ===== FOOTER =====
  const finalY = doc.lastAutoTable.finalY + 10;

  if (finalY < pageHeight - 30) {
    doc.setFillColor(headerBg[0], headerBg[1], headerBg[2]);
    doc.rect(margin, finalY, pageWidth - 2 * margin, 20, "F");

    doc.setFontSize(9);
    doc.setFont(undefined, "italic");
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    const footerText = "Laporan ini dibuat oleh sistem audit DariKita";
    doc.text(footerText, pageWidth / 2, finalY + 8, { align: "center" });

    doc.setFontSize(8);
    doc.setFont(undefined, "bold");
    const footerText2 = "Platform DariKita - Transparansi untuk Kepercayaan";
    doc.text(footerText2, pageWidth / 2, finalY + 14, { align: "center" });
  }

  // Save PDF
  const fileName = `Laporan_Audit_Program_${data.generatedBy.name.replace(
    /\s+/g,
    "_"
  )}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function formatCurrency(amount) {
  return window.utils.formatCurrency(amount);
}

function redirectBasedOnRole(role) {
  window.utils.redirectBasedOnRole(role);
}

function toggleSidebar() {
  window.utils.toggleSidebar();
}

function handleLogout() {
  window.utils.logout();
}

function showLoading(message) {
  window.utils.showLoading(message);
}

function hideLoading() {
  window.utils.hideLoading();
}

function showNotification(message, type) {
  window.utils.showNotification(message, type);
}

console.log("✅ Auditor.js loaded successfully");
