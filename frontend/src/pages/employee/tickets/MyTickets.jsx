// src/pages/employee/tickets/MyTickets.jsx
// Employee / Staff - Support Ticket Queue
// Staff can view customer tickets, update status, claim tickets, and reply to client inquiries.

import { useState, useEffect, useCallback } from 'react';
import { getTickets, updateTicket, getTicketComments, addComment } from '../../../api/tickets';
import { useAuth } from '../../../context/AuthContext';

import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

import {
  Ticket,
  MessageSquare,
  Search,
  UserCheck,
  Send,
  Calendar,
  FolderOpen,
  User,
  Clock,
} from 'lucide-react';

const STATUS_TABS = ['All', 'OPEN', 'IN_PROGRESS', 'WAITING_CLIENT', 'RESOLVED', 'CLOSED'];

export default function MyTickets() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Ticket discussion drawer / modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

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

  // Open ticket discussion
  const handleOpenTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setLoadingComments(true);
    try {
      const res = await getTicketComments(ticket.id);
      const cData = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setComments(cData);
    } catch (err) {
      console.error('Failed to load comments:', err);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  // Change ticket status
  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await updateTicket(ticketId, { status: newStatus });
      toast.success(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
      fetchTickets();
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update ticket status.');
    }
  };

  // Claim unassigned ticket
  const handleClaimTicket = async (ticket) => {
    try {
      await updateTicket(ticket.id, {
        assigned_to: user?.id,
        status: ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status,
      });
      toast.success('Ticket assigned to you!');
      if (selectedTicket && selectedTicket.id === ticket.id) {
        setSelectedTicket({
          ...selectedTicket,
          assigned_to: user?.id,
          assigned_to_name: user?.full_name,
        });
      }
      fetchTickets();
    } catch (err) {
      console.error('Failed to claim ticket:', err);
      toast.error('Failed to assign ticket.');
    }
  };

  // Post comment
  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTicket) return;

    setSendingComment(true);
    try {
      await addComment(selectedTicket.id, newComment.trim());
      setNewComment('');
      toast.success('Reply posted!');
      const res = await getTicketComments(selectedTicket.id);
      setComments(Array.isArray(res.data) ? res.data : res.data?.results || []);
    } catch (err) {
      console.error('Error posting comment:', err);
      toast.error('Failed to post reply.');
    } finally {
      setSendingComment(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesTab = activeTab === 'All' || t.status === activeTab;
    const matchesSearch =
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.client_name && t.client_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.project_title && t.project_title.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Ticket Queue"
        subtitle="Manage client requests, reply to questions, and resolve technical issues."
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
            placeholder="Search tickets or clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
          <Ticket className="mx-auto text-slate-300 mb-3" size={44} />
          <h3 className="text-base font-semibold text-slate-700">No Tickets in this View</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {searchQuery
              ? `No tickets match "${searchQuery}".`
              : 'All support inquiries in this category have been addressed.'}
          </p>
        </div>
      ) : (
        <Card className="divide-y divide-slate-100 overflow-hidden">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => handleOpenTicket(ticket)}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 cursor-pointer transition-colors group"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-mono font-semibold text-slate-400">
                    #{ticket.id}
                  </span>
                  <Badge status={ticket.status} />
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                      ticket.priority === 'CRITICAL'
                        ? 'bg-red-100 text-red-700'
                        : ticket.priority === 'HIGH'
                        ? 'bg-orange-100 text-orange-700'
                        : ticket.priority === 'LOW'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {ticket.priority}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {ticket.title}
                </h3>

                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 flex-wrap">
                  {ticket.client_name && (
                    <span className="font-semibold text-slate-700">
                      Client: {ticket.client_name}
                    </span>
                  )}
                  {ticket.project_title && (
                    <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                      <FolderOpen size={12} /> {ticket.project_title}
                    </span>
                  )}
                  <span>
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                  {ticket.assigned_to_name ? (
                    <span className="text-blue-600 font-medium">
                      Staff: {ticket.assigned_to_name}
                    </span>
                  ) : (
                    <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">
                      Unassigned
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                {!ticket.assigned_to && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-xs !bg-blue-50 text-blue-700 hover:!bg-blue-100 border-none"
                    icon={UserCheck}
                    onClick={() => handleClaimTicket(ticket)}
                  >
                    Assign to Me
                  </Button>
                )}

                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="WAITING_CLIENT">Waiting for Client</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-blue-600 hover:bg-blue-50"
                  icon={MessageSquare}
                  onClick={() => handleOpenTicket(ticket)}
                >
                  Discussion
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Discussion Modal */}
      <Modal
        open={Boolean(selectedTicket)}
        onClose={() => setSelectedTicket(null)}
        title={selectedTicket ? `Ticket #${selectedTicket.id}: ${selectedTicket.title}` : ''}
      >
        {selectedTicket && (
          <div className="space-y-4 max-h-[75vh] flex flex-col">
            {/* Ticket Header summary */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge status={selectedTicket.status} />
                  <span className="font-semibold text-slate-700">
                    Client: {selectedTicket.client_name || 'N/A'}
                  </span>
                </div>
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                  className="px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg font-medium"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="WAITING_CLIENT">Waiting for Client</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              {selectedTicket.description && (
                <p className="text-slate-600 pt-1 leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.description}
                </p>
              )}
            </div>

            {/* Comments Thread */}
            <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Discussion History ({comments.length})
              </h4>

              {loadingComments ? (
                <div className="py-6 flex justify-center">
                  <LoadingSpinner size="sm" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  No replies posted yet. Send a response below.
                </p>
              ) : (
                comments.map((c) => {
                  const isMe = c.author === user?.id;
                  return (
                    <div
                      key={c.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-0.5">
                        <span className="font-semibold text-slate-700">
                          {isMe ? 'You (Staff)' : c.author_name || 'Client'}
                        </span>
                        <span>•</span>
                        <span>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div
                        className={`p-3 rounded-xl text-xs whitespace-pre-wrap max-w-md ${
                          isMe
                            ? 'bg-[#121358] text-white rounded-tr-none'
                            : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                        }`}
                      >
                        {c.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Post Reply */}
            <form onSubmit={handleSendComment} className="pt-3 border-t border-slate-100 flex gap-2 shrink-0">
              <input
                type="text"
                placeholder="Write a response to the client..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                icon={Send}
                loading={sendingComment}
                disabled={!newComment.trim()}
                className="!bg-[#121358]"
              >
                Reply
              </Button>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
