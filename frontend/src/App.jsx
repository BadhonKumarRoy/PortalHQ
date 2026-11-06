// src/App.jsx
// The root of the application. Sets up routing for all pages.
// Decides which page to show based on the URL and whether the user is logged in.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// --- Auth Pages ---
import Login from './pages/auth/Login';

// --- Layout ---
import Layout from './components/layout/Layout';

// --- Organization Pages ---
import OrgDashboard from './pages/organization/Dashboard';
import ClientList from './pages/organization/clients/ClientList';
import ClientAdd from './pages/organization/clients/ClientAdd';
import ClientEdit from './pages/organization/clients/ClientEdit';
import ClientDetails from './pages/organization/clients/ClientDetails';
import ProjectList from './pages/organization/projects/ProjectList';
import ProjectCreate from './pages/organization/projects/ProjectCreate';
import ProjectDetails from './pages/organization/projects/ProjectDetails';
import MilestoneList from './pages/organization/milestones/MilestoneList';
import DocumentList from './pages/organization/documents/DocumentList';
import ApprovalList from './pages/organization/approvals/ApprovalList';
import ApprovalDetails from './pages/organization/approvals/ApprovalDetails';
import TicketList from './pages/organization/tickets/TicketList';
import TicketCreate from './pages/organization/tickets/TicketCreate';
import TicketDetails from './pages/organization/tickets/TicketDetails';
import Announcements from './pages/organization/communication/Announcements';
import Meetings from './pages/organization/communication/Meetings';
import Notifications from './pages/organization/communication/Notifications';
import AssetList from './pages/organization/assets/AssetList';
import AssetRegister from './pages/organization/assets/AssetRegister';
import AssetDetails from './pages/organization/assets/AssetDetails';
import InventoryDashboard from './pages/organization/inventory/InventoryDashboard';
import ReportsDashboard from './pages/organization/reports/ReportsDashboard';
import Settings from './pages/organization/settings/Settings';

// --- Employee Pages ---
import EmployeeDashboard from './pages/employee/Dashboard';
import MyProjects from './pages/employee/projects/MyProjects';
import MyTasks from './pages/employee/tasks/MyTasks';
import MyDocuments from './pages/employee/documents/MyDocuments';
import MyTickets from './pages/employee/tickets/MyTickets';
import Operations from './pages/employee/operations/Operations';

// --- Client Pages ---
import ClientDashboard from './pages/client/Dashboard';
import ClientProjects from './pages/client/projects/MyProjects';
import ClientProjectDetails from './pages/client/projects/ProjectDetails';
import ClientDocuments from './pages/client/documents/Documents';
import ClientApprovals from './pages/client/approvals/Approvals';
import ClientTicketList from './pages/client/tickets/TicketList';
import ClientTicketCreate from './pages/client/tickets/TicketCreate';
import ClientTicketDetails from './pages/client/tickets/TicketDetails';
import ClientMeetings from './pages/client/meetings/Meetings';
import ClientAnnouncements from './pages/client/announcements/Announcements';

// ============================================================
// ProtectedRoute: If not logged in, redirect to /login
// ============================================================
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  // Show nothing while we're checking if the user is logged in
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent" />
      </div>
    );
  }

  // If not logged in, redirect to login page
  if (!user) return <Navigate to="/login" replace />;

  // If roles are specified, make sure this user has permission
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// ============================================================
// RoleRedirect: Redirect logged-in users to their dashboard
// ============================================================
function RoleRedirect() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  // Redirect based on role
  if (user.role === 'ADMIN') return <Navigate to="/organization/dashboard" replace />;
  if (user.role === 'EMPLOYEE') return <Navigate to="/employee/dashboard" replace />;
  if (user.role === 'CLIENT') return <Navigate to="/client/dashboard" replace />;

  return <Navigate to="/login" replace />;
}

// ============================================================
// App: Root component with all routes defined
// ============================================================
function AppRoutes() {
  return (
    <Routes>
      {/* Root route — redirect based on role */}
      <Route path="/" element={<RoleRedirect />} />

      {/* Public login page */}
      <Route path="/login" element={<Login />} />

      {/* ---- ORGANIZATION (ADMIN) routes ---- */}
      <Route
        path="/organization"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<OrgDashboard />} />
        <Route path="clients" element={<ClientList />} />
        <Route path="clients/new" element={<ClientAdd />} />
        <Route path="clients/:id" element={<ClientDetails />} />
        <Route path="clients/:id/edit" element={<ClientEdit />} />
        <Route path="projects" element={<ProjectList />} />
        <Route path="projects/new" element={<ProjectCreate />} />
        <Route path="projects/:id" element={<ProjectDetails />} />
        <Route path="milestones" element={<MilestoneList />} />
        <Route path="documents" element={<DocumentList />} />
        <Route path="approvals" element={<ApprovalList />} />
        <Route path="approvals/:id" element={<ApprovalDetails />} />
        <Route path="tickets" element={<TicketList />} />
        <Route path="tickets/new" element={<TicketCreate />} />
        <Route path="tickets/:id" element={<TicketDetails />} />
        <Route path="communication/announcements" element={<Announcements />} />
        <Route path="communication/meetings" element={<Meetings />} />
        <Route path="communication/notifications" element={<Notifications />} />
        <Route path="assets" element={<AssetList />} />
        <Route path="assets/new" element={<AssetRegister />} />
        <Route path="assets/:id" element={<AssetDetails />} />
        <Route path="inventory" element={<InventoryDashboard />} />
        <Route path="reports" element={<ReportsDashboard />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* ---- EMPLOYEE routes ---- */}
      <Route
        path="/employee"
        element={
          <ProtectedRoute allowedRoles={['EMPLOYEE']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<EmployeeDashboard />} />
        <Route path="projects" element={<MyProjects />} />
        <Route path="tasks" element={<MyTasks />} />
        <Route path="documents" element={<MyDocuments />} />
        <Route path="tickets" element={<MyTickets />} />
        <Route path="operations" element={<Operations />} />
      </Route>

      {/* ---- CLIENT routes ---- */}
      <Route
        path="/client"
        element={
          <ProtectedRoute allowedRoles={['CLIENT']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<ClientDashboard />} />
        <Route path="projects" element={<ClientProjects />} />
        <Route path="projects/:id" element={<ClientProjectDetails />} />
        <Route path="documents" element={<ClientDocuments />} />
        <Route path="approvals" element={<ClientApprovals />} />
        <Route path="tickets" element={<ClientTicketList />} />
        <Route path="tickets/new" element={<ClientTicketCreate />} />
        <Route path="tickets/:id" element={<ClientTicketDetails />} />
        <Route path="meetings" element={<ClientMeetings />} />
        <Route path="announcements" element={<ClientAnnouncements />} />
      </Route>

      {/* Catch-all: redirect unknown URLs to root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
