// src/pages/client/tickets/TicketList.jsx
// Client Portal - Support Tickets List
// Lists tickets submitted by this client with status filters, search, and a create ticket button.

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTickets } from '../../../api/tickets';

import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

import {
  Ticket,
  Plus,
  Search,
  MessageSquare,
  Calendar,
  FolderOpen,
  ArrowRight,
} from 'lucide-react';

const STATUS_TABS = ['All', 'OPEN', 'IN_PROGRESS', 'WAITING_CLIENT', 'RESOLVED', 'CLOSED'];

export default function ClientTicketList() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTickets();
      const tData = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setTickets(tData);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filteredTickets = tickets.filter((t) => {
    const matchesTab = activeTab === 'All' || t.status === activeTab;
    const matchesSearch =
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.project_title && t.project_title.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Tickets"
        subtitle="Submit technical inquiries, project change requests, or track open issues."
        action={
          <Button
            variant="primary"
            icon={Plus}
            className="!bg-[#121358] hover:!bg-[#2F578A]"
            onClick={() => navigate('/client/tickets/new')}
          >
            Submit New Ticket
          </Button>
        }
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
              {tab === 'All' ? 'All Tickets' : tab.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Ticket List */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
          <Ticket className="mx-auto text-slate-300 mb-3" size={44} />
          <h3 className="text-base font-semibold text-slate-700">No Support Tickets</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery
              ? `No tickets match "${searchQuery}".`
              : "You haven't submitted any support requests yet. Have a question or request?"}
          </p>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            className="!bg-[#121358]"
            onClick={() => navigate('/client/tickets/new')}
          >
            Create Your First Ticket
          </Button>
        </div>
      ) : (
        <Card className="divide-y divide-slate-100 overflow-hidden">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => navigate(`/client/tickets/${ticket.id}`)}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 cursor-pointer transition-colors group"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-mono font-semibold text-slate-400">
                    #{ticket.id}
                  </span>
                  <Badge status={ticket.status} />
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                      ticket.priority === 'CRITICAL'
                        ? 'bg-red-100 text-red-700 font-bold'
                        : ticket.priority === 'HIGH'
                        ? 'bg-orange-100 text-orange-700'
                        : ticket.priority === 'LOW'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {ticket.priority} Priority
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {ticket.title}
                </h3>

                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                  {ticket.project_title && (
                    <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                      <FolderOpen size={12} /> {ticket.project_title}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={12} /> {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                  {ticket.assigned_to_name && (
                    <span>Assigned to: {ticket.assigned_to_name}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-blue-600 group-hover:text-blue-800 group-hover:bg-blue-50"
                >
                  View Discussion <ArrowRight size={13} className="ml-1 inline" />
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
