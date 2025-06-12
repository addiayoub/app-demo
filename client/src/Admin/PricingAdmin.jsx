import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Edit, 
  Trash2,
  Save,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaCheck, FaCrown, FaRocket, FaLightbulb, FaGem, FaStar, FaSyncAlt } from 'react-icons/fa';

const PricingAdmin = () => {
  const [plans, setPlans] = useState([]);
  const [dashboards, setDashboards] = useState([]);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    currency: 'MAD',
    billingCycle: 'monthly',
    features: [],
    isActive: true,
    order: 0,
    dashboards: [],
    description: ''
  });
  const [newFeature, setNewFeature] = useState('');
  const [billingCycleView, setBillingCycleView] = useState('monthly');

  useEffect(() => {
    fetchPlans();
    fetchDashboards();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await axios.get('/api/pricing/plans');
      setPlans(res.data.plans);
    } catch (err) {
      toast.error('Erreur lors du chargement des plans');
    }
  };

  const fetchDashboards = async () => {
    try {
      const res = await axios.get('/api/dashboards');
      setDashboards(res.data.data || res.data);
    } catch (err) {
      toast.error('Erreur lors du chargement des dashboards');
    }
  };
const handleEdit = (plan) => {
  setEditingPlan(plan._id);
  setFormData({
    name: plan.name,
    price: plan.price,
    currency: plan.currency,
    billingCycle: plan.billingCycle,
    features: [...plan.features],
    isActive: plan.isActive,
    order: plan.order,
    dashboards: plan.dashboards?.map(db => typeof db === 'object' ? db._id : db) || [],
    description: plan.description || '',
    isRecommended: plan.isRecommended || false,
    isPopular: plan.isPopular || false,
    isBestValue: plan.isBestValue || false
  });
};

  const handleCreateNew = () => {
    setIsCreating(true);
    setEditingPlan('new');
    setFormData({
      name: '',
      price: 0,
      currency: 'MAD',
      billingCycle: 'monthly',
      features: [],
      isActive: true,
      order: plans.length > 0 ? Math.max(...plans.map(p => p.order)) + 1 : 0,
      dashboards: [],
      description: ''
    });
  };

  const handleCancel = () => {
    setEditingPlan(null);
    setIsCreating(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDashboardToggle = (dashboardId) => {
    setFormData(prev => {
      const newDashboards = prev.dashboards.includes(dashboardId)
        ? prev.dashboards.filter(id => id !== dashboardId)
        : [...prev.dashboards, dashboardId];
      return { ...prev, dashboards: newDashboards };
    });
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, { text: newFeature.trim(), available: true }]
      }));
      setNewFeature('');
    }
  };

  const toggleFeatureAvailability = (index) => {
    setFormData(prev => {
      const newFeatures = [...prev.features];
      newFeatures[index].available = !newFeatures[index].available;
      return { ...prev, features: newFeatures };
    });
  };

  const removeFeature = (index) => {
    setFormData(prev => {
      const newFeatures = [...prev.features];
      newFeatures.splice(index, 1);
      return { ...prev, features: newFeatures };
    });
  };

  const handleSubmit = async () => {
    try {
      if (isCreating) {
        await axios.post('/api/pricing/plans', formData);
        toast.success('Plan créé avec succès');
      } else {
        await axios.put(`/api/pricing/plans/${editingPlan}`, formData);
        toast.success('Plan mis à jour avec succès');
      }
      fetchPlans();
      handleCancel();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce plan ?')) {
      try {
        await axios.delete(`/api/pricing/plans/${id}`);
        toast.success('Plan supprimé avec succès');
        fetchPlans();
      } catch (err) {
        toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
      }
    }
  };

  const toggleBillingCycleView = () => {
    setBillingCycleView(prev => prev === 'monthly' ? 'yearly' : 'monthly');
  };

