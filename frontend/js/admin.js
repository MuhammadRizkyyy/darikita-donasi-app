// =====================================================
// ADMIN.JS - Admin Dashboard Logic with CRUD Modal
// =====================================================

// Global state for cause modal
let currentEditingCauseId = null;
let selectedImageFile = null;
let imagePreviewUrl = null;
let selectedUserId = null;

// Global state for transparency
let currentEditingReportId = null;
let selectedPhotos = [];
let selectedDocuments = [];
let currentCauseForReport = null;

let allUsers = [];

// Check authentication on page load
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Admin Dashboard initialized");

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
    const adminNameEl = document.getElementById("admin-name");
    if (adminNameEl) {
      adminNameEl.textContent = user.name;
    }

    setupEventListeners();
    createCauseModal();
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
  document
    .getElementById("logout-btn")
    ?.addEventListener("click", handleLogout);

  document
    .getElementById("sidebar-toggle")
    ?.addEventListener("click", toggleSidebar);
  document
    .getElementById("sidebar-overlay")
    ?.addEventListener("click", toggleSidebar);

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      navigateToSection(section);
    });
  });

  document
    .getElementById("btn-create-cause")
    ?.addEventListener("click", showCreateCauseModal);

  document
    .getElementById("btn-filter-donations")
    ?.addEventListener("click", filterDonations);
}

