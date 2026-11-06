// src/api/tickets.js
// API functions for Support Tickets and their comments.

import api from './axios';

/** Get all support tickets. */
export const getTickets = (params) => api.get('/tickets/', { params });

/** Get a single ticket by ID. */
export const getTicket = (id) => api.get(`/tickets/${id}/`);

/** Create a new support ticket. */
export const createTicket = (data) => api.post('/tickets/', data);

/** Update a ticket (e.g., change status or assignee). */
export const updateTicket = (id, data) => api.patch(`/tickets/${id}/`, data);

/** Get all comments for a specific ticket. */
export const getTicketComments = (ticketId) =>
  api.get(`/tickets/${ticketId}/comments/`);

/** Add a comment to a ticket. */
export const addComment = (ticketId, content) =>
  api.post(`/tickets/${ticketId}/comments/`, { content });
