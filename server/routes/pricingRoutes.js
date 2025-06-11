const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const pricingController = require('../controllers/pricingController');

// Routes publiques
router.get('/plans', pricingController.getPlans);

// Routes protégées
router.post('/create-subscription', isAuthenticated, pricingController.createSubscription);
router.post('/cancel-subscription', isAuthenticated, pricingController.cancelSubscription);
router.get('/user-subscription', isAuthenticated, pricingController.getUserSubscription);
router.post('/create-portal-session', isAuthenticated, pricingController.createPortalSession);

module.exports = router;    