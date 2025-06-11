import React from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Globe, User, Clock } from 'lucide-react';

const DashboardList = ({ dashboards, selectedDashboard, onSelect }) => {
  return (
    <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
      {dashboards.map((dashboard) => {
        // Pour les dashboards publics, les données sont directement sur l'objet
        // Pour les dashboards personnels, elles peuvent être dans dashboard.data
        const dashboardData = dashboard.data || dashboard;
        
        return (
          <motion.div
            key={dashboard._id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-3 rounded-lg cursor-pointer transition-all ${
              selectedDashboard?._id === dashboard._id 
                ? 'bg-blue-100 border border-blue-300' 
                : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
            }`}
            onClick={() => onSelect(dashboard)}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-md ${
                selectedDashboard?._id === dashboard._id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                <BarChart2 size={18} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800 flex items-center gap-2 flex-wrap">
                  {dashboardData.name}
                  
                  {/* Badge pour le type d'accès */}
                  {dashboard.accessType === 'public' ? (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Globe size={10} />
                      Public
                    </span>
                  ) : (
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <User size={10} />
                      Personnel
                    </span>
                  )}
                  
                  {/* Badge pour le statut actif/inactif */}
                  {!dashboardData.active && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                      Inactif
                    </span>
                  )}
                  
                  {/* Badge d'expiration pour les dashboards personnels */}
                  {dashboard.accessType === 'assigned' && dashboard.expiresAt && (
                    <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      new Date(dashboard.expiresAt) < new Date() 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      <Clock size={10} />
                      {new Date(dashboard.expiresAt) < new Date() ? 'Expiré' : 'Expire bientôt'}
                    </span>
                  )}
                </h3>
                
                {dashboardData.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">{dashboardData.description}</p>
                )}
                
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-400">
                    {dashboard.accessType === 'public' ? 'Public depuis le' : 'Créé le'} {new Date(dashboardData.createdAt).toLocaleDateString()}
                  </p>
                  
                  {/* Afficher la date d'expiration si elle existe */}
                  {dashboard.accessType === 'assigned' && dashboard.expiresAt && (
                    <p className="text-xs text-gray-400">
                      Expire le {new Date(dashboard.expiresAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default DashboardList;