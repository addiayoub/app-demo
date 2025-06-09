const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('dotenv').config();

// Import du service de nettoyage
const cleanupService = require('./services/cleanupService');

const app = express();

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const dashboardRoutes = require('./routes/dashboards');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
// Augmenter la limite des payloads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
const allowedOrigins = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : [''];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(morgan('dev'));
app.use('/uploads', express.static('uploads'));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

require('./config/passport');

// Connexion à MongoDB (sans démarrage automatique du nettoyage)
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connecté');
    console.log('ℹ️  Service de nettoyage disponible en mode manuel uniquement');
  })
  .catch(err => console.error('Erreur MongoDB:', err));

app.use('/api/auth', authRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'API en cours d\'exécution!' });
});

// Route pour obtenir les statistiques du service de nettoyage
app.get('/api/admin/cleanup-stats', (req, res) => {
  const stats = cleanupService.getStats();
  res.json({
    message: 'Statistiques du service de nettoyage',
    stats
  });
});

// Route pour voir les dashboards expirés sans les supprimer
app.get('/api/admin/expired-dashboards', async (req, res) => {
  try {
    const expiredInfo = await cleanupService.getExpiredDashboardsCount();
    res.json({
      message: 'Informations sur les dashboards expirés',
      ...expiredInfo
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la récupération des dashboards expirés',
      error: error.message
    });
  }
});

// Route pour déclencher un nettoyage manuel
app.post('/api/admin/manual-cleanup', async (req, res) => {
  try {
    const result = await cleanupService.manualCleanup();
    const stats = cleanupService.getStats();
    res.json({
      message: 'Nettoyage manuel effectué avec succès',
      result,
      stats: stats.lastRunStats
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors du nettoyage manuel',
      error: error.message
    });
  }
});


const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Serveur lancé sur http://${HOST}:${PORT}`);
});
