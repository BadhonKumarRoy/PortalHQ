// src/api/inventory.js
// API functions for the Inventory Management module.

import api from './axios';

// ---- Inventory Items ----
/** Get all inventory items. */
export const getItems = (params) => api.get('/inventory/items/', { params });

/** Create a new inventory item. */
export const createItem = (data) => api.post('/inventory/items/', data);

/** Update an inventory item. */
export const updateItem = (id, data) => api.patch(`/inventory/items/${id}/`, data);

// ---- Stock Movements ----
/** Get all stock movements. */
export const getMovements = (params) =>
  api.get('/inventory/movements/', { params });

/** Record a new stock movement. */
export const createMovement = (data) => api.post('/inventory/movements/', data);

// ---- Suppliers ----
/** Get all suppliers. */
export const getSuppliers = () => api.get('/inventory/suppliers/');

/** Create a new supplier. */
export const createSupplier = (data) => api.post('/inventory/suppliers/', data);
