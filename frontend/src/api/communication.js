// src/api/communication.js
// API functions for Announcements, Meeting Records, and Notifications.

import api from './axios';

// ---- Announcements ----
/** Get all announcements. */
export const getAnnouncements = () => api.get('/communication/announcements/');

/** Create a new announcement. */
export const createAnnouncement = (data) =>
  api.post('/communication/announcements/', data);

/** Update an announcement. */
export const updateAnnouncement = (id, data) =>
  api.patch(`/communication/announcements/${id}/`, data);

/** Delete an announcement. */
export const deleteAnnouncement = (id) =>
  api.delete(`/communication/announcements/${id}/`);


// ---- Meeting Records ----
/** Get all meeting records. */
export const getMeetings = () => api.get('/communication/meetings/');

/** Create a new meeting record. */
export const createMeeting = (data) =>
  api.post('/communication/meetings/', data);

/** Update a meeting record. */
export const updateMeeting = (id, data) =>
  api.patch(`/communication/meetings/${id}/`, data);

/** Delete a meeting record. */
export const deleteMeeting = (id) =>
  api.delete(`/communication/meetings/${id}/`);


// ---- Notifications ----
/** Get all notifications for the logged-in user (or all if admin). */
export const getNotifications = () => api.get('/communication/notifications/');

/** Create a notification (Admin only). */
export const createNotification = (data) =>
  api.post('/communication/notifications/', data);

/** Mark a specific notification as read. */
export const markNotificationRead = (id) =>
  api.post(`/communication/notifications/${id}/mark-read/`);

/** Mark ALL notifications as read. */
export const markAllNotificationsRead = () =>
  api.post('/communication/notifications/mark-all-read/');

/** Delete a notification. */
export const deleteNotification = (id) =>
  api.delete(`/communication/notifications/${id}/`);
