// ========================================
// GLOBAL STATE - MUST BE FIRST
// ========================================
let currentUser = null;
let currentCause = null;
let causes = [];
let donations = [];

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener("DOMContentLoaded", async function () {
  console.log("🚀 App initializing...");

  // Check if user is logged in
  await checkAuthStatus();

  // Show landing page
  showPage("landing");

  // Setup event listeners
  setupEventListeners();

  // Handle payment callback if exists
  if (window.location.search.includes("order_id")) {
    await window.Payment.handleCallback();
  }

  console.log("✅ App initialized successfully");
});

// ========================================
// AUTHENTICATION
// ========================================
async function checkAuthStatus() {
  const userData = getUserData();
  const token = getToken();

  if (userData && token) {
    try {
      const response = await window.API.auth.getMe();
      if (response.success) {
        // FIX: Extract user from response.data
        currentUser = response.data.user || response.data;
        updateAuthUI();
        console.log("✅ User authenticated:", currentUser.name);
      } else {
        logout();
      }
    } catch (error) {
      console.error("❌ Auth check failed:", error);
      logout();
    }
  }
}

async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    showLoading("Memproses login...");

    const response = await window.API.auth.login({ email, password });

    hideLoading();

    if (response.success) {
      // FIX: Extract user from response.data
      currentUser = response.data.user;
      updateAuthUI();
      showSuccess("Login berhasil!");

      setTimeout(() => {
        showPage("dashboard");
      }, 1000);
    }
  } catch (error) {
    hideLoading();
    showError(error.message || "Login gagal. Periksa email dan password Anda.");
  }
}

async function handleRegister(event) {
  event.preventDefault();

  const name = document.getElementById("register-name").value;
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;

  try {
    showLoading("Membuat akun...");

    const response = await window.API.auth.register({
      name,
      email,
      password,
      role: "donatur",
    });

    hideLoading();

    if (response.success) {
      // FIX: Extract user from response.data
      currentUser = response.data.user;
      updateAuthUI();
      showSuccess("Registrasi berhasil! Selamat datang di DariKita.");

      // Clear form
      document.getElementById("register-name").value = "";
      document.getElementById("register-email").value = "";
      document.getElementById("register-password").value = "";

      setTimeout(() => {
        showPage("dashboard");
      }, 1500);
    }
  } catch (error) {
    hideLoading();
    showError(error.message || "Registrasi gagal. Silakan coba lagi.");
  }
}

function logout() {
  window.API.auth.logout();
  currentUser = null;
  updateAuthUI();
  showPage("landing");
  showSuccess("Anda telah logout.");
}

function updateAuthUI() {
  const authButtons = document.getElementById("auth-buttons");
  const userMenu = document.getElementById("user-menu");

  if (currentUser) {
    if (authButtons) authButtons.classList.add("hidden");
    if (userMenu) userMenu.classList.remove("hidden");

    const userName = document.getElementById("user-name");
    if (userName) {
      userName.textContent = currentUser.name || "User";
    }
  } else {
    if (authButtons) authButtons.classList.remove("hidden");
    if (userMenu) userMenu.classList.add("hidden");
  }
}

function toggleUserMenu() {
  const dropdown = document.getElementById("user-dropdown");
  if (dropdown) {
    dropdown.classList.toggle("hidden");
  }
}

// ========================================
// NAVIGATION
// ========================================
function showPage(pageId) {
  console.log("📄 Navigating to:", pageId);

  // Hide all pages
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.add("hidden");
  });

  // Show selected page
  const targetPage = document.getElementById(pageId + "-page");
  if (targetPage) {
    targetPage.classList.remove("hidden");
  } else {
    console.error("❌ Page not found:", pageId);
  }

  // Update navigation
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("text-gray-900");
    link.classList.add("text-gray-600");
  });

  // Load page content
  loadPageContent(pageId);
}

async function loadPageContent(pageId) {
  try {
    switch (pageId) {
      case "landing":
        await loadFeaturedCauses();
        break;
      case "causes":
        await loadCauses();
        break;
      case "dashboard":
        if (!currentUser) {
          showPage("login");
          return;
        }
        await loadDashboard();
        break;
      case "transparency":
        await loadTransparencyData();
        break;
    }
  } catch (error) {
    console.error("❌ Error loading page content:", error);
    showError("Gagal memuat data. Silakan refresh halaman.");
  }
}

