// Environment-specific configuration
const ENV = import.meta.env.VITE_NODE_ENV || "development";

const config = {
  development: {
    api: {
      baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
      fallbackURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
      timeout: 5000,
      retryAttempts: 3,
    },
    socket: {
      url: import.meta.env.VITE_SOCKET_URL || "http://localhost:8000",
      options: {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        transports: ["websocket", "polling"],
      },
    },
    endpoints: {
      parking: "/api/parkings",
      floors: "/api/floors",
      zones: "/api/zones",
      reports: "/api/reports",
      displays: "/api/displays",
      createParking: "/routes/admin/createParking",
      auth: {
        login: "/api/auth/login",
        register: "/api/auth/register",
      },
    },
  },
  production: {
    api: {
      baseURL: "https://your-production-api.com",
      fallbackURL: "https://your-fallback-api.com",
      timeout: 10000,
      retryAttempts: 3,
    },
    socket: {
      url: "https://your-production-socket.com",
      options: {
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        timeout: 15000,
        transports: ["websocket", "polling"],
      },
    },
    endpoints: {
      parking: "/api/parkings",
      floors: "/api/floors",
      zones: "/api/zones",
      reports: "/api/reports",
      displays: "/api/displays",
    },
  },
};

export default config[ENV];