// =====================================================
// CREATE CAUSE MODAL
// =====================================================
function createCauseModal() {
  const modalHTML = `
    <div id="cause-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div class="flex items-center justify-between">
            <h2 id="modal-title" class="text-2xl font-bold text-gray-900">Buat Program Baru</h2>
            <button onclick="closeCauseModal()" class="text-gray-400 hover:text-gray-600 transition-colors">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>
        </div>

        <form id="cause-form" class="p-6 space-y-6">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Judul Program <span class="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              id="cause-title" 
              required
              maxlength="100"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Contoh: Bantu Anak Yatim Untuk Sekolah"
            />
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Kategori <span class="text-red-500">*</span>
            </label>
            <select 
              id="cause-category" 
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Kategori</option>
              <option value="pendidikan">Pendidikan</option>
              <option value="kesehatan">Kesehatan</option>
              <option value="sosial">Sosial</option>
              <option value="bencana">Bencana</option>
              <option value="lingkungan">Lingkungan</option>
              <option value="infrastruktur">Infrastruktur</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Deskripsi <span class="text-red-500">*</span>
            </label>
            <textarea 
              id="cause-description" 
              required
              maxlength="2000"
              rows="5"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Jelaskan detail program donasi..."
            ></textarea>
            <p class="text-sm text-gray-500 mt-1">
              <span id="desc-count">0</span>/2000 karakter
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Target Donasi (Rp) <span class="text-red-500">*</span>
              </label>
              <input 
                type="number" 
                id="cause-target" 
                required
                min="100000"
                step="10000"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="10000000"
              />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Batas Waktu <span class="text-red-500">*</span>
              </label>
              <input 
                type="date" 
                id="cause-deadline" 
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Gambar Program <span class="text-red-500">*</span>
            </label>
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors">
              <div id="image-preview-container" class="hidden mb-4">
                <div class="relative">
                  <img 
                    id="image-preview" 
                    src="" 
                    alt="Preview" 
                    class="w-full h-64 object-cover rounded-lg"
                  />
                  <button 
                    type="button"
                    onclick="removeImage()"
                    class="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full hover:bg-red-600 transition-colors flex items-center justify-center"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>

              <div id="upload-placeholder" class="text-center">
                <i class="fas fa-cloud-upload-alt text-gray-400 text-5xl mb-3"></i>
                <p class="text-gray-600 mb-2">
                  <span class="text-blue-600 font-semibold cursor-pointer hover:text-blue-700">Klik untuk upload</span>
                  atau drag & drop
                </p>
                <p class="text-sm text-gray-500">PNG, JPG, WEBP (Maks. 5MB)</p>
              </div>

              <input 
                type="file" 
                id="cause-image" 
                accept="image/png,image/jpeg,image/jpg,image/webp"
                class="hidden"
                onchange="handleImageSelect(event)"
              />
            </div>
          </div>

          <div class="flex space-x-3 pt-4 border-t border-gray-200">
            <button 
              type="button"
              onclick="closeCauseModal()"
              class="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Batal
            </button>
            <button 
              type="submit"
              class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <i class="fas fa-save mr-2"></i>
              <span id="submit-btn-text">Simpan Program</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);

  document
    .getElementById("cause-form")
    .addEventListener("submit", handleCauseSubmit);

  document
    .getElementById("cause-description")
    .addEventListener("input", (e) => {
      document.getElementById("desc-count").textContent = e.target.value.length;
    });

  document
    .getElementById("upload-placeholder")
    .addEventListener("click", () => {
      document.getElementById("cause-image").click();
    });
}

// =====================================================
// CAUSE MODAL FUNCTIONS
// =====================================================
function showCreateCauseModal() {
  currentEditingCauseId = null;
  selectedImageFile = null;
  imagePreviewUrl = null;

  document.getElementById("cause-form").reset();
  document.getElementById("modal-title").textContent = "Buat Program Baru";
  document.getElementById("submit-btn-text").textContent = "Simpan Program";
  document.getElementById("desc-count").textContent = "0";

  document.getElementById("image-preview-container").classList.add("hidden");
  document.getElementById("upload-placeholder").classList.remove("hidden");

  const today = new Date().toISOString().split("T")[0];
  document.getElementById("cause-deadline").setAttribute("min", today);

  document.getElementById("cause-modal").classList.remove("hidden");
}

function closeCauseModal() {
  document.getElementById("cause-modal").classList.add("hidden");
  currentEditingCauseId = null;
  selectedImageFile = null;
  imagePreviewUrl = null;
}

async function showEditCauseModal(causeId) {
  try {
    showLoading();
    const response = await window.API.causes.getById(causeId);
    const cause = response.data;

    currentEditingCauseId = causeId;

    document.getElementById("cause-title").value = cause.title;
    document.getElementById("cause-category").value = cause.category;
    document.getElementById("cause-description").value = cause.description;
    document.getElementById("cause-target").value = cause.targetAmount;
    document.getElementById("desc-count").textContent =
      cause.description.length;

    const deadline = new Date(cause.deadline).toISOString().split("T")[0];
    document.getElementById("cause-deadline").value = deadline;

    if (cause.image) {
      imagePreviewUrl = cause.image;
      document.getElementById("image-preview").src = cause.image;
      document
        .getElementById("image-preview-container")
        .classList.remove("hidden");
      document.getElementById("upload-placeholder").classList.add("hidden");
    }

    document.getElementById("modal-title").textContent = "Edit Program";
    document.getElementById("submit-btn-text").textContent = "Update Program";

    document.getElementById("cause-modal").classList.remove("hidden");

    hideLoading();
  } catch (error) {
    hideLoading();
    console.error("❌ Error loading cause:", error);
    showNotification("Gagal memuat data program", "error");
  }
}

function handleImageSelect(event) {
  const file = event.target.files[0];

  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showNotification("Ukuran file maksimal 5MB", "error");
    event.target.value = "";
    return;
  }

  const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  if (!validTypes.includes(file.type)) {
    showNotification("Format file harus PNG, JPG, atau WEBP", "error");
    event.target.value = "";
    return;
  }

  selectedImageFile = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreviewUrl = e.target.result;
    document.getElementById("image-preview").src = e.target.result;
    document
      .getElementById("image-preview-container")
      .classList.remove("hidden");
    document.getElementById("upload-placeholder").classList.add("hidden");
  };
  reader.readAsDataURL(file);
}

function removeImage() {
  selectedImageFile = null;
  imagePreviewUrl = null;
  document.getElementById("cause-image").value = "";
  document.getElementById("image-preview-container").classList.add("hidden");
  document.getElementById("upload-placeholder").classList.remove("hidden");
}

async function handleCauseSubmit(event) {
  event.preventDefault();

  try {
    showLoading();

    const formData = new FormData();
    formData.append("title", document.getElementById("cause-title").value);
    formData.append(
      "category",
      document.getElementById("cause-category").value
    );
    formData.append(
      "description",
      document.getElementById("cause-description").value
    );
    formData.append(
      "targetAmount",
      document.getElementById("cause-target").value
    );
    formData.append(
      "deadline",
      document.getElementById("cause-deadline").value
    );

    if (selectedImageFile) {
      formData.append("image", selectedImageFile);
    } else if (currentEditingCauseId && imagePreviewUrl) {
      formData.append("image", imagePreviewUrl);
    }

    let response;
    if (currentEditingCauseId) {
      response = await window.API.causes.update(
        currentEditingCauseId,
        formData
      );
      showNotification("Program berhasil diupdate!", "success");
    } else {
      response = await window.API.causes.create(formData);
      showNotification("Program berhasil dibuat!", "success");
    }

    closeCauseModal();
    await loadCauses();
    await loadDashboardStats();
    await loadRecentActivities();

    hideLoading();
  } catch (error) {
    hideLoading();
    console.error("❌ Error saving cause:", error);
    showNotification(error.message || "Gagal menyimpan program", "error");
  }
}

// =====================================================
// DASHBOARD STATS
// =====================================================
async function loadDashboardStats() {
  try {
    const causesResponse = await window.API.causes.getAll();
    const causes = causesResponse.data || [];
    const activeCauses = causes.filter((c) => c.status === "active").length;

    const donationsResponse = await window.API.admin.getAllDonations();
    const donations = donationsResponse.data || [];
    const verifiedDonations = donations.filter(
      (d) => d.status === "verified"
    ).length;

    const totalAmount = donations
      .filter((d) => d.status === "verified")
      .reduce((sum, d) => sum + d.amount, 0);

    const usersResponse = await window.API.admin.getAllUsers();
    const users = usersResponse.data || [];

    document.getElementById("stat-total-donations").textContent =
      formatCurrency(totalAmount);
    document.getElementById("stat-active-causes").textContent = activeCauses;
    document.getElementById("stat-verified-donations").textContent =
      verifiedDonations;
    document.getElementById("stat-total-users").textContent = users.length;
  } catch (error) {
    console.error("❌ Error loading stats:", error);
    showNotification("Gagal memuat statistik", "error");
  }
}

async function loadRecentActivities() {
  try {
    const donationsResponse = await window.API.admin.getAllDonations();
    const donations = (donationsResponse.data || []).slice(0, 5);
    displayRecentDonations(donations);

    const causesResponse = await window.API.causes.getAll();
    const causes = (causesResponse.data || []).slice(0, 5);
    displayRecentCauses(causes);
  } catch (error) {
    console.error("❌ Error loading activities:", error);
  }
}

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
  document.querySelectorAll(".section-content").forEach((section) => {
    section.classList.add("hidden");
  });

  const targetSection = document.getElementById(`section-${sectionName}`);
  if (targetSection) {
    targetSection.classList.remove("hidden");
  }

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("bg-blue-50", "text-blue-600");
    link.classList.add("text-gray-700");
  });

  const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
  if (activeLink) {
    activeLink.classList.add("bg-blue-50", "text-blue-600");
    activeLink.classList.remove("text-gray-700");
  }

  loadSectionData(sectionName);

  if (window.innerWidth < 1024) {
    toggleSidebar();
  }
}

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
    case "transparency":
      await loadTransparency();
      break;
    case "users":
      await loadUsers();
      break;
    default:
      break;
  }
}

// =====================================================
// CAUSES MANAGEMENT
// =====================================================
async function loadCauses() {
  try {
    showLoading();
    const response = await window.API.causes.getAll();
    const causes = response.data || [];
    displayCauses(causes);
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error("❌ Error loading causes:", error);
    showNotification("Gagal memuat program", "error");
  }
}

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
        <img src="${
          cause.image ||
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect fill='%234F46E5' width='400' height='200'/%3E%3Ctext fill='white' font-size='24' font-family='system-ui' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EDariKita%3C/text%3E%3C/svg%3E"
        }" 
             alt="${cause.title}" 
             class="w-full h-48 object-cover"
             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27400%27 height=%27200%27%3E%3Crect fill=%27%234F46E5%27 width=%27400%27 height=%27200%27/%3E%3Ctext fill=%27white%27 font-size=%2724%27 font-family=%27system-ui%27 x=%2750%25%27 y=%2750%25%27 text-anchor=%27middle%27 dy=%27.3em%27%3EDariKita%3C/text%3E%3C/svg%3E'">
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
            <button onclick="showEditCauseModal('${
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

async function deleteCause(id) {
  if (confirm("Apakah Anda yakin ingin menghapus program ini?")) {
    try {
      showLoading();
      await window.API.causes.delete(id);
      showNotification("Program berhasil dihapus", "success");
      await loadCauses();
      await loadDashboardStats();
      await loadRecentActivities();
      hideLoading();
    } catch (error) {
      hideLoading();
      console.error("❌ Error deleting cause:", error);
      showNotification("Gagal menghapus program", "error");
    }
  }
}

// =====================================================
// DONATIONS MANAGEMENT
// =====================================================
async function loadDonations(status = "") {
  try {
    showLoading();
    const filters = status ? { status } : {};
    const response = await window.API.admin.getAllDonations(filters);
    const donations = response.data || [];
    displayDonations(donations);
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error("❌ Error loading donations:", error);
    showNotification("Gagal memuat donasi", "error");
  }
}

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
                    <span class="text-gray-400 text-sm">
                      <i class="fas fa-check mr-1"></i>Terverifikasi
                    </span>
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

async function verifyDonation(id) {
  if (confirm("Verifikasi donasi ini?")) {
    try {
      showLoading();
      await window.API.admin.verifyDonation(id);
      showNotification("Donasi berhasil diverifikasi", "success");
      await loadDonations();
      await loadDashboardStats();
      await loadRecentActivities();
      hideLoading();
    } catch (error) {
      hideLoading();
      console.error("❌ Error verifying donation:", error);
      showNotification("Gagal verifikasi donasi", "error");
    }
  }
}

function filterDonations() {
  const status = document.getElementById("filter-donation-status").value;
  loadDonations(status);
}

// =====================================================
// USERS MANAGEMENT
// =====================================================
async function loadUsers() {
  try {
    showLoading();
    const response = await window.API.admin.getAllUsers();
    allUsers = response.data || [];
    displayUsers(allUsers);
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error("❌ Error loading users:", error);
    showNotification("Gagal memuat user", "error");
  }
}

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
            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Bergabung</th>
            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Aksi</th>
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
                <td class="px-6 py-4 text-sm text-gray-600">${joinDate}</td>
                <td class="px-6 py-4">
                  <button
                    onclick="openUserRoleModal('${user._id}', '${
                user.role
              }', '${user.name}', '${user.email}')"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <i class="fas fa-user-edit mr-1"></i>Ubah Role
                  </button>
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
// REPORTS MANAGEMENT
// =====================================================
async function loadReports() {
  try {
    showLoading();
    await loadDonorsDropdown();
    await loadCausesDropdown();
    setupReportEventListeners();
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error("❌ Error loading reports:", error);
    showNotification("Gagal memuat halaman laporan", "error");
  }
}

async function loadDonorsDropdown() {
  try {
    const response = await window.API.reports.getAllDonors();
    const donors = response.data || [];

    const selectDonor = document.getElementById("select-donor");
    if (!selectDonor) return;

    selectDonor.innerHTML = '<option value="">-- Pilih Donatur --</option>';

    donors.forEach((donor) => {
      const option = document.createElement("option");
      option.value = donor._id;
      option.textContent = `${donor.name} (${donor.email})`;
      selectDonor.appendChild(option);
    });
  } catch (error) {
    console.error("❌ Error loading donors:", error);
  }
}

async function loadCausesDropdown() {
  try {
    const response = await window.API.causes.getAll();
    const causes = response.data || [];

    const selectCause = document.getElementById("select-cause-filter");
    if (!selectCause) return;

    selectCause.innerHTML = '<option value="">-- Semua Program --</option>';

    causes.forEach((cause) => {
      const option = document.createElement("option");
      option.value = cause._id;
      option.textContent = cause.title;
      selectCause.appendChild(option);
    });
  } catch (error) {
    console.error("❌ Error loading causes:", error);
  }
}

function setupReportEventListeners() {
  document
    .getElementById("btn-download-donor-report")
    ?.addEventListener("click", downloadDonorReport);

  document
    .getElementById("btn-download-all-report")
    ?.addEventListener("click", downloadAllDonationsReport);

  document.getElementById("btn-export-excel")?.addEventListener("click", () => {
    showNotification("Fitur export Excel akan segera tersedia", "info");
  });

  document.getElementById("btn-export-csv")?.addEventListener("click", () => {
    showNotification("Fitur export CSV akan segera tersedia", "info");
  });

  document
    .getElementById("btn-view-report-history")
    ?.addEventListener("click", () => {
      showNotification("Fitur riwayat laporan akan segera tersedia", "info");
    });
}

async function downloadDonorReport() {
  try {
    const donorId = document.getElementById("select-donor").value;

    if (!donorId) {
      showNotification("Silakan pilih donatur terlebih dahulu", "warning");
      return;
    }

    showLoading();

    const filters = {};
    const startDate = document.getElementById("donor-start-date").value;
    const endDate = document.getElementById("donor-end-date").value;

    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const response = await window.API.reports.getDonorReport(donorId, filters);
    const reportData = response.data;

    generateDonorPDF(reportData);

    hideLoading();
    showNotification("Laporan berhasil didownload!", "success");
  } catch (error) {
    hideLoading();
    console.error("❌ Error downloading donor report:", error);
    showNotification("Gagal mengenerate laporan", "error");
  }
}

function generateDonorPDF(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const primaryColor = [30, 64, 175];
  const headerBg = [219, 234, 254];
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

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

  doc.setFillColor(headerBg[0], headerBg[1], headerBg[2]);
  doc.rect(margin, margin + 20, pageWidth - 2 * margin, 25, "F");

  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("LAPORAN DONASI PRIBADI – DARIKITA", margin + 5, margin + 28);

  let yPos = margin + 36;

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

  yPos += 12;

  doc.setFillColor(headerBg[0], headerBg[1], headerBg[2]);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 20, 2, 2, "F");

  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("RINGKASAN DONASI:", margin + 5, yPos + 7);

  yPos += 13;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(
    `Jumlah Transaksi: ${data.summary.totalTransactions}`,
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

  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("RIWAYAT DETAIL DONASI:", margin, yPos);

  yPos += 8;

  const tableData = data.donations.map((d, index) => [
    (index + 1).toString(),
    new Date(d.date).toLocaleDateString("id-ID"),
    d.program,
    d.category.charAt(0).toUpperCase() + d.category.slice(1),
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

  const fileName = `Laporan_Donasi_${data.user.name.replace(/\s+/g, "_")}_${
    new Date().toISOString().split("T")[0]
  }.pdf`;
  doc.save(fileName);
}

async function downloadAllDonationsReport() {
  try {
    showLoading();

    const filters = {};
    const startDate = document.getElementById("all-start-date").value;
    const endDate = document.getElementById("all-end-date").value;
    const causeId = document.getElementById("select-cause-filter").value;
    const status = document.getElementById("select-distribution-status").value;

    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (causeId) filters.causeId = causeId;
    if (status) filters.status = status;

    const response = await window.API.reports.getAllDonationsReport(filters);
    const reportData = response.data;

    generateAllDonationsPDF(reportData);

    hideLoading();
    showNotification("Laporan berhasil didownload!", "success");
  } catch (error) {
    hideLoading();
    console.error("❌ Error downloading all donations report:", error);
    showNotification("Gagal mengenerate laporan", "error");
  }
}

function generateAllDonationsPDF(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const primaryColor = [30, 64, 175];
  const headerBg = [219, 234, 254];
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

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

  doc.setFillColor(headerBg[0], headerBg[1], headerBg[2]);
  doc.rect(margin, margin + 20, pageWidth - 2 * margin, 25, "F");

  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("LAPORAN SEMUA DONASI – DARIKITA", margin + 5, margin + 28);

  let yPos = margin + 36;

  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.setTextColor(0, 0, 0);

  const currentDate = new Date().toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(`Tanggal Laporan: ${currentDate}`, margin + 5, yPos);

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

  doc.setFillColor(headerBg[0], headerBg[1], headerBg[2]);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 25, 2, 2, "F");

  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("RINGKASAN DONASI:", margin + 5, yPos + 7);

  yPos += 13;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(
    `Total Transaksi: ${data.summary.totalTransactions}`,
    margin + 5,
    yPos
  );

  const totalFormatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 2,
  }).format(data.summary.totalAmount);

  doc.text(`Total Donasi: ${totalFormatted}`, margin + 100, yPos);

  yPos += 6;
  doc.text(
    `Sudah Disalurkan: ${data.summary.byStatus.distributed}`,
    margin + 5,
    yPos
  );
  doc.text(
    `Belum Disalurkan: ${data.summary.byStatus.pending}`,
    margin + 100,
    yPos
  );

  yPos += 12;

  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("RIWAYAT DETAIL DONASI:", margin, yPos);

  yPos += 8;

  const tableData = data.donations.map((d, index) => [
    (index + 1).toString(),
    new Date(d.date).toLocaleDateString("id-ID"),
    d.donor.name,
    d.program,
    d.category.charAt(0).toUpperCase() + d.category.slice(1),
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
      ["No", "Tanggal", "Donatur", "Program", "Kategori", "Jumlah", "Status"],
    ],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [0, 0, 0],
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 8 },
      1: { halign: "center", cellWidth: 22 },
      2: { halign: "left", cellWidth: 30 },
      3: { halign: "left", cellWidth: 40 },
      4: { halign: "center", cellWidth: 20 },
      5: { halign: "right", cellWidth: 28 },
      6: { halign: "center", cellWidth: 22 },
    },
    margin: { left: margin, right: margin },
  });

  const finalY = doc.lastAutoTable.finalY + 10;

  if (finalY < pageHeight - 30) {
    doc.setFillColor(headerBg[0], headerBg[1], headerBg[2]);
    doc.rect(margin, finalY, pageWidth - 2 * margin, 20, "F");

    doc.setFontSize(9);
    doc.setFont(undefined, "italic");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    const footerText =
      "Terima kasih atas kontribusi semua donatur untuk membantu sesama!";
    doc.text(footerText, pageWidth / 2, finalY + 8, { align: "center" });

    doc.setFontSize(8);
    doc.setFont(undefined, "bold");
    const footerText2 =
      "Platform DariKita - Lebih Dekat, Lebih Tepat, Lebih Bermanfaat";
    doc.text(footerText2, pageWidth / 2, finalY + 14, { align: "center" });
  }

  const fileName = `Laporan_Semua_Donasi_${
    new Date().toISOString().split("T")[0]
  }.pdf`;
  doc.save(fileName);
}

// =====================================================
// TRANSPARENCY REPORTS MANAGEMENT
// =====================================================
async function loadTransparency() {
  try {
    showLoading();
    await loadCausesForTransparencyFilter();
    await loadTransparencyReportsByCause();
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error("❌ Error loading transparency:", error);
    showNotification("Gagal memuat laporan transparansi", "error");
  }
}

async function loadCausesForTransparencyFilter() {
  try {
    const response = await window.API.causes.getAll();
    const causes = response.data || [];

    const selectCause = document.getElementById("filter-transparency-cause");
    if (!selectCause) return;

    selectCause.innerHTML = '<option value="">Semua Program</option>';

    causes.forEach((cause) => {
      const option = document.createElement("option");
      option.value = cause._id;
      option.textContent = cause.title;
      selectCause.appendChild(option);
    });
  } catch (error) {
    console.error("❌ Error loading causes:", error);
  }
}

async function loadTransparencyReportsByCause() {
  try {
    const causesResponse = await window.API.causes.getAll();
    const causes = causesResponse.data || [];

    const container = document.getElementById("transparency-causes-list");
    if (!container) return;

    if (causes.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12">
          <i class="fas fa-inbox text-gray-300 text-6xl mb-4"></i>
          <p class="text-gray-600">Belum ada program</p>
        </div>
      `;
      return;
    }

    const causesWithReports = await Promise.all(
      causes.map(async (cause) => {
        try {
          const reportsResponse = await window.API.transparency.getByCause(
            cause._id
          );
          return {
            cause,
            reports: reportsResponse.data || [],
            totalDisbursed: reportsResponse.totalDisbursed || 0,
          };
        } catch (error) {
          return {
            cause,
            reports: [],
            totalDisbursed: 0,
          };
        }
      })
    );

    displayCausesWithReports(causesWithReports);
  } catch (error) {
    console.error("❌ Error loading transparency reports:", error);
    showNotification("Gagal memuat laporan", "error");
  }
}

