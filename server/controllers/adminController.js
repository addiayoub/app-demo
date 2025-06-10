// controllers/adminController.js
const User = require('../models/User');
const Dashboard = require('../models/Dashboard');
const emailService = require('../services/emailService');
const adminController = {
  // Obtenir tous les utilisateurs
  getAllUsers: async (req, res) => {
    try {
      const users = await User.find().select('-password -__v');
      res.json(users);
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      res.status(500).json({ 
        message: 'Erreur serveur', 
        error: error.message 
      });
    }
  },

  // Créer un nouvel utilisateur
  createUser: async (req, res) => {
    try {
      const { email, password, name, role, avatar } = req.body;
      
      if (!email || !password || !name) {
        return res.status(400).json({ 
          message: 'Email, mot de passe et nom sont requis' 
        });
      }

      const user = new User({
        email,
        password,
        name,
        avatar: avatar || undefined,
        role: role || 'user',
        authMethod: 'local',
        isVerified: true
      });

      await user.save();
      
      // Retourner l'utilisateur complet avec l'avatar
      const savedUser = await User.findById(user._id).select('-password -__v');
      
      res.status(201).json({
        message: 'Utilisateur créé avec succès',
        user: savedUser
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Erreur lors de la création', 
        error: error.message 
      });
    }
  },

  // Mise à jour de l'utilisateur
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, role, isVerified, avatar } = req.body;
      
      if (!id) {
        return res.status(400).json({ 
          message: 'ID utilisateur requis' 
        });
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ 
          message: 'Utilisateur non trouvé' 
        });
      }

      // Empêcher la modification du premier admin
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (user.role === 'admin' && adminCount === 1 && role !== 'admin') {
        return res.status(400).json({ 
          message: 'Impossible de retirer les droits du dernier administrateur' 
        });
      }

      // Mettre à jour les champs
      if (name !== undefined) user.name = name;
      if (email !== undefined) user.email = email;
      if (role !== undefined) user.role = role;
      if (avatar !== undefined) user.avatar = avatar;
      if (isVerified !== undefined) user.isVerified = isVerified;

      await user.save();
      
      // Retourner l'utilisateur mis à jour sans le mot de passe
      const updatedUser = await User.findById(id).select('-password -__v');
      
      console.log('Utilisateur mis à jour par admin:', user.email);
      
      res.json({
        message: 'Utilisateur mis à jour avec succès',
        user: updatedUser
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      res.status(500).json({ 
        message: 'Erreur mise à jour', 
        error: error.message 
      });
    }
  },

  // Supprimer un utilisateur
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ 
          message: 'ID utilisateur requis' 
        });
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ 
          message: 'Utilisateur non trouvé' 
        });
      }

      // Empêcher la suppression du dernier admin
      if (user.role === 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount === 1) {
          return res.status(400).json({ 
            message: 'Impossible de supprimer le dernier administrateur' 
          });
        }
      }

      // Empêcher l'auto-suppression
      if (user._id.toString() === req.user._id.toString()) {
        return res.status(400).json({ 
          message: 'Vous ne pouvez pas supprimer votre propre compte' 
        });
      }

      await User.findByIdAndDelete(id);
      
      console.log('Utilisateur supprimé par admin:', user.email);
      
      res.json({ 
        message: 'Utilisateur supprimé avec succès' 
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      res.status(500).json({ 
        message: 'Erreur suppression', 
        error: error.message 
      });
    }
  },

  // Upload avatar - CORRIGÉ
  uploadAvatar: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Aucun fichier téléchargé' });
      }
      
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      
      // Créer l'URL complète de l'avatar
      const avatarPath = `/uploads/avatars/${req.file.filename}`;
      user.avatar = avatarPath;
      await user.save();
      
      // Retourner l'utilisateur mis à jour complet
      const updatedUser = await User.findById(req.params.id).select('-password -__v');
      
      res.json({
        message: 'Avatar mis à jour avec succès',
        avatar: avatarPath,
        user: updatedUser // Retourner l'utilisateur complet
      });
    } catch (error) {
      console.error('Erreur lors du téléchargement de l\'avatar:', error);
      res.status(500).json({ 
        message: 'Erreur lors du téléchargement', 
        error: error.message 
      });
    }
  },

  // Obtenir les statistiques des utilisateurs
  getUserStats: async (req, res) => {
    try {
      const stats = await User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            verifiedUsers: {
              $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] }
            },
            unverifiedUsers: {
              $sum: { $cond: [{ $eq: ['$isVerified', false] }, 1, 0] }
            },
            adminUsers: {
              $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
            },
            regularUsers: {
              $sum: { $cond: [{ $eq: ['$role', 'user'] }, 1, 0] }
            },
            localUsers: {
              $sum: { $cond: [{ $eq: ['$authMethod', 'local'] }, 1, 0] }
            },
            googleUsers: {
              $sum: { $cond: [{ $eq: ['$authMethod', 'google'] }, 1, 0] }
            }
          }
        }
      ]);

      const result = stats[0] || {
        totalUsers: 0,
        verifiedUsers: 0,
        unverifiedUsers: 0,
        adminUsers: 0,
        regularUsers: 0,
        localUsers: 0,
        googleUsers: 0
      };

      res.json({
        message: 'Statistiques récupérées avec succès',
        stats: result
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la récupération des statistiques', 
        error: error.message 
      });
    }
  },