const PlanBadge = ({ plan }) => {
  if (!plan.isRecommended && !plan.isPopular && !plan.isBestValue) return null;

  let text = '';
  let bgClass = '';
  let icon = null;

  if (plan.isRecommended) {
    text = 'Recommandé';
    bgClass = 'from-purple-600 to-blue-600';
    icon = <FaStar className="mr-1" />;
  } else if (plan.isPopular) {
    text = 'Populaire';
    bgClass = 'from-pink-600 to-red-600';
    icon = <FaRocket className="mr-1" />;
  } else if (plan.isBestValue) {
    text = 'Meilleur rapport';
    bgClass = 'from-green-600 to-teal-600';
    icon = <FaGem className="mr-1" />;
  }

  return (
    <motion.div 
      className={`absolute top-4 right-4 bg-gradient-to-r ${bgClass} text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center z-10`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
    >
      {icon}
      <span>{text}</span>
    </motion.div>
  );
};

  const filteredPlans = plans.filter(plan => plan.billingCycle === billingCycleView);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="text-3xl font-bold text-gray-800 flex items-center"
          >
            <CreditCard className="mr-3 text-indigo-600" size={28} />
            Gestion des Plans Tarifaires
          </motion.h2>
          
          <div className="flex items-center space-x-4">
            {/* Billing Cycle Toggle */}
            <motion.div 
              className="flex items-center cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <motion.span 
                className={`mr-2 font-medium ${billingCycleView === 'monthly' ? 'text-blue-600' : 'text-gray-500'}`}
                animate={{ 
                  color: billingCycleView === 'monthly' ? '#2563eb' : '#6b7280',
                  x: billingCycleView === 'monthly' ? 0 : -5
                }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                Mensuel
              </motion.span>
              
              <motion.button
                onClick={toggleBillingCycleView}
                className="relative inline-flex items-center h-8 rounded-full w-14 bg-gradient-to-r from-blue-500 to-purple-500 shadow-md cursor-pointer transition-all duration-300"
                whileTap={{ scale: 0.95 }}
              >
                <motion.span
                  className={`absolute inline-flex items-center justify-center w-6 h-6 bg-white rounded-full shadow-md ${
                    billingCycleView === 'monthly' ? 'left-1' : 'left-7'
                  }`}
                  animate={{
                    left: billingCycleView === 'monthly' ? 4 : 28,
                  }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 700, 
                    damping: 30,
                    duration: 0.3
                  }}
                >
                  <FaSyncAlt 
                    className={`text-xs ${
                      billingCycleView === 'monthly' ? 'text-blue-500' : 'text-purple-500'
                    }`}
                    animate={{
                      rotate: billingCycleView === 'monthly' ? 0 : 180,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.span>
              </motion.button>
              
              <motion.span 
                className={`ml-2 font-medium ${billingCycleView === 'yearly' ? 'text-purple-600' : 'text-gray-500'}`}
                animate={{ 
                  color: billingCycleView === 'yearly' ? '#7c3aed' : '#6b7280',
                  x: billingCycleView === 'yearly' ? 0 : 5
                }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                Annuel
              </motion.span>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)" }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateNew}
              className="flex items-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-3 rounded-xl shadow-md"
            >
              <Plus size={20} className="mr-2" />
              <span className="font-medium">Nouveau Plan</span>
            </motion.button>
          </div>
        </div>

        {editingPlan && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 border border-gray-200"
          >
            <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b">
              <div className="flex justify-between items-center">
                <motion.h3 
                  className="text-2xl font-semibold text-gray-800 flex items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {isCreating ? (
                    <>
                      <Plus className="mr-2 text-green-500" size={24} />
                      Création d'un nouveau plan
                    </>
                  ) : (
                    <>
                      <Edit className="mr-2 text-blue-500" size={24} />
                      Modification du plan
                    </>
                  )}
                </motion.h3>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCancel}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                >
                  <ArrowLeft size={22} />
                </motion.button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom du plan</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    required
                  />
                </motion.div>
<motion.div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
  <label className="flex items-center space-x-2">
    <input
      type="checkbox"
      checked={formData.isRecommended || false}
      onChange={() => setFormData({...formData, isRecommended: !formData.isRecommended})}
      className="rounded text-indigo-600 focus:ring-indigo-500"
    />
    <span>Recommandé</span>
  </label>
  <label className="flex items-center space-x-2">
    <input
      type="checkbox"
      checked={formData.isPopular || false}
      onChange={() => setFormData({...formData, isPopular: !formData.isPopular})}
      className="rounded text-indigo-600 focus:ring-indigo-500"
    />
    <span>Populaire</span>
  </label>
  <label className="flex items-center space-x-2">
    <input
      type="checkbox"
      checked={formData.isBestValue || false}
      onChange={() => setFormData({...formData, isBestValue: !formData.isBestValue})}
      className="rounded text-indigo-600 focus:ring-indigo-500"
    />
    <span>Meilleur rapport</span>
  </label>
</div>
</motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prix</label>
                  <div className="flex rounded-lg overflow-hidden shadow-sm">
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className="flex-1 p-3 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      min="0"
                      step="0.01"
                      required
                    />
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="border-l-0 border border-gray-300 bg-gray-50 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    >
                      <option value="MAD">MAD</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cycle de facturation</label>
                  <select
                    name="billingCycle"
                    value={formData.billingCycle}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  >
                    <option value="monthly">Mensuel</option>
                    <option value="yearly">Annuel</option>
                  </select>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    placeholder="Courte description du plan"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ordre d'affichage</label>
                  <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    min="0"
                    required
                  />
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
              >
                <label className="block text-sm font-medium text-gray-700">Fonctionnalités</label>
                
                <motion.div 
                  className="flex rounded-lg overflow-hidden shadow-sm"
                  whileHover={{ scale: 1.005 }}
                >
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Ajouter une fonctionnalité"
                    className="flex-1 p-3 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                  />
                  <motion.button
                    whileHover={{ backgroundColor: "#4F46E5" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addFeature}
                    className="bg-indigo-500 text-white px-4 flex items-center justify-center"
                  >
                    <Plus size={20} />
                  </motion.button>
                </motion.div>
                
                <div className="space-y-2">
                  {formData.features.map((feature, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => toggleFeatureAvailability(index)}
                          className="mr-3"
                        >
                          {feature.available ? (
                            <CheckCircle size={20} className="text-green-500" />
                          ) : (
                            <XCircle size={20} className="text-red-500" />
                          )}
                        </motion.button>
                        <span className={`font-medium ${!feature.available ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                          {feature.text}
                        </span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeFeature(index)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                      >
                        <Trash2 size={18} />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="space-y-4"
              >
                <label className="block text-sm font-medium text-gray-700">
                  Dashboards inclus ({formData.dashboards.length} sélectionnés)
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {dashboards.map(dashboard => (
  <motion.div
    key={dashboard._id}
    whileHover={{ y: -2 }}
    className={`p-4 rounded-xl border cursor-pointer transition-all ${
      formData.dashboards.includes(dashboard._id) 
        ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-100' 
        : 'bg-white border-gray-200 hover:bg-gray-50'
    }`}
    onClick={() => handleDashboardToggle(dashboard._id)}
  >
    <div className="flex items-center">
      <div className={`w-5 h-5 rounded flex items-center justify-center mr-3 ${
        formData.dashboards.includes(dashboard._id) 
          ? 'bg-indigo-600 text-white' 
          : 'border border-gray-300'
      }`}>
        {formData.dashboards.includes(dashboard._id) && (
          <Check size={14} />
        )}
      </div>
      <div>
        <p className="font-medium text-gray-800">{dashboard.name}</p>
        {!dashboard.active && (
          <p className="text-xs text-red-500 mt-1">Dashboard inactif</p>
        )}
      </div>
    </div>
  </motion.div>
))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex justify-between items-center pt-4 border-t border-gray-200"
              >
                <label className="flex items-center space-x-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className={`w-12 h-6 rounded-full shadow-inner transition-colors ${
                      formData.isActive ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}></div>
                    <div className={`absolute left-1 top-1 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      formData.isActive ? 'translate-x-6 bg-white' : 'bg-gray-100'
                    }`}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {formData.isActive ? 'Plan actif' : 'Plan inactif'}
                  </span>
                </label>
                
                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.03, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCancel}
                    className="flex items-center bg-white text-gray-700 px-5 py-2.5 rounded-lg border border-gray-300 shadow-sm"
                  >
                    Annuler
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.03, boxShadow: "0 4px 12px rgba(74, 222, 128, 0.3)" }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit}
                    className="flex items-center bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-2.5 rounded-lg shadow-md"
                  >
                    <Save size={18} className="mr-2" />
                    {isCreating ? 'Créer le plan' : 'Enregistrer'}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={billingCycleView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {filteredPlans
              .sort((a, b) => a.order - b.order)
              .map((plan, index) => (
                <motion.div
                  key={plan._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: index * 0.15,
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                  }}
                >
                  <motion.div 
                    whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                 className={`relative rounded-2xl overflow-hidden border-2 ${
  plan.isRecommended ? 'border-blue-500 shadow-xl' : 
  plan.isPopular ? 'border-purple-500 shadow-xl' :
  plan.isBestValue ? 'border-green-500 shadow-xl' :
  'border-gray-200'
} bg-white transition-all duration-300 h-full flex flex-col`}
                  >
                    {!plan.isActive && (
                      <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10">
                        Inactif
                      </div>
                    )}

               <PlanBadge 
  plan={plan} 
  // Remplacez ces valeurs par les propriétés réelles de votre plan
  isRecommended={plan.isRecommended} 
  isPopular={plan.isPopular}
  isBestValue={plan.isBestValue}
/>


                    <div className="p-8 flex flex-col flex-grow">
                      <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-white to-gray-100 rounded-xl shadow-sm mb-6 text-3xl">
                        {plan.name === 'Basique' && <FaLightbulb className="text-yellow-500" />}
                        {plan.name === 'Pro' && <FaRocket className="text-blue-500" />}
                        {plan.name === 'Entreprise' && <FaCrown className="text-purple-500" />}
                        {plan.name === 'Premium' && <FaGem className="text-green-500" />}
                        
                      </div>

                      <h3 className="text-3xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      
                      <div className="flex items-end mb-2">
                        <span className="text-5xl font-extrabold text-gray-900">{plan.price}</span>
                        <span className="text-gray-500 ml-2 mb-1 text-xl">{plan.currency}/{plan.billingCycle === 'monthly' ? 'mois' : 'an'}</span>
                      </div>

                      {plan.billingCycle === 'yearly' && (
                        <motion.div 
                          className="text-sm text-green-600 mb-4 font-medium"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                        >
                          Économisez {Math.round((1 - (plan.price / (plan.price * 12))) * 100)}%
                        </motion.div>
                      )}
                      
                      {plan.description && (
                        <p className="text-gray-600 mb-6 text-lg">{plan.description}</p>
                      )}
                      
                     <div className="mb-4">
  <h4 className="font-semibold text-gray-800 mb-2">Dashboards inclus :</h4>
  <div className="flex flex-wrap gap-2">
    {plan.dashboards?.map((dashboard, i) => (
      <motion.span
        key={i}
        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
        whileHover={{ scale: 1.05 }}
      >
        {dashboard.name}
      </motion.span>
    ))}
  </div>
</div>
                      <ul className="space-y-4 mb-8 flex-grow">
                        {plan.features.map((feature, i) => (
                          <motion.li 
                            key={i} 
                            className="flex items-start"
                            whileHover={{ x: 5 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                          >
                            <FaCheck className={`mt-1 mr-3 flex-shrink-0 ${
                              feature.available ? 'text-green-500' : 'text-gray-300'
                            }`} />
                            <span className={`text-lg ${feature.available ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                              {feature.text}
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                      
                      <div className="mt-auto flex justify-between pt-4 border-t border-gray-100">
                        <motion.button
                          whileHover={{ scale: 1.05, backgroundColor: "#EFF6FF" }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleEdit(plan)}
                          className="flex items-center text-blue-600 px-4 py-2 rounded-lg"
                        >
                          <Edit size={16} className="mr-2" />
                          Modifier
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.05, backgroundColor: "#FEF2F2" }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDelete(plan._id)}
                          className="flex items-center text-red-600 px-4 py-2 rounded-lg"
                        >
                          <Trash2 size={16} className="mr-2" />
                          Supprimer
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PricingAdmin;