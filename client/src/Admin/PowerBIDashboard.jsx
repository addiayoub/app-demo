import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Play, Pause, RotateCcw, Maximize2, Settings, 
  Plus, X, Download, FileText, FileSpreadsheet,
  ChevronLeft, ChevronRight, LayoutDashboard, 
  BarChart2, PieChart, LineChart, RefreshCw,
  Edit, Trash2, Save, Check, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { showDeleteConfirmation, showErrorAlert, showLoadingAlert, showSuccessAlert } from './alert';

// Configurer Axios
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
axios.defaults.baseURL = API_BASE_URL;

// Composant ToggleSwitch
const ToggleSwitch = ({ isPublic, onToggle, disabled = false }) => {
  return (
    <motion.div 
      className="flex items-center gap-3"
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
    >
      <div className="relative">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={onToggle}
          disabled={disabled}
          className="sr-only"
        />
        <motion.div
          onClick={!disabled ? onToggle : undefined}
          className={`w-12 h-6 rounded-full cursor-pointer transition-colors ${
            isPublic ? 'bg-blue-500' : 'bg-gray-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          animate={{
            backgroundColor: isPublic ? '#3b82f6' : '#d1d5db'
          }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="w-5 h-5 bg-white rounded-full shadow-md"
            animate={{
              x: isPublic ? 26 : 2,
              y: 2
            }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      </div>
      <motion.span 
        className="text-sm font-medium"
        animate={{ color: isPublic ? '#3b82f6' : '#4b5563' }}
      >
        {isPublic ? 'Public' : 'Privé'}
      </motion.span>
    </motion.div>
  );
};

const PowerBIDashboard = ({   
  isAdmin = false, 
  selectedDashboard, 
  setSelectedDashboard,
  dashboards,
  setDashboards 
}) => {
  // États pour les dashboards
  const [editDashboard, setEditDashboard] = useState(null);
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [newIsPublic, setNewIsPublic] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('view');
  const [exportFormat, setExportFormat] = useState('pdf');
  const iframeRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const controls = useAnimation();

  // Fonction pour afficher les notifications (remplace toast)
const showNotification = (message, type = 'info') => {
  if (type === 'success') {
    showSuccessAlert('Succès', message);
  } else if (type === 'error') {
    showErrorAlert('Erreur', message);
  } else {
    showSuccessAlert('Information', message); // Ou créez une showInfoAlert si besoin
  }
};

  // CORRECTION: Fonction pour toggle le statut public/privé
const handleTogglePublic = async (dashboardId, newIsPublic) => {
  const loadingAlert = showLoadingAlert('Mise à jour en cours...');
  
  try {
    const response = await axios.patch(`/api/dashboards/${dashboardId}/toggle-public`, {
      isPublic: newIsPublic
    }, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      loadingAlert.close();
      setDashboards(prev => prev.map(d => 
        d._id === dashboardId ? { ...d, isPublic: newIsPublic } : d
      ));
      
      if (selectedDashboard?._id === dashboardId) {
        setSelectedDashboard(prev => ({ ...prev, isPublic: newIsPublic }));
      }
      
      showSuccessAlert(
        'Visibilité mise à jour', 
        `Le dashboard est maintenant ${newIsPublic ? 'public' : 'privé'}`
      );
    }
  } catch (error) {
    loadingAlert.close();
    showErrorAlert(
      'Erreur de mise à jour', 
      'Une erreur est survenue lors de la modification de la visibilité'
    );
    console.error('Error updating visibility:', error);
  }
};
  // Charger les dashboards au montage
  useEffect(() => {
    const fetchDashboards = async () => {
      try {
        const response = await axios.get('/api/dashboards', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        const dashboardsData = response.data.data || response.data;
        setDashboards(dashboardsData);
        
        if (dashboardsData && dashboardsData.length > 0) {
          setSelectedDashboard(dashboardsData[0]);
        }
      } catch (err) {
        setError('Erreur lors du chargement des dashboards');
        console.error('Fetch dashboards error:', err.response?.data || err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboards();
  }, [setDashboards, setSelectedDashboard]);

  // Ajouter un dashboard
 const addDashboard = async () => {
  if (!newUrl.trim() || !newName.trim()) {
    showErrorAlert('Champs manquants', 'Veuillez remplir tous les champs');
    return;
  }

  const loadingAlert = showLoadingAlert('Ajout en cours...');

  try {
    const payload = {
      name: newName.trim(),
      url: newUrl.trim(),
      active: true,
      isPublic: newIsPublic
    };

    const response = await axios.post('/api/dashboards', payload, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    const newDashboard = response.data.data || response.data;
    const updatedDashboards = [...dashboards, newDashboard];
    
    setDashboards(updatedDashboards);
    setSelectedDashboard(newDashboard);
    setNewUrl('');
    setNewName('');
    setNewIsPublic(false);
    setShowAddForm(false);
    
    loadingAlert.close();
    showSuccessAlert('Ajout réussi!', 'Le nouveau dashboard a été ajouté avec succès');
  } catch (err) {
    loadingAlert.close();
    const errorMessage = err.response?.data?.message || 'Erreur lors de l\'ajout du dashboard';
    showErrorAlert('Erreur d\'ajout', errorMessage);
    console.error('Add dashboard error:', err.response?.data || err.message);
  }
};

  // Mettre à jour un dashboard
// Modifier la fonction updateDashboard
const updateDashboard = async () => {
  if (!editDashboard?.name.trim() || !editDashboard?.url.trim()) {
    showErrorAlert('Champs manquants', 'Veuillez remplir tous les champs');
    return;
  }

  const loadingAlert = showLoadingAlert('Mise à jour en cours...');

  try {
    const payload = {
      name: editDashboard.name.trim(),
      url: editDashboard.url.trim(),
      active: editDashboard.active,
      isPublic: editDashboard.isPublic || false
    };

    const response = await axios.put(`/api/dashboards/${editDashboard._id}`, payload, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    const updatedDashboard = response.data.data || response.data;
    const updatedDashboards = dashboards.map(d => 
      d._id === updatedDashboard._id ? updatedDashboard : d
    );
    
    setDashboards(updatedDashboards);
    setSelectedDashboard(updatedDashboard);
    setEditDashboard(null);
    
    loadingAlert.close();
    showSuccessAlert('Mis à jour!', 'Le dashboard a été modifié avec succès');
  } catch (err) {
    loadingAlert.close();
    const errorMessage = err.response?.data?.message || 'Erreur lors de la mise à jour du dashboard';
    showErrorAlert('Erreur de mise à jour', errorMessage);
    console.error('Update dashboard error:', err.response?.data || err.message);
  }
};

  // Supprimer un dashboard
// Modifier la fonction deleteDashboard
const deleteDashboard = async (id) => {
  const dashboardToDelete = dashboards.find(d => d._id === id);
  
  showDeleteConfirmation(dashboardToDelete?.name || 'ce dashboard', async () => {
    const loadingAlert = showLoadingAlert('Suppression en cours...');
    
    try {
      await axios.delete(`/api/dashboards/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const updatedDashboards = dashboards.filter(d => d._id !== id);
      setDashboards(updatedDashboards);
      
      if (selectedDashboard?._id === id) {
        setSelectedDashboard(updatedDashboards.length > 0 ? updatedDashboards[0] : null);
      }
      
      loadingAlert.close();
      showSuccessAlert('Supprimé!', 'Le dashboard a été supprimé avec succès');
    } catch (err) {
      loadingAlert.close();
      const errorMessage = err.response?.data?.message || 'Erreur lors de la suppression du dashboard';
      showErrorAlert('Erreur de suppression', errorMessage);
      console.error('Delete dashboard error:', err.response?.data || err.message);
    }
  });
};

  // Actualiser le dashboard
  const refreshDashboard = () => {
    if (iframeRef.current && selectedDashboard?.url) {
      setIsLoading(true);
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  // Toggle dashboard status
 const toggleDashboardStatus = async (id) => {
  const dashboardToUpdate = dashboards.find(d => d._id === id);
  if (!dashboardToUpdate) {
    showErrorAlert('Dashboard introuvable', 'Le dashboard spécifié n\'a pas été trouvé');
    return;
  }

  const loadingAlert = showLoadingAlert('Mise à jour en cours...');
  const newStatus = !dashboardToUpdate.active;

  try {
    const payload = {
      name: dashboardToUpdate.name,
      url: dashboardToUpdate.url,
      active: newStatus,
      isPublic: dashboardToUpdate.isPublic || false
    };

    const response = await axios.put(`/api/dashboards/${id}`, payload, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    const updatedDashboard = response.data.data || response.data;
    const updatedDashboards = dashboards.map(d => 
      d._id === updatedDashboard._id ? updatedDashboard : d
    );
    
    setDashboards(updatedDashboards);
    if (selectedDashboard?._id === id) {
      setSelectedDashboard(updatedDashboard);
    }
    
    loadingAlert.close();
    showSuccessAlert(
      'Statut mis à jour', 
      `Le dashboard est maintenant ${newStatus ? 'activé' : 'désactivé'}`
    );
  } catch (err) {
    loadingAlert.close();
    const errorMessage = err.response?.data?.message || 'Erreur lors de la mise à jour du statut';
    showErrorAlert('Erreur de mise à jour', errorMessage);
    console.error('Toggle status error:', err.response?.data || err.message);
  }
};

  // Plein écran
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      iframeRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  // Exporter le rapport
  const exportReport = () => {
    if (!selectedDashboard?.url) return;
    
    const exportUrl = selectedDashboard.url
      .replace('reportEmbed', 'reportExport')
      .replace('view?', 'export?');
    
    window.open(`${exportUrl}&format=${exportFormat}`, '_blank');
  };

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  };

  const slideUp = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.3 } }
  };

  const rotate = {
    rotate: 360,
    transition: { repeat: Infinity, duration: 2, ease: "linear" }
  };

