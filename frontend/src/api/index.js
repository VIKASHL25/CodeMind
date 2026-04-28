import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:8000" });

API.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const signup      = (d) => API.post("/auth/signup", d);
export const login       = (d) => API.post("/auth/login",  d);
export const analyzeCode = (d) => API.post("/analyze/code", d);
export const analyzeData = (d) => API.post("/analyze/data", d);