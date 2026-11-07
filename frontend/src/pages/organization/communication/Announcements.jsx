// src/pages/organization/communication/Announcements.jsx
// Organization Admin - Announcements & Broadcasts
// Publish organizational updates, client bulletins, and staff announcements.

import { useState, useEffect, useCallback } from 'react';
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from '../../../api/communication';

import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import StatCard from '../../../components/ui/StatCard';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

import {
  Megaphone,
  Plus,
  Trash2,
  Calendar,
  User,
  Users,
  Search,
  Globe,
  Briefcase,
} from 'lucide-react';

const AUDIENCE_TABS = ['All', 'ALL', 'CLIENTS', 'EMPLOYEES'];

export default function Announcements() {
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Create modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    target_audience: 'ALL',
    content: '',
  });

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAnnouncements();
      const aData = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setAnnouncements(aData);
    } catch (err) {
      console.error('Failed to load announcements:', err);
      toast.error('Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Announcement title is required.');
      return;
    }
    if (!formData.content.trim()) {
      toast.error('Announcement content is required.');
      return;
    }

    setSubmitting(true);
    try {
      await createAnnouncement({
        title: formData.title.trim(),
        target_audience: formData.target_audience,
        content: formData.content.trim(),
      });
      toast.success('Announcement published successfully!');
      setModalOpen(false);
      setFormData({ title: '', target_audience: 'ALL', content: '' });
      fetchAnnouncements();
    } catch (err) {
      console.error('Create error:', err);
      toast.error('Failed to publish announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete announcement "${title}"?`)) return;

    try {
      await deleteAnnouncement(id);
      toast.success('Announcement removed.');
      fetchAnnouncements();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete announcement.');
    }
  };

  const filteredAnnouncements = announcements.filter((a) => {
    const matchesAudience = activeTab === 'All' || a.target_audience === activeTab;
    const matchesSearch =
      !searchQuery ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.created_by_name && a.created_by_name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesAudience && matchesSearch;
  });

  const broadcastAllCount = announcements.filter((a) => a.target_audience === 'ALL').length;
  const clientsOnlyCount = announcements.filter((a) => a.target_audience === 'CLIENTS').length;
  const staffOnlyCount = announcements.filter((a) => a.target_audience === 'EMPLOYEES').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements & Broadcasts"
        subtitle="Broadcast organizational bulletins, policy updates, and client notices."
        action={
          <Button
            variant="primary"
            icon={Plus}
            className="!bg-[#121358] hover:!bg-[#2F578A]"
            onClick={() => setModalOpen(true)}
          >
            New Announcement
          </Button>
        }
      />

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Broadcasts"
          value={announcements.length}
          icon={Megaphone}
          color="#121358"
          loading={loading}
          change="All Active Notices"
        />
        <StatCard
          title="Broadcast to All"
          value={broadcastAllCount}
          icon={Globe}
          color="#36ADA3"
          loading={loading}
          change="Public Notice"
        />
        <StatCard
          title="Clients Only"
          value={clientsOnlyCount}
          icon={Users}
          color="#2F578A"
          loading={loading}
          change="Portal Feed Only"
        />
        <StatCard
          title="Staff & Employees"
          value={staffOnlyCount}
          icon={Briefcase}
          color="#f59e0b"
          loading={loading}
          change="Internal Team Only"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        {/* Audience Tabs */}
        <div className="flex gap-1 flex-wrap">
          {AUDIENCE_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === tab
                  ? 'bg-[#121358] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab === 'All'
                ? 'All Broadcasts'
                : tab === 'ALL'
                ? 'Everyone'
                : tab === 'CLIENTS'
                ? 'Clients Only'
                : 'Staff Only'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Announcements Feed */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
          <Megaphone className="mx-auto text-slate-300 mb-3" size={44} />
          <h3 className="text-base font-semibold text-slate-700">No Announcements Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery
              ? `No announcements match "${searchQuery}".`
              : 'Publish your first company-wide announcement or client broadcast.'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={() => setModalOpen(true)}
          >
            Create Announcement
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((a) => (
            <Card key={a.id} className="p-6">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Megaphone size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{a.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded font-bold ${
                          a.target_audience === 'ALL'
                            ? 'bg-emerald-100 text-emerald-800'
                            : a.target_audience === 'CLIENTS'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {a.target_audience === 'ALL'
                          ? 'Broadcast: All Users'
                          : a.target_audience === 'CLIENTS'
                          ? 'Audience: Clients Only'
                          : 'Audience: Employees Only'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 inline-flex items-center gap-1">
                    <Calendar size={13} /> {new Date(a.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleDelete(a.id, a.title)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete Announcement"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="pt-2 text-xs sm:text-sm text-slate-600 whitespace-pre-wrap leading-relaxed pl-13">
                {a.content}
              </div>

              {a.created_by_name && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-400">
                  <User size={13} />
                  <span>Posted by {a.created_by_name}</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* New Announcement Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Publish New Announcement"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Announcement Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Scheduled Infrastructure Upgrade This Weekend"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Target Audience
            </label>
            <select
              value={formData.target_audience}
              onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Everyone (All Clients & Employees)</option>
              <option value="CLIENTS">Clients Only (Visible on Client Portals)</option>
              <option value="EMPLOYEES">Employees Only (Internal Staff Dashboard)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Announcement Message / Body <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              placeholder="Write the full announcement message here..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
              className="!bg-[#121358]"
            >
              Publish Announcement
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
