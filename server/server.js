const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Import du service de nettoyage
const cleanupService = require('./services/cleanupService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ["GET", "POST"]
  }
});

// Stocker l'instance io dans l'app pour y accéder dans les controllers
app.set('socketio', io);

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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
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

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connecté');
    console.log('ℹ️  Service de nettoyage disponible en mode manuel uniquement');
  })
  .catch(err => console.error('Erreur MongoDB:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboards', require('./routes/dashboards'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/pricing', require('./routes/pricingRoutes'));
app.use('/api', require('./routes/contact'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin/tickets', require('./routes/adminTicketRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));

// Routes pour le nettoyage
app.get('/api/admin/cleanup-stats', (req, res) => {
  const stats = cleanupService.getStats();
  res.json({
    message: 'Statistiques du service de nettoyage',
    stats
  });
});

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

app.get('/', (req, res) => {
  res.json({ message: 'API en cours d\'exécution!' });
});

// Gestion des connexions WebSocket
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Serveur lancé sur http://${HOST}:${PORT}`);
});