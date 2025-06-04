  import React, { useState, useEffect } from 'react';
  import { motion, AnimatePresence } from 'framer-motion';
  import { 
    Clock, 
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
import DashboardViewer from './DashboardViewer';
import EmptyState from './EmptyState';
import AnimatedDashboardSidebar from './AnimatedDashboardSidebar';



  

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
      sort: 'newest',
      expires: 'all'
    });
    const [isLoading, setIsLoading] = useState(true);

// Fonction fetchUserDashboards corrigée
useEffect(() => {
  const fetchUserDashboards = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/dashboards/my-dashboards`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Récupérer les détails complets pour chaque dashboard
      const dashboardsWithDetails = await Promise.all(
        response.data.dashboards.map(async item => {
          try {
            const dashboardDetail = await axios.get(`/api/dashboards/${item.dashboard}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            // Corriger la structure des données
            const dashboardData = dashboardDetail.data.data || dashboardDetail.data;
            
            return {
              ...dashboardData,
              expiresAt: item.expiresAt ? new Date(item.expiresAt) : null,
              _id: item.dashboard,
              assignmentId: item._id,
              hasAccess: true,
              isValidDate: item.expiresAt ? !isNaN(new Date(item.expiresAt).getTime()) : true
            };
          } catch (error) {
            console.error(`Error fetching details for dashboard ${item.dashboard}:`, error);
            return null;
          }
        })
      );
      
      // Filtrer les dashboards null
      const validDashboards = dashboardsWithDetails.filter(d => d !== null);
      
      setDashboards(validDashboards);
      setFilteredDashboards(validDashboards);
      
      if (validDashboards.length > 0) {
        setSelectedDashboard(validDashboards[0]);
      }
    } catch (error) {
      console.error('Error fetching user dashboards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  fetchUserDashboards();
}, [user._id]);

  useEffect(() => {
    console.log('Dashboards:', dashboards);
    console.log('Selected Dashboard:', selectedDashboard);
  }, [dashboards, selectedDashboard]);
useEffect(() => {
  let result = [...dashboards];
  
  // Filtre par recherche
  if (searchTerm) {
    result = result.filter(dashboard => {
      const dashboardData = dashboard.data || dashboard;
      return dashboardData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             dashboardData.description?.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }
  
  // Filtre par visibilité
  if (filters.isPublic !== 'all') {
    result = result.filter(dashboard => {
      const dashboardData = dashboard.data || dashboard;
      return filters.isPublic === 'yes' ? dashboardData.isPublic : !dashboardData.isPublic;
    });
  }
  
  // Filtre par statut actif/inactif
  if (filters.active !== 'all') {
    result = result.filter(dashboard => {
      const dashboardData = dashboard.data || dashboard;
      return filters.active === 'yes' ? dashboardData.active : !dashboardData.active;
    });
  }
  
  // Nouveau filtre par expiration
  if (filters.expires !== 'all') {
    const now = new Date();
    result = result.filter(dashboard => {
      if (!dashboard.expiresAt) return filters.expires === 'no';
      
      const isExpired = new Date(dashboard.expiresAt) < now;
      return filters.expires === 'expired' ? isExpired : !isExpired;
    });
  }
  
  // Tri
  if (filters.sort === 'newest') {
    result.sort((a, b) => {
      const aData = a.data || a;
      const bData = b.data || b;
      return new Date(bData.createdAt) - new Date(aData.createdAt);
    });
  } else if (filters.sort === 'oldest') {
    result.sort((a, b) => {
      const aData = a.data || a;
      const bData = b.data || b;
      return new Date(aData.createdAt) - new Date(bData.createdAt);
    });
  } else if (filters.sort === 'name') {
    result.sort((a, b) => {
      const aData = a.data || a;
      const bData = b.data || b;
      return aData.name.localeCompare(bData.name);
    });
  } else if (filters.sort === 'expiry') {
    result.sort((a, b) => {
      if (!a.expiresAt && !b.expiresAt) return 0;
      if (!a.expiresAt) return 1;
      if (!b.expiresAt) return -1;
      return new Date(a.expiresAt) - new Date(b.expiresAt);
    });
  }
  
  setFilteredDashboards(result);
}, [searchTerm, filters, dashboards]);


    const resetFilters = () => {
      setSearchTerm('');
      setFilters({
        isPublic: 'all',
        active: 'all',
        sort: 'newest',
        expires: 'all'
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