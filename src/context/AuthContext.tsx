import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (signupData: any) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updatedData: Partial<User>) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  dbStatus: { connected: boolean; type: string } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; type: string } | null>(null);

  // Initialize Auth State from LocalStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('jolshaa_token');
    
    // Fetch DB Status
    fetch('/api/db-status')
      .then(res => res.json())
      .then(data => setDbStatus(data))
      .catch(() => console.log('Could not fetch DB status'));

    if (storedToken) {
      setToken(storedToken);
      fetchUserProfile(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const clearError = () => setError(null);

  // Fetch logged in user profile using JWT token
  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Token is invalid/expired
        handleLogoutCleanly();
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      handleLogoutCleanly();
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutCleanly = () => {
    localStorage.removeItem('jolshaa_token');
    setToken(null);
    setUser(null);
  };

  // Login operation
  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('jolshaa_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setLoading(false);
        return true;
      } else {
        setError(data.message || 'Login failed. Please check your email and password.');
        setLoading(false);
        return false;
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
      setLoading(false);
      return false;
    }
  };

  // Signup operation
  const signup = async (signupData: any): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('jolshaa_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setLoading(false);
        return true;
      } else {
        setError(data.message || 'Registration failed. Please check the provided information.');
        setLoading(false);
        return false;
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
      setLoading(false);
      return false;
    }
  };

  // Logout operation
  const logout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.log('Logout API error (non-blocking):', e);
    }
    handleLogoutCleanly();
    setLoading(false);
  };

  // Update user profile
  const updateProfile = async (updatedData: Partial<User>): Promise<boolean> => {
    if (!token || !user) {
      setError('You must be logged in to perform this action.');
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setLoading(false);
        return true;
      } else {
        setError(data.message || 'Failed to update your profile.');
        setLoading(false);
        return false;
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
      setLoading(false);
      return false;
    }
  };

  const refreshUser = async () => {
    if (token) {
      await fetchUserProfile(token);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      error,
      login,
      signup,
      logout,
      updateProfile,
      refreshUser,
      clearError,
      dbStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
