import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Search, 
  Filter, 
  BarChart2, 
  ChevronDown, 
  ChevronUp,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  RotateCcw,
  Plus,
  LogOut,
  Download,
  Printer,
  FileText,
  FileSliders,
  FileSignature,
  AlertCircle,
  Info
} from 'lucide-react';
import { useAuth } from '../Auth/AuthContext';
import axios from 'axios';

const DashboardViewer = ({ dashboard, user, setSelectedDashboard }) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  // Récupérer les données correctes du dashboard
  // Pour les dashboards publics, les données sont directement sur l'objet
  // Pour les dashboards personnels, elles peuvent être dans dashboard.data
  const dashboardData = dashboard.data || dashboard;

  console.log('Dashboard in viewer:', dashboard);
  console.log('Dashboard data:', dashboardData);

  useEffect(() => {
    setIsLoading(true);
    setIframeLoaded(false);
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    // Calcul du temps restant avant expiration (seulement pour les dashboards assignés)
    if (dashboard.accessType === 'assigned' && dashboard.expiresAt) {
      const updateTimeLeft = () => {
        const now = new Date();
        const expiresAt = new Date(dashboard.expiresAt);
        const diff = expiresAt - now;
        
        if (diff <= 0) {
          setTimeLeft('Expiré');
          return;
        }
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      };
      
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

  // Les dashboards publics n'expirent pas
  const isExpired = dashboard.accessType === 'assigned' && 
                   dashboard.expiresAt && 
                   new Date(dashboard.expiresAt) < new Date();

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
            {dashboardData.name}
            
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
            
            {!dashboardData.active && (
              <motion.span 
                className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                Inactif
              </motion.span>
            )}
            
            {/* Badge d'expiration seulement pour les dashboards assignés */}
            {dashboard.accessType === 'assigned' && dashboard.expiresAt && (
              <motion.span 
                className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  isExpired 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, delay: 0.2 }}
              >
                <Clock size={12} />
                {isExpired ? 'Expiré' : timeLeft}
              </motion.span>
            )}
          </h2>
          {dashboardData.description && (
            <p className="text-gray-600 mt-1">{dashboardData.description}</p>
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
        {!dashboardData.active ? (
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
        ) : isExpired ? (
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
                Votre accès à ce tableau de bord a expiré le {new Date(dashboard.expiresAt).toLocaleDateString()}.
                Veuillez contacter l'administrateur pour un renouvellement.
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
                src={dashboardData.url} 
                title={dashboardData.name}
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
          {dashboard.accessType === 'public' ? 'Dashboard public' : ''} {dashboardData.createdAt && !isNaN(new Date(dashboardData.createdAt).getTime()) 
            ? new Date(dashboardData.createdAt).toLocaleDateString() 
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
          {dashboard.accessType === 'assigned' && dashboard.expiresAt && (
            <>
              <Clock size={14} />
              {isExpired ? 'Expiré le ' : 'Expire le '}
              {new Date(dashboard.expiresAt).toLocaleDateString()}
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