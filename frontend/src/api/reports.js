// src/api/reports.js
// API functions for the Reports, Business Intelligence & Audit Log module.

import api from './axios';

/**
 * Get comprehensive analytics for the Executive Reports dashboard.
 * Returns portfolio summaries, project health, ticket SLA distributions, and recent audits.
 */
export const getAnalytics = () => api.get('/reports/analytics/');

/**
 * Get the audit log list with optional filtering and search params.
 * e.g. { action: 'LOGIN', search: 'Badhon' }
 */
export const getAuditLogs = (params) => api.get('/reports/audit-logs/', { params });

/**
 * Export report as CSV file download (projects, tickets, clients, or audit).
 */
export const exportReportCsv = (type = 'projects') =>
  api.get('/reports/export/', {
    params: { type },
    responseType: 'blob',
  });

/** Legacy support */
export const getReports = () => api.get('/reports/');
export const generateReport = (type, params) =>
  api.get(`/reports/${type}/`, { params });
