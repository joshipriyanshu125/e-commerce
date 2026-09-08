import axios from "axios";

const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const cleanBaseUrl = rawApiUrl.replace(/\/+$/, "");
const apiBaseUrl = cleanBaseUrl.endsWith("/api") ? cleanBaseUrl : `${cleanBaseUrl}/api`;

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

export default api;