const express = require('express');
const router = express.Router(); // Corrected syntax: removed incorrect '{'
const { isAuthenticated } = require('../middleware/auth');
const pricingController = require('../controllers/pricingController');

// Routes publiques
router.get('/plans', pricingController.getPlans);

// Routes protégées
router.post('/create-subscription', isAuthenticated, pricingController.createSubscription);
router.post('/cancel-subscription', isAuthenticated, pricingController.cancelSubscription); // Fixed: cancel -> cancelSubscription
router.get('/user-subscription', isAuthenticated, pricingController.getUserSubscription);
router.post('/create-portal-session', isAuthenticated, pricingController.createPortalSession); // Fixed: create -> createPortalSession
router.post('/assign-dashboards/:planId', isAuthenticated, pricingController.assignDashboardsToPlan); // Fixed method name for consistency
// Ajoutez ces nouvelles routes
router.post('/plans', isAuthenticated, pricingController.createPlan);
router.put('/plans/:id', isAuthenticated, pricingController.updatePlan);
router.delete('/plans/:id', isAuthenticated, pricingController.deletePlan);
module.exports = router;