// src/api/milestones.js
// API functions for Project Milestones and Tasks.

import api from './axios';

/** Get all milestones, optionally filtered by project. */
export const getMilestones = (projectId) => {
  const params = projectId ? { project: projectId } : {};
  return api.get('/milestones/', { params });
};

/** Create a new milestone. */
export const createMilestone = (data) => api.post('/milestones/', data);

/** Update a milestone. */
export const updateMilestone = (id, data) => api.patch(`/milestones/${id}/`, data);

/** Get all tasks for a specific milestone. */
export const getTasks = (milestoneId) =>
  api.get('/tasks/', { params: { milestone: milestoneId } });

/** Update a task (e.g., mark it as complete). */
export const updateTask = (id, data) => api.patch(`/tasks/${id}/`, data);

/** Create a new task. */
export const createTask = (data) => api.post('/tasks/', data);
