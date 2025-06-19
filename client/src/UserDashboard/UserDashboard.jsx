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
import TicketSection from './TicketSection';

// Composant principal UserDashboard avec gestion des accès
const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboards, setDashboards] = useState({});
  const [filteredDashboards, setFilteredDashboards] = useState({});
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
  const [showTicketSection, setShowTicketSection] = useState(false); // Nouvel état pour la section Tickets

  // Function to handle opening auth modal or redirect
  const handleOpenAuthModal = (mode) => {
    navigate(mode === 'login' ? '/login' : '/signup');
  };
 // Fonction pour réinitialiser toutes les sections
  const resetSections = () => {
    setShowPlanInfo(false);
    setShowPricingSection(false);
    setShowTicketSection(false);
  };

  // Fonction pour afficher la section Tickets
  const handleShowTickets = () => {
    resetSections();
    setShowTicketSection(true);
    setSelectedDashboard(null);
  };

  // Fetch dashboards function extracted for reusability
// Fonction corrigée pour récupérer tous les dashboards avec leurs catégories
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

    // 4. Récupérer les catégories avec leurs dashboards (incluant les privés)
    const categoriesResponse = await axios.get('/api/categories/public-names', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });

    // 5. Récupérer TOUTES les catégories générales si nécessaire
    const allCategoriesResponse = await axios.get('/api/categories', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });

    // Créer un map des catégories pour un accès rapide
    const categoryMap = {};
    const allCategories = allCategoriesResponse.data.data || allCategoriesResponse.data || [];
    
    allCategories.forEach(cat => {
      categoryMap[cat._id] = {
        name: cat.name,
        dashboards: cat.dashboards || []
      };
    });

    // Créer un map des dashboards par catégorie depuis l'API categories/public-names
    const dashboardToCategoryMap = {};
    const categoriesWithDashboards = categoriesResponse.data.data || categoriesResponse.data || [];
    
    categoriesWithDashboards.forEach(category => {
      if (category.dashboards && Array.isArray(category.dashboards)) {
        category.dashboards.forEach(dashboard => {
          dashboardToCategoryMap[dashboard._id] = {
            categoryId: category._id,
            categoryName: category.name
          };
        });
      }
    });

    console.log('Category Map:', categoryMap);
    console.log('Dashboard to Category Map:', dashboardToCategoryMap);

    // 6. Traiter les dashboards personnels assignés
    const userDashboardsWithDetails = await Promise.all(
      (userDashboardsResponse.data.dashboards || []).map(async item => {
        try {
          const dashboardDetail = await axios.get(`/api/dashboards/${item.dashboard}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          });

          const dashboardData = dashboardDetail.data.data || dashboardDetail.data;

          // Récupérer la catégorie depuis le map ou depuis les données du dashboard
          const categoryInfo = dashboardToCategoryMap[item.dashboard] || {
            categoryId: dashboardData.category || 'uncategorized',
            categoryName: categoryMap[dashboardData.category]?.name || 'Sans catégorie'
          };

          return {
            ...dashboardData,
            expiresAt: item.expiresAt ? new Date(item.expiresAt) : null,
            _id: item.dashboard,
            assignmentId: item._id,
            hasAccess: true,
            isValidDate: item.expiresAt ? !isNaN(new Date(item.expiresAt).getTime()) : true,
            isUserDashboard: true,
            accessType: 'assigned',
            categoryName: categoryInfo.categoryName,
            categoryId: categoryInfo.categoryId
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

    const publicDashboardsFormatted = publicDashboards.map(dashboard => {
      // Récupérer la catégorie depuis le map ou depuis les données du dashboard
      const categoryInfo = dashboardToCategoryMap[dashboard._id] || {
        categoryId: dashboard.category || 'uncategorized',
        categoryName: categoryMap[dashboard.category]?.name || 'Sans catégorie'
      };

      return {
        ...dashboard,
        expiresAt: null,
        hasAccess: true,
        isValidDate: true,
        isUserDashboard: false,
        accessType: 'public',
        categoryName: categoryInfo.categoryName,
        categoryId: categoryInfo.categoryId
      };
    });

    // 8. Traiter les dashboards d'abonnement/plan
    let subscriptionDashboards = [];
    if (subscriptionResponse.data.success && subscriptionResponse.data.hasSubscription) {
      const subscription = subscriptionResponse.data.subscription;

      const isSubscriptionActive = subscription.status === 'active' || subscription.status === 'trialing';

      if (isSubscriptionActive && subscription.dashboards) {
        subscriptionDashboards = subscription.dashboards.map(dashboard => {
          // Récupérer la catégorie depuis le map ou depuis les données du dashboard
          const categoryInfo = dashboardToCategoryMap[dashboard._id] || {
            categoryId: dashboard.category || 'uncategorized',
            categoryName: categoryMap[dashboard.category]?.name || 'Sans catégorie'
          };

          return {
            ...dashboard,
            expiresAt: subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null,
            hasAccess: true,
            isValidDate: true,
            isUserDashboard: false,
            accessType: 'subscription',
            categoryName: categoryInfo.categoryName,
            categoryId: categoryInfo.categoryId,
            subscriptionInfo: {
              planName: subscription.plan?.name,
              status: subscription.status,
              isTrial: subscription.isTrial,
              currentPeriodEnd: subscription.currentPeriodEnd,
            },
          };
        });
      }
    }

    // 9. Créer un set des IDs des dashboards auxquels l'utilisateur a déjà accès
    const accessibleDashboardIds = new Set();

    // Filtrer les dashboards null des dashboards personnels
    const validUserDashboards = userDashboardsWithDetails.filter(d => d !== null);

    // Ajouter les IDs des dashboards avec accès
    validUserDashboards.forEach(d => accessibleDashboardIds.add(d._id));
    publicDashboardsFormatted.forEach(d => accessibleDashboardIds.add(d._id));
    subscriptionDashboards.forEach(d => accessibleDashboardIds.add(d._id));

    console.log('Accessible dashboard IDs:', [...accessibleDashboardIds]);

    // 10. Combiner tous les dashboards et les organiser par catégorie
    const dashboardsByCategory = {};

    // Fonction pour ajouter un dashboard à la structure par catégorie
    const addDashboardToCategory = (dashboard) => {
      const categoryId = dashboard.categoryId || 'uncategorized';
      const categoryName = dashboard.categoryName || 'Sans catégorie';
      
      if (!dashboardsByCategory[categoryId]) {
        dashboardsByCategory[categoryId] = {
          name: categoryName,
          dashboards: []
        };
      }
      
      dashboardsByCategory[categoryId].dashboards.push(dashboard);
    };

    // Ajouter les dashboards avec accès
    [...validUserDashboards, ...subscriptionDashboards, ...publicDashboardsFormatted].forEach(dashboard => {
      addDashboardToCategory(dashboard);
    });

    // 11. Traitement des dashboards privés SANS ACCÈS
    // Utiliser les données des catégories pour récupérer les dashboards privés
    categoriesWithDashboards.forEach(category => {
      if (category.dashboards && Array.isArray(category.dashboards)) {
        category.dashboards.forEach(dashboard => {
          if (!accessibleDashboardIds.has(dashboard._id)) {
            console.log(`Processing private dashboard: ${dashboard.name}, categoryId: ${category._id}, categoryName: ${category.name}`);
            
            const privateDashboard = {
              _id: dashboard._id,
              name: dashboard.name,
              category: category._id,
              categoryName: category.name,
              description: dashboard.description || 'Dashboard privé - Abonnement requis',
              hasAccess: false,
              accessType: 'no-access',
              isUserDashboard: false,
              active: dashboard.active !== false, // Par défaut true si non spécifié
              createdAt: dashboard.createdAt || new Date().toISOString(),
              expiresAt: null,
              isValidDate: true,
              categoryId: category._id
            };
            
            addDashboardToCategory(privateDashboard);
          }
        });
      }
    });

    console.log('Final dashboards by category:', dashboardsByCategory);
    setDashboards(dashboardsByCategory);

    // Sélectionner le premier dashboard avec accès par défaut
    const firstAccessibleDashboard = Object.values(dashboardsByCategory)
      .flatMap(cat => cat.dashboards)
      .find(d => d.hasAccess);
      
    if (firstAccessibleDashboard) {
      setSelectedDashboard(firstAccessibleDashboard);
    }
  } catch (error) {
    console.error('Error fetching dashboards:', error);
    // En cas d'erreur, essayer au moins de récupérer les dashboards publics
    try {
      const publicDashboardsResponse = await axios.get('/api/dashboards/public');
      const publicDashboards = publicDashboardsResponse.data.data || publicDashboardsResponse.data || [];

      const dashboardsByCategory = {
        uncategorized: {
          name: 'Sans catégorie',
          dashboards: publicDashboards.map(dashboard => ({
            ...dashboard,
            expiresAt: null,
            hasAccess: true,
            isValidDate: true,
            isUserDashboard: false,
            accessType: 'public',
            categoryName: 'Sans catégorie',
            categoryId: 'uncategorized'
          }))
        }
      };

      setDashboards(dashboardsByCategory);

      if (dashboardsByCategory.uncategorized.dashboards.length > 0) {
        setSelectedDashboard(dashboardsByCategory.uncategorized.dashboards[0]);
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

  // FIXED: Updated filtering logic to work with object structure
  useEffect(() => {
    if (!dashboards || typeof dashboards !== 'object') {
      setFilteredDashboards({});
      return;
    }

    const filteredCategories = {};

    // Parcourir chaque catégorie
    Object.entries(dashboards).forEach(([categoryId, categoryData]) => {
      if (!categoryData || !categoryData.dashboards || !Array.isArray(categoryData.dashboards)) {
        return;
      }

      let filteredDashboardsInCategory = [...categoryData.dashboards];

      // Filtre par recherche
      if (searchTerm) {
        filteredDashboardsInCategory = filteredDashboardsInCategory.filter(dashboard => {
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
        filteredDashboardsInCategory = filteredDashboardsInCategory.filter(dashboard => {
          if (filters.isPublic === 'yes') {
            return dashboard.accessType === 'public';
          } else {
            return dashboard.accessType === 'assigned' || dashboard.accessType === 'subscription';
          }
        });
      }

      // Filtre par accès
      if (filters.hasAccess !== 'all') {
        filteredDashboardsInCategory = filteredDashboardsInCategory.filter(dashboard => {
          return filters.hasAccess === 'yes' ? dashboard.hasAccess : !dashboard.hasAccess;
        });
      }

      // Filtre par statut actif/inactif
      if (filters.active !== 'all') {
        filteredDashboardsInCategory = filteredDashboardsInCategory.filter(dashboard => {
          const dashboardData = dashboard.data || dashboard;
          return filters.active === 'yes' ? dashboardData.active : !dashboardData.active;
        });
      }

      // Filtre par expiration
      if (filters.expires !== 'all') {
        const now = new Date();
        filteredDashboardsInCategory = filteredDashboardsInCategory.filter(dashboard => {
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
        filteredDashboardsInCategory.sort((a, b) => {
          const aData = a.data || a;
          const bData = b.data || b;
          return new Date(bData.createdAt) - new Date(aData.createdAt);
        });
      } else if (filters.sort === 'oldest') {
        filteredDashboardsInCategory.sort((a, b) => {
          const aData = a.data || a;
          const bData = b.data || b;
          return new Date(aData.createdAt) - new Date(bData.createdAt);
        });
      } else if (filters.sort === 'name') {
        filteredDashboardsInCategory.sort((a, b) => {
          const aData = a.data || a;
          const bData = b.data || b;
          return aData.name?.localeCompare(bData.name) || 0;
        });
      } else if (filters.sort === 'expiry') {
        filteredDashboardsInCategory.sort((a, b) => {
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
        filteredDashboardsInCategory.sort((a, b) => {
          const accessOrder = { assigned: 0, subscription: 1, public: 2, 'no-access': 3 };
          return accessOrder[a.accessType] - accessOrder[b.accessType];
        });
      }

      // N'ajouter la catégorie que si elle contient des dashboards après filtrage
      if (filteredDashboardsInCategory.length > 0) {
        filteredCategories[categoryId] = {
          ...categoryData,
          dashboards: filteredDashboardsInCategory
        };
      }
    });

    setFilteredDashboards(filteredCategories);
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
          onShowTickets={handleShowTickets} // Passez la fonction au sidebar
          setShowTicketSection={setShowTicketSection}
        />
<div className="flex-1 overflow-y-auto overflow-x-hidden">
  {showPlanInfo ? (
    <div className="p-6">
      <PlanInfoView 
        plan={currentPlan} 
        onClose={() => {
          setShowPlanInfo(false);
          setShowTicketSection(false);
        }} 
        user={user}
        onShowPricing={() => {
          setShowPlanInfo(false);
          setShowPricingSection(true);
          setShowTicketSection(false);
          setSelectedDashboard(null);
        }}
      />
    </div>
  ) : showPricingSection ? (
    <div className="p-6">
      <PricingSection 
        onOpenAuthModal={handleOpenAuthModal} 
        onSubscribe={handleSubscriptionSuccess}
        onClose={() => {
          setShowPricingSection(false);
          setShowPlanInfo(false);
        }}
      />
    </div>
  ) : showTicketSection ? (
    <div className="p-6">
      <TicketSection />
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
    <div className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          <LayoutDashboard className="inline-block mr-2 w-6 h-6 text-gray-700" />
          Dashboards Disponibles
        </h1>
        <img src="/ID&A TECH .png" alt="Logo ID&A TECH" className="h-6 lg:h-8 w-auto" />
      </div>
      <PricingSection 
        onOpenAuthModal={handleOpenAuthModal}
        onSubscribe={handleSubscriptionSuccess}
      />
    </div>
  )}
</div>
      </div>
    </motion.div>
  );
};

export default UserDashboard;