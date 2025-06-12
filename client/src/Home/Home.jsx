import React, { useState, useEffect } from 'react';
import LoginForm from '../Auth/LoginForm';
import RegisterForm from '../Auth/RegisterForm';
import ForgotPasswordForm from '../Auth/ForgotPasswordForm';
import { motion } from 'framer-motion';
import PricingSection from './PricingSection';
import { LayoutDashboard } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Home = ({ onLogin, isAuthenticated, user, onLogout, onGoToDashboard }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentAuthView, setCurrentAuthView] = useState('login');
  const [dashboards, setDashboards] = useState([]);
  const [privateDashboards, setPrivateDashboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [activeTab, setActiveTab] = useState('public'); // 'public' or 'private'
  const [showPricing, setShowPricing] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setContactSuccess(true);
        setContactForm({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
        
        setTimeout(() => setContactSuccess(false), 5000);
      } else {
        alert(data.message || 'Erreur lors de l\'envoi du message');
      }
    } catch (error) {
      alert('Erreur réseau - veuillez réessayer plus tard');
    } finally {
      setContactLoading(false);
    }
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    const fetchDashboards = async () => {
      try {
        setLoading(true);
        
        // Fetch public dashboards
        const publicResponse = await fetch(`${API_BASE_URL}/api/dashboards/public`);
        const publicData = await publicResponse.json();
        
        // Fetch private dashboard names
        const privateResponse = await fetch(`${API_BASE_URL}/api/dashboards/private-names`);
        const privateData = await privateResponse.json();
        
        if (publicData.success && privateData.success) {
          const publicDashs = publicData.data.filter(dashboard => dashboard.isPublic);
          setDashboards(publicDashs);
          setPrivateDashboards(privateData.data);
          
          // Select first public dashboard by default
          if (publicDashs.length > 0) {
            setSelectedDashboard(publicDashs[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboards();
  }, []);

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

  const getUserInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const UserAvatar = ({ size = "w-10 h-10", showFallback = true }) => {
    const [imageError, setImageError] = useState(false);
    
    const hasValidAvatar = user?.avatar && !imageError && 
                          (user.avatar.startsWith('http') || user.avatar.startsWith('/'));

    if (hasValidAvatar) {
      return (
        <img
          src={user.avatar}
          alt={user.name || 'Avatar utilisateur'}
          className={`${size} rounded-full object-cover shadow-md border-2 border-white`}
          onError={() => setImageError(true)}
          referrerPolicy="no-referrer"
        />
      );
    }
    
    if (showFallback) {
      return (
        <div className={`${size} bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md`}>
          {getUserInitial()}
        </div>
      );
    }
    
    return null;
  };

  const renderAuthContent = () => {
    const authHeader = (
      <div className="flex flex-col items-center mb-6">
        <img 
          src="/ID&A TECH .png" 
          alt="Logo" 
          className="w-50 mb-4"
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
              onLoginSuccess={() => {
                setShowAuthModal(false);
                onLogin();
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
                <a href="#dashboards" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                  Dashboards
                </a>
                <a href="#apropos" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                  À propos
                </a>
                <a href="#contact" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                  Contact
                </a>
              </div>
            </div>

            {/* Auth Buttons ou User Menu */}
            <div className="flex items-center space-x-4">
              {!isAuthenticated ? (
                <>
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
                </>
              ) : (
                /* User Menu */
                <div className="relative">
                  <div
                    className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200"
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                  >
                    {/* Avatar */}
                    <UserAvatar />
                    {/* User Info */}
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.name || 'Utilisateur'}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {user?.role || 'Membre'}
                      </p>
                    </div>
                    {/* Dropdown Icon */}
                    <svg 
                      className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Dropdown Menu */}
                  {showUserDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <UserAvatar size="w-12 h-12" />
                          <div>
                            <p className="font-medium text-gray-900">{user?.name || 'Utilisateur'}</p>
                            <p className="text-sm text-gray-500">{user?.email}</p>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                              {user?.role || 'Membre'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="py-2">
                        <button
                          onClick={() => {
                            onGoToDashboard();
                            setShowUserDropdown(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 cursor-pointer"
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                          Mon Dashboard
                        </button>
                        
                        <div className="border-t border-gray-100 mt-2 pt-2">
                          <button
                            onClick={() => {
                              onLogout();
                              setShowUserDropdown(false);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 cursor-pointer"
                          >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Se déconnecter
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-6xl font-bold text-gray-900 mb-6"
            >
              {isAuthenticated && user ? (
                <>
                  Bienvenue{' '}
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                    {user.name || 'sur InsightOne Dashboard'}
                  </span>
                </>
              ) : (
                <>
                  Bienvenue sur{' '}
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                    InsightOne Dashboard 
                  </span>
                </>
              )}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              {isAuthenticated && user ? (
                `Explorez tous nos dashboards et fonctionnalités. Accédez à votre espace personnel pour gérer vos données.`
              ) : (
                'Découvrez une expérience unique avec notre plateforme innovante. Connectez-vous pour accéder à toutes nos fonctionnalités exclusives.'
              )}
            </motion.p>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              {!isAuthenticated ? (
                <>
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
                </>
              ) : (
                <>
                  <button
                    onClick={onGoToDashboard}
                    className="bg-gradient-to-r cursor-pointer from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
                  >
                    Accéder à mon dashboard
                  </button>
                  <button className="text-gray-700 hover:text-blue-600 px-8 py-4 rounded-full text-lg font-medium transition-colors duration-200 flex items-center">
                    Explorer les dashboards publics
                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </button>
                </>
              )}
            </motion.div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-10 w-32 h-32 bg-purple-400/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-pink-400/20 rounded-full blur-xl"></div>
      </main>

      {/* Dashboards Section with Sidebar */}
 <section id="dashboards" className="py-16 bg-white/50 ">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="text-center mb-12"
    >
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Explorez nos Dashboards</h2>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
        Découvrez tous nos dashboards Power BI. Cliquez sur un dashboard pour y accéder.
      </p>
    </motion.div>

    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar Navigation - Tous les dashboards */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow-md overflow-hidden sticky top-6">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Tous les Les tableaux de bord</h3>
            <p className="text-sm text-gray-500 mt-1">
            </p>
          </div>
          
          <div className="p-2 max-h-96 lg:max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <ul className="space-y-1">
                {/* Dashboards publics */}
                {dashboards.map((dashboard) => (
                  <li key={dashboard._id}>
                    <button
                      onClick={() => {
                        setSelectedDashboard(dashboard);
                        setShowPricing(false);
                      }}
                      className={`w-full text-left px-3 py-3 cursor-pointer rounded-lg transition-all duration-200 text-sm ${
                        selectedDashboard?._id === dashboard._id && !showPricing
                          ? 'bg-green-100 text-green-800 shadow-sm border-l-4 border-green-500' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center cursor-pointer justify-between">
                        <div className="flex items-center">
                          <LayoutDashboard className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="font-medium line-clamp-2">{dashboard.name}</span>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}

                {/* Dashboards privés */}
                {privateDashboards.map((dashboard) => (
                  <li key={dashboard._id}>
                    <button
                      onClick={() => {
                        setSelectedDashboard(dashboard);
                        setShowPricing(true);
                      }}
                      className={`w-full text-left px-3 py-3 cursor-pointer rounded-lg transition-all duration-200 text-sm ${
                        selectedDashboard?._id === dashboard._id && showPricing
                          ? 'bg-blue-100 text-blue-800 shadow-sm border-l-4 border-blue-500' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <LayoutDashboard className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="font-medium line-clamp-2">{dashboard.name}</span>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}

                {/* Message si aucun dashboard */}
                {dashboards.length === 0 && privateDashboards.length === 0 && (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    Aucun dashboard disponible
                  </div>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-3">
        
        {loading ? (
          <div className="flex justify-center items-center py-12 bg-white rounded-2xl shadow-md">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : showPricing ? (
          /* Affichage du pricing pour les dashboards privés */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
           
            
            {/* Pricing Section */}
        <div className="p-4 lg:p-6">
  <div className="flex items-center justify-between mb-4">
    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
      <LayoutDashboard className="inline-block mr-2 w-6 h-6 text-gray-700" />
      {selectedDashboard?.name}
    </h1>
    <img src="/ID&A TECH .png" alt="Logo ID&A TECH" className="h-6 lg:h-8 w-auto" />
  </div>

  <PricingSection />
</div>

            
            <div className="p-3 lg:p-4 bg-gray-50 flex justify-between items-center">
              <div className="text-xs text-gray-500">
                Dashboard privé • ID&A TECH
              </div>
              <img src="/ID&A TECH .png" alt="Logo ID&A TECH" className="h-6 lg:h-8 w-auto" />
            </div>
          </motion.div>
        ) : selectedDashboard ? (
          /* Affichage du dashboard public */
          <motion.div
            key={selectedDashboard._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="p-4 lg:p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3 mb-2">
                <LayoutDashboard className="w-6 h-6 text-gray-700" />
                <div>
                  <h3 className="text-xl lg:text-2xl font-bold text-gray-900">
                    {selectedDashboard.name}
                  </h3>
                </div>
              </div>
              
              {selectedDashboard.description && (
                <p className="text-gray-600 text-sm lg:text-base">
                  {selectedDashboard.description}
                </p>
              )}
            </div>
            
            {/* Power BI Iframe Container */}
            <div className="relative aspect-video bg-gray-100">
              <iframe
                src={selectedDashboard.url}
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen
                loading="lazy"
                title={`Dashboard ${selectedDashboard.name}`}
              />
            </div>
            
            <div className="p-3 lg:p-4 bg-gray-50 flex justify-between items-center">
              <div className="text-xs text-gray-500">
                Dashboard public • ID&A TECH
              </div>
              <img src="/ID&A TECH .png" alt="Logo ID&A TECH" className="h-6 lg:h-8 w-auto" />
            </div>
          </motion.div>
        ) : (
          /* État initial - aucun dashboard sélectionné */
          <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LayoutDashboard className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sélectionnez un dashboard</h3>
              <p className="text-gray-500 text-sm">
                Choisissez un dashboard dans la liste de gauche pour l'afficher ou voir les options d'abonnement.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
</section>
     

      {/* About Section */}
      <section id="apropos" className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">À propos de InsightOne Dashboard</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Notre plateforme permet de créer, partager et explorer des dashboards analytiques puissants.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Création Simplifiée",
                description: "Créez des dashboards personnalisés en quelques clics avec notre interface intuitive.",
                icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              },
              {
                title: "Partage Contrôlé",
                description: "Partagez vos dashboards en public ou restreignez l'accès à des utilisateurs spécifiques.",
                icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              },
              {
                title: "Analyses Puissantes",
                description: "Transformez vos données en insights actionnables avec nos outils d'analyse avancés.",
                icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.03 }}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg mr-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                </div>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <br />
 <PricingSection />
      {/* Contact Section */}
      <section id="contact" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Contactez-nous</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Vous avez des questions ? Notre équipe est là pour vous aider.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-xl shadow-lg"
          >
            <form onSubmit={handleContactSubmit} className="space-y-6">
              {contactSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
                >
                  Votre message a été envoyé avec succès !
                </motion.div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name"
                    value={contactForm.name}
                    onChange={handleContactChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Votre nom"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email"
                    value={contactForm.email}
                    onChange={handleContactChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Votre email"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
                <input 
                  type="text" 
                  id="subject" 
                  name="subject"
                  value={contactForm.subject}
                  onChange={handleContactChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Sujet de votre message"
                  required
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea 
                  id="message" 
                  name="message"
                  rows="4" 
                  value={contactForm.message}
                  onChange={handleContactChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Votre message"
                  required
                ></textarea>
              </div>
              <div className="flex justify-center">
                <button 
                  type="submit"
                  disabled={contactLoading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-full text-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {contactLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Envoi en cours...
                    </>
                  ) : 'Envoyer le message'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <a href="https://idatech.ma/"><img src="/ID&A TECH .png" alt="Logo" className="w-32 mb-4" /></a>
              
              <p className="text-gray-400">
                Plateforme de dashboards analytiques pour transformer vos données en insights.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Navigation</h3>  
              <ul className="space-y-2">
                <li><a href="#accueil" className="text-gray-400 hover:text-white transition-colors">Accueil</a></li>
                <li><a href="#dashboards" className="text-gray-400 hover:text-white transition-colors">Dashboards</a></li>
                <li><a href="#apropos" className="text-gray-400 hover:text-white transition-colors">À propos</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Légal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Conditions d'utilisation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Politique de confidentialité</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Mentions légales</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  contact@idatech.com
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
+212 5 20 07 60 75                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} ID&A TECH. Tous droits réservés.</p>
          </div>
        </div>
      </footer>

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
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full"
            >
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
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;