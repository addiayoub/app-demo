import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  BarChart2,
  ChevronRight,
  Zap,
  Infinity as InfinityIcon,
  Users,
  Shield,
  Globe,
  HardDrive,
  Cpu
} from 'lucide-react';
import { 
  FaLightbulb, 
  FaRocket, 
  FaCrown,
  FaRegGem,
  FaChartLine,
  FaDatabase,
  FaServer
} from 'react-icons/fa';
import { GiArtificialIntelligence } from 'react-icons/gi';

const PlanInfoView = ({ plan, onClose, onShowPricing ,user }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

function calculateTimeLeft() {
  if (!plan?.currentPeriodEnd) return null;
  
  const now = new Date();
  const endDate = new Date(plan.currentPeriodEnd);
  const difference = endDate - now;
  
  // Si l'abonnement est annulé ou expiré, retourner 00:00:00
  if (plan?.status === 'canceled' || difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0
    };
  }
  
  const seconds = Math.floor(difference / 1000);
  
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    totalSeconds: seconds
  };
}

useEffect(() => {
  if (!plan?.currentPeriodEnd) return;
  
  const timer = setInterval(() => {
    const now = new Date();
    const endDate = new Date(plan.currentPeriodEnd);
    const difference = endDate - now;
    
    // Vérifier si l'abonnement a expiré
    if (difference <= 0 && !isExpired) {
      setIsExpired(true);
      setTimeLeft({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0
      });
      return;
    }
    
    // Ne mettez à jour que si non annulé et non expiré
    if (plan?.status !== 'canceled' && difference > 0) {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      if (newTimeLeft?.totalSeconds) {
        setTotalSeconds(newTimeLeft.totalSeconds);
      }
    }
  }, 1000);
  
  return () => clearInterval(timer);
}, [plan?.currentPeriodEnd, plan?.status, isExpired]);

  const calculateProgress = () => {
    if (!plan?.currentPeriodStart || !plan?.currentPeriodEnd) return 0;
    
    const start = new Date(plan.currentPeriodStart).getTime();
    const end = new Date(plan.currentPeriodEnd).getTime();
    const now = new Date().getTime();
    
    const total = end - start;
    const elapsed = now - start;
    
    return Math.min((elapsed / total) * 100, 100);
  };

  const getStatusBadge = (status, isTrial) => {
    const badgeBase = "px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium shadow-sm";
    
    // Vérifier si expiré
    if (isExpired || (plan?.currentPeriodEnd && new Date() > new Date(plan.currentPeriodEnd))) {
      return (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`${badgeBase} bg-gradient-to-br from-red-50 to-red-100 text-red-700 border border-red-200`}
        >
          <AlertCircle size={16} className="shrink-0" />
          <span>Abonnement expiré</span>
        </motion.div>
      );
    }
    
    if (status === 'canceled') {
      return (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`${badgeBase} bg-gradient-to-br from-red-50 to-red-100 text-red-700 border border-red-200`}
        >
          <X size={16} className="shrink-0" />
          <span>Abonnement annulé</span>
        </motion.div>
      );
    }
    
    if (isTrial) {
      return (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`${badgeBase} bg-gradient-to-br from-purple-50 to-indigo-100 text-purple-700 border border-purple-200`}
        >
          <Clock size={16} className="shrink-0" />
          <span>Essai gratuit</span>
        </motion.div>
      );
    }
    
    switch(status) {
      case 'active':
        return (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${badgeBase} bg-gradient-to-br from-green-50 to-emerald-100 text-green-700 border border-green-200`}
          >
            <CheckCircle size={16} className="shrink-0" />
            <span>Abonnement actif</span>
          </motion.div>
        );
      default:
        return null;
    }
  };

const TimeCircle = ({ value, label, color, isActive = true }) => {
  const size = 80;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (value / (label === 'jours' ? 30 : 60)) * circumference;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: isActive ? 1 : 0, ease: "easeInOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xl font-bold ${
            !isActive ? 'text-red-600' : 'text-gray-800'
          }`}>
            {value.toString().padStart(2, '0')}
          </span>
        </div>
      </div>
      <span className={`text-xs font-medium ${
        !isActive ? 'text-red-500' : 'text-gray-500'
      } mt-2`}>
        {label}
      </span>
    </div>
  );
};