function displayCausesWithReports(causesWithReports) {
  const container = document.getElementById("transparency-causes-list");

  container.innerHTML = causesWithReports
    .map((item) => {
      const { cause, reports, totalDisbursed } = item;
      const remainingFunds = cause.currentAmount - totalDisbursed;
      const disbursementPercentage =
        cause.currentAmount > 0
          ? Math.round((totalDisbursed / cause.currentAmount) * 100)
          : 0;

      return `
      <div class="bg-white rounded-2xl shadow-lg p-6">
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <h3 class="text-xl font-bold text-gray-900 mb-2">${cause.title}</h3>
            <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              ${cause.category}
            </span>
          </div>
          <button
            onclick="showCreateTransparencyModal('${cause._id}')"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <i class="fas fa-plus mr-2"></i>Buat Laporan
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div class="bg-blue-50 rounded-lg p-4">
            <p class="text-xs text-gray-600 mb-1">Dana Terkumpul</p>
            <p class="text-lg font-bold text-blue-600">
              ${formatCurrency(cause.currentAmount)}
            </p>
          </div>
          <div class="bg-green-50 rounded-lg p-4">
            <p class="text-xs text-gray-600 mb-1">Total Disalurkan</p>
            <p class="text-lg font-bold text-green-600">
              ${formatCurrency(totalDisbursed)}
            </p>
          </div>
          <div class="bg-orange-50 rounded-lg p-4">
            <p class="text-xs text-gray-600 mb-1">Sisa Dana</p>
            <p class="text-lg font-bold text-orange-600">
              ${formatCurrency(remainingFunds)}
            </p>
          </div>
          <div class="bg-purple-50 rounded-lg p-4">
            <p class="text-xs text-gray-600 mb-1">Progress Penyaluran</p>
            <p class="text-lg font-bold text-purple-600">
              ${disbursementPercentage}%
            </p>
          </div>
        </div>

        <div class="mb-4">
          <div class="flex justify-between text-sm mb-1">
            <span class="text-gray-600">Progress Penyaluran</span>
            <span class="font-semibold text-gray-900">${disbursementPercentage}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3">
            <div 
              class="bg-green-500 h-3 rounded-full transition-all duration-500"
              style="width: ${Math.min(disbursementPercentage, 100)}%"
            ></div>
          </div>
        </div>

        <div class="border-t border-gray-200 pt-4">
          <h4 class="text-sm font-bold text-gray-900 mb-3">
            Laporan Penyaluran (${reports.length})
          </h4>
          ${
            reports.length === 0
              ? `
            <p class="text-sm text-gray-500 text-center py-4">
              Belum ada laporan penyaluran
            </p>
          `
              : `
            <div class="space-y-3">
              ${reports
                .map(
                  (report) => `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div class="flex items-center space-x-3 flex-1">
                    <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <i class="fas fa-receipt text-green-600"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold text-gray-900 truncate">
                        ${new Date(report.date).toLocaleDateString("id-ID")}
                      </p>
                      <p class="text-xs text-gray-600">
                        ${formatCurrency(report.amount)} • 
                        ${report.photos.length} foto • 
                        ${report.documents.length} dokumen
                      </p>
                    </div>
                    <span class="px-2 py-1 rounded-full text-xs font-semibold ${
                      report.status === "published"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }">
                      ${report.status}
                    </span>
                  </div>
                  <div class="flex items-center space-x-2 ml-4">
                    <button
                      onclick="viewTransparencyReport('${report._id}')"
                      class="text-blue-600 hover:text-blue-700 p-2"
                      title="Lihat Detail"
                    >
                      <i class="fas fa-eye"></i>
                    </button>
                    <button
                      onclick="showEditTransparencyModal('${report._id}')"
                      class="text-orange-600 hover:text-orange-700 p-2"
                      title="Edit"
                    >
                      <i class="fas fa-edit"></i>
                    </button>
                    <button
                      onclick="deleteTransparencyReport('${report._id}')"
                      class="text-red-600 hover:text-red-700 p-2"
                      title="Hapus"
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
          `
          }
        </div>
      </div>
    `;
    })
    .join("");
}

async function showCreateTransparencyModal(causeId) {
  try {
    showLoading();

    const response = await window.API.causes.getById(causeId);
    const cause = response.data;

    const reportsResponse = await window.API.transparency.getByCause(causeId);
    const totalDisbursed = reportsResponse.totalDisbursed || 0;
    const remainingFunds = cause.currentAmount - totalDisbursed;

    currentCauseForReport = cause;
    currentEditingReportId = null;
    selectedPhotos = [];
    selectedDocuments = [];

    document.getElementById("transparency-form").reset();
    document.getElementById("transparency-cause-id").value = causeId;
    document.getElementById("transparency-report-id").value = "";
    document.getElementById("transparency-cause-name").textContent =
      cause.title;
    document.getElementById("remaining-funds").textContent =
      formatCurrency(remainingFunds);
    document.getElementById("max-amount-text").textContent =
      formatCurrency(remainingFunds);
    document
      .getElementById("transparency-amount")
      .setAttribute("max", remainingFunds);

    const today = new Date().toISOString().split("T")[0];
    document.getElementById("transparency-date").value = today;

    document.getElementById("photos-preview").innerHTML = "";
    document.getElementById("documents-preview").innerHTML = "";
    document.getElementById("transparency-desc-count").textContent = "0";

    document.getElementById("transparency-modal-title").textContent =
      "Buat Laporan Penyaluran";
    document.getElementById("transparency-submit-text").textContent =
      "Simpan Laporan";

    document.getElementById("transparency-modal").classList.remove("hidden");

    hideLoading();
  } catch (error) {
    hideLoading();
    console.error("❌ Error loading cause:", error);
    showNotification("Gagal memuat data program", "error");
  }
}

async function showEditTransparencyModal(reportId) {
  try {
    showLoading();

    const response = await window.API.transparency.getById(reportId);
    const report = response.data;

    currentEditingReportId = reportId;
    currentCauseForReport = report.cause;

    const reportsResponse = await window.API.transparency.getByCause(
      report.cause._id
    );
    const totalDisbursed = reportsResponse.totalDisbursed || 0;
    const remainingFunds =
      report.cause.currentAmount - totalDisbursed + report.amount;

    document.getElementById("transparency-cause-id").value = report.cause._id;
    document.getElementById("transparency-report-id").value = reportId;
    document.getElementById("transparency-cause-name").textContent =
      report.cause.title;
    document.getElementById("transparency-date").value =
      report.date.split("T")[0];
    document.getElementById("transparency-amount").value = report.amount;
    document.getElementById("transparency-description").value =
      report.description;
    document.getElementById("transparency-desc-count").textContent =
      report.description.length;

    document.querySelector(
      `input[name="transparency-status"][value="${report.status}"]`
    ).checked = true;

    document.getElementById("remaining-funds").textContent =
      formatCurrency(remainingFunds);
    document.getElementById("max-amount-text").textContent =
      formatCurrency(remainingFunds);
    document
      .getElementById("transparency-amount")
      .setAttribute("max", remainingFunds);

    displayExistingPhotos(report.photos, reportId);
    displayExistingDocuments(report.documents, reportId);

    document.getElementById("transparency-modal-title").textContent =
      "Edit Laporan Penyaluran";
    document.getElementById("transparency-submit-text").textContent =
      "Update Laporan";

    document.getElementById("transparency-modal").classList.remove("hidden");

    hideLoading();
  } catch (error) {
    hideLoading();
    console.error("❌ Error loading report:", error);
    showNotification("Gagal memuat laporan", "error");
  }
}

function closeTransparencyModal() {
  document.getElementById("transparency-modal").classList.add("hidden");
  currentEditingReportId = null;
  currentCauseForReport = null;
  selectedPhotos = [];
  selectedDocuments = [];
}

function handleTransparencyPhotos(event) {
  const files = Array.from(event.target.files);

  if (files.length + selectedPhotos.length > 10) {
    showNotification("Maksimal 10 foto", "warning");
    return;
  }

  files.forEach((file) => {
    if (file.size > 5 * 1024 * 1024) {
      showNotification(`File ${file.name} terlalu besar (max 5MB)`, "error");
      return;
    }
    selectedPhotos.push(file);
  });

  displayPhotosPreviews();
}

function displayPhotosPreviews() {
  const container = document.getElementById("photos-preview");

  container.innerHTML = selectedPhotos
    .map((file, index) => {
      const url = URL.createObjectURL(file);
      return `
      <div class="relative">
        <img 
          src="${url}" 
          alt="Preview" 
          class="w-full h-24 object-cover rounded-lg"
        />
        <button
          type="button"
          onclick="removePhoto(${index})"
          class="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full hover:bg-red-600 text-xs"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    })
    .join("");
}

function removePhoto(index) {
  selectedPhotos.splice(index, 1);
  displayPhotosPreviews();
}

function handleTransparencyDocuments(event) {
  const files = Array.from(event.target.files);

  if (files.length + selectedDocuments.length > 5) {
    showNotification("Maksimal 5 dokumen", "warning");
    return;
  }

  files.forEach((file) => {
    if (file.size > 10 * 1024 * 1024) {
      showNotification(`File ${file.name} terlalu besar (max 10MB)`, "error");
      return;
    }
    selectedDocuments.push(file);
  });

  displayDocumentsPreviews();
}

function displayDocumentsPreviews() {
  const container = document.getElementById("documents-preview");

  container.innerHTML = selectedDocuments
    .map((file, index) => {
      const icon = file.type.includes("pdf") ? "file-pdf" : "image";
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);

      return `
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div class="flex items-center space-x-3 flex-1 min-w-0">
          <i class="fas fa-${icon} text-gray-400 text-xl flex-shrink-0"></i>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-900 truncate">${file.name}</p>
            <p class="text-xs text-gray-500">${sizeInMB} MB</p>
          </div>
        </div>
        <button
          type="button"
          onclick="removeDocument(${index})"
          class="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
        >
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    })
    .join("");
}

function removeDocument(index) {
  selectedDocuments.splice(index, 1);
  displayDocumentsPreviews();
}

function displayExistingPhotos(photos, reportId) {
  const container = document.getElementById("photos-preview");

  container.innerHTML = photos
    .map(
      (photo) => `
    <div class="relative">
      <img 
        src="${photo.url}" 
        alt="Photo" 
        class="w-full h-24 object-cover rounded-lg"
      />
      <button
        type="button"
        onclick="deleteExistingAttachment('${reportId}', '${photo._id}', 'photo')"
        class="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full hover:bg-red-600 text-xs"
      >
        <i class="fas fa-times"></i>
      </button>
    </div>
  `
    )
    .join("");
}

function displayExistingDocuments(documents, reportId) {
  const container = document.getElementById("documents-preview");

  container.innerHTML = documents
    .map(
      (doc) => `
    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div class="flex items-center space-x-3 flex-1 min-w-0">
        <i class="fas fa-${
          doc.fileType === "pdf" ? "file-pdf" : "image"
        } text-gray-400 text-xl"></i>
        <a 
          href="${doc.url}" 
          target="_blank"
          class="text-sm text-blue-600 hover:text-blue-700 truncate flex-1"
        >
          ${doc.fileName}
        </a>
      </div>
      <button
        type="button"
        onclick="deleteExistingAttachment('${reportId}', '${
        doc._id
      }', 'document')"
        class="text-red-500 hover:text-red-700 ml-2"
      >
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `
    )
    .join("");
}

async function deleteExistingAttachment(reportId, attachmentId, type) {
  if (
    !confirm(`Hapus ${type === "photo" ? "foto" : "dokumen"} ini dari laporan?`)
  ) {
    return;
  }

  try {
    showLoading();
    await window.API.transparency.deleteAttachment(
      reportId,
      attachmentId,
      type
    );
    showNotification("Attachment berhasil dihapus", "success");
    await showEditTransparencyModal(reportId);
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error("❌ Error deleting attachment:", error);
    showNotification("Gagal menghapus attachment", "error");
  }
}

document
  .getElementById("transparency-form")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      showLoading();

      const causeId = document.getElementById("transparency-cause-id").value;
      const reportId = document.getElementById("transparency-report-id").value;
      const amount = document.getElementById("transparency-amount").value;
      const date = document.getElementById("transparency-date").value;
      const description = document.getElementById(
        "transparency-description"
      ).value;
      const status = document.querySelector(
        'input[name="transparency-status"]:checked'
      ).value;

      const formData = new FormData();
      formData.append("causeId", causeId);
      formData.append("amount", amount);
      formData.append("date", date);
      formData.append("description", description);
      formData.append("status", status);

      selectedPhotos.forEach((photo) => {
        formData.append("photos", photo);
      });

      selectedDocuments.forEach((doc) => {
        formData.append("documents", doc);
      });

      let response;
      if (reportId) {
        response = await window.API.transparency.update(reportId, formData);
        showNotification("Laporan berhasil diupdate!", "success");
      } else {
        response = await window.API.transparency.create(formData);
        showNotification("Laporan berhasil dibuat!", "success");
      }

      closeTransparencyModal();
      await loadTransparencyReportsByCause();

      hideLoading();
    } catch (error) {
      hideLoading();
      console.error("❌ Error saving report:", error);
      showNotification(error.message || "Gagal menyimpan laporan", "error");
    }
  });

async function viewTransparencyReport(reportId) {
  try {
    showLoading();
    const response = await window.API.transparency.getById(reportId);
    const report = response.data;

    const reportDate = new Date(report.date).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const modalHTML = `
      <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" id="view-report-modal">
        <div class="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div class="sticky top-0 bg-white border-b px-6 py-4">
            <div class="flex justify-between items-center">
              <h2 class="text-2xl font-bold">Detail Laporan Penyaluran</h2>
              <button onclick="document.getElementById('view-report-modal').remove()" class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-times text-2xl"></i>
              </button>
            </div>
          </div>
          <div class="p-6">
            <div class="mb-6">
              <p class="text-sm text-gray-600">Program</p>
              <p class="text-xl font-bold text-gray-900">${
                report.cause.title
              }</p>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p class="text-sm text-gray-600">Tanggal Penyaluran</p>
                <p class="text-lg font-semibold">${reportDate}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Jumlah Disalurkan</p>
                <p class="text-lg font-semibold text-green-600">${formatCurrency(
                  report.amount
                )}</p>
              </div>
            </div>
            <div class="mb-6">
              <p class="text-sm font-bold text-gray-700 mb-2">Deskripsi</p>
              <p class="text-gray-700 leading-relaxed">${report.description}</p>
            </div>
            ${
              report.photos.length > 0
                ? `
              <div class="mb-6">
                <p class="text-sm font-bold text-gray-700 mb-2">Foto Kegiatan</p>
                <div class="grid grid-cols-3 gap-3">
                  ${report.photos
                    .map(
                      (photo) => `
                    <a href="${photo.url}" target="_blank">
                      <img src="${photo.url}" class="w-full h-32 object-cover rounded-lg hover:opacity-80" />
                    </a>
                  `
                    )
                    .join("")}
                </div>
              </div>
            `
                : ""
            }
            ${
              report.documents.length > 0
                ? `
              <div>
                <p class="text-sm font-bold text-gray-700 mb-2">Dokumen</p>
                <div class="space-y-2">
                  ${report.documents
                    .map(
                      (doc) => `
                    <a href="${
                      doc.url
                    }" target="_blank" class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <i class="fas fa-${
                        doc.fileType === "pdf" ? "file-pdf" : "image"
                      } mr-3"></i>
                      <span>${doc.fileName}</span>
                    </a>
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
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error("❌ Error viewing report:", error);
    showNotification("Gagal memuat detail laporan", "error");
  }
}

