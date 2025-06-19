import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Trash2, 
  Mail, 
  MessageSquare, 
  XCircle,
  Plus,
  Eye,
  User,
  Shield
} from 'lucide-react';

const NotificationBell = ({ 
  notifications, 
  setNotifications, 
  unreadCount, 
  setUnreadCount,
  onTicketClick,
  socket
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    if (socket) {
      // Écouter les nouveaux tickets
      socket.on('newTicket', (data) => {
        const notification = {
          id: Date.now() + Math.random(),
          type: 'newTicket',
          message: `Nouveau ticket créé`,
          details: `"${data.subject}" par ${data.user.name}`,
          timestamp: new Date().toISOString(),
          ticketId: data._id,
          read: false,
          priority: 'high'
        };
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      // Écouter les réponses aux tickets
// Écouter les réponses aux tickets
socket.on('ticketReply', (data) => {
  // Ne créer une notification que si la réponse n'est pas d'un admin
  if (!data.reply.isAdmin) {
    const notification = {
      id: Date.now() + Math.random(),
      type: 'ticketReply',
      message: 'Nouvelle réponse client',
      details: `"${data.ticketSubject}" par ${data.reply.user.name}`,
      timestamp: new Date().toISOString(),
      ticketId: data.ticketId,
      read: false,
      priority: 'medium'
    };
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  }
});
      // Écouter les fermetures de tickets
      socket.on('ticketClosed', (data) => {
        const notification = {
          id: Date.now() + Math.random(),
          type: 'ticketClosed',
          message: 'Ticket fermé',
          details: `"${data.ticketSubject}" fermé par ${data.closedBy.name}`,
          timestamp: new Date().toISOString(),
          ticketId: data.ticketId,
          read: false,
          priority: 'medium'
        };
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      // Écouter les suppressions de tickets
      socket.on('ticketDeleted', (data) => {
        const notification = {
          id: Date.now() + Math.random(),
          type: 'ticketDeleted',
          message: 'Ticket supprimé',
          details: `"${data.ticketSubject}" supprimé par ${data.deletedBy.name}`,
          timestamp: new Date().toISOString(),
          ticketId: data.ticketId,
          read: false,
          priority: 'low'
        };
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      return () => {
        socket.off('newTicket');
        socket.off('ticketReply');
        socket.off('ticketClosed');
        socket.off('ticketDeleted');
      };
    }
  }, [socket, setNotifications, setUnreadCount]);

  const getNotificationIcon = (type, isAdmin) => {
    switch(type) {
      case 'newTicket':
        return <Plus size={16} className="text-green-600" />;
      case 'ticketReply':
        return isAdmin ? 
          <Shield size={16} className="text-purple-600" /> : 
          <MessageSquare size={16} className="text-blue-600" />;
      case 'ticketClosed':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'ticketDeleted':
        return <Trash2 size={16} className="text-red-600" />;
      case 'ticket':
        return <Mail size={16} className="text-blue-600" />;
      case 'cleanup':
        return <Trash2 size={16} className="text-green-600" />;
      case 'error':
        return <AlertTriangle size={16} className="text-red-600" />;
      default:
        return <Bell size={16} className="text-gray-600" />;
    }
  };

  const getNotificationColor = (type, priority) => {
    if (priority === 'high') return 'bg-red-50 border-l-4 border-red-400';
    if (priority === 'medium') return 'bg-yellow-50 border-l-4 border-yellow-400';
    if (priority === 'low') return 'bg-green-50 border-l-4 border-green-400';
    
    switch(type) {
      case 'newTicket':
        return 'bg-green-50 border-l-4 border-green-400';
      case 'ticketReply':
        return 'bg-blue-50 border-l-4 border-blue-400';
      case 'ticketClosed':
        return 'bg-gray-50 border-l-4 border-gray-400';
      case 'ticketDeleted':
        return 'bg-red-50 border-l-4 border-red-400';
      default:
        return 'bg-gray-50';
    }
  };

  const handleNotificationClick = (notification) => {
    // Marquer comme lu
    setNotifications(prev => 
      prev.map(n => 
        n.id === notification.id ? { ...n, read: true } : n
      )
    );

    // Naviguer vers le ticket si possible
    if ((notification.type === 'ticket' || 
         notification.type === 'newTicket' || 
         notification.type === 'ticketReply') && 
        onTicketClick && 
        notification.ticketId) {
      onTicketClick(notification.ticketId);
    }
    
    setIsNotificationsOpen(false);
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notifTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    return notifTime.toLocaleDateString();
  };

  return (
    <div className="relative">
      <motion.button
        onClick={() => {
          setIsNotificationsOpen(!isNotificationsOpen);
          if (!isNotificationsOpen) {
            setUnreadCount(0);
          }
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="p-2 rounded-full hover:bg-gray-100 relative transition-colors duration-200"
      >
        <Bell size={20} className="text-gray-700" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isNotificationsOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl z-50 border border-gray-200 overflow-hidden"
          >
            <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg">Notifications</h3>
                <p className="text-blue-100 text-sm">
                  {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est à jour'}
                </p>
              </div>
              <button 
                onClick={() => setIsNotificationsOpen(false)}
                className="hover:bg-blue-400 p-1 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Aucune notification</p>
                  <p className="text-sm">Vous êtes à jour !</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notification.read ? getNotificationColor(notification.type, notification.priority) : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-full ${
                          notification.isAdmin ? 'bg-purple-100' : 'bg-blue-100'
                        }`}>
                          {getNotificationIcon(notification.type, notification.isAdmin)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notification.message}
                            </p>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.details}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center text-xs text-gray-400">
                              <Clock size={12} className="mr-1" />
                              {formatTime(notification.timestamp)}
                            </div>
                            {(notification.type === 'newTicket' || 
                              notification.type === 'ticketReply') && (
                              <button 
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNotificationClick(notification);
                                }}
                              >
                                <Eye size={12} className="inline mr-1" />
                                Voir
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-between">
                <button 
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Marquer tout comme lu
                </button>
                <button 
                  onClick={clearAllNotifications}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Tout effacer
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;