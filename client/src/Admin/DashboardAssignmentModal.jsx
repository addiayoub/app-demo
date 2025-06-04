import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, CheckCircle, AlertCircle, Trash2, PlusCircle, Edit, Calendar, Clock } from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import 'react-datepicker/dist/react-datepicker.css';

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
  const [expirationDates, setExpirationDates] = useState({});

  const handleDateChange = (dashboardId, date) => {
    setExpirationDates(prev => ({
      ...prev,
      [dashboardId]: date
    }));
  };

const showAssignConfirmation = (dashboardId, dashboardName) => {
  let selectedDateTime = expirationDates[dashboardId] || null;
  
  // Options rapides avec animations
  const quickOptions = [
    { label: '1 Jour', value: 1, unit: 'day', icon: '☀️', color: '#f59e0b' },
    { label: '1 Semaine', value: 7, unit: 'day', icon: '📅', color: '#3b82f6' },
    { label: '1 Mois', value: 1, unit: 'month', icon: '🗓️', color: '#8b5cf6' },
    { label: '3 Mois', value: 3, unit: 'month', icon: '📊', color: '#06b6d4' },
    { label: '6 Mois', value: 6, unit: 'month', icon: '⏳', color: '#f97316' },
    { label: '1 An', value: 1, unit: 'year', icon: '🎯', color: '#10b981' }
  ];
  
  // Calculer la date basée sur l'option rapide
  const calculateQuickDate = (value, unit) => {
    const now = new Date();
    const futureDate = new Date();
    
    switch(unit) {
      case 'day':
        futureDate.setDate(now.getDate() + value);
        break;
      case 'month':
        futureDate.setMonth(now.getMonth() + value);
        break;
      case 'year':
        futureDate.setFullYear(now.getFullYear() + value);
        break;
    }
    
    futureDate.setHours(23, 59, 59, 999); // Fin de journée
    return futureDate;
  };
  
  // Préparer les valeurs initiales
  const initialDate = selectedDateTime ? selectedDateTime.toISOString().split('T')[0] : '';
  const initialTime = selectedDateTime ? 
    `${selectedDateTime.getHours().toString().padStart(2, '0')}:${selectedDateTime.getMinutes().toString().padStart(2, '0')}` : '';

  MySwal.fire({
    title: '⚡ Configuration de l\'accès',
    html: `
      <style>
        .quick-option {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateY(0);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .quick-option:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        .quick-option.selected {
          transform: translateY(-1px) scale(1.05);
          box-shadow: 0 8px 25px rgba(0,0,0,0.2);
          border-width: 2px !important;
        }
        
        .mode-toggle {
          transition: all 0.3s ease;
          border-radius: 25px;
          position: relative;
          overflow: hidden;
        }
        
        .mode-toggle.active {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .pulse-animation {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .slide-in {
          animation: slideIn 0.5s ease-out;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .fade-in {
          animation: fadeIn 0.3s ease-in;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      </style>
      
      <div style="text-align: left;">
        <p style="margin-bottom: 20px; color: #374151; font-size: 15px;">
          Tableau de bord : <strong style="color: #2563eb; font-size: 16px;">${dashboardName}</strong>
        </p>
        
        <!-- Affichage de la date et heure sélectionnées -->
        <div id="datetime-display" class="pulse-animation" style="padding: 16px; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 12px; border: 2px solid #93c5fd; margin-bottom: 24px; text-align: center;">
          <p style="margin: 0; font-size: 15px; color: #1e40af; font-weight: 600;">
            ${selectedDateTime 
              ? `⏰ Expire le ${selectedDateTime.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })} à ${selectedDateTime.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}`
              : '♾️ Accès permanent'}
          </p>
        </div>
        
        <!-- Toggle entre mode rapide et manuel -->
        <div style="display: flex; margin-bottom: 20px; background-color: #f1f5f9; border-radius: 25px; padding: 4px;">
          <button id="quick-mode-btn" class="mode-toggle active" style="flex: 1; padding: 12px 20px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; border: none; font-weight: 600; cursor: pointer;">
            ⚡ Accès rapide
          </button>
          <button id="manual-mode-btn" class="mode-toggle" style="flex: 1; padding: 12px 20px; background: transparent; color: #64748b; border: none; font-weight: 600; cursor: pointer;">
            🎯 Manuel
          </button>
        </div>
        
        <!-- Section des options rapides -->
        <div id="quick-section" class="slide-in">
          <h4 style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px; font-weight: 600;">
            ⚡ Choisissez une durée
          </h4>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px;">
            ${quickOptions.map((option, index) => `
              <div class="quick-option" data-value="${option.value}" data-unit="${option.unit}" 
                   style="padding: 16px 12px; border: 2px solid #e5e7eb; border-radius: 12px; text-align: center; cursor: pointer; background: linear-gradient(135deg, white 0%, #f8fafc 100%); animation-delay: ${index * 0.1}s;">
                <div style="font-size: 24px; margin-bottom: 8px;">${option.icon}</div>
                <div style="font-weight: 600; color: #1f2937; font-size: 14px;">${option.label}</div>
                <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                  ${option.unit === 'day' ? `+${option.value} jour${option.value > 1 ? 's' : ''}` : 
                    option.unit === 'month' ? `+${option.value} mois` : 
                    `+${option.value} an${option.value > 1 ? 's' : ''}`}
                </div>
              </div>
            `).join('')}
          </div>
          
          <!-- Option d'accès permanent -->
          <div class="quick-option fade-in" id="permanent-option" 
               style="padding: 16px; border: 2px solid #e5e7eb; border-radius: 12px; text-align: center; cursor: pointer; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); margin-bottom: 20px;">
            <div style="font-size: 24px; margin-bottom: 8px;">♾️</div>
            <div style="font-weight: 600; color: #065f46; font-size: 16px;">Accès permanent</div>
            <div style="font-size: 12px; color: #047857; margin-top: 4px;">Aucune date d'expiration</div>
          </div>
        </div>
        
        <!-- Section manuelle -->
        <div id="manual-section" style="display: none;">
          <h4 style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px; font-weight: 600;">
            🎯 Configuration manuelle
          </h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
            <div>
              <label style="display: block; font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px;">
                📅 Date d'expiration
              </label>
              <input
                id="date-input"
                type="date"
                min="${new Date().toISOString().split('T')[0]}"
                value="${initialDate}"
                style="border: 2px solid #d1d5db; border-radius: 8px; padding: 12px; width: 100%; box-sizing: border-box; font-size: 14px; transition: all 0.3s ease;"
              />
            </div>
            
            <div>
              <label style="display: block; font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px;">
                🕐 Heure d'expiration
              </label>
              <input
                id="time-input"
                type="time"
                value="${initialTime}"
                style="border: 2px solid #d1d5db; border-radius: 8px; padding: 12px; width: 100%; box-sizing: border-box; font-size: 14px; transition: all 0.3s ease;"
              />
            </div>
          </div>
          
          <button id="clear-manual" style="padding: 8px 16px; background-color: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; border-radius: 8px; font-size: 12px; cursor: pointer; transition: all 0.3s ease;">
            🗑️ Effacer les dates
          </button>
        </div>
        
        <div style="margin-top: 16px; padding: 12px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; font-size: 12px; color: #92400e;">
            💡 <strong>Astuce :</strong> Les options rapides définissent automatiquement l'heure à 23h59
          </p>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: '✅ Confirmer l\'assignation',
    cancelButtonText: '❌ Annuler',
    buttonsStyling: false,
    customClass: {
      confirmButton: 'px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold mx-2 shadow-lg transform hover:scale-105',
      cancelButton: 'px-8 py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-lg hover:from-gray-300 hover:to-gray-400 transition-all duration-300 font-semibold mx-2 shadow-lg transform hover:scale-105',
      popup: 'rounded-2xl shadow-2xl border-0'
    },
    focusConfirm: false,
    background: '#ffffff',
    width: '700px',
    didOpen: () => {
      const dateInput = document.getElementById('date-input');
      const timeInput = document.getElementById('time-input');
      const dateDisplay = document.getElementById('datetime-display');
      const quickModeBtn = document.getElementById('quick-mode-btn');
      const manualModeBtn = document.getElementById('manual-mode-btn');
      const quickSection = document.getElementById('quick-section');
      const manualSection = document.getElementById('manual-section');
      const quickOptions = document.querySelectorAll('.quick-option[data-value]');
      const permanentOption = document.getElementById('permanent-option');
      const clearManualBtn = document.getElementById('clear-manual');
      
      // FIXED: Declare these variables in the proper scope
      let currentMode = 'quick';
      let selectedQuickOption = null;
      
      // Fonction pour mettre à jour l'affichage
      const updateDisplay = (customDate = null) => {
        let displayDate = customDate;
        
        if (!displayDate && currentMode === 'manual') {
          const dateValue = dateInput.value;
          const timeValue = timeInput.value;
          
          if (dateValue) {
            // FIXED: Properly parse the date string
            displayDate = new Date(dateValue + 'T00:00:00');
            if (timeValue) {
              const [hours, minutes] = timeValue.split(':');
              displayDate.setHours(parseInt(hours), parseInt(minutes));
            } else {
              displayDate.setHours(23, 59);
            }
          }
        }
        
        if (displayDate && displayDate instanceof Date && !isNaN(displayDate.getTime())) {
          // FIXED: Check if displayDate is a valid Date object
          dateDisplay.innerHTML = `
            <p style="margin: 0; font-size: 15px; color: #1e40af; font-weight: 600;">
              ⏰ Expire le ${displayDate.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} à ${displayDate.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          `;
          dateDisplay.style.background = 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)';
          dateDisplay.style.borderColor = '#93c5fd';
        } else {
          dateDisplay.innerHTML = `
            <p style="margin: 0; font-size: 15px; color: #065f46; font-weight: 600;">
              ♾️ Accès permanent
            </p>
          `;
          dateDisplay.style.background = 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)';
          dateDisplay.style.borderColor = '#6ee7b7';
        }
      };
      
      // Toggle entre modes
      const switchMode = (mode) => {
        currentMode = mode;
        
        if (mode === 'quick') {
          quickModeBtn.classList.add('active');
          manualModeBtn.classList.remove('active');
          quickModeBtn.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
          quickModeBtn.style.color = 'white';
          manualModeBtn.style.background = 'transparent';
          manualModeBtn.style.color = '#64748b';
          
          quickSection.style.display = 'block';
          manualSection.style.display = 'none';
          quickSection.classList.add('slide-in');
        } else {
          manualModeBtn.classList.add('active');
          quickModeBtn.classList.remove('active');
          manualModeBtn.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
          manualModeBtn.style.color = 'white';
          quickModeBtn.style.background = 'transparent';
          quickModeBtn.style.color = '#64748b';
          
          quickSection.style.display = 'none';
          manualSection.style.display = 'block';
          manualSection.classList.add('fade-in');
        }
        
        // Reset selections
        selectedQuickOption = null;
        quickOptions.forEach(opt => opt.classList.remove('selected'));
        permanentOption.classList.remove('selected');
        
        updateDisplay();
      };
      
      // Event listeners pour les toggles
      quickModeBtn.addEventListener('click', () => switchMode('quick'));
      manualModeBtn.addEventListener('click', () => switchMode('manual'));
      
      // Event listeners pour les options rapides
      quickOptions.forEach(option => {
        option.addEventListener('click', () => {
          // Reset autres sélections
          quickOptions.forEach(opt => opt.classList.remove('selected'));
          permanentOption.classList.remove('selected');
          
          // Sélectionner cette option
          option.classList.add('selected');
          const value = parseInt(option.dataset.value);
          const unit = option.dataset.unit;
          selectedQuickOption = { value, unit };
          
          // Calculer et afficher la date
          const calculatedDate = calculateQuickDate(value, unit);
          updateDisplay(calculatedDate);
          
          // Animation de succès
          option.style.transform = 'scale(1.1)';
          setTimeout(() => {
            option.style.transform = 'translateY(-1px) scale(1.05)';
          }, 150);
        });
      });
      
      // Event listener pour l'option permanente
      permanentOption.addEventListener('click', () => {
        quickOptions.forEach(opt => opt.classList.remove('selected'));
        permanentOption.classList.add('selected');
        selectedQuickOption = null;
        updateDisplay(null);
        
        // Animation
        permanentOption.style.transform = 'scale(1.1)';
        setTimeout(() => {
          permanentOption.style.transform = 'translateY(-1px) scale(1.05)';
        }, 150);
      });
      
      // Event listeners pour les inputs manuels
      dateInput.addEventListener('change', updateDisplay);
      dateInput.addEventListener('input', updateDisplay);
      timeInput.addEventListener('change', updateDisplay);
      timeInput.addEventListener('input', updateDisplay);
      
      // Effacer les dates manuelles
      clearManualBtn.addEventListener('click', () => {
        dateInput.value = '';
        timeInput.value = '';
        updateDisplay();
      });
      
      // Focus effects pour les inputs
      [dateInput, timeInput].forEach(input => {
        input.addEventListener('focus', () => {
          input.style.borderColor = '#3b82f6';
          input.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
        });
        
        input.addEventListener('blur', () => {
          input.style.borderColor = '#d1d5db';
          input.style.boxShadow = 'none';
        });
      });
      
      // Initialiser l'affichage
      updateDisplay();
      
      // FIXED: Store variables in window object to access them in preConfirm
      window.modalState = {
        getCurrentMode: () => currentMode,
        getSelectedQuickOption: () => selectedQuickOption,
        calculateQuickDate: calculateQuickDate
      };
    },
    preConfirm: () => {
      const dateInput = document.getElementById('date-input');
      const timeInput = document.getElementById('time-input');
      
      // FIXED: Access variables through window object
      const currentMode = window.modalState?.getCurrentMode() || 'quick';
      const selectedQuickOption = window.modalState?.getSelectedQuickOption();
      const calculateQuickDate = window.modalState?.calculateQuickDate;
      
      // Si on est en mode rapide et qu'une option est sélectionnée
      if (currentMode === 'quick' && selectedQuickOption && calculateQuickDate) {
        const calculatedDate = calculateQuickDate(selectedQuickOption.value, selectedQuickOption.unit);
        return { expiresAt: calculatedDate };
      }
      
      // Si on est en mode rapide et que "permanent" est sélectionné
      if (currentMode === 'quick' && !selectedQuickOption) {
        const permanentSelected = document.getElementById('permanent-option')?.classList.contains('selected');
        if (permanentSelected) {
          return { expiresAt: null };
        }
      }
      
      // Mode manuel
      if (dateInput && dateInput.value) {
        // FIXED: Properly parse the manual date
        const date = new Date(dateInput.value + 'T00:00:00');
        if (timeInput && timeInput.value) {
          const [hours, minutes] = timeInput.value.split(':');
          date.setHours(parseInt(hours), parseInt(minutes));
        } else {
          date.setHours(23, 59);
        }
        return { expiresAt: date };
      }
      
      return { expiresAt: null };
    },
    willClose: () => {
      // FIXED: Clean up window state
      if (window.modalState) {
        delete window.modalState;
      }
    }
  }).then((result) => {
    if (result.isConfirmed) {
      setExpirationDates(prev => ({
        ...prev,
        [dashboardId]: result.value.expiresAt
      }));
      onAssign(dashboardId, result.value.expiresAt);
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
    assignedDashboards.some(d => d.dashboard._id === dashboardId);

  const getExpirationDate = (dashboardId) => {
    const assignment = assignedDashboards.find(d => d.dashboard._id === dashboardId);
    return assignment?.expiresAt ? new Date(assignment.expiresAt) : null;
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
                {filteredDashboards.map(dashboard => {
                  const isDashboardAssigned = isAssigned(dashboard._id);
                  const expirationDate = getExpirationDate(dashboard._id);
                  
                  return (
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
                          {isDashboardAssigned && (
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              <Calendar size={14} className="mr-1" />
                              <span>
                                {expirationDate ? (
                                  `Expire le: ${expirationDate.toLocaleDateString('fr-FR', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })} à ${expirationDate.toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}`
                                ) : (
                                  <span className="text-green-600">Accès permanent</span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {isDashboardAssigned && (
                            <motion.button
                              onClick={() => showAssignConfirmation(dashboard._id, dashboard.name)}
                              className="px-3 py-1 rounded-lg text-sm font-medium transition-colors cursor-pointer bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Edit size={16} className="inline mr-1" />
                              Modifier
                            </motion.button>
                          )}
                          <motion.button
                            onClick={() => 
                              isDashboardAssigned 
                                ? handleUnassign(dashboard._id) 
                                : showAssignConfirmation(dashboard._id, dashboard.name)
                            }
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                              isDashboardAssigned
                                ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {isDashboardAssigned ? (
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
                      </div>
                    </motion.div>
                  );
                })}
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
}

export default DashboardAssignmentModal;/////////////////////////////