async function deleteTransparencyReport(reportId) {
  if (!confirm("Apakah Anda yakin ingin menghapus laporan ini?")) {
    return;
  }

  try {
    showLoading();
    await window.API.transparency.delete(reportId);
    showNotification("Laporan berhasil dihapus", "success");
    await loadTransparencyReportsByCause();
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error("❌ Error deleting report:", error);
    showNotification("Gagal menghapus laporan", "error");
  }
}

document
  .getElementById("transparency-description")
  ?.addEventListener("input", (e) => {
    document.getElementById("transparency-desc-count").textContent =
      e.target.value.length;
  });

document
  .getElementById("btn-filter-transparency")
  ?.addEventListener("click", async () => {
    const causeId = document.getElementById("filter-transparency-cause").value;

    try {
      showLoading();

      if (causeId) {
        const response = await window.API.transparency.getByCause(causeId);
        const causeResponse = await window.API.causes.getById(causeId);

        displayCausesWithReports([
          {
            cause: causeResponse.data,
            reports: response.data || [],
            totalDisbursed: response.totalDisbursed || 0,
          },
        ]);
      } else {
        await loadTransparencyReportsByCause();
      }

      hideLoading();
    } catch (error) {
      hideLoading();
      console.error("❌ Error filtering:", error);
      showNotification("Gagal memfilter laporan", "error");
    }
  });

