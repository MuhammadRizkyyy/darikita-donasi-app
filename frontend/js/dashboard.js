// =====================================================
// DASHBOARD.JS - Donatur Dashboard Logic (Updated)
// =====================================================

// Check authentication on page load
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Dashboard initialized");

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

    // Check if user is donatur role
    if (user.role !== "donatur") {
      console.log("⚠️ Wrong role:", user.role);
      showNotification(
        "Akses ditolak. Ini adalah halaman khusus donatur.",
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
    console.log("📊 Loading dashboard data...");

    // Setup event listeners
    setupEventListeners();

    // Load user profile and donations together
    await loadDashboardData();

    console.log("✅ Dashboard loaded successfully");
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
  // Logout buttons
  document
    .getElementById("logout-btn")
    ?.addEventListener("click", handleLogout);
  document
    .getElementById("logout-btn-mobile")
    ?.addEventListener("click", handleLogout);

  // Mobile menu toggle
  document
    .getElementById("mobile-menu-btn")
    ?.addEventListener("click", toggleMobileMenu);

  // Download button (old JSON export)
  document
    .getElementById("download-btn")
    ?.addEventListener("click", handleDownloadData);

  // PDF Report button (NEW) ← TAMBAHKAN INI
  setupPDFReportListener();
}

// =====================================================
// LOAD DASHBOARD DATA
// =====================================================
async function loadDashboardData() {
  try {
    console.log("📊 Loading dashboard data...");

    // Load user profile
    const profileResponse = await window.API.auth.getMe();

    // Load donation history (with stats)
    const donationsResponse = await window.API.donations.getMyDonations();

    if (profileResponse.success && donationsResponse.success) {
      const user = profileResponse.data.user;
      const donations = donationsResponse.data;
      const stats = donationsResponse.stats || {};

      console.log("✅ Profile and donations loaded");

      // Display profile with stats from donations
      displayUserProfile(user, stats);

      // Display donation history
      displayDonationHistory(donations);
    } else {
      throw new Error("Failed to load dashboard data");
    }
  } catch (error) {
    console.error("❌ Error loading dashboard:", error);

    // Fallback to localStorage data
    const userData = localStorage.getItem("userData");
    if (userData) {
      const user = JSON.parse(userData);
      displayUserProfile(user);
    }

    // Show empty state for donations
    const loading = document.getElementById("donations-loading");
    const empty = document.getElementById("donations-empty");
    if (loading) loading.classList.add("hidden");
    if (empty) empty.classList.remove("hidden");

    showNotification("Gagal memuat data dashboard", "error");
  }
}

// =====================================================
// DISPLAY USER PROFILE
// =====================================================
function displayUserProfile(user, stats = {}) {
  // Update header name
  const headerName = document.getElementById("user-name-header");
  if (headerName) {
    headerName.textContent = user.name;
  }

  // Update profile fields
  const nameEl = document.getElementById("user-name");
  const emailEl = document.getElementById("user-email");
  const totalAmountEl = document.getElementById("total-amount");
  const donationCountEl = document.getElementById("donation-count");

  if (nameEl) nameEl.textContent = user.name;
  if (emailEl) emailEl.textContent = user.email;

  // Use stats from API or fallback to user data
  const totalAmount = stats.totalAmount ?? user.totalAmount ?? 0;
  const totalDonations = stats.totalDonations ?? user.totalDonations ?? 0;

  if (totalAmountEl) totalAmountEl.textContent = formatCurrency(totalAmount);
  if (donationCountEl) donationCountEl.textContent = totalDonations;

  // Show profile content, hide loading
  const loading = document.getElementById("profile-loading");
  const content = document.getElementById("profile-content");

  if (loading) loading.classList.add("hidden");
  if (content) content.classList.remove("hidden");

  console.log("✅ Profile displayed");
}

// =====================================================
// DISPLAY DONATION HISTORY
// =====================================================
function displayDonationHistory(donations) {
  const loading = document.getElementById("donations-loading");
  const empty = document.getElementById("donations-empty");
  const list = document.getElementById("donations-list");

  // Hide loading
  if (loading) loading.classList.add("hidden");

  // Check if empty
  if (!donations || donations.length === 0) {
    if (empty) empty.classList.remove("hidden");
    if (list) list.classList.add("hidden");
    return;
  }

  // Show list
  if (empty) empty.classList.add("hidden");
  if (list) {
    list.classList.remove("hidden");
    list.innerHTML = "";

    // Sort by date (newest first)
    const sortedDonations = donations.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Display each donation
    sortedDonations.forEach((donation, index) => {
      const donationCard = createDonationCard(donation, index);
      list.appendChild(donationCard);
    });
  }

  console.log(`✅ Displayed ${donations.length} donations`);
}

// =====================================================
// CREATE DONATION CARD
// =====================================================
function createDonationCard(donation, index) {
  const card = document.createElement("div");
  card.className =
    "bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-blue-300 transition-all card-hover fade-in";
  card.style.animationDelay = `${index * 0.1}s`;

  // Status badge color
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    verified: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    expired: "bg-gray-100 text-gray-800",
  };

  const statusLabels = {
    pending: "Menunggu",
    verified: "Berhasil",
    failed: "Gagal",
    expired: "Kadaluarsa",
  };

  const statusColor = statusColors[donation.status] || statusColors.pending;
  const statusLabel = statusLabels[donation.status] || donation.status;

  // Format date
  const date = new Date(donation.createdAt);
  const formattedDate = date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Cause title
  const causeTitle = donation.cause?.title || "Program Donasi";
  const causeCategory = donation.cause?.category || "Umum";

  card.innerHTML = `
    <div class="flex flex-col md:flex-row md:items-center md:justify-between">
      <!-- Left Section -->
      <div class="flex-1 mb-4 md:mb-0">
        <div class="flex items-start mb-2">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
            <i class="fas fa-hand-holding-heart text-blue-600 text-xl"></i>
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-bold text-gray-900 mb-1">${causeTitle}</h3>
            <div class="flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <span class="flex items-center">
                <i class="fas fa-tag mr-1"></i>
                ${causeCategory}
              </span>
              <span class="text-gray-400">•</span>
              <span class="flex items-center">
                <i class="fas fa-calendar-alt mr-1"></i>
                ${formattedDate}
              </span>
            </div>
            ${
              donation.message
                ? `
              <p class="text-sm text-gray-600 mt-2 italic">
                <i class="fas fa-comment mr-1"></i>
                "${donation.message}"
              </p>
            `
                : ""
            }
          </div>
        </div>
      </div>
      
      <!-- Right Section -->
      <div class="flex items-center justify-between md:justify-end md:space-x-4">
        <div class="text-right mr-4">
          <p class="text-2xl font-bold text-blue-600">${formatCurrency(
            donation.amount
          )}</p>
          ${
            donation.isAnonymous
              ? `
            <p class="text-xs text-gray-500 mt-1">
              <i class="fas fa-user-secret mr-1"></i>Anonim
            </p>
          `
              : ""
          }
        </div>
        <span class="px-4 py-2 rounded-lg text-sm font-semibold ${statusColor}">
          ${statusLabel}
        </span>
      </div>
    </div>
    
    ${
      donation.distributionStatus && donation.distributionStatus !== "pending"
        ? `
      <div class="mt-4 pt-4 border-t border-gray-200">
        <div class="flex items-center text-sm">
          <i class="fas fa-truck text-green-600 mr-2"></i>
          <span class="text-gray-600">Status Distribusi: </span>
          <span class="ml-2 font-semibold ${
            donation.distributionStatus === "distributed"
              ? "text-green-600"
              : "text-blue-600"
          }">
            ${
              donation.distributionStatus === "distributed"
                ? "Sudah Disalurkan"
                : "Sudah Digunakan"
            }
          </span>
        </div>
        ${
          donation.distributionNote
            ? `
          <p class="text-sm text-gray-600 mt-2">
            <i class="fas fa-info-circle mr-1"></i>
            ${donation.distributionNote}
          </p>
        `
            : ""
        }
      </div>
    `
        : ""
    }
  `;

  return card;
}

