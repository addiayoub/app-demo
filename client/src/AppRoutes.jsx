import React, { useState, useEffect } from 'react';
import { useAuth } from './Auth/AuthContext';
import Home from './Home/Home';
import Dashboard from './Auth/Dashboard';
import AdminLayout from './Admin/AdminLayout ';
import EmailVerification from './Auth/EmailVerification';
import ResetPasswordForm from './Auth/ResetPasswordForm';
import CustomLoader from './CustomLoader/CustomLoader';
import UserDashboard from './UserDashboard/UserDashboard';

const AppRoutes = () => {
  const [currentView, setCurrentView] = useState('home');
  const { isAuthenticated, isLoading, user, logout } = useAuth();
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
  useEffect(() => {
    if (!isAuthenticated && (currentView === 'admin' || currentView === 'user-dashboard')) {
      setCurrentView('home');
    }
  }, [isAuthenticated, currentView]);
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

  // Loading state
  if (isLoading) {
    return <CustomLoader message="Chargement..." />;
  }

  // Handle logout
  const handleLogout = async () => {
  await logout(); // if logout is async
  setCurrentView('home');
  window.location.reload(); // optional - ensures clean state
};

  // Handle navigation to dashboard
  const handleGoToDashboard = () => {
    if (user?.role === 'admin') {
      setCurrentView('admin');
    } else {
      setCurrentView('user-dashboard');
    }
  };

  // Render based on current view
  const renderCurrentView = () => {
      if ((currentView === 'admin' || currentView === 'user-dashboard') && !isAuthenticated) {
    return <Home onNavigate={setCurrentView} isAuthenticated={false} />;
  }
    
    switch (currentView) {
      case 'verify-email':
        return <EmailVerification />;
      case 'reset-password':
        return <ResetPasswordForm onSuccess={() => setCurrentView('home')} />;
      case 'admin':
        return <AdminLayout onLogout={handleLogout} />;
      case 'user-dashboard':
        return <UserDashboard onLogout={handleLogout} />;
      default:
        return (
          <Home 
            onNavigate={setCurrentView} 
            isAuthenticated={isAuthenticated}
            user={user}
            onLogout={handleLogout}
            onGoToDashboard={handleGoToDashboard}
          />
        );
    }
  };


  return (
    <div className="App">
      {renderCurrentView()}
    </div>
  );
};

export default AppRoutes;