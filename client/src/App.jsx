import React, { useState, useEffect } from 'react';
import ForgotPasswordForm from './Auth/ForgotPasswordForm';
import ResetPasswordForm from './Auth/ResetPasswordForm';
import './App.css';
import { AuthProvider, useAuth } from './Auth/AuthContext';
import LoginForm from './Auth/LoginForm';
import RegisterForm from './Auth/RegisterForm';
import EmailVerification from './Auth/EmailVerification';
import Dashboard from './Auth/Dashboard';
import './App.css';
import AdminDashboard from './Auth/AdminDashboard.JSX';

const AppRoutes = () => {
  const [currentView, setCurrentView] = useState('login');
  const { isAuthenticated, isLoading, user } = useAuth();
  const [hasCheckedUrl, setHasCheckedUrl] = useState(false);

  useEffect(() => {
    if (hasCheckedUrl) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('token')) {
      if (window.location.pathname.includes('/reset-password')) {
        console.log('Token détecté pour réinitialisation de mot de passe');
        setCurrentView('reset-password');
      } else {
        console.log('Token détecté pour vérification email');
        setCurrentView('verify-email');
      }
    } else if (urlParams.get('error') === 'google_auth_failed') {
      alert('Échec de l\'authentification Google. Veuillez réessayer.');
      window.history.replaceState({}, document.title, '/');
      setCurrentView('login');
    }
    
    setHasCheckedUrl(true);
  }, [hasCheckedUrl]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated and user data is available
  if (isAuthenticated && user) {
    return user.role === 'admin' ? <AdminDashboard /> : <Dashboard />;
  }

  // If authenticated but user data is not yet loaded, show loading
  if (isAuthenticated && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données utilisateur...</p>
        </div>
      </div>
    );
  }

  const renderAuthRoutes = () => {
    switch (currentView) {
      case 'login':
        return <LoginForm onSwitchToRegister={() => setCurrentView('register')} onSwitchToForgotPassword={() => setCurrentView('forgot-password')} />;
      case 'register':
        return <RegisterForm onSwitchToLogin={() => setCurrentView('login')} />;
      case 'verify-email':
        return <EmailVerification />;
      case 'forgot-password':
        return <ForgotPasswordForm onSwitchToLogin={() => setCurrentView('login')} />;
      case 'reset-password':
        return <ResetPasswordForm onSwitchToLogin={() => setCurrentView('login')} />;
      default:
        return <LoginForm onSwitchToRegister={() => setCurrentView('register')} onSwitchToForgotPassword={() => setCurrentView('forgot-password')} />;
    }
  };

  return (
    <div className="App">
      {renderAuthRoutes()}
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;