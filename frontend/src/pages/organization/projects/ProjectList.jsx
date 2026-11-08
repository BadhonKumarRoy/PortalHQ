// src/pages/organization/projects/ProjectList.jsx
// Lists all projects with status filter shortcuts, live search, team assignment controls, and options to create/view/edit.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Users, UserCheck, Search, Filter } from 'lucide-react';
import { getProjects, updateProject } from '../../../api/projects';
import { getUsers } from '../../../api/auth';
import PageHeader from '../../../components/ui/PageHeader';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Card from '../../../components/ui/Card';
import Modal from '../../../components/ui/Modal';
import toast from 'react-hot-toast';

const STATUS_TABS = [
  { key: 'All', label: 'All' },
  { key: 'PLANNED', label: 'PLANNED' },
  { key: 'IN_PROGRESS', label: 'IN PROGRESS' },
  { key: 'UNDER_REVIEW', label: 'UNDER REVIEW' },
  { key: 'ON_HOLD', label: 'ON HOLD' },
  { key: 'COMPLETED', label: 'COMPLETED' },
];

export default function ProjectList() {
  const navigate = useNavigate();
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Team Management Modal state
  const [teamModalProject, setTeamModalProject] = useState(null);
  const [allStaff, setAllStaff] = useState([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [submittingTeam, setSubmittingTeam] = useState(false);

  // Fetch all projects from API
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProjects({});
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setAllProjects(data);
    } catch {
      toast.error('Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Load all staff members for quick team assignment
  useEffect(() => {
    getUsers()
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setAllStaff(data.filter((u) => u.role === 'EMPLOYEE' || u.role === 'ADMIN'));
      })
      .catch(() => {});
  }, []);

  // Compute live project counts for each status shortcut tab
  const statusCounts = useMemo(() => {
    const counts = {
      All: allProjects.length,
      PLANNED: 0,
      IN_PROGRESS: 0,
      UNDER_REVIEW: 0,
      ON_HOLD: 0,
      COMPLETED: 0,
    };

    allProjects.forEach((p) => {
      const st = p.status?.toUpperCase();
      if (st === 'PLANNED') counts.PLANNED += 1;
      else if (st === 'IN_PROGRESS' || st === 'ACTIVE') counts.IN_PROGRESS += 1;
      else if (st === 'UNDER_REVIEW') counts.UNDER_REVIEW += 1;
      else if (st === 'ON_HOLD') counts.ON_HOLD += 1;
      else if (st === 'COMPLETED') counts.COMPLETED += 1;
    });

    return counts;
  }, [allProjects]);

  // Filter projects by active status tab and search query
  const displayedProjects = useMemo(() => {
    return allProjects.filter((project) => {
      // Status filter
      if (activeStatus !== 'All') {
        const st = project.status?.toUpperCase();
        if (activeStatus === 'IN_PROGRESS') {
          if (st !== 'IN_PROGRESS' && st !== 'ACTIVE') return false;
        } else if (st !== activeStatus) {
          return false;
        }
      }

      // Search query filter (title or client name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (project.title || '').toLowerCase().includes(q);
        const clientMatch = (project.client_name || '').toLowerCase().includes(q);
        if (!titleMatch && !clientMatch) return false;
      }

      return true;
    });
  }, [allProjects, activeStatus, searchQuery]);

  const openTeamModal = (e, project) => {
    e.stopPropagation(); // prevent row click navigation
    setTeamModalProject(project);
    setSelectedStaffIds(project.assigned_employees || []);
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
    if (!teamModalProject) return;
    setSubmittingTeam(true);
    try {
      await updateProject(teamModalProject.id, { assigned_employees: selectedStaffIds });
      toast.success(`Team updated for "${teamModalProject.title}"!`);
      setTeamModalProject(null);
      fetchProjects();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update team.');
    } finally {
      setSubmittingTeam(false);
    }
  };

  const columns = [
    { key: 'title', label: 'Project Title' },
    { key: 'client_name', label: 'Client' },
    {
      key: 'assigned_employees_count',
      label: 'Assigned Team (Who Works On It)',
      render: (count, row) => (
        <button
          type="button"
          onClick={(e) => openTeamModal(e, row)}
          className={`inline-flex items-center gap-1.5 font-semibold text-[11px] px-2.5 py-1 rounded-full transition-all cursor-pointer shadow-xs ${
            count > 0
              ? 'text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200'
              : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
          }`}
          title="Click to assign or change staff working on this project"
        >
          <Users size={12} className={count > 0 ? 'text-teal-600' : 'text-amber-600'} />
          <span>{count > 0 ? `${count} Staff Assigned` : '+ Assign Staff'}</span>
        </button>
      ),
    },
    { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
    {
      key: 'start_date',
      label: 'Start Date',
      render: (v) => (v ? new Date(v).toLocaleDateString() : '—'),
    },
    {
      key: 'end_date',
      label: 'End Date',
      render: (v) => (v ? new Date(v).toLocaleDateString() : '—'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => openTeamModal(e, row)}
            className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
            title="Assign Team / Staff"
          >
            <Users size={15} />
          </button>
          <button
            onClick={() => navigate(`/organization/projects/${row.id}`)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Project Details & Milestones"
          >
            <Eye size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        subtitle={`${allProjects.length} total client projects across your organization`}
        action={
          <Button
            icon={Plus}
            className="!bg-[#121358]"
            onClick={() => navigate('/organization/projects/new')}
          >
            Create Project
          </Button>
        }
      />

      <Card>
        {/* Status filter tabs & search shortcut bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
          {/* Shortcuts */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_TABS.map((tab) => {
              const isActive = activeStatus === tab.key;
              const count = statusCounts[tab.key] ?? 0;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveStatus(tab.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    isActive
                      ? 'text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  style={isActive ? { background: '#121358' } : {}}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search project or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#121358]/20 focus:border-[#121358] transition-all"
            />
          </div>
        </div>

        {/* Projects table */}
        <Table
          columns={columns}
          data={displayedProjects}
          loading={loading}
          emptyMessage={
            searchQuery.trim() || activeStatus !== 'All'
              ? `No projects found matching "${activeStatus !== 'All' ? activeStatus.replace(/_/g, ' ') : ''}" filter.`
              : 'No projects registered yet.'
          }
          onRowClick={(row) => navigate(`/organization/projects/${row.id}`)}
        />
      </Card>

      {/* ── MODAL: QUICK ASSIGN TEAM ────────────────────────────────────── */}
      <Modal
        open={Boolean(teamModalProject)}
        onClose={() => setTeamModalProject(null)}
        title={teamModalProject ? `Assign Staff to ${teamModalProject.title}` : 'Assign Staff'}
      >
        <form onSubmit={handleSaveTeam} className="space-y-4">
          <p className="text-xs text-slate-500">
            Select the employees who are responsible for this project. Assigned staff will be able to see the project, complete tasks, upload deliverables, and respond to support tickets.
          </p>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {allStaff.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No staff members found.</p>
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
                        <p className="text-xs font-semibold">{staff.full_name || staff.email}</p>
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
              onClick={() => setTeamModalProject(null)}
              type="button"
            >
              Cancel
            </Button>
            <Button type="submit" loading={submittingTeam} className="!bg-[#121358]">
              Save Team
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
