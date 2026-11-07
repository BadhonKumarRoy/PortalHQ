// src/pages/organization/communication/Meetings.jsx
// Organization Admin - Meeting Records & Agendas
// Schedule client syncs, document agendas, capture minutes, and track decisions.

import { useState, useEffect, useCallback } from 'react';
import { getMeetings, createMeeting, updateMeeting, deleteMeeting } from '../../../api/communication';
import { getProjects } from '../../../api/projects';
import { getUsers } from '../../../api/auth';

import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import StatCard from '../../../components/ui/StatCard';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Search,
  FolderOpen,
  Building2,
  Users,
  CheckCircle2,
  FileText,
} from 'lucide-react';

export default function Meetings() {
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');

  // Meeting modal state (create or edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    project: '',
    meeting_date: '',
    agenda: '',
    minutes: '',
    participants: [],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [meetRes, projRes, userRes] = await Promise.allSettled([
        getMeetings(),
        getProjects(),
        getUsers(),
      ]);

      if (meetRes.status === 'fulfilled') {
        const mData = Array.isArray(meetRes.value.data)
          ? meetRes.value.data
          : meetRes.value.data?.results || [];
        setMeetings(mData);
      }

      if (projRes.status === 'fulfilled') {
        const pData = Array.isArray(projRes.value.data)
          ? projRes.value.data
          : projRes.value.data?.results || [];
        setProjects(pData);
      }

      if (userRes.status === 'fulfilled') {
        const uData = Array.isArray(userRes.value.data)
          ? userRes.value.data
          : userRes.value.data?.results || [];
        setUsers(uData);
      }
    } catch (err) {
      console.error('Failed to load meetings data:', err);
      toast.error('Failed to load meeting records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreate = () => {
    setEditingMeeting(null);
    setFormData({
      title: '',
      project: '',
      meeting_date: '',
      agenda: '',
      minutes: '',
      participants: [],
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (m) => {
    setEditingMeeting(m);
    setFormData({
      title: m.title || '',
      project: m.project || '',
      meeting_date: m.meeting_date ? m.meeting_date.slice(0, 16) : '',
      agenda: m.agenda || '',
      minutes: m.minutes || '',
      participants: Array.isArray(m.participants) ? m.participants : [],
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Meeting title is required.');
      return;
    }
    if (!formData.meeting_date) {
      toast.error('Meeting date and time is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        meeting_date: formData.meeting_date,
        project: formData.project ? Number(formData.project) : null,
        agenda: formData.agenda.trim(),
        minutes: formData.minutes.trim(),
        participants: formData.participants.map(Number),
      };

      if (editingMeeting) {
        await updateMeeting(editingMeeting.id, payload);
        toast.success('Meeting record updated!');
      } else {
        await createMeeting(payload);
        toast.success('Meeting scheduled successfully!');
      }

      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Meeting submit error:', err);
      toast.error('Failed to save meeting record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete meeting record "${title}"?`)) return;

    try {
      await deleteMeeting(id);
      toast.success('Meeting record deleted.');
      fetchData();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete meeting record.');
    }
  };

  // Filter meetings
  const filteredMeetings = meetings.filter((m) => {
    return (
      !searchQuery ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.project_title && m.project_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.client_name && m.client_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.agenda && m.agenda.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const now = new Date();
  const upcomingCount = meetings.filter((m) => new Date(m.meeting_date) >= now).length;
  const completedCount = meetings.filter((m) => new Date(m.meeting_date) < now).length;
  const documentedMinutesCount = meetings.filter((m) => Boolean(m.minutes?.trim())).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meeting Records & Agendas"
        subtitle="Schedule client reviews, document agendas, and track discussion minutes."
        action={
          <Button
            variant="primary"
            icon={Plus}
            className="!bg-[#121358] hover:!bg-[#2F578A]"
            onClick={handleOpenCreate}
          >
            Schedule Meeting
          </Button>
        }
      />

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Meetings"
          value={meetings.length}
          icon={Calendar}
          color="#121358"
          loading={loading}
          change="All Scheduled Sessions"
        />
        <StatCard
          title="Upcoming Syncs"
          value={upcomingCount}
          icon={Clock}
          color="#36ADA3"
          loading={loading}
          change="Scheduled for Future"
        />
        <StatCard
          title="Past Sessions"
          value={completedCount}
          icon={CheckCircle2}
          color="#2F578A"
          loading={loading}
          change="Conducted Meetings"
        />
        <StatCard
          title="Documented Minutes"
          value={documentedMinutesCount}
          icon={FileText}
          color="#f59e0b"
          loading={loading}
          change="With Action Items"
        />
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search meetings by title, client, or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <span className="text-xs text-slate-500 font-medium">
          {filteredMeetings.length} Records Found
        </span>
      </div>

      {/* Meetings Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
          <Calendar className="mx-auto text-slate-300 mb-3" size={44} />
          <h3 className="text-base font-semibold text-slate-700">No Meetings Scheduled</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery
              ? `No meetings match "${searchQuery}".`
              : 'Schedule a sprint review, delivery sign-off, or client check-in meeting.'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={handleOpenCreate}
          >
            Schedule First Meeting
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredMeetings.map((m) => {
            const isUpcoming = new Date(m.meeting_date) >= now;

            return (
              <Card key={m.id} className="p-6 flex flex-col justify-between hover:border-blue-300 transition shadow-sm">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                            isUpcoming
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isUpcoming ? 'Upcoming' : 'Conducted'}
                        </span>
                        {m.client_name && (
                          <span className="text-xs font-semibold text-slate-500">
                            {m.client_name}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-800">{m.title}</h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit Meeting"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id, m.title)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete Meeting"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Date and Project */}
                  <div className="flex items-center gap-3 text-xs text-slate-400 my-3 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-slate-600 font-semibold">
                      <Calendar size={13} /> {new Date(m.meeting_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                    {m.project_title && (
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        <FolderOpen size={12} /> {m.project_title}
                      </span>
                    )}
                  </div>

                  {/* Agenda */}
                  {m.agenda && (
                    <div className="mt-3 text-xs">
                      <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wide block mb-1">
                        Agenda & Topics
                      </span>
                      <p className="text-slate-600 bg-slate-50 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
                        {m.agenda}
                      </p>
                    </div>
                  )}

                  {/* Minutes */}
                  {m.minutes && (
                    <div className="mt-3 text-xs">
                      <span className="font-bold text-emerald-700 uppercase text-[10px] tracking-wide block mb-1">
                        Documented Minutes & Decisions
                      </span>
                      <p className="text-slate-700 bg-emerald-50/40 border border-emerald-100 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
                        {m.minutes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono text-[11px]">ID #{m.id}</span>
                  <span className="text-[11px]">Recorded {new Date(m.created_at).toLocaleDateString()}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Schedule / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMeeting ? 'Edit Meeting Record' : 'Schedule Client Meeting'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Meeting Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Q4 Deliverables Review & Scope Alignment"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Meeting Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.meeting_date}
                onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Related Project
              </label>
              <select
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">No Project Link</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} {p.client_name ? `(${p.client_name})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Meeting Agenda / Topics to Discuss
            </label>
            <textarea
              rows={3}
              placeholder="1. Review milestone progress&#10;2. Client feedback on mockup&#10;3. Next deployment timeline"
              value={formData.agenda}
              onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Documented Minutes & Action Items
            </label>
            <textarea
              rows={3}
              placeholder="Record decisions made, client sign-offs, and agreed next steps..."
              value={formData.minutes}
              onChange={(e) => setFormData({ ...formData, minutes: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
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
              {editingMeeting ? 'Update Record' : 'Schedule Meeting'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
