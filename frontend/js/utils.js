// =====================================================
// UTILS.JS - Shared Utility Functions
// =====================================================

/**
 * Redirect user based on their role
 * @param {string} role - User role (admin, auditor, donatur)
 */
function redirectBasedOnRole(role) {
  console.log(`🔄 Redirecting user with role: ${role}`);

  switch (role) {
    case "admin":
      window.location.href = "admin.html";
      break;
    case "auditor":
      window.location.href = "auditor.html";
      break;
    case "donatur":
      window.location.href = "dashboard.html";
      break;
    default:
      console.warn("Unknown role, redirecting to home");
      window.location.href = "index.html";
      break;
  }
}

/**
 * Format number to Indonesian Rupiah currency
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date to Indonesian locale
 * @param {Date|string} date - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
function formatDate(date, options = {}) {
  const defaultOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  return new Date(date).toLocaleDateString("id-ID", {
    ...defaultOptions,
    ...options,
  });
}

/**
 * Format date with time to Indonesian locale
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date and time string
 */
function formatDateTime(date) {
  return new Date(date).toLocaleString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Show loading overlay
 * @param {string} message - Loading message to display
 */
function showLoading(message = "Loading...") {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) {
    const loadingText = overlay.querySelector("p");
    if (loadingText) loadingText.textContent = message;
    overlay.classList.remove("hidden");
  }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) {
    overlay.classList.add("hidden");
  }
}

/**
 * Show notification toast
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, warning, info)
 */
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

/**
 * Capitalize first letter of string
 * @param {string} string - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalizeFirstLetter(string) {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Get role badge color
 * @param {string} role - User role
 * @returns {string} Tailwind CSS classes for badge
 */
function getRoleBadgeColor(role) {
  const colors = {
    admin: "bg-blue-100 text-blue-800",
    auditor: "bg-purple-100 text-purple-800",
    donatur: "bg-green-100 text-green-800",
  };
  return colors[role] || "bg-gray-100 text-gray-800";
}

/**
 * Get status badge color
 * @param {string} status - Status value
 * @returns {string} Tailwind CSS classes for badge
 */
function getStatusBadgeColor(status) {
  const colors = {
    pending: "bg-yellow-100 text-yellow-800",
    verified: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    expired: "bg-gray-100 text-gray-800",
    active: "bg-blue-100 text-blue-800",
    completed: "bg-purple-100 text-purple-800",
    closed: "bg-gray-100 text-gray-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

/**
 * Get audit status badge color
 * @param {string} status - Audit status
 * @returns {string} Tailwind CSS classes for badge
 */
function getAuditStatusBadgeColor(status) {
  const colors = {
    pending_audit: "bg-yellow-100 text-yellow-800",
    audit_in_progress: "bg-blue-100 text-blue-800",
    audit_verified: "bg-green-100 text-green-800",
    audit_flagged: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

/**
 * Get category icon and color
 * @param {string} category - Category name
 * @returns {object} Icon and color classes
 */
function getCategoryIcon(category) {
  const categories = {
    pendidikan: { icon: "fa-graduation-cap", color: "blue" },
    kesehatan: { icon: "fa-heartbeat", color: "red" },
    sosial: { icon: "fa-hands-helping", color: "green" },
    bencana: { icon: "fa-house-damage", color: "orange" },
    lingkungan: { icon: "fa-leaf", color: "emerald" },
    infrastruktur: { icon: "fa-building", color: "gray" },
    lainnya: { icon: "fa-ellipsis-h", color: "purple" },
  };
  return categories[category] || categories.lainnya;
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Indonesian format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
function isValidPhone(phone) {
  const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
  return phoneRegex.test(phone);
}

/**
 * Convert number to Indonesian words (1-1000)
 * @param {number} num - Number to convert
 * @returns {string} Number in words
 */
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
  } else if (num < 1000000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    return (
      (thousands === 1 ? "Seribu" : convertNumberToWords(thousands) + " Ribu") +
      (remainder > 0 ? " " + convertNumberToWords(remainder) : "")
    );
  } else {
    return num.toString(); // Fallback for large numbers
  }
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<void>}
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showNotification("Berhasil disalin ke clipboard", "success");
  } catch (err) {
    console.error("Failed to copy:", err);
    showNotification("Gagal menyalin ke clipboard", "error");
  }
}

/**
 * Download file from URL
 * @param {string} url - File URL
 * @param {string} filename - Filename for download
 */
function downloadFile(url, filename) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
function isAuthenticated() {
  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("userData");
  return !!(token && userData);
}

/**
 * Get current user data
 * @returns {object|null} User data or null
 */
function getCurrentUser() {
  const userData = localStorage.getItem("userData");
  if (!userData) return null;

  try {
    const parsed = JSON.parse(userData);
    return parsed.user || parsed;
  } catch (error) {
    console.error("Error parsing user data:", error);
    return null;
  }
}

/**
 * Logout user
 */
function logout() {
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

/**
 * Toggle mobile sidebar
 */
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");

  if (sidebar && overlay) {
    sidebar.classList.toggle("hidden-mobile");
    overlay.classList.toggle("hidden");
  }
}

// Add CSS animations for notifications
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

// Make functions globally available
window.utils = {
  redirectBasedOnRole,
  formatCurrency,
  formatDate,
  formatDateTime,
  showLoading,
  hideLoading,
  showNotification,
  capitalizeFirstLetter,
  truncateText,
  debounce,
  getRoleBadgeColor,
  getStatusBadgeColor,
  getAuditStatusBadgeColor,
  getCategoryIcon,
  isValidEmail,
  isValidPhone,
  convertNumberToWords,
  copyToClipboard,
  downloadFile,
  isAuthenticated,
  getCurrentUser,
  logout,
  toggleSidebar,
};

console.log("✅ Utils.js loaded successfully");
