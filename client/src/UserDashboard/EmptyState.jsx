import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard } from 'lucide-react';

const EmptyState = ({ hasDashboards, resetFilters }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-xl shadow-lg p-8 text-center"
    >
      <div className="mx-auto bg-blue-100 text-blue-600 rounded-full p-6 w-24 h-24 flex items-center justify-center mb-6">
        <LayoutDashboard size={36} />
      </div>
      <h3 className="text-xl font-medium text-gray-900 mb-2">
        {hasDashboards ? "Aucun dashboard sélectionné" : "Aucun tableau de bord disponible"}
      </h3>
      <p className="text-gray-500 mb-6">
        {hasDashboards 
          ? "Sélectionnez un tableau de bord dans la liste pour commencer"
          : "Aucun tableau de bord ne vous a été assigné pour le moment"}
      </p>
      {!hasDashboards && (
        <button
          onClick={resetFilters}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Actualiser la liste
        </button>
      )}
    </motion.div>
  );
};

export default EmptyState;