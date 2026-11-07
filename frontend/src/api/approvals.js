// src/api/approvals.js
// API functions for the Document Approval workflow.

import api from './axios';

/** Get all approval requests. */
export const getApprovals = (params) => api.get('/approvals/', { params });

/** Get a single approval request by ID. */
export const getApproval = (id) => api.get(`/approvals/${id}/`);

/** Create a new approval request. */
export const createApproval = (data) => api.post('/approvals/', data);

/** Review an approval — approve or reject it with optional comments. */
export const reviewApproval = (id, status, comments) =>
  api.post(`/approvals/${id}/review/`, { status, comments });

/** Delete an approval request. */
export const deleteApproval = (id) => api.delete(`/approvals/${id}/`);
