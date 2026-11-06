// src/api/documents.js
// API functions for managing Documents (upload, download, delete).

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

/** Delete a document. */
export const deleteDocument = (id) => api.delete(`/documents/${id}/`);
