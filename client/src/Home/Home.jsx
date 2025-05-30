import React, { useState, useEffect } from 'react';
import LoginForm from '../Auth/LoginForm';
import RegisterForm from '../Auth/RegisterForm';
import ForgotPasswordForm from '../Auth/ForgotPasswordForm';
import { motion } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Home = ({ onLogin }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentAuthView, setCurrentAuthView] = useState('login');
  const [publicDashboards, setPublicDashboards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicDashboards = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/dashboards/public`);
        const data = await response.json();
        if (data.success) {
          // Filtrer uniquement les dashboards publics
          const publicDashs = data.data.filter(dashboard => dashboard.isPublic);
          setPublicDashboards(publicDashs);
        }
      } catch (error) {
        console.error('Error fetching public dashboards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicDashboards();
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
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-6xl font-bold text-gray-900 mb-6"
            >
              Bienvenue sur{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                ID&A TECH-DASH 
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              Découvrez une expérience unique avec notre plateforme innovante. 
              Connectez-vous pour accéder à toutes nos fonctionnalités exclusives.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
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
            </motion.div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-10 w-32 h-32 bg-purple-400/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-pink-400/20 rounded-full blur-xl"></div>
      </main>

      {/* Public Dashboards Section */}
     {/* Public Dashboards Section */}
<section id="dashboards" className="py-16 bg-white/50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="text-center mb-12"
    >
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Dashboards Publics</h2>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
        Explorez nos dashboards Power BI créés par notre communauté.
      </p>
    </motion.div>

    {loading ? (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    ) : publicDashboards.length > 0 ? (
      <div className="grid grid-cols-1 gap-8">
        {publicDashboards.map((dashboard, index) => (
          <motion.div
            key={dashboard._id}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.8 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{dashboard.name}</h3>
                </div>
          
              </div>
            </div>
            
            {/* Power BI Iframe Container */}
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              viewport={{ once: true }}
              className="relative pt-[56.25%] bg-gray-100" // 16:9 aspect ratio
            >
              <iframe
                src={dashboard.url}
                className="absolute top-0 left-0 w-full h-full border-0"
                allowFullScreen
                loading="lazy"
              />
              
           
            </motion.div>
            
            <div className="p-4 bg-gray-50 flex justify-end">
              <a 
                href={dashboard.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Ouvrir en plein écran
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    ) : (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center py-12"
      >
        <p className="text-gray-600">Aucun dashboard public disponible pour le moment.</p>
      </motion.div>
    )}
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">À propos de ID&A TECH-DASH</h2>
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
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input 
                    type="text" 
                    id="name" 
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Votre nom"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    id="email" 
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Votre email"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
                <input 
                  type="text" 
                  id="subject" 
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Sujet de votre message"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea 
                  id="message" 
                  rows="4" 
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Votre message"
                ></textarea>
              </div>
              <div className="flex justify-center">
                <button 
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-full text-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Envoyer le message
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
              <img src="/ID&A TECH .png" alt="Logo" className="w-32 mb-4" />
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
                  +123 456 7890
                </li>
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