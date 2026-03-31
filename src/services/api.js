import axios from "axios";
import config from "../config/config";

// Create an axios instance with default config
const api = axios.create({
  baseURL: config.api.baseURL,
  timeout: config.api.timeout,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to add the auth token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  parking: {
    getAll: config.endpoints.parking,
    getById: (id) => `${config.endpoints.parking}/${id}`,
    create: config.endpoints.parking,
    update: (id) => `${config.endpoints.parking}/${id}`,
    delete: (id) => `${config.endpoints.parking}/${id}`,
  },
  zones: {
    getAll: config.endpoints.zones,
    getById: (id) => `${config.endpoints.zones}/${id}`,
    updateStatus: (id) => `${config.endpoints.zones}/${id}/status`,
    updateSecurity: (id) => `${config.endpoints.zones}/${id}/security`,
    updateMonitoring: (id) => `${config.endpoints.zones}/${id}/monitoring`,
  },
  floors: {
    getAll: config.endpoints.floors,
    getById: (id) => `${config.endpoints.floors}/${id}`,
  },
  reports: {
    occupancy: `${config.endpoints.reports}/occupancy`,
    entryExit: `${config.endpoints.reports}/entry-exit`,
    dailyOccupancy: `${config.endpoints.reports}/daily-occupancy`,
    stayDuration: `${config.endpoints.reports}/stay-duration`,
    peakHours: `${config.endpoints.reports}/peak-hours`,
    floorOccupancy: `${config.endpoints.reports}/floor-occupancy`,
    zoneOccupancy: `${config.endpoints.reports}/zone-occupancy`,
    spaceStatus: `${config.endpoints.reports}/space-status`,
    deviceHealth: `${config.endpoints.reports}/device-health`,
    monthlySummary: `${config.endpoints.reports}/monthly-summary`,
    dateRange: `${config.endpoints.reports}/date-range`,
  },
  displays: {
    getAll: config.endpoints.displays,
    getById: (id) => `${config.endpoints.displays}/${id}`,
    create: config.endpoints.displays,
    update: (id) => `${config.endpoints.displays}/${id}`,
    delete: (id) => `${config.endpoints.displays}/${id}`,
  },
  auth: {
    login: config.endpoints.auth.login,
    register: config.endpoints.auth.register,
  },
};

// API methods
export const apiService = {
  // GET requests
  get: async (endpoint, params = {}) => {
    try {
      const response = await api.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error("API GET Error:", error);
      throw error;
    }
  },

  // POST requests
  post: async (endpoint, data = {}) => {
    try {
      const response = await api.post(endpoint, data);
      return response.data;
    } catch (error) {
      console.error("API POST Error:", error);
      throw error;
    }
  },

  // PUT requests
  put: async (endpoint, data = {}) => {
    try {
      const response = await api.put(endpoint, data);
      return response.data;
    } catch (error) {
      console.error("API PUT Error:", error);
      throw error;
    }
  },

  // DELETE requests
  delete: async (endpoint) => {
    try {
      const response = await api.delete(endpoint);
      return response.data;
    } catch (error) {
      console.error("API DELETE Error:", error);
      throw error;
    }
  },
};
