
// routes/adminTicketRoutes.js
const express = require('express');
const router = express.Router();
const adminTicketController = require('../controllers/adminTicketController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Toutes les routes nécessitent une authentification et des droits admin
router.use(isAuthenticated, isAdmin);

// IMPORTANT: Routes spécifiques AVANT les routes avec paramètres
router.get('/stats', adminTicketController.getStats);
router.get('/search', adminTicketController.searchTickets);

// Routes avec paramètres (doivent venir après les routes spécifiques)
router.get('/', adminTicketController.getAllTickets);
router.get('/:id', adminTicketController.getTicket);
router.post('/:id/reply', adminTicketController.addReply);
router.put('/:id/status', adminTicketController.updateStatus);
router.put('/:id/assign', adminTicketController.assignTicket);
router.delete('/:id', adminTicketController.deleteTicket);

module.exports = router;