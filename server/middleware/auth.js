// middleware/auth.js
const isAdmin = (req, res, next) => {
  // Check if req.isAuthenticated exists (Passport.js is configured)
  if (typeof req.isAuthenticated === 'function' && req.isAuthenticated() && req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Accès non autorisé: droits administrateur requis' });
};

const isAuthenticated = (req, res, next) => {
  // Check if req.isAuthenticated exists (Passport.js is configured)
  if (typeof req.isAuthenticated === 'function' && req.isAuthenticated()) {
    return next();
  }
  
  // Alternative: Check for user in session or JWT token
  if (req.user || req.session?.user) {
    return next();
  }
  
  res.status(401).json({ message: 'Non authentifié' });
};

module.exports = {
  isAuthenticated,
  isAdmin
};