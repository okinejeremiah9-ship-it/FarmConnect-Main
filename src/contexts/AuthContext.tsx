import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState, LoginCredentials, RegisterData } from '../types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  verifyOTP: (otp: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Helper function to validate UUID format
  const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        // Validate that the user ID is a proper UUID
        if (user.id && isValidUUID(user.id)) {
          setAuthState({
            user,
            isLoading: false,
            isAuthenticated: true,
          });
        } else {
          // Clear invalid user data
          localStorage.removeItem('user');
          localStorage.removeItem('pendingUser');
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        // Clear corrupted user data
        localStorage.removeItem('user');
        localStorage.removeItem('pendingUser');
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data - in real app, this would come from your backend
      const mockUser: User = {
        id: credentials.email === 'farmer@test.com' ? '550e8400-e29b-41d4-a716-446655440001' : 
             credentials.email === 'provider@test.com' ? '550e8400-e29b-41d4-a716-446655440002' : 
             credentials.email === 'admin@test.com' ? '550e8400-e29b-41d4-a716-446655440003' :
             crypto.randomUUID(),
        email: credentials.email,
        name: credentials.email === 'farmer@test.com' ? 'John Farmer' : 
              credentials.email === 'provider@test.com' ? 'Jane Provider' : 
              credentials.email === 'admin@test.com' ? 'Admin User' : 'New User',
        phone: '+233123456789',
        role: credentials.email === 'farmer@test.com' ? 'farmer' : 
              credentials.email === 'provider@test.com' ? 'provider' : 
              credentials.email === 'admin@test.com' ? 'admin' : 'farmer',
        isVerified: true,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem('user', JSON.stringify(mockUser));
      setAuthState({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw new Error('Login failed');
    }
  };

  const register = async (data: RegisterData) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newUser: User = {
        id: crypto.randomUUID(),
        email: data.email,
        name: data.name,
        phone: data.phone,
        role: data.role,
        isVerified: false, // Will need OTP verification
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem('pendingUser', JSON.stringify(newUser));
      setAuthState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw new Error('Registration failed');
    }
  };

  const verifyOTP = async (otp: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Simulate OTP verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (otp !== '123456') {
        throw new Error('Invalid OTP');
      }

      const pendingUser = localStorage.getItem('pendingUser');
      if (pendingUser) {
        const user = { ...JSON.parse(pendingUser), isVerified: true };
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.removeItem('pendingUser');
        
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true,
        });
      }
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('pendingUser');
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        register,
        logout,
        verifyOTP,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};