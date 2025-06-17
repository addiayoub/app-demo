import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  BarChart2,
  Globe,
  AlertCircle
} from 'lucide-react';

const DashboardViewer = ({ dashboard, user, setSelectedDashboard }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    setIsLoading(true);
    setIframeLoaded(false);
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    // Calcul du temps restant avant expiration
    const updateTimeLeft = () => {
      let expirationDate;
      
      // Pour les dashboards assignés directement
      if (dashboard.accessType === 'assigned' && dashboard.expiresAt) {
        expirationDate = new Date(dashboard.expiresAt);
      } 
      // Pour les dashboards inclus dans un abonnement
      else if (dashboard.accessType === 'subscription' && dashboard.subscriptionInfo?.currentPeriodEnd) {
        expirationDate = new Date(dashboard.subscriptionInfo.currentPeriodEnd);
      }
      
      // Si on a une date d'expiration, calculer le temps restant
      if (expirationDate) {
        const now = new Date();
        const diff = expirationDate - now;
        
        if (diff <= 0) {
          setTimeLeft('Expiré');
          return;
        }
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        const remainingHours = hours % 24;
        const remainingMinutes = minutes % 60;
        const remainingSeconds = seconds % 60;
        
        // Formatage avec secondes
        if (days > 0) {
          setTimeLeft(`${days}j ${remainingHours}h ${remainingMinutes}m ${remainingSeconds}s`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${remainingMinutes}m ${remainingSeconds}s`);
        } else if (minutes > 0) {
          setTimeLeft(`${minutes}m ${remainingSeconds}s`);
        } else {
          setTimeLeft(`${seconds}s`);
        }
      }
    };
    
    // Lancer le calcul immédiatement et mettre à jour toutes les secondes
    if (dashboard.accessType === 'assigned' || dashboard.accessType === 'subscription') {
      updateTimeLeft();
      const interval = setInterval(updateTimeLeft, 1000);
      
      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
    
    return () => clearTimeout(timer);
  }, [dashboard]);

  const handleIframeLoad = () => {
    setIframeLoaded(true);
  };

  // Vérifier si le dashboard est expiré
  const isExpired = () => {
    if (dashboard.accessType === 'public') return false;
    
    let expirationDate;
    
    if (dashboard.accessType === 'assigned' && dashboard.expiresAt) {
      expirationDate = new Date(dashboard.expiresAt);
    } 
    else if (dashboard.accessType === 'subscription' && dashboard.subscriptionInfo?.currentPeriodEnd) {
      expirationDate = new Date(dashboard.subscriptionInfo.currentPeriodEnd);
    }
    
    return expirationDate && new Date(expirationDate) < new Date();
  };
  return (
    <motion.div
      key={dashboard._id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden h-full"
    >
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            {dashboard.name}
            
            {/* Badge pour le type d'accès */}
            {dashboard.accessType === 'public' && (
              <motion.span 
                className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full flex items-center gap-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                <Globe size={12} />
                Public
              </motion.span>
            )}
            
            {!dashboard.active && (
              <motion.span 
                className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                Inactif
              </motion.span>
            )}
            
            {/* Badge d'expiration pour les dashboards assignés ou d'abonnement */}
            {(dashboard.accessType === 'assigned' || dashboard.accessType === 'subscription') && (
        <motion.span 
          className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
            isExpired() 
              ? 'bg-red-100 text-red-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, delay: 0.2 }}
        >
          <Clock size={12} />
          {isExpired() ? 'Expiré' : timeLeft}
        </motion.span>
      )}
      
            
            {/* Badge pour les dashboards d'abonnement */}
            {dashboard.accessType === 'subscription' && dashboard.subscriptionInfo && (
              <motion.span 
                className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, delay: 0.3 }}
              >
                {dashboard.subscriptionInfo.planName}
                {dashboard.subscriptionInfo.isTrial && ' (Essai)'}
              </motion.span>
            )}
          </h2>
          {dashboard.description && (
            <p className="text-gray-600 mt-1">{dashboard.description}</p>
          )}
        </motion.div>
        
        <motion.div 
          className="flex gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Boutons d'action */}
        </motion.div>
      </div>
      
      <div className="h-[calc(100vh-200px)] min-h-[500px] relative">
        {!dashboard.active ? (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center bg-gray-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="text-center p-6 max-w-md"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <motion.div 
                className="mx-auto bg-red-100 text-red-600 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4"
                animate={{
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 0.5,
                  ease: "easeInOut",
                }}
              >
                <BarChart2 size={24} />
              </motion.div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Dashboard désactivé</h3>
              <p className="text-gray-500 mb-4">
                Ce tableau de bord a été désactivé par l'administrateur et n'est plus accessible.
              </p>
              <motion.button
                onClick={() => setSelectedDashboard(null)}
                className="text-blue-600 hover:text-blue-800 font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Retour à la liste
              </motion.button>
            </motion.div>
          </motion.div>
        ) : isExpired() ? (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center bg-gray-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="text-center p-6 max-w-md"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <motion.div 
                className="mx-auto bg-yellow-100 text-yellow-600 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4"
                animate={{
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 0.5,
                  ease: "easeInOut",
                }}
              >
                <AlertCircle size={24} />
              </motion.div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Accès expiré</h3>
              <p className="text-gray-500 mb-4">
                Votre accès à ce tableau de bord a expiré {
                  dashboard.accessType === 'assigned' ? 
                    `le ${new Date(dashboard.expiresAt).toLocaleDateString()}` : 
                    `le ${new Date(dashboard.subscriptionInfo.currentPeriodEnd).toLocaleDateString()}`
                }.
                {dashboard.accessType === 'subscription' && ' Veuillez renouveler votre abonnement.'}
              </p>
              <motion.button
                onClick={() => setSelectedDashboard(null)}
                className="text-blue-600 hover:text-blue-800 font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Retour à la liste
              </motion.button>
            </motion.div>
          </motion.div>
        ) : (
          <>
            {(!iframeLoaded || isLoading) && (
              <motion.div 
                className="absolute inset-0 flex items-center justify-center bg-gray-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "linear",
                  }}
                >
                  <BarChart2 size={48} className="text-gray-400" />
                </motion.div>
              </motion.div>
            )}
            
            <motion.div 
              id="dashboard-iframe-container" 
              className="w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: iframeLoaded ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <iframe 
                src={dashboard.url} 
                title={dashboard.name}
                className="w-full h-full border-0"
                loading="lazy"
                onLoad={handleIframeLoad}
              />
            </motion.div>
          </>
        )}
      </div>
      
      <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex flex-col sm:flex-row justify-between items-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {dashboard.accessType === 'public' ? 'Dashboard public' : ''} 
          {dashboard.createdAt && !isNaN(new Date(dashboard.createdAt).getTime()) 
            ? new Date(dashboard.createdAt).toLocaleDateString() 
            : 'Date invalide'}
        </motion.div>
        <div className="p-4 bg-gray-50 flex justify-end">
          <img src="/ID&A TECH .png" alt="Logo" className="w-32 " />
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2"
        >
          {(dashboard.accessType === 'assigned' || dashboard.accessType === 'subscription') && (
            <>
              <Clock size={14} />
              {isExpired() ? 'Expiré le ' : 'Expire le '}
              {dashboard.accessType === 'assigned' 
                ? new Date(dashboard.expiresAt).toLocaleDateString()
                : new Date(dashboard.subscriptionInfo.currentPeriodEnd).toLocaleDateString()}
            </>
          )}
          {dashboard.accessType === 'public' && (
            <>
              <Globe size={14} />
              Accès libre
            </>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DashboardViewer;