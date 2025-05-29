// routes/auth.js
const express = require('express');
const passport = require('passport');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const authController = require('../controllers/authController');

// Routes d'authentification
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Routes de vérification d'email
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);

// Routes de réinitialisation de mot de passe
router.post('/forgot-password', authController.forgotPassword);
router.get('/reset-password/:token', authController.verifyResetToken);
router.post('/reset-password', authController.resetPassword);

// Route pour changer le mot de passe (utilisateur connecté)
router.post('/change-password', isAuthenticated, authController.changePassword);

// Routes Google OAuth
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.CLIENT_URL}/login?error=google_auth_failed` 
  }),
  authController.googleCallback
);

// Routes protégées
router.get('/me', isAuthenticated, authController.getMe);
router.get('/profile', isAuthenticated, authController.getProfile);

module.exports = router;