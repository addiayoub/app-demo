// routes/admin.js
const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const adminTicketController = require('../controllers/adminTicketController');
const multer = require('multer');

// Configuration Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});
// Nouvelles routes pour les activités
router.get('/users/:userId/activities', adminController.getUserActivities);
router.get('/users/:userId/activity-summary', adminController.getActivitySummary);

// Routes pour les statistiques de dashboard
router.get('/dashboards/:dashboardId/usage-stats', adminController.getDashboardUsageStats);

// Nouvelle route pour les statistiques de plan
router.get('/plans/:planId/usage-stats', adminController.getPlanUsageStats);

// Toutes les routes admin nécessitent une authentification et des droits admin
router.use(isAuthenticated, isAdmin);

// Routes spécifiques pour les tickets (AVANT les routes avec paramètres)
router.get('/tickets/stats', adminTicketController.getStats);
router.get('/tickets/search', adminTicketController.searchTickets);
router.get('/tickets', adminTicketController.getAllTickets);

// Routes avec paramètres pour les tickets
router.get('/tickets/:id', adminTicketController.getTicket);
router.post('/tickets/:id/reply', adminTicketController.addReply);
router.put('/tickets/:id/status', adminTicketController.updateStatus);
router.put('/tickets/:id/assign', adminTicketController.assignTicket);
router.delete('/tickets/:id', adminTicketController.deleteTicket);

// Routes de gestion des utilisateurs
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.post('/users/:id/avatar', upload.single('avatar'), adminController.uploadAvatar);

// Routes pour les activités utilisateur (NOUVELLES ROUTES)
router.get('/users/:userId/activities', adminController.getUserActivities);
router.get('/users/:userId/subscription', adminController.getUserSubscription);
router.post('/users/:userId/revoke-subscription', adminController.revokeUserSubscription);

// Routes pour les statistiques de dashboard
router.get('/dashboards/:dashboardId/usage-stats', adminController.getDashboardUsageStats);

// Dashboard assignment routes
router.get('/users/:userId/dashboards', adminController.getUserDashboards);
router.get('/users/:userId/active-dashboards', adminController.getActiveDashboards);
router.post('/users/:userId/assign', adminController.assignDashboards);
router.post('/users/:userId/unassign', adminController.unassignDashboards);

// Routes pour l'assignation des plans
router.get('/plans', adminController.getAvailablePlans);
router.get('/plans/:id', adminController.getPlanById);
router.post('/users/:userId/assign-plan', adminController.assignPlanToUser);
router.get('/users/:userId/plans', adminController.getUserPlans);
router.post('/users/:userId/cancel-plan', adminController.cancelPlan);

// Routes de statistiques et recherche
router.get('/stats', adminController.getUserStats);
router.get('/search', adminController.searchUsers);

module.exports = router;