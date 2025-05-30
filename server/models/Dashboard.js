const mongoose = require('mongoose');

const dashboardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^(https?:\/\/)?(app\.powerbi\.com|.*\.powerbi\.com).*$/i.test(v);
      },
      message: props => `${props.value} n'est pas une URL Power BI valide!`
    }
  },
    active: {
    type: Boolean,
    default: true  // Par défaut, le dashboard est actif
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
   isPublic: {
    type: Boolean,
    default: false
  },
  allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Mise à jour de la date de modification avant sauvegarde
dashboardSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Dashboard = mongoose.model('Dashboard', dashboardSchema);

module.exports = Dashboard;