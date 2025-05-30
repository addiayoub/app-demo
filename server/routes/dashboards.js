const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Routes publiques (nécessitent seulement une authentification)
router.get('/', isAuthenticated, dashboardController.getAllDashboards);
router.get('/stats', isAuthenticated, dashboardController.getDashboardStats);
router.get('/:id', isAuthenticated, dashboardController.getDashboardById);

// Routes de modification (création, mise à jour, suppression)
router.post('/', isAuthenticated, dashboardController.createDashboard);
router.put('/:id', isAuthenticated, dashboardController.updateDashboard);
router.delete('/:id', isAuthenticated, dashboardController.deleteDashboard);

// Route pour activer/désactiver un dashboard
router.patch('/:id/toggle-status', isAuthenticated, dashboardController.toggleDashboardStatus);
router.patch('/:id/toggle-public', isAuthenticated, dashboardController.togglePublicStatus);
module.exports = router;