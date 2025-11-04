// =====================================================
// DASHBOARD.JS - Donatur Dashboard Logic
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

    // Load user profile
    await loadUserProfile();

    // Load donation history
    await loadDonationHistory();

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

  // Download button
  document
    .getElementById("download-btn")
    ?.addEventListener("click", handleDownloadData);
}

// =====================================================
// LOAD USER PROFILE
// =====================================================
async function loadUserProfile() {
  try {
    console.log("👤 Loading user profile...");

    // Get fresh user data from API
    const response = await window.API.auth.getMe();

    if (response.success) {
      const user = response.data.user;
      console.log("✅ User profile loaded:", user);

      // Update localStorage with fresh data
      const userData = JSON.parse(localStorage.getItem("userData"));
      const updatedUserData = {
        ...userData,
        ...user,
      };
      localStorage.setItem("userData", JSON.stringify(updatedUserData));

      // Display profile data
      displayUserProfile(user);
    } else {
      throw new Error(response.message || "Failed to load profile");
    }
  } catch (error) {
    console.error("❌ Error loading profile:", error);

    // Fallback to localStorage data
    const userData = localStorage.getItem("userData");
    if (userData) {
      const user = JSON.parse(userData);
      displayUserProfile(user);
    } else {
      showNotification("Gagal memuat profil", "error");
    }
  }
}

// =====================================================
// DISPLAY USER PROFILE
// =====================================================
function displayUserProfile(user) {
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
  if (totalAmountEl)
    totalAmountEl.textContent = formatCurrency(user.totalAmount || 0);
  if (donationCountEl) donationCountEl.textContent = user.totalDonations || 0;

  // Show profile content, hide loading
  const loading = document.getElementById("profile-loading");
  const content = document.getElementById("profile-content");

  if (loading) loading.classList.add("hidden");
  if (content) content.classList.remove("hidden");

  console.log("✅ Profile displayed");
}

// =====================================================
// LOAD DONATION HISTORY
// =====================================================
async function loadDonationHistory() {
  try {
    console.log("💰 Loading donation history...");

    const response = await window.API.donations.getMyDonations();

    if (response.success) {
      const donations = response.data;
      console.log(`✅ Loaded ${donations.length} donations`);

      displayDonationHistory(donations);
    } else {
      throw new Error(response.message || "Failed to load donations");
    }
  } catch (error) {
    console.error("❌ Error loading donations:", error);

    // Hide loading, show empty state
    const loading = document.getElementById("donations-loading");
    const empty = document.getElementById("donations-empty");

    if (loading) loading.classList.add("hidden");
    if (empty) empty.classList.remove("hidden");

    showNotification("Gagal memuat riwayat donasi", "error");
  }
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
}

// =====================================================
// CREATE DONATION CARD
// =====================================================
function createDonationCard(donation, index) {
  const card = document.createElement("div");
  card.className =
    "bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-blue-300 transition-all card-hover";
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

    // Prepare data
    const exportData = {
      profile: {
        name: user.name,
        email: user.email,
        phone: user.phone || "-",
        totalDonations: user.totalDonations,
        totalAmount: user.totalAmount,
        memberSince: new Date(user.createdAt).toLocaleDateString("id-ID"),
      },
      donations: donations.map((d) => ({
        cause: d.cause?.title || "Program Donasi",
        amount: d.amount,
        status: d.status,
        date: new Date(d.createdAt).toLocaleDateString("id-ID"),
        message: d.message || "-",
        isAnonymous: d.isAnonymous,
      })),
      summary: {
        totalDonations: user.totalDonations,
        totalAmount: user.totalAmount,
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

console.log("✅ Dashboard.js loaded successfully");
