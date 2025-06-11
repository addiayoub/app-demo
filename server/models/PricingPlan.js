const mongoose = require('mongoose');

const pricingPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['Basique', 'Pro', 'Entreprise']
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
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PricingPlan', pricingPlanSchema);