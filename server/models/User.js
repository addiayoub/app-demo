  const mongoose = require('mongoose');
  const bcrypt = require('bcryptjs');
  const crypto = require('crypto');

  const userSchema = new mongoose.Schema({
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: function() {
        return !this.googleId;
      }
    },
    name: {
      type: String,
      required: true
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true
    },
    avatar: {
      type: String,
      default: function() {
        // Générer un avatar aléatoire avec DiceBear
        const randomSeed = Math.random().toString(36).substring(2);
        return `https://api.dicebear.com/7.x/initials/svg?seed=${randomSeed}`;
      }},
    authMethod: {
      type: String,
      enum: ['local', 'google'],
      required: true
    },
    isVerified: {
      type: Boolean,
      default: function() {
        // Les utilisateurs Google sont automatiquement vérifiés
        return this.authMethod === 'google';
      }
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    dashboards: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dashboard',
    default: []
  }],
  // Ajoutez aussi un champ pour les permissions spéciales si nécessaire
  permissions: {
    type: Map,
    of: String,
    default: {}
  },
    // Token de vérification d'email
    verificationToken: {
      type: String,
      default: null
    },
    // Expiration du token de vérification d'email
    verificationTokenExpires: {
      type: Date,
      default: null
    },
    // Token de réinitialisation de mot de passe
    resetPasswordToken: {
      type: String,
      default: null
    },
    // Expiration du token de réinitialisation
    resetPasswordTokenExpires: {
      type: Date,
      default: null
    }
  }, {
    timestamps: true
  });

  userSchema.pre('save', async function(next) {
    if (!this.isModified('password') || !this.password) return next();
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (error) {
      next(error);
    }
  });

  userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
  };

  // Méthode pour générer un token de vérification d'email
  userSchema.methods.generateVerificationToken = function() {
    this.verificationToken = crypto.randomBytes(40).toString('hex');
    this.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return this.verificationToken;
  };

  // Méthode pour vérifier si le token de vérification est valide
  userSchema.methods.isVerificationTokenValid = function(token) {
    if (!this.verificationToken || !this.verificationTokenExpires) {
      return false;
    }
    
    if (this.verificationToken !== token) {
      return false;
    }
    
    if (new Date() > this.verificationTokenExpires) {
      return false;
    }
    
    return true;
  };

  // Méthode pour générer un token de réinitialisation de mot de passe
  userSchema.methods.generateResetPasswordToken = function() {
    this.resetPasswordToken = crypto.randomBytes(40).toString('hex');
    // Token valide pendant 1 heure
    this.resetPasswordTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
    return this.resetPasswordToken;
  };

  // Méthode pour vérifier si le token de réinitialisation est valide
  userSchema.methods.isResetPasswordTokenValid = function(token) {
    if (!this.resetPasswordToken || !this.resetPasswordTokenExpires) {
      return false;
    }
    
    if (this.resetPasswordToken !== token) {
      return false;
    }
    
    if (new Date() > this.resetPasswordTokenExpires) {
      return false;
    }
    
    return true;
  };

  // Méthode pour réinitialiser le mot de passe
  userSchema.methods.resetPassword = function(newPassword) {
    this.password = newPassword;
    this.resetPasswordToken = null;
    this.resetPasswordTokenExpires = null;
  };

  userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    delete user.verificationToken;
    delete user.verificationTokenExpires;
    delete user.resetPasswordToken;
    delete user.resetPasswordTokenExpires;
    delete user.__v;
    return user;
  };
  // Méthode pour mettre à jour le profil
  userSchema.methods.updateProfile = async function(updates) {
    const allowedUpdates = ['name', 'email', 'avatar', 'password'];
    const updatesToApply = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updatesToApply[key] = updates[key];
      }
    });

    Object.assign(this, updatesToApply);
    await this.save();
    return this;
  };
  module.exports = mongoose.model('User', userSchema);