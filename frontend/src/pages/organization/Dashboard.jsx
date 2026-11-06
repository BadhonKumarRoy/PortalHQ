// src/pages/organization/Dashboard.jsx
// The Admin dashboard — the first thing an Admin sees after logging in.
// Shows key stats, recent projects, and recent tickets.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FolderOpen, Ticket, ClipboardCheck, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getClients } from '../../api/clients';
import { getProjects } from '../../api/projects';
import { getTickets } from '../../api/tickets';
import { getApprovals } from '../../api/approvals';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function OrgDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State for all dashboard data
  const [stats, setStats] = useState({ clients: 0, projects: 0, tickets: 0, approvals: 0 });
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get a greeting based on the time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Load all data when the page mounts
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [clientsRes, projectsRes, ticketsRes, approvalsRes] = await Promise.all([
          getClients(),
          getProjects(),
          getTickets(),
          getApprovals({ status: 'PENDING' }),
        ]);

        setStats({
          clients: clientsRes.data?.count ?? clientsRes.data?.length ?? 0,
          projects: projectsRes.data?.count ?? projectsRes.data?.length ?? 0,
          tickets: ticketsRes.data?.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS')?.length ?? 0,
          approvals: approvalsRes.data?.count ?? approvalsRes.data?.length ?? 0,
        });

        // Show only the 5 most recent projects and tickets
        const projects = Array.isArray(projectsRes.data) ? projectsRes.data : projectsRes.data?.results || [];
        const tickets = Array.isArray(ticketsRes.data) ? ticketsRes.data : ticketsRes.data?.results || [];
        setRecentProjects(projects.slice(0, 5));
        setRecentTickets(tickets.slice(0, 5));
      } catch (err) {
        toast.error('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // Column definitions for the recent projects table
  const projectColumns = [
    { key: 'title', label: 'Project' },
    { key: 'client_name', label: 'Client' },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <Badge status={val} />,
    },
    {
      key: 'end_date',
      label: 'Due Date',
      render: (val) => val ? new Date(val).toLocaleDateString() : '—',
    },
  ];

  // Column definitions for the recent tickets table
  const ticketColumns = [
    { key: 'title', label: 'Issue' },
    { key: 'client_name', label: 'Client' },
    {
      key: 'priority',
      label: 'Priority',
      render: (val) => <Badge status={val} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <Badge status={val} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {greeting}, {user?.first_name || 'Admin'}! 👋
          </h2>
          <p className="text-slate-500 mt-1">Here's what's happening in your organization today.</p>
        </div>
        {/* Quick action buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={() => navigate('/organization/clients/new')}
          >
            Add Client
          </Button>
          <Button
            size="sm"
            icon={Plus}
            onClick={() => navigate('/organization/projects/new')}
          >
            Create Project
          </Button>
        </div>
      </div>

      {/* ---- STAT CARDS ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Clients"
          value={stats.clients}
          icon={Users}
          color="#121358"
          loading={loading}
        />
        <StatCard
          title="Active Projects"
          value={stats.projects}
          icon={FolderOpen}
          color="#2F578A"
          loading={loading}
        />
        <StatCard
          title="Open Tickets"
          value={stats.tickets}
          icon={Ticket}
          color="#f59e0b"
          loading={loading}
        />
        <StatCard
          title="Pending Approvals"
          value={stats.approvals}
          icon={ClipboardCheck}
          color="#36ADA3"
          loading={loading}
        />
      </div>

      {/* ---- RECENT DATA TABLES ---- */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card
          title="Recent Projects"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/organization/projects')}>
              View All
            </Button>
          }
        >
          <Table
            columns={projectColumns}
            data={recentProjects}
            loading={loading}
            emptyMessage="No projects yet. Create your first project!"
            onRowClick={(row) => navigate(`/organization/projects/${row.id}`)}
          />
        </Card>

        {/* Recent Tickets */}
        <Card
          title="Recent Tickets"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/organization/tickets')}>
              View All
            </Button>
          }
        >
          <Table
            columns={ticketColumns}
            data={recentTickets}
            loading={loading}
            emptyMessage="No tickets yet."
            onRowClick={(row) => navigate(`/organization/tickets/${row.id}`)}
          />
        </Card>
      </div>
    </div>
  );
}
