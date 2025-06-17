// controllers/adminController.js
const User = require('../models/User');
const Dashboard = require('../models/Dashboard');
const Subscription = require('../models/Subscription');
const emailService = require('../services/emailService');
const PricingPlan = require('../models/PricingPlan');
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
// Méthodes mises à jour dans adminController.js

// Méthode getUserPlans mise à jour
getUserPlans: async (req, res) => {
  try {
    const { userId } = req.params;

    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Récupérer TOUS les abonnements de l'utilisateur (actifs, annulés, expirés, essais)
    const subscriptions = await Subscription.find({ user: userId })
      .populate({
        path: 'plan',
        populate: {
          path: 'dashboards',
          select: 'name _id',
        },
      })
      .populate({
        path: 'dashboards',
        select: 'name _id',
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, plans: subscriptions });
  } catch (error) {
    console.error('Error fetching user plans:', error);
    res.status(500).json({ success: false, error: error.message });
  }
},

// Méthode revokeUserSubscription mise à jour pour gérer les essais
revokeUserSubscription: async (req, res) => {
  try {
    const { userId } = req.params;

    // Trouver l'abonnement actif OU en essai
    const subscription = await Subscription.findOne({ 
      user: userId, 
      status: { $in: ['active', 'trialing'] }
    }).populate('plan');

    if (!subscription) {
      return res.status(404).json({ 
        message: 'Aucun abonnement actif ou essai trouvé' 
      });
    }

    // Annuler l'abonnement
    subscription.status = 'canceled';
    subscription.canceledAt = new Date();
    await subscription.save();

    // Mettre à jour l'utilisateur
    const user = await User.findById(userId);
    if (user) {
      user.role = 'user'; // Rétrograder au rôle de base
      user.dashboards = []; // Supprimer tous les dashboards
      await user.save();
    }

    console.log(`Abonnement ${subscription.isTrial ? '(essai)' : ''} révoqué pour l'utilisateur ${user?.email || userId}`);

    res.json({ 
      message: `${subscription.isTrial ? 'Essai' : 'Abonnement'} révoqué avec succès`,
      subscription: subscription
    });

  } catch (error) {
    console.error('Erreur lors de la révocation de l\'abonnement:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la révocation de l\'abonnement', 
      error: error.message 
    });
  }
},

