// src/pages/organization/settings/Settings.jsx
// Team Management & Role-Based Access Control (RBAC) Settings
// Implements the Master Admin vs Organization Admin hierarchy with credential sharing modals.

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getUsers, createUser, updateUser, deleteUser, resetUserPassword } from '../../../api/auth';
import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { copyToClipboard } from '../../../utils/clipboard';
import toast from 'react-hot-toast';
import { 
  Users, 
  ShieldCheck, 
  KeyRound, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Crown, 
  UserCheck, 
  ShieldAlert, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function Settings() {
  const { user: currentUser, isMasterAdmin } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [credentialModal, setCredentialModal] = useState({
    open: false,
    title: '',
    email: '',
    password: '',
    role: '',
    copied: false,
  });
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });

  // Add User Form State
  const [newUserForm, setNewUserForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'EMPLOYEE',
    password: '',
  });

  /** Fetch all users from backend */
  const fetchUsers = useCallback(async () => {
    try {
      const res = await getUsers();
      setUsers(Array.isArray(res.data) ? res.data : res.data?.results || []);
    } catch {
      toast.error('Failed to load team members.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /** Handle adding a new user */
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserForm.full_name || !newUserForm.email) {
      toast.error('Please fill in required fields.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await createUser(newUserForm);
      toast.success('Team member created successfully!');
      setAddModalOpen(false);

      // Open Credentials Modal for 1-Click Copy
      setCredentialModal({
        open: true,
        title: 'New Account Credentials Created',
        email: res.data.user?.email || newUserForm.email,
        password: res.data.temp_password,
        role: res.data.user?.role || newUserForm.role,
        copied: false,
      });

      // Reset form
      setNewUserForm({
        full_name: '',
        email: '',
        phone: '',
        role: 'EMPLOYEE',
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
    const textToCopy = `🔑 PortalHQ Access Details:\n• Portal: ${window.location.origin}/\n• Email: ${credentialModal.email}\n• Password: ${credentialModal.password}\n• Role: ${credentialModal.role}`;
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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Settings & Team Permissions"
        subtitle="Manage access control, invite staff, and oversee organization roles."
        action={
          <Button icon={Plus} onClick={() => setAddModalOpen(true)}>
            Add Team Member
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
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800">Team Members & Accounts</h3>
            <p className="text-xs text-slate-500 mt-0.5">Total accounts in database: {users.length}</p>
          </div>
          <Badge status="ACTIVE">{users.length} Active Users</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b">
              <tr>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isUserMaster = Boolean(u.is_master_admin || u.is_superuser || u.email === 'admin@portalhq.com');
                const isSelf = u.id === currentUser?.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    {/* User Profile */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm"
                          style={{ background: isUserMaster ? '#D97706' : '#121358' }}
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
                            <KeyRound size={13} />
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
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── MODAL: ADD TEAM MEMBER ────────────────────────────────────────── */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Team Member"
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
