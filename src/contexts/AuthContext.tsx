// Authentication context for managing user state
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  instituteName?: string;
  firstName?: string;
  lastName?: string;
  type: 'institute' | 'employer';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, type: 'institute' | 'employer') => Promise<void>;
  register: (data: any, type: 'institute' | 'employer') => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    const userData = localStorage.getItem('userData');
    
    if (token && userType && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, type: 'institute' | 'employer') => {
    try {
      const endpoint = type === 'institute' ? '/api/institutes/signin' : '/api/employers/signin';
      
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('userType', type);
      
      // Decode user info from token or get from response
      const userData: User = {
        id: data.user?.id || 'temp-id',
        email,
        type,
        ...(type === 'institute' 
          ? { instituteName: data.user?.instituteName || 'Institute' }
          : { firstName: data.user?.firstName || 'User', lastName: data.user?.lastName || '' }
        )
      };
      
      localStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const register = async (data: any, type: 'institute' | 'employer') => {
    try {
      const endpoint = type === 'institute' ? '/api/institutes/signup' : '/api/employers/signup';
      
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Registration failed');
      }

      // After successful registration, automatically log in
      await login(data.email, data.password, type);
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('userData');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
