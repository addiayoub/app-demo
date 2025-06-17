import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheck, FaCrown, FaRocket, FaLightbulb, FaGem, FaStar, FaSyncAlt } from 'react-icons/fa';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getPlans, createSubscription, getUserSubscription, startTrialSubscription } from '../services/pricingService';
import { useAuth } from '../Auth/AuthContext';
import CustomLoader from '../CustomLoader/CustomLoader';
import axios from 'axios';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ plan, onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!stripe || !elements) {
      return;
    }

    try {
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
      });

      if (stripeError) {
        setError(stripeError.message);
        setLoading(false);
        return;
      }

      const { success, clientSecret } = await createSubscription(plan._id, paymentMethod.id, token);

      if (success && clientSecret) {
        const { error: confirmError } = await stripe.confirmCardPayment(clientSecret);
        
        if (confirmError) {
          setError(confirmError.message);
        } else {
          onSuccess();
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form 
      onSubmit={handleSubmit} 
      className="space-y-4"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
    >
      <CardElement 
        className="p-3 border border-gray-200 rounded-lg bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-200" 
      />
      {error && (
        <motion.div 
          className="text-red-500 text-sm p-2 bg-red-50 rounded"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}
      <div className="flex justify-between pt-4">
        <motion.button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 cursor-pointer hover:bg-gray-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Annuler
        </motion.button>
        <motion.button
          type="submit"
          disabled={!stripe || loading}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md hover:from-blue-700 hover:to-indigo-700 disabled:bg-gray-300 disabled:bg-none"
          whileHover={{ scale: !stripe || loading ? 1 : 1.05 }}
          whileTap={{ scale: !stripe || loading ? 1 : 0.98 }}
        >
          {loading ? 'Traitement...' : `Payer ${plan.price} ${plan.currency}`}
        </motion.button>
      </div>
    </motion.form>
  );
};

const PlanBadge = ({ isRecommended, isPopular, isBestValue }) => {
  if (!isRecommended && !isPopular && !isBestValue) return null;

  let text = '';
  let bgClass = '';
  let icon = null;

  if (isRecommended) {
    text = 'Recommandé';
    bgClass = 'from-purple-600 to-blue-600';
    icon = <FaStar className="mr-1" />;
  } else if (isPopular) {
    text = 'Populaire';
    bgClass = 'from-pink-600 to-red-600';
    icon = <FaRocket className="mr-1" />;
  } else if (isBestValue) {
    text = 'Meilleur rapport';
    bgClass = 'from-green-600 to-teal-600';
    icon = <FaGem className="mr-1" />;
  }

  return (
    <motion.div 
      className={`absolute top-4 right-4 bg-gradient-to-r ${bgClass} text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
    >
      {icon}
      <span>{text}</span>
    </motion.div>
  );
};


const PricingSection = ({ onOpenAuthModal = () => {} }) => {
  const [plans, setPlans] = useState([]);
  const [dashboards, setDashboards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSubscription, setUserSubscription] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [expandedCategories, setExpandedCategories] = useState({});
  const { isAuthenticated, token } = useAuth();
   useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansResponse, dashboardsResponse, categoriesResponse, subscriptionResponse] = await Promise.all([
          getPlans(),
          axios.get('/api/dashboards/public-names'),
          axios.get('/api/categories/public-names'),
          isAuthenticated ? getUserSubscription(token) : Promise.resolve(null)
        ]);
        
        setPlans(plansResponse.plans);
        setDashboards(dashboardsResponse.data?.data || dashboardsResponse.data || []);
        setCategories(categoriesResponse.data?.data || categoriesResponse.data || []);
        
        if (subscriptionResponse) {
          setUserSubscription(subscriptionResponse.subscription || null);
        }
      } catch (error) {
        console.error('Error fetching pricing data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, token]);

  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleSubscriptionSuccess = async () => {
    if (isAuthenticated) {
      try {
        const response = await getUserSubscription(token);
        setUserSubscription(response.subscription || null);
      } catch (error) {
        console.error('Error fetching updated subscription:', error);
      }
    }
  };

  const filteredPlans = plans.filter(plan => plan.billingCycle === billingCycle);

  const toggleBillingCycle = () => {
    setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly');
  };

  if (loading) {
    return <CustomLoader/>;
  }
const PricingCard = ({ plan, isRecommended, isPopular, isBestValue, userSubscription, onSubscribe ,  onOpenAuthModal // Ajoutez cette prop
}) => {
  const [showCheckout, setShowCheckout] = useState(false);
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const isCurrentPlan = userSubscription?.plan?._id === plan._id;
  const isSubscribed = userSubscription && userSubscription.status === 'active';
  const { isAuthenticated, token } = useAuth();

 const handleStartTrial = async () => {
  if (!isAuthenticated) {
    onOpenAuthModal('login');
    return;
  }

  setIsStartingTrial(true);
  try {
    const response = await startTrialSubscription(plan._id, token);
    
    if (response.success) {
      onSubscribe();
      // Afficher une notification de succès
    } else {
      // Afficher l'erreur retournée par l'API
      alert(response.error || "Échec du démarrage de l'essai");
    }
  } catch (error) {
    console.error('Failed to start trial:', error);
    alert("Une erreur s'est produite");
  } finally {
    setIsStartingTrial(false);
  }
};

  // Calculate yearly savings if monthly plan exists
  const yearlySavings = plan.billingCycle === 'yearly' 
  ? `Économisez ${Math.round((1 - (plan.price / (plan.price * 12))) * 100)}%` 
  : null;
const handleSubscribeClick = () => {
    if (!isAuthenticated) {
      onOpenAuthModal('login'); // Ouvrir le modal de connexion
      return;
    }
    setShowCheckout(true); // Afficher le formulaire de paiement si authentifié
  };
  return (
    <motion.div 
      className={`relative rounded-2xl overflow-hidden border-2 ${
        isRecommended ? 'border-purple-500 shadow-xl' : 
        isPopular ? 'border-pink-500 shadow-xl' :
        isBestValue ? 'border-green-500 shadow-xl' :
        'border-gray-200'
      } bg-white hover:shadow-2xl transition-all duration-300 h-full flex flex-col`}
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <PlanBadge isRecommended={isRecommended} isPopular={isPopular} isBestValue={isBestValue} />

      <div className="p-8 flex flex-col flex-grow">
        <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-white to-gray-100 rounded-xl shadow-sm mb-6 text-3xl">
          {plan.name === 'Basique' && <FaLightbulb className="text-yellow-500" />}
          {plan.name === 'Pro' && <FaRocket className="text-purple-500" />}
          {plan.name === 'Entreprise' && <FaCrown className="text-yellow-400" />}
        </div>

        <h3 className="text-3xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        
        <div className="flex items-end mb-2">
          <span className="text-5xl font-extrabold text-gray-900">{plan.price}</span>
          <span className="text-gray-500 ml-2 mb-1 text-xl">{plan.currency}/{plan.billingCycle === 'monthly' ? 'mois' : 'an'}</span>
        </div>

        {yearlySavings && (
          <motion.div 
            className="text-sm text-green-600 mb-4 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {yearlySavings}
          </motion.div>
        )}
        
        <p className="text-gray-600 mb-8 text-lg">{plan.description}</p>
        
                <div className="mb-4">
            <h4 className="font-semibold text-gray-800 mb-2">Dashboards inclus :</h4>
            <div className="space-y-3">
              {categories
                .filter(category => {
                  // Check if at least one dashboard in this category is included in the plan
                  return plan.dashboards?.some(planDashboard => {
                    const dashboardId = typeof planDashboard === 'object' ? planDashboard._id : planDashboard;
                    const fullDashboard = dashboards.find(db => db._id === dashboardId);
                    
                    return fullDashboard?.categories?.some(cat => {
                      const categoryId = typeof cat === 'object' ? cat._id : cat;
                      return categoryId === category._id;
                    });
                  });
                })
                .map(category => {
                  const count = plan.dashboards?.filter(planDashboard => {
                    const dashboardId = typeof planDashboard === 'object' ? planDashboard._id : planDashboard;
                    const fullDashboard = dashboards.find(db => db._id === dashboardId);
                    
                    return fullDashboard?.categories?.some(cat => {
                      const categoryId = typeof cat === 'object' ? cat._id : cat;
                      return categoryId === category._id;
                    });
                  }).length || 0;

                  return (
                    <div key={category._id} className="flex items-center text-sm text-gray-600">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></span>
                      {category.name} <span className="ml-1 text-gray-500">({count})</span>
                    </div>
                  );
                })}
              
              {/* Show uncategorized dashboards if any */}
              {(() => {
                const uncategorizedDashboards = plan.dashboards?.filter(planDashboard => {
                  const dashboardId = typeof planDashboard === 'object' ? planDashboard._id : planDashboard;
                  const fullDashboard = dashboards.find(db => db._id === dashboardId);
                  
                  return !fullDashboard?.categories || fullDashboard.categories.length === 0;
                }) || [];
                
                if (uncategorizedDashboards.length === 0) return null;

                return (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="w-2 h-2 rounded-full bg-gray-500 mr-2"></span>
                    Sans catégorie <span className="ml-1 text-gray-500">({uncategorizedDashboards.length})</span>
                  </div>
                );
              })()}
              
              {/* Show total if no categories found */}
              {categories.filter(category => {
                return plan.dashboards?.some(planDashboard => {
                  const dashboardId = typeof planDashboard === 'object' ? planDashboard._id : planDashboard;
                  const fullDashboard = dashboards.find(db => db._id === dashboardId);
                  return fullDashboard?.categories?.some(cat => {
                    const categoryId = typeof cat === 'object' ? cat._id : cat;
                    return categoryId === category._id;
                  });
                });
              }).length === 0 && (
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                  Total dashboards <span className="ml-1 text-gray-500">({plan.dashboards?.length || 0})</span>
                </div>
              )}
            </div>
          </div>
        
        <ul className="space-y-4 mb-8 flex-grow cursor-pointer">
          {plan.features.map((feature, i) => (
            <motion.li 
              key={i} 
              className="flex items-start"
              whileHover={{ x: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <FaCheck className={`mt-1 mr-3 flex-shrink-0 ${
                feature.available ? 'text-green-500' : 'text-gray-300'
              }`} />
              <span className={`text-lg ${feature.available ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                {feature.text}
              </span>
            </motion.li>
          ))}
        </ul>
        
        <div className="mt-auto">
             <AnimatePresence>
          {showCheckout ? (
            <Elements stripe={stripePromise}>
              <CheckoutForm 
                plan={plan} 
                onSuccess={() => {
                  setShowCheckout(false);
                  onSubscribe();
                }} 
                onClose={() => setShowCheckout(false)} 
              />
            </Elements>
          ) : (
            <div className="space-y-3">
              <motion.button
                onClick={handleStartTrial}
  disabled={isCurrentPlan || isStartingTrial || userSubscription?.trialUsed}
                className={`w-full cursor-pointer ${
                  isRecommended 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                    : isPopular
                      ? 'bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700'
                      : isBestValue
                        ? 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                } text-white font-medium py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:hover:shadow-lg text-lg`}
                whileHover={isCurrentPlan ? {} : { scale: 1.02 }}
                whileTap={isCurrentPlan ? {} : { scale: 0.98 }}
              >
               {isStartingTrial 
    ? 'Démarrage en cours...' 
    : isCurrentPlan 
      ? 'Votre plan actuel' 
      : userSubscription?.trialUsed
        ? 'Essai déjà utilisé'
        : "Commencer l'essai"}
              </motion.button>

              {!isCurrentPlan && (
                <motion.button
                  onClick={() => setShowCheckout(true)}
                  className="w-full border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-xl transition-all duration-300 hover:bg-gray-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Acheter maintenant
                </motion.button>
              )}
            </div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

  return (
  <section id="pricing" className="bg-gradient-to-b from-white to-blue-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <motion.div 
          className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-6 shadow-sm"
          whileHover={{ scale: 1.05 }}
        >
          <FaGem className="text-blue-600 mr-3 text-xl" />
          <span className="text-blue-800 font-medium text-lg">Nos offres premium</span>
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Des tarifs adaptés à votre croissance</h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Choisissez le plan qui correspond à vos besoins. Changez de plan à tout moment.
        </p>

        {/* Billing Cycle Toggle */}
        <motion.div 
          className="flex justify-center items-center mt-8 cursor-pointer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.span 
            className={`mr-4 font-medium ${billingCycle === 'monthly' ? 'text-blue-600' : 'text-gray-500'}`}
            animate={{ 
              color: billingCycle === 'monthly' ? '#2563eb' : '#6b7280',
              x: billingCycle === 'monthly' ? 0 : -5
            }}
            transition={{ type: 'spring', stiffness: 500 }}
          >
            Mensuel
          </motion.span>
          
          <motion.button
            onClick={toggleBillingCycle}
            className="relative inline-flex items-center h-8 rounded-full w-16 bg-gradient-to-r from-blue-500 to-purple-500 shadow-md cursor-pointer transition-all duration-300"
            whileTap={{ scale: 0.95 }}
          >
            <motion.span
              className={`absolute inline-flex items-center justify-center w-6 h-6 bg-white rounded-full shadow-md ${
                billingCycle === 'monthly' ? 'left-1' : 'left-9'
              }`}
              animate={{
                left: billingCycle === 'monthly' ? 4 : 36,
              }}
              transition={{ 
                type: 'spring', 
                stiffness: 700, 
                damping: 30,
                duration: 0.3
              }}
            >
              <FaSyncAlt 
                className={`text-xs ${
                  billingCycle === 'monthly' ? 'text-blue-500' : 'text-purple-500'
                }`}
                animate={{
                  rotate: billingCycle === 'monthly' ? 0 : 180,
                }}
                transition={{ duration: 0.3 }}
              />
            </motion.span>
          </motion.button>
          
          <motion.span 
            className={`ml-4 font-medium ${billingCycle === 'yearly' ? 'text-purple-600' : 'text-gray-500'}`}
            animate={{ 
              color: billingCycle === 'yearly' ? '#7c3aed' : '#6b7280',
              x: billingCycle === 'yearly' ? 0 : 5
            }}
            transition={{ type: 'spring', stiffness: 500 }}
          >
            Annuel
          </motion.span>
        </motion.div>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={billingCycle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-10 items-stretch"
        >
          {filteredPlans.map((plan, index) => (
            <motion.div
              key={plan._id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                delay: index * 0.15,
                type: "spring",
                stiffness: 100,
                damping: 15
              }}
            >
             <PricingCard 
  plan={plan} 
  isRecommended={plan.name === 'Pro' && plan.billingCycle === 'monthly'}
  isPopular={plan.name === 'Entreprise' && plan.billingCycle === 'monthly'}
  isBestValue={plan.name === 'Pro' && plan.billingCycle === 'yearly'}
  userSubscription={userSubscription}
  onSubscribe={handleSubscriptionSuccess}
  onOpenAuthModal={onOpenAuthModal} // Passez la fonction depuis les props
/>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        viewport={{ once: true }}
        className="mt-20 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-10 shadow-inner border border-blue-100"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-6">Besoin d'une solution sur mesure ?</h3>
          <p className="text-gray-700 mb-8 text-lg leading-relaxed">
            Nous proposons des solutions personnalisées pour les entreprises avec des besoins spécifiques. 
            Contactez-nous pour discuter de vos exigences et obtenir une offre adaptée.
          </p>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-r cursor-pointer from-gray-800 to-gray-900 text-white font-medium py-4 px-10 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-lg"
          >
            Contactez notre équipe
          </motion.button>
        </div>
      </motion.div>
    </div>
  </section>
);
};

export default PricingSection;