// Attribuer des tableaux à un utilisateur
// In adminController.js

// Get user's dashboards
getUserDashboards: async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .populate('dashboards.dashboard')
      .select('dashboards');

    res.json({
      message: 'User dashboards retrieved',
      dashboards: user.dashboards
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error getting user dashboards', 
      error: error.message 
    });
  }
},

// Assign dashboards
// Dans adminController.js
// controllers/adminController.js - Méthode modifiée
assignDashboards: async (req, res) => {
  try {
    const { userId } = req.params;
    const { dashboardAssignments } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Supprimer les assignations existantes pour les dashboards mis à jour
    const dashboardIdsToUpdate = dashboardAssignments.map(a => a.dashboardId);
    user.dashboards = user.dashboards.filter(
      d => !dashboardIdsToUpdate.includes(d.dashboard.toString())
    );

    // Ajouter les nouvelles assignations
    dashboardAssignments.forEach(assignment => {
      const dashboardAssignment = {
        dashboard: assignment.dashboardId,
        assignedAt: new Date()
      };

      // *** SOLUTION DIRECTE - Utiliser l'heure locale directement ***
      if (assignment.expiresAt) {
        // Si votre frontend envoie déjà l'heure locale, utilisez directement:
        dashboardAssignment.expiresAt = new Date(assignment.expiresAt);
        
        console.log('Date reçue du frontend:', assignment.expiresAt);
        console.log('Date qui sera sauvegardée:', dashboardAssignment.expiresAt);
      }

      user.dashboards.push(dashboardAssignment);
    });

    // Marquer le tableau comme modifié et sauvegarder
    user.markModified('dashboards');
    await user.save();
    
    // Récupérer l'utilisateur mis à jour avec les détails des dashboards
    const updatedUser = await User.findById(userId)
      .populate('dashboards.dashboard')
      .select('dashboards name email');

    // Préparer les données pour l'email (si nécessaire)
    const dashboardsForEmail = updatedUser.dashboards
      .filter(d => dashboardIdsToUpdate.includes(d.dashboard._id.toString()))
      .map(d => ({
        dashboard: {
          name: d.dashboard.name,
          url: d.dashboard.url
        },
        expiresAt: d.expiresAt
      }));

    let emailSent = false;
    // Envoyer l'email de notification
    try {
      await emailService.sendDashboardAssignmentEmail(
        user.email,
        user.name,
        dashboardsForEmail
      );
      emailSent = true;
      console.log(`Email d'assignation de dashboard envoyé à ${user.email}`);
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email:', emailError);
    }

    res.json({
      message: 'Dashboards assigned successfully',
      dashboards: updatedUser.dashboards,
      emailSent: emailSent
    });
  } catch (error) {
    console.error('Erreur lors de l\'assignation des dashboards:', error);
    res.status(500).json({ 
      message: 'Error assigning dashboards', 
      error: error.message 
    });
  }
},
  // Version alternative avec gestion d'erreur email plus robuste
  assignDashboardsWithEmailHandling: async (req, res) => {
    try {
      const { userId } = req.params;
      const { dashboardAssignments, sendEmail = true } = req.body; // Option pour désactiver l'email

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Supprimer les assignations existantes pour les dashboards mis à jour
      const dashboardIdsToUpdate = dashboardAssignments.map(a => a.dashboardId);
      user.dashboards = user.dashboards.filter(
        d => !dashboardIdsToUpdate.includes(d.dashboard.toString())
      );

      // Ajouter les nouvelles assignations
      dashboardAssignments.forEach(assignment => {
        user.dashboards.push({
          dashboard: assignment.dashboardId,
          expiresAt: assignment.expiresAt
        });
      });

      // Sauvegarder l'utilisateur
      const options = { timestamps: false, strict: false };
      await user.save(options);
      
      // Récupérer l'utilisateur mis à jour avec les détails des dashboards
      const updatedUser = await User.findById(userId)
        .populate('dashboards.dashboard')
        .select('dashboards name email');

      let emailSent = false;
      
      // Envoyer l'email seulement si demandé
      if (sendEmail) {
        try {
          // Préparer les données pour l'email
          const dashboardsForEmail = updatedUser.dashboards
            .filter(d => dashboardIdsToUpdate.includes(d.dashboard._id.toString()))
            .map(d => ({
              dashboard: {
                name: d.dashboard.name,
                url: d.dashboard.url
              },
              expiresAt: d.expiresAt
            }));

          await emailService.sendDashboardAssignmentEmail(
            user.email,
            user.name,
            dashboardsForEmail
          );
          
          emailSent = true;
          console.log(`Email d'assignation envoyé avec succès à ${user.email}`);
        } catch (emailError) {
          console.error('Erreur lors de l\'envoi de l\'email:', emailError);
          // L'assignation continue même si l'email échoue
        }
      }

      res.json({
        message: 'Dashboards assigned successfully',
        dashboards: updatedUser.dashboards,
        emailSent: emailSent,
        emailRequested: sendEmail
      });
    } catch (error) {
      console.error('Erreur lors de l\'assignation des dashboards:', error);
      res.status(500).json({ 
        message: 'Error assigning dashboards', 
        error: error.message 
      });
    }
  },