// =====================================================
// HANDLE LOGOUT
// =====================================================
function handleLogout() {
  if (confirm("Apakah Anda yakin ingin keluar?")) {
    console.log("👋 Logging out...");

    // Clear all auth data
    window.API.auth.logout();

    showNotification("Berhasil logout. Sampai jumpa!", "success");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
  }
}

// =====================================================
// TOGGLE MOBILE MENU
// =====================================================
function toggleMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  if (menu) {
    menu.classList.toggle("hidden");
  }
}

// =====================================================
// HANDLE DOWNLOAD DATA
// =====================================================
async function handleDownloadData() {
  try {
    console.log("📥 Downloading user data...");
    showLoading("Mengekspor data...");

    // Get user profile
    const profileResponse = await window.API.auth.getMe();
    const user = profileResponse.data.user;

    // Get donations
    const donationsResponse = await window.API.donations.getMyDonations();
    const donations = donationsResponse.data;
    const stats = donationsResponse.stats || {};

    // Prepare data
    const exportData = {
      profile: {
        name: user.name,
        email: user.email,
        phone: user.phone || "-",
        totalDonations: stats.totalDonations || user.totalDonations || 0,
        totalAmount: stats.totalAmount || user.totalAmount || 0,
        memberSince: new Date(user.createdAt).toLocaleDateString("id-ID"),
      },
      donations: donations.map((d) => ({
        cause: d.cause?.title || "Program Donasi",
        category: d.cause?.category || "Umum",
        amount: d.amount,
        status: d.status,
        date: new Date(d.createdAt).toLocaleDateString("id-ID"),
        message: d.message || "-",
        isAnonymous: d.isAnonymous,
        distributionStatus: d.distributionStatus || "pending",
      })),
      summary: {
        totalDonations: stats.totalDonations || donations.length,
        totalAmount: stats.totalAmount || 0,
        verifiedDonations: donations.filter((d) => d.status === "verified")
          .length,
        pendingDonations: donations.filter((d) => d.status === "pending")
          .length,
        exportDate: new Date().toLocaleDateString("id-ID"),
      },
    };

    // Convert to JSON string
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    // Create download link
    const url = window.URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `darikita-data-${user.name.replace(
      /\s+/g,
      "-"
    )}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    hideLoading();
    showNotification("Data berhasil diekspor!", "success");

    console.log("✅ Data exported successfully");
  } catch (error) {
    hideLoading();
    console.error("❌ Error downloading data:", error);
    showNotification("Gagal mengekspor data", "error");
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function redirectBasedOnRole(role) {
  switch (role) {
    case "admin":
      window.location.href = "admin.html";
      break;
    case "auditor":
      window.location.href = "auditor.html";
      break;
    default:
      window.location.href = "dashboard.html";
      break;
  }
}

function showLoading(message = "Loading...") {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) {
    overlay.classList.remove("hidden");
  }
}

function hideLoading() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) {
    overlay.classList.add("hidden");
  }
}

function showNotification(message, type = "info") {
  // Remove existing notification
  const existingNotif = document.getElementById("notification-toast");
  if (existingNotif) {
    existingNotif.remove();
  }

  const notif = document.createElement("div");
  notif.id = "notification-toast";
  notif.className = "fixed top-4 right-4 z-50";
  notif.style.animation = "slideIn 0.3s ease-out";

  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  };

  const icons = {
    success: "fa-check-circle",
    error: "fa-times-circle",
    warning: "fa-exclamation-triangle",
    info: "fa-info-circle",
  };

  notif.innerHTML = `
    <div class="${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 min-w-[320px] max-w-md">
      <i class="fas ${icons[type]} text-xl flex-shrink-0"></i>
      <span class="flex-1">${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200 transition-colors flex-shrink-0">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;

  document.body.appendChild(notif);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notif && notif.parentElement) {
      notif.style.animation = "slideOut 0.3s ease-in";
      setTimeout(() => notif.remove(), 300);
    }
  }, 5000);
}

