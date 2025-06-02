import React, { useState, useEffect } from 'react';
import { useAuth } from './Auth/AuthContext';
import Home from './Home/Home';
import Dashboard from './Auth/Dashboard';
import AdminLayout from './Admin/AdminLayout ';
import EmailVerification from './Auth/EmailVerification';
import ResetPasswordForm from './Auth/ResetPasswordForm';
import CustomLoader from './CustomLoader/CustomLoader';
import UserDashboard from './UserDashboard/UserDashboard';

// Composant Loader personnalisé


const AppRoutes = () => {
  const [currentView, setCurrentView] = useState('home');
  const { isAuthenticated, isLoading, user } = useAuth();
  const [hasCheckedUrl, setHasCheckedUrl] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

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

  // Timer pour afficher le loader pendant 3 secondes
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Afficher le loader pendant 3 secondes au chargement initial
  if (showLoader) {
    return <CustomLoader message="Chargement..." />;
  }

  // Loading state - Utilisation du loader personnalisé
  if (isLoading) {
    return <CustomLoader message="Chargement..." />;
  }

  // Check if user is authenticated and user data is available
  if (isAuthenticated && user) {
    return user.role === 'admin' ? <AdminLayout /> : <UserDashboard />;
  }

  // If authenticated but user data is not yet loaded, show loading
  if (isAuthenticated && !user) {
    return <CustomLoader message="Chargement des données utilisateur..." />;
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
    </div>
  );
};

export default AppRoutes;