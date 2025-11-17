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
      displayTransparencyChart(charts.causesTransparency);
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
// DISPLAY TRANSPARENCY CHART
// =====================================================
function displayTransparencyChart(data) {
  const container = document.getElementById("transparency-chart");
  container.innerHTML = "";

  if (!data || data.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-chart-pie text-4xl mb-2"></i>
        <p>Belum ada data transparansi</p>
      </div>
    `;
    return;
  }

  data.slice(0, 5).forEach((cause) => {
    const percentage = cause.disbursementPercentage || 0;
    const remaining = cause.remainingFunds || 0;

    const item = document.createElement("div");
    item.className =
      "border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors";
    item.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <h4 class="font-semibold text-gray-900 text-sm">${cause.title}</h4>
        <span class="text-xs font-bold ${
          percentage >= 80
            ? "text-green-600"
            : percentage >= 50
            ? "text-blue-600"
            : "text-orange-600"
        }">${percentage.toFixed(1)}%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div class="h-2 rounded-full ${
          percentage >= 80
            ? "bg-green-500"
            : percentage >= 50
            ? "bg-blue-500"
            : "bg-orange-500"
        }" style="width: ${percentage}%"></div>
      </div>
      <div class="flex items-center justify-between text-xs text-gray-600">
        <span>Terkumpul: ${formatCurrency(cause.currentAmount)}</span>
        <span>Sisa: ${formatCurrency(remaining)}</span>
      </div>
    `;
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
        loadDonationsForVerification();
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
// LOAD DONATIONS FOR VERIFICATION
// =====================================================
async function loadDonationsForVerification(filters = {}) {
  try {
    showLoading("Memuat data donasi...");

    const response = await window.API.auditor.getAllDonations(filters);

    const container = document.getElementById("donations-list");
    container.innerHTML = "";

    if (response.success && response.data.length > 0) {
      const wrapper = document.createElement("div");
      wrapper.className = "divide-y divide-gray-200";

      response.data.forEach((donation) => {
        const item = createDonationItem(donation);
        wrapper.appendChild(item);
      });

      container.appendChild(wrapper);
    } else {
      container.innerHTML = `
        <div class="text-center py-12 text-gray-500">
          <i class="fas fa-inbox text-5xl mb-4"></i>
          <p class="text-lg font-medium">Tidak ada donasi ditemukan</p>
        </div>
      `;
    }

    hideLoading();
  } catch (error) {
    console.error("❌ Error loading donations:", error);
    hideLoading();
    showNotification("Gagal memuat data donasi", "error");
  }
}

// =====================================================
// CREATE DONATION ITEM
// =====================================================
function createDonationItem(donation) {
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

  const distributionLabels = {
    pending: "Belum Disalurkan",
    distributed: "Sudah Disalurkan",
    used: "Sudah Digunakan",
  };

  div.innerHTML = `
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div class="flex-1">
        <div class="flex items-center mb-2">
          <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
            <i class="fas fa-hand-holding-heart text-blue-600"></i>
          </div>
          <div>
            <h3 class="font-bold text-gray-900">${
              donation.cause?.title || "N/A"
            }</h3>
            <p class="text-sm text-gray-600">${
              donation.user?.name || "Anonymous"
            } • ${new Date(donation.createdAt).toLocaleDateString("id-ID")}</p>
          </div>
        </div>
        <div class="ml-13 space-y-1">
          <p class="text-sm text-gray-700">
            <span class="font-semibold">Jumlah:</span> ${formatCurrency(
              donation.amount
            )}
          </p>
          <p class="text-sm text-gray-700">
            <span class="font-semibold">Status Distribusi:</span> ${
              distributionLabels[donation.distributionStatus]
            }
          </p>
          ${
            donation.auditedBy
              ? `
            <p class="text-xs text-gray-500">
              Diaudit oleh: ${donation.auditedBy.name} pada ${new Date(
                  donation.auditedAt
                ).toLocaleDateString("id-ID")}
            </p>
          `
              : ""
          }
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="px-3 py-1 rounded-lg text-sm font-semibold ${
          auditStatusColors[donation.auditStatus] ||
          auditStatusColors.pending_audit
        }">
          ${auditStatusLabels[donation.auditStatus] || "Pending"}
        </span>
        <button
          onclick="viewDonationDetail('${donation._id}')"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <i class="fas fa-eye mr-1"></i>Detail
        </button>
      </div>
    </div>
  `;

  return div;
}

// =====================================================
// VIEW DONATION DETAIL
// =====================================================
async function viewDonationDetail(donationId) {
  try {
    showLoading("Memuat detail donasi...");

    const response = await window.API.auditor.getDonationDetail(donationId);

    if (response.success) {
      const donation = response.data;
      showDonationDetailModal(donation);
    }

    hideLoading();
  } catch (error) {
    console.error("❌ Error loading donation detail:", error);
    hideLoading();
    showNotification("Gagal memuat detail donasi", "error");
  }
}

// =====================================================
// SHOW DONATION DETAIL MODAL
// =====================================================
function showDonationDetailModal(donation) {
  const modal = document.getElementById("donation-detail-modal");
  const auditDisabled =
    donation.auditStatus === "audit_verified" ||
    donation.auditStatus === "audit_flagged";

  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-xl max-w-3xl w-full">
      <!-- Modal Header -->
      <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl z-10">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold text-gray-900">Detail Donasi</h2>
          <button onclick="closeDonationModal()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>
      </div>

      <!-- Modal Body -->
      <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        <!-- Donation Info -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 class="font-bold text-gray-900 mb-3">Informasi Donasi</h3>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <p class="text-sm text-gray-600">Donatur</p>
              <p class="font-semibold text-gray-900">${
                donation.user?.name || "Anonymous"
              }</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Email</p>
              <p class="font-semibold text-gray-900">${
                donation.user?.email || "-"
              }</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Program</p>
              <p class="font-semibold text-gray-900">${
                donation.cause?.title || "N/A"
              }</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Kategori</p>
              <p class="font-semibold text-gray-900 capitalize">${
                donation.cause?.category || "N/A"
              }</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Jumlah Donasi</p>
              <p class="font-semibold text-green-600 text-lg">${formatCurrency(
                donation.amount
              )}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Tanggal</p>
              <p class="font-semibold text-gray-900">${new Date(
                donation.createdAt
              ).toLocaleDateString("id-ID")}</p>
            </div>
          </div>
        </div>

        <!-- Distribution Info -->
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 class="font-bold text-gray-900 mb-3">Informasi Penyaluran</h3>
          <div class="space-y-2">
            <div>
              <p class="text-sm text-gray-600">Status Penyaluran</p>
              <p class="font-semibold text-gray-900 capitalize">${
                donation.distributionStatus === "distributed"
                  ? "Sudah Disalurkan"
                  : donation.distributionStatus === "used"
                  ? "Sudah Digunakan"
                  : "Belum Disalurkan"
              }</p>
            </div>
            ${
              donation.distributionNote
                ? `
              <div>
                <p class="text-sm text-gray-600">Catatan Penyaluran</p>
                <p class="text-gray-900">${donation.distributionNote}</p>
              </div>
            `
                : ""
            }
            ${
              donation.distributionProof &&
              donation.distributionProof.length > 0
                ? `
              <div>
                <p class="text-sm text-gray-600 mb-2">Bukti Penyaluran</p>
                <div class="grid grid-cols-3 gap-2">
                  ${donation.distributionProof
                    .map(
                      (proof) => `
                    <img src="${proof}" alt="Bukti" class="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80" onclick="window.open('${proof}', '_blank')">
                  `
                    )
                    .join("")}
                </div>
              </div>
            `
                : ""
            }
          </div>
        </div>

        <!-- Audit Form -->
        <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 class="font-bold text-gray-900 mb-3">Audit Verifikasi</h3>
          <form id="audit-form" onsubmit="submitAudit(event, '${
            donation._id
          }')">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Status Audit</label>
                <div class="flex gap-4">
                  <label class="flex items-center cursor-pointer ${
                    auditDisabled ? "opacity-50" : ""
                  }">
                    <input type="radio" name="auditStatus" value="audit_verified" ${
                      donation.auditStatus === "audit_verified" ? "checked" : ""
                    } ${auditDisabled ? "disabled" : ""} class="mr-2" required>
                    <span class="text-gray-700">✓ Verified</span>
                  </label>
                  <label class="flex items-center cursor-pointer ${
                    auditDisabled ? "opacity-50" : ""
                  }">
                    <input type="radio" name="auditStatus" value="audit_flagged" ${
                      donation.auditStatus === "audit_flagged" ? "checked" : ""
                    } ${auditDisabled ? "disabled" : ""} class="mr-2" required>
                    <span class="text-gray-700">⚠ Flagged</span>
                  </label>
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Catatan Audit</label>
                <textarea
                  name="auditNotes"
                  rows="4"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Tambahkan catatan audit..."
                  ${auditDisabled ? "disabled" : ""}
                >${donation.auditNotes || ""}</textarea>
              </div>

              ${
                donation.auditedBy
                  ? `
                <div class="bg-white border border-gray-200 rounded-lg p-3">
                  <p class="text-sm text-gray-600">Terakhir diaudit oleh:</p>
                  <p class="font-semibold text-gray-900">${
                    donation.auditedBy.name
                  }</p>
                  <p class="text-xs text-gray-500">${new Date(
                    donation.auditedAt
                  ).toLocaleString("id-ID")}</p>
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
                  <i class="fas fa-check-circle mr-2"></i>Simpan Audit
                </button>
              `
                  : `
                <div class="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <i class="fas fa-check-circle text-green-600 text-2xl mb-2"></i>
                  <p class="text-sm text-green-700 font-medium">Donasi sudah diaudit</p>
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
// SUBMIT AUDIT
// =====================================================
async function submitAudit(event, donationId) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const auditStatus = formData.get("auditStatus");
  const auditNotes = formData.get("auditNotes");

  try {
    showLoading("Menyimpan audit...");

    const response = await window.API.auditor.markAsAudited(donationId, {
      auditStatus,
      auditNotes,
    });

    if (response.success) {
      showNotification("Audit berhasil disimpan", "success");
      closeDonationModal();
      loadDonationsForVerification();
    }

    hideLoading();
  } catch (error) {
    console.error("❌ Error submitting audit:", error);
    hideLoading();
    showNotification("Gagal menyimpan audit", "error");
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
window.viewDonationDetail = viewDonationDetail;
window.submitAudit = submitAudit;

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
// FILTER DONATIONS
// =====================================================
function filterDonations() {
  const status = document.getElementById("filter-status").value;
  const auditStatus = document.getElementById("filter-audit-status").value;
  const startDate = document.getElementById("filter-start-date").value;

  const filters = {};
  if (status) filters.status = status;
  if (auditStatus) filters.auditStatus = auditStatus;
  if (startDate) filters.startDate = startDate;

  loadDonationsForVerification(filters);
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

      response.data.forEach((cause) => {
        const option = document.createElement("option");
        option.value = cause._id;
        option.textContent = cause.title;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error("❌ Error loading causes:", error);
  }
}

// =====================================================
// GENERATE AUDIT REPORT
// =====================================================
async function generateAuditReport() {
  try {
    showLoading("Menggenerate laporan audit...");

    const startDate = document.getElementById("report-start-date").value;
    const endDate = document.getElementById("report-end-date").value;
    const causeId = document.getElementById("report-cause-filter").value;
    const auditStatus = document.getElementById("report-audit-status").value;

    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (causeId) filters.causeId = causeId;
    if (auditStatus) filters.status = auditStatus;

    const response = await window.API.auditor.generateReport(filters);

    if (response.success) {
      generateAuditPDF(response.data);
      showNotification("Laporan audit berhasil di-generate!", "success");
    }

    hideLoading();
  } catch (error) {
    console.error("❌ Error generating report:", error);
    hideLoading();
    showNotification("Gagal generate laporan audit", "error");
  }
}

// =====================================================
// GENERATE AUDIT PDF
// =====================================================
function generateAuditPDF(data) {
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
  doc.text("LAPORAN AUDIT TRANSPARANSI", margin + 5, margin + 28);

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
  doc.text("RINGKASAN AUDIT:", margin + 5, yPos + 7);

  yPos += 13;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  const summaryData = [
    `Total Transaksi: ${data.summary.totalTransactions}`,
    `Total Donasi: ${formatCurrency(data.summary.totalAmount)}`,
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

  // ===== DONATIONS TABLE =====
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("DETAIL TRANSAKSI DONASI:", margin, yPos);

  yPos += 8;

  const tableData = data.donations.map((d, index) => [
    (index + 1).toString(),
    new Date(d.date).toLocaleDateString("id-ID"),
    d.donor.name,
    d.cause.title.length > 25
      ? d.cause.title.substring(0, 25) + "..."
      : d.cause.title,
    formatCurrency(d.amount),
    d.auditStatus === "audit_verified"
      ? "Verified"
      : d.auditStatus === "audit_flagged"
      ? "Flagged"
      : "Pending",
  ]);

  doc.autoTable({
    startY: yPos,
    head: [["No", "Tanggal", "Donatur", "Program", "Jumlah", "Status Audit"]],
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
      1: { halign: "center", cellWidth: 25 },
      2: { halign: "left", cellWidth: 30 },
      3: { halign: "left", cellWidth: 45 },
      4: { halign: "right", cellWidth: 30 },
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
  const fileName = `Laporan_Audit_${data.generatedBy.name.replace(
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
