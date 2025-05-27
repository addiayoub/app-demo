const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const router = express.Router();

// Middleware pour vérifier l'authentification
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Non authentifié' });
};

// Inscription locale
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Un utilisateur avec cet email existe déjà' 
      });
    }

    // Créer un nouvel utilisateur
    const user = new User({
      email,
      password,
      name,
      authMethod: 'local'
    });

    await user.save();

    // Connecter automatiquement l'utilisateur après inscription
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ 
          message: 'Erreur lors de la connexion automatique' 
        });
      }
      res.status(201).json({
        message: 'Utilisateur créé avec succès',
        user: user.toJSON()
      });
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erreur lors de la création du compte',
      error: error.message 
    });
  }
});

// Connexion locale
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({ 
        message: 'Erreur serveur',
        error: err.message 
      });
    }
    
    if (!user) {
      return res.status(401).json({ 
        message: info.message || 'Identifiants invalides' 
      });
    }

    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ 
          message: 'Erreur lors de la connexion' 
        });
      }
      
      res.json({
        message: 'Connexion réussie',
        user: user.toJSON()
      });
    });
  })(req, res, next);
});

// Déconnexion
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ 
        message: 'Erreur lors de la déconnexion' 
      });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ 
          message: 'Erreur lors de la destruction de session' 
        });
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Déconnexion réussie' });
    });
  });
});

// Authentification Google - Redirection
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

// Callback Google
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.CLIENT_URL}/login?error=google_auth_failed` 
  }),
  (req, res) => {
    // Redirection vers le frontend en cas de succès
    res.redirect(`${process.env.CLIENT_URL}/dashboard`);
  }
);

// Vérifier l'état de l'authentification
router.get('/me', isAuthenticated, (req, res) => {
  res.json({
    user: req.user.toJSON(),
    isAuthenticated: true
  });
});

// Route protégée (exemple)
router.get('/profile', isAuthenticated, (req, res) => {
  res.json({
    message: 'Accès autorisé au profil',
    user: req.user.toJSON()
  });
});

module.exports = router;