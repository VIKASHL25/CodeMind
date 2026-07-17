import axios from "axios";

// In Docker: empty baseURL = same origin (Nginx handles routing)
// In dev: http://localhost:8000
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || ""
});

API.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      const status = error.response.status;
      if (status === 502 || status === 503 || status === 504) {
        if (!error.response.data) {
          error.response.data = {};
        }
        error.response.data.detail = "The backend service is waking up from sleep mode. This can take up to a minute. Please try again in 1-2 minutes.";
      }
    } else if (error.request) {
      // Network/timeout error when server is sleeping and not responding
      error.response = {
        data: {
          detail: "The backend service is waking up from sleep mode. Please try again in 1-2 minutes."
        }
      };
    }
    return Promise.reject(error);
  }
);

export const signup      = (d) => API.post("/auth/signup", d);
export const login       = (d) => API.post("/auth/login",  d);
export const analyzeCode = (d) => API.post("/analyze/code", d);
export const analyzeData = (d) => API.post("/analyze/data", d);