return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="h-full flex flex-col min-h-screen"
    >
      {/* Error Display */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg cursor-pointer"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
              <span className="text-red-700 text-xs sm:text-sm">{error}</span>
            </div>
            <button 
              onClick={() => setError('')}
              className="text-red-400 hover:text-red-600 flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Admin Controls - RETIRER LES BOUTONS PLAY/PAUSE DU FORMULAIRE */}
      {isAdmin && selectedDashboard && !showAddForm && !editDashboard && (
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setEditDashboard(selectedDashboard)}
            className="flex items-center gap-1 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-4 py-2 rounded-lg cursor-pointer text-xs sm:text-sm"
          >
            <Edit size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Modifier</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => toggleDashboardStatus(selectedDashboard._id)}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg cursor-pointer text-xs sm:text-sm ${
              selectedDashboard.active 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {selectedDashboard.active ? (
              <>
                <Pause size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Désactiver</span>
              </>
            ) : (
              <>
                <Play size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Activer</span>
              </>
            )}
          </motion.button>

         <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => deleteDashboard(selectedDashboard._id)}
          className="flex items-center gap-1 sm:gap-2 bg-red-600 hover:bg-red-700 text-white px-2 sm:px-4 py-2 rounded-lg cursor-pointer text-xs sm:text-sm"
        >
          <Trash2 size={14} className="sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Supprimer</span>
        </motion.button>

          {/* CORRECTION: Toggle Public/Privé directement dans les contrôles */}
          <div className="flex items-center gap-2 bg-white px-2 sm:px-4 py-2 rounded-lg shadow-sm">
            <span className="text-xs sm:text-sm text-gray-700 hidden sm:inline">Visibilité:</span>
            <ToggleSwitch 
              isPublic={selectedDashboard.isPublic || false} 
              onToggle={() => handleTogglePublic(selectedDashboard._id, !selectedDashboard.isPublic)}
            />
          </div>
        </div>
      )}

      {/* Contrôles du dashboard */}
      <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 break-words">
              {selectedDashboard?.name || 'Tableau de bord'}
            </h2>
            {selectedDashboard && !selectedDashboard.active && (
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full cursor-pointer whitespace-nowrap">
                Inactif
              </span>
            )}
            {selectedDashboard?.isPublic && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full cursor-pointer whitespace-nowrap">
                Public
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={refreshDashboard}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </motion.button>
            
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
              
              <AnimatePresence>
                {showExportMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-36 sm:w-48 bg-white rounded-lg shadow-lg z-10 overflow-hidden cursor-pointer"
                  >
                    <button
                      onClick={() => {
                        setExportFormat('pdf');
                        exportReport();
                        setShowExportMenu(false);
                      }}
                      className="flex items-center w-full px-3 sm:px-4 py-2 text-left hover:bg-gray-100 cursor-pointer text-sm"
                    >
                      <FileText className="w-4 h-4 mr-2 text-gray-600" />
                      <span>PDF</span>
                    </button>
                    <button
                      onClick={() => {
                        setExportFormat('xlsx');
                        exportReport();
                        setShowExportMenu(false);
                      }}
                      className="flex items-center w-full px-3 sm:px-4 py-2 text-left hover:bg-gray-100 cursor-pointer text-sm"
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-2 text-gray-600" />
                      <span>Excel</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer"
            >
              <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
            
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowAddForm(true);
                  setEditDashboard(null);
                }}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 cursor-pointer rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-xs sm:text-sm"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Ajouter</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Form d'ajout/modification */}
      <AnimatePresence>
        {(showAddForm || editDashboard) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 overflow-hidden cursor-pointer"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                {editDashboard ? 'Modifier Dashboard' : 'Ajouter un Dashboard'}
              </h2>
              <button 
                onClick={() => {
                  setShowAddForm(false);
                  setEditDashboard(null);
                  setError('');
                  setNewUrl('');
                  setNewName('');
                  setNewIsPublic(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 cursor-pointer">
                  Nom du Dashboard
                </label>
                <input
                  type="text"
                  value={editDashboard ? editDashboard.name : newName}
                  onChange={(e) => 
                    editDashboard 
                      ? setEditDashboard({...editDashboard, name: e.target.value})
                      : setNewName(e.target.value)
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border cursor-pointer border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                  placeholder="Ex: Rapport des Ventes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 cursor-pointer">
                  URL Power BI
                </label>
                <input
                  type="url"
                  value={editDashboard ? editDashboard.url : newUrl}
                  onChange={(e) => 
                    editDashboard 
                      ? setEditDashboard({...editDashboard, url: e.target.value})
                      : setNewUrl(e.target.value)
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 cursor-pointer rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                  placeholder="https://app.powerbi.com/view?r=..."
                />
              </div>
            </div>
            
            {/* Section Visibilité */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg gap-3">
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visibilité
                </label>
                <p className="text-xs text-gray-500">
                  {(editDashboard ? editDashboard.isPublic : newIsPublic)
                    ? 'Tous les utilisateurs peuvent voir ce dashboard' 
                    : 'Seuls les utilisateurs assignés peuvent voir ce dashboard'}
                </p>
              </div>
              
              <div className="flex-shrink-0">
                <ToggleSwitch 
                  isPublic={editDashboard ? editDashboard.isPublic || false : newIsPublic} 
                  onToggle={() => editDashboard 
                    ? setEditDashboard({...editDashboard, isPublic: !editDashboard.isPublic})
                    : setNewIsPublic(!newIsPublic)
                  }
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={editDashboard ? updateDashboard : addDashboard}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-4 sm:px-5 py-2 sm:py-3 rounded-lg transition-all shadow-md cursor-pointer text-sm sm:text-base"
              >
                {editDashboard ? <Save className="w-4 h-4 sm:w-5 sm:h-5" /> : <Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
                <span>{editDashboard ? 'Enregistrer' : 'Ajouter'}</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liste des dashboards (mobile) */}
      <div className="lg:hidden mb-4 sm:mb-6">
        <select
          onChange={(e) => {
            const selected = dashboards.find(d => d._id === e.target.value);
            if (selected) setSelectedDashboard(selected);
          }}
          value={selectedDashboard?._id || ''}
          className="w-full p-2 sm:p-3 cursor-pointer border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
        >
          {dashboards.map(dashboard => (
            <option key={dashboard._id} value={dashboard._id}>
              {dashboard.name} {!dashboard.active && '(Inactif)'} {dashboard.isPublic && '(Public)'}
            </option>
          ))}
        </select>
      </div>

      {/* Affichage du dashboard */}
      <motion.div 
        className="bg-white cursor-pointer rounded-xl shadow-lg overflow-hidden flex-1 flex flex-col min-h-0"
      >
        {selectedDashboard && selectedDashboard.url ? (
          <div className="relative flex-1 min-h-0">
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute cursor-pointer inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10"
              >
                <div className="flex flex-col items-center gap-3 sm:gap-4">
                  <motion.div
                    animate={rotate}
                    className="w-8 h-8 sm:w-12 sm:h-12 border-4 border-blue-500 border-t-transparent rounded-full cursor-pointer"
                  />
                  <span className="text-gray-600 text-sm sm:text-lg">Chargement du dashboard...</span>
                </div>
              </motion.div>
            )}
            
            <iframe
              ref={iframeRef}
              src={selectedDashboard.url}
              className="w-full h-full min-h-[400px] sm:min-h-[500px]  border-0"
              title={selectedDashboard.name}
              allowFullScreen
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setError('Erreur lors du chargement du dashboard');
              }}
              style={{ 
                transform: 'scale(1)',
                transformOrigin: '0 0',
                width: '100%',
                height: '100%'
              }}
            />
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col items-center justify-center cursor-pointer text-gray-400 p-4 sm:p-6 min-h-[300px] sm:min-h-[400px]"
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                y: [0, -10, 0]
              }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              <BarChart2 className="w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4" />
            </motion.div>
            <p className="text-lg sm:text-xl font-medium mb-2 text-center">Aucun dashboard sélectionné</p>
            <p className="text-xs sm:text-sm text-center max-w-md">
              {dashboards.length === 0 
                ? isAdmin 
                  ? 'Ajoutez un nouveau dashboard pour commencer' 
                  : 'Aucun dashboard disponible'
                : 'Sélectionnez un dashboard dans la liste'}
            </p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default PowerBIDashboard;