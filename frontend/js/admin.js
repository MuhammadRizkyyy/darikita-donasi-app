// =====================================================
// ADMIN.JS - Admin Dashboard Logic with CRUD Modal
// =====================================================

// Global state for modal
let currentEditingCauseId = null;
let selectedImageFile = null;
let imagePreviewUrl = null;

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

    // Create modal
    createCauseModal();

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
// CREATE CAUSE MODAL
// =====================================================
function createCauseModal() {
  const modalHTML = `
    <div id="cause-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <!-- Modal Header -->
        <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div class="flex items-center justify-between">
            <h2 id="modal-title" class="text-2xl font-bold text-gray-900">Buat Program Baru</h2>
            <button onclick="closeCauseModal()" class="text-gray-400 hover:text-gray-600 transition-colors">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>
        </div>

        <!-- Modal Body -->
        <form id="cause-form" class="p-6 space-y-6">
          <!-- Title -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Judul Program <span class="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              id="cause-title" 
              name="title"
              required
              maxlength="100"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Contoh: Bantu Anak Yatim Untuk Sekolah"
            />
          </div>

          <!-- Category -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Kategori <span class="text-red-500">*</span>
            </label>
            <select 
              id="cause-category" 
              name="category"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          <!-- Description -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Deskripsi <span class="text-red-500">*</span>
            </label>
            <textarea 
              id="cause-description" 
              name="description"
              required
              maxlength="2000"
              rows="5"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Jelaskan detail program donasi..."
            ></textarea>
            <p class="text-sm text-gray-500 mt-1">
              <span id="desc-count">0</span>/2000 karakter
            </p>
          </div>

          <!-- Target Amount & Deadline -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Target Donasi (Rp) <span class="text-red-500">*</span>
              </label>
              <input 
                type="number" 
                id="cause-target" 
                name="targetAmount"
                required
                min="100000"
                step="10000"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                name="deadline"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <!-- Image Upload -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Gambar Program <span class="text-red-500">*</span>
            </label>
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors">
              <!-- Preview Area -->
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

              <!-- Upload Button -->
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
                name="image"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                class="hidden"
                onchange="handleImageSelect(event)"
              />
            </div>
          </div>

          <!-- Form Actions -->
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

  // Setup form submit handler
  document
    .getElementById("cause-form")
    .addEventListener("submit", handleCauseSubmit);

  // Setup description character counter
  document
    .getElementById("cause-description")
    .addEventListener("input", (e) => {
      document.getElementById("desc-count").textContent = e.target.value.length;
    });

  // Make upload placeholder clickable
  document
    .getElementById("upload-placeholder")
    .addEventListener("click", () => {
      document.getElementById("cause-image").click();
    });
}

// =====================================================
// MODAL FUNCTIONS
// =====================================================
function showCreateCauseModal() {
  currentEditingCauseId = null;
  selectedImageFile = null;
  imagePreviewUrl = null;

  // Reset form
  document.getElementById("cause-form").reset();
  document.getElementById("modal-title").textContent = "Buat Program Baru";
  document.getElementById("submit-btn-text").textContent = "Simpan Program";
  document.getElementById("desc-count").textContent = "0";

  // Reset image preview
  document.getElementById("image-preview-container").classList.add("hidden");
  document.getElementById("upload-placeholder").classList.remove("hidden");

  // Set minimum date to today
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("cause-deadline").setAttribute("min", today);

  // Show modal
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
    console.log("📝 Loading cause for edit:", causeId);

    const response = await window.API.causes.getById(causeId);
    const cause = response.data;

    currentEditingCauseId = causeId;

    // Fill form with cause data
    document.getElementById("cause-title").value = cause.title;
    document.getElementById("cause-category").value = cause.category;
    document.getElementById("cause-description").value = cause.description;
    document.getElementById("cause-target").value = cause.targetAmount;
    document.getElementById("desc-count").textContent =
      cause.description.length;

    // Format date for input
    const deadline = new Date(cause.deadline).toISOString().split("T")[0];
    document.getElementById("cause-deadline").value = deadline;

    // Show existing image
    if (cause.image) {
      imagePreviewUrl = cause.image;
      document.getElementById("image-preview").src = cause.image;
      document
        .getElementById("image-preview-container")
        .classList.remove("hidden");
      document.getElementById("upload-placeholder").classList.add("hidden");
    }

    // Update modal title
    document.getElementById("modal-title").textContent = "Edit Program";
    document.getElementById("submit-btn-text").textContent = "Update Program";

    // Show modal
    document.getElementById("cause-modal").classList.remove("hidden");

    hideLoading();
  } catch (error) {
    hideLoading();
    console.error("❌ Error loading cause:", error);
    showNotification("Gagal memuat data program", "error");
  }
}

// =====================================================
// IMAGE HANDLING
// =====================================================
function handleImageSelect(event) {
  const file = event.target.files[0];

  if (!file) return;

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    showNotification("Ukuran file maksimal 5MB", "error");
    event.target.value = "";
    return;
  }

  // Validate file type
  const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  if (!validTypes.includes(file.type)) {
    showNotification("Format file harus PNG, JPG, atau WEBP", "error");
    event.target.value = "";
    return;
  }

  selectedImageFile = file;

  // Create preview
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

// =====================================================
// FORM SUBMIT HANDLER
// =====================================================
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

    // Add image if selected
    if (selectedImageFile) {
      formData.append("image", selectedImageFile);
    } else if (currentEditingCauseId && imagePreviewUrl) {
      // Keep existing image URL when editing
      formData.append("image", imagePreviewUrl);
    }

    let response;
    if (currentEditingCauseId) {
      // Update existing cause
      console.log("📝 Updating cause:", currentEditingCauseId);
      response = await window.API.causes.update(
        currentEditingCauseId,
        formData
      );
      showNotification("Program berhasil diupdate!", "success");
    } else {
      // Create new cause
      console.log("✨ Creating new cause");
      response = await window.API.causes.create(formData);
      showNotification("Program berhasil dibuat!", "success");
    }

    console.log("✅ Cause saved:", response.data);

    // Close modal and reload causes
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

    console.log("✅ Statistics loaded");
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

// =====================================================
// DELETE CAUSE
// =====================================================
async function deleteCause(id) {
  if (confirm("Apakah Anda yakin ingin menghapus program ini?")) {
    try {
      showLoading();
      console.log("🗑️ Deleting cause:", id);

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

// =====================================================
// VERIFY DONATION
// =====================================================
async function verifyDonation(id) {
  if (confirm("Verifikasi donasi ini?")) {
    try {
      showLoading();
      console.log("✅ Verifying donation:", id);

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
// OTHER FUNCTIONS
// =====================================================
function filterDonations() {
  const status = document.getElementById("filter-donation-status").value;
  loadDonations(status);
}

async function loadReports() {
  showNotification("Fitur laporan akan segera tersedia", "info");
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

// =====================================================
// EXPOSE GLOBAL FUNCTIONS (untuk onclick di HTML)
// =====================================================
window.showCreateCauseModal = showCreateCauseModal;
window.closeCauseModal = closeCauseModal;
window.showEditCauseModal = showEditCauseModal;
window.handleImageSelect = handleImageSelect;
window.removeImage = removeImage;
window.deleteCause = deleteCause;
window.verifyDonation = verifyDonation;
window.filterDonations = filterDonations;

console.log("✅ Admin.js loaded successfully");
