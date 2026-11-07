// src/pages/client/meetings/Meetings.jsx
// Client Portal - Meeting Records
// Displays past and upcoming meetings, agendas, and minutes for the client.

import { useState, useEffect, useCallback } from 'react';
import { getMeetings } from '../../../api/communication';

import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

import { Calendar, Clock, FileText, FolderOpen } from 'lucide-react';

export default function ClientMeetings() {
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState([]);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMeetings();
      const mData = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setMeetings(mData);
    } catch (err) {
      console.error('Failed to load meetings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meeting Records"
        subtitle="Review meeting schedules, agendas, and documented discussion minutes."
      />

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
          <Calendar className="mx-auto text-slate-300 mb-3" size={44} />
          <h3 className="text-base font-semibold text-slate-700">No Meetings Scheduled</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Status check-ins and client meetings recorded by your project manager will appear here.
          </p>
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
                    <p className="text-xs font-semibold text-slate-700 uppercase">Meeting Minutes</p>
                    <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap leading-relaxed">
                      {m.minutes}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
