'use client';

import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This simulates checking if a user was already logged in from a previous session.
    setLoading(false);
  }, []);

  const login = (email, password) => {
    setLoading(true);
    
    // --- THIS IS THE KEY CHANGE ---
    // We now check for a specific email and password combination.
    if (email === 'test@example.com' && password === 'password123') {
      const mockUser = { email: email, name: 'Test User' };
      setUser(mockUser); // Set the user in the global state
      setLoading(false);
      return mockUser; // Return the user object to signal SUCCESS
    }
    
    // If the credentials do not match, we do not set the user.
    setLoading(false);
    return null; // Return null to signal FAILURE
  };

  const logout = () => {
    setUser(null);
  };
  
  const value = { user, loading, login, logout, isAuthenticated: !!user };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};