const AnalogClock = ({ seconds, isActive = true, isCanceled = false, isExpired = false }) => {
  // Si l'abonnement est annulé ou expiré, toutes les aiguilles sont à 12 heures (0 degrés)
  const shouldStop = isCanceled || isExpired;
  const secondsDegrees = shouldStop ? 0 : ((seconds % 60) / 60) * 360;
  const minutesDegrees = shouldStop ? 0 : ((Math.floor(seconds / 60) % 60) / 60) * 360;
  const hoursDegrees = shouldStop ? 0 : ((Math.floor(seconds / 3600) % 12) / 12) * 360;
  
  return (
    <div className={`relative w-32 h-32 rounded-full border-4 shadow-inner bg-white ${
      shouldStop ? 'border-red-200' : 'border-indigo-100'
    }`}>
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className={`absolute w-1 h-1 rounded-full ${
            shouldStop ? 'bg-red-300' : 'bg-indigo-300'
          }`}
          style={{
            left: '50%',
            top: '10%',
            transform: `translate(-50%, -50%) rotate(${i * 30}deg) translate(0, -40px)`,
            transformOrigin: 'center 40px'
          }}
        />
      ))}
      
      <div
        className={`absolute w-1 h-10 rounded-full left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 origin-bottom ${
          shouldStop ? 'bg-red-600' : 'bg-indigo-600'
        }`}
        style={{ transform: `translate(-50%, -50%) rotate(${hoursDegrees}deg)` }}
      />
      <div
        className={`absolute w-1 h-16 rounded-full left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 origin-bottom ${
          shouldStop ? 'bg-red-500' : 'bg-indigo-500'
        }`}
        style={{ transform: `translate(-50%, -50%) rotate(${minutesDegrees}deg)` }}
      />
      <div
        className={`absolute w-0.5 h-20 rounded-full left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 origin-bottom ${
          shouldStop ? 'bg-red-400' : 'bg-red-500'
        }`}
        style={{ 
          transform: `translate(-50%, -50%) rotate(${secondsDegrees}deg)`,
          opacity: isActive && !shouldStop ? 1 : 0.5
        }}
      />
      
      <div className={`absolute w-3 h-3 rounded-full left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 ${
        shouldStop ? 'bg-red-700' : 'bg-indigo-700'
      }`} />
    </div>
  );
};

  const getPlanIcon = (planName) => {
    const isExpiredOrCanceled = isExpired || plan?.status === 'canceled';
    
    switch(planName) {
      case 'Basique':
        return (
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            className={`w-16 h-16 flex items-center justify-center rounded-2xl shadow-md border text-3xl ${
              isExpiredOrCanceled 
                ? 'bg-gradient-to-br from-red-100 to-red-200 border-red-300'
                : 'bg-gradient-to-br from-yellow-100 to-amber-100 border-amber-200'
            }`}
          >
            <FaLightbulb className={isExpiredOrCanceled ? 'text-red-500' : 'text-amber-500'} />
          </motion.div>
        );
      case 'Pro':
        return (
          <motion.div
            whileHover={{ rotate: -5, scale: 1.1 }}
            className={`w-16 h-16 flex items-center justify-center rounded-2xl shadow-md border text-3xl ${
              isExpiredOrCanceled 
                ? 'bg-gradient-to-br from-red-100 to-red-200 border-red-300'
                : 'bg-gradient-to-br from-purple-100 to-indigo-100 border-purple-200'
            }`}
          >
            <FaRocket className={isExpiredOrCanceled ? 'text-red-600' : 'text-purple-600'} />
          </motion.div>
        );
      case 'Entreprise':
        return (
          <motion.div
            whileHover={{ rotate: 5, scale: 1.1 }}
            className={`w-16 h-16 flex items-center justify-center rounded-2xl shadow-md border text-3xl ${
              isExpiredOrCanceled 
                ? 'bg-gradient-to-br from-red-100 to-red-200 border-red-300'
                : 'bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-200'
            }`}
          >
            <FaCrown className={isExpiredOrCanceled ? 'text-red-500' : 'text-yellow-500'} />
          </motion.div>
        );
      default:
        return (
          <motion.div
            whileHover={{ rotate: 5, scale: 1.1 }}
            className={`w-16 h-16 flex items-center justify-center rounded-2xl shadow-md border text-3xl ${
              isExpiredOrCanceled 
                ? 'bg-gradient-to-br from-red-100 to-red-200 border-red-300'
                : 'bg-gradient-to-br from-gray-100 to-slate-100 border-gray-200'
            }`}
          >
            <FaRegGem className={isExpiredOrCanceled ? 'text-red-500' : 'text-indigo-500'} />
          </motion.div>
        );
    }
  };

  const getFeatureIcon = (feature) => {
    if (feature.includes('AI') || feature.includes('intelligence')) return <GiArtificialIntelligence className="text-purple-500" />;
    if (feature.includes('données') || feature.includes('data')) return <FaDatabase className="text-blue-500" />;
    if (feature.includes('analytique') || feature.includes('analytics')) return <FaChartLine className="text-green-500" />;
    if (feature.includes('serveur') || feature.includes('server')) return <FaServer className="text-amber-500" />;
    if (feature.includes('stockage') || feature.includes('storage')) return <HardDrive className="text-indigo-500" />;
    if (feature.includes('CPU') || feature.includes('processeur')) return <Cpu className="text-red-500" />;
    if (feature.includes('utilisateurs') || feature.includes('users')) return <Users className="text-teal-500" />;
    if (feature.includes('sécurité') || feature.includes('security')) return <Shield className="text-emerald-500" />;
    if (feature.includes('global') || feature.includes('worldwide')) return <Globe className="text-sky-500" />;
    return <Zap className="text-yellow-500" />;
  };

  // Vérifier si l'abonnement est expiré ou annulé
  const isExpiredOrCanceled = isExpired || plan?.status === 'canceled' || (plan?.currentPeriodEnd && new Date() > new Date(plan.currentPeriodEnd));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`bg-white rounded-2xl shadow-2xl p-8 h-full flex flex-col border ${
        isExpiredOrCanceled ? 'border-red-100' : 'border-gray-100'
      } backdrop-blur-sm bg-opacity-90`}
    >
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <motion.div 
            initial={{ rotate: -10, scale: 0.9 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className={`p-3 rounded-xl shadow-sm border ${
              isExpiredOrCanceled 
                ? 'bg-gradient-to-br from-red-50 to-pink-100 border-red-200' 
                : 'bg-gradient-to-br from-indigo-100 to-purple-100 border-indigo-200'
            }`}
          >
            <CreditCard 
              size={28} 
              className={isExpiredOrCanceled ? 'text-red-600' : 'text-indigo-600'} 
            />
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className={`text-2xl font-bold bg-gradient-to-r ${
              isExpiredOrCanceled 
                ? 'from-red-600 to-pink-600' 
                : 'from-indigo-600 to-purple-600'
            } bg-clip-text text-transparent`}
          >
            {isExpiredOrCanceled ? 'Abonnement Expiré' : 'Votre Abonnement Premium'}
          </motion.h2>
        </div>
        <motion.button 
          onClick={onClose}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-full hover:bg-gray-100 transition-all"
        >
          <X size={20} className="text-gray-500 hover:text-gray-700" />
        </motion.button>
      </div>

      {plan ? (
        <div className="flex-1 flex flex-col space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`rounded-2xl p-8 border shadow-sm ${
              isExpiredOrCanceled
                ? 'bg-gradient-to-br from-red-50 to-pink-50 border-red-100'
                : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100'
            }`}
          >
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="flex items-start gap-6">
                {getPlanIcon(plan.plan?.name)}
                <div className="space-y-2">
                  <h3 className={`text-2xl font-bold flex items-center gap-2 ${
                    isExpiredOrCanceled ? 'text-red-800' : 'text-gray-800'
                  }`}>
                    {plan.plan?.name || 'Abonnement'}
                    {plan.plan?.popular && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500 }}
                        className={`px-2 py-1 text-xs font-bold rounded-full ${
                          isExpiredOrCanceled
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        POPULAIRE
                      </motion.span>
                    )}
                  </h3>
                  <p className={isExpiredOrCanceled ? 'text-red-600' : 'text-gray-600'}>
                    {plan.plan?.description || 'Accédez à toutes les fonctionnalités premium'}
                  </p>
                </div>
              </div>
              <div className="self-center">
                {getStatusBadge(plan.status, plan.isTrial)}
              </div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5"
            >
              <motion.div 
                whileHover={{ y: -5, scale: 1.02 }}
                className={`p-5 rounded-xl border shadow-xs hover:shadow-md transition-all ${
                  isExpiredOrCanceled
                    ? 'bg-white border-red-200 hover:border-red-300'
                    : 'bg-white border-gray-200 hover:border-indigo-100'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${
                    isExpiredOrCanceled
                      ? 'bg-red-100 text-red-600'
                      : 'bg-indigo-100 text-indigo-600'
                  }`}>
                    <CreditCard size={18} />
                  </div>
                  <h4 className={`text-sm font-medium ${
                    isExpiredOrCanceled ? 'text-red-500' : 'text-gray-500'
                  }`}>Prix</h4>
                </div>
                <p className={`text-2xl font-bold ${
                  isExpiredOrCanceled ? 'text-red-800' : 'text-gray-800'
                }`}>
                  {plan.plan?.price} {plan.plan?.currency}
                  <span className={`text-sm font-normal ml-1 ${
                    isExpiredOrCanceled ? 'text-red-600' : 'text-gray-500'
                  }`}>/ {plan.plan?.billingCycle}</span>
                </p>
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -5, scale: 1.02 }}
                className={`p-5 rounded-xl border shadow-xs hover:shadow-md transition-all ${
                  isExpiredOrCanceled
                    ? 'bg-white border-red-200 hover:border-red-300'
                    : 'bg-white border-gray-200 hover:border-indigo-100'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${
                    isExpiredOrCanceled
                      ? 'bg-red-100 text-red-600'
                      : 'bg-purple-100 text-purple-600'
                  }`}>
                    <Clock size={18} />
                  </div>
                  <h4 className={`text-sm font-medium ${
                    isExpiredOrCanceled ? 'text-red-500' : 'text-gray-500'
                  }`}>Période actuelle</h4>
                </div>
                <p className={isExpiredOrCanceled ? 'text-red-800' : 'text-gray-800'}>
                  {new Date(plan.currentPeriodStart).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} - {' '}
                  {new Date(plan.currentPeriodEnd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                </p>
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -5, scale: 1.02 }}
                className={`p-5 rounded-xl border shadow-xs hover:shadow-md transition-all ${
                  isExpiredOrCanceled
                    ? 'bg-white border-red-200 hover:border-red-300'
                    : 'bg-white border-gray-200 hover:border-indigo-100'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${
                    isExpiredOrCanceled
                      ? 'bg-red-100 text-red-600'
                      : 'bg-green-100 text-green-600'
                  }`}>
                    <CheckCircle size={18} />
                  </div>
                  <h4 className={`text-sm font-medium ${
                    isExpiredOrCanceled ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {isExpiredOrCanceled ? 'Expiré le' : 'Prochain paiement'}
                  </h4>
                </div>
                <p className={isExpiredOrCanceled ? 'text-red-800' : 'text-gray-800'}>
                  {plan.currentPeriodEnd 
                    ? new Date(plan.currentPeriodEnd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                    : 'N/A'}
                </p>
              </motion.div>
            </motion.div>

            {timeLeft && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-8"
              >
                <h4 className={`text-sm font-medium mb-4 flex items-center gap-2 ${
                  isExpiredOrCanceled ? 'text-red-500' : 'text-gray-500'
                }`}>
                  <Clock size={16} className={isExpiredOrCanceled ? 'text-red-500' : ''} />
                  {plan.isTrial 
                    ? "Temps restant dans l'essai" 
                    : isExpiredOrCanceled
                      ? "Abonnement expiré"
                      : "Temps jusqu'au renouvellement"}
                </h4>
                
                <div className="flex flex-col items-center">
                  <div className="mb-6">
                    <AnalogClock 
                      seconds={isExpiredOrCanceled ? 0 : totalSeconds % (24 * 3600)} 
                      isActive={!isExpiredOrCanceled}
                      isCanceled={plan?.status === 'canceled'}
                      isExpired={isExpired}
                    />
                  </div>
                  
                  <div className="flex justify-center gap-6">
                    <TimeCircle 
                      value={timeLeft.days} 
                      label="jours" 
                      color={isExpiredOrCanceled ? "#ef4444" : "#6366f1"}
                      isActive={!isExpiredOrCanceled}
                    />
                    <TimeCircle 
                      value={timeLeft.hours} 
                      label="heures" 
                      color={isExpiredOrCanceled ? "#ef4444" : "#8b5cf6"}
                      isActive={!isExpiredOrCanceled} 
                    />
                    <TimeCircle 
                      value={timeLeft.minutes} 
                      label="minutes" 
                      color={isExpiredOrCanceled ? "#ef4444" : "#a855f7"}
                      isActive={!isExpiredOrCanceled} 
                    />
                    <TimeCircle 
                      value={timeLeft.seconds} 
                      label="secondes" 
                      color={isExpiredOrCanceled ? "#ef4444" : "#d946ef"}
                      isActive={!isExpiredOrCanceled} 
                    />
                  </div>
                  
                  <div className="w-full mt-8">
                    <div className={`flex justify-between text-xs mb-1 ${
                      isExpiredOrCanceled ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      <span>Début: {new Date(plan.currentPeriodStart).toLocaleDateString()}</span>
                      <span>Fin: {new Date(plan.currentPeriodEnd).toLocaleDateString()}</span>
                    </div>
                    <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${calculateProgress()}%` }}
                        transition={{ duration: 0, ease: "easeInOut" }}
                        className={`h-full rounded-full ${
                          isExpiredOrCanceled
                            ? 'bg-gradient-to-r from-red-500 to-pink-600'
                            : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
          
          {plan.plan?.features && plan.plan.features.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-5"
            >
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <Zap size={20} className="text-yellow-500" />
                <span>Fonctionnalités Premium</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plan.plan.features.map((feature, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    onMouseEnter={() => setHoveredFeature(index)}
                    onMouseLeave={() => setHoveredFeature(null)}
                    className={`p-4 rounded-xl border transition-all duration-300 ${
                      hoveredFeature === index 
                        ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 shadow-sm'
                        : 'bg-white border-gray-200 hover:border-indigo-100'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-opacity-20 mt-0.5">
                        {getFeatureIcon(feature.text)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{feature.text}</h4>
                        {feature.description && (
                          <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
          
          {plan.dashboards && plan.dashboards.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-5"
            >
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <BarChart2 size={20} className="text-indigo-600" />
                <span>Dashboards Exclusifs</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plan.dashboards.map((dashboard, index) => (
                  <motion.div 
                    key={dashboard._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    whileHover={{ y: -5, boxShadow: "0 10px 20px -5px rgba(0,0,0,0.1)" }}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-indigo-200 transition-all"
                  >
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                          <BarChart2 size={18} />
                        </div>
                        <h4 className="font-medium text-gray-800">{dashboard.name}</h4>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {dashboard.description}
                      </p>
                    </div>
                    
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-1 flex flex-col items-center justify-center text-center py-12"
        >
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              y: [0, -8, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="p-6 bg-gradient-to-br from-gray-100 to-slate-100 rounded-2xl shadow-sm border border-gray-200 mb-6"
          >
            <CreditCard size={48} className="text-gray-400" />
          </motion.div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3 bg-gradient-to-r from-gray-700 to-slate-800 bg-clip-text text-transparent">
            Aucun abonnement actif
          </h3>
          <p className="text-gray-500 max-w-md mb-8">
            Vous n'avez pas d'abonnement actif. Souscrivez à un plan premium pour débloquer des fonctionnalités exclusives et des outils puissants.
          </p>
          <div className="flex gap-4">
              <motion.button 
    whileHover={{ scale: 1.03, boxShadow: "0 5px 15px -5px rgba(99, 102, 241, 0.5)" }}
    whileTap={{ scale: 0.97 }}
    className="bg-gradient-to-r cursor-pointer from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-medium"
    onClick={onShowPricing} // Ajoutez cette ligne
  >
    Voir les plans
  </motion.button>
            <motion.button 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:shadow-md transition-all font-medium"
            >
              En savoir plus
            </motion.button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PlanInfoView;