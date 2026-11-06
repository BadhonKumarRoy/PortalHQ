// src/api/approvals.js
// API functions for the Document Approval workflow.

import api from './axios';

/** Get all approval requests. */
export const getApprovals = (params) => api.get('/approvals/', { params });

/** Get a single approval request by ID. */
export const getApproval = (id) => api.get(`/approvals/${id}/`);

/** Review an approval — approve or reject it with optional comments. */
export const reviewApproval = (id, status, comments) =>
  api.patch(`/approvals/${id}/review/`, { status, comments });
