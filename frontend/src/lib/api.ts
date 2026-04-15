// API_URL
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

export const getHeaders = () => {
  const token = localStorage.getItem("petplus_token");
  
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};