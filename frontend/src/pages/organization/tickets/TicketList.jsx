// src/pages/organization/tickets/TicketList.jsx
// Organization Admin - Support Ticket Queue
// Manage all customer support tickets across clients, assign engineers, and track resolution.

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTickets, updateTicket, deleteTicket } from '../../../api/tickets';
import { getUsers } from '../../../api/auth';

import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import StatCard from '../../../components/ui/StatCard';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

import {
  Ticket,
  Plus,
  Search,
  MessageSquare,
  Calendar,
  FolderOpen,
  UserCheck,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
} from 'lucide-react';

const STATUS_TABS = ['All', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_CLIENT', 'RESOLVED', 'CLOSED'];

export default function TicketList() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);

  const [activeTab, setActiveTab] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tickRes, usersRes] = await Promise.allSettled([
        getTickets(),
        getUsers(),
      ]);

      if (tickRes.status === 'fulfilled') {
        const tData = Array.isArray(tickRes.value.data)
          ? tickRes.value.data
          : tickRes.value.data?.results || [];
        setTickets(tData);
      }

      if (usersRes.status === 'fulfilled') {
        const uData = Array.isArray(usersRes.value.data)
          ? usersRes.value.data
          : usersRes.value.data?.results || [];
        setStaffUsers(uData.filter((u) => u.role === 'ADMIN' || u.role === 'EMPLOYEE'));
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Quick assign or update status
  const handleQuickUpdate = async (ticketId, patchData) => {
    try {
      await updateTicket(ticketId, patchData);
      toast.success('Ticket updated successfully!');
      fetchData();
    } catch (err) {
      console.error('Update error:', err);
      toast.error('Failed to update ticket.');
    }
  };

  // Delete ticket
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete ticket "${title}"?`)) return;

    try {
      await deleteTicket(id);
      toast.success('Ticket deleted.');
      fetchData();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete ticket.');
    }
  };

  // Filter tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesTab = activeTab === 'All' || t.status === activeTab;
    const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
    const matchesSearch =
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.client_name && t.client_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.project_title && t.project_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.assigned_to_name && t.assigned_to_name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTab && matchesPriority && matchesSearch;
  });

  const openCount = tickets.filter((t) => t.status === 'OPEN' || t.status === 'ASSIGNED').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'WAITING_CLIENT').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
  const criticalCount = tickets.filter((t) => t.priority === 'CRITICAL' && t.status !== 'CLOSED').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Ticket Queue"
        subtitle="Customer inquiries, technical tickets, and SLA resolution tracking."
        action={
          <Button
            variant="primary"
            icon={Plus}
            className="!bg-[#121358] hover:!bg-[#2F578A]"
            onClick={() => navigate('/organization/tickets/new')}
          >
            Create Ticket
          </Button>
        }
      />

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tickets"
          value={tickets.length}
          icon={Ticket}
          color="#121358"
          loading={loading}
          change="All Client Inquiries"
        />
        <StatCard
          title="Open & Unassigned"
          value={openCount}
          icon={Clock}
          color="#f59e0b"
          loading={loading}
          change={openCount > 0 ? 'Requires attention' : 'All clear'}
        />
        <StatCard
          title="In Progress"
          value={inProgressCount}
          icon={AlertCircle}
          color="#2F578A"
          loading={loading}
          change="Actively being worked"
        />
        <StatCard
          title="Resolved Tickets"
          value={resolvedCount}
          icon={CheckCircle2}
          color="#36ADA3"
          loading={loading}
          change={`${criticalCount} Critical issues`}
        />
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        {/* Status Tabs */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === tab
                  ? 'bg-[#121358] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab === 'All' ? 'All Tickets' : tab.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Priority Filter & Search */}
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="All">All Priorities</option>
            <option value="CRITICAL">Critical Priority</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          <div className="relative w-full sm:w-56">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Ticket List Table */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
          <Ticket className="mx-auto text-slate-300 mb-3" size={44} />
          <h3 className="text-base font-semibold text-slate-700">No Tickets Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery || activeTab !== 'All' || priorityFilter !== 'All'
              ? 'No tickets match your filter criteria.'
              : 'There are currently no support inquiries submitted.'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={() => navigate('/organization/tickets/new')}
          >
            Create Ticket
          </Button>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4">Ticket & Issue</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Project</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Assigned Engineer</th>
                  <th className="py-3.5 px-4">Date Submitted</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/organization/tickets/${t.id}`)}
                    className="hover:bg-slate-50/70 transition cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                          <Ticket size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm hover:text-blue-600 transition">
                            {t.title}
                          </p>
                          <span className="font-mono text-[10px] text-slate-400">
                            #{t.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {t.client_name || <span className="text-slate-400 italic">Internal</span>}
                    </td>

                    <td className="py-3.5 px-4">
                      {t.project_title ? (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                          <FolderOpen size={12} className="text-slate-400" />
                          {t.project_title}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                          t.priority === 'CRITICAL'
                            ? 'bg-red-100 text-red-700'
                            : t.priority === 'HIGH'
                            ? 'bg-orange-100 text-orange-700'
                            : t.priority === 'LOW'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>

                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={t.status}
                        onChange={(e) => handleQuickUpdate(t.id, { status: e.target.value })}
                        className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium"
                      >
                        <option value="OPEN">Open</option>
                        <option value="ASSIGNED">Assigned</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="WAITING_CLIENT">Waiting for Client</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={t.assigned_to || ''}
                        onChange={(e) =>
                          handleQuickUpdate(t.id, {
                            assigned_to: e.target.value ? Number(e.target.value) : null,
                            status: t.status === 'OPEN' ? 'ASSIGNED' : t.status,
                          })
                        }
                        className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium max-w-[130px]"
                      >
                        <option value="">Unassigned</option>
                        {staffUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.full_name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-xs"
                          onClick={() => navigate(`/organization/tickets/${t.id}`)}
                        >
                          Discussion
                        </Button>
                        <button
                          onClick={() => handleDelete(t.id, t.title)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Ticket"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
