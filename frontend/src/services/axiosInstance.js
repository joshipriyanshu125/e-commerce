import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // CRITICAL: Do NOT set Content-Type for FormData requests.
    // Axios must set it automatically so it includes the multipart boundary.
    // If the body is FormData, remove the Content-Type header entirely.
    const isFormData = typeof FormData !== "undefined" && (
      config.data instanceof FormData ||
      Object.prototype.toString.call(config.data) === "[object FormData]"
    );
    if (isFormData) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    } else if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const errMsg = data?.message || "";

      // User is blocked → force logout
      if (status === 403 && errMsg.toLowerCase().includes("blocked")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (!window.location.pathname.includes("/login")) {
          window.location.href = `/login?error=${encodeURIComponent(errMsg)}`;
        }
      }

      // Token is invalid / expired → clear stale token and redirect to login
      if (
        status === 401 &&
        (errMsg.toLowerCase().includes("token") ||
          errMsg.toLowerCase().includes("not authorized"))
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Only redirect if we are NOT already on an auth page
        if (
          !window.location.pathname.includes("/login") &&
          !window.location.pathname.includes("/register")
        ) {
          window.location.href = `/login?session=expired`;
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