function setupEventListeners() {
  // Close dropdowns when clicking outside
  document.addEventListener("click", function (event) {
    if (!event.target.closest("#user-menu")) {
      const dropdown = document.getElementById("user-dropdown");
      if (dropdown) {
        dropdown.classList.add("hidden");
      }
    }
  });
}

// ========================================
// CAUSES
// ========================================
async function loadFeaturedCauses() {
  try {
    const response = await window.API.causes.getAll({ status: "active" });

    if (response.success) {
      causes = response.data;
      const container = document.getElementById("featured-causes");
      if (container) {
        const featuredCauses = causes.slice(0, 3);
        container.innerHTML = featuredCauses
          .map((cause) => createCauseCard(cause))
          .join("");
      }
    }
  } catch (error) {
    console.error("❌ Failed to load featured causes:", error);
  }
}

async function loadCauses() {
  try {
    console.log("📦 Loading causes...");

    const categoryFilter = document.getElementById("category-filter");
    const category = categoryFilter ? categoryFilter.value : "";
    const filters = { status: "active" };
    if (category) filters.category = category;

    console.log("🔍 Filters:", filters);

    const response = await window.API.causes.getAll(filters);

    console.log("📥 Response:", response);

    if (response.success && response.data) {
      // Update global causes array
      causes.length = 0; // Clear existing
      causes.push(...response.data); // Add new data

      console.log("✅ Causes loaded:", causes.length);

      const container = document.getElementById("causes-grid");
      if (container) {
        if (causes.length === 0) {
          container.innerHTML = `
            <div class="col-span-full text-center py-12">
              <div class="text-gray-400 mb-4">
                <i class="fas fa-heart text-6xl"></i>
              </div>
              <p class="text-gray-500 font-medium text-lg">Belum ada program donasi</p>
              <p class="text-gray-400">Program akan segera ditambahkan</p>
            </div>
          `;
        } else {
          container.innerHTML = causes
            .map((cause) => createCauseCard(cause))
            .join("");
        }
      } else {
        console.error("❌ Container #causes-grid not found");
      }
    } else {
      console.error("❌ Invalid response:", response);
      showError("Format data tidak valid");
    }
  } catch (error) {
    console.error("❌ Failed to load causes:", error);
    showError("Gagal memuat daftar program donasi.");
  }
}

function createCauseCard(cause) {
  // FIX: Handle both field name conventions
  const targetAmount = cause.targetAmount || cause.target || 0;
  const currentAmount = cause.currentAmount || cause.raised || 0;
  const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
  const progressColor = progress >= 100 ? "bg-green-500" : "bg-blue-500";

  const imageIcons = {
    laptop: "fas fa-laptop",
    scholarship: "fas fa-graduation-cap",
    health: "fas fa-heartbeat",
  };

  return `
    <div class="bg-white rounded-2xl shadow-xl overflow-hidden card-shadow">
      <div class="p-8">
        <div class="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
          <i class="${
            imageIcons[cause.image] || "fas fa-heart"
          } text-blue-600 text-2xl"></i>
        </div>
        <div class="mb-4">
          <span class="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide">
            ${cause.category}
          </span>
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-3 leading-tight">${
          cause.title
        }</h3>
        <p class="text-gray-600 mb-6 text-sm leading-relaxed">${cause.description.substring(
          0,
          120
        )}...</p>
        
        <div class="mb-6">
          <div class="flex justify-between text-sm mb-3">
            <span class="font-medium text-gray-700">Terkumpul</span>
            <span class="font-bold text-blue-600">${Math.round(
              progress
            )}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3 mb-3">
            <div class="${progressColor} h-3 rounded-full transition-all duration-500" style="width: ${Math.min(
    progress,
    100
  )}%"></div>
          </div>
          <div class="flex justify-between text-sm">
            <span class="font-bold text-gray-900">Rp ${currentAmount.toLocaleString(
              "id-ID"
            )}</span>
            <span class="text-gray-500">dari Rp ${targetAmount.toLocaleString(
              "id-ID"
            )}</span>
          </div>
        </div>
        
        <div class="flex space-x-3">
          <button onclick="showCauseDetail('${
            cause._id
          }')" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-3 rounded-lg font-medium transition-colors">
            Lihat Detail
          </button>
          <button onclick="openDonationModal('${
            cause._id
          }')" class="flex-1 btn-primary text-white px-4 py-3 rounded-lg font-medium">
            Donasi
          </button>
        </div>
      </div>
    </div>
  `;
}

