import React, { useState } from 'react';
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
  LogOut
} from 'lucide-react';
import { useAuth } from '../Auth/AuthContext';

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
  const { user ,logout} = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const sidebarVariants = {
    open: { width: 320 },
    closed: { width: 80 },
    hover: { width: 320 }
  };

  const linkVariants = {
    open: { opacity: 1, x: 0 },
    closed: { opacity: 0, x: -20 },
    hover: { opacity: 1, x: 0 }
  };

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
      initial="open"
      animate={isSidebarOpen ? "open" : "closed"}
      whileHover={!isSidebarOpen ? "hover" : ""}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      variants={sidebarVariants}
      className="fixed top-0 left-0 h-full bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-2xl z-20 border-r border-slate-700"
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="flex flex-col h-full">
        {/* Header avec Logo */}
        <div className="p-5 flex items-center justify-between border-b border-slate-700">
          <AnimatePresence mode="wait">
            {(isSidebarOpen || isHovered) ? (
              <motion.div 
                key="logo-open"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center"
              >
                <img src="/ID&A TECH .png" alt="Logo" className="w-40" />
              </motion.div>
            ) : (
              <motion.div 
                key="logo-closed"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center"
              >
                <img src="/ID&A TECH1 .png" alt="Logo" className="w-10" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {(isSidebarOpen || isHovered) && (
            <motion.button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronDown size={16} className={`transform transition-transform ${isSidebarOpen ? 'rotate-90' : ''}`} />
            </motion.button>
          )}
        </div>

        {/* Profil utilisateur */}
        <AnimatePresence>
          {(isSidebarOpen || isHovered) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 border-b border-slate-700"
            >
              <div className="flex items-center space-x-3">
                <img 
                  className="h-10 w-10 rounded-full object-cover border-2 border-slate-600" 
                  src={getAvatarUrl(user?.avatar, user?.name)}
                  alt={`Avatar de ${user?.name || 'utilisateur'}`}
                  onError={(e) => {
                    e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'default'}`;
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{user?.name || 'Utilisateur'}</p>
                  <p className="text-xs text-slate-400 capitalize">{user?.role || 'Utilisateur'}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Barre de recherche */}
        <AnimatePresence>
          {(isSidebarOpen || isHovered) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher un dashboard..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filtres */}
        <div className="px-4">
          <motion.button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="w-full flex items-center justify-between p-3 rounded-lg transition-all hover:bg-slate-700 text-slate-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center">
              <Filter size={18} className="flex-shrink-0" />
              <AnimatePresence>
                {(isSidebarOpen || isHovered) && (
                  <motion.span 
                    variants={linkVariants}
                    initial="closed"
                    animate="open"
                    className="ml-3 whitespace-nowrap"
                  >
                    Filtres
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            {(isSidebarOpen || isHovered) && (
              filtersOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />
            )}
          </motion.button>

          <AnimatePresence>
            {filtersOpen && (isSidebarOpen || isHovered) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="ml-4 mt-2 space-y-3"
              >
                {/* Filtre public/privé */}
                <div>
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
                </div>

                {/* Filtre actif/inactif */}
                <div>
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
                </div>

                {/* Tri */}
                <div>
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
                </div>

                <motion.button
                  onClick={resetFilters}
                  className="flex items-center text-xs text-slate-400 hover:text-white transition-colors"
                  whileHover={{ x: 5 }}
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
              {(isSidebarOpen || isHovered) && (
                <motion.h3 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
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
                <div key={i} className="animate-pulse">
                  <div className="h-12 bg-slate-700 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : dashboards.length === 0 ? (
            <AnimatePresence>
              {(isSidebarOpen || isHovered) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <BarChart2 size={32} className="mx-auto text-slate-500 mb-2" />
                  <p className="text-sm text-slate-400">Aucun dashboard trouvé</p>
                </motion.div>
              )}
            </AnimatePresence>
          ) : (
            <div className="space-y-2">
              {dashboards.map((dashboard) => {
                const status = getDashboardStatus(dashboard);
                const isSelected = selectedDashboard?._id === dashboard._id;
                
                return (
                  <motion.button
                    key={dashboard._id}
                    onClick={() => setSelectedDashboard(dashboard)}
                    className={`w-full text-left p-3 rounded-lg transition-all group ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                        : 'hover:bg-slate-700 text-slate-300'
                    }`}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    layout
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-slate-600'}`}>
                        <BarChart2 size={16} />
                      </div>
                      
                      <AnimatePresence>
                        {(isSidebarOpen || isHovered) && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex-1 min-w-0"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium truncate text-sm">
                                {dashboard.name}
                              </h4>
                              <div className="flex items-center space-x-1 ml-2">
                                {getDashboardIcon(dashboard)}
                                {dashboard.active ? 
                                  <Eye size={12} className="text-green-400" /> : 
                                  <EyeOff size={12} className="text-red-400" />
                                }
                              </div>
                            </div>
                            
                            {dashboard.description && (
                              <p className="text-xs opacity-75 truncate mt-1">
                                {dashboard.description}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className={`text-xs ${status.color}`}>
                                {status.text}
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
                );
              })}
            </div>
          )}
        </div>

        {/* Bouton de déconnexion */}
        <div className="p-4 border-t border-slate-700">
               <motion.button
                       onClick={logout}
                       className="w-full flex items-center p-3 rounded-lg transition-all hover:bg-red-500 cursor-pointer text-white /90 mt-2"
                       whileHover={{ scale: 1.02 }}
                       whileTap={{ scale: 0.98 }}
                     >
                       <LogOut size={20} className="flex-shrink-0" />
                       <AnimatePresence>
                         {(isSidebarOpen || isHovered) && (
                           <motion.span 
                             variants={linkVariants}
                             initial="closed"
                             animate={isSidebarOpen || isHovered ? "open" : "closed"}
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

export default AnimatedDashboardSidebar;