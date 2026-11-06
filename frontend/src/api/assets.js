// src/api/assets.js
// API functions for the Asset Management module.

import api from './axios';

/** Get all registered assets. */
export const getAssets = (params) => api.get('/assets/', { params });

/** Get a single asset by ID. */
export const getAsset = (id) => api.get(`/assets/${id}/`);

/** Register a new asset. */
export const createAsset = (data) => api.post('/assets/', data);

/** Update an existing asset (e.g., change status or assignee). */
export const updateAsset = (id, data) => api.patch(`/assets/${id}/`, data);

/** Get the custody history for an asset. */
export const getAssetHistory = (id) => api.get(`/assets/${id}/history/`);