async function showCauseDetail(causeId) {
  try {
    const response = await window.API.causes.getById(causeId);

    if (response.success) {
      currentCause = response.data;
      const cause = response.data;

      // FIX: Handle both field name conventions
      const targetAmount = cause.targetAmount || cause.target || 0;
      const currentAmount = cause.currentAmount || cause.raised || 0;
      const progress =
        targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;

      const imageIcons = {
        laptop: "fas fa-laptop",
        scholarship: "fas fa-graduation-cap",
        health: "fas fa-heartbeat",
      };

      // FIX: Handle both progressUpdates and updates
      const updates = cause.progressUpdates || cause.updates || [];

      const content = `
        <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div class="p-8 lg:p-12">
            <div class="flex items-center mb-8">
              <div class="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mr-6">
                <i class="${
                  imageIcons[cause.image] || "fas fa-heart"
                } text-blue-600 text-3xl"></i>
              </div>
              <div>
                <div class="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium uppercase tracking-wide mb-2">
                  ${cause.category}
                </div>
                <h1 class="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">${
                  cause.title
                }</h1>
              </div>
            </div>
            
            <p class="text-gray-700 mb-8 text-lg leading-relaxed">${
              cause.description
            }</p>
            
            <div class="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-8 mb-8">
              <div class="flex justify-between items-center mb-6">
                <h3 class="text-2xl font-bold text-gray-900">Progress Donasi</h3>
                <span class="text-3xl font-bold text-blue-600">${Math.round(
                  progress
                )}%</span>
              </div>
              <div class="w-full bg-white rounded-full h-6 mb-6 shadow-inner">
                <div class="progress-bar h-6 rounded-full transition-all duration-700 shadow-sm" style="width: ${Math.min(
                  progress,
                  100
                )}%"></div>
              </div>
              <div class="grid grid-cols-2 gap-8">
                <div class="text-center">
                  <div class="text-3xl font-bold text-green-600 mb-2">Rp ${currentAmount.toLocaleString(
                    "id-ID"
                  )}</div>
                  <div class="text-gray-600 font-medium">Terkumpul</div>
                </div>
                <div class="text-center">
                  <div class="text-3xl font-bold text-gray-800 mb-2">Rp ${targetAmount.toLocaleString(
                    "id-ID"
                  )}</div>
                  <div class="text-gray-600 font-medium">Target</div>
                </div>
              </div>
            </div>
            
            ${
              updates.length > 0
                ? `
            <div class="mb-8">
              <h3 class="text-2xl font-bold text-gray-900 mb-6">Update Terbaru</h3>
              <div class="space-y-6">
                ${updates
                  .map(
                    (update) => `
                  <div class="border-l-4 border-blue-500 bg-blue-50 rounded-r-lg p-6">
                    <div class="flex items-center mb-3">
                      <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                        <i class="fas fa-info-circle text-blue-600"></i>
                      </div>
                      <span class="text-sm text-gray-500 font-medium">${new Date(
                        update.date
                      ).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}</span>
                    </div>
                    <p class="text-gray-700 leading-relaxed">${
                      update.description || update.text
                    }</p>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
            `
                : ""
            }
            
            <div class="text-center">
              <button onclick="openDonationModal('${
                cause._id
              }')" class="btn-primary text-white px-12 py-4 rounded-xl text-lg font-semibold">
                Donasi Sekarang
              </button>
            </div>
          </div>
        </div>
      `;

      document.getElementById("cause-detail-content").innerHTML = content;
      showPage("cause-detail");
    }
  } catch (error) {
    console.error("❌ Failed to load cause detail:", error);
    showError("Gagal memuat detail program.");
  }
}

function filterCauses() {
  loadCauses();
}

// ========================================
// DASHBOARD
// ========================================
async function loadDashboard() {
  if (!currentUser) {
    console.error("❌ No user logged in");
    return;
  }

  try {
    const userNameEl = document.getElementById("dashboard-user-name");
    const profileNameEl = document.getElementById("profile-name");
    const profileEmailEl = document.getElementById("profile-email");

    if (userNameEl) userNameEl.textContent = currentUser.name || "User";
    if (profileNameEl) profileNameEl.textContent = currentUser.name || "User";
    if (profileEmailEl) profileEmailEl.textContent = currentUser.email || "";

    // Load user donations
    const response = await window.API.donations.getMyDonations();

    if (response.success) {
      donations = response.data;
      const totalDonations = donations.reduce(
        (sum, d) =>
          sum +
          (d.status === "success" || d.status === "settlement" ? d.amount : 0),
        0
      );
      const successfulDonations = donations.filter(
        (d) => d.status === "success" || d.status === "settlement"
      ).length;

      const totalDonEl = document.getElementById("profile-total-donations");
      const countEl = document.getElementById("profile-donation-count");

      if (totalDonEl) {
        totalDonEl.textContent = `Rp ${totalDonations.toLocaleString("id-ID")}`;
      }
      if (countEl) {
        countEl.textContent = `${successfulDonations} donasi`;
      }

      loadDonationHistory(donations);
    }
  } catch (error) {
    console.error("❌ Failed to load dashboard:", error);
    showError("Gagal memuat dashboard.");
  }
}

function loadDonationHistory(donations) {
  const historyContainer = document.getElementById("donation-history");
  if (!historyContainer) return;

  if (donations.length === 0) {
    historyContainer.innerHTML = `
      <tr>
        <td colspan="4" class="px-6 py-12 text-center">
          <div class="text-gray-400 mb-4">
            <i class="fas fa-heart text-4xl"></i>
          </div>
          <p class="text-gray-500 font-medium">Belum ada riwayat donasi</p>
          <p class="text-gray-400 text-sm">Mulai berdonasi untuk membantu sesama mahasiswa UPNVJ</p>
        </td>
      </tr>
    `;
  } else {
    historyContainer.innerHTML = donations
      .map((donation) => {
        const statusLabels = {
          success: { class: "bg-green-100 text-green-800", text: "Berhasil" },
          settlement: {
            class: "bg-green-100 text-green-800",
            text: "Berhasil",
          },
          pending: { class: "bg-yellow-100 text-yellow-800", text: "Pending" },
          used: {
            class: "bg-blue-100 text-blue-800",
            text: "Sudah Disalurkan",
          },
          failed: { class: "bg-red-100 text-red-800", text: "Gagal" },
        };

        const status = statusLabels[donation.status] || statusLabels["pending"];

        return `
        <tr class="hover:bg-gray-50 transition-colors">
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            ${new Date(donation.createdAt).toLocaleDateString("id-ID", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </td>
          <td class="px-6 py-4 text-sm text-gray-900">
            <div class="font-medium">${
              donation.cause ? donation.cause.title : "Unknown"
            }</div>
            <div class="text-gray-500 text-xs">${
              donation.cause ? donation.cause.category : ""
            }</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
            Rp ${donation.amount.toLocaleString("id-ID")}
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
              status.class
            }">
              ${status.text}
            </span>
          </td>
        </tr>
      `;
      })
      .join("");
  }
}

function downloadReport() {
  if (!currentUser || !donations.length) {
    showError("Belum ada donasi untuk diunduh.");
    return;
  }

  const totalDonations = donations.reduce(
    (sum, d) =>
      sum +
      (d.status === "success" || d.status === "settlement" ? d.amount : 0),
    0
  );

  let reportContent = `LAPORAN DONASI PRIBADI - DARIKITA\n`;
  reportContent += `=======================================\n\n`;
  reportContent += `Nama Donatur: ${currentUser.name}\n`;
  reportContent += `Email: ${currentUser.email}\n`;
  reportContent += `Tanggal Laporan: ${new Date().toLocaleDateString(
    "id-ID"
  )}\n\n`;
  reportContent += `RINGKASAN DONASI:\n`;
  reportContent += `Total Donasi: Rp ${totalDonations.toLocaleString(
    "id-ID"
  )}\n`;
  reportContent += `Jumlah Transaksi: ${donations.length}\n\n`;
  reportContent += `RIWAYAT DONASI DETAIL:\n`;
  reportContent += `=======================================\n`;

  donations.forEach((donation, index) => {
    reportContent += `${index + 1}. ${new Date(
      donation.createdAt
    ).toLocaleDateString("id-ID")}\n`;
    reportContent += `   Program: ${
      donation.cause ? donation.cause.title : "Unknown"
    }\n`;
    reportContent += `   Kategori: ${
      donation.cause ? donation.cause.category : ""
    }\n`;
    reportContent += `   Jumlah: Rp ${donation.amount.toLocaleString(
      "id-ID"
    )}\n`;
    reportContent += `   Status: ${donation.status}\n\n`;
  });

  reportContent += `=======================================\n`;
  reportContent += `Terima kasih atas kontribusi Anda untuk membantu sesama mahasiswa UPNVJ!\n`;
  reportContent += `Platform DariKita - Lebih Dekat, Lebih Tepat, Lebih Bermanfaat\n`;

  const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `laporan-donasi-${currentUser.name
    .replace(/\s+/g, "-")
    .toLowerCase()}-${new Date().toISOString().split("T")[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);

  showSuccess("Laporan berhasil diunduh!");
}

// ========================================
// TRANSPARENCY
// ========================================
async function loadTransparencyData() {
  try {
    const response = await window.API.causes.getAll();

    if (response.success) {
      const allCauses = response.data;
      const totalDonations = allCauses.reduce(
        (sum, c) => sum + (c.raised || 0),
        0
      );
      const activeCauses = allCauses.filter(
        (c) => c.status === "active"
      ).length;

      console.log("📊 Transparency data:", {
        totalDonations,
        activeCauses,
      });
    }
  } catch (error) {
    console.error("❌ Failed to load transparency data:", error);
  }
}

// ========================================
// DONATIONS
// ========================================
function openDonationModal(causeId) {
  if (!currentUser) {
    showError("Silakan login terlebih dahulu untuk berdonasi.");
    showPage("login");
    return;
  }

  currentCause = causes.find((c) => c._id === causeId);
  const modal = document.getElementById("donation-modal");
  if (modal) {
    modal.classList.remove("hidden");
  }
}

function closeDonationModal() {
  const modal = document.getElementById("donation-modal");
  if (modal) {
    modal.classList.add("hidden");
  }

  const amountInput = document.getElementById("donation-amount");
  const paymentSelect = document.getElementById("payment-method");
  const anonymousCheck = document.getElementById("anonymous-donation");

  if (amountInput) amountInput.value = "";
  if (paymentSelect) paymentSelect.value = "";
  if (anonymousCheck) anonymousCheck.checked = false;
}

function closeSuccessModal() {
  const modal = document.getElementById("success-modal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

async function processDonation(event) {
  event.preventDefault();

  if (!currentCause) {
    showError("Program donasi tidak valid.");
    return;
  }

  const amountInput = document.getElementById("donation-amount");
  const paymentSelect = document.getElementById("payment-method");
  const anonymousCheck = document.getElementById("anonymous-donation");

  const amount = parseInt(amountInput ? amountInput.value : 0);
  const paymentMethod = paymentSelect ? paymentSelect.value : "";
  const isAnonymous = anonymousCheck ? anonymousCheck.checked : false;

  if (amount < 10000) {
    showError("Minimal donasi adalah Rp 10.000");
    return;
  }

  if (!paymentMethod) {
    showError("Silakan pilih metode pembayaran");
    return;
  }

  try {
    closeDonationModal();

    const result = await window.Payment.processDonation({
      causeId: currentCause._id,
      amount,
      paymentMethod,
      isAnonymous,
    });

    if (result.success) {
      console.log("✅ Payment initiated:", result);
    }
  } catch (error) {
    console.error("❌ Donation failed:", error);
    showError(error.message || "Gagal memproses donasi. Silakan coba lagi.");
  }
}

// ========================================
// UI HELPERS - ONLY DECLARED ONCE
// ========================================
function showLoading(message = "Loading...") {
  const existingOverlay = document.getElementById("loading-overlay");
  if (existingOverlay) {
    existingOverlay.remove();
  }

  const modal = document.createElement("div");
  modal.id = "loading-overlay";
  modal.className =
    "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center";
  modal.innerHTML = `
    <div class="bg-white rounded-2xl p-8 text-center max-w-sm">
      <div class="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p class="text-gray-700 font-medium">${message}</p>
    </div>
  `;
  document.body.appendChild(modal);
}

function hideLoading() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) overlay.remove();
}

function showSuccess(message) {
  showNotification(message, "success");
}

function showError(message) {
  showNotification(message, "error");
}

function showNotification(message, type = "info") {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll(
    ".notification-toast"
  );
  existingNotifications.forEach((n) => n.remove());

  const notification = document.createElement("div");
  notification.className = `notification-toast fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg transform transition-all duration-300 ${
    type === "success"
      ? "bg-green-500 text-white"
      : type === "error"
      ? "bg-red-500 text-white"
      : "bg-blue-500 text-white"
  }`;
  notification.innerHTML = `
    <div class="flex items-center space-x-3">
      <i class="fas ${
        type === "success"
          ? "fa-check-circle"
          : type === "error"
          ? "fa-exclamation-circle"
          : "fa-info-circle"
      } text-xl"></i>
      <p class="font-medium">${message}</p>
    </div>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// ========================================
// EXPORT FOR DEBUGGING
// ========================================
window.DariKitaApp = {
  currentUser: () => currentUser,
  causes: () => causes,
  donations: () => donations,
  version: "1.0.0",
};

console.log("✅ DariKita App loaded successfully");
