const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const User = require('../models/User');

// IMPORTANT: Routes spécifiques doivent être définies AVANT les routes avec paramètres

// Route publique (SANS authentification) - doit être en premier
router.get('/public', dashboardController.getPublicDashboards);
router.get('/my-dashboards', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('dashboards');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.status(200).json({ dashboards: user.dashboards });
  } catch (error) {
    console.error('Erreur lors de la récupération des tableaux de bord:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
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