import React, { useState, useEffect } from 'react';
import { useAuth } from './Auth/AuthContext';
import Home from './Home/Home';
import Dashboard from './Auth/Dashboard';
import AdminLayout from './Admin/AdminLayout ';
import EmailVerification from './Auth/EmailVerification';
import ResetPasswordForm from './Auth/ResetPasswordForm';

const AppRoutes = () => {
  const [currentView, setCurrentView] = useState('home');
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
      setCurrentView('home');
    }
    
    setHasCheckedUrl(true);
  }, [hasCheckedUrl]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-r-purple-600 animate-spin-reverse mx-auto"></div>
          </div>
          <p className="text-gray-600 text-lg font-medium">Chargement...</p>
          <div className="mt-2 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  // Check if user is authenticated and user data is available
  if (isAuthenticated && user) {
    return user.role === 'admin' ? <AdminLayout /> : <Dashboard />;
  }

  // If authenticated but user data is not yet loaded, show loading
  if (isAuthenticated && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-r-purple-600 animate-spin-reverse mx-auto"></div>
          </div>
          <p className="text-gray-600 text-lg font-medium">Chargement des données utilisateur...</p>
          <div className="mt-2 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  // Handle special routes (email verification, password reset)
  const renderSpecialRoutes = () => {
    switch (currentView) {
      case 'verify-email':
        return <EmailVerification />;
      case 'reset-password':
        return <ResetPasswordForm onSwitchToLogin={() => setCurrentView('home')} />;
      default:
        return <Home onLogin={() => setCurrentView('home')} />;
    }
  };

  return (
    <div className="App">
      {renderSpecialRoutes()}
      
      {/* Custom Styles for enhanced animations */}
      <style >{`
        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }
        
        .animate-spin-reverse {
          animation: spin-reverse 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default AppRoutes;