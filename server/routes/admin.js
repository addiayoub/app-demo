const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const multer = require('multer');

// Configuration Multer pour l'upload de fichiers
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
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5 Mo
});

// Toutes les routes admin nécessitent une authentification et des droits admin
router.use(isAuthenticated, isAdmin);

// Routes de gestion des utilisateurs
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.post('/users/:id/avatar', upload.single('avatar'), adminController.uploadAvatar); // Nouvelle route
// Dashboard assignment routes
router.get('/users/:userId/dashboards', isAuthenticated, isAdmin, adminController.getUserDashboards);
router.post('/users/:userId/assign', isAuthenticated, isAdmin, adminController.assignDashboards);
router.post('/users/:userId/unassign', isAuthenticated, isAdmin, adminController.unassignDashboards);

// Routes de statistiques et recherche
router.get('/stats', adminController.getUserStats);
router.get('/search', adminController.searchUsers);

module.exports = router;