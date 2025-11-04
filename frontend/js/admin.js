// =====================================================
// ADMIN.JS - Admin Dashboard Logic
// =====================================================

// =====================================================
// ADMIN.JS - Admin Dashboard Logic
// =====================================================

// Check authentication on page load
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Admin Dashboard initialized");

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

    // Check if user is admin
    if (user.role !== "admin") {
      console.log("⚠️ Access denied. User role:", user.role);
      showNotification(
        "Akses ditolak. Halaman ini khusus untuk admin.",
        "error"
      );
      setTimeout(() => {
        redirectBasedOnRole(user.role);
      }, 2000);
      return;
    }

    console.log("✅ Admin authenticated:", user.name);

    // Initialize admin dashboard
    await initializeAdminDashboard(user);
  } catch (error) {
    console.error("❌ Error parsing user data:", error);
    localStorage.clear();
    window.location.href = "login.html";
  }
});

// =====================================================
// INITIALIZE ADMIN DASHBOARD
// =====================================================
async function initializeAdminDashboard(user) {
  try {
    // Display admin name
    const adminNameEl = document.getElementById("admin-name");
    if (adminNameEl) {
      adminNameEl.textContent = user.name;
    }

    // Setup event listeners
    setupEventListeners();

    // Load dashboard data
    await loadDashboardStats();
    await loadRecentActivities();

    console.log("✅ Admin dashboard loaded successfully");
  } catch (error) {
    console.error("❌ Error initializing dashboard:", error);
    showNotification("Gagal memuat dashboard", "error");
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
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      navigateToSection(section);
    });
  });

  // Create cause button
  document
    .getElementById("btn-create-cause")
    ?.addEventListener("click", showCreateCauseModal);

  // Filter donations
  document
    .getElementById("btn-filter-donations")
    ?.addEventListener("click", filterDonations);
}

// =====================================================
// LOAD DASHBOARD STATS
// =====================================================
async function loadDashboardStats() {
  try {
    console.log("📊 Loading dashboard statistics...");

    // Get all causes
    const causesResponse = await window.API.causes.getAll();
    const causes = causesResponse.data || [];
    const activeCauses = causes.filter((c) => c.status === "active").length;

    // Get all donations
    const donationsResponse = await window.API.admin.getAllDonations();
    const donations = donationsResponse.data || [];
    const verifiedDonations = donations.filter(
      (d) => d.status === "verified"
    ).length;

    // Calculate total donations amount
    const totalAmount = donations
      .filter((d) => d.status === "verified")
      .reduce((sum, d) => sum + d.amount, 0);

    // Get all users
    const usersResponse = await window.API.admin.getAllUsers();
    const users = usersResponse.data || [];

    // Update stats
    document.getElementById("stat-total-donations").textContent =
      formatCurrency(totalAmount);
    document.getElementById("stat-active-causes").textContent = activeCauses;
    document.getElementById("stat-verified-donations").textContent =
      verifiedDonations;
    document.getElementById("stat-total-users").textContent = users.length;

    console.log("✅ Statistics loaded:", {
      totalAmount,
      activeCauses,
      verifiedDonations,
      totalUsers: users.length,
    });
  } catch (error) {
    console.error("❌ Error loading stats:", error);
    showNotification("Gagal memuat statistik", "error");
  }
}

// =====================================================
// LOAD RECENT ACTIVITIES
// =====================================================
async function loadRecentActivities() {
  try {
    console.log("📋 Loading recent activities...");

    // Load recent donations
    const donationsResponse = await window.API.admin.getAllDonations();
    const donations = (donationsResponse.data || []).slice(0, 5);
    displayRecentDonations(donations);

    // Load recent causes
    const causesResponse = await window.API.causes.getAll();
    const causes = (causesResponse.data || []).slice(0, 5);
    displayRecentCauses(causes);

    console.log("✅ Recent activities loaded");
  } catch (error) {
    console.error("❌ Error loading activities:", error);
  }
}

