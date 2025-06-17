import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, XCircle, Clock, Calendar, 
  CreditCard, Search, PlusCircle, Trash2, 
  Edit, ChevronDown, ChevronUp, BarChart2,
  Lightbulb, Rocket, Crown
} from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const PlanAssignmentModal = ({ 
  onClose, 
  plans, 
  userPlans,
  onAssign,
  onCancel,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [plansMenuOpen, setPlansMenuOpen] = useState(true);

  // Fonction pour obtenir l'icône selon le nom du plan
  const getPlanIcon = (planName) => {
    const name = planName.toLowerCase();
    if (name.includes('basique') || name.includes('basic')) {
      return <Lightbulb className="text-yellow-500" size={20} />;
    }
    if (name.includes('pro')) {
      return <Rocket className="text-purple-500" size={20} />;
    }
    if (name.includes('entreprise') || name.includes('enterprise')) {
      return <Crown className="text-yellow-400" size={20} />;
    }
    // Icône par défaut
    return <BarChart2 className="text-blue-500" size={20} />;
  };

  const showAssignConfirmation = (plan) => {
    MySwal.fire({
      title: `Assigner le plan ${plan.name}?`,
      html: `
        <div class="text-left">
          <p class="mb-4">Ce plan inclut:</p>
          <ul class="list-disc pl-5 mb-4">
            ${plan.features.map(f => `<li>${f.text}</li>`).join('')}
            <li>Accès à ${plan.dashboards.length} tableau(x) de bord</li>
          </ul>
          <p class="text-sm text-gray-500">
            Prix: ${plan.price} ${plan.currency} / ${plan.billingCycle}
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Confirmer',
      cancelButtonText: 'Annuler',
      buttonsStyling: false,
      customClass: {
        confirmButton: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-2',
        cancelButton: 'px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        onAssign(plan._id);
      }
    });
  };

  const showCancelConfirmation = (plan) => {
    const isTrialing = plan.status === 'trialing' || plan.isTrial;
    const planType = isTrialing ? 'essai' : 'plan';
    
    MySwal.fire({
      title: `Annuler cet ${planType}?`,
      html: `
        <div class="text-left">
          <p class="mb-4">Vous êtes sur le point d'annuler ${isTrialing ? 'l\'essai du plan' : 'le plan'} <strong>${plan.plan?.name || plan.name}</strong>.</p>
          <p class="text-sm text-gray-500">
            L'utilisateur perdra ${isTrialing ? 'immédiatement ' : ''}l'accès aux tableaux de bord associés.
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Confirmer',
      cancelButtonText: 'Annuler',
      buttonsStyling: false,
      customClass: {
        confirmButton: 'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 mr-2',
        cancelButton: 'px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        onCancel(plan._id || plan.plan?._id);
      }
    });
  };

  const filteredPlans = plans.filter(plan => 
    plan.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fonction modifiée pour vérifier si un plan est assigné ET actif
  const isAssigned = (planId) => 
    userPlans.some(p => {
      const status = getPlanStatus(p);
      return p.plan._id === planId && (status === 'active' || status === 'trialing');
    });

  const getPlanStatus = (plan) => {
    // Vérifier d'abord le statut direct de l'abonnement
    if (plan.status === 'canceled') {
      return 'canceled';
    }
    
    if (plan.status === 'trialing' || plan.isTrial) {
      // Vérifier si l'essai a expiré
      if (plan.currentPeriodEnd) {
        const endDate = new Date(plan.currentPeriodEnd);
        const now = new Date();
        if (endDate < now) {
          return 'expired';
        }
      }
      return 'trialing';
    }
    
    if (!plan.currentPeriodEnd) return 'active';
    
    const endDate = new Date(plan.currentPeriodEnd);
    const now = new Date();
    
    if (endDate < now) {
      return 'expired';
    }
    
    return 'active';
  };

  const getPlanDetails = (plan) => {
    const status = getPlanStatus(plan);
    const endDate = plan.currentPeriodEnd ? new Date(plan.currentPeriodEnd) : null;
    
    return {
      status,
      endDate,
      isTrial: plan.isTrial || plan.status === 'trialing'
    };
  };

  const getStatusLabel = (status, isTrial) => {
    switch (status) {
      case 'active':
        return isTrial ? 'Essai actif' : 'Actif';
      case 'trialing':
        return 'En essai';
      case 'canceled':
        return isTrial ? 'Essai annulé' : 'Annulé';
      case 'expired':
        return isTrial ? 'Essai expiré' : 'Expiré';
      default:
        return 'Inconnu';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'active':
      case 'trialing':
        return 'bg-green-100 text-green-800';
      case 'canceled':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header fixe */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-xl font-semibold text-gray-900">
            Gestion des plans tarifaires
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Assignez ou gérez les plans pour cet utilisateur
          </p>
        </div>
        
        {/* Zone de recherche fixe */}
        <div className="p-6 border-b border-gray-100 flex-shrink-0">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher des plans..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Plans assignés */}
            {userPlans.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700 flex items-center sticky top-0 bg-white py-2 z-10">
                  <CheckCircle className="text-green-500 mr-2" size={18} />
                  Plans assignés
                </h4>
                
                {userPlans.map(userPlan => {
                  const { status, endDate, isTrial } = getPlanDetails(userPlan);
                  const plan = userPlan.plan;
                  
                  return (
                    <motion.div 
                      key={userPlan._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            {/* Icône du plan */}
                            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-white to-gray-100 rounded-lg shadow-sm mr-3">
                              {getPlanIcon(plan.name)}
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {plan.name} {isTrial && '(Essai)'}
                              </h4>
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusStyle(status)}`}>
                                {getStatusLabel(status, isTrial)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-3 ml-13 grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center text-gray-600">
                              <CreditCard size={14} className="mr-1" />
                              <span>
                                {plan.price} {plan.currency} / {plan.billingCycle}
                              </span>
                            </div>
                            
                            <div className="flex items-center text-gray-600">
                              <BarChart2 size={14} className="mr-1" />
                              <span>
                                {plan.dashboards.length} tableau(x) inclus
                              </span>
                            </div>
                            
                            {endDate && (
                              <div className="flex items-center text-gray-600 col-span-2">
                                <Calendar size={14} className="mr-1" />
                                <span>
                                  {status === 'canceled' ? 'Expire le' : 
                                   status === 'trialing' ? 'Fin d\'essai le' : 
                                   'Renouvellement le'} {' '}
                                  {endDate.toLocaleDateString('fr-FR', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          {/* Bouton Réactiver pour les plans annulés ou expirés */}
                          {(status === 'canceled' || status === 'expired') && (
                            <motion.button
                              onClick={() => showAssignConfirmation(plan)}
                              className="px-3 py-1 rounded-lg text-sm font-medium transition-colors bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <PlusCircle size={16} className="inline mr-1" />
                              Réactiver
                            </motion.button>
                          )}
                          
                          {/* Bouton Annuler pour les plans actifs ou en essai */}
                          {(status === 'active' || status === 'trialing') && (
                            <motion.button
                              onClick={() => showCancelConfirmation(userPlan)}
                              className="px-3 py-1 rounded-lg text-sm font-medium transition-colors bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <XCircle size={16} className="inline mr-1" />
                              {isTrial ? 'Annuler essai' : 'Annuler'}
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
            
            {/* Tous les plans disponibles */}
            <div className="space-y-3">
              <button 
                onClick={() => setPlansMenuOpen(!plansMenuOpen)}
                className="flex items-center justify-between w-full text-left font-medium text-gray-700 p-2 hover:bg-gray-50 rounded-lg sticky top-0 bg-white z-10"
              >
                <div className="flex items-center">
                  <PlusCircle className="text-blue-500 mr-2" size={18} />
                  <span>Assigner un nouveau plan</span>
                </div>
                {plansMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              
              {plansMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  {filteredPlans.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      Aucun plan trouvé
                    </div>
                  ) : (
                    filteredPlans.map(plan => {
                      const isPlanAssigned = isAssigned(plan._id);
                      
                      return (
                        <motion.div 
                          key={plan._id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          whileHover={{ scale: 1.01 }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                {/* Icône du plan */}
                                <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-white to-gray-100 rounded-lg shadow-sm mr-3">
                                  {getPlanIcon(plan.name)}
                                </div>
                                
                                <h4 className="font-medium text-gray-900">
                                  {plan.name}
                                </h4>
                              </div>
                              
                              <div className="ml-13 grid grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center text-gray-600">
                                  <CreditCard size={14} className="mr-1" />
                                  <span>
                                    {plan.price} {plan.currency} / {plan.billingCycle}
                                  </span>
                                </div>
                                
                                <div className="flex items-center text-gray-600">
                                  <BarChart2 size={14} className="mr-1" />
                                  <span>
                                    {plan.dashboards.length} tableau(x) inclus
                                  </span>
                                </div>
                                
                                <div className="col-span-2">
                                  <ul className="list-disc pl-5 text-gray-600">
                                    {plan.features.slice(0, 2).map((feature, i) => (
                                      <li key={i} className="text-sm">{feature.text}</li>
                                    ))}
                                    {plan.features.length > 2 && (
                                      <li className="text-sm">+{plan.features.length - 2} autres avantages</li>
                                    )}
                                  </ul>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex space-x-2">
                              <motion.button
                                onClick={() => showAssignConfirmation(plan)}
                                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                  isPlanAssigned ?
                                  'bg-gray-100 text-gray-500 cursor-not-allowed' :
                                  'bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer'
                                }`}
                                whileHover={{ scale: !isPlanAssigned ? 1.05 : 1 }}
                                whileTap={{ scale: !isPlanAssigned ? 0.95 : 1 }}
                                disabled={isPlanAssigned}
                              >
                                {isPlanAssigned ? (
                                  <>
                                    <CheckCircle size={16} className="inline mr-1" />
                                    Assigné
                                  </>
                                ) : (
                                  <>
                                    <PlusCircle size={16} className="inline mr-1" />
                                    Assigner
                                  </>
                                )}
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer fixe */}
        <div className="p-4 border-t border-gray-200 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PlanAssignmentModal;