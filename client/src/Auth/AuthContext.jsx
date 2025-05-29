import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

axios.defaults.baseURL = import.meta.env.VITE_API_URL ;
axios.defaults.withCredentials = true;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      setUser(response.data.user);
      setIsAuthenticated(true);
      return { 
        success: true, 
        message: response.data.message,
        user: response.data.user
      };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erreur de connexion',
        needsVerification: error.response?.data?.needsVerification,
        email: error.response?.data?.email
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await axios.post('/api/auth/register', { name, email, password });
      return { 
        success: true, 
        message: response.data.message,
        emailSent: response.data.emailSent,
        userEmail: response.data.userEmail
      };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erreur d\'inscription' 
      };
    }
  };
const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };
  const resendVerification = async (email) => {
    try {
      const response = await axios.post('/api/auth/resend-verification', { email });
      return { 
        success: true, 
        message: response.data.message,
        emailSent: response.data.emailSent
      };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erreur lors du renvoi' 
      };
    }
  };

  

  const loginWithGoogle = () => {
    window.location.href = `${import.meta.env.VITE_API_URL }/api/auth/google`;
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
      loginWithGoogle,
      resendVerification,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};/////