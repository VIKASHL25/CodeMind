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

export const signup      = (d) => API.post("/auth/signup", d);
export const login       = (d) => API.post("/auth/login",  d);
export const analyzeCode = (d) => API.post("/analyze/code", d);
export const analyzeData = (d) => API.post("/analyze/data", d);