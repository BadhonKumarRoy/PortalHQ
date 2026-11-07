// src/pages/auth/Login.jsx
// Enterprise Authentication Page: Secure Sign In
// Connects directly to Django REST Framework JWT endpoints.
// Protected by rate-limiting, brute-force protection, and OWASP-compliant security.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, ArrowRight, Loader2, ShieldCheck, BarChart3, FolderKanban, Info } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Form input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /** Redirect authenticated user to their role-specific dashboard */
  const redirectUser = (user) => {
    if (user.role === 'ADMIN') navigate('/organization/dashboard');
    else if (user.role === 'EMPLOYEE') navigate('/employee/dashboard');
    else if (user.role === 'CLIENT') navigate('/client/dashboard');
    else navigate('/');
  };

  /** Handle Sign-In submission */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide both your email address and password.');
      return;
    }

    setLoading(true);

    try {
      const user = await login(email.trim(), password);
      toast.success(`Welcome back, ${user.full_name || 'User'}!`);
      redirectUser(user);
    } catch (err) {
      console.error('Authentication error:', err);
      const data = err.response?.data;
      let msg = 'Invalid email or password.';

      if (data) {
        if (typeof data.detail === 'string') {
          msg = data.detail;
        } else if (Array.isArray(data.non_field_errors)) {
          msg = data.non_field_errors[0];
        } else if (typeof data === 'string') {
          msg = data;
        }
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT SIDE: Branding & Features Panel (Desktop) ───────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #121358 0%, #232F72 50%, #2F578A 100%)',
        }}
      >
        {/* Ambient background glow accents */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-15"
          style={{ background: '#36ADA3', transform: 'translate(30%, -30%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-15"
          style={{ background: '#36ADA3', transform: 'translate(-30%, 30%)' }}
        />

        {/* Brand Header */}
        <div className="flex items-center gap-3 relative z-10">
          <img
            src="/logo.png"
            alt="PortalHQ Logo"
            className="w-11 h-11 rounded-xl object-contain shadow-lg"
          />
          <span className="text-white font-bold text-2xl tracking-wide">PortalHQ</span>
        </div>

        {/* Hero Copy & Value Propositions */}
        <div className="relative z-10 my-auto py-12">
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            One Portal.<br />
            <span style={{ color: '#36ADA3' }}>Every Client. Every Operation.</span>
          </h1>
          <p className="text-white/80 text-base leading-relaxed max-w-md mb-8">
            The enterprise-ready B2B Client Portal & Operations platform. Manage projects, collaborate with clients, track tickets, and streamline operations in one unified workspace.
          </p>

          {/* Feature Highlights */}
          <div className="space-y-4 max-w-md">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-teal-500/20 text-teal-300">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="text-white font-medium text-sm">Role-Based Access Control</h4>
                <p className="text-white/60 text-xs">Dedicated portals for Admins, Employees, and External Clients</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-teal-500/20 text-teal-300">
                <FolderKanban size={20} />
              </div>
              <div>
                <h4 className="text-white font-medium text-sm">Project & Milestone Management</h4>
                <p className="text-white/60 text-xs">Live tracking, deliverables, milestone approvals & audit logs</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-teal-500/20 text-teal-300">
                <BarChart3 size={20} />
              </div>
              <div>
                <h4 className="text-white font-medium text-sm">Real-Time Operational Oversight</h4>
                <p className="text-white/60 text-xs">Ticketing queue, assets, inventory, and automated metrics</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-white/40 text-xs relative z-10">
          SRS v1.1 Implementation &copy; 2026 PortalHQ. All rights reserved.
        </p>
      </div>

      {/* ── RIGHT SIDE: Form Panel (Mobile & Desktop) ────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 bg-slate-50 min-h-screen">
        <div className="w-full max-w-md">
          {/* Mobile brand header (visible on phone and tablet screens) */}
          <div className="flex flex-col items-center mb-6 lg:hidden">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="PortalHQ Logo"
                className="w-10 h-10 rounded-xl object-contain shadow-md"
              />
              <span className="font-extrabold text-2xl text-slate-900 tracking-tight">PortalHQ</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">One Portal. Every Client. Every Operation.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8">
            {/* Form Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800">
                Sign In
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Enter your credentials to access your secure portal workspace.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Alert Box */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl leading-relaxed">
                  {error}
                </div>
              )}

              {/* Email Address field */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition outline-none"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-white font-semibold text-sm transition-all duration-200 disabled:opacity-70 shadow-md hover:shadow-lg mt-2 cursor-pointer"
                style={{ background: '#121358' }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In to Portal
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Closed-Portal Security Notice */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-start gap-2.5 text-xs text-slate-500 leading-relaxed bg-slate-50/80 -mx-6 -mb-6 p-4 rounded-b-2xl">
              <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <span>
                <strong>Invite-Only Portal:</strong> Account registration is managed exclusively by organization administrators. If you need access or forgot your credentials, please contact your administrator.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
