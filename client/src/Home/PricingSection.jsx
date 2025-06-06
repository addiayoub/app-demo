import React from 'react';
import { motion } from 'framer-motion';
import { FaCheck, FaCrown, FaRocket, FaLightbulb, FaGem } from 'react-icons/fa';

const PricingSection = () => {
  const pricingPlans = [
    {
      name: "Basique",
      price: "0 DH",
      description: "Parfait pour commencer à explorer",
      recommended: false,
      features: [
        "Accès aux dashboards publics",
        "3 dashboards personnels",
        "Stockage limité (500MB)",
        "Support de base"
      ],
      icon: <FaLightbulb className="text-yellow-500" />,
      color: "from-blue-100 to-blue-50",
      borderColor: "border-blue-200",
      buttonColor: "bg-blue-600 hover:bg-blue-700"
    },
    {
      name: "Pro",
      price: "199 DH",
      description: "Pour les professionnels et petites équipes",
      recommended: true,
      features: [
        "Toutes les fonctionnalités Basique",
        "Dashboards personnels illimités",
        "Stockage (5GB)",
        "Partage contrôlé",
        "Support prioritaire",
        "Export des données"
      ],
      icon: <FaRocket className="text-purple-500" />,
      color: "from-purple-100 to-purple-50",
      borderColor: "border-purple-300",
      buttonColor: "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
    },
    {
      name: "Entreprise",
      price: "499 DH",
      description: "Solution complète pour les organisations",
      recommended: false,
      features: [
        "Toutes les fonctionnalités Pro",
        "Stockage illimité",
        "Collaboration d'équipe",
        "SSO et sécurité avancée",
        "Analyses avancées",
        "Support 24/7",
        "Formation dédiée"
      ],
      icon: <FaCrown className="text-yellow-400" />,
      color: "from-indigo-100 to-indigo-50",
      borderColor: "border-indigo-300",
      buttonColor: "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
    }
  ];

  return (
    <section id="pricing" className="py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-4">
            <FaGem className="text-blue-600 mr-2" />
            <span className="text-blue-800 font-medium">Nos offres</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Des tarifs adaptés à vos besoins</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choisissez le plan qui correspond à vos besoins analytiques. Mise à niveau ou rétrogradation à tout moment.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
              className={`relative rounded-2xl overflow-hidden border ${plan.borderColor} bg-white shadow-lg hover:shadow-xl transition-all duration-300`}
            >
              {/* Recommended Badge */}
              {plan.recommended && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold px-4 py-1 transform translate-x-2 -translate-y-2 rotate-12 shadow-md"
                >
                  Recommandé
                </motion.div>
              )}

              <div className="p-6">
                {/* Plan Icon */}
                <motion.div
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-white to-gray-100 rounded-lg shadow-sm mb-4 text-2xl"
                >
                  {plan.icon}
                </motion.div>

                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                
                {/* Price */}
                <div className="flex items-end mb-4">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500 ml-1 mb-1">/mois</span>
                </div>
                
                {/* Description */}
                <p className="text-gray-600 mb-6">{plan.description}</p>
                
                {/* Features List */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <motion.li 
                      key={i}
                      whileHover={{ x: 5 }}
                      className="flex items-start"
                    >
                      <FaCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </motion.li>
                  ))}
                </ul>
                
                {/* CTA Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full ${plan.buttonColor} text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg`}
                >
                  {plan.recommended ? "Commencer l'essai" : "Choisir ce plan"}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 shadow-inner"
        >
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Vous avez une équipe plus importante ?</h3>
            <p className="text-gray-700 mb-6">
              Nous proposons des solutions personnalisées pour les entreprises avec des besoins spécifiques. 
              Contactez-nous pour discuter de vos exigences et obtenir une offre sur mesure.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-gray-800 to-gray-900 text-white font-medium py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Contactez notre équipe commerciale
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;