// src/context/AuthContext.jsx
// AuthContext.jsx — This file manages WHO is logged in across the whole app.
// Any component can check: "Is the user an Admin? Employee? Client?"
// And trigger login/logout from anywhere.

import { createContext, useContext, useState, useEffect } from 'react';
import { getMe, login as apiLogin, logout as apiLogout } from '../api/auth';
import toast from 'react-hot-toast';

// Create the context — think of it as a "global state box"
const AuthContext = createContext(null);

/** AuthProvider wraps the whole app and provides auth state to every component. */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // The logged-in user object
  const [loading, setLoading] = useState(true); // True while checking if user is logged in

  // When the app first loads, check if there's a saved token and load user info
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      getMe()
        .then((res) => setUser(res.data))
        .catch(() => {
          // Token was invalid or expired — clear it
          localStorage.clear();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  /** Call this to log a user in. Saves tokens and sets the user state. */
  const login = async (email, password) => {
    const res = await apiLogin(email, password);
    localStorage.setItem('access_token', res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);
    setUser(res.data.user);
    return res.data.user;
  };

  /** Call this to log the current user out. */
  const logout = async () => {
    const refresh = localStorage.getItem('refresh_token');
    try {
      await apiLogout(refresh);
    } catch {
      // Silently ignore errors during logout
    }
    localStorage.clear();
    setUser(null);
    toast.success('Logged out successfully');
  };

  // Convenience boolean flags so components don't have to check user.role directly
  const isMasterAdmin = Boolean(user?.is_master_admin || user?.is_superuser || user?.email === 'admin@portalhq.com');
  const isAdmin = user?.role === 'ADMIN' || isMasterAdmin;
  const isEmployee = user?.role === 'EMPLOYEE';
  const isClient = user?.role === 'CLIENT';

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, isMasterAdmin, isAdmin, isEmployee, isClient, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** Hook to use auth context in any component: const { user, login } = useAuth(); */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
