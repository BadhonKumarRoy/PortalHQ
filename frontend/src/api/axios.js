// src/api/axios.js
// This file sets up Axios — the tool we use to call our backend API.
// It automatically adds the user's login token to every request.

import axios from 'axios';

// Create a custom Axios instance with our API's base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
});

// ---- REQUEST INTERCEPTOR ----
// Before every request, attach the JWT token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- RESPONSE INTERCEPTOR ----
// If the server returns 401 (token expired), try to refresh the token
api.interceptors.response.use(
  (response) => response, // If response is fine, just return it
  async (error) => {
    if (error.response?.status === 401) {
      // Try to get a new access token using the refresh token
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/token/refresh/`,
            { refresh: refreshToken }
          );
          // Save the new access token
          localStorage.setItem('access_token', res.data.access);
          // Retry the original request with the new token
          error.config.headers.Authorization = `Bearer ${res.data.access}`;
          return api(error.config);
        } catch {
          // Refresh failed — log the user out and redirect to login
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
