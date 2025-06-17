import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard } from 'lucide-react'; // Added missing import
import { useAuth } from '../Auth/AuthContext';
import axios from 'axios';
import DashboardViewer from './DashboardViewer';
import EmptyState from './EmptyState';
import AnimatedDashboardSidebar from './AnimatedDashboardSidebar';
import PlanInfoView from './PlanInfoView';
import { useNavigate } from 'react-router-dom';
import PricingSection from '../Home/PricingSection';

// Composant principal UserDashboard avec gestion des accès
const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboards, setDashboards] = useState([]);
  const [filteredDashboards, setFilteredDashboards] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [filters, setFilters] = useState({
    isPublic: 'all',
    active: 'all',
    sort: 'newest',
    expires: 'all',
    hasAccess: 'all',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showPlanInfo, setShowPlanInfo] = useState(false);
  const [showPricingSection, setShowPricingSection] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);

  // Function to handle opening auth modal or redirect
  const handleOpenAuthModal = (mode) => {
    navigate(mode === 'login' ? '/login' : '/signup');
  };

  // Fetch dashboards function extracted for reusability
  const fetchAllDashboards = async () => {
    try {
      setIsLoading(true);
      
      // 1. Récupérer les dashboards personnels assignés de l'utilisateur
      const userDashboardsResponse = await axios.get(`/api/dashboards/my-dashboards`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      // 2. Récupérer les dashboards publics
      const publicDashboardsResponse = await axios.get('/api/dashboards/public');

      // 3. Récupérer l'abonnement utilisateur avec ses dashboards
      const subscriptionResponse = await axios.get('/api/pricing/user-subscription', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      // 4. Récupérer TOUS les noms des dashboards privés (sans accès)
      const privateDashboardNamesResponse = await axios.get('/api/dashboards/private-names', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      // 5. Récupérer les noms des catégories pour l'affichage
      const categoryNamesResponse = await axios.get('/api/categories/public-names');

      // Créer un map des catégories pour un accès rapide
      const categoryMap = {};
      if (categoryNamesResponse.data && categoryNamesResponse.data.categories) {
        categoryNamesResponse.data.categories.forEach(cat => {
          categoryMap[cat._id] = cat.name;
        });
      }

      // 6. Traiter les dashboards personnels assignés
      const userDashboardsWithDetails = await Promise.all(
        (userDashboardsResponse.data.dashboards || []).map(async item => {
          try {
            const dashboardDetail = await axios.get(`/api/dashboards/${item.dashboard}`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });

            const dashboardData = dashboardDetail.data.data || dashboardDetail.data;

            return {
              ...dashboardData,
              expiresAt: item.expiresAt ? new Date(item.expiresAt) : null,
              _id: item.dashboard,
              assignmentId: item._id,
              hasAccess: true,
              isValidDate: item.expiresAt ? !isNaN(new Date(item.expiresAt).getTime()) : true,
              isUserDashboard: true,
              accessType: 'assigned',
              categoryName: categoryMap[dashboardData.category] || 'Sans catégorie',
            };
          } catch (error) {
            console.error(`Error fetching details for dashboard ${item.dashboard}:`, error);
            return null;
          }
        })
      );

      // 7. Traiter les dashboards publics
      const publicDashboards = publicDashboardsResponse.data.data || publicDashboardsResponse.data || [];
      console.log('Public dashboards extracted:', publicDashboards);

      const publicDashboardsFormatted = publicDashboards.map(dashboard => ({
        ...dashboard,
        expiresAt: null,
        hasAccess: true,
        isValidDate: true,
        isUserDashboard: false,
        accessType: 'public',
        categoryName: categoryMap[dashboard.category] || 'Sans catégorie',
      }));

      // 8. Traiter les dashboards d'abonnement/plan
      let subscriptionDashboards = [];
      if (subscriptionResponse.data.success && subscriptionResponse.data.hasSubscription) {
        const subscription = subscriptionResponse.data.subscription;

        const isSubscriptionActive = subscription.status === 'active' || subscription.status === 'trialing';

        if (isSubscriptionActive && subscription.dashboards) {
          subscriptionDashboards = subscription.dashboards.map(dashboard => ({
            ...dashboard,
            expiresAt: subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null,
            hasAccess: true,
            isValidDate: true,
            isUserDashboard: false,
            accessType: 'subscription',
            categoryName: categoryMap[dashboard.category] || 'Sans catégorie',
            subscriptionInfo: {
              planName: subscription.plan?.name,
              status: subscription.status,
              isTrial: subscription.isTrial,
              currentPeriodEnd: subscription.currentPeriodEnd,
            },
          }));
        }
      }

      // 9. Traiter les dashboards privés sans accès
      const privateDashboardNames = privateDashboardNamesResponse.data.data || privateDashboardNamesResponse.data.dashboards || [];
      console.log('Private dashboard names from API:', privateDashboardNames);

      // 10. Créer un set des IDs des dashboards auxquels l'utilisateur a déjà accès
      const accessibleDashboardIds = new Set();

      // Filtrer les dashboards null des dashboards personnels
      const validUserDashboards = userDashboardsWithDetails.filter(d => d !== null);

      // Ajouter les IDs des dashboards avec accès
      validUserDashboards.forEach(d => accessibleDashboardIds.add(d._id));
      publicDashboardsFormatted.forEach(d => accessibleDashboardIds.add(d._id));
      subscriptionDashboards.forEach(d => accessibleDashboardIds.add(d._id));

      console.log('Accessible dashboard IDs:', [...accessibleDashboardIds]);

      // 11. Combiner tous les dashboards
      const uniqueDashboards = [];
      const allDashboardIds = [];

      // Ajouter les dashboards avec accès en priorité
      [...validUserDashboards, ...subscriptionDashboards, ...publicDashboardsFormatted].forEach(dashboard => {
        if (!allDashboardIds.includes(dashboard._id)) {
          allDashboardIds.push(dashboard._id);
          uniqueDashboards.push(dashboard);
        }
      });

      // 12. Ajouter les dashboards privés SANS ACCÈS
      privateDashboardNames.forEach(dashboard => {
        // Ne l'ajouter que s'il n'est pas déjà dans les dashboards accessibles
        if (!accessibleDashboardIds.has(dashboard._id)) {
          const privateDashboard = {
            _id: dashboard._id,
            name: dashboard.name,
            category: dashboard.category,
            categoryName: categoryMap[dashboard.category] || 'Sans catégorie',
            description: dashboard.description || 'Dashboard privé - Abonnement requis',
            hasAccess: false,
            accessType: 'no-access',
            isUserDashboard: false,
            active: dashboard.active !== false, // Par défaut true si non spécifié
            createdAt: dashboard.createdAt || new Date().toISOString(),
            expiresAt: null,
            isValidDate: true,
          };
          
          uniqueDashboards.push(privateDashboard);
          console.log('Added private dashboard without access:', privateDashboard.name);
        }
      });

      console.log('Final unique dashboards:', uniqueDashboards);
      console.log('Dashboards without access:', uniqueDashboards.filter(d => !d.hasAccess));

      setDashboards(uniqueDashboards);
      setFilteredDashboards(uniqueDashboards);

      // Sélectionner le premier dashboard avec accès par défaut
      const firstAccessibleDashboard = uniqueDashboards.find(d => d.hasAccess);
      if (firstAccessibleDashboard) {
        setSelectedDashboard(firstAccessibleDashboard);
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
          accessType: 'public',
          categoryName: 'Sans catégorie',
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

  const fetchUserPlan = async () => {
    try {
      const response = await axios.get('/api/pricing/user-subscription', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (response.data.success && response.data.hasSubscription) {
        setCurrentPlan(response.data.subscription);
      } else {
        setCurrentPlan(null);
      }
    } catch (error) {
      console.error('Error fetching user plan:', error);
      setCurrentPlan(null);
    }
  };

  useEffect(() => {
    if (user && user._id) {
      fetchAllDashboards();
      fetchUserPlan();
    }
  }, [user?._id]);

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
        return (
          dashboardData.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dashboardData.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dashboard.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Filtre par visibilité
    if (filters.isPublic !== 'all') {
      result = result.filter(dashboard => {
        if (filters.isPublic === 'yes') {
          return dashboard.accessType === 'public';
        } else {
          return dashboard.accessType === 'assigned' || dashboard.accessType === 'subscription';
        }
      });
    }

    // Filtre par accès
    if (filters.hasAccess !== 'all') {
      result = result.filter(dashboard => {
        return filters.hasAccess === 'yes' ? dashboard.hasAccess : !dashboard.hasAccess;
      });
    }

    // Filtre par statut actif/inactif
    if (filters.active !== 'all') {
      result = result.filter(dashboard => {
        const dashboardData = dashboard.data || dashboard;
        return filters.active === 'yes' ? dashboardData.active : !dashboardData.active;
      });
    }

    // Filtre par expiration
    if (filters.expires !== 'all') {
      const now = new Date();
      result = result.filter(dashboard => {
        // Les dashboards publics et sans accès n'ont pas d'expiration
        if (dashboard.accessType === 'public' || dashboard.accessType === 'no-access') {
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
        // Les dashboards publics et sans accès vont à la fin
        if (
          (a.accessType === 'public' || a.accessType === 'no-access') &&
          (b.accessType !== 'public' && b.accessType !== 'no-access')
        )
          return 1;
        if (
          (b.accessType === 'public' || b.accessType === 'no-access') &&
          (a.accessType !== 'public' && a.accessType !== 'no-access')
        )
          return -1;
        if (
          (a.accessType === 'public' || a.accessType === 'no-access') &&
          (b.accessType === 'public' || b.accessType === 'no-access')
        )
          return 0;

        if (!a.expiresAt && !b.expiresAt) return 0;
        if (!a.expiresAt) return 1;
        if (!b.expiresAt) return -1;
        return new Date(a.expiresAt) - new Date(b.expiresAt);
      });
    } else if (filters.sort === 'access') {
      // Tri par type d'accès
      result.sort((a, b) => {
        const accessOrder = { assigned: 0, subscription: 1, public: 2, 'no-access': 3 };
        return accessOrder[a.accessType] - accessOrder[b.accessType];
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
      expires: 'all',
      hasAccess: 'all',
    });
  };

  // Handler for subscription success to refresh dashboards
  const handleSubscriptionSuccess = async () => {
    await fetchAllDashboards();
    await fetchUserPlan();
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
          setShowPlanInfo={setShowPlanInfo}
          setShowPricingSection={setShowPricingSection}
        />
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {showPlanInfo ? (
            <div className="p-6">
              <PlanInfoView plan={currentPlan} onClose={() => setShowPlanInfo(false)} user={user} />
            </div>
          ) : showPricingSection ? (
            <div className="p-6">
              <PricingSection onOpenAuthModal={handleOpenAuthModal} onSubscribe={handleSubscriptionSuccess} />
            </div>
          ) : selectedDashboard ? (
            <div className="p-6">
              <DashboardViewer
                dashboard={selectedDashboard}
                user={user}
                setSelectedDashboard={setSelectedDashboard}
              />
            </div>
          ) : (
            // Fixed: Proper JSX structure for empty state with pricing section
            <div className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  <LayoutDashboard className="inline-block mr-2 w-6 h-6 text-gray-700" />
                  Dashboards Disponibles
                </h1>
                <img src="/ID&A TECH .png" alt="Logo ID&A TECH" className="h-6 lg:h-8 w-auto" />
              </div>
              <PricingSection onOpenAuthModal={handleOpenAuthModal} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default UserDashboard;