import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheck, FaCrown, FaRocket, FaLightbulb, FaGem, FaStar } from 'react-icons/fa';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getPlans, createSubscription, getUserSubscription } from '../services/pricingService';
import { useAuth } from '../Auth/AuthContext';
import CustomLoader from '../CustomLoader/CustomLoader';

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
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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

const PricingCard = ({ plan, isRecommended, userSubscription, onSubscribe }) => {
  const [showCheckout, setShowCheckout] = useState(false);
  const isCurrentPlan = userSubscription?.plan?._id === plan._id;
  const isSubscribed = userSubscription && userSubscription.status === 'active';

  return (
    <motion.div 
      className={`relative rounded-2xl overflow-hidden border-2 ${
        isRecommended ? 'border-purple-500 shadow-xl' : 'border-gray-200'
      } bg-white hover:shadow-2xl transition-all duration-300 h-full flex flex-col`}
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {isRecommended && (
        <motion.div 
          className="absolute top-4 right-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
        >
          <FaStar className="mr-1" />
          <span>Recommandé</span>
        </motion.div>
      )}

      <div className="p-8 flex flex-col flex-grow">
        <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-white to-gray-100 rounded-xl shadow-sm mb-6 text-3xl">
          {plan.name === 'Basique' && <FaLightbulb className="text-yellow-500" />}
          {plan.name === 'Pro' && <FaRocket className="text-purple-500" />}
          {plan.name === 'Entreprise' && <FaCrown className="text-yellow-400" />}
        </div>

        <h3 className="text-3xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        
        <div className="flex items-end mb-6">
          <span className="text-5xl font-extrabold text-gray-900">{plan.price}</span>
          <span className="text-gray-500 ml-2 mb-1 text-xl">{plan.currency}/mois</span>
        </div>
        
        <p className="text-gray-600 mb-8 text-lg">{plan.description}</p>
        
        <ul className="space-y-4 mb-8 flex-grow">
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
              <motion.button
                onClick={() => setShowCheckout(true)}
                disabled={isCurrentPlan}
                className={`w-full ${
                  isRecommended 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                } text-white font-medium py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:hover:shadow-lg text-lg`}
                whileHover={isCurrentPlan ? {} : { scale: 1.02 }}
                whileTap={isCurrentPlan ? {} : { scale: 0.98 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {isCurrentPlan 
                  ? 'Votre plan actuel' 
                  : isSubscribed 
                    ? 'Changer de plan' 
                    : "Commencer l'essai"}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

const PricingSection = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSubscription, setUserSubscription] = useState(null);
  const { isAuthenticated, token } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansResponse, subscriptionResponse] = await Promise.all([
          getPlans(),
          isAuthenticated ? getUserSubscription(token) : Promise.resolve(null)
        ]);
        
        setPlans(plansResponse.plans);
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

  if (loading) {
    return <CustomLoader/>;
  }

  return (
    <section id="pricing" className="py-20 bg-gradient-to-br from-gray-50 to-white">
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
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-stretch">
          {plans.map((plan, index) => (
            <PricingCard 
              key={plan._id}
              plan={plan} 
              isRecommended={plan.name === 'Pro'}
              userSubscription={userSubscription}
              onSubscribe={handleSubscriptionSuccess}
            />
          ))}
        </div>

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
              className="bg-gradient-to-r from-gray-800 to-gray-900 text-white font-medium py-4 px-10 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-lg"
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