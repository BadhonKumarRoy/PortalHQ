// src/pages/employee/projects/MyProjects.jsx
// Employee / Staff - Assigned Projects
// Displays all client projects that this staff member is assigned to collaborate on.

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects } from '../../../api/projects';
import { getMilestones } from '../../../api/milestones';

import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

import {
  FolderOpen,
  Calendar,
  Clock,
  Search,
  CheckSquare,
  Layers,
  ArrowRight,
} from 'lucide-react';

const STATUS_TABS = ['All', 'IN_PROGRESS', 'PLANNED', 'ON_HOLD', 'COMPLETED'];

export default function MyProjects() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [projRes, mileRes] = await Promise.allSettled([
        getProjects(),
        getMilestones(),
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
    } catch (err) {
      console.error('Failed to load employee projects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredProjects = projects.filter((p) => {
    const matchesTab = activeTab === 'All' || p.status === activeTab;
    const matchesSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.client_name && p.client_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assigned Projects"
        subtitle="Manage development delivery, milestone progress, and client engagements."
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
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
              {tab === 'All' ? 'All Projects' : tab.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects or clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
          <FolderOpen className="mx-auto text-slate-300 mb-3" size={48} />
          <h3 className="text-base font-semibold text-slate-700">No Projects Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {searchQuery
              ? `No projects match "${searchQuery}".`
              : 'You are not assigned to any projects in this category.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProjects.map((proj) => {
            const projMilestones = milestones.filter((m) => m.project === proj.id);
            const completedCount = projMilestones.filter((m) => m.is_completed).length;
            const progressPercent = projMilestones.length
              ? Math.round((completedCount / projMilestones.length) * 100)
              : 0;

            return (
              <Card
                key={proj.id}
                className="group p-6 flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => navigate(`/employee/tasks?project=${proj.id}`)}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                        {proj.client_name || 'Client Engagement'}
                      </span>
                      <h3 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {proj.title}
                      </h3>
                    </div>
                    <Badge status={proj.status} />
                  </div>

                  {proj.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                      {proj.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-5">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-400" />
                      <span>
                        Start:{' '}
                        {proj.start_date
                          ? new Date(proj.start_date).toLocaleDateString()
                          : 'TBD'}
                      </span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-400" />
                      <span>
                        Target:{' '}
                        {proj.end_date
                          ? new Date(proj.end_date).toLocaleDateString()
                          : 'Ongoing'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-slate-600 flex items-center gap-1.5">
                      <Layers size={13} className="text-slate-400" /> Milestone Completion
                    </span>
                    <span className="font-bold text-slate-800">
                      {completedCount} / {projMilestones.length} ({progressPercent}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">
                      PROJECT #{proj.id}
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      className="text-xs !bg-[#121358] hover:!bg-[#2F578A]"
                      icon={ArrowRight}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/employee/tasks?project=${proj.id}`);
                      }}
                    >
                      View Tasks & Checklists
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