// Add CSS animations
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// =====================================================
// DOWNLOAD PDF REPORT FUNCTIONALITY
// =====================================================

// Setup PDF report event listener
function setupPDFReportListener() {
  const downloadBtn = document.getElementById("download-report-btn");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", handleDownloadPDFReport);
    console.log("✅ PDF report button listener added");
  }
}

// Call this function in setupEventListeners()
// Add this line to the setupEventListeners() function:
// setupPDFReportListener();

// Handle download PDF report
async function handleDownloadPDFReport() {
  try {
    showLoading("Menggenerate laporan PDF...");
    console.log("📄 Generating PDF report...");

    // Get date filters
    const startDate = document.getElementById("report-start-date").value;
    const endDate = document.getElementById("report-end-date").value;

    // Get user profile
    const profileResponse = await window.API.auth.getMe();
    const user = profileResponse.data.user;

    // Get donations
    const donationsResponse = await window.API.donations.getMyDonations();
    let donations = donationsResponse.data || [];

    // Filter donations by date if provided
    if (startDate || endDate) {
      donations = donations.filter((d) => {
        const donationDate = new Date(d.createdAt);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start && end) {
          return donationDate >= start && donationDate <= end;
        } else if (start) {
          return donationDate >= start;
        } else if (end) {
          return donationDate <= end;
        }
        return true;
      });
    }

    // Only show verified donations in report
    const verifiedDonations = donations.filter(
      (d) => d.status === "verified" || d.status === "pending"
    );

    if (verifiedDonations.length === 0) {
      hideLoading();
      showNotification(
        "Tidak ada donasi untuk periode yang dipilih",
        "warning"
      );
      return;
    }

    // Calculate totals
    const totalAmount = verifiedDonations.reduce((sum, d) => sum + d.amount, 0);
    const totalTransactions = verifiedDonations.length;

    // Prepare report data
    const reportData = {
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone || "-",
      },
      summary: {
        totalTransactions,
        totalAmount,
      },
      donations: verifiedDonations.map((d) => ({
        _id: d._id,
        date: d.createdAt,
        program: d.cause?.title || "Program Donasi",
        category: d.cause?.category || "umum",
        amount: d.amount,
        status: d.distributionStatus || "pending",
      })),
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    };

    // Generate PDF
    generateDonorPDFReport(reportData);

    hideLoading();
    showNotification("Laporan PDF berhasil didownload!", "success");
    console.log("✅ PDF report generated successfully");
  } catch (error) {
    hideLoading();
    console.error("❌ Error generating PDF report:", error);
    showNotification("Gagal menggenerate laporan PDF", "error");
  }
}

