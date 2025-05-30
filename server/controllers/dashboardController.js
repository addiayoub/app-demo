  const Dashboard = require('../models/Dashboard');

  const dashboardController = {
    // Récupérer tous les dashboards
 // Dans votre contrôleur dashboardController.js, modifiez la méthode getAllDashboards
getAllDashboards: async (req, res) => {
  try {
    let query = {};
    
    // Si l'utilisateur n'est pas admin, ne retourner que les dashboards publics ou ceux qui lui sont assignés
    if (req.user.role !== 'admin') {
      query = { 
        $or: [
          { isPublic: true },
          { allowedUsers: req.user._id }
        ]
      };
    }

    const dashboards = await Dashboard.find(query)
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 });
    
    res.json({
      success: true,
      data: dashboards
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des dashboards',
      error: error.message
    });
  }
},
getPublicDashboards: async (req, res) => {
  try {
    const dashboards = await Dashboard.find({ 
      isPublic: true, 
      active: true // Seulement les dashboards actifs
    })
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 });
    
    res.json({
      success: true,
      data: dashboards
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des dashboards publics',
      error: error.message
    });
  }
},

// Dans dashboardController.js
togglePublicStatus: async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublic } = req.body;
    
    const dashboard = await Dashboard.findById(id);
    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard non trouvé'
      });
    }

    // Vérifier les permissions
    if (dashboard.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à modifier ce dashboard'
      });
    }

    dashboard.isPublic = isPublic;
    await dashboard.save();
    
    res.json({
      success: true,
      message: `Dashboard marqué comme ${isPublic ? 'public' : 'privé'}`,
      data: dashboard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification de la visibilité',
      error: error.message
    });
  }
},
    // Récupérer un dashboard par ID
    getDashboardById: async (req, res) => {
      try {
        const { id } = req.params;
        
        const dashboard = await Dashboard.findById(id)
          .populate('createdBy', 'name email');
        
        if (!dashboard) {
          return res.status(404).json({
            success: false,
            message: 'Dashboard non trouvé'
          });
        }

        res.json({
          success: true,
          data: dashboard
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la récupération du dashboard',
          error: error.message
        });
      }
    },

    // Créer un nouveau dashboard
    createDashboard: async (req, res) => {
      try {
        const { name, url, description, active = true } = req.body;
        
        if (!name || !url) {
          return res.status(400).json({
            success: false,
            message: 'Le nom et l\'URL sont requis'
          });
        }

        // Vérifier si un dashboard avec le même nom existe déjà
        const existingDashboard = await Dashboard.findOne({ name });
        if (existingDashboard) {
          return res.status(400).json({
            success: false,
            message: 'Un dashboard avec ce nom existe déjà'
          });
        }

        const newDashboard = new Dashboard({
          name,
          url,
          description: description || '',
          active, // Ajout du champ active
          createdBy: req.user._id
        });

        await newDashboard.save();
        
        // Populate les données de l'utilisateur pour la réponse
        await newDashboard.populate('createdBy', 'name email');
        
        res.status(201).json({
          success: true,
          message: 'Dashboard créé avec succès',
          data: newDashboard
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la création du dashboard',
          error: error.message
        });
      }
    },

    // Mettre à jour un dashboard
    updateDashboard: async (req, res) => {
      try {
        const { id } = req.params;
        const { name, url, description, active } = req.body; // Ajout du champ active
        
        if (!name || !url) {
          return res.status(400).json({
            success: false,
            message: 'Le nom et l\'URL sont requis'
          });
        }

        const dashboard = await Dashboard.findById(id);
        if (!dashboard) {
          return res.status(404).json({
            success: false,
            message: 'Dashboard non trouvé'
          });
        }

        // Vérifier si l'utilisateur est l'auteur ou un admin
        if (dashboard.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Non autorisé à modifier ce dashboard'
          });
        }

        // Vérifier si un autre dashboard avec le même nom existe déjà
        if (name !== dashboard.name) {
          const existingDashboard = await Dashboard.findOne({ 
            name, 
            _id: { $ne: id } 
          });
          if (existingDashboard) {
            return res.status(400).json({
              success: false,
              message: 'Un dashboard avec ce nom existe déjà'
            });
          }
        }

        // Mettre à jour les champs
        dashboard.name = name;
        dashboard.url = url;
        dashboard.description = description !== undefined ? description : dashboard.description;
        dashboard.active = active !== undefined ? active : dashboard.active; // Mise à jour du champ active
        dashboard.updatedAt = new Date();

        await dashboard.save();
        
        // Populate les données pour la réponse
        await dashboard.populate('createdBy', 'name email');
        
        res.json({
          success: true,
          message: 'Dashboard mis à jour avec succès',
          data: dashboard
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la mise à jour du dashboard',
          error: error.message
        });
      }
    },

    // Supprimer un dashboard
    deleteDashboard: async (req, res) => {
      try {
        const { id } = req.params;
        
        const dashboard = await Dashboard.findById(id);
        if (!dashboard) {
          return res.status(404).json({
            success: false,
            message: 'Dashboard non trouvé'
          });
        }

        // Vérifier si l'utilisateur est l'auteur ou un admin
        if (dashboard.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Non autorisé à supprimer ce dashboard'
          });
        }

        await Dashboard.findByIdAndDelete(id);
        
        res.json({
          success: true,
          message: 'Dashboard supprimé avec succès'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la suppression du dashboard',
          error: error.message
        });
      }
    },

    // Activer/Désactiver un dashboard (nouvelle méthode)
    toggleDashboardStatus: async (req, res) => {
      try {
        const { id } = req.params;
        
        const dashboard = await Dashboard.findById(id);
        if (!dashboard) {
          return res.status(404).json({
            success: false,
            message: 'Dashboard non trouvé'
          });
        }

        // Vérifier si l'utilisateur est l'auteur ou un admin
        if (dashboard.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Non autorisé à modifier ce dashboard'
          });
        }

        // Inverser le statut
        dashboard.active = !dashboard.active;
        dashboard.updatedAt = new Date();

        await dashboard.save();
        
        // Populate les données pour la réponse
        await dashboard.populate('createdBy', 'name email');
        
        res.json({
          success: true,
          message: `Dashboard ${dashboard.active ? 'activé' : 'désactivé'} avec succès`,
          data: dashboard
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la modification du statut',
          error: error.message
        });
      }
    },

    // Obtenir les statistiques des dashboards
    getDashboardStats: async (req, res) => {
      try {
        const totalDashboards = await Dashboard.countDocuments();
        const activeDashboards = await Dashboard.countDocuments({ active: true });
        const inactiveDashboards = await Dashboard.countDocuments({ active: false });
        const userDashboards = await Dashboard.countDocuments({ 
          createdBy: req.user._id 
        });
        
        const recentDashboards = await Dashboard.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('createdBy', 'name email');

        res.json({
          success: true,
          data: {
            totalDashboards,
            activeDashboards,
            inactiveDashboards,
            userDashboards,
            recentDashboards
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la récupération des statistiques',
          error: error.message
        });
      }
    }
  };

  module.exports = dashboardController;