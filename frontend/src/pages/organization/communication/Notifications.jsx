// src/pages/organization/communication/Notifications.jsx
// Organization Admin - System Notifications & Alerts
// Manage alerts, send direct messages to clients or staff, and track read states.

import { useState, useEffect, useCallback } from 'react';
import {
  getNotifications,
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../../../api/communication';
import { getUsers } from '../../../api/auth';

import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import StatCard from '../../../components/ui/StatCard';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

import {
  Bell,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  CheckCheck,
  Search,
  User,
  Send,
  AlertCircle,
} from 'lucide-react';

const FILTER_TABS = ['All', 'Unread', 'Read'];

export default function Notifications() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);

  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Send Notification Modal
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    recipient: '',
    title: '',
    message: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [notifRes, userRes] = await Promise.allSettled([
        getNotifications(),
        getUsers(),
      ]);

      if (notifRes.status === 'fulfilled') {
        const nData = Array.isArray(notifRes.value.data)
          ? notifRes.value.data
          : notifRes.value.data?.results || [];
        setNotifications(nData);
      }

      if (userRes.status === 'fulfilled') {
        const uData = Array.isArray(userRes.value.data)
          ? userRes.value.data
          : userRes.value.data?.results || [];
        setUsers(uData);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
      toast.error('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Mark single as read
  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      toast.success('Notification marked as read.');
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Mark read error:', err);
      toast.error('Failed to update notification.');
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      toast.success('All notifications marked as read.');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Mark all read error:', err);
      toast.error('Failed to mark all as read.');
    }
  };

  // Send new notification
  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!formData.recipient) {
      toast.error('Please select a recipient user.');
      return;
    }
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Title and message are required.');
      return;
    }

    setSubmitting(true);
    try {
      await createNotification({
        recipient: Number(formData.recipient),
        title: formData.title.trim(),
        message: formData.message.trim(),
        is_read: false,
      });
      toast.success('Notification dispatched successfully!');
      setSendModalOpen(false);
      setFormData({ recipient: '', title: '', message: '' });
      fetchData();
    } catch (err) {
      console.error('Send notification error:', err);
      toast.error('Failed to dispatch notification.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete notification
  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      toast.success('Notification removed.');
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete notification.');
    }
  };

  // Filter
  const filteredNotifs = notifications.filter((n) => {
    const matchesTab =
      activeTab === 'All'
        ? true
        : activeTab === 'Unread'
        ? !n.is_read
        : n.is_read;

    const matchesSearch =
      !searchQuery ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.recipient_name && n.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTab && matchesSearch;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const readCount = notifications.filter((n) => n.is_read).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Notifications"
        subtitle="Review platform activity alerts, send notifications, and manage read states."
        action={
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="secondary"
                icon={CheckCheck}
                onClick={handleMarkAllRead}
              >
                Mark All as Read
              </Button>
            )}
            <Button
              variant="primary"
              icon={Plus}
              className="!bg-[#121358] hover:!bg-[#2F578A]"
              onClick={() => setSendModalOpen(true)}
            >
              Send Notification
            </Button>
          </div>
        }
      />

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Notifications"
          value={notifications.length}
          icon={Bell}
          color="#121358"
          loading={loading}
          change="System Alerts & Messages"
        />
        <StatCard
          title="Unread Alerts"
          value={unreadCount}
          icon={AlertCircle}
          color="#f59e0b"
          loading={loading}
          change={unreadCount > 0 ? 'Requires attention' : 'All caught up'}
        />
        <StatCard
          title="Read History"
          value={readCount}
          icon={CheckCircle2}
          color="#36ADA3"
          loading={loading}
          change="Acknowledged Alerts"
        />
        <StatCard
          title="Registered Users"
          value={users.length}
          icon={User}
          color="#2F578A"
          loading={loading}
          change="Clients, Staff & Admins"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        {/* Status Tabs */}
        <div className="flex gap-1">
          {FILTER_TABS.map((tab) => (
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
                ? `All (${notifications.length})`
                : tab === 'Unread'
                ? `Unread (${unreadCount})`
                : `Read (${readCount})`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search alerts or recipients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredNotifs.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
          <Bell className="mx-auto text-slate-300 mb-3" size={44} />
          <h3 className="text-base font-semibold text-slate-700">No Notifications</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery
              ? `No alerts match "${searchQuery}".`
              : 'There are no notifications in this view.'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={() => setSendModalOpen(true)}
          >
            Send Notification
          </Button>
        </div>
      ) : (
        <Card className="divide-y divide-slate-100 overflow-hidden">
          {filteredNotifs.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex items-start justify-between gap-4 transition ${
                n.is_read ? 'bg-white hover:bg-slate-50/60' : 'bg-blue-50/30 hover:bg-blue-50/50'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    n.is_read
                      ? 'bg-slate-100 text-slate-400'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  <Bell size={16} />
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4
                      className={`text-sm ${
                        n.is_read ? 'font-medium text-slate-700' : 'font-bold text-slate-900'
                      }`}
                    >
                      {n.title}
                    </h4>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                    )}
                  </div>

                  <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap leading-relaxed">
                    {n.message}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                    {n.recipient_name && (
                      <span className="font-semibold text-slate-600">
                        To: {n.recipient_name}
                      </span>
                    )}
                    <span>
                      {new Date(n.created_at).toLocaleString([], {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!n.is_read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-blue-600 hover:text-blue-800"
                    onClick={() => handleMarkRead(n.id)}
                  >
                    Mark Read
                  </Button>
                )}
                <button
                  onClick={() => handleDelete(n.id)}
                  className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Delete Alert"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Send Notification Modal */}
      <Modal
        open={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
        title="Send Notification to User"
      >
        <form onSubmit={handleSendNotification} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Select Recipient <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.recipient}
              onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              required
            >
              <option value="">Select a user (Client or Employee)...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.role} — {u.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Notification Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Milestone 2 Deliverable has been published"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Notification Message <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Detailed message alert..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setSendModalOpen(false)}
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
              Dispatch Notification
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
