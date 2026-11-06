// src/components/layout/Layout.jsx
// The main page layout wrapper used by all protected pages.
// Shows a sidebar on the left and the page content on the right.
// On mobile, the sidebar hides and a hamburger menu appears.

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  // Controls whether the mobile sidebar is open
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F8FAFC' }}>
      {/* ---- SIDEBAR ---- */}
      {/* On desktop: always visible. On mobile: only visible when sidebarOpen=true */}

      {/* Mobile backdrop overlay — clicking it closes the sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* The sidebar itself */}
      <div
        className={`
          fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0 lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* ---- MAIN CONTENT AREA ---- */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top header bar */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content — scrollable */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {/* Outlet renders whatever page component matches the current URL */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
