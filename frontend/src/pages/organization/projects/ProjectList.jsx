// src/pages/organization/projects/ProjectList.jsx
// Lists all projects with status filter tabs and options to create/view/edit.

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Pencil } from 'lucide-react';
import { getProjects } from '../../../api/projects';
import PageHeader from '../../../components/ui/PageHeader';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Card from '../../../components/ui/Card';
import toast from 'react-hot-toast';

const STATUS_TABS = ['All', 'PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'];

export default function ProjectList() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('All');

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = activeStatus !== 'All' ? { status: activeStatus } : {};
      const res = await getProjects(params);
      setProjects(Array.isArray(res.data) ? res.data : res.data?.results || []);
    } catch {
      toast.error('Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }, [activeStatus]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const columns = [
    { key: 'title', label: 'Project Title' },
    { key: 'client_name', label: 'Client' },
    {
      key: 'assigned_employees_count',
      label: 'Team',
      render: (v) =>
        v > 0 ? (
          <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-teal-50 text-teal-800 px-2.5 py-0.5 rounded-full text-[11px]">
            {v} assigned
          </span>
        ) : (
          <span className="text-amber-700 font-medium text-[11px] bg-amber-50 px-2 py-0.5 rounded-full">
            Unassigned
          </span>
        ),
    },
    { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
    { key: 'start_date', label: 'Start Date', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'end_date', label: 'End Date', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); navigate(`/organization/projects/${row.id}`); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View"><Eye size={15} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} projects`}
        action={<Button icon={Plus} onClick={() => navigate('/organization/projects/new')}>Create Project</Button>}
      />

      <Card>
        {/* Status filter tabs */}
        <div className="flex gap-1 flex-wrap mb-4 border-b border-slate-100 pb-3">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveStatus(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeStatus === tab
                  ? 'text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
              style={activeStatus === tab ? { background: '#121358' } : {}}
            >
              {tab === 'All' ? 'All' : tab.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <Table
          columns={columns}
          data={projects}
          loading={loading}
          emptyMessage="No projects found."
          onRowClick={(row) => navigate(`/organization/projects/${row.id}`)}
        />
      </Card>
    </div>
  );
}
