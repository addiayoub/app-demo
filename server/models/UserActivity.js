// models/UserActivity.js
const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dashboardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dashboard',
    required: false // Peut être null pour les activités générales
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PricingPlan',
    required: false // Pour tracker les activités liées aux plans
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: false // Pour lier à un abonnement spécifique
  },
  action: {
    type: String,
    enum: ['view', 'interact', 'download', 'share', 'login', 'logout', 'subscribe', 'cancel'],
    default: 'view'
  },
  activityType: {
    type: String,
    enum: ['dashboard', 'plan', 'general', 'subscription'],
    default: 'general'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // en secondes
    default: 0
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
userActivitySchema.index({ userId: 1, createdAt: -1 });
userActivitySchema.index({ dashboardId: 1, createdAt: -1 });
userActivitySchema.index({ planId: 1, createdAt: -1 });
userActivitySchema.index({ userId: 1, dashboardId: 1 });
userActivitySchema.index({ userId: 1, activityType: 1 });
userActivitySchema.index({ activityType: 1, createdAt: -1 });

// Méthode pour calculer automatiquement la durée avant sauvegarde
userActivitySchema.pre('save', function(next) {
  if (this.startTime && this.endTime && !this.duration) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  next();
});

module.exports = mongoose.model('UserActivity', userActivitySchema);