// Méthode cancelPlan mise à jour
cancelPlan: async (req, res) => {
  try {
    const { userId } = req.params;

    // Trouver l'utilisateur d'abord
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        message: 'Utilisateur non trouvé' 
      });
    }

    // Trouver l'abonnement actif OU en essai
    const subscription = await Subscription.findOne({ 
      user: userId, 
      status: { $in: ['active', 'trialing'] } // Inclure les essais
    }).populate('plan');

    if (!subscription) {
      return res.status(404).json({ 
        message: 'Aucun abonnement actif ou essai trouvé pour cet utilisateur' 
      });
    }

    // Annuler l'abonnement
    subscription.status = 'canceled';
    subscription.canceledAt = new Date();
    await subscription.save();
    
    const subscriptionInfo = {
      planName: subscription.plan ? subscription.plan.name : 'Plan inconnu',
      canceledAt: subscription.canceledAt,
      wasTrialing: subscription.isTrial || false
    };

    console.log(`Plan ${subscription.isTrial ? '(essai)' : ''} annulé pour l'utilisateur ${user.email}`);

    // Réinitialiser le rôle utilisateur et supprimer les dashboards
    user.role = 'user';
    user.dashboards = [];
    await user.save();

    console.log(`Rôle utilisateur réinitialisé et dashboards supprimés pour ${user.email}`);

    // Envoyer l'email d'annulation
    try {
      if (subscription.plan) {
        await emailService.sendPlanCancellationEmail(
          user.email,
          user.name,
          subscription.plan.name,
          subscription.isTrial // Indiquer si c'était un essai
        );
        console.log(`Email d'annulation ${subscription.isTrial ? 'd\'essai' : 'de plan'} envoyé à ${user.email}`);
      }
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email d\'annulation:', emailError);
      // Continuer même si l'email échoue
    }

    // Obtenir les informations utilisateur mises à jour
    const updatedUser = await User.findById(userId).select('-password -__v');

    res.json({ 
      message: `${subscription.isTrial ? 'Essai' : 'Plan'} annulé avec succès`,
      user: updatedUser,
      subscription: subscriptionInfo,
      actions: [
        subscription.isTrial ? 'Essai annulé' : 'Abonnement annulé',
        'Rôle utilisateur réinitialisé',
        'Dashboards supprimés',
        'Email de notification envoyé'
      ]
    });

  } catch (error) {
    console.error('Erreur lors de l\'annulation du plan:', error);
    res.status(500).json({ 
      message: 'Erreur lors de l\'annulation du plan', 
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
// Assigner un plan à un utilisateur (avec ses dashboards)
// Assigner un plan à un utilisateur (avec création d'abonnement)
assignPlanToUser: async (req, res) => {
  try {
    const { userId } = req.params;
    const { planId } = req.body;

    // Vérifier que l'utilisateur et le plan existent
    const [user, plan] = await Promise.all([
      User.findById(userId),
      PricingPlan.findById(planId).populate('dashboards')
    ]);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    if (!plan) {
      return res.status(404).json({ message: 'Plan non trouvé' });
    }

    // Vérifier si l'utilisateur a déjà un abonnement actif
    const existingSubscription = await Subscription.findOne({ 
      user: userId, 
      status: 'active' 
    });

    // Si un abonnement actif existe, l'annuler d'abord
    if (existingSubscription) {
      existingSubscription.status = 'canceled';
      await existingSubscription.save();
      console.log(`Abonnement précédent annulé pour l'utilisateur ${user.email}`);
    }

    // Mettre à jour le rôle de l'utilisateur selon le plan
    let newRole = 'user';
    const planNameLower = plan.name.toLowerCase();
    if (planNameLower.includes('pro')) {
      newRole = 'pro';
    } else if (planNameLower.includes('entreprise') || planNameLower.includes('enterprise')) {
      newRole = 'enterprise';
    }

    // Créer le nouvel abonnement
    const currentDate = new Date();
    const endDate = new Date();
    
    // Définir la période selon le cycle de facturation du plan
    switch (plan.billingCycle) {
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      case 'quarterly':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      default:
        endDate.setMonth(endDate.getMonth() + 1); // Par défaut mensuel
    }

    const newSubscription = new Subscription({
      user: userId,
      plan: planId,
      stripeSubscriptionId: `admin_assigned_${Date.now()}_${userId}`, // ID unique pour les assignations admin
      status: 'active',
      currentPeriodStart: currentDate,
      currentPeriodEnd: endDate,
      dashboards: plan.dashboards.map(dashboard => dashboard._id)
    });

    await newSubscription.save();
    console.log(`Nouvel abonnement créé pour l'utilisateur ${user.email}`);

    // Assigner les dashboards du plan à l'utilisateur
    const dashboardAssignments = plan.dashboards.map(dashboard => ({
      dashboardId: dashboard._id,
      expiresAt: endDate // Les dashboards expirent avec l'abonnement
    }));

    // Nettoyer les anciens dashboards de l'utilisateur
    user.dashboards = [];

    // Ajouter les nouveaux dashboards
    dashboardAssignments.forEach(assignment => {
      user.dashboards.push({
        dashboard: assignment.dashboardId,
        expiresAt: assignment.expiresAt
      });
    });

    // Mettre à jour le rôle et sauvegarder l'utilisateur
    user.role = newRole;
    await user.save();

    // Envoyer l'email de notification
    try {
      await emailService.sendPlanAssignmentEmail(
        user.email,
        user.name,
        plan,
        plan.dashboards
      );
      console.log(`Email d'assignation de plan envoyé à ${user.email}`);
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email:', emailError);
      // Continuer même si l'email échoue
    }

    // Retourner la réponse avec les informations complètes
    const updatedUser = await User.findById(userId)
      .select('-password -__v')
      .populate('dashboards.dashboard');

    const subscriptionWithDetails = await Subscription.findById(newSubscription._id)
      .populate('plan')
      .populate('dashboards', 'name url');

    res.json({
      message: `Plan ${plan.name} assigné avec succès`,
      user: updatedUser,
      subscription: subscriptionWithDetails,
      plan: {
        name: plan.name,
        price: plan.price,
        currency: plan.currency,
        billingCycle: plan.billingCycle,
        dashboards: plan.dashboards
      },
      assignmentDetails: {
        subscriptionId: newSubscription._id,
        expiresAt: endDate,
        dashboardsCount: plan.dashboards.length
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'assignation du plan:', error);
    res.status(500).json({ 
      message: 'Erreur lors de l\'assignation du plan', 
      error: error.message 
    });
  }
},

// Obtenir l'abonnement d'un utilisateur
getUserSubscription: async (req, res) => {
  try {
    const { userId } = req.params;

    const subscription = await Subscription.findOne({ 
      user: userId,
      status: 'active' 
    })
    .populate({
      path: 'plan',
      populate: {
        path: 'dashboards',
        select: 'name url _id'
      }
    })
    .populate('dashboards', 'name url _id')
    .sort({ createdAt: -1 });

    if (!subscription) {
      return res.json({
        message: 'Aucun abonnement actif trouvé',
        hasSubscription: false,
        subscription: null
      });
    }

    // Calculer les jours restants
    const now = new Date();
    const endDate = new Date(subscription.currentPeriodEnd);
    const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

    res.json({
      message: 'Abonnement récupéré avec succès',
      hasSubscription: true,
      subscription: {
        ...subscription.toObject(),
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
        isExpired: daysRemaining <= 0
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'abonnement:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération de l\'abonnement', 
      error: error.message 
    });
  }
},

// Révoquer un abonnement
revokeUserSubscription: async (req, res) => {
  try {
    const { userId } = req.params;

    // Trouver l'abonnement actif
    const subscription = await Subscription.findOne({ 
      user: userId, 
      status: 'active' 
    });

    if (!subscription) {
      return res.status(404).json({ 
        message: 'Aucun abonnement actif trouvé' 
      });
    }

    // Annuler l'abonnement
    subscription.status = 'canceled';
    await subscription.save();

    // Mettre à jour l'utilisateur
    const user = await User.findById(userId);
    if (user) {
      user.role = 'user'; // Rétrograder au rôle de base
      user.dashboards = []; // Supprimer tous les dashboards
      await user.save();
    }

    console.log(`Abonnement révoqué pour l'utilisateur ${user?.email || userId}`);

    res.json({ 
      message: 'Abonnement révoqué avec succès',
      subscription: subscription
    });

  } catch (error) {
    console.error('Erreur lors de la révocation de l\'abonnement:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la révocation de l\'abonnement', 
      error: error.message 
    });
  }
},
// Get single pricing plan by ID
getPlanById: async (req, res) => {
  try {
    const plan = await PricingPlan.findById(req.params.id)
      .populate('dashboards', 'name _id url');
    
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    res.json({
      message: 'Plan retrieved successfully',
      plan
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error getting plan', 
      error: error.message 
    });
  }
},
// Méthode pour obtenir la liste des plans disponibles
getAvailablePlans: async (req, res) => {
  try {
    const plans = await PricingPlan.find({ isActive: true })
      .populate('dashboards', 'name _id')
      .sort('order');

    res.json({
      message: 'Plans récupérés avec succès',
      plans
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des plans', 
      error: error.message 
    });
  }
},
// Assign dashboards
// Dans adminController.js
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

      // Envoyer l'email de notification
      try {
        await emailService.sendDashboardAssignmentEmail(
          user.email,
          user.name,
          dashboardsForEmail
        );
        console.log(`Email d'assignation de dashboard envoyé à ${user.email}`);
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi de l\'email:', emailError);
        // On continue même si l'email échoue, mais on log l'erreur
      }

      res.json({
        message: 'Dashboards assigned successfully',
        dashboards: updatedUser.dashboards,
        emailSent: true // Indiquer que l'email a été tenté
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