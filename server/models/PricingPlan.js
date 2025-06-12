const mongoose = require('mongoose');

const pricingPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'MAD',
    enum: ['MAD', 'USD', 'EUR']
  },
  billingCycle: {
    type: String,
    default: 'monthly',
    enum: ['monthly', 'yearly']
  },
  features: [{
    text: String,
    available: Boolean
  }],
  stripePriceId: {
    type: String,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    required: true
  },
  dashboards: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dashboard'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PricingPlan', pricingPlanSchema);