// Function untuk open modal
function openUserRoleModal(userId, currentRole, userName, userEmail) {
  selectedUserId = userId;
  document.getElementById("modal-user-name").textContent = userName;
  document.getElementById("modal-user-email").textContent = userEmail;
  document.getElementById("user-role-select").value = currentRole;
  document.getElementById("user-role-modal").classList.remove("hidden");
}

// Function untuk close modal
function closeUserRoleModal() {
  document.getElementById("user-role-modal").classList.add("hidden");
  selectedUserId = null;
}

// Function untuk submit role change
async function submitUserRole() {
  const newRole = document.getElementById("user-role-select").value;

  try {
    showLoading("Mengubah role...");

    const response = await window.API.admin.updateUserRole(
      selectedUserId,
      newRole
    );

    if (response.success) {
      showNotification("Role berhasil diubah!", "success");
      closeUserRoleModal();
      await loadUsers();
    }

    hideLoading();
  } catch (error) {
    hideLoading();
    showNotification("Gagal mengubah role", "error");
  }
}

// Event listener untuk live search
document
  .getElementById("search-user-email")
  ?.addEventListener("input", function (e) {
    const searchTerm = e.target.value.toLowerCase().trim();

    if (searchTerm === "") {
      displayUsers(allUsers);
    } else {
      const filteredUsers = allUsers.filter((user) =>
        user.email.toLowerCase().includes(searchTerm)
      );
      displayUsers(filteredUsers);
    }
  });

