// src/pages/employee/tasks/MyTasks.jsx
// Employee / Staff - Task Management & Interactive Checklists
// Allows staff to track and mark tasks as complete across their assigned projects.

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getTasks, updateTask, getMilestones, createTask } from '../../../api/milestones';
import { getProjects } from '../../../api/projects';

import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

import {
  CheckSquare,
  CheckCircle2,
  Circle,
  Plus,
  Search,
  Calendar,
  FolderOpen,
  Filter,
  Layers,
  AlertCircle,
} from 'lucide-react';

const STATUS_FILTERS = ['All', 'Pending', 'Completed'];

export default function MyTasks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectParam = searchParams.get('project');

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [milestones, setMilestones] = useState([]);

  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedProject, setSelectedProject] = useState(projectParam || '');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Task Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    milestone: '',
    title: '',
    due_date: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, projRes, mileRes] = await Promise.allSettled([
        getTasks(),
        getProjects(),
        getMilestones(),
      ]);

      if (tasksRes.status === 'fulfilled') {
        const tData = Array.isArray(tasksRes.value.data)
          ? tasksRes.value.data
          : tasksRes.value.data?.results || [];
        setTasks(tData);
      }

      if (projRes.status === 'fulfilled') {
        const pData = Array.isArray(projRes.value.data)
          ? projRes.value.data
          : projRes.value.data?.results || [];
        setProjects(pData);
      }

      if (mileRes.status === 'fulfilled') {
        const mData = Array.isArray(mileRes.value.data)
          ? mileRes.value.data
          : mileRes.value.data?.results || [];
        setMilestones(mData);
      }
    } catch (err) {
      console.error('Failed to load tasks data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sync state if URL search param changes
  useEffect(() => {
    if (projectParam) {
      setSelectedProject(projectParam);
    }
  }, [projectParam]);

  // Toggle task completion
  const handleToggleTask = async (task) => {
    const nextStatus = !task.is_done;
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, is_done: nextStatus } : t))
    );

    try {
      await updateTask(task.id, { is_done: nextStatus });
      toast.success(nextStatus ? 'Task completed!' : 'Task reopened.');
    } catch (err) {
      console.error('Failed to toggle task:', err);
      toast.error('Failed to update task.');
      // Revert on error
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, is_done: task.is_done } : t))
      );
    }
  };

  // Create new task under milestone
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.milestone) {
      toast.error('Please select a milestone.');
      return;
    }
    if (!taskForm.title.trim()) {
      toast.error('Task title is required.');
      return;
    }

    setSubmitting(true);
    try {
      await createTask({
        milestone: Number(taskForm.milestone),
        title: taskForm.title.trim(),
        due_date: taskForm.due_date || null,
        is_done: false,
      });
      toast.success('Task created successfully!');
      setAddModalOpen(false);
      setTaskForm({ milestone: '', title: '', due_date: '' });
      fetchData();
    } catch (err) {
      console.error('Error creating task:', err);
      toast.error('Failed to create task.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'Pending'
        ? !t.is_done
        : t.is_done;

    const matchesProject =
      !selectedProject || String(t.project_id) === String(selectedProject);

    const matchesSearch =
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.milestone_title && t.milestone_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.project_title && t.project_title.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesProject && matchesSearch;
  });

  const pendingCount = tasks.filter((t) => !t.is_done).length;
  const completedCount = tasks.filter((t) => t.is_done).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Tasks & Checklists"
        subtitle="Manage and check off deliverable work items for your assigned milestones."
        action={
          <Button
            variant="primary"
            icon={Plus}
            className="!bg-[#121358] hover:!bg-[#2F578A]"
            onClick={() => setAddModalOpen(true)}
          >
            Add Task
          </Button>
        }
      />

      {/* Filter and Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        {/* Status Filters */}
        <div className="flex gap-1">
          {STATUS_FILTERS.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                statusFilter === tab
                  ? 'bg-[#121358] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab === 'All'
                ? `All Tasks (${tasks.length})`
                : tab === 'Pending'
                ? `Pending (${pendingCount})`
                : `Completed (${completedCount})`}
            </button>
          ))}
        </div>

        {/* Project Selector & Search */}
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selectedProject}
            onChange={(e) => {
              setSelectedProject(e.target.value);
              if (e.target.value) {
                setSearchParams({ project: e.target.value });
              } else {
                setSearchParams({});
              }
            }}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          <div className="relative w-full sm:w-56">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
          <CheckSquare className="mx-auto text-slate-300 mb-3" size={44} />
          <h3 className="text-base font-semibold text-slate-700">No Tasks Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery || selectedProject
              ? 'No tasks match your selected filter criteria.'
              : 'You have no tasks assigned right now.'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={() => setAddModalOpen(true)}
          >
            Create Task
          </Button>
        </div>
      ) : (
        <Card className="divide-y divide-slate-100 overflow-hidden">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => handleToggleTask(task)}
              className={`p-4 flex items-center justify-between gap-3 cursor-pointer select-none transition ${
                task.is_done
                  ? 'bg-slate-50/60 hover:bg-slate-100/60 text-slate-400'
                  : 'hover:bg-blue-50/30 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0 pr-2">
                <button
                  type="button"
                  className="shrink-0 focus:outline-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleTask(task);
                  }}
                >
                  {task.is_done ? (
                    <CheckCircle2 size={20} className="text-emerald-500" />
                  ) : (
                    <Circle size={20} className="text-slate-300 hover:text-blue-500 transition" />
                  )}
                </button>

                <div className="min-w-0">
                  <p
                    className={`text-sm font-semibold truncate ${
                      task.is_done ? 'line-through text-slate-400' : 'text-slate-800'
                    }`}
                  >
                    {task.title}
                  </p>

                  <div className="flex items-center gap-2.5 mt-1 text-xs text-slate-400 flex-wrap">
                    {task.project_title && (
                      <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        <FolderOpen size={11} /> {task.project_title}
                      </span>
                    )}
                    {task.milestone_title && (
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <Layers size={11} /> {task.milestone_title}
                      </span>
                    )}
                    {task.assigned_to_name && (
                      <span>• Assigned: {task.assigned_to_name}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 text-xs">
                {task.due_date && (
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <Calendar size={13} /> {new Date(task.due_date).toLocaleDateString()}
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    task.is_done
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {task.is_done ? 'Done' : 'In Progress'}
                </span>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Add Task Modal */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Task to Milestone"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Select Milestone <span className="text-red-500">*</span>
            </label>
            <select
              value={taskForm.milestone}
              onChange={(e) => setTaskForm({ ...taskForm, milestone: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              required
            >
              <option value="">Select a milestone...</option>
              {milestones.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.project_title ? `[${m.project_title}] ` : ''}
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Task Description / Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Build login screen frontend UI"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Due Date (Optional)
            </label>
            <input
              type="date"
              value={taskForm.due_date}
              onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
              className="!bg-[#121358]"
            >
              Create Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
