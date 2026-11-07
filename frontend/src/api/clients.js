// src/api/clients.js
// API functions for managing Clients (companies/contacts your org works with).

import api from './axios';

/** Get all clients. */
export const getClients = () => api.get('/clients/');

/** Get a single client by their ID. */
export const getClient = (id) => api.get(`/clients/${id}/`);

/** Create a new client. */
export const createClient = (data) => api.post('/clients/', data);

/** Update an existing client's information. */
export const updateClient = (id, data) => api.patch(`/clients/${id}/`, data);

/** Delete a client record. */
export const deleteClient = (id) => api.delete(`/clients/${id}/`);

/** Generate or retrieve a client's portal login credentials to copy & share. */
export const getClientPortalAccess = (id, password = null) =>
  api.post(`/clients/${id}/portal-access/`, password ? { password } : {});
