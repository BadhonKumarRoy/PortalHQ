// src/pages/employee/operations/Operations.jsx
// Employee / Staff - Operations, Meetings & IT Assets
// Allows staff to record client meetings, review agendas, and track assigned hardware/assets.

import { useState, useEffect, useCallback } from 'react';
import { getMeetings, createMeeting } from '../../../api/communication';
import { getAssets } from '../../../api/assets';
import { getProjects } from '../../../api/projects';

import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

import {
  Calendar,
  Package,
  Plus,
  Clock,
  Laptop,
  CheckCircle2,
  FolderOpen,
  FileText,
} from 'lucide-react';

export default function Operations() {
  const [activeTab, setActiveTab] = useState('meetings');
  const [loading, setLoading] = useState(true);

  const [meetings, setMeetings] = useState([]);
  const [assets, setAssets] = useState([]);
  const [projects, setProjects] = useState([]);

  // Meeting modal state
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [submittingMeeting, setSubmittingMeeting] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    project: '',
    meeting_date: '',
    agenda: '',
    minutes: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [meetRes, assetRes, projRes] = await Promise.allSettled([
        getMeetings(),
        getAssets(),
        getProjects(),
      ]);

      if (meetRes.status === 'fulfilled') {
        const mData = Array.isArray(meetRes.value.data)
          ? meetRes.value.data
          : meetRes.value.data?.results || [];
        setMeetings(mData);
      }

      if (assetRes.status === 'fulfilled') {
        const aData = Array.isArray(assetRes.value.data)
          ? assetRes.value.data
          : assetRes.value.data?.results || [];
        setAssets(aData);
      }

      if (projRes.status === 'fulfilled') {
        const pData = Array.isArray(projRes.value.data)
          ? projRes.value.data
          : projRes.value.data?.results || [];
        setProjects(pData);
      }
    } catch (err) {
      console.error('Failed to load operations data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    if (!meetingForm.title.trim()) {
      toast.error('Meeting title is required.');
      return;
    }

    setSubmittingMeeting(true);
    try {
      await createMeeting({
        title: meetingForm.title.trim(),
        project: meetingForm.project ? Number(meetingForm.project) : null,
        meeting_date: meetingForm.meeting_date || null,
        agenda: meetingForm.agenda.trim(),
        minutes: meetingForm.minutes.trim(),
      });
      toast.success('Meeting scheduled successfully!');
      setMeetingModalOpen(false);
      setMeetingForm({ title: '', project: '', meeting_date: '', agenda: '', minutes: '' });
      fetchData();
    } catch (err) {
      console.error('Failed to create meeting:', err);
      toast.error('Failed to schedule meeting.');
    } finally {
      setSubmittingMeeting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations & Logistics"
        subtitle="Schedule client meetings, document agendas, and review assigned IT hardware."
        action={
          activeTab === 'meetings' && (
            <Button
              variant="primary"
              icon={Plus}
              className="!bg-[#121358] hover:!bg-[#2F578A]"
              onClick={() => setMeetingModalOpen(true)}
            >
              Schedule Meeting
            </Button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('meetings')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'meetings'
              ? 'bg-[#121358] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar size={14} /> Client Meetings ({meetings.length})
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'assets'
              ? 'bg-[#121358] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package size={14} /> Assigned IT Assets ({assets.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : activeTab === 'meetings' ? (
        /* Meetings Tab */
        meetings.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
            <Calendar className="mx-auto text-slate-300 mb-3" size={44} />
            <h3 className="text-base font-semibold text-slate-700">No Meetings Scheduled</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Schedule your first check-in or delivery review meeting with a client.
            </p>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              className="!bg-[#121358]"
              onClick={() => setMeetingModalOpen(true)}
            >
              Schedule Meeting
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {meetings.map((m) => (
              <Card key={m.id} className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                      <Calendar size={13} />{' '}
                      {m.meeting_date
                        ? new Date(m.meeting_date).toLocaleString()
                        : 'Date to be announced'}
                    </span>
                    {m.project_title && (
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                        {m.project_title}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-800 mb-2">{m.title}</h3>

                  {m.agenda && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Agenda</p>
                      <p className="text-xs text-slate-600 mt-0.5 whitespace-pre-wrap leading-relaxed">
                        {m.agenda}
                      </p>
                    </div>
                  )}

                  {m.minutes && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
                      <p className="text-xs font-semibold text-slate-700 uppercase">Discussion Minutes</p>
                      <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap leading-relaxed">
                        {m.minutes}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )
      ) : (
        /* Assets Tab */
        assets.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
            <Laptop className="mx-auto text-slate-300 mb-3" size={44} />
            <h3 className="text-base font-semibold text-slate-700">No Assigned Equipment</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              No hardware laptops or IT assets are currently assigned under your custody.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {assets.map((asset) => (
              <Card key={asset.id} className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <Laptop size={20} />
                  </div>
                  <Badge status={asset.status || 'ACTIVE'} />
                </div>

                <h3 className="text-sm font-bold text-slate-800 mb-1">{asset.name}</h3>
                <p className="text-xs font-mono text-slate-400 mb-3">
                  Tag: {asset.asset_tag || `#${asset.id}`}
                </p>

                <div className="space-y-1 text-xs text-slate-500 border-t border-slate-100 pt-3">
                  {asset.category && (
                    <p>
                      Category: <strong>{asset.category}</strong>
                    </p>
                  )}
                  {asset.serial_number && (
                    <p>
                      Serial: <span className="font-mono">{asset.serial_number}</span>
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Schedule Meeting Modal */}
      <Modal
        open={meetingModalOpen}
        onClose={() => setMeetingModalOpen(false)}
        title="Schedule Client Meeting"
      >
        <form onSubmit={handleCreateMeeting} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Meeting Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Weekly Sprint Review with Client"
              value={meetingForm.title}
              onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Related Project
              </label>
              <select
                value={meetingForm.project}
                onChange={(e) => setMeetingForm({ ...meetingForm, project: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">No Project Link</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Meeting Date & Time
              </label>
              <input
                type="datetime-local"
                value={meetingForm.meeting_date}
                onChange={(e) => setMeetingForm({ ...meetingForm, meeting_date: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Agenda & Topics
            </label>
            <textarea
              rows={3}
              placeholder="Key discussion topics, demo agenda..."
              value={meetingForm.agenda}
              onChange={(e) => setMeetingForm({ ...meetingForm, agenda: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Minutes & Action Items (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Decisions made, next steps..."
              value={meetingForm.minutes}
              onChange={(e) => setMeetingForm({ ...meetingForm, minutes: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setMeetingModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submittingMeeting}
              className="!bg-[#121358]"
            >
              Schedule Meeting
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
