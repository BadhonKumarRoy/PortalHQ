// src/api/milestones.js
// API functions for Project Milestones and Tasks.

import api from './axios';

/** Get all milestones, optionally filtered by project ID. */
export const getMilestones = (projectId) => {
  const params = projectId ? { project: projectId } : {};
  return api.get('/milestones/', { params });
};

/** Create a new milestone for a project. */
export const createMilestone = (data) => api.post('/milestones/', data);

/** Update a milestone (e.g. toggle completion or edit title). */
export const updateMilestone = (id, data) => api.patch(`/milestones/${id}/`, data);

/** Delete a milestone. */
export const deleteMilestone = (id) => api.delete(`/milestones/${id}/`);

/** Get all tasks for a specific milestone. */
export const getTasks = (milestoneId) =>
  api.get('/tasks/', { params: { milestone: milestoneId } });

/** Update a task (e.g., mark it as complete). */
export const updateTask = (id, data) => api.patch(`/tasks/${id}/`, data);

/** Create a new task within a milestone. */
export const createTask = (data) => api.post('/tasks/', data);

/** Delete a task. */
export const deleteTask = (id) => api.delete(`/tasks/${id}/`);
