// API Configuration
const API_BASE_URL = "http://localhost:5000/api";

// Get token from localStorage
const getToken = () => localStorage.getItem("token");
const setToken = (token) => localStorage.setItem("token", token);
const removeToken = () => localStorage.removeItem("token");

const getUserData = () => {
  const userData = localStorage.getItem("userData");
  return userData ? JSON.parse(userData) : null;
};

const setUserData = (data) => {
  localStorage.setItem("userData", JSON.stringify(data));
};

const removeUserData = () => {
  localStorage.removeItem("userData");
};

// API Request Helper
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// Auth API
const authAPI = {
  register: async (userData) => {
    const response = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
    if (response.success) {
      setToken(response.data.token);
      setUserData(response.data);
    }
    return response;
  },
  login: async (credentials) => {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    if (response.success) {
      setToken(response.data.token);
      setUserData(response.data);
    }
    return response;
  },
  logout: () => {
    removeToken();
    removeUserData();
  },
  getMe: async () => {
    return await apiRequest("/auth/me");
  },
  updateProfile: async (profileData) => {
    return await apiRequest("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  },
};

// Causes API
const causesAPI = {
  getAll: async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    return await apiRequest(`/causes${queryString ? "?" + queryString : ""}`);
  },
  getById: async (id) => {
    return await apiRequest(`/causes/${id}`);
  },
  create: async (causeData) => {
    const isFormData = causeData instanceof FormData;
    return await apiRequest("/causes", {
      method: "POST",
      body: isFormData ? causeData : JSON.stringify(causeData),
      headers: isFormData ? {} : { "Content-Type": "application/json" },
    });
  },
  update: async (id, causeData) => {
    const isFormData = causeData instanceof FormData;
    return await apiRequest(`/causes/${id}`, {
      method: "PUT",
      body: isFormData ? causeData : JSON.stringify(causeData),
      headers: isFormData ? {} : { "Content-Type": "application/json" },
    });
  },
  delete: async (id) => {
    return await apiRequest(`/causes/${id}`, {
      method: "DELETE",
    });
  },
  addUpdate: async (id, updateData) => {
    return await apiRequest(`/causes/${id}/updates`, {
      method: "POST",
      body: JSON.stringify(updateData),
    });
  },
  verify: async (id) => {
    return await apiRequest(`/causes/${id}/verify`, {
      method: "PUT",
    });
  },
};

// Donations API
const donationsAPI = {
  create: async (donationData) => {
    return await apiRequest("/donations", {
      method: "POST",
      body: JSON.stringify(donationData),
    });
  },
  getMyDonations: async () => {
    return await apiRequest("/donations/my-donations");
  },
  getAll: async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    return await apiRequest(
      `/donations${queryString ? "?" + queryString : ""}`
    );
  },
  getByOrderId: async (orderId) => {
    return await apiRequest(`/donations/order/${orderId}`);
  },
  distribute: async (id, proofData) => {
    return await apiRequest(`/donations/${id}/distribute`, {
      method: "PUT",
      body: JSON.stringify({ proof: proofData }),
    });
  },
  verify: async (id) => {
    return await apiRequest(`/donations/${id}/verify`, {
      method: "PUT",
    });
  },
};

// Admin API
const adminAPI = {
  getStats: async () => {
    return await apiRequest("/admin/stats");
  },
  getAllUsers: async () => {
    return await apiRequest("/admin/users");
  },
  updateUserRole: async (userId, role) => {
    return await apiRequest(`/admin/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    });
  },
  deleteUser: async (userId) => {
    return await apiRequest(`/admin/users/${userId}`, {
      method: "DELETE",
    });
  },
  getAllDonations: async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    return await apiRequest(
      `/admin/donations${queryString ? "?" + queryString : ""}`
    );
  },
  verifyDonation: async (donationId) => {
    return await apiRequest(`/admin/donations/${donationId}/verify`, {
      method: "PUT",
    });
  },
  updateDistribution: async (donationId, data) => {
    return await apiRequest(`/admin/donations/${donationId}/distribution`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};

// Reports API
const reportsAPI = {
  getAllDonors: async () => {
    return await apiRequest("/reports/donors");
  },
  getDonorReport: async (userId, filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    return await apiRequest(
      `/reports/donor/${userId}${queryString ? "?" + queryString : ""}`
    );
  },
  getAllDonationsReport: async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    return await apiRequest(
      `/reports/all${queryString ? "?" + queryString : ""}`
    );
  },
};

// ✨ NEW: Transparency Reports API
const transparencyAPI = {
  // Get all reports (admin)
  getAll: async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    return await apiRequest(
      `/transparency${queryString ? "?" + queryString : ""}`
    );
  },

  // Get reports by cause (public)
  getByCause: async (causeId) => {
    return await apiRequest(`/transparency/cause/${causeId}`);
  },

  // Get single report
  getById: async (id) => {
    return await apiRequest(`/transparency/${id}`);
  },

  // Create report (admin)
  create: async (reportData) => {
    const isFormData = reportData instanceof FormData;
    return await apiRequest("/transparency", {
      method: "POST",
      body: reportData, // Always FormData for file uploads
    });
  },

  // Update report (admin)
  update: async (id, reportData) => {
    return await apiRequest(`/transparency/${id}`, {
      method: "PUT",
      body: reportData, // FormData
    });
  },

  // Delete report (admin)
  delete: async (id) => {
    return await apiRequest(`/transparency/${id}`, {
      method: "DELETE",
    });
  },

  // Delete attachment
  deleteAttachment: async (reportId, attachmentId, type) => {
    return await apiRequest(`/transparency/${reportId}/attachment`, {
      method: "DELETE",
      body: JSON.stringify({ attachmentId, type }),
    });
  },
};

// Auditor API
const auditorAPI = {
  getStats: async () => {
    return await apiRequest("/auditor/stats");
  },

  getAllDonations: async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    return await apiRequest(
      `/auditor/donations${queryString ? "?" + queryString : ""}`
    );
  },

  getDonationDetail: async (id) => {
    return await apiRequest(`/auditor/donations/${id}`);
  },

  markAsAudited: async (id, data) => {
    return await apiRequest(`/auditor/donations/${id}/audit`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  getAuditLogs: async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    return await apiRequest(
      `/auditor/logs${queryString ? "?" + queryString : ""}`
    );
  },

  generateReport: async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    return await apiRequest(
      `/auditor/report${queryString ? "?" + queryString : ""}`
    );
  },
};

// Export APIs
window.API = {
  auth: authAPI,
  causes: causesAPI,
  donations: donationsAPI,
  admin: adminAPI,
  reports: reportsAPI,
  transparency: transparencyAPI,
  auditor: auditorAPI,
};
