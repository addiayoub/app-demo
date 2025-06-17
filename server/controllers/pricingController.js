const PricingPlan = require('../models/PricingPlan');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Dashboard = require('../models/Dashboard');
const EmailService = require('../services/emailService');

exports.getPlans = async (req, res) => {
  try {
    const plans = await PricingPlan.find({ isActive: true })
      .populate('dashboards', 'name _id') // Populate dashboard names and IDs
      .sort('order');
    res.json({ success: true, plans });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createSubscription = async (req, res) => {
  try {
    const { planId, paymentMethodId } = req.body;
    const userId = req.user._id;

    // 1. Get the plan
    const plan = await PricingPlan.findById(planId).populate('dashboards');
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    // 2. Get the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // 3. Create Stripe customer if not exists - COMMENTED OUT
    /*
    let customer;
    if (!user.stripeCustomerId) {
      customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
      user.stripeCustomerId = customer.id;
      await user.save();
    } else {
      customer = { id: user.stripeCustomerId };
    }

    // 4. Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: plan.stripePriceId }],
      expand: ['latest_invoice.payment_intent']
    });
    */

    // MOCK SUBSCRIPTION DATA - Remove when Stripe is enabled
    const mockSubscription = {
      id: 'sub_mock_' + Date.now(),
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
      latest_invoice: {
        payment_intent: {
          client_secret: 'pi_mock_client_secret'
        }
      }
    };

    // 5. Save to database
    const newSubscription = new Subscription({
      user: userId,
      plan: planId,
      stripeSubscriptionId: mockSubscription.id,
      status: mockSubscription.status,
      currentPeriodStart: new Date(mockSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(mockSubscription.current_period_end * 1000),
      dashboards: plan.dashboards.map(d => d._id) // Assign dashboards from the plan
    });
    await newSubscription.save();

    // 6. Update user role based on plan
    if (plan.name === 'Pro') {
      user.role = 'pro';
    } else if (plan.name === 'Entreprise') {
      user.role = 'enterprise';
    }
    // Assign dashboards to user
user.allowedDashboards = [...(user.allowedDashboards || []), ...plan.dashboards.map(d => d._id)];    await user.save();

    res.json({
      success: true,
      subscriptionId: mockSubscription.id,
      clientSecret: mockSubscription.latest_invoice.payment_intent.client_secret,
      status: mockSubscription.status,
      message: 'Mock subscription created - Stripe disabled'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    const subscription = await Subscription.findOne({ 
      user: userId,
      status: 'active'
    });

    if (!subscription) {
      return res.status(404).json({ success: false, error: 'No active subscription found' });
    }

    // Cancel immediately - STRIPE CALL COMMENTED OUT
    // await stripe.subscriptions.del(subscription.stripeSubscriptionId);

    // Or cancel at period end - STRIPE CALL COMMENTED OUT
    // const canceledSubscription = await stripe.subscriptions.update(
    //   subscription.stripeSubscriptionId,
    //   { cancel_at_period_end: true }
    // );

    subscription.status = 'canceled';
    await subscription.save();

    // Downgrade user role and remove assigned dashboards
    user.role = 'user';
user.allowedDashboards = user.allowedDashboards || [];
    await user.save();

    res.json({ 
      success: true, 
      message: 'Subscription canceled (Mock - Stripe disabled)' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getUserSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user._id })
      .populate({
        path: 'plan',
        populate: {
          path: 'dashboards',
          select: 'name url description active isPublic categories createdAt updatedAt',
          populate: {
            path: 'categories',
            select: 'name'
          }
        }
      })
      .populate({
        path: 'dashboards',
        select: 'name url description active isPublic categories createdAt updatedAt',
        populate: {
          path: 'categories',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 });

    if (!subscription) {
      return res.json({ success: true, hasSubscription: false });
    }

    res.json({ success: true, hasSubscription: true, subscription });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
exports.createPortalSession = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // STRIPE PORTAL COMMENTED OUT
    /*
    if (!user.stripeCustomerId) {
      return res.status(400).json({ error: 'No customer ID found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL}/account`
    });

    res.json({ url: session.url });
    */

    // MOCK PORTAL SESSION
    res.json({ 
      url: '#', 
      message: 'Portal disabled - Stripe not configured',
      success: false 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
// Créer un nouveau plan
// Ajoutez cette méthode au contrôleur
exports.startTrial = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user._id;

    // 1. Vérifier le plan
    const plan = await PricingPlan.findById(planId).populate('dashboards');
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    // 2. Vérifier l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // 3. Vérifier si l'utilisateur a déjà un abonnement actif
    const existingActiveSubscription = await Subscription.findOne({ 
      user: userId,
      status: 'active'
    });

    if (existingActiveSubscription) {
      return res.status(400).json({ 
        success: false, 
        error: 'Vous avez déjà un abonnement actif' 
      });
    }

    // 4. Vérifier si l'utilisateur a déjà utilisé un essai pour ce plan
    const existingPlanTrial = await Subscription.findOne({
      user: userId,
      plan: planId,
      isTrial: true
    });

    if (existingPlanTrial) {
      return res.status(400).json({
        success: false,
        error: 'Vous avez déjà utilisé votre essai gratuit pour ce plan'
      });
    }

    // 5. Vérifier si l'utilisateur a déjà utilisé un essai pour n'importe quel plan
    const anyTrialUsed = await Subscription.findOne({
      user: userId,
      isTrial: true
    });

    if (anyTrialUsed) {
      return res.status(400).json({
        success: false,
        error: 'Vous avez déjà utilisé votre essai gratuit (un seul essai autorisé)'
      });
    }

    // 6. Créer un abonnement d'essai
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14); // Essai de 14 jours

    const newSubscription = new Subscription({
      user: userId,
      plan: planId,
      stripeSubscriptionId: `trial_${Date.now()}`,
      status: 'trialing',
      currentPeriodStart: new Date(),
      currentPeriodEnd: trialEndDate,
      dashboards: plan.dashboards.map(d => d._id),
      isTrial: true,
      trialUsed: true
    });

    await newSubscription.save();

    // 7. Mettre à jour le rôle de l'utilisateur
    if (plan.name === 'Pro') {
      user.role = 'pro';
    } else if (plan.name === 'Entreprise') {
      user.role = 'enterprise';
    }
    
    // Assigner les dashboards à l'utilisateur
    user.allowedDashboards = [...new Set([...(user.allowedDashboards || []), ...plan.dashboards.map(d => d._id)])];
    await user.save();
    // 6. Envoyer les emails de notification
    
    // Email à l'utilisateur
    await EmailService.sendPlanAssignmentEmail(
      user.email,
      user.name,
      plan,
      plan.dashboards
    );

    // Email aux administrateurs
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await EmailService.sendAdminTrialNotification(
        admin.email,
        admin.name,
        user,
        plan
      );
    }

    res.json({
      success: true,
      message: 'Essai démarré avec succès',
      subscription: newSubscription
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
exports.createPlan = async (req, res) => {
  try {
    const { name, price, currency, billingCycle, features, dashboards, isActive } = req.body;

    // Validation de base
    if (!name || !price || !billingCycle) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, price, and billing cycle are required' 
      });
    }

    // Vérifier si le nom existe déjà
    const existingPlan = await PricingPlan.findOne({ name });
    if (existingPlan) {
      return res.status(400).json({
        success: false,
        error: 'A plan with this name already exists'
      });
    }

    // Auto-générer l'ordre si non fourni
    if (!req.body.order) {
      const highestOrderPlan = await PricingPlan.findOne()
        .sort('-order')
        .select('order');
      req.body.order = highestOrderPlan ? highestOrderPlan.order + 1 : 1;
    }

    // Créer le plan
    const newPlan = new PricingPlan({
      name,
      price,
      currency: currency || 'MAD',
      billingCycle,
      features: features || [],
      dashboards: dashboards || [],
      isActive: isActive !== undefined ? isActive : true,
      order: req.body.order,
      stripePriceId: req.body.stripePriceId || `mock_price_${Date.now()}`
    });

    await newPlan.save();

    res.status(201).json({ 
      success: true, 
      plan: newPlan 
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
// Mettre à jour un plan
exports.updatePlan = async (req, res) => {
  try {
    const plan = await PricingPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('dashboards', 'name _id');
    
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }
    
    res.json({ success: true, plan });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Supprimer un plan
exports.deletePlan = async (req, res) => {
  try {
    const plan = await PricingPlan.findByIdAndDelete(req.params.id);
    
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }
    
    // Supprimer les références dans les abonnements
    await Subscription.deleteMany({ plan: req.params.id });
    
    res.json({ success: true, message: 'Plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
// New method to assign dashboards to a pricing plan
exports.assignDashboardsToPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const { dashboardIds } = req.body;

    // Verify plan exists
    const plan = await PricingPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    // Verify all dashboard IDs exist and are active
    const dashboards = await Dashboard.find({
      _id: { $in: dashboardIds },
      active: true
    });
    if (dashboards.length !== dashboardIds.length) {
      return res.status(400).json({ success: false, error: 'Some dashboards are invalid or inactive' });
    }

    // Assign dashboards to plan
    plan.dashboards = dashboardIds;
    await plan.save();

    // Update existing subscriptions to reflect new dashboards
    const subscriptions = await Subscription.find({ plan: planId, status: 'active' });
    for (const subscription of subscriptions) {
      subscription.dashboards = dashboardIds;
      await subscription.save();

      // Update user allowedDashboards
      const user = await User.findById(subscription.user);
      if (user) {
user.allowedDashboards = [...new Set([...(user.allowedDashboards || []), ...dashboardIds])];
        await user.save();
      }
    }

    const updatedPlan = await PricingPlan.findById(planId).populate('dashboards', 'name _id');
    res.json({
      success: true,
      message: 'Dashboards assigned to plan successfully',
      plan: updatedPlan
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};