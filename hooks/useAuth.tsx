
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/mockApi';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<User | null>;
  logout: () => void;
  signup: (name: string, email: string, phone: string, companyName: string) => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate checking for a logged-in user in localStorage
    const storedUser = localStorage.getItem('mordomozap_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    const loggedInUser = await api.login(email, pass);
    if (loggedInUser) {
      setUser(loggedInUser);
      localStorage.setItem('mordomozap_user', JSON.stringify(loggedInUser));
    }
    setLoading(false);
    return loggedInUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mordomozap_user');
  };
  
  const signup = async (name: string, email: string, phone: string, companyName: string) => {
    setLoading(true);
    const newUser = await api.signup(name, email, phone, companyName);
    if (newUser) {
      setUser(newUser);
      localStorage.setItem('mordomozap_user', JSON.stringify(newUser));
    }
    setLoading(false);
    return newUser;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
