// src/api/projects.js
// API functions for managing Projects.

import api from './axios';

/** Get all projects (filtered by role on the backend). */
export const getProjects = (params) => api.get('/projects/', { params });

/** Get a single project by ID. */
export const getProject = (id) => api.get(`/projects/${id}/`);

/** Create a new project. */
export const createProject = (data) => api.post('/projects/', data);

/** Update a project. */
export const updateProject = (id, data) => api.patch(`/projects/${id}/`, data);

/** Delete a project. */
export const deleteProject = (id) => api.delete(`/projects/${id}/`);
