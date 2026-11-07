// src/pages/employee/Dashboard.jsx
// Employee / Staff Operations Dashboard
// Scoped to the logged-in staff member: assigned projects, interactive task checklists,
// support ticket queue, and organization notices.

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getProjects } from '../../api/projects';
import { getTasks, updateTask } from '../../api/milestones';
import { getTickets } from '../../api/tickets';
import { getAnnouncements } from '../../api/communication';

import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

import {
  FolderOpen,
  CheckSquare,
  Ticket,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Circle,
  Megaphone,
  Briefcase,
  Clock,
  User,
} from 'lucide-react';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // Load employee data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [projRes, tasksRes, tickRes, annRes] = await Promise.allSettled([
        getProjects(),
        getTasks(),
        getTickets(),
        getAnnouncements(),
      ]);

      if (projRes.status === 'fulfilled') {
        const pData = Array.isArray(projRes.value.data)
          ? projRes.value.data
          : projRes.value.data?.results || [];
        setProjects(pData);
      }

      if (tasksRes.status === 'fulfilled') {
        const tData = Array.isArray(tasksRes.value.data)
          ? tasksRes.value.data
          : tasksRes.value.data?.results || [];
        setTasks(tData);
      }

      if (tickRes.status === 'fulfilled') {
        const tkData = Array.isArray(tickRes.value.data)
          ? tickRes.value.data
          : tickRes.value.data?.results || [];
        setTickets(tkData);
      }

      if (annRes.status === 'fulfilled') {
        const aData = Array.isArray(annRes.value.data)
          ? annRes.value.data
          : annRes.value.data?.results || [];
        setAnnouncements(aData);
      }
    } catch (err) {
      console.error('Failed to load employee dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Quick toggle task completion directly from dashboard
  const handleToggleTask = async (task) => {
    const updatedStatus = !task.is_done;
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, is_done: updatedStatus } : t))
    );

    try {
      await updateTask(task.id, { is_done: updatedStatus });
      toast.success(updatedStatus ? 'Task completed! 🎉' : 'Task marked as pending.');
    } catch (err) {
      console.error('Failed to update task:', err);
      toast.error('Failed to update task.');
      // Revert on error
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, is_done: task.is_done } : t))
      );
    }
  };

  const pendingTasks = tasks.filter((t) => !t.is_done);
  const openTickets = tickets.filter(
    (t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED'
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#121358] to-[#2F578A] text-white p-6 rounded-2xl shadow-card">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-emerald-300 mb-2">
            <Briefcase size={13} />
            <span>Staff Member • Delivery Scoped</span>
          </div>
          <h1 className="text-2xl font-bold">
            {greeting}, {user?.full_name?.split(' ')?.[0] || 'Team Member'}!
          </h1>
          <p className="text-sm text-white/80 mt-1">
            You have {pendingTasks.length} pending tasks and {openTickets.length} open tickets assigned to your queue today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            className="!bg-white !text-slate-900 hover:!bg-slate-100 font-semibold text-xs border-none shadow"
            icon={CheckSquare}
            onClick={() => navigate('/employee/tasks')}
          >
            My Task Board
          </Button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Projects"
          value={projects.length}
          icon={FolderOpen}
          color="#2F578A"
          change="Active Client Workstreams"
        />
        <StatCard
          title="Tasks to Complete"
          value={pendingTasks.length}
          icon={CheckSquare}
          color="#36ADA3"
          change={`${tasks.length - pendingTasks.length} Finished`}
        />
        <StatCard
          title="Active Support Queue"
          value={openTickets.length}
          icon={Ticket}
          color="#f59e0b"
          change="Pending Resolution"
        />
        <StatCard
          title="Operations & Staff"
          value="Operational"
          icon={Briefcase}
          color="#121358"
          change={user?.email || 'Logged In'}
        />
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Projects & Task Checklist */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assigned Projects */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">My Assigned Projects</h2>
                <p className="text-xs text-slate-500">
                  Projects and client engagements you are currently staffed on
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-blue-600 hover:text-blue-800"
                onClick={() => navigate('/employee/projects')}
              >
                View All <ArrowRight size={13} className="ml-1 inline" />
              </Button>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <FolderOpen className="mx-auto text-slate-300 mb-2" size={36} />
                <h3 className="text-sm font-semibold text-slate-700">No Assigned Projects</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your project manager has not assigned you to any client projects yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-slate-50/50 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    onClick={() => navigate(`/employee/tasks?project=${p.id}`)}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-slate-800">{p.title}</h4>
                        <Badge status={p.status} />
                      </div>
                      <p className="text-xs text-slate-500">
                        Client: <strong>{p.client_name || 'Organization Client'}</strong>
                        {p.end_date && ` • Target Delivery: ${new Date(p.end_date).toLocaleDateString()}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/employee/tasks?project=${p.id}`);
                        }}
                      >
                        Tasks & Checklists
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Interactive Tasks Checklist */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Deliverable Tasks & Milestones
                </h2>
                <p className="text-xs text-slate-500">
                  Click a checkbox to mark tasks as completed
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                {pendingTasks.length} Pending
              </span>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No tasks assigned to your projects currently.
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.slice(0, 6).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition select-none ${
                      task.is_done
                        ? 'bg-emerald-50/30 border-emerald-100 text-slate-400'
                        : 'bg-white border-slate-200 hover:border-blue-400 text-slate-800 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      {task.is_done ? (
                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                      ) : (
                        <Circle size={18} className="text-slate-300 hover:text-blue-500 shrink-0" />
                      )}
                      <span
                        className={`font-semibold truncate ${
                          task.is_done ? 'line-through text-slate-400' : 'text-slate-800'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-400 shrink-0">
                      {task.project_title && (
                        <span className="font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {task.project_title}
                        </span>
                      )}
                      {task.due_date && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={12} /> {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Support Queue & Announcements */}
        <div className="space-y-6">
          {/* Support Ticket Queue */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Support Queue
                </h3>
                <p className="text-xs text-slate-400">Tickets awaiting response</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-blue-600"
                onClick={() => navigate('/employee/tickets')}
              >
                View All
              </Button>
            </div>

            {openTickets.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                Support queue is clear! All tickets are addressed.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {openTickets.slice(0, 4).map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => navigate('/employee/tickets')}
                    className="py-3 flex flex-col gap-1 cursor-pointer hover:bg-slate-50 px-2 rounded-lg transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {ticket.title}
                      </span>
                      <Badge status={ticket.status} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{ticket.client_name || 'Client'}</span>
                      <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Staff Navigation Links */}
          <Card className="p-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3">
              Staff Shortcuts
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/employee/projects')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 text-left transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <FolderOpen size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">My Projects</p>
                    <p className="text-xs text-slate-500">Delivery roadmaps</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </button>

              <button
                onClick={() => navigate('/employee/tasks')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/50 text-left transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CheckSquare size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Task Board</p>
                    <p className="text-xs text-slate-500">Check off deliverables</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </button>

              <button
                onClick={() => navigate('/employee/documents')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-purple-300 hover:bg-purple-50/50 text-left transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Briefcase size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Documents & Uploads</p>
                    <p className="text-xs text-slate-500">Upload deliverables</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </button>

              <button
                onClick={() => navigate('/employee/operations')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-amber-300 hover:bg-amber-50/50 text-left transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Operations & Meetings</p>
                    <p className="text-xs text-slate-500">Status calls & assets</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </button>
            </div>
          </Card>

          {/* Announcements Notice */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Megaphone size={16} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Staff Notices
              </h3>
            </div>
            {announcements.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No current staff notices.</p>
            ) : (
              <div className="space-y-3">
                {announcements.slice(0, 2).map((a) => (
                  <div key={a.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 mb-1">{a.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2">{a.content}</p>
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
