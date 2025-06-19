import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Send, AlertCircle, CheckCircle, X, Loader2,
  Paperclip, MessageSquare, Users, Tag, ChevronDown,
  Trash2, Edit, ChevronRight, Search, RefreshCw,
  Archive, ShieldAlert, CircleHelp, CreditCard, UserCog,
  Filter, Sliders, MailCheck, MailWarning, MailOpen,
  UserPlus, ClipboardList, BarChart2, User
} from 'lucide-react';
import io from 'socket.io-client';
import { 
  showSuccessAlert, 
  showErrorAlert, 
  showDeleteConfirmation,
  showLoadingAlert 
} from './alert'; // Modifiez le chemin selon votre structure
const AdminTickets = () => {
  // États pour la gestion des tickets
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  // États pour les filtres avancés
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    priority: '',
    category: '',
    assignedTo: '',
    dateRange: ''
  });
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const newSocket = io(API_URL);
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);
  useEffect(() => {
    if (!socket) return;

    const handleNewReply = (data) => {
      // Si le ticket concerné est celui actuellement affiché
      if (selectedTicket && selectedTicket._id === data.ticketId) {
        setSelectedTicket(prev => ({
          ...prev,
          replies: [...prev.replies, data.reply]
        }));
      }

      // Mettre à jour la liste des tickets
      setTickets(prev => prev.map(ticket => {
        if (ticket._id === data.ticketId) {
          return {
            ...ticket,
            replies: [...ticket.replies, data.reply],
            lastActivity: new Date()
          };
        }
        return ticket;
      }));
    };

    socket.on('ticketReply', handleNewReply);

    return () => {
      socket.off('ticketReply', handleNewReply);
    };
  }, [socket, selectedTicket]);

