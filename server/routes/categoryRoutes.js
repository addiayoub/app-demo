// categoryRoutes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Route publique pour les noms des catégories (SANS authentification)
router.get('/public-names', categoryController.getCategoryNames);

// Routes publiques avec authentification
router.get('/', isAuthenticated, categoryController.getAllCategories);
router.get('/:id', isAuthenticated, categoryController.getCategoryById);
router.get('/:id/dashboards', isAuthenticated, categoryController.getCategoryDashboards);

// Routes de modification (nécessitent authentification)
router.post('/', isAuthenticated, categoryController.createCategory);
router.put('/:id', isAuthenticated, categoryController.updateCategory);
router.delete('/:id', isAuthenticated, categoryController.deleteCategory);

// Gestion des dashboards dans les catégories
router.post('/:categoryId/dashboards/:dashboardId', isAuthenticated, categoryController.addDashboardToCategory);
router.delete('/:categoryId/dashboards/:dashboardId', isAuthenticated, categoryController.removeDashboardFromCategory);

module.exports = router;