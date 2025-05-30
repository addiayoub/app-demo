import React, { useState } from 'react';
import LoginForm from '../Auth/LoginForm'
import RegisterForm from '../Auth/RegisterForm';
import ForgotPasswordForm from '../Auth/ForgotPasswordForm';

const Home = ({ onLogin }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentAuthView, setCurrentAuthView] = useState('login');

  const openModal = (view = 'login') => {
    setCurrentAuthView(view);
    setShowAuthModal(true);
  };

  const closeModal = () => {
    setShowAuthModal(false);
  };

  const switchAuthView = (view) => {
    setCurrentAuthView(view);
  };

const renderAuthContent = () => {
  const authHeader = (
    <div className="flex flex-col items-center mb-6">
      <img 
        src="/ID&A TECH .png" 
        alt="Logo" 
        className="w-40 mb-4"  // Ajustez la taille selon vos besoins
      />
  
    </div>
  );

  switch (currentAuthView) {
    case 'login':
      return (
        <>
          {authHeader}
          <LoginForm 
            onSwitchToRegister={() => switchAuthView('register')} 
            onSwitchToForgotPassword={() => switchAuthView('forgot-password')}
            onSuccess={() => {
              closeModal();
              if (onLogin) onLogin();
            }}
          />
        </>
      );
    case 'register':
      return (
        <>
          {authHeader}
          <RegisterForm 
            onSwitchToLogin={() => switchAuthView('login')}
            onSuccess={() => {
              closeModal();
              if (onLogin) onLogin();
            }}
          />
        </>
      );
    case 'forgot-password':
      return (
        <>
          {authHeader}
          <ForgotPasswordForm 
            onSwitchToLogin={() => switchAuthView('login')}
          />
        </>
      );
    default:
      return (
        <>
          {authHeader}
          <LoginForm 
            onSwitchToRegister={() => switchAuthView('register')} 
            onSwitchToForgotPassword={() => switchAuthView('forgot-password')}
          />
        </>
      );
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                               <img src="/ID&A TECH .png" alt="Logo" className="w-50" />

              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="#accueil" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                  Accueil
                </a>
                <a href="#services" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                  Services
                </a>
                <a href="#apropos" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                  À propos
                </a>
                <a href="#contact" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                  Contact
                </a>
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => openModal('login')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 cursor-pointer hover:to-blue-800 text-white px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Se connecter
              </button>
              <button
                onClick={() => openModal('register')}
                className="border-2 border-blue-600 text-blue-600 hover: cursor-pointer hover:text-white px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105"
              >
                S'inscrire
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Bienvenue sur{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                ID&A TECH-DASH 
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Découvrez une expérience unique avec notre plateforme innovante. 
              Connectez-vous pour accéder à toutes nos fonctionnalités exclusives.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => openModal('register')}
                className="bg-gradient-to-r cursor-pointer from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
              >
                Commencer maintenant
              </button>
              <button className="text-gray-700 hover:text-blue-600 px-8 py-4 rounded-full text-lg font-medium transition-colors duration-200 flex items-center">
                En savoir plus
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-10 w-32 h-32 bg-purple-400/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-pink-400/20 rounded-full blur-xl"></div>
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={closeModal}
          ></div>
          
          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 animate-[modalSlideIn_0.3s_ease-out]">
              {/* Close Button */}
              
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 cursor-pointer transition-colors duration-200 z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Auth Content */}
              <div className="p-6">
                {renderAuthContent()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default Home;