// =====================================================
// DISPLAY RECENT DONATIONS
// =====================================================
function displayRecentDonations(donations) {
  const container = document.getElementById("recent-donations");
  if (!container) return;

  if (donations.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-inbox text-3xl mb-2"></i>
        <p>Belum ada donasi</p>
      </div>
    `;
    return;
  }

  container.innerHTML = donations
    .map((donation) => {
      const statusColors = {
        pending: "bg-yellow-100 text-yellow-800",
        verified: "bg-green-100 text-green-800",
        failed: "bg-red-100 text-red-800",
      };

      const statusColor = statusColors[donation.status] || statusColors.pending;

      return `
      <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <i class="fas fa-hand-holding-usd text-blue-600"></i>
          </div>
          <div>
            <p class="font-semibold text-gray-900">${
              donation.user?.name || "Anonymous"
            }</p>
            <p class="text-sm text-gray-600">${formatCurrency(
              donation.amount
            )}</p>
          </div>
        </div>
        <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusColor}">
          ${donation.status}
        </span>
      </div>
    `;
    })
    .join("");
}

// =====================================================
// DISPLAY RECENT CAUSES
// =====================================================
function displayRecentCauses(causes) {
  const container = document.getElementById("recent-causes");
  if (!container) return;

  if (causes.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-inbox text-3xl mb-2"></i>
        <p>Belum ada program</p>
      </div>
    `;
    return;
  }

  container.innerHTML = causes
    .map((cause) => {
      const progress = Math.round(
        (cause.currentAmount / cause.targetAmount) * 100
      );

      return `
      <div class="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
        <div class="flex items-center justify-between mb-2">
          <h4 class="font-semibold text-gray-900">${cause.title}</h4>
          <span class="text-xs text-gray-500">${progress}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="bg-blue-600 h-2 rounded-full" style="width: ${Math.min(
            progress,
            100
          )}%"></div>
        </div>
        <p class="text-sm text-gray-600 mt-2">${formatCurrency(
          cause.currentAmount
        )} / ${formatCurrency(cause.targetAmount)}</p>
      </div>
    `;
    })
    .join("");
}

// =====================================================
// NAVIGATION
// =====================================================
function navigateToSection(sectionName) {
  console.log("🔀 Navigating to:", sectionName);

  // Hide all sections
  document.querySelectorAll(".section-content").forEach((section) => {
    section.classList.add("hidden");
  });

  // Show selected section
  const targetSection = document.getElementById(`section-${sectionName}`);
  if (targetSection) {
    targetSection.classList.remove("hidden");
  }

  // Update active nav link
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("bg-blue-50", "text-blue-600");
    link.classList.add("text-gray-700");
  });

  const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
  if (activeLink) {
    activeLink.classList.add("bg-blue-50", "text-blue-600");
    activeLink.classList.remove("text-gray-700");
  }

  // Load section data
  loadSectionData(sectionName);

  // Close mobile sidebar
  if (window.innerWidth < 1024) {
    toggleSidebar();
  }
}

// =====================================================
// LOAD SECTION DATA
// =====================================================
async function loadSectionData(sectionName) {
  switch (sectionName) {
    case "causes":
      await loadCauses();
      break;
    case "donations":
      await loadDonations();
      break;
    case "reports":
      await loadReports();
      break;
    case "users":
      await loadUsers();
      break;
    default:
      break;
  }
}

// =====================================================
// LOAD CAUSES
// =====================================================
async function loadCauses() {
  try {
    showLoading();
    console.log("📦 Loading causes...");

    const response = await window.API.causes.getAll();
    const causes = response.data || [];

    displayCauses(causes);

    hideLoading();
    console.log(`✅ Loaded ${causes.length} causes`);
  } catch (error) {
    hideLoading();
    console.error("❌ Error loading causes:", error);
    showNotification("Gagal memuat program", "error");
  }
}