// Unassign dashboards
unassignDashboards: async (req, res) => {
  try {
    const { userId } = req.params;
    const { dashboardIds } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { dashboards: { dashboard: { $in: dashboardIds } } },
       new: true }
    ).populate('dashboards.dashboard');

    res.json({
      message: 'Dashboards unassigned successfully',
      dashboards: user.dashboards
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error unassigning dashboards', 
      error: error.message 
    });
  }
},

// Get active dashboards (non-expired)
getActiveDashboards: async (req, res) => {
  try {
    const { userId } = req.params;
    const now = new Date();
    
    const user = await User.findById(userId)
      .populate('dashboards.dashboard')
      .select('dashboards');

    const activeDashboards = user.dashboards.filter(d => 
      !d.expiresAt || new Date(d.expiresAt) > now
    );

    res.json({
      message: 'Active dashboards retrieved',
      dashboards: activeDashboards
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error getting active dashboards', 
      error: error.message 
    });
  }
},
  // Rechercher des utilisateurs
  searchUsers: async (req, res) => {
    try {
      const { q, role, authMethod, isVerified } = req.query;
      
      let searchQuery = {};

      // Recherche par nom ou email
      if (q) {
        searchQuery.$or = [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } }
        ];
      }

      // Filtres
      if (role) searchQuery.role = role;
      if (authMethod) searchQuery.authMethod = authMethod;
      if (isVerified !== undefined) searchQuery.isVerified = isVerified === 'true';

      const users = await User.find(searchQuery)
        .select('-password -__v')
        .sort({ createdAt: -1 })
        .limit(50);

      res.json({
        message: 'Recherche effectuée avec succès',
        users,
        count: users.length
      });
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la recherche', 
        error: error.message 
      });
    }
  }
};

module.exports = adminController;