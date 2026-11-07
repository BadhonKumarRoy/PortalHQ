// src/pages/organization/milestones/MilestoneList.jsx
// Milestones & Deliverables Overview across all organization projects.
// Connects to live Django REST endpoints with real milestone and task tracking.

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMilestones, createMilestone, updateMilestone, deleteMilestone } from '../../../api/milestones';
import { getProjects } from '../../../api/projects';
import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Clock, 
  Flag, 
  Trash2, 
  FolderOpen,
  ArrowRight
} from 'lucide-react';

export default function MilestoneList() {
  const navigate = useNavigate();

  const [milestones, setMilestones] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    project: '',
    title: '',
    description: '',
    due_date: '',
  });

  /** Load all milestones and projects from API */
  const fetchData = useCallback(async () => {
    try {
      const [mileRes, projRes] = await Promise.all([
        getMilestones(),
        getProjects(),
      ]);

      const mData = Array.isArray(mileRes.data) ? mileRes.data : mileRes.data?.results || [];
      const pData = Array.isArray(projRes.data) ? projRes.data : projRes.data?.results || [];

      setMilestones(mData);
      setProjects(pData);
    } catch {
      toast.error('Failed to load milestones.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** Toggle milestone completion */
  const handleToggle = async (milestone) => {
    try {
      await updateMilestone(milestone.id, {
        is_completed: !milestone.is_completed,
      });
      toast.success(milestone.is_completed ? 'Milestone marked as pending.' : 'Milestone completed!');
      fetchData();
    } catch {
      toast.error('Failed to update milestone.');
    }
  };

  /** Delete milestone */
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this milestone?')) return;
    try {
      await deleteMilestone(id);
      toast.success('Milestone removed.');
      fetchData();
    } catch {
      toast.error('Failed to delete milestone.');
    }
  };

  /** Create new milestone */
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newMilestone.title || !newMilestone.project) {
      toast.error('Please specify both project and title.');
      return;
    }

    setSubmitting(true);
    try {
      await createMilestone({
        project: newMilestone.project,
        title: newMilestone.title.trim(),
        description: newMilestone.description.trim(),
        due_date: newMilestone.due_date || null,
      });
      toast.success('Milestone created!');
      setAddModalOpen(false);
      setNewMilestone({ project: '', title: '', description: '', due_date: '' });
      fetchData();
    } catch {
      toast.error('Failed to create milestone.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  // Filter milestones by selected project
  const filteredMilestones = selectedProject === 'ALL'
    ? milestones
    : milestones.filter((m) => String(m.project) === String(selectedProject));

  // Compute live statistics
  const totalCount = filteredMilestones.length;
  const completedCount = filteredMilestones.filter((m) => m.is_completed).length;
  const pendingCount = totalCount - completedCount;

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Milestones & Deliverables"
        subtitle="Track major project checkpoints, deliverables, and progress."
        action={
          <Button icon={Plus} onClick={() => setAddModalOpen(true)}>
            Add Milestone
          </Button>
        }
      />

      {/* ── LIVE STATS ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Deliverables</p>
          <h3 className="text-3xl font-extrabold text-slate-800 mt-2">{totalCount}</h3>
          <span className="inline-block mt-2 text-xs text-slate-500">Across active projects</span>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Action</p>
          <h3 className="text-3xl font-extrabold text-amber-600 mt-2">{pendingCount}</h3>
          <span className="inline-block mt-2 text-xs text-amber-600 font-semibold">Requires Completion</span>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Achieved</p>
          <h3 className="text-3xl font-extrabold text-emerald-600 mt-2">{completedCount}</h3>
          <span className="inline-block mt-2 text-xs text-emerald-600 font-semibold">Verified & Delivered</span>
        </Card>
      </div>

      {/* ── PROJECT FILTER SELECTOR ───────────────────────────────────────── */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Filter by Project:</span>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none cursor-pointer text-slate-700"
            >
              <option value="ALL">All Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.client_name || 'Client'})
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-400">
            Showing {filteredMilestones.length} of {milestones.length} milestones
          </span>
        </div>
      </Card>

      {/* ── MILESTONES LIST ───────────────────────────────────────────────── */}
      {filteredMilestones.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Flag size={24} />
          </div>
          <h3 className="text-base font-semibold text-slate-800">No Milestones Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {projects.length === 0
              ? 'You have not created any projects yet. Create a project first to attach milestones to it.'
              : 'Add milestones to break projects down into reviewable phases and client deliverables.'}
          </p>
          <div className="flex justify-center gap-2">
            {projects.length === 0 ? (
              <Button size="sm" icon={FolderOpen} onClick={() => navigate('/organization/projects/new')}>
                Create Project First
              </Button>
            ) : (
              <Button size="sm" icon={Plus} onClick={() => setAddModalOpen(true)}>
                Add Milestone
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredMilestones.map((m) => (
            <Card
              key={m.id}
              className="p-5 border-l-4 hover:shadow-md transition-all"
              style={{ borderLeftColor: m.is_completed ? '#10B981' : '#F59E0B' }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  {/* Completion Toggle */}
                  <button
                    onClick={() => handleToggle(m)}
                    className="mt-0.5 text-slate-400 hover:text-teal-600 transition"
                    title={m.is_completed ? 'Mark as Pending' : 'Mark as Complete'}
                  >
                    {m.is_completed ? (
                      <CheckCircle2 size={22} className="text-emerald-500" />
                    ) : (
                      <Circle size={22} />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-base font-bold ${m.is_completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {m.title}
                      </h4>
                      <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                        {m.project_title || 'Project'}
                      </span>
                    </div>

                    {m.description && (
                      <p className="text-xs text-slate-500 mt-1">{m.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                      {m.due_date && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> Due: {new Date(m.due_date).toLocaleDateString()}
                        </span>
                      )}
                      <span>
                        {m.tasks?.length || 0} subtasks
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={ArrowRight}
                    onClick={() => navigate(`/organization/projects/${m.project}`)}
                  >
                    View Project
                  </Button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete Milestone"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── MODAL: CREATE MILESTONE ───────────────────────────────────────── */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Project Milestone"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Project *</label>
            <select
              value={newMilestone.project}
              onChange={(e) => setNewMilestone({ ...newMilestone, project: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition bg-white outline-none cursor-pointer"
              required
            >
              <option value="">Select a project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.client_name || 'Client'})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Milestone Title *"
            value={newMilestone.title}
            onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
            placeholder="e.g. Design Wireframes & Client Approval"
            required
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Description</label>
            <textarea
              value={newMilestone.description}
              onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
              rows={2}
              placeholder="What deliverables are expected?"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition resize-none"
            />
          </div>

          <Input
            label="Target Due Date"
            type="date"
            value={newMilestone.due_date}
            onChange={(e) => setNewMilestone({ ...newMilestone, due_date: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setAddModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Create Milestone
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
