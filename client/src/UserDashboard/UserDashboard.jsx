import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Search, 
  Filter, 
  BarChart2, 
  ChevronDown, 
  ChevronUp,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  RotateCcw,
  Plus,
  LogOut,
  Download,
  Printer,
  FileText,
  FileSliders,
  FileSignature,
  AlertCircle,
  Info
} from 'lucide-react';
import { useAuth } from '../Auth/AuthContext';
import axios from 'axios';

// Composant Sidebar modifié avec animations améliorées
const AnimatedDashboardSidebar = ({ 
  dashboards = [],
  isLoading = false,
  searchTerm = '',
  setSearchTerm,
  filters = {},
  setFilters,
  selectedDashboard,
  setSelectedDashboard,
  resetFilters
}) => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState(null);

  const sidebarVariants = {
    open: { width: 320, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    closed: { width: 80, transition: { type: 'spring', stiffness: 300, damping: 30 } }
  };

  const handleMouseEnter = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setIsSidebarOpen(true);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setIsSidebarOpen(false);
      setFiltersOpen(false);
    }, 300);
    setHoverTimeout(timeout);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeout) clearTimeout(hoverTimeout);
    };
  }, [hoverTimeout]);

  const getAvatarUrl = (avatar, name) => {
    if (!avatar) {
      return `https://api.dicebear.com/7.x/initials/svg?seed=${name || 'default'}`;
    }
    if (avatar.startsWith('http')) {
      return avatar;
    }
    return avatar;
  };

  const getDashboardIcon = (dashboard) => {
    return dashboard.isPublic ? <Globe size={16} /> : <Lock size={16} />;
  };

  const getDashboardStatus = (dashboard) => {
    if (!dashboard.active) return { text: 'Inactif', color: 'text-red-400' };
    return { text: 'Actif', color: 'text-green-400' };
  };

  return (
    <motion.div
      initial="closed"
      animate={isSidebarOpen ? "open" : "closed"}
      variants={sidebarVariants}
      className="h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-2xl border-r border-slate-700 flex-shrink-0 relative z-50"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col h-full">
        {/* Header avec Logo */}
        <div className="p-5 flex items-center justify-between border-b border-slate-700">
          <AnimatePresence mode="wait">
            {isSidebarOpen ? (
              <motion.div 
                key="logo-open"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center"
              >
                <img src="/ID&A TECH .png" alt="Logo" className="w-60" />
              </motion.div>
            ) : (
              <motion.div 
                key="logo-closed"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center w-full"
              >
                <img src="/ID&A TECH1 .png" alt="Logo" className="w-10" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {!isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
            </motion.div>
          )}
        </div>

        {/* Profil utilisateur */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="p-4 border-b border-slate-700"
            >
              <div className="flex items-center space-x-3">
                <motion.img 
                  className="h-10 w-10 rounded-full object-cover border-2 border-slate-600"
                  src={getAvatarUrl(user?.avatar, user?.name)}
                  alt={`Avatar de ${user?.name || 'utilisateur'}`}
                  onError={(e) => {
                    e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'default'}`;
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{user?.name || 'Utilisateur'}</p>
                  <p className="text-xs text-slate-400 capitalize">{user?.role || 'Utilisateur'}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mode fermé - Avatar seulement */}
        {!isSidebarOpen && (
          <div className="p-4 border-b border-slate-700 flex justify-center">
            <motion.img 
              className="h-8 w-8 rounded-full object-cover border-2 border-slate-600"
              src={getAvatarUrl(user?.avatar, user?.name)}
              alt={`Avatar de ${user?.name || 'utilisateur'}`}
              onError={(e) => {
                e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'default'}`;
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            />
          </div>
        )}

        {/* Barre de recherche */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="px-4"
            >
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <motion.input
                  type="text"
                  placeholder="Rechercher un dashboard..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  whileFocus={{ scale: 1.01 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filtres */}
        <div className="px-4">
          <motion.button
            onClick={() => isSidebarOpen && setFiltersOpen(!filtersOpen)}
            className="w-full flex items-center justify-between p-3 rounded-lg transition-all hover:bg-slate-700 text-slate-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center">
              <Filter size={18} className="flex-shrink-0" />
              <AnimatePresence>
                {isSidebarOpen && (
                  <motion.span 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="ml-3 whitespace-nowrap"
                  >
                    Filtres
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            {isSidebarOpen && (
              filtersOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />
            )}
          </motion.button>

          <AnimatePresence>
            {filtersOpen && isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="ml-4 mt-2 space-y-3 overflow-hidden"
              >
                {/* Filtre public/privé */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="text-xs text-slate-400 mb-1 block">Visibilité</label>
                  <select 
                    value={filters.isPublic || 'all'}
                    onChange={(e) => setFilters({...filters, isPublic: e.target.value})}
                    className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  >
                    <option value="all">Tous</option>
                    <option value="yes">Public</option>
                    <option value="no">Privé</option>
                  </select>
                </motion.div>

                {/* Filtre actif/inactif */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <label className="text-xs text-slate-400 mb-1 block">Statut</label>
                  <select 
                    value={filters.active || 'all'}
                    onChange={(e) => setFilters({...filters, active: e.target.value})}
                    className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  >
                    <option value="all">Tous</option>
                    <option value="yes">Actif</option>
                    <option value="no">Inactif</option>
                  </select>
                </motion.div>

                {/* Tri */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="text-xs text-slate-400 mb-1 block">Trier par</label>
                  <select 
                    value={filters.sort || 'newest'}
                    onChange={(e) => setFilters({...filters, sort: e.target.value})}
                    className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  >
                    <option value="newest">Plus récent</option>
                    <option value="oldest">Plus ancien</option>
                    <option value="name">Nom</option>
                  </select>
                </motion.div>

                <motion.button
                  onClick={resetFilters}
                  className="flex items-center text-xs text-slate-400 hover:text-white transition-colors"
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                >
                  <RotateCcw size={14} className="mr-1" />
                  Réinitialiser
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Liste des dashboards */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          <div className="flex items-center justify-between mb-3">
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.h3 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-sm font-medium text-slate-300"
                >
                  Mes Dashboards ({dashboards.length})
                </motion.h3>
              )}
            </AnimatePresence>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <motion.div 
                  key={i} 
                  className="animate-pulse"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="h-12 bg-slate-700 rounded-lg"></div>
                </motion.div>
              ))}
            </div>
          ) : dashboards.length === 0 ? (
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="text-center py-8"
                >
                  <BarChart2 size={32} className="mx-auto text-slate-500 mb-2" />
                  <p className="text-sm text-slate-400">Aucun dashboard trouvé</p>
                </motion.div>
              )}
            </AnimatePresence>
          ) : (
            <div className="space-y-2">
              {dashboards.map((dashboard, index) => {
                const status = getDashboardStatus(dashboard);
                const isSelected = selectedDashboard?._id === dashboard._id;
                const hasAccess = dashboard.active ;
                
                return (
                  <motion.div
                    key={dashboard._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                  >
                    <motion.button
                      onClick={() => hasAccess && setSelectedDashboard(dashboard)}
                      className={`w-full text-left p-3 rounded-lg transition-all group ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                          : hasAccess 
                            ? 'hover:bg-slate-700 text-slate-300' 
                            : 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
                      }`}
                      whileHover={{ 
                        scale: hasAccess ? 1.02 : 1, 
                        x: hasAccess ? 2 : 0 
                      }}
                      whileTap={{ scale: hasAccess ? 0.98 : 1 }}
                      layout
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-1 rounded-lg ${
                          isSelected 
                            ? 'bg-white/20' 
                            : hasAccess 
                              ? 'bg-slate-600' 
                              : 'bg-slate-700'
                        } flex-shrink-0`}>
                          {hasAccess ? <BarChart2 size={16} /> : <Lock size={16} />}
                        </div>
                        
                        <AnimatePresence>
                          {isSidebarOpen && (
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.1 }}
                              className="flex-1 min-w-0"
                            >
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium truncate text-sm">
                                  {dashboard.name}
                                </h4>
                                <div className="flex items-center space-x-1 ml-2">
                                  {getDashboardIcon(dashboard)}
                                  {hasAccess ? (
                                    dashboard.active ? 
                                      <Eye size={12} className="text-green-400" /> : 
                                      <EyeOff size={12} className="text-red-400" />
                                  ) : (
                                    <AlertCircle size={12} className="text-yellow-400" />
                                  )}
                                </div>
                              </div>
                              
                              {dashboard.description && (
                                <p className="text-xs opacity-75 truncate mt-1">
                                  {dashboard.description}
                                </p>
                              )}
                              
                              <div className="flex items-center justify-between mt-2">
                                <span className={`text-xs ${
                                  hasAccess 
                                    ? status.color 
                                    : 'text-yellow-400'
                                }`}>
                                  {hasAccess ? status.text : 'Accès restreint'}
                                </span>
                                <span className="text-xs opacity-50">
                                  {new Date(dashboard.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Instructions de survol en mode fermé */}
        {!isSidebarOpen && (
          <div className="px-4 py-2">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <div className="text-xs text-slate-500 mb-2">
                Survolez pour ouvrir
              </div>
              <motion.div 
                className="flex justify-center"
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut",
                }}
              >
                <div className="w-6 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              </motion.div>
            </motion.div>
          </div>
        )}

        {/* Bouton de déconnexion */}
        <div className="p-4 border-t border-slate-700">
          <motion.button
            onClick={logout}
            className="w-full flex items-center justify-center p-3 rounded-lg transition-all hover:bg-red-500 cursor-pointer text-white"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogOut size={20} className="flex-shrink-0" />
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="ml-3 whitespace-nowrap"
                >
                  Déconnexion
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// Composant DashboardViewer amélioré avec animations
const DashboardViewer = ({ dashboard, user, setSelectedDashboard }) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setIframeLoaded(false);
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [dashboard]);

  const handleIframeLoad = () => {
    setIframeLoaded(true);
  };

  return (
    <motion.div
      key={dashboard._id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden h-full"
    >
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            {dashboard.name}
            {!dashboard.active && (
              <motion.span 
                className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                Inactif
              </motion.span>
            )}
            {dashboard.isPublic && (
              <motion.span 
                className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, delay: 0.1 }}
              >
                Public
              </motion.span>
            )}
          </h2>
          {dashboard.description && (
            <p className="text-gray-600 mt-1">{dashboard.description}</p>
          )}
        </motion.div>
        
        <motion.div 
          className="flex gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
       
        </motion.div>
      </div>
      
      <div className="h-[calc(100vh-200px)] min-h-[500px] relative">
        {!dashboard.active ? (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center bg-gray-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="text-center p-6 max-w-md"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <motion.div 
                className="mx-auto bg-red-100 text-red-600 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4"
                animate={{
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 0.5,
                  ease: "easeInOut",
                }}
              >
                <BarChart2 size={24} />
              </motion.div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Dashboard désactivé</h3>
              <p className="text-gray-500 mb-4">
                Ce tableau de bord a été désactivé par l'administrateur et n'est plus accessible.
              </p>
              <motion.button
                onClick={() => setSelectedDashboard(null)}
                className="text-blue-600 hover:text-blue-800 font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Retour à la liste
              </motion.button>
            </motion.div>
          </motion.div>
        ) : (
          <>
            {(!iframeLoaded || isLoading) && (
              <motion.div 
                className="absolute inset-0 flex items-center justify-center bg-gray-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "linear",
                  }}
                >
                  <BarChart2 size={48} className="text-gray-400" />
                </motion.div>
              </motion.div>
            )}
            
            <motion.div 
              id="dashboard-iframe-container" 
              className="w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: iframeLoaded ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <iframe 
                src={dashboard.url} 
                title={dashboard.name}
                className="w-full h-full border-0"
                loading="lazy"
                onLoad={handleIframeLoad}
              />
            </motion.div>
          </>
        )}
      </div>
      
      <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex flex-col sm:flex-row justify-between items-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          Assigné le {new Date(dashboard.createdAt).toLocaleDateString()}
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Dernière mise à jour : {new Date(dashboard.updatedAt).toLocaleDateString()}
        </motion.div>
      </div>
    </motion.div>
  );
};

// Composant EmptyState avec animations
const EmptyState = ({ hasDashboards, resetFilters }) => {
  return (
    <motion.div 
      className="flex items-center justify-center h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="text-center p-8"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <motion.div
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: "easeInOut",
          }}
        >
          <BarChart2 size={64} className="mx-auto text-gray-400 mb-4" />
        </motion.div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">
          {hasDashboards ? 'Sélectionnez un dashboard' : 'Aucun dashboard disponible'}
        </h3>
        <p className="text-gray-500 mb-4">
          {hasDashboards 
            ? 'Choisissez un dashboard dans la sidebar pour le visualiser' 
            : 'Vous n\'avez pas encore de dashboards assignés'
          }
        </p>
        {hasDashboards && (
          <motion.button
            onClick={resetFilters}
            className="text-blue-600 hover:text-blue-800 font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Réinitialiser les filtres
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
};

// Composant principal UserDashboard avec gestion des accès
const UserDashboard = () => {
  const { user } = useAuth();
  const [dashboards, setDashboards] = useState([]);
  const [filteredDashboards, setFilteredDashboards] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [filters, setFilters] = useState({
    isPublic: 'all',
    active: 'all',
    sort: 'newest'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserDashboards = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`/api/dashboards/my-dashboards`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        // Marquer les dashboards auxquels l'utilisateur a accès
        const processedDashboards = response.data.dashboards.map(dashboard => ({
          ...dashboard,
          hasAccess: dashboard.allowedUsers?.includes(user._id) || dashboard.isPublic
        }));
        
        setDashboards(processedDashboards || []);
        setFilteredDashboards(processedDashboards || []);
      } catch (error) {
        console.error('Error fetching user dashboards:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDashboards();
  }, [user._id]);

  useEffect(() => {
    let result = [...dashboards];
    
    if (searchTerm) {
      result = result.filter(dashboard => 
        dashboard.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dashboard.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filters.isPublic !== 'all') {
      result = result.filter(dashboard => 
        filters.isPublic === 'yes' ? dashboard.isPublic : !dashboard.isPublic
      );
    }
    
    if (filters.active !== 'all') {
      result = result.filter(dashboard => 
        filters.active === 'yes' ? dashboard.active : !dashboard.active
      );
    }
    
    if (filters.sort === 'newest') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (filters.sort === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (filters.sort === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    setFilteredDashboards(result);
  }, [searchTerm, filters, dashboards]);

  const resetFilters = () => {
    setSearchTerm('');
    setFilters({
      isPublic: 'all',
      active: 'all',
      sort: 'newest'
    });
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex h-screen">
        <AnimatedDashboardSidebar 
          dashboards={filteredDashboards}
          isLoading={isLoading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filters={filters}
          setFilters={setFilters}
          selectedDashboard={selectedDashboard}
          setSelectedDashboard={setSelectedDashboard}
          resetFilters={resetFilters}
        />
        <div className="flex-1 p-6 overflow-hidden">
          {selectedDashboard ? (
            <DashboardViewer 
              dashboard={selectedDashboard} 
              user={user}
              setSelectedDashboard={setSelectedDashboard}
            />
          ) : (
            <EmptyState 
              hasDashboards={filteredDashboards.length > 0}
              resetFilters={resetFilters}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default UserDashboard;