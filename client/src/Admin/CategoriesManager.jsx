import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Folder, FolderPlus, Edit, Trash2, X, Check, Plus,
  ChevronDown, ChevronUp, Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { showDeleteConfirmation, showErrorAlert, showSuccessAlert, showLoadingAlert } from './alert';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
axios.defaults.baseURL = API_BASE_URL;

const CategoriesManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryIsPublic, setNewCategoryIsPublic] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  const slideUp = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: 'auto', transition: { duration: 0.3 } }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/categories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setCategories(response.data.data || response.data);
    } catch (err) {
      setError('Erreur lors du chargement des catégories');
      console.error('Fetch categories error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create new category
  const createCategory = async () => {
    if (!newCategoryName.trim()) {
      showErrorAlert('Erreur', 'Le nom de la catégorie est requis');
      return;
    }

    const loadingAlert = showLoadingAlert('Création en cours...');

    try {
      const response = await axios.post('/api/categories', {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim(),
        isPublic: newCategoryIsPublic
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setCategories([...categories, response.data.data || response.data]);
      setNewCategoryName('');
      setNewCategoryDescription('');
      setNewCategoryIsPublic(false);
      setShowAddForm(false);

      loadingAlert.close();
      showSuccessAlert('Succès', 'Catégorie créée avec succès');
    } catch (err) {
      loadingAlert.close();
      showErrorAlert('Erreur', err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  // Update category
  const updateCategory = async () => {
    if (!editingCategory?.name.trim()) {
      showErrorAlert('Erreur', 'Le nom de la catégorie est requis');
      return;
    }

    const loadingAlert = showLoadingAlert('Mise à jour en cours...');

    try {
      const response = await axios.put(`/api/categories/${editingCategory._id}`, {
        name: editingCategory.name.trim(),
        description: editingCategory.description.trim(),
        isPublic: editingCategory.isPublic
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setCategories(categories.map(cat => 
        cat._id === editingCategory._id ? (response.data.data || response.data) : cat
      ));
      setEditingCategory(null);

      loadingAlert.close();
      showSuccessAlert('Succès', 'Catégorie mise à jour avec succès');
    } catch (err) {
      loadingAlert.close();
      showErrorAlert('Erreur', err.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  // Delete category
  const deleteCategory = async (id) => {
    const categoryToDelete = categories.find(c => c._id === id);
    
    showDeleteConfirmation(categoryToDelete?.name || 'cette catégorie', async () => {
      const loadingAlert = showLoadingAlert('Suppression en cours...');
      
      try {
        await axios.delete(`/api/categories/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        setCategories(categories.filter(cat => cat._id !== id));
        if (expandedCategory === id) setExpandedCategory(null);
        
        loadingAlert.close();
        showSuccessAlert('Supprimé!', 'Catégorie supprimée avec succès');
      } catch (err) {
        loadingAlert.close();
        showErrorAlert('Erreur', err.response?.data?.message || 'Erreur lors de la suppression');
      }
    });
  };

  // Toggle category expansion
  const toggleExpandCategory = (id) => {
    setExpandedCategory(expandedCategory === id ? null : id);
  };

  // Load categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="bg-white rounded-xl shadow-sm overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
            Gestion des Catégories
          </h2>
          <motion.button
            onClick={() => {
              setShowAddForm(true);
              setEditingCategory(null);
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm sm:text-base"
          >
            <Plus size={18} />
            <span>Nouvelle Catégorie</span>
          </motion.button>
        </div>

        {/* Add/Edit Form */}
        <AnimatePresence>
          {(showAddForm || editingCategory) && (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={slideUp}
              className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50"
            >
              <h3 className="text-lg font-medium mb-4">
                {editingCategory ? 'Modifier la Catégorie' : 'Ajouter une Catégorie'}
              </h3>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la catégorie *
                  </label>
                  <input
                    type="text"
                    value={editingCategory ? editingCategory.name : newCategoryName}
                    onChange={(e) => 
                      editingCategory 
                        ? setEditingCategory({...editingCategory, name: e.target.value})
                        : setNewCategoryName(e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Tableaux Financiers"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editingCategory ? editingCategory.description : newCategoryDescription}
                    onChange={(e) => 
                      editingCategory 
                        ? setEditingCategory({...editingCategory, description: e.target.value})
                        : setNewCategoryDescription(e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Description de la catégorie..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between sm:col-span-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Visibilité
                    </label>
                    <p className="text-xs text-gray-500">
                      {editingCategory?.isPublic || newCategoryIsPublic
                        ? 'Visible par tous les utilisateurs'
                        : 'Visible uniquement par les utilisateurs autorisés'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Publique</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingCategory ? editingCategory.isPublic : newCategoryIsPublic}
                        onChange={() => 
                          editingCategory 
                            ? setEditingCategory({...editingCategory, isPublic: !editingCategory.isPublic})
                            : setNewCategoryIsPublic(!newCategoryIsPublic)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <motion.button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingCategory(null);
                  }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Annuler
                </motion.button>
                <motion.button
                  onClick={editingCategory ? updateCategory : createCategory}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  {editingCategory ? (
                    <>
                      <Check size={18} />
                      <span>Enregistrer</span>
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      <span>Créer</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Categories List */}
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="animate-spin text-blue-600" size={24} />
            </div>
          ) : error ? (
            <div className="p-4 sm:p-6 text-center text-red-600">
              {error}
            </div>
          ) : categories.length === 0 ? (
            <div className="p-4 sm:p-6 text-center text-gray-500">
              Aucune catégorie trouvée
            </div>
          ) : (
            <AnimatePresence>
              {categories.map((category) => (
                <motion.div
                  key={category._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-4 sm:p-6"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <Folder className="mt-1 text-blue-500" size={20} />
                      <div>
                        <h3 className="font-medium text-gray-800">
                          {category.name}
                          {category.isPublic && (
                            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              Public
                            </span>
                          )}
                        </h3>
                        {category.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => setEditingCategory(category)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                        title="Modifier"
                      >
                        <Edit size={18} />
                      </motion.button>
                      <motion.button
                        onClick={() => deleteCategory(category._id)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </motion.button>
                      <motion.button
                        onClick={() => toggleExpandCategory(category._id)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                        title="Détails"
                      >
                        {expandedCategory === category._id ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </motion.button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedCategory === category._id && (
                      <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={slideUp}
                        className="mt-4 pl-8 text-sm text-gray-600"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="font-medium">Statut:</p>
                            <p>{category.isPublic ? 'Publique' : 'Privée'}</p>
                          </div>
                          <div>
                            <p className="font-medium">Créée le:</p>
                            <p>{new Date(category.createdAt).toLocaleDateString('fr-FR')}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="font-medium">Nombre de dashboards:</p>
                            <p>{category.dashboards?.length || 0}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CategoriesManager;