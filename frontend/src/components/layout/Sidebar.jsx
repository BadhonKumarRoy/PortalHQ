// src/components/layout/Sidebar.jsx
// The navigation sidebar. Shows different menu items depending on user role.
// Admins see the full organization menu, Employees see their menu, Clients see theirs.

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, FolderOpen, CheckSquare, FileText,
  ClipboardCheck, Ticket, Megaphone, Calendar, Bell, Package,
  Archive, BarChart2, Settings, LogOut, ChevronDown, ChevronRight,
  Briefcase, X, Building2, ClipboardList,
} from 'lucide-react';

// ============================================================
// Navigation link definitions per role
// ============================================================
const ADMIN_NAV = [
  { label: 'Dashboard', path: '/organization/dashboard', icon: LayoutDashboard },
  { label: 'Clients', path: '/organization/clients', icon: Users },
  { label: 'Projects', path: '/organization/projects', icon: FolderOpen },
  { label: 'Milestones & Tasks', path: '/organization/milestones', icon: CheckSquare },
  { label: 'Documents', path: '/organization/documents', icon: FileText },
  { label: 'Approvals', path: '/organization/approvals', icon: ClipboardCheck, badge: 'approvals' },
  { label: 'Support Tickets', path: '/organization/tickets', icon: Ticket, badge: 'tickets' },
  {
    label: 'Communication',
    icon: Megaphone,
    // This item has sub-links instead of a direct path
    children: [
      { label: 'Announcements', path: '/organization/communication/announcements', icon: Megaphone },
      { label: 'Meeting Records', path: '/organization/communication/meetings', icon: Calendar },
      { label: 'Notifications', path: '/organization/communication/notifications', icon: Bell },
    ],
  },
  { label: 'Assets', path: '/organization/assets', icon: Package },
  { label: 'Inventory', path: '/organization/inventory', icon: Archive },
  { label: 'Reports', path: '/organization/reports', icon: BarChart2 },
  { label: 'Settings', path: '/organization/settings', icon: Settings },
];

const EMPLOYEE_NAV = [
  { label: 'Dashboard', path: '/employee/dashboard', icon: LayoutDashboard },
  { label: 'My Projects', path: '/employee/projects', icon: FolderOpen },
  { label: 'My Tasks', path: '/employee/tasks', icon: CheckSquare },
  { label: 'Documents', path: '/employee/documents', icon: FileText },
  { label: 'Tickets', path: '/employee/tickets', icon: Ticket },
  { label: 'Operations', path: '/employee/operations', icon: ClipboardList },
];

const CLIENT_NAV = [
  { label: 'Dashboard', path: '/client/dashboard', icon: LayoutDashboard },
  { label: 'My Projects', path: '/client/projects', icon: FolderOpen },
  { label: 'Documents', path: '/client/documents', icon: FileText },
  { label: 'Approvals', path: '/client/approvals', icon: ClipboardCheck },
  { label: 'Support Tickets', path: '/client/tickets', icon: Ticket },
  { label: 'Meetings', path: '/client/meetings', icon: Calendar },
  { label: 'Announcements', path: '/client/announcements', icon: Megaphone },
];

// Role labels and colors for the badge in the header
const ROLE_LABELS = {
  ADMIN: { label: 'Admin', color: '#36ADA3' },
  EMPLOYEE: { label: 'Staff', color: '#2F578A' },
  CLIENT: { label: 'Client', color: '#232F72' },
};

// ============================================================
// Individual nav link item
// ============================================================
function NavItem({ item, onClose }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = item.icon;

  // If this item has children, render as expandable group
  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-all duration-200 group"
        >
          <Icon size={18} className="shrink-0 text-white/60 group-hover:text-white" />
          <span className="flex-1 text-left font-medium">{item.label}</span>
          {expanded ? (
            <ChevronDown size={14} className="text-white/40" />
          ) : (
            <ChevronRight size={14} className="text-white/40" />
          )}
        </button>
        {/* Sub-menu items */}
        {expanded && (
          <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
            {item.children.map((child) => (
              <NavItem key={child.path} item={child} onClose={onClose} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Regular nav link
  return (
    <NavLink
      to={item.path}
      onClick={onClose}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-all duration-200 group
        ${isActive
          ? 'bg-secondary text-white border-l-2 border-accent font-semibold'
          : 'text-white/80 hover:bg-white/10 hover:text-white'
        }`
      }
    >
      <Icon size={18} className="shrink-0" />
      <span className="flex-1">{item.label}</span>
    </NavLink>
  );
}

// ============================================================
// Main Sidebar Component
// ============================================================
export default function Sidebar({ onClose }) {
  const { user, logout, isAdmin, isEmployee } = useAuth();
  const navigate = useNavigate();

  // Choose navigation items based on role
  const navItems = isAdmin ? ADMIN_NAV : isEmployee ? EMPLOYEE_NAV : CLIENT_NAV;
  const roleInfo = ROLE_LABELS[user?.role] || { label: 'User', color: '#36ADA3' };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Get user initials for the avatar
  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || user.email?.[0]?.toUpperCase()
    : '?';

  return (
    <div
      className="flex flex-col h-full w-64"
      style={{ background: '#121358' }}
    >
      {/* ---- LOGO AREA ---- */}
      <div className="flex items-center justify-between p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          {/* App icon image */}
          <img
            src="/logo.png"
            alt="PortalHQ"
            className="w-9 h-9 rounded-xl object-contain shadow-md"
          />
          <div>
            <div className="text-white font-bold text-lg leading-none">PortalHQ</div>
            {/* Role badge */}
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 inline-block"
              style={{ background: roleInfo.color, color: 'white' }}
            >
              {roleInfo.label}
            </span>
          </div>
        </div>
        {/* Close button (mobile only) */}
        <button
          onClick={onClose}
          className="lg:hidden text-white/60 hover:text-white p-1"
        >
          <X size={18} />
        </button>
      </div>

      {/* ---- NAVIGATION LINKS ---- */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map((item) => (
          <NavItem key={item.path || item.label} item={item} onClose={onClose} />
        ))}
      </nav>

      {/* ---- USER PROFILE SECTION at bottom ---- */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
          {/* Avatar circle with initials */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: '#36ADA3' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">
              {user?.first_name} {user?.last_name}
            </div>
            <div className="text-white/50 text-xs truncate">{user?.email}</div>
          </div>
          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="text-white/50 hover:text-red-400 transition-colors p-1"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
