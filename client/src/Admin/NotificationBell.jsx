import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Clock, AlertTriangle, CheckCircle, X, Trash2 } from 'lucide-react';

const NotificationBell = ({ notifications, setNotifications, unreadCount, setUnreadCount }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <div className="relative">
      <motion.button
        onClick={() => {
          setIsNotificationsOpen(!isNotificationsOpen);
          setUnreadCount(0);
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="p-2 rounded-full hover:bg-gray-200 relative"
      >
        <Bell size={20} className="text-gray-700" />
        {unreadCount > 0 && (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
          >
            {unreadCount}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {isNotificationsOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 25 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-200 overflow-hidden"
          >
            <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white flex justify-between items-center">
              <h3 className="font-semibold">Notifications</h3>
              <button onClick={() => setIsNotificationsOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Aucune notification
                </div>
              ) : (
                <ul>
                  {notifications.map((notification) => (
                    <motion.li
                      key={notification.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`border-b border-gray-100 last:border-0 ${!notification.read ? 'bg-blue-50' : ''}`}
                    >
                      <div className="p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start">
                          <div className={`p-2 rounded-full mr-3 ${
                            notification.type === 'warning' 
                              ? 'bg-yellow-100 text-yellow-600'
                              : notification.type === 'cleanup'
                              ? 'bg-green-100 text-green-600'
                              : notification.type === 'error'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            {notification.type === 'warning' ? (
                              <AlertTriangle size={16} />
                            ) : notification.type === 'cleanup' ? (
                              <Trash2 size={16} />
                            ) : notification.type === 'error' ? (
                              <X size={16} />
                            ) : (
                              <CheckCircle size={16} />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.details}
                            </p>
                            <div className="flex items-center mt-1 text-xs text-gray-400">
                              <Clock size={12} className="mr-1" />
                              {new Date(notification.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="p-2 border-t border-gray-200 text-center">
              <button 
                onClick={() => setNotifications([])}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Effacer toutes les notifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default NotificationBell;
// Note: This component assumes that the notifications prop is an array of notification objects