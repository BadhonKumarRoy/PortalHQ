// src/api/documents.js
// API functions for managing Documents (upload, download, delete, and 1-click sharing).

import api from './axios';

/** Get all documents the user has access to. */
export const getDocuments = (params) => api.get('/documents/', { params });

/** Upload a new document. Uses FormData for file upload. */
export const uploadDocument = (formData) =>
  api.post('/documents/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

/** Get a single document's details. */
export const getDocument = (id) => api.get(`/documents/${id}/`);

/** Update document metadata or client sharing. */
export const updateDocument = (id, data) => api.patch(`/documents/${id}/`, data);

/** Toggle document client visibility on/off with 1 click. */
export const toggleShareDocument = (id) => api.post(`/documents/${id}/toggle-share/`);

/** Delete a document. */
export const deleteDocument = (id) => api.delete(`/documents/${id}/`);

/**
 * Helper to ensure document download URLs route to the backend domain in production.
 * If the URL is relative (e.g. /media/...), prepends the backend origin.
 */
export function getFileUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const backendBase = (import.meta.env.VITE_API_URL || 'https://portalhq.onrender.com/api').replace(/\/api\/?$/, '');
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
}