const AttachmentPreview = ({ attachment }) => {
  const attachmentUrl = getAttachmentUrl(attachment.path);
  const isImage = attachment.mimetype.startsWith('image/');

  return (
    <div className="border border-gray-200 rounded-lg p-2 bg-white">
      {isImage ? (
        <a href={attachmentUrl} target="_blank" rel="noopener noreferrer">
          <img 
            src={attachmentUrl} 
            alt={attachment.originalName} 
            className="max-w-full h-auto max-h-40 rounded-md object-contain"
          />
        </a>
      ) : (
        <a 
          href={attachmentUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <Paperclip size={14} className="mr-2" />
          {attachment.originalName}
        </a>
      )}
      <div className="text-xs text-gray-500 mt-1">
        {Math.round(attachment.size / 1024)} KB
      </div>
    </div>
  );
};
  // États pour les réponses
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Configuration API - Correction de l'URL
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  // Fonction pour obtenir le token d'authentification
  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  // Configuration des headers pour les requêtes API
  const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // Données statiques pour les options
  const priorities = [
    { value: 'low', label: 'Faible', color: 'bg-green-500', icon: <CircleHelp size={14} /> },
    { value: 'medium', label: 'Moyenne', color: 'bg-yellow-500', icon: <AlertCircle size={14} /> },
    { value: 'high', label: 'Haute', color: 'bg-orange-500', icon: <ShieldAlert size={14} /> },
    { value: 'critical', label: 'Critique', color: 'bg-red-500', icon: <ShieldAlert size={14} /> }
  ];

  const categories = [
    { value: 'technical', label: 'Technique', icon: <CircleHelp size={14} /> },
    { value: 'billing', label: 'Facturation', icon: <CreditCard size={14} /> },
    { value: 'account', label: 'Compte', icon: <UserCog size={14} /> },
    { value: 'feature', label: 'Fonctionnalité', icon: <UserPlus size={14} /> },
    { value: 'other', label: 'Autre', icon: <Archive size={14} /> }
  ];

  // Récupérer tous les tickets avec filtres
  const fetchTickets = async (filters = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Construire les paramètres de requête
      const queryParams = new URLSearchParams();
      if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.assignedTo) queryParams.append('assignedTo', filters.assignedTo);
      
      const queryString = queryParams.toString();
      const url = `${API_URL}/api/admin/tickets${queryString ? '?' + queryString : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setTickets(data);
      setFilteredTickets(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des tickets:', error);
      setError('Impossible de charger les tickets. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Récupérer les statistiques des tickets
const fetchTicketStats = async () => {
  try {
    const response = await fetch(`${API_URL}/api/admin/tickets/stats`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    if (!response.ok) {
      // Calcul local si l'API échoue
      return calculateLocalStats();
    }

    const statsData = await response.json();
    setStats(statsData);
  } catch (error) {
    console.error('Erreur:', error);
    calculateLocalStats();
  }
};
// Fonction pour obtenir l'URL complète d'une pièce jointe
const getAttachmentUrl = (path) => {
  // Supprimer les backslashes et les remplacer par des slashes
  const normalizedPath = path.replace(/\\/g, '/');
  return `${API_URL}/${normalizedPath}`;
};
const calculateLocalStats = () => {
  setStats({
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    pending: tickets.filter(t => t.status === 'pending').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    unassigned: tickets.filter(t => !t.admin).length
  });
};

  // Récupérer la liste des utilisateurs
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        console.warn(`Impossible de récupérer les utilisateurs: ${response.status}`);
        return;
      }

      const usersData = await response.json();
      setUsers(usersData);
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
    }
  };

  // Récupérer un ticket spécifique avec ses détails
  const fetchTicketDetails = async (ticketId) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/tickets/${ticketId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const ticketDetails = await response.json();
      setSelectedTicket(ticketDetails);
    } catch (error) {
      console.error('Erreur lors de la récupération des détails du ticket:', error);
      setError('Impossible de charger les détails du ticket.');
    }
  };

  // Ajouter une réponse à un ticket
   const addReplyToTicket = async (ticketId, content) => {
  try {
    setIsSubmittingReply(true);
    const loadingAlert = showLoadingAlert('Envoi en cours...');
    
    const response = await fetch(`${API_URL}/api/admin/tickets/${ticketId}/reply`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      loadingAlert.close();
      showErrorAlert('Erreur', 'Échec de l\'envoi de la réponse');
      throw new Error('Erreur lors de l\'envoi');
    }

    const updatedTicket = await response.json();
    
    // Mettre à jour l'état local
    setTickets(prev => prev.map(t => t._id === ticketId ? updatedTicket : t));
    setSelectedTicket(updatedTicket);
    
    loadingAlert.close();
    showSuccessAlert('Envoyé!', 'Votre réponse a été envoyée avec succès');
    
    return updatedTicket;
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  } finally {
    setIsSubmittingReply(false);
  }
};

  // Changer le statut d'un ticket
const updateTicketStatus = async (ticketId, status) => {
  try {
    const loadingAlert = showLoadingAlert('Mise à jour en cours...');
    
    const response = await fetch(`${API_URL}/api/admin/tickets/${ticketId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    const updatedTicket = await response.json();
    
    // Mettre à jour les tickets
    setTickets(prev => prev.map(t => t._id === ticketId ? updatedTicket : t));
    
    // Mettre à jour le ticket sélectionné si nécessaire
    if (selectedTicket && selectedTicket._id === ticketId) {
      setSelectedTicket(updatedTicket);
    }
    
    // Actualiser les statistiques
    fetchTicketStats();
    
    loadingAlert.close();
    showSuccessAlert('Mis à jour!', 'Statut du ticket mis à jour');
    
    return updatedTicket;
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
};
  // Assigner un ticket à un administrateur
const assignTicket = async (ticketId, adminId) => {
  try {
    const loadingAlert = showLoadingAlert('Assignation en cours...');
    
    const response = await fetch(`${API_URL}/api/admin/tickets/${ticketId}/assign`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ adminId })
    });

    if (!response.ok) {
      loadingAlert.close();
      showErrorAlert('Erreur', 'Échec de l\'assignation du ticket');
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    const updatedTicket = await response.json();
    
    // Mettre à jour le ticket dans la liste
    setTickets(prev => 
      prev.map(ticket => 
        ticket._id === ticketId ? updatedTicket : ticket
      )
    );
    
    // Mettre à jour le ticket sélectionné si c'est le même
    if (selectedTicket && selectedTicket._id === ticketId) {
      setSelectedTicket(updatedTicket);
    }
    
    loadingAlert.close();
    const adminName = adminId ? users.find(u => u._id === adminId)?.name : 'personne';
    showSuccessAlert('Assigné!', `Ticket assigné à ${adminName}`);
    
    return updatedTicket;
  } catch (error) {
    console.error('Erreur lors de l\'assignation du ticket:', error);
    setError('Impossible d\'assigner le ticket. Veuillez réessayer.');
    throw error;
  }
};

