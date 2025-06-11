const PricingPlan = require('../models/PricingPlan');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.getPlans = async (req, res) => {
  try {
    const plans = await PricingPlan.find({ isActive: true }).sort('order');
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
    const plan = await PricingPlan.findById(planId);
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
      currentPeriodEnd: new Date(mockSubscription.current_period_end * 1000)
    });
    await newSubscription.save();

    // 6. Update user role based on plan
    if (plan.name === 'Pro') {
      user.role = 'pro';
    } else if (plan.name === 'Entreprise') {
      user.role = 'enterprise';
    }
    await user.save();

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

    // Downgrade user role
    user.role = 'user';
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
      .populate('plan')
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
    res.status(500).json({ error: error.message });
  }
};