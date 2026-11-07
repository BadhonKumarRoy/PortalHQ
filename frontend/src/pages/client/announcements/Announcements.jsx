// src/pages/client/announcements/Announcements.jsx
// Client Portal - Announcements & Broadcasts
// Displays company-wide and client-specific updates, releases, and announcements.

import { useState, useEffect, useCallback } from 'react';
import { getAnnouncements } from '../../../api/communication';

import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

import { Megaphone, Calendar, User } from 'lucide-react';

export default function ClientAnnouncements() {
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAnnouncements();
      const aData = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setAnnouncements(aData);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Announcements"
        subtitle="Important organizational updates, release notes, and holiday schedules."
      />

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
          <Megaphone className="mx-auto text-slate-300 mb-3" size={44} />
          <h3 className="text-base font-semibold text-slate-700">No Announcements</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            There are no recent announcements broadcast to clients at this time.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <Card key={a.id} className="p-6">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Megaphone size={16} />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">{a.title}</h3>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
                  <Calendar size={13} />
                  <span>{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="pt-2 pl-10 text-xs sm:text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                {a.content}
              </div>

              {a.created_by_name && (
                <div className="pl-10 mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-400">
                  <User size={12} />
                  <span>Posted by {a.created_by_name}</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
