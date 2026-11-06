// src/api/reports.js
// API functions for the Reports & Audit Log module.

import api from './axios';

/** Get the audit log — a history of all important actions taken in the system. */
export const getAuditLogs = (params) => api.get('/reports/audit-logs/', { params });

/** Get available system reports. */
export const getReports = () => api.get('/reports/');

/** Generate/download a specific report. */
export const generateReport = (type, params) =>
  api.get(`/reports/${type}/`, { params });
