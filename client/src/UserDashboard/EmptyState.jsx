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
import DashboardViewer from './DashboardViewer';

// Composant EmptyState avec animations
  const EmptyState = ({ hasDashboards, resetFilters }) => {
    return (
      <motion.div 
        className="flex items-center justify-center h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="text-center p-8"
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <motion.div
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: "easeInOut",
            }}
          >
            <BarChart2 size={64} className="mx-auto text-gray-400 mb-4" />
          </motion.div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {hasDashboards ? 'Sélectionnez un dashboard' : 'Aucun dashboard disponible'}
          </h3>
          <p className="text-gray-500 mb-4">
            {hasDashboards 
              ? 'Choisissez un dashboard dans la sidebar pour le visualiser' 
              : 'Vous n\'avez pas encore de dashboards assignés'
            }
          </p>
          {hasDashboards && (
            <motion.button
              onClick={resetFilters}
              className="text-blue-600 hover:text-blue-800 font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Réinitialiser les filtres
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    );
  };

export default EmptyState;