// =====================================================
// UTILITY FUNCTIONS
// =====================================================
function toggleSidebar() {
  window.utils.toggleSidebar();
}

function handleLogout() {
  window.utils.logout();
}

function redirectBasedOnRole(role) {
  window.utils.redirectBasedOnRole(role);
}

function formatCurrency(amount) {
  return window.utils.formatCurrency(amount);
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

// =====================================================
// EXPOSE GLOBAL FUNCTIONS
// =====================================================
window.showCreateCauseModal = showCreateCauseModal;
window.closeCauseModal = closeCauseModal;
window.showEditCauseModal = showEditCauseModal;
window.handleImageSelect = handleImageSelect;
window.removeImage = removeImage;
window.deleteCause = deleteCause;
window.verifyDonation = verifyDonation;
window.filterDonations = filterDonations;
window.downloadDonorReport = downloadDonorReport;
window.downloadAllDonationsReport = downloadAllDonationsReport;
window.loadTransparency = loadTransparency;
window.showCreateTransparencyModal = showCreateTransparencyModal;
window.showEditTransparencyModal = showEditTransparencyModal;
window.closeTransparencyModal = closeTransparencyModal;
window.handleTransparencyPhotos = handleTransparencyPhotos;
window.handleTransparencyDocuments = handleTransparencyDocuments;
window.removePhoto = removePhoto;
window.removeDocument = removeDocument;
window.deleteExistingAttachment = deleteExistingAttachment;
window.viewTransparencyReport = viewTransparencyReport;
window.deleteTransparencyReport = deleteTransparencyReport;
window.openUserRoleModal = openUserRoleModal;
window.closeUserRoleModal = closeUserRoleModal;
window.submitUserRole = submitUserRole;

console.log("✅ Admin.js loaded successfully");
