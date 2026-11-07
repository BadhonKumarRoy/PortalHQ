// src/pages/organization/projects/ProjectDetails.jsx
// Project Details & Milestones Tracker
// Connects to live Django endpoints to show real project details, milestones, and tasks.

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject, updateProject } from '../../../api/projects';
import { getMilestones, createMilestone, updateMilestone, deleteMilestone, createTask, updateTask, deleteTask } from '../../../api/milestones';
import PageHeader from '../../../components/ui/PageHeader';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { 
  Building2, 
  Calendar, 
  DollarSign, 
  Plus, 
  CheckCircle2, 
  Circle, 
  CheckSquare, 
  Square, 
  Trash2, 
  ArrowLeft,
  Clock,
  Flag,
  ListTodo
} from 'lucide-react';

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Milestone Modal State
  const [addMilestoneOpen, setAddMilestoneOpen] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    description: '',
    due_date: '',
  });

  // Task Modal State
  const [addTaskModal, setAddTaskModal] = useState({
    open: false,
    milestoneId: null,
    title: '',
  });

  // Action loading state
  const [submitting, setSubmitting] = useState(false);

  /** Load Project & Milestones from the API */
  const fetchData = useCallback(async () => {
    try {
      const [projRes, mileRes] = await Promise.all([
        getProject(id),
        getMilestones(id),
      ]);
      setProject(projRes.data);
      const mData = Array.isArray(mileRes.data) ? mileRes.data : mileRes.data?.results || [];
      setMilestones(mData);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load project details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** Add a new milestone */
  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!milestoneForm.title.trim()) {
      toast.error('Milestone title is required.');
      return;
    }

    setSubmitting(true);
    try {
      await createMilestone({
        project: id,
        title: milestoneForm.title.trim(),
        description: milestoneForm.description.trim(),
        due_date: milestoneForm.due_date || null,
      });
      toast.success('Milestone created!');
      setAddMilestoneOpen(false);
      setMilestoneForm({ title: '', description: '', due_date: '' });
      fetchData();
    } catch {
      toast.error('Failed to create milestone.');
    } finally {
      setSubmitting(false);
    }
  };

  /** Toggle Milestone completion */
  const handleToggleMilestone = async (milestone) => {
    try {
      await updateMilestone(milestone.id, {
        is_completed: !milestone.is_completed,
      });
      toast.success(
        milestone.is_completed ? 'Milestone marked as pending.' : 'Milestone completed!'
      );
      fetchData();
    } catch {
      toast.error('Failed to update milestone.');
    }
  };

  /** Delete a milestone */
  const handleDeleteMilestone = async (milestoneId) => {
    if (!window.confirm('Are you sure you want to delete this milestone and its tasks?')) {
      return;
    }
    try {
      await deleteMilestone(milestoneId);
      toast.success('Milestone deleted.');
      fetchData();
    } catch {
      toast.error('Failed to delete milestone.');
    }
  };

  /** Add a task to a milestone */
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!addTaskModal.title.trim()) {
      toast.error('Task title is required.');
      return;
    }

    setSubmitting(true);
    try {
      await createTask({
        milestone: addTaskModal.milestoneId,
        title: addTaskModal.title.trim(),
      });
      toast.success('Task added!');
      setAddTaskModal({ open: false, milestoneId: null, title: '' });
      fetchData();
    } catch {
      toast.error('Failed to add task.');
    } finally {
      setSubmitting(false);
    }
  };

  /** Toggle task completion */
  const handleToggleTask = async (task) => {
    try {
      await updateTask(task.id, {
        is_done: !task.is_done,
      });
      fetchData();
    } catch {
      toast.error('Failed to update task.');
    }
  };

  /** Delete a task */
  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      toast.success('Task removed.');
      fetchData();
    } catch {
      toast.error('Failed to remove task.');
    }
  };

  /** Change project status */
  const handleStatusChange = async (newStatus) => {
    try {
      await updateProject(id, { status: newStatus });
      toast.success(`Project status updated to ${newStatus}.`);
      setProject((prev) => ({ ...prev, status: newStatus }));
    } catch {
      toast.error('Failed to update status.');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!project) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Project not found.</p>
        <Button className="mt-4" onClick={() => navigate('/organization/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  // Calculate milestone progress
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter((m) => m.is_completed).length;
  const progressPercent =
    totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/organization/projects')}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium mb-2 transition"
          >
            <ArrowLeft size={14} /> Back to Projects
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-800">{project.title}</h1>
            <Badge status={project.status} />
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Client:{' '}
            <button
              onClick={() => navigate(`/organization/clients/${project.client}`)}
              className="text-teal-600 hover:text-teal-700 font-semibold underline"
            >
              {project.client_name || 'Client Company'}
            </button>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Quick Switcher */}
          <select
            value={project.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none cursor-pointer text-slate-700 shadow-sm"
          >
            <option value="PLANNED">Status: Planned</option>
            <option value="ACTIVE">Status: Active</option>
            <option value="IN_PROGRESS">Status: In Progress</option>
            <option value="ON_HOLD">Status: On Hold</option>
            <option value="UNDER_REVIEW">Status: Under Review</option>
            <option value="COMPLETED">Status: Completed</option>
          </select>

          <Button icon={Plus} onClick={() => setAddMilestoneOpen(true)}>
            Add Milestone
          </Button>
        </div>
      </div>

      {/* ── STATS & PROGRESS OVERVIEW ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Building2 size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase">Client</p>
              <h4 className="text-sm font-bold text-slate-800 truncate max-w-[140px]">
                {project.client_name || '—'}
              </h4>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase">Timeline</p>
              <h4 className="text-xs font-semibold text-slate-700 mt-0.5">
                {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'TBD'} &rarr;{' '}
                {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'TBD'}
              </h4>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase">Budget</p>
              <h4 className="text-base font-bold text-slate-800">
                {project.budget ? `$${parseFloat(project.budget).toLocaleString()}` : 'Not set'}
              </h4>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <CheckCircle2 size={20} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-400 font-medium uppercase">Progress</span>
                <span className="font-bold text-slate-800">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── PROJECT DESCRIPTION ────────────────────────────────────────────── */}
      {project.description && (
        <Card className="p-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Project Overview</h3>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {project.description}
          </p>
        </Card>
      )}

      {/* ── MILESTONES & DELIVERABLES CHECKLIST ────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Flag size={20} className="text-teal-600" />
            Milestones & Deliverables ({completedMilestones}/{totalMilestones})
          </h2>
          <Button size="sm" icon={Plus} onClick={() => setAddMilestoneOpen(true)}>
            Add Milestone
          </Button>
        </div>

        {milestones.length === 0 ? (
          <Card className="p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Flag size={24} />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No Milestones Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Break this project down into deliverables (e.g. Design Wireframes, Beta Release, Final Delivery).
            </p>
            <Button size="sm" icon={Plus} onClick={() => setAddMilestoneOpen(true)}>
              Create First Milestone
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {milestones.map((m) => (
              <Card key={m.id} className="p-5 border-l-4" style={{ borderLeftColor: m.is_completed ? '#10B981' : '#F59E0B' }}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Completion Checkbox */}
                    <button
                      onClick={() => handleToggleMilestone(m)}
                      className="mt-0.5 text-slate-400 hover:text-teal-600 transition"
                      title={m.is_completed ? 'Mark as Pending' : 'Mark as Completed'}
                    >
                      {m.is_completed ? (
                        <CheckCircle2 size={22} className="text-emerald-500" />
                      ) : (
                        <Circle size={22} />
                      )}
                    </button>

                    <div>
                      <h4 className={`text-base font-bold ${m.is_completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {m.title}
                      </h4>
                      {m.description && (
                        <p className="text-xs text-slate-500 mt-1">{m.description}</p>
                      )}
                      {m.due_date && (
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-2">
                          <Clock size={12} />
                          <span>Due: {new Date(m.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={Plus}
                      onClick={() => setAddTaskModal({ open: true, milestoneId: m.id, title: '' })}
                    >
                      Add Task
                    </Button>
                    <button
                      onClick={() => handleDeleteMilestone(m.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete Milestone"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Nested Tasks Checklist */}
                {m.tasks && m.tasks.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 pl-8 space-y-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ListTodo size={13} /> Tasks ({m.tasks.filter((t) => t.is_done).length}/{m.tasks.length})
                    </p>
                    {m.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100/80 transition"
                      >
                        <button
                          onClick={() => handleToggleTask(task)}
                          className="flex items-center gap-2.5 text-left flex-1"
                        >
                          {task.is_done ? (
                            <CheckSquare size={16} className="text-emerald-600 shrink-0" />
                          ) : (
                            <Square size={16} className="text-slate-400 shrink-0" />
                          )}
                          <span className={`text-xs font-medium ${task.is_done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                            {task.title}
                          </span>
                        </button>

                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-slate-300 hover:text-red-500 transition p-1"
                          title="Delete Task"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL: ADD MILESTONE ─────────────────────────────────────────── */}
      <Modal
        open={addMilestoneOpen}
        onClose={() => setAddMilestoneOpen(false)}
        title="Add Project Milestone"
      >
        <form onSubmit={handleAddMilestone} className="space-y-4">
          <Input
            label="Milestone Title *"
            value={milestoneForm.title}
            onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
            placeholder="e.g. Design Wireframes & Architecture"
            required
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Description</label>
            <textarea
              value={milestoneForm.description}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
              rows={2}
              placeholder="What deliverables will be completed in this milestone?"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition resize-none"
            />
          </div>

          <Input
            label="Target Due Date"
            type="date"
            value={milestoneForm.due_date}
            onChange={(e) => setMilestoneForm({ ...milestoneForm, due_date: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setAddMilestoneOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Create Milestone
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: ADD TASK ──────────────────────────────────────────────── */}
      <Modal
        open={addTaskModal.open}
        onClose={() => setAddTaskModal({ open: false, milestoneId: null, title: '' })}
        title="Add Task to Milestone"
      >
        <form onSubmit={handleAddTask} className="space-y-4">
          <Input
            label="Task Description *"
            value={addTaskModal.title}
            onChange={(e) => setAddTaskModal({ ...addTaskModal, title: e.target.value })}
            placeholder="e.g. Set up PostgreSQL schema migrations"
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => setAddTaskModal({ open: false, milestoneId: null, title: '' })}
              type="button"
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Add Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
