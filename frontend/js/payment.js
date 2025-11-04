// Midtrans Payment Integration

// Load Midtrans Snap script
const loadMidtransScript = () => {
  return new Promise((resolve, reject) => {
    if (window.snap) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", "SB-Mid-client-jvznO7_nOuRkV7yT");

    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Midtrans script"));

    document.head.appendChild(script);
  });
};

// Initialize Midtrans payment
const initMidtransPayment = async (snapToken, options = {}) => {
  try {
    await loadMidtransScript();

    return new Promise((resolve, reject) => {
      window.snap.pay(snapToken, {
        onSuccess: function (result) {
          console.log("Payment success:", result);
          resolve(result);
        },
        onPending: function (result) {
          console.log("Payment pending:", result);
          resolve(result);
        },
        onError: function (result) {
          console.error("Payment error:", result);
          reject(result);
        },
        onClose: function () {
          console.log("Payment popup closed");
          if (options.onClose) {
            options.onClose();
          }
        },
      });
    });
  } catch (error) {
    console.error("Failed to initialize Midtrans:", error);
    throw error;
  }
};

// Process donation with Midtrans
const processDonationWithMidtrans = async (donationData) => {
  try {
    // Show loading (use function from app.js)
    if (typeof showLoading === "function") {
      showLoading("Memproses pembayaran...");
    }

    // Create donation and get snap token from backend
    const response = await window.API.donations.create(donationData);

    // Hide loading
    if (typeof hideLoading === "function") {
      hideLoading();
    }

    if (response.success && response.data.paymentToken) {
      // Initialize Midtrans payment
      const result = await initMidtransPayment(response.data.paymentToken, {
        onClose: () => {
          console.log("User closed payment popup");
        },
      });

      return {
        success: true,
        orderId: response.data.donation.orderId,
        result,
      };
    } else {
      throw new Error("Failed to get payment token");
    }
  } catch (error) {
    if (typeof hideLoading === "function") {
      hideLoading();
    }
    throw error;
  }
};

// Check payment status
const checkPaymentStatus = async (orderId) => {
  try {
    const response = await window.API.donations.getByOrderId(orderId);
    return response.data;
  } catch (error) {
    console.error("Failed to check payment status:", error);
    throw error;
  }
};

// Handle payment callback from URL
const handlePaymentCallback = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get("order_id");

  if (orderId) {
    try {
      const donation = await checkPaymentStatus(orderId);

      // Redirect based on status
      if (donation.status === "success" || donation.status === "settlement") {
        if (typeof showSuccess === "function") {
          showSuccess(
            `Terima kasih! Donasi Anda sebesar Rp ${donation.amount.toLocaleString(
              "id-ID"
            )} telah berhasil diproses.`
          );
        }
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 3000);
      } else if (donation.status === "pending") {
        if (typeof showError === "function") {
          showError(
            "Pembayaran Anda sedang diproses. Silakan selesaikan pembayaran."
          );
        }
      } else {
        if (typeof showError === "function") {
          showError("Pembayaran gagal atau dibatalkan.");
        }
      }
    } catch (error) {
      console.error("Error handling callback:", error);
      if (typeof showError === "function") {
        showError("Terjadi kesalahan saat memproses pembayaran.");
      }
    }
  }
};

// Export payment functions
window.Payment = {
  processDonation: processDonationWithMidtrans,
  checkStatus: checkPaymentStatus,
  handleCallback: handlePaymentCallback,
};

console.log("✅ Payment module loaded");
