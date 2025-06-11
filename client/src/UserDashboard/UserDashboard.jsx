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

// Fonction fetchUserDashboards modifiée pour inclure les dashboards publiques
useEffect(() => {
  const fetchAllDashboards = async () => {
    try {
      setIsLoading(true);
      
      // 1. Récupérer les dashboards personnels de l'utilisateur
      const userDashboardsResponse = await axios.get(`/api/dashboards/my-dashboards`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // 2. Récupérer les dashboards publiques
      const publicDashboardsResponse = await axios.get('/api/dashboards/public');
      
      console.log('User dashboards response:', userDashboardsResponse.data);
      console.log('Public dashboards response:', publicDashboardsResponse.data);
      
      // 3. Traiter les dashboards personnels
      const userDashboardsWithDetails = await Promise.all(
        (userDashboardsResponse.data.dashboards || []).map(async item => {
          try {
            const dashboardDetail = await axios.get(`/api/dashboards/${item.dashboard}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            const dashboardData = dashboardDetail.data.data || dashboardDetail.data;
            
            return {
              ...dashboardData,
              expiresAt: item.expiresAt ? new Date(item.expiresAt) : null,
              _id: item.dashboard,
              assignmentId: item._id,
              hasAccess: true,
              isValidDate: item.expiresAt ? !isNaN(new Date(item.expiresAt).getTime()) : true,
              isUserDashboard: true, // Marquer comme dashboard personnel
              accessType: 'assigned' // Type d'accès
            };
          } catch (error) {
            console.error(`Error fetching details for dashboard ${item.dashboard}:`, error);
            return null;
          }
        })
      );
      
      // 4. Traiter les dashboards publiques - CORRECTION ICI
      const publicDashboards = publicDashboardsResponse.data.data || publicDashboardsResponse.data || [];
      console.log('Public dashboards extracted:', publicDashboards);
      
      const publicDashboardsFormatted = publicDashboards.map(dashboard => ({
        ...dashboard,
        expiresAt: null, // Les dashboards publiques n'ont pas d'expiration pour l'utilisateur
        hasAccess: true,
        isValidDate: true,
        isUserDashboard: false, // Marquer comme dashboard publique
        accessType: 'public' // Type d'accès
      }));
      
      console.log('Public dashboards formatted:', publicDashboardsFormatted);
      
      // 5. Filtrer les dashboards null des dashboards personnels
      const validUserDashboards = userDashboardsWithDetails.filter(d => d !== null);
      
      // 6. Éviter les doublons (si un dashboard est à la fois assigné et publique)
      const userDashboardIds = validUserDashboards.map(d => d._id);
      const uniquePublicDashboards = publicDashboardsFormatted.filter(
        pd => !userDashboardIds.includes(pd._id)
      );
      
      console.log('Valid user dashboards:', validUserDashboards);
      console.log('Unique public dashboards:', uniquePublicDashboards);
      
      // 7. Combiner les deux listes
      const allDashboards = [
        ...validUserDashboards,
        ...uniquePublicDashboards
      ];
      
      console.log('All dashboards combined:', allDashboards);
      
      setDashboards(allDashboards);
      setFilteredDashboards(allDashboards);
      
      if (allDashboards.length > 0) {
        setSelectedDashboard(allDashboards[0]);
      }
    } catch (error) {
      console.error('Error fetching dashboards:', error);
      // En cas d'erreur, essayer au moins de récupérer les dashboards publics
      try {
        const publicDashboardsResponse = await axios.get('/api/dashboards/public');
        const publicDashboards = publicDashboardsResponse.data.data || publicDashboardsResponse.data || [];
        
        const publicDashboardsFormatted = publicDashboards.map(dashboard => ({
          ...dashboard,
          expiresAt: null,
          hasAccess: true,
          isValidDate: true,
          isUserDashboard: false,
          accessType: 'public'
        }));
        
        setDashboards(publicDashboardsFormatted);
        setFilteredDashboards(publicDashboardsFormatted);
        
        if (publicDashboardsFormatted.length > 0) {
          setSelectedDashboard(publicDashboardsFormatted[0]);
        }
      } catch (fallbackError) {
        console.error('Error fetching public dashboards as fallback:', fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (user && user._id) {
    fetchAllDashboards();
  }
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
      // Pour les dashboards publics, les données sont directement sur l'objet
      // Pour les dashboards personnels, elles peuvent être dans dashboard.data
      const dashboardData = dashboard.data || dashboard;
      return dashboardData.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             dashboardData.description?.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }
  
  // Filtre par visibilité
  if (filters.isPublic !== 'all') {
    result = result.filter(dashboard => {
      // Utiliser accessType pour filtrer
      if (filters.isPublic === 'yes') {
        return dashboard.accessType === 'public';
      } else {
        return dashboard.accessType === 'assigned';
      }
    });
  }
  
  // Filtre par statut actif/inactif
  if (filters.active !== 'all') {
    result = result.filter(dashboard => {
      const dashboardData = dashboard.data || dashboard;
      return filters.active === 'yes' ? dashboardData.active : !dashboardData.active;
    });
  }
  
  // Nouveau filtre par expiration (seulement pour les dashboards assignés)
  if (filters.expires !== 'all') {
    const now = new Date();
    result = result.filter(dashboard => {
      // Les dashboards publiques n'ont pas d'expiration
      if (dashboard.accessType === 'public') {
        return filters.expires === 'no';
      }
      
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
      return aData.name?.localeCompare(bData.name) || 0;
    });
  } else if (filters.sort === 'expiry') {
    result.sort((a, b) => {
      // Les dashboards publiques vont à la fin
      if (a.accessType === 'public' && b.accessType !== 'public') return 1;
      if (b.accessType === 'public' && a.accessType !== 'public') return -1;
      if (a.accessType === 'public' && b.accessType === 'public') return 0;
      
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