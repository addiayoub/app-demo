import './.css'
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  BarChart2, 
  ChevronLeft, 
  ChevronUp ,
  ChevronRight,
  Home,
  Settings,
  LogOut,
  Plus,
  ChevronDown ,
  LineChart
} from 'lucide-react';
import User_admin from './User_admin';
import PowerBIDashboard from './PowerBIDashboard';
import { useAuth } from '../Auth/AuthContext';
import axios from 'axios';

const AdminLayout = () => {
   const [activeComponent, setActiveComponent] = useState('users');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const [dashboardsMenuOpen, setDashboardsMenuOpen] = useState(true);
  const [dashboards, setDashboards] = useState([]);
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const sidebarVariants = {
    open: { width: 250 },
    closed: { width: 80 },
    hover: { width: 250 }
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
  
  // Si c'est déjà une URL complète (http/https), la retourner telle quelle
  if (avatar.startsWith('http')) {
    return avatar;
  }
  
  // Si c'est un chemin relatif, construire l'URL complète
  if (avatar.startsWith('/uploads/')) {
    return `${API_BASE_URL}${avatar}`;
  }
  
  // Sinon, retourner l'avatar tel quel (probablement une URL externe)
  return avatar;
};
useEffect(() => {
    const fetchDashboards = async () => {
      try {
        const response = await axios.get('/api/dashboards', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setDashboards(response.data.data || response.data);
        if (response.data.data?.length > 0 || response.data.length > 0) {
          setSelectedDashboard(response.data.data[0] || response.data[0]);
        }
      } catch (err) {
        console.error('Error fetching dashboards:', err);
      }
    };
    
    fetchDashboards();
  }, []);
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <motion.div
        initial="open"
        animate={isSidebarOpen ? "open" : "closed"}
        whileHover={!isSidebarOpen ? "hover" : ""}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        variants={sidebarVariants}
        className={` cursor-pointer bg-gradient-to-b from-blue-00 to-blue-900 text-white  shadow-xl relative z-20`}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-5 flex items-center justify-between">
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
                  <img src="/ID&A TECH .png" alt="Logo" className="w-50" />
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
                  <img src="/ID&A TECH1 .png" alt="Logo" className="w-15" />
                </motion.div>
              )}
            </AnimatePresence>
         
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        

            <motion.button
              onClick={() => setActiveComponent('users')}
              className={` cursor-pointer w-full flex items-center p-3 rounded-lg transition-all ${
                activeComponent === 'users' 
                  ? 'bg-blue-700 text-white  shadow-md' 
                  : 'hover:bg-blue-700/50 text-white /90'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Users size={20} className="flex-shrink-0" />
              <AnimatePresence>
                {(isSidebarOpen || isHovered) && (
                  <motion.span 
                    variants={linkVariants}
                    initial="closed"
                    animate={isSidebarOpen || isHovered ? "open" : "closed"}
                    className="ml-3 whitespace-nowrap"
                  >
                    Utilisateurs
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <div className="space-y-1">
          <motion.button
            onClick={() => setDashboardsMenuOpen(!dashboardsMenuOpen)}
            className={` cursor-pointer w-full flex items-center justify-between p-3 rounded-lg transition-all ${
              activeComponent === 'dashboard' 
                ? 'bg-blue-700 text-white  shadow-md' 
                : 'hover:bg-blue-700/50 text-white /90'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center">
              <LayoutDashboard size={20} className="flex-shrink-0" />
              <AnimatePresence>
                {(isSidebarOpen || isHovered) && (
                  <motion.span 
                    variants={linkVariants}
                    initial="closed"
                    animate={isSidebarOpen || isHovered ? "open" : "closed"}
                    className="ml-3 whitespace-nowrap"
                  >
                    Tableaux de bord
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            {(isSidebarOpen || isHovered) && (
              dashboardsMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />
            )}
          </motion.button>

          <AnimatePresence>
            {dashboardsMenuOpen && (isSidebarOpen || isHovered) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="ml-8 pl-2 border-l-2 border-blue-600/30 space-y-1"
              >
                {dashboards.map((dashboard) => (
                  <motion.button
                    key={dashboard._id}
                    onClick={() => {
                      setActiveComponent('dashboard');
                      setSelectedDashboard(dashboard);
                    }}
                    className={` cursor-pointer w-full flex items-center justify-between p-2 rounded-lg transition-all text-sm ${
                      selectedDashboard?._id === dashboard._id
                        ? 'bg-blue-600/20 text-white ' 
                        : 'hover:bg-blue-700/20 text-white /80'
                    }`}
                    whileHover={{ x: 5 }}
                  >
                    <div className="flex items-center">
                      <BarChart2 size={16} className="flex-shrink-0" />
                      <span className="ml-2 whitespace-nowrap truncate max-w-[150px]">
                        {dashboard.name}
                      </span>
                    </div>
                    {!dashboard.active && (
                      <span className="text-xs text-red-300 ml-2">(inactif)</span>
                    )}
                  </motion.button>
                ))}
                
                {user?.role === 'admin' && (
                  <motion.button
                    onClick={() => {
                      setActiveComponent('dashboard');
                      setSelectedDashboard(null);
                    }}
                    className="w-full flex items-center p-2 rounded-lg transition-all text-sm hover:bg-blue-700/20 text-white /80"
                    whileHover={{ x: 5 }}
                  >
                    <Plus size={16} className="flex-shrink-0" />
                    <span className="ml-2 whitespace-nowrap">Ajouter un dashboard</span>
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
          </nav>

          {/* Bottom Navigation */}
          <div className="p-4 border-t border-blue-700/50">
            <motion.button
              onClick={() => setActiveComponent('settings')}
              className={` cursor-pointer w-full flex items-center p-3 rounded-lg transition-all ${
                activeComponent === 'settings' 
                  ? 'bg-blue-700 text-white  shadow-md' 
                  : 'hover:bg-blue-700/50 text-white /90'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Settings size={20} className="flex-shrink-0" />
              <AnimatePresence>
                {(isSidebarOpen || isHovered) && (
                  <motion.span 
                    variants={linkVariants}
                    initial="closed"
                    animate={isSidebarOpen || isHovered ? "open" : "closed"}
                    className="ml-3 whitespace-nowrap"
                  >
                    Paramètres
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

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

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-800">
                {activeComponent === 'users' && 'Gestion des utilisateurs'}
                {activeComponent === 'dashboard' && 'Tableaux de bord Power BI'}
                {activeComponent === 'settings' && 'Paramètres'}
                {activeComponent === 'home' && 'Tableau de bord'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <p className="font-medium text-gray-800">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white  font-medium">
  <img 
                                  className="h-10 w-10 rounded-full object-cover" 
                                  src={getAvatarUrl(user.avatar, user.name)}
                                  alt={`Avatar de ${user.name}`}
                                  onError={(e) => {
                                    // Fallback si l'image ne charge pas
                                    e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${user.name || 'default'}`;
                                  }}
                                />                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeComponent}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {activeComponent === 'users' ? (
                <User_admin />
              ) : activeComponent === 'dashboard' ? (
                <PowerBIDashboard isAdmin={user?.role === 'admin'} 
                  selectedDashboard={selectedDashboard}
                  setSelectedDashboard={setSelectedDashboard}
                  dashboards={dashboards}
                  setDashboards={setDashboards} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                      {activeComponent === 'home' && 'Bienvenue sur votre tableau de bord'}
                      {activeComponent === 'settings' && 'Paramètres'}
                    </h2>
                    <p className="text-gray-500">
                      {activeComponent === 'home' && 'Sélectionnez une section dans le menu de gauche'}
                      {activeComponent === 'settings' && 'Paramètres de configuration'}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;