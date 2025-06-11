import React, { useState, useEffect } from 'react';
import { useAuth } from './Auth/AuthContext';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Home from './Home/Home';
import Dashboard from './Auth/Dashboard';
import AdminLayout from './Admin/AdminLayout ';
import EmailVerification from './Auth/EmailVerification';
import ResetPasswordForm from './Auth/ResetPasswordForm';
import CustomLoader from './CustomLoader/CustomLoader';
import UserDashboard from './UserDashboard/UserDashboard';

const AppRoutes = () => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [showLoader, setShowLoader] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [currentView, setCurrentView] = useState('home');
  const [hasCheckedUrl, setHasCheckedUrl] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (hasCheckedUrl) return;

if (urlParams.get('token')) {
  if (location.pathname.includes('/reset-password')) {
    console.log('Token détecté pour réinitialisation de mot de passe');
    navigate(`/reset-password?token=${urlParams.get('token')}`); // Ajoutez cette ligne
  } else {
    console.log('Token détecté pour vérification email');
    navigate(`/verify-email?token=${urlParams.get('token')}`); // Ajoutez cette ligne
  }
}else if (urlParams.get('error') === 'google_auth_failed') {
      alert('Échec de l\'authentification Google. Veuillez réessayer.');
      navigate('/');
    }
    setHasCheckedUrl(true);
  }, [location, navigate, hasCheckedUrl]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    window.location.reload();
  };

  const handleGoToDashboard = () => {
    if (isAuthenticated) {
      if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/user-dashboard');
      }
    }
  };

  if (showLoader || isLoading) {
    return <CustomLoader message="Chargement..." />;
  }

  return (
    <div className="App">
      <Routes>
        <Route 
          path="/" 
          element={
            <Home 
              onNavigate={setCurrentView} 
              isAuthenticated={isAuthenticated}
              user={user}
              onLogout={handleLogout}
              onGoToDashboard={handleGoToDashboard}
            />
          } 
        />
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route path="/reset-password" element={<ResetPasswordForm onSuccess={() => navigate('/')} />} />
        
        {isAuthenticated && user?.role === 'admin' && (
          <Route path="/admin/*" element={<AdminLayout onLogout={handleLogout} />} />
        )}
        
        {isAuthenticated && user?.role !== 'admin' && (
          <Route path="/user-dashboard" element={<UserDashboard onLogout={handleLogout} />} />
        )}
        
        {/* Redirection pour les routes non autorisées */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default AppRoutes;