// Dans la fonction deleteTicket
const deleteTicket = async (ticketId) => {
  try {
    const response = await fetch(`${API_URL}/api/admin/tickets/${ticketId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    // Mettre à jour les tickets localement
    const updatedTickets = tickets.filter(ticket => ticket._id !== ticketId);
    setTickets(updatedTickets);
    setFilteredTickets(updatedTickets);
    
    // Désélectionner le ticket si c'est celui qui est affiché
    if (selectedTicket && selectedTicket._id === ticketId) {
      setSelectedTicket(null);
    }
    
    // Mettre à jour les statistiques immédiatement
    fetchTicketStats();
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du ticket:', error);
    throw error;
  }
};
  // Charger les données au montage du composant
  useEffect(() => {
    fetchTickets();
    fetchUsers();
  }, []);

  // Recalculer les stats quand les tickets changent
 useEffect(() => {
  if (tickets.length > 0) {
    calculateLocalStats(); // Utilisez le calcul local d'abord
    fetchTicketStats();   // Puis essayez de synchroniser avec le serveur
  }
}, [tickets]);

  // Filtrer les tickets en fonction des critères
  useEffect(() => {
    let filtered = tickets;
    
    // Filtre par statut
    if (activeTab !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === activeTab);
    }
    
    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.subject.toLowerCase().includes(query) || 
        ticket.message.toLowerCase().includes(query) ||
        (ticket.user && ticket.user.name && ticket.user.name.toLowerCase().includes(query))
      );
    }
    
    // Filtres avancés
    if (filters.priority) {
      filtered = filtered.filter(ticket => ticket.priority === filters.priority);
    }
    
    if (filters.category) {
      filtered = filtered.filter(ticket => ticket.category === filters.category);
    }
    
    if (filters.assignedTo) {
      if (filters.assignedTo === 'unassigned') {
        filtered = filtered.filter(ticket => !ticket.admin);
      } else {
        filtered = filtered.filter(ticket => ticket.admin && ticket.admin._id === filters.assignedTo);
      }
    }
    
    setFilteredTickets(filtered);
  }, [activeTab, searchQuery, filters, tickets]);

  // Gérer les changements de filtres
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fonction pour changer d'onglet - Correction
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      priority: '',
      category: '',
      assignedTo: '',
      dateRange: ''
    });
    setSearchQuery('');
    setActiveTab('all');
  };

  // Répondre à un ticket
  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    
    try {
      await addReplyToTicket(selectedTicket._id, replyContent);
    } catch (error) {
      // L'erreur est déjà gérée dans addReplyToTicket
    }
  };

  // Changer le statut d'un ticket
  const handleStatusChange = async (ticketId, status) => {
    try {
      await updateTicketStatus(ticketId, status);
    } catch (error) {
      // L'erreur est déjà gérée dans updateTicketStatus
    }
  };

  // Assigner un ticket
  const handleAssignTicket = async (ticketId, adminId) => {
    try {
      await assignTicket(ticketId, adminId);
    } catch (error) {
      // L'erreur est déjà gérée dans assignTicket
    }
  };

const handleDeleteTicket = async (id) => {
  const ticketToDelete = tickets.find(t => t._id === id);
  
  showDeleteConfirmation(`le ticket "${ticketToDelete?.subject}"`, async () => {
    try {
      const loadingAlert = showLoadingAlert('Suppression en cours...');
      await deleteTicket(id);
      loadingAlert.close();
      showSuccessAlert('Supprimé!', 'Le ticket a été supprimé avec succès');
    } catch (error) {
      showErrorAlert('Erreur', 'Impossible de supprimer le ticket. Veuillez réessayer.');
    }
  });
};

  // Gérer la sélection d'un ticket et charger ses détails
  const handleTicketSelect = async (ticket) => {
    if (selectedTicket && selectedTicket._id === ticket._id) return;
    
    setSelectedTicket(ticket);
    // Charger les détails complets du ticket (avec les réponses)
    await fetchTicketDetails(ticket._id);
  };

  // Actualiser les tickets
  const handleRefresh = () => {
    fetchTickets();
    fetchTicketStats();
  };

  // Formater la date
  const formatDate = (date) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtenir l'icône de statut
  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <MailOpen size={16} className="text-red-500" />;
      case 'pending': return <MailWarning size={16} className="text-yellow-500" />;
      case 'resolved': return <MailCheck size={16} className="text-green-500" />;
      case 'closed': return <Archive size={16} className="text-gray-500" />;
      default: return <Mail size={16} />;
    }
  };

  // Obtenir le statut en français
  const getStatusLabel = (status) => {
    const statusLabels = {
      'open': 'Ouvert',
      'pending': 'En attente',
      'resolved': 'Résolu',
      'closed': 'Fermé'
    };
    return statusLabels[status] || status;
  };

  // Statistiques sous forme de cartes
  const statCards = [
    {
      title: 'Total Tickets',
      value: stats.total || 0,
      icon: <ClipboardList size={20} />,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Ouverts',
      value: stats.open || 0,
      icon: <MailOpen size={20} />,
      color: 'bg-red-100 text-red-600'
    },
    {
      title: 'En attente',
      value: stats.pending || 0,
      icon: <MailWarning size={20} />,
      color: 'bg-yellow-100 text-yellow-600'
    },
    {
      title: 'Résolus',
      value: stats.resolved || 0,
      icon: <MailCheck size={20} />,
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'Non assignés',
      value: stats.unassigned || 0,
      icon: <UserCog size={20} />,
      color: 'bg-purple-100 text-purple-600'
    }
  ];

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      {/* Affichage des erreurs */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 p-4 bg-red-100 border border-red-200 rounded-lg flex items-center justify-between"
          >
            <div className="flex items-center">
              <AlertCircle className="text-red-600 mr-2" size={20} />
              <span className="text-red-800">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* En-tête et statistiques */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center mb-4 md:mb-0">
            <Mail className="text-blue-600 mr-3" size={24} />
            <h2 className="text-2xl font-bold text-gray-800">Centre d'assistance (Admin)</h2>
          </div>
          
          <div className="flex space-x-3">
            <motion.button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <RefreshCw size={18} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </motion.button>
          </div>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${stat.color} p-4 rounded-xl shadow-sm flex items-center`}
            >
              <div className="p-2 rounded-full bg-white bg-opacity-30 mr-3">
                {stat.icon}
              </div>
              <div>
                <p className="text-sm font-medium">{stat.title}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="mb-6">
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-gray-400" size={18} />
          </div>
          <input
            type="text"
            placeholder="Rechercher des tickets..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex overflow-x-auto pb-2">
            <button
              onClick={() => handleTabChange('all')}
              className={`px-4 py-2 mr-2 rounded-lg whitespace-nowrap flex items-center ${activeTab === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700'}`}
            >
              <Mail size={16} className="mr-2" />
              Tous les tickets
            </button>
            
            <button
              onClick={() => handleTabChange('open')}
              className={`px-4 py-2 mr-2 rounded-lg whitespace-nowrap flex items-center ${activeTab === 'open' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700'}`}
            >
              <MailOpen size={16} className="mr-2" />
              Ouverts
            </button>
            
            <button
              onClick={() => handleTabChange('pending')}
              className={`px-4 py-2 mr-2 rounded-lg whitespace-nowrap flex items-center ${activeTab === 'pending' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700'}`}
            >
              <MailWarning size={16} className="mr-2" />
              En attente
            </button>
            
            <button
              onClick={() => handleTabChange('resolved')}
              className={`px-4 py-2 mr-2 rounded-lg whitespace-nowrap flex items-center ${activeTab === 'resolved' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700'}`}
            >
              <MailCheck size={16} className="mr-2" />
              Résolus
            </button>
            
            <button
              onClick={() => handleTabChange('closed')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap flex items-center ${activeTab === 'closed' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700'}`}
            >
              <Archive size={16} className="mr-2" />
              Fermés
            </button>
          </div>
          
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-lg flex items-center ${showFilters ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700'}`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Filter size={16} className="mr-2" />
            Filtres avancés
          </motion.button>
          
          {Object.values(filters).some(Boolean) && (
            <motion.button
              onClick={resetFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Réinitialiser
            </motion.button>
          )}
        </div>
        
        {/* Filtres avancés */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                  <select
                    value={filters.priority}
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Toutes les priorités</option>
                    {priorities.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Toutes les catégories</option>
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigné à</label>
                  <select
                    value={filters.assignedTo}
                    onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Tous les tickets</option>
                    <option value="unassigned">Non assignés</option>
                    {users.filter(u => u.role === 'admin').map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des tickets */}
        <div className={`lg:col-span-${selectedTicket ? '1' : '3'} bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden`}>
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Archive className="mx-auto mb-3" size={32} />
              <p>Aucun ticket trouvé</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredTickets.map((ticket) => (
                <motion.li
                  key={ticket._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${selectedTicket?._id === ticket._id ? 'bg-blue-50' : ''}`}
                  onClick={() => handleTicketSelect(ticket)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-1">
                        <div className="mr-2">
                          {getStatusIcon(ticket.status)}
                        </div>
                        <h3 className="text-md font-medium text-gray-900 truncate">
                          {ticket.subject}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {ticket.user?.name || 'Utilisateur inconnu'} - {ticket.message}
                      </p>
                      <div className="flex items-center mt-2 space-x-3">
                        <span className="inline-flex items-center text-xs text-gray-500">
                          {categories.find(c => c.value === ticket.category)?.icon}
                          <span className="ml-1">
                            {categories.find(c => c.value === ticket.category)?.label}
                          </span>
                        </span>
                        <span className="inline-flex items-center text-xs text-gray-500">
                          {priorities.find(p => p.value === ticket.priority)?.icon}
                          <span className="ml-1">
                            {priorities.find(p => p.value === ticket.priority)?.label}
                          </span>
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(ticket.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                    {ticket.admin && ticket.admin.name && (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
    {ticket.admin.name.split(' ')[0]}
  </span>
)}
                      {!ticket.admin && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Non assigné
                        </span>
                      )}
                      <ChevronRight className="ml-2 text-gray-400" size={18} />
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </div>

        {/* Détails du ticket sélectionné */}
        {selectedTicket && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center mb-2">
                      <div className="mr-2">
                        {getStatusIcon(selectedTicket.status)}
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedTicket.subject}</h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center">
                        <User size={14} className="mr-1" />
                        {selectedTicket.user?.name || 'Utilisateur inconnu'}
                      </span>
                      <span className="flex items-center">
                        {categories.find(c => c.value === selectedTicket.category)?.icon}
                        <span className="ml-1">
                          {categories.find(c => c.value === selectedTicket.category)?.label}
                        </span>
                      </span>
                      <span className="flex items-center">
                        {priorities.find(p => p.value === selectedTicket.priority)?.icon}
                        <span className="ml-1">
                          {priorities.find(p => p.value === selectedTicket.priority)?.label}
                        </span>
                      </span>
                      <span>Créé le {formatDate(selectedTicket.createdAt)}</span>
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                        {getStatusLabel(selectedTicket.status)}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDeleteTicket(selectedTicket._id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      title="Supprimer le ticket"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Actions d'administration */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="relative">
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleStatusChange(selectedTicket._id, e.target.value)}
                      className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="open">Marquer comme ouvert</option>
                      <option value="pending">Marquer comme en attente</option>
                      <option value="resolved">Marquer comme résolu</option>
                      <option value="closed">Marquer comme fermé</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <ChevronDown size={16} className="text-gray-400" />
                    </div>
                  </div>
                  
                  <div className="relative">
                    <select
                      value={selectedTicket.admin?._id || ''}
                      onChange={(e) => handleAssignTicket(selectedTicket._id, e.target.value)}
                      className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="">Assigner à...</option>
                      {users.filter(u => u.role === 'admin').map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name}
                        </option>
                      ))}
                      <option value="">Désassigner</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <ChevronDown size={16} className="text-gray-400" />
                    </div>
                  </div>
                </div>

<div className="space-y-4 p-4">
  {/* Message original */}
  <div className="flex justify-start">
    <div className="max-w-[80%]">
      <div className="flex items-center mb-1">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
          <User className="text-blue-600" size={16} />
        </div>
        <div className="text-xs text-gray-500">
          {selectedTicket.user?.name || 'Utilisateur inconnu'} • {formatDate(selectedTicket.createdAt)}
        </div>
      </div>
      <div className="relative bg-blue-100 p-3 rounded-lg rounded-tl-none">
        <div className="absolute -left-1 top-0 w-3 h-3 bg-blue-100 transform -skew-x-12" />
        <p className="whitespace-pre-line">{selectedTicket.message}</p>
        {selectedTicket.attachments?.length > 0 && (
          <div className="mt-2 space-y-2">
            {selectedTicket.attachments.map((attachment, idx) => (
              <AttachmentPreview key={idx} attachment={attachment} />
            ))}
          </div>
        )}
      </div>
    </div>
  </div>

  {/* Réponses */}
  {selectedTicket.replies
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((reply, index) => (
      <div key={index} className={`flex ${reply.isAdmin ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[80%] ${reply.isAdmin ? 'ml-auto' : 'mr-auto'}`}>
          <div className={`flex ${reply.isAdmin ? 'flex-row-reverse' : ''} items-center mb-1`}>
            <div className={`w-8 h-8 rounded-full ${reply.isAdmin ? 'bg-purple-100' : 'bg-blue-100'} flex items-center justify-center mx-2`}>
              {reply.isAdmin ? <UserCog size={16} /> : <User size={16} />}
            </div>
            <div className={`text-xs text-gray-500 ${reply.isAdmin ? 'text-right' : ''}`}>
              {reply.isAdmin ? 'Support' : reply.user?.name} • {formatDate(reply.createdAt)}
            </div>
          </div>
          <div className={`relative p-3 rounded-lg ${reply.isAdmin ? 'bg-purple-100 rounded-tr-none' : 'bg-blue-100 rounded-tl-none'}`}>
            {reply.isAdmin ? (
              <div className="absolute -right-1 top-0 w-3 h-3 bg-purple-100 transform skew-x-12" />
            ) : (
              <div className="absolute -left-1 top-0 w-3 h-3 bg-blue-100 transform -skew-x-12" />
            )}
            <p className="whitespace-pre-line">{reply.content}</p>
            {reply.attachments?.length > 0 && (
              <div className="mt-2 space-y-2">
                {reply.attachments.map((attachment, idx) => (
                  <AttachmentPreview key={idx} attachment={attachment} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    ))}
</div>
            {/* Formulaire de réponse */}
            <form onSubmit={handleReplySubmit}>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Réponse du support</label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Écrivez votre réponse ici..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end">
                <motion.button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSubmittingReply}
                >
                  {isSubmittingReply ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send size={16} className="mr-2" />
                      Envoyer la réponse
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </AnimatePresence>
    )}
  </div>
</div>
);
};

export default AdminTickets;