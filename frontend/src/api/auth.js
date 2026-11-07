// src/api/auth.js
// Authentication API calls: login, logout, and user management.
// These functions talk to the Django backend's /auth/ endpoints.

import api from './axios';

/** Log in with email + password. Returns access/refresh tokens and user info. */
export const login = (email, password) =>
  api.post('/auth/login/', { email, password });

/** Log out by invalidating the refresh token on the server. */
export const logout = (refreshToken) =>
  api.post('/auth/logout/', { refresh: refreshToken });

/** Get the currently logged-in user's profile. */
export const getMe = () => api.get('/auth/me/');

/** Get a list of all users (Admin only). */
export const getUsers = () => api.get('/auth/users/');

/** Create a new user account (Admin only). */
export const createUser = (data) => api.post('/auth/users/', data);

/** Update an existing user's information or role (Admin only). */
export const updateUser = (id, data) => api.patch(`/auth/users/${id}/`, data);

/** Delete a user account (Admin only). */
export const deleteUser = (id) => api.delete(`/auth/users/${id}/`);

/** Reset a user's password and get temporary credentials (Admin only). */
export const resetUserPassword = (id, password = null) =>
  api.post(`/auth/users/${id}/reset-password/`, password ? { password } : {});