// Generate Donor PDF Report
function generateDonorPDFReport(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Colors
  const primaryColor = [30, 64, 175]; // Blue-800
  const secondaryColor = [59, 130, 246]; // Blue-500
  const headerBg = [219, 234, 254]; // Blue-100

  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // ===== HEADER =====
  // Logo/Icon area
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.roundedRect(margin, margin, 15, 15, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("❤", margin + 4.5, margin + 11);

  // Title
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(20);
  doc.setFont(undefined, "bold");
  doc.text("DARIKITA", margin + 18, margin + 8);

  // Subtitle
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Platform Donasi Digital", margin + 18, margin + 13);

  // Report title
  doc.setFillColor(headerBg[0], headerBg[1], headerBg[2]);
  doc.rect(margin, margin + 20, pageWidth - 2 * margin, 25, "F");

  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("LAPORAN DONASI PRIBADI – DARIKITA", margin + 5, margin + 28);

  let yPos = margin + 36;

  // ===== DONOR INFO =====
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(`Nama Donatur  : ${data.user.name}`, margin + 5, yPos);

  yPos += 6;
  doc.text(`Email Donatur  : ${data.user.email}`, margin + 5, yPos);

  yPos += 6;
  const currentDate = new Date().toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(`Tanggal Laporan: ${currentDate}`, margin + 5, yPos);

  // Add period info if filters applied
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
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 20, 2, 2, "F");

  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("RINGKASAN DONASI:", margin + 5, yPos + 7);

  yPos += 13;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  // Convert number to words for Indonesian (simple version)
  const numberWords = convertNumberToWords(data.summary.totalTransactions);
  doc.text(
    `Jumlah Transaksi: ${data.summary.totalTransactions} (${numberWords})`,
    margin + 5,
    yPos
  );

  const totalFormatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 2,
  }).format(data.summary.totalAmount);

  doc.text(`Total Donasi: ${totalFormatted}`, margin + 100, yPos);

  yPos += 12;

  // ===== DONATIONS TABLE =====
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("RIWAYAT DETAIL DONASI:", margin, yPos);

  yPos += 8;

  // Table data
  const tableData = data.donations.map((d, index) => [
    (index + 1).toString(),
    new Date(d.date).toLocaleDateString("id-ID"),
    d.program,
    capitalizeFirstLetter(d.category),
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 2,
    }).format(d.amount),
    d.status === "distributed" ? "Sudah\nDisalurkan" : "Belum\nDisalurkan",
  ]);

  doc.autoTable({
    startY: yPos,
    head: [
      ["No", "Tanggal\nDonasi", "Program", "Kategori", "Jumlah", "Status"],
    ],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [30, 64, 175],
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
      fillColor: [245, 247, 250],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { halign: "center", cellWidth: 25 },
      2: { halign: "left", cellWidth: 50 },
      3: { halign: "center", cellWidth: 25 },
      4: { halign: "right", cellWidth: 35 },
      5: { halign: "center", cellWidth: 30 },
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
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    const footerText =
      "Terima kasih atas kontribusi Anda untuk membantu sesama!";
    doc.text(footerText, pageWidth / 2, finalY + 8, { align: "center" });

    doc.setFontSize(8);
    doc.setFont(undefined, "bold");
    const footerText2 =
      "Platform DariKita - Lebih Dekat, Lebih Tepat, Lebih Bermanfaat";
    doc.text(footerText2, pageWidth / 2, finalY + 14, { align: "center" });
  }

  // Save PDF
  const fileName = `Laporan_Donasi_${data.user.name.replace(/\s+/g, "_")}_${
    new Date().toISOString().split("T")[0]
  }.pdf`;
  doc.save(fileName);
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

// Convert number to Indonesian words (1-10)
function convertNumberToWords(num) {
  const words = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
  ];

  if (num <= 10) {
    return words[num];
  } else if (num < 20) {
    return words[num - 10] + " Belas";
  } else if (num < 100) {
    const tens = Math.floor(num / 10);
    const ones = num % 10;
    return words[tens] + " Puluh" + (ones > 0 ? " " + words[ones] : "");
  } else if (num < 1000) {
    const hundreds = Math.floor(num / 100);
    const remainder = num % 100;
    return (
      (hundreds === 1 ? "Seratus" : words[hundreds] + " Ratus") +
      (remainder > 0 ? " " + convertNumberToWords(remainder) : "")
    );
  } else {
    return num.toString(); // Fallback for large numbers
  }
}

// Capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// =====================================================
// UPDATE setupEventListeners() FUNCTION
// =====================================================
// IMPORTANT: Add this line to the existing setupEventListeners() function:
// setupPDFReportListener();
//
// The setupEventListeners() function should now look like this:
//
// function setupEventListeners() {
//   // Logout buttons
//   document.getElementById("logout-btn")?.addEventListener("click", handleLogout);
//   document.getElementById("logout-btn-mobile")?.addEventListener("click", handleLogout);
//
//   // Mobile menu toggle
//   document.getElementById("mobile-menu-btn")?.addEventListener("click", toggleMobileMenu);
//
//   // Download button (old JSON export)
//   document.getElementById("download-btn")?.addEventListener("click", handleDownloadData);
//
//   // PDF Report button (NEW)
//   setupPDFReportListener();
// }

console.log("✅ Dashboard.js loaded successfully");
