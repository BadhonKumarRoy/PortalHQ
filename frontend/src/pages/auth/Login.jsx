// src/pages/auth/Login.jsx
// Login & Sign-Up page with 1-click Demo credentials
// Supports both existing user login and new user registration.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Mail, Lock, User, ArrowRight, Loader2, Sparkles } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Mode: 'login' or 'signup'
  const [isSignUp, setIsSignUp] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /** Quick 1-click autofill for testing demo accounts */
  const handleQuickFill = (demoEmail, demoPass) => {
    setIsSignUp(false);
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  /** Handle Form Submission (Login or Sign Up) */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password || (isSignUp && !fullName)) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        // Register new user
        const res = await api.post('/auth/register/', {
          email,
          full_name: fullName,
          password,
          role
        });
        toast.success('Account created successfully! Signing you in...');
        // Auto-login with the new credentials
        const user = await login(email, password);
        redirectUser(user);
      } else {
        // Login existing user
        const user = await login(email, password);
        toast.success(`Welcome back, ${user.full_name || 'User'}!`);
        redirectUser(user);
      }
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.email?.[0] ||
        err.response?.data?.non_field_errors?.[0] ||
        'Authentication failed. Please verify your details or backend connection.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const redirectUser = (user) => {
    if (user.role === 'ADMIN') navigate('/organization/dashboard');
    else if (user.role === 'EMPLOYEE') navigate('/employee/dashboard');
    else if (user.role === 'CLIENT') navigate('/client/dashboard');
    else navigate('/');
  };

  return (
    <div className="min-h-screen flex">
      {/* ---- LEFT SIDE: Branding panel ---- */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #121358 0%, #232F72 50%, #2F578A 100%)',
        }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: '#36ADA3', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10"
          style={{ background: '#36ADA3', transform: 'translate(-30%, 30%)' }} />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <img
            src="/logo.png"
            alt="PortalHQ Logo"
            className="w-11 h-11 rounded-xl object-contain shadow-lg"
          />
          <span className="text-white font-bold text-2xl tracking-wide">PortalHQ</span>
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            One Portal.<br />
            <span style={{ color: '#36ADA3' }}>Every Client. Every Operation.</span>
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-md">
            The all-in-one B2B Client Portal & Business Operations platform built for SMEs, staff, and external clients.
          </p>

          {/* Quick Demo Credentials Box */}
          <div className="mt-8 p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 max-w-md">
            <div className="flex items-center gap-2 text-white font-semibold text-sm mb-3">
              <Sparkles size={16} className="text-teal-400" />
              <span>Quick Demo Accounts (1-Click Fill)</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@portalhq.com', 'admin123')}
                className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg text-center transition border border-white/5"
              >
                👑 Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('employee@portalhq.com', 'emp123')}
                className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg text-center transition border border-white/5"
              >
                💼 Staff
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('client@portalhq.com', 'client123')}
                className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg text-center transition border border-white/5"
              >
                🤝 Client
              </button>
            </div>
          </div>
        </div>

        <p className="text-white/40 text-xs relative z-10">
          SRS v1.1 Implementation &copy; 2026 PortalHQ
        </p>
      </div>

      {/* ---- RIGHT SIDE: Form ---- */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
            <div className="mb-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">
                  {isSignUp ? 'Create an Account' : 'Sign In'}
                </h2>
                <button
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700 underline"
                >
                  {isSignUp ? 'Already have an account?' : 'Need an account? Sign Up'}
                </button>
              </div>
              <p className="text-slate-500 text-sm mt-1">
                {isSignUp
                  ? 'Sign up to explore the PortalHQ workspace.'
                  : 'Enter your credentials or use the demo buttons.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl leading-relaxed">
                  {error}
                </div>
              )}

              {/* Full Name (Sign Up only) */}
              {isSignUp && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      required={isSignUp}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                    />
                  </div>
                </div>
              )}

              {/* Email field */}
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
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
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
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                </div>
              </div>

              {/* Role Selection (Sign Up only) */}
              {isSignUp && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700">Account Type</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition bg-white"
                  >
                    <option value="ADMIN">Organization Admin</option>
                    <option value="EMPLOYEE">Staff / Employee</option>
                    <option value="CLIENT">Client</option>
                  </select>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-white font-semibold text-sm transition-all duration-200 disabled:opacity-70 shadow-md hover:shadow-lg mt-2"
                style={{ background: '#121358' }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {isSignUp ? 'Creating Account...' : 'Signing In...'}
                  </>
                ) : (
                  <>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
