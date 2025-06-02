import React from 'react';
import { motion } from 'framer-motion';
import { BarChart2 } from 'lucide-react';

const DashboardList = ({ dashboards, selectedDashboard, onSelect }) => {
  return (
    <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
      {dashboards.map((dashboard) => (
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
              <h3 className="font-medium text-gray-800 flex items-center gap-2">
                {dashboard.name}
                {!dashboard.active && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Inactif</span>
                )}
                {dashboard.isPublic && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Public</span>
                )}
              </h3>
              {dashboard.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-1">{dashboard.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Ajouté le {new Date(dashboard.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default DashboardList;