// =====================================================
// DISPLAY CAUSES
// =====================================================
function displayCauses(causes) {
  const container = document.getElementById("causes-list");
  if (!container) return;

  if (causes.length === 0) {
    container.innerHTML = `
      <div class="col-span-2 text-center py-12">
        <i class="fas fa-inbox text-gray-300 text-6xl mb-4"></i>
        <p class="text-gray-600 mb-4">Belum ada program</p>
        <button onclick="showCreateCauseModal()" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
          <i class="fas fa-plus mr-2"></i>Buat Program Pertama
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = causes
    .map((cause) => {
      const progress = Math.round(
        (cause.currentAmount / cause.targetAmount) * 100
      );
      const statusColors = {
        active: "bg-green-100 text-green-800",
        completed: "bg-blue-100 text-blue-800",
        closed: "bg-gray-100 text-gray-800",
      };

      return `
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden card-hover">
        <img src="${cause.image || "https://via.placeholder.com/400x200"}" 
             alt="${cause.title}" 
             class="w-full h-48 object-cover"
             onerror="this.src='https://via.placeholder.com/400x200?text=DariKita'">
        <div class="p-6">
          <div class="flex items-center justify-between mb-3">
            <span class="px-3 py-1 rounded-full text-xs font-semibold ${
              statusColors[cause.status] || statusColors.active
            }">
              ${cause.status || "active"}
            </span>
            <span class="text-xs text-gray-500">${cause.category}</span>
          </div>
          
          <h3 class="text-xl font-bold text-gray-900 mb-2">${cause.title}</h3>
          <p class="text-sm text-gray-600 mb-4 line-clamp-2">${
            cause.description
          }</p>
          
          <div class="mb-4">
            <div class="flex justify-between text-sm mb-2">
              <span class="text-gray-600">Progress</span>
              <span class="font-bold">${progress}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-blue-600 h-2 rounded-full" style="width: ${Math.min(
                progress,
                100
              )}%"></div>
            </div>
            <div class="flex justify-between text-sm mt-2">
              <span class="text-gray-600">${formatCurrency(
                cause.currentAmount
              )}</span>
              <span class="text-gray-600">${formatCurrency(
                cause.targetAmount
              )}</span>
            </div>
          </div>
          
          <div class="flex space-x-2">
            <button onclick="editCause('${
              cause._id
            }')" class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
              <i class="fas fa-edit mr-1"></i>Edit
            </button>
            <button onclick="deleteCause('${
              cause._id
            }')" class="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors text-sm">
              <i class="fas fa-trash mr-1"></i>Hapus
            </button>
          </div>
        </div>
      </div>
    `;
    })
    .join("");
}

// =====================================================
// LOAD DONATIONS
// =====================================================
async function loadDonations(status = "") {
  try {
    showLoading();
    console.log("💰 Loading donations...");

    const filters = status ? { status } : {};
    const response = await window.API.admin.getAllDonations(filters);
    const donations = response.data || [];

    displayDonations(donations);

    hideLoading();
    console.log(`✅ Loaded ${donations.length} donations`);
  } catch (error) {
    hideLoading();
    console.error("❌ Error loading donations:", error);
    showNotification("Gagal memuat donasi", "error");
  }
}

// =====================================================
// DISPLAY DONATIONS
// =====================================================
function displayDonations(donations) {
  const container = document.getElementById("donations-list");
  if (!container) return;

  if (donations.length === 0) {
    container.innerHTML = `
      <div class="p-12 text-center">
        <i class="fas fa-inbox text-gray-300 text-6xl mb-4"></i>
        <p class="text-gray-600">Belum ada donasi</p>
      </div>
    `;
    return;
  }

  const tableHTML = `
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Donatur</th>
            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Program</th>
            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Jumlah</th>
            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Tanggal</th>
            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          ${donations
            .map((donation) => {
              const statusColors = {
                pending: "bg-yellow-100 text-yellow-800",
                verified: "bg-green-100 text-green-800",
                failed: "bg-red-100 text-red-800",
              };
              const statusColor =
                statusColors[donation.status] || statusColors.pending;
              const date = new Date(donation.createdAt).toLocaleDateString(
                "id-ID"
              );

              return `
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                  <div class="font-semibold text-gray-900">${
                    donation.user?.name || "Anonymous"
                  }</div>
                  <div class="text-sm text-gray-500">${
                    donation.user?.email || "-"
                  }</div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">${
                  donation.cause?.title || "N/A"
                }</td>
                <td class="px-6 py-4 font-semibold text-gray-900">${formatCurrency(
                  donation.amount
                )}</td>
                <td class="px-6 py-4 text-sm text-gray-600">${date}</td>
                <td class="px-6 py-4">
                  <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusColor}">
                    ${donation.status}
                  </span>
                </td>
                <td class="px-6 py-4">
                  ${
                    donation.status === "pending"
                      ? `
                    <button onclick="verifyDonation('${donation._id}')" 
                            class="text-green-600 hover:text-green-700 font-medium text-sm">
                      <i class="fas fa-check-circle mr-1"></i>Verify
                    </button>
                  `
                      : `
                    <button onclick="viewDonation('${donation._id}')" 
                            class="text-blue-600 hover:text-blue-700 font-medium text-sm">
                      <i class="fas fa-eye mr-1"></i>Detail
                    </button>
                  `
                  }
                </td>
              </tr>
            `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = tableHTML;
}

// =====================================================
// LOAD USERS
// =====================================================
async function loadUsers() {
  try {
    showLoading();
    console.log("👥 Loading users...");

    const response = await window.API.admin.getAllUsers();
    const users = response.data || [];

    displayUsers(users);

    hideLoading();
    console.log(`✅ Loaded ${users.length} users`);
  } catch (error) {
    hideLoading();
    console.error("❌ Error loading users:", error);
    showNotification("Gagal memuat user", "error");
  }
}

// =====================================================
// DISPLAY USERS
// =====================================================
function displayUsers(users) {
  const container = document.getElementById("users-list");
  if (!container) return;

  if (users.length === 0) {
    container.innerHTML = `
      <div class="p-12 text-center">
        <i class="fas fa-users text-gray-300 text-6xl mb-4"></i>
        <p class="text-gray-600">Belum ada user</p>
      </div>
    `;
    return;
  }

  const tableHTML = `
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Nama</th>
            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Total Donasi</th>
            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Bergabung</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          ${users
            .map((user) => {
              const roleColors = {
                admin: "bg-purple-100 text-purple-800",
                auditor: "bg-blue-100 text-blue-800",
                donatur: "bg-green-100 text-green-800",
              };
              const roleColor = roleColors[user.role] || roleColors.donatur;
              const joinDate = new Date(user.createdAt).toLocaleDateString(
                "id-ID"
              );

              return `
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                  <div class="font-semibold text-gray-900">${user.name}</div>
                  <div class="text-sm text-gray-500">${user.phone || "-"}</div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">${user.email}</td>
                <td class="px-6 py-4">
                  <span class="px-3 py-1 rounded-full text-xs font-semibold ${roleColor}">
                    ${user.role}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="font-semibold text-gray-900">${formatCurrency(
                    user.totalAmount || 0
                  )}</div>
                  <div class="text-sm text-gray-500">${
                    user.totalDonations || 0
                  } donasi</div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">${joinDate}</td>
              </tr>
            `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = tableHTML;
}

// =====================================================
// ACTION FUNCTIONS
// =====================================================

function filterDonations() {
  const status = document.getElementById("filter-donation-status").value;
  loadDonations(status);
}

function showCreateCauseModal() {
  showNotification("Fitur create cause akan segera tersedia", "info");
  // TODO: Implement create cause modal
}

function editCause(id) {
  showNotification(`Edit cause ${id} - Fitur akan segera tersedia`, "info");
  // TODO: Implement edit cause
}

function deleteCause(id) {
  if (confirm("Apakah Anda yakin ingin menghapus program ini?")) {
    // TODO: Implement delete cause
    showNotification("Fitur delete cause akan segera tersedia", "info");
  }
}

async function verifyDonation(id) {
  if (confirm("Verifikasi donasi ini?")) {
    try {
      showLoading();
      await window.API.admin.verifyDonation(id);
      showNotification("Donasi berhasil diverifikasi", "success");
      loadDonations();
      loadDashboardStats();
    } catch (error) {
      console.error("❌ Error verifying donation:", error);
      showNotification("Gagal verifikasi donasi", "error");
    } finally {
      hideLoading();
    }
  }
}

function viewDonation(id) {
  showNotification(`View donation ${id} - Fitur akan segera tersedia`, "info");
  // TODO: Implement view donation detail
}

async function loadReports() {
  showNotification("Fitur laporan akan segera tersedia", "info");
  // TODO: Implement reports
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");

  if (sidebar && overlay) {
    sidebar.classList.toggle("hidden-mobile");
    overlay.classList.toggle("hidden");
  }
}

function handleLogout() {
  if (confirm("Apakah Anda yakin ingin keluar?")) {
    console.log("👋 Logging out...");
    window.API.auth.logout();
    showNotification("Berhasil logout", "success");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  }
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

function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function showLoading() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) overlay.classList.remove("hidden");
}

function hideLoading() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) overlay.classList.add("hidden");
}

function showNotification(message, type = "info") {
  const existingNotif = document.getElementById("notification-toast");
  if (existingNotif) existingNotif.remove();

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
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
`;
document.head.appendChild(style);

console.log("✅ Admin.js loaded successfully");
