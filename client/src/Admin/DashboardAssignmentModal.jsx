import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, CheckCircle, AlertCircle, Trash2, PlusCircle, Edit } from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const DashboardAssignmentModal = ({ 
  onClose, 
  dashboards, 
  assignedDashboards,
  onAssign,
  onUnassign,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const showSuccessNotification = (action, dashboardName) => {
    MySwal.fire({
      title: <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center"
      >
        <CheckCircle className="text-green-500 mr-2" size={32} />
        <span>Succès!</span>
      </motion.div>,
      html: <motion.p 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        Le tableau <strong>{dashboardName}</strong> a été {action} avec succès.
      </motion.p>,
      showConfirmButton: false,
      timer: 2000,
      background: '#f8fafc',
      backdrop: `
        rgba(0,0,0,0.4)
        url("/images/confetti.gif")
        left top
        no-repeat
      `,
      customClass: {
        popup: 'border border-green-200 shadow-lg'
      }
    });
  };

  const showRemoveNotification = (dashboardName) => {
    MySwal.fire({
      title: <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center"
      >
        <Trash2 className="text-red-500 mr-2" size={32} />
        <span>Retiré!</span>
      </motion.div>,
      html: <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        Le tableau <strong>{dashboardName}</strong> a été retiré avec succès.
      </motion.p>,
      showConfirmButton: false,
      timer: 2000,
      background: '#f8fafc',
      backdrop: `
        rgba(0,0,0,0.4)
        url("/images/trash.gif")
        right top
        no-repeat
      `,
      customClass: {
        popup: 'border border-red-200 shadow-lg'
      }
    });
  };

  const showErrorNotification = (message) => {
    MySwal.fire({
      title: <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center"
      >
        <AlertCircle className="text-yellow-500 mr-2" size={32} />
        <span>Erreur!</span>
      </motion.div>,
      html: <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {message}
      </motion.p>,
      showConfirmButton: true,
      background: '#f8fafc',
      customClass: {
        popup: 'border border-yellow-200 shadow-lg'
      }
    });
  };

  const handleAssign = async (dashboardId) => {
    try {
      const dashboard = dashboards.find(d => d._id === dashboardId);
      await onAssign(dashboardId);
      showSuccessNotification('assigné', dashboard.name);
    } catch (error) {
      showErrorNotification("Une erreur est survenue lors de l'assignation.");
    }
  };

  const handleUnassign = async (dashboardId) => {
    try {
      const dashboard = dashboards.find(d => d._id === dashboardId);
      await onUnassign(dashboardId);
      showRemoveNotification(dashboard.name);
    } catch (error) {
      showErrorNotification("Une erreur est survenue lors du retrait.");
    }
  };

  const filteredDashboards = dashboards.filter(dashboard => 
    dashboard.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAssigned = (dashboardId) => 
    assignedDashboards.some(d => d._id === dashboardId);

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
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            Assigner des tableaux de bord
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Gérez les tableaux de bord assignés à cet utilisateur
          </p>
        </div>
        
        <div className="p-6">
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher des tableaux de bord..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 size={24} className="animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Chargement...</span>
              </div>
            ) : filteredDashboards.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="mb-2">📊</div>
                <p>Aucun tableau trouvé</p>
                {searchTerm && (
                  <p className="text-sm mt-1">
                    Essayez avec un autre terme de recherche
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3 p-3 cursor-pointer">
                {filteredDashboards.map(dashboard => (
                  <motion.div 
                    key={dashboard._id} 
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {dashboard.name}
                        </h4>
                        {dashboard.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {dashboard.description}
                          </p>
                        )}
                      </div>
                      <motion.button
                        onClick={() => 
                          isAssigned(dashboard._id) 
                            ? handleUnassign(dashboard._id) 
                            : handleAssign(dashboard._id)
                        }
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                          isAssigned(dashboard._id)
                            ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isAssigned(dashboard._id) ? (
                          <>
                            <Trash2 size={16} className="inline mr-1" />
                            Retirer
                          </>
                        ) : (
                          <>
                            <PlusCircle size={16} className="inline mr-1" />
                            Assigner
                          </>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          {assignedDashboards.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>{assignedDashboards.length}</strong> tableau(x) assigné(s) à cet utilisateur
              </p>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {filteredDashboards.length} tableau(x) disponible(s)
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DashboardAssignmentModal;