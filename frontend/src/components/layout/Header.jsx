// src/components/layout/Header.jsx
// The top bar that appears on every page.
// Shows the current page title, a search bar, notification bell, and user info.

import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, ChevronDown, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getNotifications } from '../../api/communication';

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

  // Determine the page title from the current URL
  const pageTitle = PAGE_TITLES[location.pathname] || 'PortalHQ';

  // Load unread notification count
  useEffect(() => {
    getNotifications()
      .then((res) => {
        const unread = res.data?.filter((n) => !n.is_read)?.length || 0;
        setUnreadCount(unread);
      })
      .catch(() => {}); // Silently ignore errors for the notification badge
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
        {/* Show badge if there are unread notifications */}
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
          className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: '#121358' }}
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
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 z-20 overflow-hidden">
              {/* User info */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="text-sm font-semibold text-slate-800">
                  {user?.full_name || 'User'}
                </div>
                <div className="text-xs text-slate-500 truncate">{user?.email}</div>
              </div>
              {/* Menu actions */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
