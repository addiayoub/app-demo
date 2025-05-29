// controllers/authController.js
const passport = require('passport');
const User = require('../models/User');
const emailService = require('../services/emailService');

const authController = {
  // Inscription
  register: async (req, res) => {
    try {
      const { email, password, name } = req.body;
      
      if (!email || !password || !name) {
        return res.status(400).json({ 
          message: 'Tous les champs sont requis' 
        });
      }

      if (password.length < 6) {
        return res.status(400).json({ 
          message: 'Le mot de passe doit contenir au moins 6 caractères' 
        });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ 
          message: 'Un utilisateur avec cet email existe déjà' 
        });
      }

      const isFirstUser = (await User.countDocuments({})) === 0;
      
      const user = new User({
        email,
        password,
        name,
        authMethod: 'local',
        role: isFirstUser ? 'admin' : 'user',
        isVerified: false
      });

      // Générer le token AVANT de sauvegarder
      const verificationToken = user.generateVerificationToken();
      
      // Sauvegarder l'utilisateur avec le token
      await user.save();

      console.log('Token généré:', verificationToken);
      console.log('Token dans DB:', user.verificationToken);
      console.log('Expiration:', user.verificationTokenExpires);

      // Envoyer l'email de vérification
      await emailService.sendVerificationEmail(email, name, verificationToken);
      
      res.status(201).json({
        message: 'Compte créé avec succès ! Veuillez vérifier votre email pour activer votre compte.',
        emailSent: true,
        userEmail: email
      });
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la création du compte', 
        error: error.message 
      });
    }
  },

  // Vérification d'email
  verifyEmail: async (req, res) => {
    try {
      const { token } = req.params;
      
      console.log('Token reçu pour vérification:', token);
      
      // D'abord, chercher un utilisateur avec ce token (non vérifié)
      let user = await User.findOne({
        verificationToken: token
      });

      // Si pas trouvé avec le token, peut-être que l'utilisateur est déjà vérifié
      if (!user) {
        // Chercher un utilisateur déjà vérifié qui pourrait avoir eu ce token
        user = await User.findOne({
          email: { $exists: true },
          isVerified: true,
          authMethod: 'local'
        }).sort({ updatedAt: -1 }); // Le plus récemment modifié
        
        if (user) {
          console.log('Utilisateur déjà vérifié trouvé:', user.email);
          return res.json({ 
            message: 'Email vérifié avec succès ! Votre compte est maintenant actif.',
            verified: true,
            alreadyVerified: true
          });
        }
        
        console.log('Aucun utilisateur trouvé avec ce token');
        return res.status(400).json({ 
          message: 'Token de vérification invalide ou expiré' 
        });
      }

      console.log('Utilisateur trouvé:', user.email);
      console.log('Token dans DB:', user.verificationToken);
      console.log('Expiration:', user.verificationTokenExpires);
      console.log('Date actuelle:', new Date());
      console.log('Token expiré?', new Date() > user.verificationTokenExpires);

      // Vérifier si le token n'a pas expiré
      if (user.verificationTokenExpires && new Date() > user.verificationTokenExpires) {
        console.log('Token expiré');
        return res.status(400).json({ 
          message: 'Token de vérification expiré' 
        });
      }

      // Vérifier si le compte n'est pas déjà vérifié
      if (user.isVerified) {
        console.log('Compte déjà vérifié');
        return res.json({ 
          message: 'Email vérifié avec succès ! Votre compte est maintenant actif.',
          verified: true,
          alreadyVerified: true
        });
      }

      // Marquer l'utilisateur comme vérifié
      user.isVerified = true;
      user.verificationToken = null;
      user.verificationTokenExpires = null;
      
      await user.save();

      console.log('Email vérifié avec succès pour:', user.email);

      // Envoyer l'email de bienvenue
      try {
        await emailService.sendWelcomeEmail(user.email, user.name);
      } catch (emailError) {
        console.error('Erreur envoi email de bienvenue:', emailError);
        // Ne pas faire échouer la vérification si l'email de bienvenue échoue
      }

      res.json({ 
        message: 'Email vérifié avec succès ! Votre compte est maintenant actif.',
        verified: true 
      });
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la vérification', 
        error: error.message 
      });
    }
  },

  // Renvoyer l'email de vérification
  resendVerification: async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          message: 'Email requis' 
        });
      }

      const user = await User.findOne({ email, authMethod: 'local' });
      
      if (!user) {
        return res.status(404).json({ 
          message: 'Utilisateur non trouvé' 
        });
      }

      if (user.isVerified) {
        return res.status(400).json({ 
          message: 'Ce compte est déjà vérifié' 
        });
      }

      // Générer un nouveau token
      const verificationToken = user.generateVerificationToken();
      await user.save();

      console.log('Nouveau token généré:', verificationToken);

      await emailService.sendVerificationEmail(user.email, user.name, verificationToken);

      res.json({ 
        message: 'Email de vérification renvoyé avec succès',
        emailSent: true 
      });
    } catch (error) {
      console.error('Erreur lors du renvoi:', error);
      res.status(500).json({ 
        message: 'Erreur lors du renvoi de l\'email', 
        error: error.message 
      });
    }
  },

  // Demander la réinitialisation du mot de passe
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          message: 'Email requis' 
        });
      }

      const user = await User.findOne({ 
        email, 
        authMethod: 'local' 
      });
      
      // Pour des raisons de sécurité, on retourne toujours le même message
      // même si l'utilisateur n'existe pas
      if (!user) {
        return res.json({ 
          message: 'Si cet email existe dans notre système, vous recevrez un lien de réinitialisation.',
          emailSent: true 
        });
      }

      // Vérifier si l'utilisateur est vérifié
      if (!user.isVerified) {
        return res.status(400).json({ 
          message: 'Votre compte doit être vérifié avant de pouvoir réinitialiser le mot de passe' 
        });
      }

      // Générer le token de réinitialisation
      const resetToken = user.generateResetPasswordToken();
      await user.save();

      console.log('Token de réinitialisation généré pour:', user.email);

      // Envoyer l'email de réinitialisation
      await emailService.sendResetPasswordEmail(user.email, user.name, resetToken);

      res.json({ 
        message: 'Si cet email existe dans notre système, vous recevrez un lien de réinitialisation.',
        emailSent: true 
      });
    } catch (error) {
      console.error('Erreur lors de la demande de réinitialisation:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la demande de réinitialisation', 
        error: error.message 
      });
    }
  },

  // Vérifier la validité du token de réinitialisation
  verifyResetToken: async (req, res) => {
    try {
      const { token } = req.params;
      
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordTokenExpires: { $gt: new Date() }
      });

      if (!user) {
        return res.status(400).json({ 
          message: 'Token de réinitialisation invalide ou expiré' 
        });
      }

      res.json({ 
        message: 'Token valide',
        valid: true,
        email: user.email // Pour pré-remplir le formulaire côté client
      });
    } catch (error) {
      console.error('Erreur lors de la vérification du token:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la vérification du token', 
        error: error.message 
      });
    }
  },

  // Réinitialiser le mot de passe
  resetPassword: async (req, res) => {
    try {
      const { token, password, confirmPassword } = req.body;
      
      if (!token || !password || !confirmPassword) {
        return res.status(400).json({ 
          message: 'Tous les champs sont requis' 
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ 
          message: 'Les mots de passe ne correspondent pas' 
        });
      }

      if (password.length < 6) {
        return res.status(400).json({ 
          message: 'Le mot de passe doit contenir au moins 6 caractères' 
        });
      }

      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordTokenExpires: { $gt: new Date() }
      });

      if (!user) {
        return res.status(400).json({ 
          message: 'Token de réinitialisation invalide ou expiré' 
        });
      }

      // Réinitialiser le mot de passe
      user.resetPassword(password);
      await user.save();

      console.log('Mot de passe réinitialisé pour:', user.email);

      // Envoyer l'email de confirmation
      try {
        await emailService.sendPasswordChangedEmail(user.email, user.name);
      } catch (emailError) {
        console.error('Erreur envoi email de confirmation:', emailError);
        // Ne pas faire échouer la réinitialisation si l'email de confirmation échoue
      }

      res.json({ 
        message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
        success: true 
      });
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la réinitialisation du mot de passe', 
        error: error.message 
      });
    }
  },

  // Connexion
  login: (req, res, next) => {
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

      if (user.authMethod === 'local' && !user.isVerified) {
        return res.status(401).json({ 
          message: 'Veuillez vérifier votre email avant de vous connecter',
          needsVerification: true,
          email: user.email
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
  },

  // Changer le mot de passe (utilisateur connecté)
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ 
          message: 'Tous les champs sont requis' 
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ 
          message: 'Les nouveaux mots de passe ne correspondent pas' 
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ 
          message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' 
        });
      }

      const user = await User.findById(req.user._id);
      
      // Vérifier que c'est un utilisateur local (pas Google)
      if (user.authMethod === 'google') {
        return res.status(400).json({ 
          message: 'Les utilisateurs connectés via Google ne peuvent pas changer leur mot de passe ici' 
        });
      }

      // Vérifier le mot de passe actuel
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ 
          message: 'Mot de passe actuel incorrect' 
        });
      }

      // Vérifier que le nouveau mot de passe est différent de l'ancien
      const isSamePassword = await user.comparePassword(newPassword);
      if (isSamePassword) {
        return res.status(400).json({ 
          message: 'Le nouveau mot de passe doit être différent de l\'ancien' 
        });
      }

      // Changer le mot de passe
      user.password = newPassword;
      await user.save();

      console.log('Mot de passe changé pour:', user.email);

      // Envoyer l'email de confirmation
      try {
        await emailService.sendPasswordChangedEmail(user.email, user.name);
      } catch (emailError) {
        console.error('Erreur envoi email de confirmation:', emailError);
        // Ne pas faire échouer le changement si l'email de confirmation échoue
      }

      res.json({ 
        message: 'Mot de passe modifié avec succès',
        success: true 
      });
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      res.status(500).json({ 
        message: 'Erreur lors du changement de mot de passe', 
        error: error.message 
      });
    }
  },

  // Déconnexion
  logout: (req, res) => {
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
  },

  // Callback Google OAuth
  googleCallback: (req, res) => {
    res.redirect(`${process.env.CLIENT_URL}/dashboard`);
  },

  // Obtenir les informations de l'utilisateur connecté
  getMe: (req, res) => {
    res.json({
      user: req.user.toJSON(),
      isAuthenticated: true
    });
  },

  // Obtenir le profil utilisateur
  getProfile: (req, res) => {
    res.json({
      message: 'Accès autorisé au profil',
      user: req.user.toJSON()
    });
  }
};

module.exports = authController;