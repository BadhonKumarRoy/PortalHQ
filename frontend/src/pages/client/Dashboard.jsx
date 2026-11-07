// src/pages/client/Dashboard.jsx
// Client Portal Dashboard
// Displays live overview of client's projects, milestones roadmap, and support tickets.

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getProjects } from '../../api/projects';
import { getMilestones } from '../../api/milestones';
import { getTickets } from '../../api/tickets';

import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

import {
  FolderOpen,
  CheckSquare,
  Ticket,
  Building2,
  Calendar,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Plus,
  ExternalLink,
} from 'lucide-react';

export default function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [tickets, setTickets] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [projRes, mileRes, tickRes] = await Promise.allSettled([
        getProjects(),
        getMilestones(),
        getTickets(),
      ]);

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

      if (tickRes.status === 'fulfilled') {
        const tData = Array.isArray(tickRes.value.data)
          ? tickRes.value.data
          : tickRes.value.data?.results || [];
        setTickets(tData);
      }
    } catch (err) {
      console.error('Failed to load client dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived statistics
  const activeProjects = projects.filter((p) => p.status !== 'COMPLETED');
  const completedMilestones = milestones.filter((m) => m.is_completed);
  const milestonePercent = milestones.length
    ? Math.round((completedMilestones.length / milestones.length) * 100)
    : 0;
  const openTickets = tickets.filter(
    (t) => t.status !== 'CLOSED' && t.status !== 'RESOLVED'
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const companyName = user?.company_name || 'Client Portal';

  return (
    <div className="space-y-6">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#121358] to-[#2F578A] text-white p-6 rounded-2xl shadow-card">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-emerald-300 mb-2">
            <Building2 size={13} />
            <span>{companyName}</span>
          </div>
          <h1 className="text-2xl font-bold">
            Welcome back, {user?.full_name || 'Client'}
          </h1>
          <p className="text-sm text-white/80 mt-1">
            Track your company projects, milestone deliverables, and support requests in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            className="!bg-white !text-slate-800 hover:!bg-slate-100 border-none shadow"
            icon={Plus}
            onClick={() => navigate('/client/tickets/new')}
          >
            New Support Request
          </Button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Projects"
          value={activeProjects.length}
          icon={FolderOpen}
          color="#2F578A"
          change={`${projects.length} Total Projects`}
        />
        <StatCard
          title="Milestone Deliverables"
          value={`${completedMilestones.length}/${milestones.length}`}
          icon={CheckSquare}
          color="#36ADA3"
          change={`${milestonePercent}% completed`}
        />
        <StatCard
          title="Open Support Tickets"
          value={openTickets.length}
          icon={Ticket}
          color="#E47B24"
          change={openTickets.length > 0 ? 'Requires attention' : 'All resolved'}
        />
        <StatCard
          title="Company Account"
          value={companyName}
          icon={Building2}
          color="#121358"
          change="Client Portal Access"
        />
      </div>

      {/* Main Content Grid: Left Column (2/3) + Right Column (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Projects & Milestones Roadmap */}
        <div className="lg:col-span-2 space-y-6">
          {/* Projects Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Your Projects</h2>
                <p className="text-xs text-slate-500">
                  Active contracts and progress schedules for {companyName}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-blue-600 hover:text-blue-800"
                onClick={() => navigate('/client/projects')}
              >
                View All <ArrowRight size={13} className="ml-1 inline" />
              </Button>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-12 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <FolderOpen className="mx-auto text-slate-300 mb-3" size={40} />
                <h3 className="text-sm font-semibold text-slate-700">No Projects Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  There are no projects assigned to your company account yet. Your project manager will assign them shortly.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((proj) => {
                  // Calculate project-specific milestones
                  const projMilestones = milestones.filter(
                    (m) => m.project === proj.id
                  );
                  const projDone = projMilestones.filter((m) => m.is_completed).length;
                  const projPercent = projMilestones.length
                    ? Math.round((projDone / projMilestones.length) * 100)
                    : 0;

                  return (
                    <div
                      key={proj.id}
                      className="group border border-slate-200 hover:border-blue-400 bg-white hover:bg-slate-50/50 rounded-xl p-4 transition-all duration-200 cursor-pointer shadow-sm hover:shadow"
                      onClick={() => navigate(`/client/projects/${proj.id}`)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                              {proj.title}
                            </h3>
                            <Badge status={proj.status} />
                          </div>
                          {proj.description && (
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                              {proj.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-semibold text-blue-600 group-hover:underline inline-flex items-center">
                            Inspect Milestones <ArrowRight size={13} className="ml-1" />
                          </span>
                        </div>
                      </div>

                      {/* Project Meta and Progress */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <Calendar size={13} className="text-slate-400" />
                          <span>
                            {proj.start_date
                              ? new Date(proj.start_date).toLocaleDateString()
                              : 'No start date'}{' '}
                            —{' '}
                            {proj.end_date
                              ? new Date(proj.end_date).toLocaleDateString()
                              : 'Ongoing'}
                          </span>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-slate-600">
                              Milestone Progress
                            </span>
                            <span className="font-bold text-slate-800">
                              {projDone}/{projMilestones.length} ({projPercent}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${projPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Deliverables & Milestones Roadmap Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Deliverables & Milestones Roadmap
                </h2>
                <p className="text-xs text-slate-500">
                  Track delivery deadlines and completed project targets
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {completedMilestones.length} of {milestones.length} Done
              </span>
            </div>

            {milestones.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No milestone deliverables recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {milestones.map((m) => (
                  <div key={m.id} className="py-3.5 flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {m.is_completed ? (
                        <CheckCircle2 size={18} className="text-emerald-500" />
                      ) : (
                        <Clock size={18} className="text-blue-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className={`text-sm font-semibold ${
                            m.is_completed
                              ? 'text-slate-600 line-through'
                              : 'text-slate-800'
                          }`}
                        >
                          {m.title}
                        </h4>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            m.is_completed
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {m.is_completed ? 'Completed' : 'In Progress'}
                        </span>
                      </div>

                      {m.description && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {m.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        {m.project_title && (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                            <FolderOpen size={12} /> {m.project_title}
                          </span>
                        )}
                        {m.due_date && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={12} /> Target:{' '}
                            {new Date(m.due_date).toLocaleDateString()}
                          </span>
                        )}
                        {Array.isArray(m.tasks) && m.tasks.length > 0 && (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                            <CheckSquare size={12} /> {m.tasks.filter((t) => t.is_done).length}/
                            {m.tasks.length} Tasks Finished
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Quick Links & Support */}
        <div className="space-y-6">
          {/* Quick Shortcuts */}
          <Card className="p-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3">
              Portal Shortcuts
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/client/projects')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <FolderOpen size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">My Projects</p>
                    <p className="text-xs text-slate-500">View roadmaps & timelines</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </button>

              <button
                onClick={() => navigate('/client/documents')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/50 text-left transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <FileText size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Shared Documents</p>
                    <p className="text-xs text-slate-500">Contracts, invoices & assets</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </button>

              <button
                onClick={() => navigate('/client/approvals')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-purple-300 hover:bg-purple-50/50 text-left transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                    <CheckSquare size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Pending Approvals</p>
                    <p className="text-xs text-slate-500">Sign off on deliverables</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </button>

              <button
                onClick={() => navigate('/client/tickets')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-amber-300 hover:bg-amber-50/50 text-left transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Ticket size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Support Tickets</p>
                    <p className="text-xs text-slate-500">Ask questions or report issues</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </button>
            </div>
          </Card>

          {/* Support / Help Card */}
          <Card className="p-6 bg-gradient-to-br from-slate-900 to-[#121358] text-white">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4">
              <Ticket size={20} className="text-amber-400" />
            </div>
            <h3 className="text-base font-bold">Need Help or Project Changes?</h3>
            <p className="text-xs text-white/80 mt-1 leading-relaxed">
              Have questions regarding your deliverable timeline or need a feature change? Submit a support ticket directly to your dedicated agency engineer.
            </p>
            <Button
              variant="secondary"
              className="w-full mt-4 !bg-white !text-slate-900 font-semibold text-xs py-2 hover:!bg-slate-100"
              onClick={() => navigate('/client/tickets/new')}
            >
              Open Support Ticket
            </Button>
          </Card>

          {/* Active Tickets Snippet */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Recent Support Requests
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-blue-600 hover:text-blue-800"
                onClick={() => navigate('/client/tickets')}
              >
                All
              </Button>
            </div>

            {tickets.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No support tickets yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {tickets.slice(0, 3).map((t) => (
                  <div
                    key={t.id}
                    className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 px-2 rounded-lg transition"
                    onClick={() => navigate(`/client/tickets/${t.id}`)}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {t.title}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(t.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge status={t.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
