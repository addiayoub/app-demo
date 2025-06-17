import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Clock, CreditCard, X, AlertTriangle } from 'lucide-react';

const SubscriptionDetailsModal = ({ 
  subscription, 
  loading, 
  onClose, 
  onRevoke 
}) => {
  const calculateDaysRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-medium">Détails de l'Abonnement</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : subscription ? (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">{subscription.plan?.name || 'Plan inconnu'}</h4>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-blue-900">
                    {subscription.plan?.price || '0'} {subscription.plan?.currency || '€'}
                  </span>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {subscription.plan?.billingCycle || 'mensuel'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Début</p>
                  <p className="font-medium">
                    {formatDate(subscription.currentPeriodStart)}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Fin</p>
                  <p className="font-medium">
                    {formatDate(subscription.currentPeriodEnd)}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-gray-500">Jours restants</p>
                  <p className="font-medium flex items-center">
                    <Clock size={16} className="mr-1" />
                    {calculateDaysRemaining(subscription.currentPeriodEnd)} jours
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min(
                        100, 
                        Math.max(
                          0, 
                          (calculateDaysRemaining(subscription.currentPeriodEnd) / 
                          ((new Date(subscription.currentPeriodEnd) - new Date(subscription.currentPeriodStart)) / (1000 * 60 * 60 * 24))) * 100
                        )
                      )}%` 
                    }}
                  ></div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium mb-2">Tableaux inclus</h4>
                <div className="flex flex-wrap gap-2">
                  {subscription.dashboards?.length > 0 ? (
                    subscription.dashboards.map(dashboard => (
                      <span 
                        key={dashboard._id}
                        className="text-xs px-2 py-1 rounded bg-green-100 text-green-800"
                      >
                        {dashboard.name}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Aucun tableau assigné</p>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  onClick={onRevoke}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center"
                >
                  <AlertTriangle size={16} className="mr-2" />
                  Révoquer
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CreditCard size={32} className="mx-auto mb-4" />
              <p>Aucun abonnement actif</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SubscriptionDetailsModal;