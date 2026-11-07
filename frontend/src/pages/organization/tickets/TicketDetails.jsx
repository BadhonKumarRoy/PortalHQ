// src/pages/organization/tickets/TicketDetails.jsx
// Organization Admin - Ticket Details & Threaded Discussion
// Full ticket view: reassign engineers, change lifecycle status, and reply to client inquiries.

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTicket, getTicketComments, addComment, updateTicket } from '../../../api/tickets';
import { getUsers } from '../../../api/auth';
import { useAuth } from '../../../context/AuthContext';

import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

import {
  ArrowLeft,
  Calendar,
  FolderOpen,
  Send,
  User,
  MessageSquare,
  Clock,
  Building2,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';

export default function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);

  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchTicketData = useCallback(async () => {
    try {
      const [ticketRes, commentRes, usersRes] = await Promise.allSettled([
        getTicket(id),
        getTicketComments(id),
        getUsers(),
      ]);

      if (ticketRes.status === 'fulfilled') {
        setTicket(ticketRes.value.data);
      }

      if (commentRes.status === 'fulfilled') {
        const cData = Array.isArray(commentRes.value.data)
          ? commentRes.value.data
          : commentRes.value.data?.results || [];
        setComments(cData);
      } else if (ticketRes.status === 'fulfilled' && ticketRes.value.data.comments) {
        setComments(ticketRes.value.data.comments);
      }

      if (usersRes.status === 'fulfilled') {
        const uData = Array.isArray(usersRes.value.data)
          ? usersRes.value.data
          : usersRes.value.data?.results || [];
        setStaffUsers(uData.filter((u) => u.role === 'ADMIN' || u.role === 'EMPLOYEE'));
      }
    } catch (err) {
      console.error('Failed to load ticket:', err);
      toast.error('Failed to load ticket details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicketData();
  }, [fetchTicketData]);

  // Update status or assignee
  const handleUpdate = async (field, value) => {
    setUpdatingStatus(true);
    try {
      await updateTicket(id, { [field]: value });
      toast.success('Ticket updated!');
      fetchTicketData();
    } catch (err) {
      console.error('Update error:', err);
      toast.error('Failed to update ticket.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Post comment
  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSendingComment(true);
    try {
      await addComment(id, newComment.trim());
      setNewComment('');
      toast.success('Reply posted!');
      const res = await getTicketComments(id);
      setComments(Array.isArray(res.data) ? res.data : res.data?.results || []);
    } catch (err) {
      console.error('Reply error:', err);
      toast.error('Failed to post reply.');
    } finally {
      setSendingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800">Ticket Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          This support ticket does not exist or has been removed.
        </p>
        <Button variant="primary" onClick={() => navigate('/organization/tickets')}>
          Back to Ticket Queue
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/organization/tickets')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft size={14} /> Back to Ticket Queue
        </button>

        <span className="text-xs font-mono font-semibold text-slate-400">
          TICKET #{ticket.id}
        </span>
      </div>

      {/* Ticket Header & Status Management */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge status={ticket.status} />
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded font-bold ${
                  ticket.priority === 'CRITICAL'
                    ? 'bg-red-100 text-red-700'
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
            <h1 className="text-xl font-bold text-slate-900">{ticket.title}</h1>
          </div>

          {/* Quick Status and Assignment Controls */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Status:</span>
              <select
                value={ticket.status}
                onChange={(e) => handleUpdate('status', e.target.value)}
                disabled={updatingStatus}
                className="px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg font-semibold"
              >
                <option value="OPEN">Open</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="WAITING_CLIENT">Waiting for Client</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Assignee:</span>
              <select
                value={ticket.assigned_to || ''}
                onChange={(e) =>
                  handleUpdate('assigned_to', e.target.value ? Number(e.target.value) : null)
                }
                disabled={updatingStatus}
                className="px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg font-semibold"
              >
                <option value="">Unassigned</option>
                {staffUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Context metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-4 border-b border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Client Organization</span>
            <strong className="text-slate-800">{ticket.client_name || 'Internal'}</strong>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Project</span>
            <strong className="text-slate-800">{ticket.project_title || 'General'}</strong>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Submitted On</span>
            <strong className="text-slate-800">
              {new Date(ticket.created_at).toLocaleString()}
            </strong>
          </div>
        </div>

        {/* Issue Description */}
        <div className="pt-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
            Inquiry Description
          </h3>
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
            {ticket.description}
          </p>
        </div>
      </Card>

      {/* Threaded Discussion */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <MessageSquare size={16} className="text-blue-600" /> Discussion History ({comments.length})
          </h2>
          {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
            <Button
              variant="secondary"
              size="sm"
              icon={CheckCircle2}
              className="text-xs !bg-emerald-50 text-emerald-700 hover:!bg-emerald-100 border-none"
              onClick={() => handleUpdate('status', 'RESOLVED')}
            >
              Mark as Resolved
            </Button>
          )}
        </div>

        {comments.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 italic">
            No replies yet in this thread. Post a response below.
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {comments.map((comment) => {
              const isMe = comment.author === user?.id;

              return (
                <div
                  key={comment.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-xs text-slate-400">
                    <span className="font-semibold text-slate-700">
                      {isMe ? 'You (Admin)' : comment.author_name || 'Participant'}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(comment.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div
                    className={`max-w-xl p-3.5 rounded-2xl text-xs sm:text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${
                      isMe
                        ? 'bg-[#121358] text-white rounded-tr-none'
                        : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                    }`}
                  >
                    {comment.content}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Post Reply */}
        <form onSubmit={handleSendComment} className="pt-4 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
            Reply to Ticket
          </label>
          <div className="flex gap-2">
            <textarea
              rows={2}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write an update or reply to the client..."
              className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition resize-none"
            />
            <Button
              type="submit"
              variant="primary"
              icon={Send}
              loading={sendingComment}
              disabled={!newComment.trim()}
              className="!bg-[#121358] hover:!bg-[#2F578A] shrink-0 self-end px-4"
            >
              Send Reply
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
