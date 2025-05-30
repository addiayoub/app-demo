const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// IMPORTANT: Routes spécifiques doivent être définies AVANT les routes avec paramètres

// Route publique (SANS authentification) - doit être en premier
router.get('/public', dashboardController.getPublicDashboards);

// Routes publiques (nécessitent seulement une authentification)
router.get('/', isAuthenticated, dashboardController.getAllDashboards);
router.get('/stats', isAuthenticated, dashboardController.getDashboardStats);

// Routes de modification (création, mise à jour, suppression)
router.post('/', isAuthenticated, dashboardController.createDashboard);
router.put('/:id', isAuthenticated, dashboardController.updateDashboard);
router.delete('/:id', isAuthenticated, dashboardController.deleteDashboard);

// Route pour activer/désactiver un dashboard
router.patch('/:id/toggle-status', isAuthenticated, dashboardController.toggleDashboardStatus);
router.patch('/:id/toggle-public', isAuthenticated, dashboardController.togglePublicStatus);

// Route avec paramètre ID (doit être en DERNIER)
router.get('/:id', isAuthenticated, dashboardController.getDashboardById);

module.exports = router;