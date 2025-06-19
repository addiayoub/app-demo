import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Search, Filter, BarChart2, ChevronDown, ChevronUp,
  Globe, Lock, Eye, EyeOff, Calendar, RotateCcw, Plus, LogOut,
  Download, Mail, FileText, FileSliders, FileSignature, AlertCircle,
  Info, Home, Crown, Gem, Rocket, Zap, CheckCircle, ExternalLink, RefreshCw, CreditCard
} from 'lucide-react';
import { useAuth } from '../Auth/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AnimatedDashboardSidebar = ({ 
  dashboards = {},
  isLoading = false,
  searchTerm = '',
  setSearchTerm,
  filters = {},
  setShowTicketSection,
  selectedDashboard,
  setSelectedDashboard,
  resetFilters,
  setShowPlanInfo,
  setShowPricingSection,
  onShowTickets
}) => {
  const { user, logout, token } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const initialState = {};
    Object.keys(dashboards).forEach(categoryId => {
      initialState[categoryId] = true;
    });
    setExpandedCategories(initialState);
  }, [dashboards]);

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const sidebarVariants = {
    open: { width: 350, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    closed: { width: 80, transition: { type: 'spring', stiffness: 300, damping: 30 } }
  };

  const fetchUserPlans = async () => {
    try {
      setPlansLoading(true);
      const response = await axios.get('/api/pricing/user-subscription', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success && response.data.hasSubscription) {
        setPlans([response.data.subscription]);
      } else {
        setPlans([]);
      }
    } catch (error) {
      console.error('Error fetching user plans:', error);
      setPlans([]);
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPlans();
  }, []);

  const handleMouseEnter = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setIsSidebarOpen(true);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setIsSidebarOpen(false);
      setFiltersOpen(false);
      setPlansOpen(false);
    }, 300);
    setHoverTimeout(timeout);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeout) clearTimeout(hoverTimeout);
    };
  }, [hoverTimeout]);

  const getDashboardBadge = (dashboard) => {
    if (dashboard.hasAccess) {
      if (dashboard.accessType === 'subscription') {
        return (
          <span className="px-2 py-0.5 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 text-xs rounded-full flex items-center gap-1">
            <Gem size={10} /> Plan
          </span>
        );
      } else if (dashboard.accessType === 'public') {
        return (
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
            <Globe size={10} /> Public
          </span>
        );
      } else {
        return (
          <span className="px-2 py-0.5 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 text-xs rounded-full flex items-center gap-1">
            <Gem size={10} /> Plan
          </span>
        );
      }
    }
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

  const getDashboardStatus = (dashboard) => {
    const dashboardData = dashboard.data || dashboard;
    if (!dashboardData.active) return { text: 'Inactif', color: 'text-red-400' };
    return { text: 'Actif', color: 'text-green-400' };
  };

  const getPlanIcon = (planName) => {
    switch (planName) {
      case 'Starter':
      case 'Basique':
        return <Zap size={16} className="text-yellow-500" />;
      case 'Pro':
        return <Rocket size={16} className="text-purple-500" />;
      case 'Enterprise':
        return <Crown size={16} className="text-blue-500" />;
      default:
        return <Gem size={16} className="text-green-500" />;
    }
  };

  const getStatusBadge = (status, isTrial) => {
    if (isTrial) {
      return (
        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full flex items-center gap-1">
          <Clock size={10} /> Essai
        </span>
      );
    }
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
            <CheckCircle size={10} /> Actif
          </span>
        );
      case 'canceled':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
            Annulé
          </span>
        );
      default:
        return null;
    }
  };

 const handleDashboardClick = (dashboard) => {
  if (!dashboard || typeof dashboard !== 'object') {
    console.error('Invalid dashboard clicked:', dashboard);
    return;
  }

  const hasAccess = dashboard.hasAccess && 
                   (!dashboard.expiresAt || new Date(dashboard.expiresAt) > new Date());

  if (!hasAccess) {
    setShowPricingSection(true);
    setShowPlanInfo(false);
    setSelectedDashboard(null);
    // Ajoutez cette ligne pour fermer la section tickets
    setShowTicketSection(false);
  } else {
    setSelectedDashboard(dashboard);
    setShowPricingSection(false);
    setShowPlanInfo(false);
    // Ajoutez cette ligne pour fermer la section tickets
    setShowTicketSection(false);
  }
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

        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="p-4 border-b border-slate-700"
            >
              <div className="flex items-center space-x-3 cursor-pointer">
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

        <div className="px-4">
          <motion.button
            onClick={() => {
              if (isSidebarOpen) {
                setShowPlanInfo(true);
                setShowPricingSection(false);
              }
            }}
            className="w-full flex items-center justify-between p-3 rounded-lg transition-all hover:bg-slate-700 cursor-pointer text-slate-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center">
              <CreditCard size={18} className="flex-shrink-0" />
              <AnimatePresence>
                {isSidebarOpen && (
                  <motion.span 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="ml-3 whitespace-nowrap"
                  >
                    Mon Plan
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            {isSidebarOpen && <ExternalLink size={16} />}
          </motion.button>

          <AnimatePresence>
            {plansOpen && isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="ml-4 mt-2 space-y-2 overflow-hidden max-h-80 overflow-y-auto"
              >
                {plansLoading ? (
                  <div className="space-y-2">
                    {[...Array(2)].map((_, i) => (
                      <motion.div 
                        key={i} 
                        className="animate-pulse"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <div className="h-16 bg-slate-700 rounded-lg"></div>
                      </motion.div>
                    ))}
                  </div>
                ) : plans.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-4 text-slate-400 text-sm"
                  >
                    <CreditCard size={24} className="mx-auto mb-2 opacity-50" />
                    Aucun abonnement actif
                  </motion.div>
                ) : (
                  plans.map((subscription) => (
                    <motion.div
                      key={subscription._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-700 rounded-lg p-3"
                    >
                      <motion.button
                        onClick={() => setExpandedPlan(expandedPlan === subscription._id ? null : subscription._id)}
                        className="w-full text-left"
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getPlanIcon(subscription.plan?.name)}
                            <span className="font-medium text-sm text-white">
                              {subscription.plan?.name || 'Abonnement'}
                            </span>
                          </div>
                          <motion.div
                            animate={{ rotate: expandedPlan === subscription._id ? 180 : 0 }}
                          >
                            <ChevronDown size={14} />
                          </motion.div>
                        </div>
                        <div className="flex items-center justify-between">
                          {getStatusBadge(subscription.status, subscription.isTrial)}
                          <span className="text-xs text-slate-300">
                            {subscription.plan?.price} {subscription.plan?.currency}
                          </span>
                        </div>
                      </motion.button>
                      <AnimatePresence>
                        {expandedPlan === subscription._id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-3 pt-3 border-t border-slate-600"
                          >
                            <div className="text-xs text-slate-400 mb-2">
                              Période: {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                            </div>
                            {subscription.dashboards && subscription.dashboards.length > 0 && (
                              <div>
                                <div className="text-xs text-slate-400 mb-1">
                                  Dashboards inclus ({subscription.dashboards.length})
                                </div>
                                <div className="space-y-1 max-h-24 overflow-y-auto">
                                  {subscription.dashboards.slice(0, 3).map((dashboard) => (
                                    <div key={dashboard._id} className="flex items-center gap-2 text-xs text-slate-300">
                                      <BarChart2 size={12} />
                                      <span className="truncate">{dashboard.name}</span>
                                    </div>
                                  ))}
                                  {subscription.dashboards.length > 3 && (
                                    <div className="text-xs text-slate-400">
                                      +{subscription.dashboards.length - 3} autres...
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            {subscription.isTrial && (
                              <div className="mt-2 text-xs text-yellow-400 flex items-center gap-1">
                                <AlertCircle size={12} />
                                Essai gratuit jusqu'au {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))
                )}
                {plans.filter(p => p.status === 'active' || p.status === 'trialing').length > 0 && (
                  <motion.button
                    onClick={fetchUserPlans}
                    className="w-full flex items-center justify-center gap-2 p-2 text-xs text-slate-400 hover:text-slate-300 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <RefreshCw size={12} className={plansLoading ? 'animate-spin' : ''} />
                    Actualiser
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-4">
          <motion.button
            onClick={() => {
              if (isSidebarOpen) {
                onShowTickets();
              }
            }}
            className="w-full flex items-center justify-between p-3 cursor-pointer rounded-lg transition-all hover:bg-blue-600 text-slate-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center">
              <Mail size={18} className="flex-shrink-0" />
              <AnimatePresence>
                {isSidebarOpen && (
                  <motion.span 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="ml-3 whitespace-nowrap"
                  >
                    Support Tickets
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            {isSidebarOpen && <ExternalLink size={16} />}
          </motion.button>
        </div>

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
          Mes Dashboards
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
  ) : Object.keys(dashboards).length === 0 ? (
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
    <div className="space-y-4">
      {Object.entries(dashboards).map(([categoryId, categoryData]) => {
        if (!categoryData || !categoryData.dashboards || !Array.isArray(categoryData.dashboards)) {
          console.warn(`Invalid category data for ${categoryId}:`, categoryData);
          return null;
        }

        return (
          <motion.div
            key={categoryId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            layout
          >
            {isSidebarOpen && (
              <motion.button 
                onClick={() => toggleCategory(categoryId)}
                className="w-full text-left text-xs font-medium text-slate-400 mb-2 px-2 p-2 cursor-pointer flex items-center justify-between"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ backgroundColor: 'rgba(30, 41, 59, 0.5)' }}
              >
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                  {categoryData.name || 'Sans catégorie'}
                  <span className="text-xs text-slate-500 ml-2">
                    ({categoryData.dashboards.length})
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: expandedCategories[categoryId] ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={14} />
                </motion.div>
              </motion.button>
            )}
            
            {(expandedCategories[categoryId] || !isSidebarOpen) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-2 cursor-pointer">
                  {categoryData.dashboards.map((dashboard, index) => {
                    if (!dashboard || typeof dashboard !== 'object') {
                      console.warn(`Invalid dashboard at index ${index}:`, dashboard);
                      return null;
                    }

                    const dashboardData = dashboard.data || dashboard;
                    const status = getDashboardStatus(dashboard);
                    const isSelected = selectedDashboard?._id === dashboard._id;
                    const hasAccess = dashboard.hasAccess && 
                      (!dashboard.expiresAt || new Date(dashboard.expiresAt) > new Date());

                    return (
                      <motion.div
                        key={dashboard._id || `dashboard-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        layout
                      >
                        <motion.button
                          onClick={() => handleDashboardClick(dashboard)}
                          className={`w-full ${isSidebarOpen ? 'text-left' : 'flex justify-center'} p-3 rounded-lg transition-all ${
                            isSelected
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                              : hasAccess
                                ? 'hover:bg-slate-700 text-slate-300'
                                : 'bg-slate-800/50 text-slate-500 cursor-pointer'
                          }`}
                          whileHover={{ scale: isSidebarOpen ? 1.02 : 1.1 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className={`flex ${isSidebarOpen ? 'items-start space-x-3' : 'justify-center'}`}>
                            <div className={`p-1 rounded-lg ${
                              isSelected
                                ? 'bg-white/20'
                                : hasAccess
                                  ? 'bg-slate-600'
                                  : 'bg-slate-700'
                            } flex-shrink-0`}>
                              {hasAccess ? <BarChart2 size={16} /> : <Lock size={16} />}
                            </div>

                            {isSidebarOpen && (
                              <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="flex-1 min-w-0"
                              >
                                <div className="flex items-center justify-between cursor-pointer">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium truncate text-sm">
                                      {dashboardData.name || 'Dashboard sans nom'}
                                    </h4>
                                    {getDashboardBadge(dashboard)}
                                  </div>
                                </div>
                                {dashboardData.description && (
                                  <p className="text-xs opacity-75 truncate mt-1">
                                    {dashboardData.description}
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
                                    {dashboardData.createdAt && !isNaN(new Date(dashboardData.createdAt).getTime()) 
                                      ? new Date(dashboardData.createdAt).toLocaleDateString() 
                                      : 'Date invalide'}
                                  </span>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  )}
</div>

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
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <div className="w-6 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              </motion.div>
            </motion.div>
          </div>
        )}

        <div className="p-4 border-t border-slate-700">
          <motion.button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center p-3 rounded-lg transition-all hover:bg-blue-500 cursor-pointer text-white mb-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
          >
            <Home size={20} className="flex-shrink-0" />
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="ml-3 whitespace-nowrap"
                >
                  Retour à l'accueil
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

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

export default AnimatedDashboardSidebar;
