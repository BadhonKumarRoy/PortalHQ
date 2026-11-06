// src/api/communication.js
// API functions for Announcements, Meeting Records, and Notifications.

import api from './axios';

// ---- Announcements ----
/** Get all announcements. */
export const getAnnouncements = () => api.get('/communication/announcements/');

/** Create a new announcement. */
export const createAnnouncement = (data) =>
  api.post('/communication/announcements/', data);

// ---- Meeting Records ----
/** Get all meeting records. */
export const getMeetings = () => api.get('/communication/meetings/');

/** Create a new meeting record. */
export const createMeeting = (data) =>
  api.post('/communication/meetings/', data);

// ---- Notifications ----
/** Get all notifications for the logged-in user. */
export const getNotifications = () => api.get('/communication/notifications/');

/** Mark a specific notification as read. */
export const markNotificationRead = (id) =>
  api.patch(`/communication/notifications/${id}/`, { is_read: true });

/** Mark ALL notifications as read. */
export const markAllNotificationsRead = () =>
  api.post('/communication/notifications/mark-all-read/');
