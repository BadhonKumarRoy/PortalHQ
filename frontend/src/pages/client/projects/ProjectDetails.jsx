// src/pages/client/projects/ProjectDetails.jsx
// Client Portal - Project Deliverables & Milestones
// Shows full details of a specific project, its delivery milestones, and task checklists.

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject } from '../../../api/projects';
import { getMilestones } from '../../../api/milestones';

import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

import {
  ArrowLeft,
  Calendar,
  Building2,
  CheckCircle2,
  Circle,
  Clock,
  CheckSquare,
  Ticket,
  FileText,
  Layers,
  User,
} from 'lucide-react';

export default function ClientProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
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
      console.error('Failed to load project details:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800">Project Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          The requested project could not be found or you do not have permission to view it.
        </p>
        <Button variant="primary" onClick={() => navigate('/client/projects')}>
          Back to My Projects
        </Button>
      </div>
    );
  }

  const completedMilestones = milestones.filter((m) => m.is_completed);
  const progressPercent = milestones.length
    ? Math.round((completedMilestones.length / milestones.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/client/projects')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft size={14} /> Back to My Projects
        </button>

        <Button
          variant="secondary"
          size="sm"
          icon={Ticket}
          className="text-xs"
          onClick={() => navigate(`/client/tickets/new?project=${project.id}`)}
        >
          Raise Ticket for This Project
        </Button>
      </div>

      {/* Project Header Banner */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-slate-400 font-mono">
                PROJECT #{project.id}
              </span>
              <Badge status={project.status} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
            {project.description && (
              <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
                {project.description}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 text-xs text-slate-500">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
              <Calendar size={14} className="text-slate-400" />
              <span>
                Start:{' '}
                <strong>
                  {project.start_date
                    ? new Date(project.start_date).toLocaleDateString()
                    : 'TBD'}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
              <Clock size={14} className="text-slate-400" />
              <span>
                Target Completion:{' '}
                <strong>
                  {project.end_date
                    ? new Date(project.end_date).toLocaleDateString()
                    : 'Ongoing'}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Milestone Progress Bar */}
        <div className="pt-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Layers size={14} className="text-slate-400" /> Deliverable Completion Roadmap
            </span>
            <span className="font-bold text-slate-900">
              {completedMilestones.length} of {milestones.length} Milestones Delivered ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Deliverables & Milestones List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Milestone Deliverables & Task Checklists
            </h2>
            <p className="text-xs text-slate-500">
              Review current delivery milestones, acceptance targets, and tasks
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
            {milestones.length} Total Milestones
          </span>
        </div>

        {milestones.length === 0 ? (
          <Card className="p-8 text-center bg-slate-50 border-dashed">
            <Layers className="mx-auto text-slate-300 mb-2" size={36} />
            <h3 className="text-sm font-semibold text-slate-700">No Milestones Added Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Your project manager is currently finalizing the delivery breakdown for this project. Milestones will appear here once published.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {milestones.map((m, index) => {
              const tasks = Array.isArray(m.tasks) ? m.tasks : [];
              const completedTasks = tasks.filter((t) => t.is_done);

              return (
                <Card
                  key={m.id}
                  className={`p-6 border transition-all ${
                    m.is_completed
                      ? 'border-emerald-200 bg-emerald-50/10'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {/* Milestone Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 shrink-0">
                        {m.is_completed ? (
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 size={18} />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                            {index + 1}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={`text-base font-bold ${
                              m.is_completed
                                ? 'text-slate-600 line-through'
                                : 'text-slate-800'
                            }`}
                          >
                            {m.title}
                          </h3>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                              m.is_completed
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {m.is_completed ? 'Completed' : 'In Progress'}
                          </span>
                        </div>

                        {m.description && (
                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                            {m.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {m.due_date && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 shrink-0">
                        <Calendar size={13} className="text-slate-400" />
                        <span>
                          Target:{' '}
                          <strong>
                            {new Date(m.due_date).toLocaleDateString()}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tasks Checklist */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-3 text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <CheckSquare size={13} className="text-slate-400" /> Task Checklist
                      </span>
                      {tasks.length > 0 && (
                        <span className="text-slate-500 font-medium">
                          {completedTasks.length} / {tasks.length} Done
                        </span>
                      )}
                    </div>

                    {tasks.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        No specific sub-tasks listed for this milestone.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {tasks.map((task) => (
                          <div
                            key={task.id}
                            className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition ${
                              task.is_done
                                ? 'bg-emerald-50/40 border-emerald-100 text-slate-500'
                                : 'bg-slate-50 border-slate-100 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {task.is_done ? (
                                <CheckCircle2
                                  size={16}
                                  className="text-emerald-500 shrink-0"
                                />
                              ) : (
                                <Circle
                                  size={16}
                                  className="text-slate-300 shrink-0"
                                />
                              )}
                              <span
                                className={`font-medium ${
                                  task.is_done ? 'line-through text-slate-400' : ''
                                }`}
                              >
                                {task.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-slate-400">
                              {task.assigned_to_name && (
                                <span className="inline-flex items-center gap-1">
                                  <User size={11} /> {task.assigned_to_name}
                                </span>
                              )}
                              {task.due_date && (
                                <span>
                                  {new Date(task.due_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Support CTA Footer Card */}
      <Card className="p-6 bg-gradient-to-r from-slate-900 to-[#121358] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold">Have Questions About This Project?</h3>
          <p className="text-xs text-white/80 mt-1">
            Need revisions or want to request a status call with the engineering team? Open a ticket directly.
          </p>
        </div>
        <Button
          variant="secondary"
          className="!bg-white !text-slate-900 font-semibold text-xs py-2 shrink-0"
          onClick={() => navigate(`/client/tickets/new?project=${project.id}`)}
        >
          Create Support Ticket
        </Button>
      </Card>
    </div>
  );
}
