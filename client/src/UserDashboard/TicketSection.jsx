import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Send, AlertCircle, CheckCircle, X, Loader2,
  Paperclip, MessageSquare, User, Tag, ChevronDown,
  Trash2, Edit, ChevronRight, Plus, Search, RefreshCw,
  Archive, ShieldAlert, CircleHelp, CreditCard, UserCog,
  Download, FileText, Image, FileSpreadsheet
} from 'lucide-react';
import { io } from 'socket.io-client';

const TicketSection = () => {
  // États pour la gestion des tickets
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // États pour le formulaire de ticket
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'medium',
    category: 'technical',
    attachments: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyAttachments, setReplyAttachments] = useState([]);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
const participantColors = {
  user: {
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    text: 'text-blue-800',
    icon: 'text-blue-600',
    bubble: 'rounded-tl-none'
  },
  admin: {
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    text: 'text-purple-800',
    icon: 'text-purple-600',
    bubble: 'rounded-tr-none'
  },
  system: {
    bg: 'bg-gray-50',
    border: 'border-gray-100',
    text: 'text-gray-800',
    icon: 'text-gray-600',
    bubble: 'rounded-t-none'
  }
};
  // Configuration API
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Fonction pour obtenir le token d'authentification
  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };
// Fonction pour obtenir l'URL complète d'une pièce jointe
const getAttachmentUrl = (path) => {
  if (!path) return '';
  // Supprimer les backslashes et les remplacer par des slashes
  const normalizedPath = path.replace(/\\/g, '/');
  return `${API_URL}/${normalizedPath}`;
};
  // Configuration des headers pour les requêtes API
  const getAuthHeaders = (isFormData = false) => {
    const token = getAuthToken();
    const headers = {};
    
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
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
    { value: 'feature', label: 'Fonctionnalité', icon: <Plus size={14} /> },
    { value: 'other', label: 'Autre', icon: <Archive size={14} /> }
  ];

  // Fonction pour obtenir l'icône selon le type de fichier
  const getFileIcon = (mimetype) => {
    if (mimetype?.startsWith('image/')) return <Image size={16} className="text-blue-500" />;
    if (mimetype?.includes('pdf')) return <FileText size={16} className="text-red-500" />;
    if (mimetype?.includes('excel') || mimetype?.includes('spreadsheet')) return <FileSpreadsheet size={16} className="text-green-500" />;
    return <FileText size={16} className="text-gray-500" />;
  };

  // Fonction pour formater la taille du fichier
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Récupérer tous les tickets
  const fetchTickets = async (status = null) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const queryParams = status && status !== 'all' ? `?status=${status}` : '';
      const response = await fetch(`${API_URL}/api/tickets${queryParams}`, {
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

  // Récupérer un ticket spécifique avec ses détails
  const fetchTicketDetails = async (ticketId) => {
    try {
      const response = await fetch(`${API_URL}/api/tickets/${ticketId}`, {
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

  // Créer un nouveau ticket avec FormData pour les fichiers
  const createTicket = async (ticketData) => {
    try {
      setIsSubmitting(true);
      
      const formData = new FormData();
      formData.append('subject', ticketData.subject);
      formData.append('message', ticketData.message);
      formData.append('priority', ticketData.priority);
      formData.append('category', ticketData.category);
      
      // Ajouter les fichiers
      ticketData.attachments.forEach((file) => {
        formData.append('attachments', file);
      });

      const response = await fetch(`${API_URL}/api/tickets`, {
        method: 'POST',
        headers: getAuthHeaders(true),
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const newTicket = await response.json();
      setTickets(prev => [newTicket, ...prev]);
      setFilteredTickets(prev => [newTicket, ...prev]);
      setSubmitSuccess(true);
      
      // Réinitialiser le formulaire
      setFormData({
        subject: '',
        message: '',
        priority: 'medium',
        category: 'technical',
        attachments: []
      });
      setShowTicketForm(false);
      
      return newTicket;
    } catch (error) {
      console.error('Erreur lors de la création du ticket:', error);
      setError('Impossible de créer le ticket. Veuillez réessayer.');
      throw error;
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitSuccess(false), 3000);
    }
  };

  // Ajouter une réponse à un ticket avec FormData pour les fichiers
  const addReplyToTicket = async (ticketId, content, attachments = []) => {
    try {
      setIsSubmittingReply(true);
      
      const formData = new FormData();
      formData.append('content', content);
      
      // Ajouter les fichiers
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });

      const response = await fetch(`${API_URL}/api/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: getAuthHeaders(true),
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const updatedTicket = await response.json();
      
      // Mettre à jour le ticket dans la liste
      setTickets(prev => 
        prev.map(ticket => 
          ticket._id === ticketId ? updatedTicket : ticket
        )
      );
      
      // Mettre à jour le ticket sélectionné
      setSelectedTicket(updatedTicket);
      setReplyContent('');
      setReplyAttachments([]);
      
      return updatedTicket;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la réponse:', error);
      setError('Impossible d\'ajouter la réponse. Veuillez réessayer.');
      throw error;
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Télécharger un fichier joint
  const downloadAttachment = async (ticketId, attachmentId, filename) => {
    try {
      const response = await fetch(`${API_URL}/api/tickets/${ticketId}/attachment/${attachmentId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      setError('Impossible de télécharger le fichier.');
    }
  };

  // Fermer un ticket
  const closeTicket = async (ticketId) => {
    try {
      const response = await fetch(`${API_URL}/api/tickets/${ticketId}/close`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
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
      
      return updatedTicket;
    } catch (error) {
      console.error('Erreur lors de la fermeture du ticket:', error);
      setError('Impossible de fermer le ticket. Veuillez réessayer.');
      throw error;
    }
  };
useEffect(() => {
  // Initialiser la connexion WebSocket
  const socket = io(API_URL, {
    withCredentials: true,
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  // Gestion des événements
  socket.on('connect', () => {
    console.log('Connecté au serveur WebSocket');
  });

  socket.on('disconnect', () => {
    console.log('Déconnecté du serveur WebSocket');
  });

  socket.on('ticketReply', (data) => {
    console.log('Nouvelle réponse reçue:', data);
    
    // Mettre à jour le ticket sélectionné
    if (selectedTicket && data.ticketId === selectedTicket._id) {
      setSelectedTicket(prev => ({
        ...prev,
        replies: [...prev.replies, {
          _id: data.reply._id,
          content: data.reply.content,
          createdAt: new Date(data.reply.createdAt),
          isAdmin: data.reply.isAdmin,
          user: data.reply.user,
          attachments: data.reply.attachments || []
        }],
        status: 'pending'
      }));
    }

    // Mettre à jour la liste des tickets
    setTickets(prev => 
      prev.map(ticket => 
        ticket._id === data.ticketId ? {
          ...ticket,
          replies: [...ticket.replies, {
            _id: data.reply._id,
            content: data.reply.content,
            createdAt: new Date(data.reply.createdAt),
            isAdmin: data.reply.isAdmin,
            user: data.reply.user,
            attachments: data.reply.attachments || []
          }],
          lastActivity: new Date(),
          status: 'pending'
        } : ticket
      )
    );
  });

  socket.on('ticketClosed', (data) => {
    if (selectedTicket && data.ticketId === selectedTicket._id) {
      setSelectedTicket(prev => ({
        ...prev,
        status: 'closed'
      }));
    }

    setTickets(prev => 
      prev.map(ticket => 
        ticket._id === data.ticketId ? {
          ...ticket,
          status: 'closed'
        } : ticket
      )
    );
  });

  // Nettoyage
  return () => {
    socket.off('ticketReply');
    socket.off('ticketClosed');
    socket.off('connect');
    socket.off('disconnect');
    socket.disconnect();
  };
}, [selectedTicket, API_URL]);
  // Charger les tickets au montage du composant
  useEffect(() => {
    fetchTickets();
  }, []);

  // Filtrer les tickets en fonction de l'onglet actif et de la recherche
 // Filtrer les tickets en fonction de l'onglet actif et de la recherche
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
      (ticket.replies && ticket.replies.some(reply => 
        reply.content.toLowerCase().includes(query)
      ))
    );
  }
  
  setFilteredTickets(filtered);
}, [activeTab, searchQuery, tickets]);

  // Gestion des changements de formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files].slice(0, 3) // Limite à 3 fichiers
    }));
  };

  const handleReplyFileChange = (e) => {
    const files = Array.from(e.target.files);
    setReplyAttachments(prev => [...prev, ...files].slice(0, 3)); // Limite à 3 fichiers
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const removeReplyAttachment = (index) => {
    setReplyAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Soumission d'un nouveau ticket
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createTicket(formData);
    } catch (error) {
      // L'erreur est déjà gérée dans createTicket
    }
  };

  // Répondre à un ticket
  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    
    try {
      await addReplyToTicket(selectedTicket._id, replyContent, replyAttachments);
    } catch (error) {
      // L'erreur est déjà gérée dans addReplyToTicket
    }
  };

  // Gérer la sélection d'un ticket et charger ses détails
  const handleTicketSelect = async (ticket) => {
    if (selectedTicket && selectedTicket._id === ticket._id) return;
    
    setSelectedTicket(ticket);
    await fetchTicketDetails(ticket._id);
  };

  // Fermer un ticket
  const handleCloseTicket = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir fermer ce ticket ?')) {
      try {
        await closeTicket(id);
      } catch (error) {
        // L'erreur est déjà gérée dans closeTicket
      }
    }
  };

  // Actualiser les tickets
  const handleRefresh = () => {
    fetchTickets(activeTab === 'all' ? null : activeTab);
  };

  // Changer d'onglet et filtrer
  const handleTabChange = (tab) => {
    setActiveTab(tab);
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

  // Obtenir l'icône de catégorie
  const getCategoryIcon = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.icon : <Archive size={14} />;
  };

  // Obtenir le statut en français
  const getStatusLabel = (status) => {
    const statusLabels = {
      'open': 'Ouvert',
      'pending': 'En attente',
      'closed': 'Fermé'
    };
    return statusLabels[status] || status;
  };

  // Composant pour afficher les fichiers joints
