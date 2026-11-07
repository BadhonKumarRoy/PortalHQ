// src/pages/organization/projects/ProjectDetails.jsx
// Project Details & Milestones Tracker
// Connects to live Django endpoints to show real project details, milestones, tasks, and assigned team.

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject, updateProject } from '../../../api/projects';
import {
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  createTask,
  updateTask,
  deleteTask,
} from '../../../api/milestones';
import { getUsers } from '../../../api/auth';
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
  ListTodo,
  Users,
  UserCheck,
  UserPlus,
} from 'lucide-react';

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Team Modal State
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [allStaff, setAllStaff] = useState([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);

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
      const mData = Array.isArray(mileRes.data)
        ? mileRes.data
        : mileRes.data?.results || [];
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

  // Load all staff for team assignment modal
  useEffect(() => {
    getUsers()
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setAllStaff(data.filter((u) => u.role === 'EMPLOYEE' || u.role === 'ADMIN'));
      })
      .catch(() => {});
  }, []);

  const openManageTeam = () => {
    setSelectedStaffIds(project?.assigned_employees || []);
    setTeamModalOpen(true);
  };

  const toggleStaff = (staffId) => {
    setSelectedStaffIds((prev) =>
      prev.includes(staffId)
        ? prev.filter((id) => id !== staffId)
        : [...prev, staffId]
    );
  };

  const handleSaveTeam = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateProject(id, { assigned_employees: selectedStaffIds });
      toast.success('Project team updated successfully!');
      setTeamModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update project team.');
    } finally {
      setSubmitting(false);
    }
  };

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
    } catch (err) {
      console.error(err);
      toast.error('Failed to create milestone.');
    } finally {
      setSubmitting(false);
    }
  };

  /** Toggle milestone complete/incomplete */
  const handleToggleMilestone = async (milestone) => {
    try {
      await updateMilestone(milestone.id, {
        is_completed: !milestone.is_completed,
      });
      toast.success(
        milestone.is_completed ? 'Milestone re-opened' : 'Milestone marked complete!'
      );
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update milestone.');
    }
  };

  /** Delete a milestone */
  const handleDeleteMilestone = async (milestoneId) => {
    if (!window.confirm('Delete this milestone and all its tasks?')) return;
    try {
      await deleteMilestone(milestoneId);
      toast.success('Milestone deleted.');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete milestone.');
    }
  };

  /** Add a new task to a milestone */
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!addTaskModal.title.trim()) {
      toast.error('Task description is required.');
      return;
    }

    setSubmitting(true);
    try {
      await createTask({
        milestone: addTaskModal.milestoneId,
        title: addTaskModal.title.trim(),
        is_done: false,
      });
      toast.success('Task added!');
      setAddTaskModal({ open: false, milestoneId: null, title: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to create task.');
    } finally {
      setSubmitting(false);
    }
  };

  /** Toggle a task done/not done */
  const handleToggleTask = async (task) => {
    try {
      await updateTask(task.id, {
        is_done: !task.is_done,
      });
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update task.');
    }
  };

  /** Delete a task */
  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      toast.success('Task removed.');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove task.');
    }
  };

  /** Quick status changer for project */
  const handleStatusChange = async (newStatus) => {
    try {
      await updateProject(id, { status: newStatus });
      toast.success(`Project status changed to ${newStatus}`);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-24">
        <h2 className="text-xl font-bold text-slate-700">Project Not Found</h2>
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
            <option value="CANCELLED">Status: Cancelled</option>
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
                {project.start_date
                  ? new Date(project.start_date).toLocaleDateString()
                  : 'TBD'}{' '}
                &rarr;{' '}
                {project.end_date
                  ? new Date(project.end_date).toLocaleDateString()
                  : 'TBD'}
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
                {project.budget
                  ? `$${parseFloat(project.budget).toLocaleString()}`
                  : 'Not set'}
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
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Project Overview
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {project.description}
          </p>
        </Card>
      )}

      {/* ── ASSIGNED TEAM / EMPLOYEES (WHO WORKS ON THIS PROJECT) ─────────── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-teal-600" />
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Assigned Team Members ({project.assigned_employees_detail?.length || 0})
            </h3>
          </div>
          <Button size="sm" variant="secondary" icon={UserPlus} onClick={openManageTeam}>
            Manage Team
          </Button>
        </div>

        {!project.assigned_employees_detail ||
        project.assigned_employees_detail.length === 0 ? (
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>
              <strong>No staff assigned yet.</strong> Only Admins can see this project. Assign staff members so they can collaborate on tasks, tickets, and deliverables.
            </span>
            <button
              type="button"
              onClick={openManageTeam}
              className="text-xs font-bold text-amber-900 underline shrink-0 hover:text-amber-950 text-left"
            >
              Assign Staff Now &rarr;
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {project.assigned_employees_detail.map((emp) => (
              <div
                key={emp.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition"
              >
                <div className="w-9 h-9 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  {emp.full_name ? emp.full_name[0].toUpperCase() : 'U'}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {emp.full_name || emp.email}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">{emp.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

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
            {milestones.map((milestone) => (
              <Card key={milestone.id} className="p-5 border-l-4 border-l-teal-500 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleMilestone(milestone)}
                      className="mt-1 text-teal-600 hover:text-teal-800 transition"
                      title={
                        milestone.is_completed
                          ? 'Click to re-open'
                          : 'Click to mark milestone complete'
                      }
                    >
                      {milestone.is_completed ? (
                        <CheckCircle2 size={22} className="text-teal-600" />
                      ) : (
                        <Circle size={22} className="text-slate-300 hover:text-slate-500" />
                      )}
                    </button>
                    <div>
                      <h3
                        className={`text-base font-bold ${
                          milestone.is_completed
                            ? 'line-through text-slate-400'
                            : 'text-slate-800'
                        }`}
                      >
                        {milestone.title}
                      </h3>
                      {milestone.description && (
                        <p className="text-xs text-slate-500 mt-1">
                          {milestone.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                        {milestone.due_date && (
                          <span className="flex items-center gap-1 font-medium text-slate-600">
                            <Clock size={12} /> Target:{' '}
                            {new Date(milestone.due_date).toLocaleDateString()}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <ListTodo size={12} /> {milestone.tasks?.length || 0} tasks
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setAddTaskModal({
                          open: true,
                          milestoneId: milestone.id,
                          title: '',
                        })
                      }
                    >
                      + Task
                    </Button>
                    <button
                      onClick={() => handleDeleteMilestone(milestone.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
                      title="Delete milestone"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* ── TASKS LIST ─────────────────────────────────────────── */}
                {milestone.tasks && milestone.tasks.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    {milestone.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-xs transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => handleToggleTask(task)}
                            className="text-teal-600 hover:text-teal-700 transition"
                          >
                            {task.is_done ? (
                              <CheckSquare size={16} className="text-teal-600" />
                            ) : (
                              <Square size={16} className="text-slate-300 hover:text-slate-400" />
                            )}
                          </button>
                          <span
                            className={
                              task.is_done
                                ? 'line-through text-slate-400 font-medium'
                                : 'text-slate-700 font-medium'
                            }
                          >
                            {task.title}
                          </span>
                        </div>

                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-slate-300 hover:text-red-500 p-1 rounded transition"
                          title="Delete task"
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

      {/* ── MODAL: MANAGE TEAM ────────────────────────────────────────────── */}
      <Modal
        open={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        title="Assign Staff to Project"
      >
        <form onSubmit={handleSaveTeam} className="space-y-4">
          <p className="text-xs text-slate-500">
            Select which staff members will work on <strong>{project.title}</strong>. Assigned staff can view this project in their portal, upload project files, and check off tasks.
          </p>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {allStaff.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No staff users found.</p>
            ) : (
              allStaff.map((staff) => {
                const isAssigned = selectedStaffIds.includes(staff.id);
                return (
                  <button
                    type="button"
                    key={staff.id}
                    onClick={() => toggleStaff(staff.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isAssigned
                        ? 'border-teal-500 bg-teal-50/60 text-teal-900 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          isAssigned
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {staff.full_name ? staff.full_name[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-semibold">
                          {staff.full_name || staff.email}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {staff.email} • {staff.role}
                        </p>
                      </div>
                    </div>
                    {isAssigned && (
                      <span className="text-teal-600 text-xs font-bold flex items-center gap-1">
                        <UserCheck size={14} /> Assigned
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="secondary"
              onClick={() => setTeamModalOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting} className="!bg-[#121358]">
              Save Team Assignments
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: ADD MILESTONE ──────────────────────────────────────────── */}
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
            placeholder="e.g. Design Prototype Review"
            required
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Description (Optional)
            </label>
            <textarea
              value={milestoneForm.description}
              onChange={(e) =>
                setMilestoneForm({ ...milestoneForm, description: e.target.value })
              }
              rows={3}
              placeholder="Describe deliverables and completion criteria..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition resize-none"
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
