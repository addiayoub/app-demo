const Category = require('../models/Category');
const Dashboard = require('../models/Dashboard');

const categoryController = {
  // Créer une nouvelle catégorie
  createCategory: async (req, res) => {
    try {
      const { name, description, isPublic } = req.body;
      
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Le nom de la catégorie est requis'
        });
      }

      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Une catégorie avec ce nom existe déjà'
        });
      }

      const newCategory = new Category({
        name,
        description: description || '',
        isPublic: isPublic || false,
        createdBy: req.user._id
      });

      await newCategory.save();
      
      res.status(201).json({
        success: true,
        message: 'Catégorie créée avec succès',
        data: newCategory
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la catégorie',
        error: error.message
      });
    }
  },

  // Récupérer toutes les catégories
  getAllCategories: async (req, res) => {
    try {
      let query = {};
      
      // Si l'utilisateur n'est pas admin, ne retourner que les catégories publiques ou celles qu'il a créées
      if (req.user.role !== 'admin') {
        query = { 
          $or: [
            { isPublic: true },
            { createdBy: req.user._id }
          ]
        };
      }

      const categories = await Category.find(query)
        .populate('createdBy', 'name email')
        .populate('dashboards', 'name url')
        .sort({ updatedAt: -1 });
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des catégories',
        error: error.message
      });
    }
  },
// À ajouter dans categoryController.js

getCategoryNames: async (req, res) => {
  try {
    // Récupérer toutes les catégories (publiques ET privées)
    const categories = await Category.find({})
      .select('name _id') // Seulement le nom et l'ID
      .sort({ updatedAt: -1 });
    
    // Récupérer tous les dashboards actifs
    const dashboards = await Dashboard.find({ active: true })
      .select('name _id categories')
      .lean();

    // Associer les dashboards à leurs catégories
    const categoriesWithDashboards = categories.map(category => {
      const categoryDashboards = dashboards.filter(dashboard => 
        dashboard.categories.some(catId => 
          catId.toString() === category._id.toString()
        )
      ).map(db => ({ _id: db._id, name: db.name }));

      return {
        _id: category._id,
        name: category.name,
        dashboards: categoryDashboards,
        dashboardCount: categoryDashboards.length
      };
    });

    res.json({
      success: true,
      data: categoriesWithDashboards
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des noms de catégories',
      error: error.message
    });
  }
},

  // Récupérer une catégorie par ID
  getCategoryById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const category = await Category.findById(id)
        .populate('createdBy', 'name email')
        .populate({
          path: 'dashboards',
          select: 'name url description isPublic active',
          populate: {
            path: 'createdBy',
            select: 'name email'
          }
        });
      
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Catégorie non trouvée'
        });
      }

      // Vérifier les permissions
      if (!category.isPublic && category.createdBy._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Non autorisé à accéder à cette catégorie'
        });
      }

      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la catégorie',
        error: error.message
      });
    }
  },

  // Mettre à jour une catégorie
  updateCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, isPublic } = req.body;
      
      const category = await Category.findById(id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Catégorie non trouvée'
        });
      }

      // Vérifier les permissions
      if (category.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Non autorisé à modifier cette catégorie'
        });
      }

      if (name && name !== category.name) {
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
          return res.status(400).json({
            success: false,
            message: 'Une catégorie avec ce nom existe déjà'
          });
        }
        category.name = name;
      }

      if (description !== undefined) category.description = description;
      if (isPublic !== undefined) category.isPublic = isPublic;

      await category.save();
      
      res.json({
        success: true,
        message: 'Catégorie mise à jour avec succès',
        data: category
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la catégorie',
        error: error.message
      });
    }
  },

  // Supprimer une catégorie
  deleteCategory: async (req, res) => {
    try {
      const { id } = req.params;
      
      const category = await Category.findById(id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Catégorie non trouvée'
        });
      }

      // Vérifier les permissions
      if (category.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Non autorisé à supprimer cette catégorie'
        });
      }

      // Retirer cette catégorie de tous les dashboards associés
      await Dashboard.updateMany(
        { categories: id },
        { $pull: { categories: id } }
      );

      await Category.findByIdAndDelete(id);
      
      res.json({
        success: true,
        message: 'Catégorie supprimée avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la catégorie',
        error: error.message
      });
    }
  },

  // Ajouter un dashboard à une catégorie
  addDashboardToCategory: async (req, res) => {
    try {
      const { categoryId, dashboardId } = req.params;
      
      const category = await Category.findById(categoryId);
      const dashboard = await Dashboard.findById(dashboardId);
      
      if (!category || !dashboard) {
        return res.status(404).json({
          success: false,
          message: 'Catégorie ou dashboard non trouvé'
        });
      }

      // Vérifier les permissions
      if (category.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Non autorisé à modifier cette catégorie'
        });
      }

      // Vérifier si le dashboard est déjà dans la catégorie
      if (category.dashboards.includes(dashboardId)) {
        return res.status(400).json({
          success: false,
          message: 'Ce dashboard est déjà dans cette catégorie'
        });
      }

      // Ajouter le dashboard à la catégorie
      category.dashboards.push(dashboardId);
      await category.save();

      // Ajouter la catégorie au dashboard (si pas déjà présente)
      if (!dashboard.categories.includes(categoryId)) {
        dashboard.categories.push(categoryId);
        await dashboard.save();
      }
      
      res.json({
        success: true,
        message: 'Dashboard ajouté à la catégorie avec succès',
        data: {
          category: await Category.findById(categoryId).populate('dashboards'),
          dashboard: await Dashboard.findById(dashboardId).populate('categories')
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'ajout du dashboard à la catégorie',
        error: error.message
      });
    }
  },

  // Retirer un dashboard d'une catégorie
  removeDashboardFromCategory: async (req, res) => {
    try {
      const { categoryId, dashboardId } = req.params;
      
      const category = await Category.findById(categoryId);
      const dashboard = await Dashboard.findById(dashboardId);
      
      if (!category || !dashboard) {
        return res.status(404).json({
          success: false,
          message: 'Catégorie ou dashboard non trouvé'
        });
      }

      // Vérifier les permissions
      if (category.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Non autorisé à modifier cette catégorie'
        });
      }

      // Retirer le dashboard de la catégorie
      category.dashboards = category.dashboards.filter(id => id.toString() !== dashboardId);
      await category.save();

      // Retirer la catégorie du dashboard (si présente)
      dashboard.categories = dashboard.categories.filter(id => id.toString() !== categoryId);
      await dashboard.save();
      
      res.json({
        success: true,
        message: 'Dashboard retiré de la catégorie avec succès',
        data: {
          category: await Category.findById(categoryId).populate('dashboards'),
          dashboard: await Dashboard.findById(dashboardId).populate('categories')
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors du retrait du dashboard de la catégorie',
        error: error.message
      });
    }
  },

  // Récupérer les dashboards d'une catégorie
  getCategoryDashboards: async (req, res) => {
    try {
      const { id } = req.params;
      
      const category = await Category.findById(id)
        .populate({
          path: 'dashboards',
          match: { active: true },
          select: 'name url description isPublic',
          populate: {
            path: 'createdBy',
            select: 'name email'
          }
        });
      
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Catégorie non trouvée'
        });
      }

      // Vérifier les permissions
      if (!category.isPublic && category.createdBy._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Non autorisé à accéder à cette catégorie'
        });
      }

      res.json({
        success: true,
        data: {
          category: {
            _id: category._id,
            name: category.name,
            description: category.description
          },
          dashboards: category.dashboards
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des dashboards de la catégorie',
        error: error.message
      });
    }
  }
};

module.exports = categoryController;/////