const AttachmentsList = ({ attachments, ticketId }) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <h5 className="text-sm font-medium text-gray-700 flex items-center">
        <Paperclip size={14} className="mr-1" />
        Fichiers joints ({attachments.length})
      </h5>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {attachments.map((attachment, index) => (
          <div 
            key={attachment._id || index} 
            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            {/* Afficher l'image directement si c'est une image */}
            {attachment.mimetype?.startsWith('image/') ? (
              <div className="w-full">
                <img 
                  src={getAttachmentUrl(attachment.path)} 
                  alt={attachment.originalName} 
                  className="max-w-full h-auto max-h-40 rounded-md object-contain"
                />
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-xs text-gray-500 truncate">
                    {attachment.originalName}
                  </span>
                  <button
                    onClick={() => downloadAttachment(
                      ticketId, 
                      attachment._id, 
                      attachment.originalName
                    )}
                    className="ml-2 p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                    title="Télécharger"
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center min-w-0 flex-1">
                  {getFileIcon(attachment.mimetype)}
                  <div className="ml-2 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attachment.originalName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(attachment.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => downloadAttachment(
                    ticketId, 
                    attachment._id, 
                    attachment.originalName
                  )}
                  className="ml-2 p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                  title="Télécharger"
                >
                  <Download size={16} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
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

      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <Mail className="text-blue-600 mr-3" size={24} />
          <h2 className="text-2xl font-bold text-gray-800">Centre d'assistance</h2>
        </div>
        
        <div className="flex space-x-3">
          <motion.button
            onClick={() => setShowTicketForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Plus size={18} className="mr-2" />
            Nouveau ticket
          </motion.button>
          
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
            <AlertCircle size={16} className="mr-2" />
            Ouverts
          </button>
          
          <button
            onClick={() => handleTabChange('pending')}
            className={`px-4 py-2 mr-2 rounded-lg whitespace-nowrap flex items-center ${activeTab === 'pending' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700'}`}
          >
            <Loader2 size={16} className="mr-2" />
            En attente
          </button>
          
          <button
            onClick={() => handleTabChange('closed')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap flex items-center ${activeTab === 'closed' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700'}`}
          >
            <CheckCircle size={16} className="mr-2" />
            Fermés
          </button>
        </div>
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
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          ticket.status === 'open' ? 'bg-red-500' :
                          ticket.status === 'pending' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`} />
                        <h3 className="text-md font-medium text-gray-900 truncate">
                          {ticket.subject}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{ticket.message}</p>
                      <div className="flex items-center mt-2 space-x-3">
                        <span className="inline-flex items-center text-xs text-gray-500">
                          {getCategoryIcon(ticket.category)}
                          <span className="ml-1">
                            {categories.find(c => c.value === ticket.category)?.label}
                          </span>
                        </span>
                        <span className="inline-flex items-center text-xs text-gray-500">
                          <AlertCircle size={12} className="mr-1" />
                          {priorities.find(p => p.value === ticket.priority)?.label}
                        </span>
                        {ticket.attachments && ticket.attachments.length > 0 && (
                          <span className="inline-flex items-center text-xs text-gray-500">
                            <Paperclip size={12} className="mr-1" />
                            {ticket.attachments.length}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {formatDate(ticket.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                      {ticket.replies && ticket.replies.length > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {ticket.replies.length} réponse{ticket.replies.length > 1 ? 's' : ''}
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
              className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative"
            >
              {/* Boutons d'actions en haut à droite */}
              <div className="absolute top-4 right-4 flex space-x-2 z-10">
                {selectedTicket.status !== 'closed' && (
                  <button
                    onClick={() => handleCloseTicket(selectedTicket._id)}
                    className="p-1 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-full transition-colors"
                    title="Fermer le ticket"
                  >
                    <CheckCircle size={20} />
                  </button>
                )}
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  title="Fermer les détails"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center mb-2">
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        selectedTicket.status === 'open' ? 'bg-red-500' :
                        selectedTicket.status === 'pending' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`} />
                      <h2 className="text-xl font-bold text-gray-900">{selectedTicket.subject}</h2>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        {getCategoryIcon(selectedTicket.category)}
                        <span className="ml-1">
                          {categories.find(c => c.value === selectedTicket.category)?.label}
                        </span>
                      </span>
                      <span className="flex items-center">
                        <AlertCircle size={14} className="mr-1" />
                        {priorities.find(p => p.value === selectedTicket.priority)?.label}
                      </span>
                      <span>Créé le {formatDate(selectedTicket.createdAt)}</span>
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                        {getStatusLabel(selectedTicket.status)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contenu de la conversation */}
                <div className="space-y-6">
                 {/* Message original (toujours à gauche) */}
<div className="flex justify-start">
  <div className={`max-w-[80%] p-4 rounded-lg shadow-sm ${participantColors.user.bg} ${participantColors.user.border} border ${participantColors.user.bubble}`}>
    <div className="flex items-center mb-2">
      <div className={`w-8 h-8 rounded-full ${participantColors.user.bg} flex items-center justify-center mr-3 border ${participantColors.user.border}`}>
        <User className={participantColors.user.icon} size={16} />
      </div>
      <div>
        <h4 className={`font-medium ${participantColors.user.text}`}>Vous</h4>
        <p className="text-xs text-gray-500">{formatDate(selectedTicket.createdAt)}</p>
      </div>
    </div>
    <div className="ml-11">
      <p className="text-gray-800 whitespace-pre-wrap break-words">
        {selectedTicket.message}
      </p>
      <AttachmentsList attachments={selectedTicket.attachments} ticketId={selectedTicket._id} />
    </div>
  </div>
</div>

{/* Réponses */}
{selectedTicket.replies && selectedTicket.replies.length > 0 && (
  <>
    {selectedTicket.replies.map((reply, index) => {
      const isAdmin = reply.isAdmin;
      const colors = isAdmin ? participantColors.admin : participantColors.user;
      
      return (
        <div 
          key={reply._id || index} 
          className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`max-w-[80%] p-4 rounded-lg shadow-sm ${colors.bg} border ${colors.border} ${colors.bubble}`}>
            <div className="flex items-center mb-2">
              {!isAdmin && (
                <div className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center mr-3 border ${colors.border}`}>
                  <User className={colors.icon} size={16} />
                </div>
              )}
              <div>
                <h4 className={`font-medium ${colors.text}`}>
                  {isAdmin ? 'Support Technique' : 'Vous'}
                </h4>
                <p className="text-xs text-gray-500">{formatDate(reply.createdAt)}</p>
              </div>
              {isAdmin && (
                <div className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center ml-3 border ${colors.border}`}>
                  <UserCog className={colors.icon} size={16} />
                </div>
              )}
            </div>
            <div className={isAdmin ? '' : 'ml-11'}>
              <p className="text-gray-800 whitespace-pre-wrap break-words">
                {reply.content}
              </p>
              <AttachmentsList attachments={reply.attachments} ticketId={selectedTicket._id} />
            </div>
          </div>
        </div>
      );
    })}
  </>
)}
                </div>

                {/* Formulaire de réponse */}
                <form onSubmit={handleReplySubmit} className="mt-8">
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Votre réponse</label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Écrivez votre réponse ici..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      required
                    />
                  </div>
                  
                  {/* Section pour les pièces jointes dans la réponse */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <Paperclip size={14} className="mr-1" />
                      Pièces jointes (max 3)
                    </label>
                    <div className="flex items-center space-x-2">
                      <label className="cursor-pointer">
                        <div className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
                          <Paperclip size={16} className="mr-2" />
                          <span>Ajouter un fichier</span>
                        </div>
                        <input
                          type="file"
                          onChange={handleReplyFileChange}
                          className="hidden"
                          multiple
                          disabled={replyAttachments.length >= 3}
                        />
                      </label>
                      <span className="text-sm text-gray-500">
                        {replyAttachments.length}/3 fichiers
                      </span>
                    </div>

                    <AnimatePresence>
                      {replyAttachments.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-2 space-y-2"
                        >
                          {replyAttachments.map((file, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <div className="flex items-center truncate">
                                <Paperclip size={14} className="flex-shrink-0 mr-2 text-gray-500" />
                                <span className="text-sm truncate">{file.name}</span>
                                <span className="text-xs text-gray-500 ml-2">
                                  ({formatFileSize(file.size)})
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeReplyAttachment(index)}
                                className="p-1 rounded-full hover:bg-gray-200"
                              >
                                <X size={14} className="text-gray-500" />
                              </button>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
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

      {/* Modal de création de ticket */}
      <AnimatePresence>
        {showTicketForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <Plus className="mr-2 text-blue-500" />
                    Nouveau Ticket
                  </h3>
                  <button 
                    onClick={() => setShowTicketForm(false)}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>

                <AnimatePresence>
                  {submitSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="mb-6 p-4 bg-green-100 border border-green-200 rounded-lg flex items-center"
                    >
                      <CheckCircle className="text-green-600 mr-2" />
                      <span className="text-green-800">Ticket envoyé avec succès!</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <User size={14} className="mr-1" />
                        Sujet
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Décrivez brièvement votre problème"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <Tag size={14} className="mr-1" />
                          Catégorie
                        </label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {categories.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <AlertCircle size={14} className="mr-1" />
                          Priorité
                        </label>
                        <button
                          type="button"
                          onClick={() => setDropdownOpen(!dropdownOpen)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full ${
                              priorities.find(p => p.value === formData.priority)?.color || 'bg-yellow-500'
                            } mr-2`} />
                            {priorities.find(p => p.value === formData.priority)?.label || 'Moyenne'}
                          </div>
                          <ChevronDown size={16} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                          {dropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg"
                            >
                              {priorities.map((priority) => (
                                <div
                                  key={priority.value}
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, priority: priority.value }));
                                    setDropdownOpen(false);
                                  }}
                                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                                >
                                  <div className={`w-3 h-3 rounded-full ${priority.color} mr-2`} />
                                  {priority.label}
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Message
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={5}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Décrivez votre problème en détail..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <Paperclip size={14} className="mr-1" />
                        Pièces jointes (max 3)
                      </label>
                      <div className="flex items-center space-x-2">
                        <label className="cursor-pointer">
                          <div className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
                            <Paperclip size={16} className="mr-2" />
                            <span>Ajouter un fichier</span>
                          </div>
                          <input
                            type="file"
                            onChange={handleFileChange}
                            className="hidden"
                            multiple
                            disabled={formData.attachments.length >= 3}
                          />
                        </label>
                        <span className="text-sm text-gray-500">
                          {formData.attachments.length}/3 fichiers
                        </span>
                      </div>

                      <AnimatePresence>
                        {formData.attachments.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-2 space-y-2"
                          >
                            {formData.attachments.map((file, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center truncate">
                                  <Paperclip size={14} className="flex-shrink-0 mr-2 text-gray-500" />
                                  <span className="text-sm truncate">{file.name}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeAttachment(index)}
                                  className="p-1 rounded-full hover:bg-gray-200"
                                >
                                  <X size={14} className="text-gray-500" />
                                </button>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="pt-2">
                      <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-3 px-6 rounded-lg flex items-center justify-center ${
                          isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                        } text-white font-medium`}
                        whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                        whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={18} className="animate-spin mr-2" />
                            Envoi en cours...
                          </>
                        ) : (
                          <>
                            <Send size={18} className="mr-2" />
                            Envoyer le ticket
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
  }

export default TicketSection;