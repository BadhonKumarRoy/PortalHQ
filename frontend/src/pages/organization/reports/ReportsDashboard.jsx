// src/pages/organization/reports/ReportsDashboard.jsx
// Executive Reports, Business Intelligence & Audit Log Dashboard.
// Features portfolio metrics, delivery velocity, SLA health, client breakdown, compliance audit trail, and 1-click CSV exports.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Download,
  RefreshCw,
  ShieldCheck,
  Users,
  FolderKanban,
  LifeBuoy,
  Search,
  ArrowUpRight,
  Activity,
  CheckCircle,
  ChevronDown,
  Filter,
} from 'lucide-react';
import { getAnalytics, getAuditLogs, exportReportCsv } from '../../../api/reports';
import PageHeader from '../../../components/ui/PageHeader';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Table from '../../../components/ui/Table';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function ReportsDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'projects' | 'tickets' | 'audit'

  // Audit filter state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState('All');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');

  // Project table search
  const [projectSearch, setProjectSearch] = useState('');

  // Ticket table filter & search
  const [ticketStatusFilter, setTicketStatusFilter] = useState('All');
  const [ticketSearch, setTicketSearch] = useState('');

  // Export dropdown state
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [exportingType, setExportingType] = useState(null);

  // Load analytics summary with automatic retry for cold starts
  const loadData = useCallback(async (isRefresh = false, retryCount = 0) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getAnalytics();
      setAnalyticsData(res.data);
      if (res.data?.recent_audits) {
        setAuditLogs(res.data.recent_audits);
      }
      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      console.error('Operational analytics load error:', err);
      // Auto-retry once after 1.5 seconds if server was cold-starting
      if (retryCount < 1) {
        setTimeout(() => {
          loadData(isRefresh, retryCount + 1);
        }, 1500);
        return;
      }
      const msg = err.response?.data?.detail || err.response?.data?.error || err.message || 'Failed to load operational analytics.';
      toast.error(msg);
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load audit logs with action filter
  const loadAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const params = {};
      if (auditActionFilter !== 'All') params.action = auditActionFilter;
      const res = await getAuditLogs(params);
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setAuditLogs(data);
    } catch {
      toast.error('Failed to load audit logs.');
    } finally {
      setAuditLoading(false);
    }
  }, [auditActionFilter]);

  useEffect(() => {
    if (activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [activeTab, loadAuditLogs]);

  // Handle CSV export download
  const handleExport = async (type) => {
    setExportingType(type);
    setExportDropdownOpen(false);
    try {
      const res = await exportReportCsv(type);
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.setAttribute('download', `portalhq_${type}_report_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${type.toUpperCase()} report exported successfully!`);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to export ${type} report.`);
    } finally {
      setExportingType(null);
    }
  };

  const summary = analyticsData?.summary || {};
  const projectList = analyticsData?.projects_table || [];
  const clientsPortfolio = analyticsData?.clients_portfolio || [];
  const ticketsByPriority = analyticsData?.tickets_by_priority || {};

  // Filtered projects for Project Performance Tab
  const filteredProjects = useMemo(() => {
    if (!projectSearch.trim()) return projectList;
    const q = projectSearch.toLowerCase().trim();
    return projectList.filter(
      (p) =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.client_name || '').toLowerCase().includes(q) ||
        (p.status || '').toLowerCase().includes(q)
    );
  }, [projectList, projectSearch]);

  // Filtered audit logs for Audit Tab
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (auditActionFilter !== 'All' && log.action !== auditActionFilter) return false;
      if (auditSearchQuery.trim()) {
        const q = auditSearchQuery.toLowerCase().trim();
        const descMatch = (log.description || '').toLowerCase().includes(q);
        const userMatch = (log.user_name || log.user_email || '').toLowerCase().includes(q);
        const entityMatch = (log.entity_type || '').toLowerCase().includes(q);
        const ipMatch = (log.ip_address || '').toLowerCase().includes(q);
        if (!descMatch && !userMatch && !entityMatch && !ipMatch) return false;
      }
      return true;
    });
  }, [auditLogs, auditActionFilter, auditSearchQuery]);

  // Audit badge helper
  const getActionBadgeColor = (action) => {
    switch (action) {
      case 'APPROVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CREATE':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'UPDATE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'LOGIN':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'UPLOAD':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'REJECT':
      case 'DELETE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner />
        <p className="text-xs text-slate-500 mt-3 font-medium">Aggregating executive reports & BI data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <PageHeader
        title="Executive Reports & Audit Intelligence"
        subtitle="Real-time portfolio analytics, project health KPIs, SLA performance, and compliance audit log"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-xs"
              title="Refresh latest data"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin text-teal-600' : ''} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#121358] hover:bg-[#1a1b70] rounded-lg transition-all shadow-xs"
              >
                <Download size={13} />
                <span>Export Report (CSV)</span>
                <ChevronDown size={12} className="ml-0.5 opacity-80" />
              </button>

              {exportDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1.5"
                  onClick={() => setExportDropdownOpen(false)}
                >
                  <p className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Select CSV Export
                  </p>
                  <button
                    onClick={() => handleExport('projects')}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
                  >
                    <span className="flex items-center gap-2">
                      <FolderKanban size={14} className="text-blue-500" />
                      Projects Portfolio
                    </span>
                    <span className="text-[10px] text-slate-400">CSV</span>
                  </button>
                  <button
                    onClick={() => handleExport('tickets')}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
                  >
                    <span className="flex items-center gap-2">
                      <LifeBuoy size={14} className="text-amber-500" />
                      Support SLA Tickets
                    </span>
                    <span className="text-[10px] text-slate-400">CSV</span>
                  </button>
                  <button
                    onClick={() => handleExport('clients')}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Users size={14} className="text-teal-500" />
                      Client Accounts & Value
                    </span>
                    <span className="text-[10px] text-slate-400">CSV</span>
                  </button>
                  <button
                    onClick={() => handleExport('audit')}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-indigo-500" />
                      Compliance Audit Trail
                    </span>
                    <span className="text-[10px] text-slate-400">CSV</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        }
      />

      {/* ── TOP KPI CARDS (4 EXECUTIVE METRICS) ────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Contract Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Contract Portfolio
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-800">
              ${Number(summary.total_budget || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-bold flex items-center">
                <TrendingUp size={11} className="mr-0.5" /> {summary.total_projects || 0} Projects
              </span>
              <span>across {summary.total_clients || 0} clients</span>
            </p>
          </div>
        </div>

        {/* Card 2: Milestone Delivery Velocity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Task Velocity
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-black text-slate-800">
                {summary.task_completion_rate || 0}%
              </p>
              <span className="text-xs font-bold text-slate-500">
                {summary.completed_tasks || 0} / {summary.total_tasks || 0} Done
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${summary.task_completion_rate || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Support SLA Resolution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Support & SLA
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <LifeBuoy size={18} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-800">
              {summary.open_tickets || 0} Open
            </p>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
              <span>{summary.resolved_tickets || 0} resolved</span>
              <span className="text-slate-300">•</span>
              <span className="text-rose-600 font-semibold">{ticketsByPriority.HIGH || 0} High Priority</span>
            </p>
          </div>
        </div>

        {/* Card 4: Governance & Approvals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Governance & SLA
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-800">
              {summary.pending_approvals || 0} Pending
            </p>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-bold">{summary.approved_count || 0} Approved</span>
              <span>• {summary.total_documents || 0} Deliverables tracked</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── TABS NAVIGATION ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'overview'
              ? 'bg-[#121358] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 size={14} />
          Executive Overview
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'projects'
              ? 'bg-[#121358] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FolderKanban size={14} />
          Project Delivery & Budget ({projectList.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'audit'
              ? 'bg-[#121358] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck size={14} />
          Compliance Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* ── TAB CONTENT: EXECUTIVE OVERVIEW ───────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Project Status Distribution */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Portfolio Delivery Health</h3>
                  <p className="text-xs text-slate-500">Live project breakdown by active operational phase</p>
                </div>
                <Badge status="ACTIVE">Live Synced</Badge>
              </div>

              <div className="space-y-3 pt-2">
                {(analyticsData?.project_status_breakdown || []).map((item) => {
                  const pct = summary.total_projects > 0 ? Math.round((item.count / summary.total_projects) * 100) : 0;
                  return (
                    <div key={item.status} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              item.status === 'IN_PROGRESS'
                                ? 'bg-blue-500'
                                : item.status === 'PLANNED'
                                ? 'bg-amber-500'
                                : item.status === 'UNDER_REVIEW'
                                ? 'bg-purple-500'
                                : item.status === 'COMPLETED'
                                ? 'bg-emerald-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          {item.label}
                        </span>
                        <div className="flex items-center gap-2 text-slate-500">
                          <span className="font-bold text-slate-800">{item.count} Projects</span>
                          <span>({pct}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            item.status === 'IN_PROGRESS'
                              ? 'bg-blue-600'
                              : item.status === 'PLANNED'
                              ? 'bg-amber-500'
                              : item.status === 'UNDER_REVIEW'
                              ? 'bg-purple-600'
                              : item.status === 'COMPLETED'
                              ? 'bg-emerald-500'
                              : 'bg-slate-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Quick Metric summary bar */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-center">
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Active Delivery</p>
                  <p className="text-lg font-bold text-blue-600 mt-0.5">{summary.active_projects || 0}</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Planned Pipeline</p>
                  <p className="text-lg font-bold text-amber-600 mt-0.5">{summary.planned_projects || 0}</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Client Review</p>
                  <p className="text-lg font-bold text-purple-600 mt-0.5">{summary.under_review_projects || 0}</p>
                </div>
              </div>
            </div>

            {/* Right Col: Client Portfolio Allocation */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Client Portfolio Allocation</h3>
                <p className="text-xs text-slate-500">Distribution of contracted budget & accounts</p>

                <div className="mt-4 space-y-3">
                  {clientsPortfolio.map((client) => {
                    const totalB = summary.total_budget || 1;
                    const clientPct = Math.round((client.total_budget / totalB) * 100);
                    return (
                      <div
                        key={client.id}
                        className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{client.company_name}</p>
                            <p className="text-[10px] text-slate-500">Contact: {client.name}</p>
                          </div>
                          <span className="text-xs font-black text-slate-700">
                            ${client.total_budget.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-teal-500 h-1.5 rounded-full"
                            style={{ width: `${clientPct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                          <span>{client.projects_count} Projects ({clientPct}% share)</span>
                          <span className={client.open_tickets_count > 0 ? 'text-amber-600 font-semibold' : ''}>
                            {client.open_tickets_count} Open Tickets
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => navigate('/organization/clients')}
                  className="w-full py-2 text-xs font-semibold text-[#121358] hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Manage Client Accounts</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Recent Compliance Audit Trail Snippet */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Recent Operational Events</h3>
                <p className="text-xs text-slate-500">Latest logged actions across portal accounts & deliverables</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveTab('audit')}
              >
                View Full Audit Log
              </Button>
            </div>

            <div className="divide-y divide-slate-100">
              {(analyticsData?.recent_audits || []).slice(0, 5).map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase ${getActionBadgeColor(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{log.description}</p>
                      <p className="text-[10px] text-slate-400">
                        By {log.user_name || log.user_email || 'System'} • Entity: {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT: PROJECT PERFORMANCE & BUDGET ─────────────────── */}
      {activeTab === 'projects' && (
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Portfolio Delivery Matrix</h3>
              <p className="text-xs text-slate-500">Monitor budget allocations, delivery deadlines, and task execution</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                <input
                  type="text"
                  placeholder="Filter by title or client..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#121358]/20 focus:border-[#121358]"
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={Download}
                onClick={() => handleExport('projects')}
              >
                CSV
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Project Title</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Budget</th>
                  <th className="py-3 px-4">Target Date</th>
                  <th className="py-3 px-4">Task Delivery</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                      No matching projects found.
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => navigate(`/organization/projects/${p.id}`)}
                    >
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {p.title}
                        <span className="block text-[10px] font-normal text-slate-400">
                          {p.assigned_count} Assigned Engineers
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">{p.client_name}</td>
                      <td className="py-3 px-4">
                        <Badge status={p.status} />
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        ${p.budget.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {p.end_date ? new Date(p.end_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-28 space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-semibold text-slate-700">{p.progress_percent}%</span>
                            <span className="text-slate-400">{p.completed_tasks}/{p.total_tasks}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-teal-500 h-1.5 rounded-full"
                              style={{ width: `${p.progress_percent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/organization/projects/${p.id}`);
                          }}
                          className="px-2 py-1 text-[11px] font-semibold text-[#121358] hover:bg-slate-100 rounded-md transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── TAB CONTENT: COMPLIANCE AUDIT TRAIL ────────────────────────── */}
      {activeTab === 'audit' && (
        <Card>
          {/* Audit Controls & Action filter */}
          <div className="space-y-3 mb-5 border-b border-slate-100 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">System Compliance & Security Audit Trail</h3>
                <p className="text-xs text-slate-500">
                  Immutable record of user logins, project updates, document approvals, and ticket dispatches
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={Download}
                onClick={() => handleExport('audit')}
              >
                Export Audit CSV
              </Button>
            </div>

            {/* Filter buttons & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {['All', 'LOGIN', 'CREATE', 'UPDATE', 'APPROVE', 'UPLOAD'].map((action) => (
                  <button
                    key={action}
                    onClick={() => setAuditActionFilter(action)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      auditActionFilter === action
                        ? 'bg-[#121358] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {action}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                <input
                  type="text"
                  placeholder="Search user, action, IP..."
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#121358]/20 focus:border-[#121358]"
                />
              </div>
            </div>
          </div>

          {auditLoading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Entity</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                        No audit events match your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase ${getActionBadgeColor(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-800">{log.user_name || 'System'}</p>
                          <p className="text-[10px] text-slate-400">{log.user_email}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-[11px] font-semibold text-slate-700">
                            {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs text-slate-700">
                          {log.description}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {log.ip_address || '—'}
                        </td>
                        <td className="py-3 px-4 text-right text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString([], {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
