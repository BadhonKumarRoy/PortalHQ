// src/components/layout/Header.jsx
// The top bar that appears on every page for all roles (Admin, Employee, Client).
// Shows page title, notifications, and user dropdown with 'Change Password' and 'Sign Out'.

import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, ChevronDown, LogOut, KeyRound, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getNotifications } from '../../api/communication';
import { changePassword } from '../../api/auth';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

// Maps URL paths to human-readable page titles
const PAGE_TITLES = {
  '/organization/dashboard': 'Dashboard',
  '/organization/clients': 'Clients',
  '/organization/clients/new': 'Add Client',
  '/organization/projects': 'Projects',
  '/organization/projects/new': 'Create Project',
  '/organization/milestones': 'Milestones & Tasks',
  '/organization/documents': 'Documents',
  '/organization/approvals': 'Approvals',
  '/organization/tickets': 'Support Tickets',
  '/organization/tickets/new': 'Create Ticket',
  '/organization/communication/announcements': 'Announcements',
  '/organization/communication/meetings': 'Meeting Records',
  '/organization/communication/notifications': 'Notifications',
  '/organization/assets': 'Asset Management',
  '/organization/assets/new': 'Register Asset',
  '/organization/inventory': 'Inventory',
  '/organization/reports': 'Reports & Audit',
  '/organization/settings': 'Settings',
  '/employee/dashboard': 'Dashboard',
  '/employee/projects': 'My Projects',
  '/employee/tasks': 'My Tasks',
  '/employee/documents': 'Documents',
  '/employee/tickets': 'My Tickets',
  '/employee/operations': 'Operations',
  '/client/dashboard': 'Dashboard',
  '/client/projects': 'My Projects',
  '/client/documents': 'Documents',
  '/client/approvals': 'Approvals',
  '/client/tickets': 'Support Tickets',
  '/client/tickets/new': 'Create Ticket',
  '/client/meetings': 'Meetings',
  '/client/announcements': 'Announcements',
};

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Change Password Modal State
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  // Determine the page title from the current URL
  const pageTitle = PAGE_TITLES[location.pathname] || 'PortalHQ';

  // Load unread notification count
  useEffect(() => {
    getNotifications()
      .then((res) => {
        const unread = res.data?.filter((n) => !n.is_read)?.length || 0;
        setUnreadCount(unread);
      })
      .catch(() => {});
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  /** Handle password change submission */
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!passwordForm.old_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(passwordForm);
      toast.success('Your password has been changed successfully!');
      setPasswordModalOpen(false);
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      const data = err.response?.data;
      let msg = 'Failed to change password. Please check your current password.';
      if (data) {
        if (data.old_password) msg = data.old_password[0];
        else if (data.new_password) msg = data.new_password[0];
        else if (data.confirm_password) msg = data.confirm_password[0];
        else if (data.non_field_errors) msg = data.non_field_errors[0];
        else if (data.detail) msg = data.detail;
      }
      setPasswordError(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Get user initials for the avatar
  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : (user?.email?.[0] || '?').toUpperCase();

  // Determine notification path based on role
  const notifPath =
    user?.role === 'ADMIN' ? '/organization/communication/notifications' : '#';

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-100 flex items-center px-4 lg:px-6 gap-4 shrink-0 shadow-sm z-10">
        {/* Hamburger menu button — only visible on mobile */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* Page title */}
        <h1 className="text-lg font-semibold text-slate-800 hidden sm:block">{pageTitle}</h1>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search bar */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-56">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-sm text-slate-600 outline-none w-full placeholder-slate-400"
          />
        </div>

        {/* Notification bell */}
        <button
          onClick={() => navigate(notifPath)}
          className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User menu dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
              style={{ background: user?.is_superuser ? '#D97706' : '#121358' }}
            >
              {initials}
            </div>
            <span className="hidden sm:block text-sm font-medium text-slate-700">
              {user?.full_name || user?.email || 'User'}
            </span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {/* Dropdown menu */}
          {userMenuOpen && (
            <>
              {/* Click outside to close */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 z-20 overflow-hidden divide-y divide-slate-100 animate-in fade-in duration-100">
                {/* User info */}
                <div className="px-4 py-3">
                  <div className="text-sm font-semibold text-slate-800 truncate">
                    {user?.full_name || 'User'}
                  </div>
                  <div className="text-xs text-slate-400 truncate">{user?.email}</div>
                  <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {user?.role === 'ADMIN' ? '👑 Admin' : user?.role === 'EMPLOYEE' ? '💼 Staff' : '🤝 Client'}
                  </span>
                </div>

                {/* Menu actions */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      setPasswordError('');
                      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
                      setPasswordModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <KeyRound size={14} className="text-slate-400" />
                    Change Password
                  </button>
                </div>

                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition cursor-pointer"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ── MODAL: CHANGE PASSWORD (Available to Admins, Employees & Clients) ── */}
      <Modal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="Change Your Password"
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Update your account password. Must be at least 8 characters long.
          </p>

          {passwordError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {passwordError}
            </div>
          )}

          <Input
            label="Current Password *"
            type="password"
            value={passwordForm.old_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
            placeholder="Enter current password"
            required
          />

          <Input
            label="New Password *"
            type="password"
            value={passwordForm.new_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
            placeholder="At least 8 characters"
            required
          />

          <Input
            label="Confirm New Password *"
            type="password"
            value={passwordForm.confirm_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
            placeholder="Re-enter new password"
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setPasswordModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={passwordLoading}>
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
