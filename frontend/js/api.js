// API Configuration
const API_BASE_URL = "http://localhost:5000/api";

// Get token from localStorage
const getToken = () => localStorage.getItem("token");

// Set token to localStorage
const setToken = (token) => localStorage.setItem("token", token);

// Remove token from localStorage
const removeToken = () => localStorage.removeItem("token");

// Get user data from localStorage
const getUserData = () => {
  const userData = localStorage.getItem("userData");
  return userData ? JSON.parse(userData) : null;
};

// Set user data to localStorage
const setUserData = (data) => {
  localStorage.setItem("userData", JSON.stringify(data));
};

// Remove user data from localStorage
const removeUserData = () => {
  localStorage.removeItem("userData");
};

// API Request Helper
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();

  // Build headers properly
  const headers = {
    ...options.headers,
  };

  // Add Authorization header if token exists
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Only set Content-Type for JSON if not FormData
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
    // Support both JSON and FormData
    const isFormData = causeData instanceof FormData;

    return await apiRequest("/causes", {
      method: "POST",
      body: isFormData ? causeData : JSON.stringify(causeData),
      headers: isFormData ? {} : { "Content-Type": "application/json" },
    });
  },

  update: async (id, causeData) => {
    // Support both JSON and FormData
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
  // Dashboard Stats
  getStats: async () => {
    return await apiRequest("/admin/stats");
  },

  // User Management
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

  // Donation Management
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

// Export APIs
window.API = {
  auth: authAPI,
  causes: causesAPI,
  donations: donationsAPI,
  admin: adminAPI,
};
