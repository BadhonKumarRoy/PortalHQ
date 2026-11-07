// src/pages/client/tickets/TicketDetails.jsx
// Client Portal - Support Ticket Details & Discussion Thread
// Allows the client to view conversation updates and reply directly to agency staff.

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTicket, getTicketComments, addComment } from '../../../api/tickets';
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
  ShieldCheck,
} from 'lucide-react';

export default function ClientTicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);

  const fetchTicketData = useCallback(async () => {
    try {
      const [ticketRes, commentRes] = await Promise.allSettled([
        getTicket(id),
        getTicketComments(id),
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
    } catch (err) {
      console.error('Failed to load ticket details:', err);
      toast.error('Failed to load support ticket.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicketData();
  }, [fetchTicketData]);

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSending(true);
    try {
      await addComment(id, newComment.trim());
      setNewComment('');
      toast.success('Reply posted!');
      fetchTicketData();
    } catch (err) {
      console.error('Error adding comment:', err);
      toast.error('Failed to send reply.');
    } finally {
      setSending(false);
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
          This support request does not exist or you do not have permission to view it.
        </p>
        <Button variant="primary" onClick={() => navigate('/client/tickets')}>
          Back to Support Tickets
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/client/tickets')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft size={14} /> Back to Support Tickets
        </button>

        <span className="text-xs font-mono font-semibold text-slate-400">
          Ticket #{ticket.id}
        </span>
      </div>

      {/* Ticket Header & Description */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
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
                {ticket.priority} Priority
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">{ticket.title}</h1>
          </div>

          <div className="flex flex-col gap-1 text-xs text-slate-400 shrink-0">
            <span className="inline-flex items-center gap-1">
              <Calendar size={13} /> {new Date(ticket.created_at).toLocaleString()}
            </span>
            {ticket.project_title && (
              <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                <FolderOpen size={13} /> {ticket.project_title}
              </span>
            )}
          </div>
        </div>

        {/* Initial Ticket Inquiry */}
        <div className="pt-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
            Inquiry Description
          </h3>
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
            {ticket.description}
          </p>
        </div>
      </Card>

      {/* Conversation Thread */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <MessageSquare size={16} className="text-blue-600" /> Discussion & Updates ({comments.length})
          </h2>
          {ticket.assigned_to_name && (
            <span className="text-xs text-slate-500">
              Assigned Specialist:{' '}
              <strong className="text-slate-800">{ticket.assigned_to_name}</strong>
            </span>
          )}
        </div>

        {comments.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 italic">
            No responses yet. An engineer will reply shortly.
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {comments.map((comment) => {
              const isMe = comment.author === user?.id;

              return (
                <div
                  key={comment.id}
                  className={`flex flex-col ${
                    isMe ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1 text-xs text-slate-400">
                    <span className="font-semibold text-slate-700">
                      {isMe ? 'You' : comment.author_name || 'Support Staff'}
                    </span>
                    <span>•</span>
                    <span>{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div
                    className={`max-w-xl p-3.5 rounded-2xl text-xs sm:text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${
                      isMe
                        ? 'bg-[#121358] text-white rounded-tr-none'
                        : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/60'
                    }`}
                  >
                    {comment.content}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reply Box */}
        <form onSubmit={handleSendComment} className="pt-4 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
            Write a Reply
          </label>
          <div className="flex gap-2">
            <textarea
              rows={2}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Type your message or update..."
              className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition resize-none"
            />
            <Button
              type="submit"
              variant="primary"
              icon={Send}
              loading={sending}
              disabled={!newComment.trim()}
              className="!bg-[#121358] hover:!bg-[#2F578A] shrink-0 self-end px-4"
            >
              Send
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
