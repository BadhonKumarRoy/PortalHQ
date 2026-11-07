// src/pages/organization/settings/Settings.jsx
// Unified User & Access Management Center
// One single place to view, filter, add, edit, and reset credentials for all users:
// Organization Admins, Staff/Employees, and Clients.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getUsers, createUser, updateUser, deleteUser, resetUserPassword } from '../../../api/auth';
import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { copyToClipboard } from '../../../utils/clipboard';
import toast from 'react-hot-toast';
import { 
  Users, 
  ShieldCheck, 
  KeyRound, 
  Plus, 
  Pencil,
  Trash2, 
  Copy, 
  Check, 
  Crown, 
  Building2,
  Search,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function Settings() {
  const { user: currentUser, isMasterAdmin } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filter and search state
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({
    open: false,
    user: null,
    form: {
      full_name: '',
      email: '',
      phone: '',
      role: 'EMPLOYEE',
      company_name: '',
      is_active: true,
    },
  });
  const [credentialModal, setCredentialModal] = useState({
    open: false,
    title: '',
    email: '',
    password: '',
    role: '',
    company_name: '',
    copied: false,
  });
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });

  // Add User Form State
  const [newUserForm, setNewUserForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'EMPLOYEE',
    company_name: '',
    password: '',
  });

  /** Fetch all users from backend */
  const fetchUsers = useCallback(async () => {
    try {
      const res = await getUsers();
      setUsers(Array.isArray(res.data) ? res.data : res.data?.results || []);
    } catch {
      toast.error('Failed to load accounts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /** Open Edit Modal with prefilled data */
  const handleOpenEdit = (targetUser) => {
    setEditModal({
      open: true,
      user: targetUser,
      form: {
        full_name: targetUser.full_name || '',
        email: targetUser.email || '',
        phone: targetUser.phone || '',
        role: targetUser.role || 'EMPLOYEE',
        company_name: targetUser.company_name || '',
        is_active: targetUser.is_active !== false,
      },
    });
  };

  /** Save User Edits */
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editModal.form.full_name.trim() || !editModal.form.email.trim()) {
      toast.error('Full name and email are required.');
      return;
    }

    if (editModal.form.role === 'CLIENT' && !editModal.form.company_name.trim()) {
      toast.error('Company Name is required for Client accounts.');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        full_name: editModal.form.full_name.trim(),
        email: editModal.form.email.trim(),
        phone: editModal.form.phone.trim(),
        role: editModal.form.role,
        is_active: Boolean(editModal.form.is_active),
        company_name: editModal.form.role === 'CLIENT' ? editModal.form.company_name.trim() : '',
      };

      await updateUser(editModal.user.id, payload);
      toast.success(`User ${payload.full_name} updated successfully!`);
      setEditModal((prev) => ({ ...prev, open: false, user: null }));
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.email?.[0] || 'Failed to update user profile.';
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  /** Handle adding a new user */
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserForm.full_name.trim() || !newUserForm.email.trim()) {
      toast.error('Please fill in required fields.');
      return;
    }

    if (newUserForm.role === 'CLIENT' && !newUserForm.company_name.trim()) {
      toast.error('Company Name is required for Client accounts.');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        ...newUserForm,
        full_name: newUserForm.full_name.trim(),
        email: newUserForm.email.trim(),
        company_name: newUserForm.role === 'CLIENT' ? newUserForm.company_name.trim() : '',
      };

      const res = await createUser(payload);
      toast.success('Account created successfully!');
      setAddModalOpen(false);

      // Open Credentials Modal for 1-Click Copy
      setCredentialModal({
        open: true,
        title: 'New Account Credentials Created',
        email: res.data.user?.email || newUserForm.email,
        password: res.data.temp_password,
        role: res.data.user?.role || newUserForm.role,
        company_name: newUserForm.company_name,
        copied: false,
      });

      // Reset form
      setNewUserForm({
        full_name: '',
        email: '',
        phone: '',
        role: 'EMPLOYEE',
        company_name: '',
        password: '',
      });

      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.email?.[0] || 'Failed to create user.';
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  /** Handle Master Admin promoting or demoting an admin */
  const handleRoleToggle = async (targetUser) => {
    const isCurrentlyAdmin = targetUser.role === 'ADMIN';
    const nextRole = isCurrentlyAdmin ? 'EMPLOYEE' : 'ADMIN';
    const actionLabel = isCurrentlyAdmin ? 'revoking Admin privileges' : 'promoting to Admin';

    if (!window.confirm(`Are you sure you want to proceed with ${actionLabel} for ${targetUser.full_name}?`)) {
      return;
    }

    try {
      await updateUser(targetUser.id, { role: nextRole });
      toast.success(`${targetUser.full_name} is now ${isCurrentlyAdmin ? 'an Employee' : 'an Administrator'}.`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update user role.');
    }
  };

  /** Handle Resetting a User's Password */
  const handleResetPassword = async (targetUser) => {
    try {
      const res = await resetUserPassword(targetUser.id);
      toast.success('Password reset successfully.');
      setCredentialModal({
        open: true,
        title: `Password Reset for ${targetUser.full_name}`,
        email: targetUser.email,
        password: res.data.temp_password,
        role: targetUser.role,
        company_name: targetUser.company_name,
        copied: false,
      });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reset password.');
    }
  };

  /** Handle Deleting a User */
  const handleDeleteUser = async () => {
    if (!deleteModal.user) return;
    setActionLoading(true);
    try {
      await deleteUser(deleteModal.user.id);
      toast.success('User account removed.');
      setDeleteModal({ open: false, user: null });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete user.');
    } finally {
      setActionLoading(false);
    }
  };

  /** Copy credentials to clipboard for WhatsApp/Slack */
  const copyCredentialsToClipboard = async () => {
    let textToCopy = `🔑 PortalHQ Access Details:\n• Portal: ${window.location.origin}/\n• Email: ${credentialModal.email}\n• Password: ${credentialModal.password}\n• Role: ${credentialModal.role}`;
    if (credentialModal.company_name) {
      textToCopy += `\n• Company: ${credentialModal.company_name}`;
    }
    const success = await copyToClipboard(textToCopy);
    if (success) {
      setCredentialModal((prev) => ({ ...prev, copied: true }));
      toast.success('Credentials copied to clipboard!');
      setTimeout(() => {
        setCredentialModal((prev) => ({ ...prev, copied: false }));
      }, 3000);
    } else {
      toast.error('Could not copy automatically. Please copy the text manually.');
    }
  };

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: users.length,
      admin: users.filter((u) => u.role === 'ADMIN').length,
      employee: users.filter((u) => u.role === 'EMPLOYEE').length,
      client: users.filter((u) => u.role === 'CLIENT').length,
    };
  }, [users]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter !== 'ALL' && u.role !== roleFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = u.full_name?.toLowerCase().includes(q);
        const matchesEmail = u.email?.toLowerCase().includes(q);
        const matchesCompany = u.company_name?.toLowerCase().includes(q);
        const matchesPhone = u.phone?.toLowerCase().includes(q);
        return matchesName || matchesEmail || matchesCompany || matchesPhone;
      }
      return true;
    });
  }, [users, roleFilter, searchQuery]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Settings & User Management"
        subtitle="Manage access control, invite staff, edit user profiles, and oversee organization roles in one unified place."
        action={
          <Button icon={Plus} onClick={() => setAddModalOpen(true)}>
            Add User
          </Button>
        }
      />

      {/* ── SECURITY STATUS BANNER ────────────────────────────────────────── */}
      <div className={`p-4 rounded-2xl border flex items-start gap-3.5 shadow-sm ${
        isMasterAdmin 
          ? 'bg-amber-50/70 border-amber-200/80 text-amber-900' 
          : 'bg-blue-50/70 border-blue-200/80 text-blue-900'
      }`}>
        <div className={`p-2 rounded-xl shrink-0 ${isMasterAdmin ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
          {isMasterAdmin ? <Crown size={22} /> : <ShieldCheck size={22} />}
        </div>
        <div>
          <h4 className="font-semibold text-sm">
            {isMasterAdmin ? '👑 Master Admin Mode Active' : '⭐ Organization Admin Mode'}
          </h4>
          <p className="text-xs opacity-90 mt-0.5 leading-relaxed">
            {isMasterAdmin
              ? 'You have primary ownership authority. You can grant or revoke Administrator rights for team members. The Master Admin account cannot be deleted or demoted.'
              : 'You have operational management rights to manage clients, projects, and staff accounts. Administrative privilege grants are restricted to the primary Master Admin.'}
          </p>
        </div>
      </div>

      {/* ── TEAM & USERS TABLE ────────────────────────────────────────────── */}
      <Card>
        {/* Table Header with Counts */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-800">All User Accounts & Profiles</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {filteredUsers.length} of {users.length} accounts in organization
            </p>
          </div>
          <Badge status="ACTIVE">{users.length} Total Accounts</Badge>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setRoleFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                roleFilter === 'ALL'
                  ? 'bg-[#121358] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({counts.all})
            </button>
            <button
              onClick={() => setRoleFilter('ADMIN')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                roleFilter === 'ADMIN'
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              👑 Admins ({counts.admin})
            </button>
            <button
              onClick={() => setRoleFilter('EMPLOYEE')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                roleFilter === 'EMPLOYEE'
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              💼 Staff ({counts.employee})
            </button>
            <button
              onClick={() => setRoleFilter('CLIENT')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                roleFilter === 'CLIENT'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              🤝 Clients ({counts.client})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b">
              <tr>
                <th className="py-3 px-4">Member & Profile</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                    No accounts found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isUserMaster = Boolean(u.is_master_admin || u.is_superuser || u.email === 'admin@portalhq.com' || u.email === 'badhon@portalhq.com');
                  const isSelf = u.id === currentUser?.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      {/* User Profile */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm"
                            style={{ background: isUserMaster ? '#D97706' : u.role === 'CLIENT' ? '#059669' : '#121358' }}
                          >
                            {u.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                              {u.full_name}
                              {isUserMaster && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-md flex items-center gap-0.5">
                                  <Crown size={10} /> Owner
                                </span>
                              )}
                              {isSelf && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">{u.email}</div>
                            {/* Client Company Link */}
                            {u.role === 'CLIENT' && (
                              <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                                <Building2 size={12} className="text-slate-400 shrink-0" />
                                <span className="font-medium text-slate-700">{u.company_name || 'Client Account'}</span>
                                {u.client_id && (
                                  <Link
                                    to={`/organization/clients/${u.client_id}`}
                                    className="text-teal-600 hover:text-teal-700 hover:underline text-[11px] ml-1 inline-flex items-center gap-0.5"
                                    title="View Client Profile"
                                  >
                                    <ExternalLink size={10} />
                                    Profile
                                  </Link>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isUserMaster
                            ? 'bg-amber-100 text-amber-800'
                            : u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'EMPLOYEE'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isUserMaster ? '👑 Master Admin' : u.role === 'ADMIN' ? '⭐ Admin' : u.role === 'EMPLOYEE' ? '💼 Staff' : '🤝 Client'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <Badge status={u.is_active ? 'ACTIVE' : 'INACTIVE'}>
                          {u.is_active ? 'Active' : 'Disabled'}
                        </Badge>
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {u.date_joined ? new Date(u.date_joined).toLocaleDateString() : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit User Button */}
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1 transition"
                            title="Edit User Profile"
                          >
                            <Pencil size={13} className="text-blue-600" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>

                          {/* Master Admin Role Promotion / Demotion Button */}
                          {isMasterAdmin && !isUserMaster && (
                            <button
                              onClick={() => handleRoleToggle(u)}
                              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
                                u.role === 'ADMIN'
                                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                              }`}
                              title={u.role === 'ADMIN' ? 'Demote to Employee' : 'Promote to Admin'}
                            >
                              {u.role === 'ADMIN' ? (
                                <>
                                  <ArrowDownRight size={13} />
                                  <span className="hidden sm:inline">Revoke Admin</span>
                                </>
                              ) : (
                                <>
                                  <ArrowUpRight size={13} />
                                  <span className="hidden sm:inline">Make Admin</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Reset Password Button */}
                          {(!isUserMaster || isMasterAdmin) && (
                            <button
                              onClick={() => handleResetPassword(u)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1 transition"
                              title="Reset Temporary Password"
                            >
                              <KeyRound size={13} className="text-amber-600" />
                              <span className="hidden sm:inline">Reset Pass</span>
                            </button>
                          )}

                          {/* Delete User Button (Protected for Master Admin) */}
                          {!isUserMaster && !isSelf && (
                            <button
                              onClick={() => setDeleteModal({ open: true, user: u })}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete Account"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── MODAL: EDIT USER ──────────────────────────────────────────────── */}
      <Modal
        open={editModal.open}
        onClose={() => setEditModal((prev) => ({ ...prev, open: false, user: null }))}
        title={`Edit Profile: ${editModal.user?.full_name || ''}`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <Input
            label="Full Name *"
            value={editModal.form.full_name}
            onChange={(e) => setEditModal((prev) => ({
              ...prev,
              form: { ...prev.form, full_name: e.target.value }
            }))}
            placeholder="John Doe"
            required
          />

          <Input
            label="Email Address *"
            type="email"
            value={editModal.form.email}
            onChange={(e) => setEditModal((prev) => ({
              ...prev,
              form: { ...prev.form, email: e.target.value }
            }))}
            placeholder="john@example.com"
            required
          />

          <Input
            label="Phone Number"
            value={editModal.form.phone}
            onChange={(e) => setEditModal((prev) => ({
              ...prev,
              form: { ...prev.form, phone: e.target.value }
            }))}
            placeholder="+1 555-0192"
          />

          {/* Role Selection */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Account Role *</label>
            {editModal.user?.is_master_admin ? (
              <div className="px-3 py-2 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl">
                👑 Master Admin (Permanent role, cannot be changed)
              </div>
            ) : (
              <select
                value={editModal.form.role}
                onChange={(e) => setEditModal((prev) => ({
                  ...prev,
                  form: { ...prev.form, role: e.target.value }
                }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition bg-white outline-none cursor-pointer"
              >
                <option value="EMPLOYEE">Staff / Employee</option>
                <option value="CLIENT">Client</option>
                {isMasterAdmin && (
                  <option value="ADMIN">👑 Organization Admin</option>
                )}
              </select>
            )}
          </div>

          {/* Client Company Name (If role is CLIENT) */}
          {editModal.form.role === 'CLIENT' && (
            <Input
              label="Company Name *"
              value={editModal.form.company_name}
              onChange={(e) => setEditModal((prev) => ({
                ...prev,
                form: { ...prev.form, company_name: e.target.value }
              }))}
              placeholder="e.g. Apex Innovations Ltd."
              required
            />
          )}

          {/* Account Status */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Account Status</label>
            <select
              value={editModal.form.is_active ? 'ACTIVE' : 'INACTIVE'}
              onChange={(e) => setEditModal((prev) => ({
                ...prev,
                form: { ...prev.form, is_active: e.target.value === 'ACTIVE' }
              }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition bg-white outline-none cursor-pointer"
            >
              <option value="ACTIVE">Active (Can log in)</option>
              <option value="INACTIVE">Disabled / Deactivated</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button
              variant="secondary"
              onClick={() => setEditModal((prev) => ({ ...prev, open: false, user: null }))}
              type="button"
            >
              Cancel
            </Button>
            <Button type="submit" loading={actionLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: ADD USER ──────────────────────────────────────────────── */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add User Account"
      >
        <form onSubmit={handleAddUser} className="space-y-4">
          <Input
            label="Full Name *"
            value={newUserForm.full_name}
            onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
            placeholder="Alex Rivera"
            required
          />

          <Input
            label="Email Address *"
            type="email"
            value={newUserForm.email}
            onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
            placeholder="alex@company.com"
            required
          />

          <Input
            label="Phone Number"
            value={newUserForm.phone}
            onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
            placeholder="+1 555-0192"
          />

          {/* Role Selection */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Account Role *</label>
            <select
              value={newUserForm.role}
              onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition bg-white outline-none cursor-pointer"
            >
              <option value="EMPLOYEE">Staff / Employee</option>
              <option value="CLIENT">Client</option>
              {isMasterAdmin && (
                <option value="ADMIN">👑 Organization Admin (Owner privilege)</option>
              )}
            </select>
            {!isMasterAdmin && (
              <span className="text-[11px] text-slate-400">
                Only the Master Admin can create other Organization Admins.
              </span>
            )}
          </div>

          {/* Company Name if Client */}
          {newUserForm.role === 'CLIENT' && (
            <Input
              label="Company Name *"
              value={newUserForm.company_name}
              onChange={(e) => setNewUserForm({ ...newUserForm, company_name: e.target.value })}
              placeholder="e.g. Apex Innovations Ltd."
              required
            />
          )}

          <Input
            label="Initial Password (Optional — auto-generated if blank)"
            type="password"
            value={newUserForm.password}
            onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
            placeholder="Leave empty for auto-generated temporary password"
          />

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="secondary" onClick={() => setAddModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" loading={actionLoading}>
              Create Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: 1-CLICK CREDENTIAL COPY CARD ───────────────────────────── */}
      <Modal
        open={credentialModal.open}
        onClose={() => setCredentialModal((prev) => ({ ...prev, open: false }))}
        title={credentialModal.title || 'Access Credentials'}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Copy and send these credentials directly to the user via WhatsApp, Slack, or email:
          </p>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs space-y-2 text-slate-800">
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-400 font-sans">Login Portal:</span>
              <span className="font-semibold text-teal-700">{window.location.origin}/</span>
            </div>
            {credentialModal.company_name && (
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-400 font-sans">Company:</span>
                <span className="font-semibold">{credentialModal.company_name}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-400 font-sans">Email:</span>
              <span className="font-semibold">{credentialModal.email}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-400 font-sans">Temporary Password:</span>
              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {credentialModal.password}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400 font-sans">Assigned Role:</span>
              <span className="font-semibold">{credentialModal.role}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant={credentialModal.copied ? 'primary' : 'secondary'}
              icon={credentialModal.copied ? Check : Copy}
              onClick={copyCredentialsToClipboard}
            >
              {credentialModal.copied ? 'Copied to Clipboard!' : 'Copy Login Credentials'}
            </Button>
            <Button
              onClick={() => setCredentialModal((prev) => ({ ...prev, open: false }))}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL: DELETE CONFIRMATION ────────────────────────────────────── */}
      <Modal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, user: null })}
        title="Remove Account"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete the account for <strong>{deleteModal.user?.full_name}</strong> ({deleteModal.user?.email})?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setDeleteModal({ open: false, user: null })}>
              Cancel
            </Button>
            <Button variant="danger" loading={actionLoading} onClick={handleDeleteUser}>
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
