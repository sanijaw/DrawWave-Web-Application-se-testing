import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Define types for the user and token payload
interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
}

interface DecodedToken {
  user: User;
  exp: number;
  iat: number;
}

// Define AuthContext type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: () => void;
  logout: () => void;
  checkAuthStatus: () => Promise<boolean>;
}

// Create the Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if the token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      return decoded.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  };

  // Set auth token in axios headers
  const setAuthToken = (token: string | null) => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
      localStorage.setItem('auth_token', token);
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
      localStorage.removeItem('auth_token');
    }
  };

  // Check for existing token and validate it
  const checkAuthStatus = async (): Promise<boolean> => {
    setLoading(true);
    
    // Check for token in localStorage
    const token = localStorage.getItem('auth_token');
    
    if (!token || isTokenExpired(token)) {
      setAuthToken(null);
      setUser(null);
      setLoading(false);
      return false;
    }
    
    // Token exists and is not expired, set it in axios defaults
    setAuthToken(token);
    
    try {
      // Verify token with backend
      const res = await axios.get(`${API_URL}/auth/verify`);
      
      if (res.data.isValid && res.data.user) {
        setUser(res.data.user);
        setLoading(false);
        return true;
      } else {
        setAuthToken(null);
        setUser(null);
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Auth verification error:', error);
      setAuthToken(null);
      setUser(null);
      setLoading(false);
      return false;
    }
  };

  // Check auth status on initial load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (!user) return;
    
    const refreshToken = async () => {
      try {
        const res = await axios.post(`${API_URL}/auth/refresh`);
        const { token } = res.data;
        
        setAuthToken(token);
      } catch (error) {
        console.error('Token refresh error:', error);
        logout();
      }
    };
    
    // Refresh token every 55 minutes (token expires in 7 days, but refresh early to be safe)
    const refreshInterval = setInterval(refreshToken, 55 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [user]);

  // Login function - redirect to Google OAuth
  const login = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  // Logout function
  const logout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthToken(null);
      setUser(null);
      
      // Clear any session data
      localStorage.removeItem('drawwave_inSession');
      localStorage.removeItem('drawwave_sessionId');
      localStorage.removeItem('drawwave_isHost');
      
      // Redirect to homepage
      window.location.href = '/';
    }
  };

  // Create context value
  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
