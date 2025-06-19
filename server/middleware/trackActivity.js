// middlewares/trackActivity.js
const UserActivity = require('../models/UserActivity');

async function trackActivity(req, res, next) {
  if (req.user) {
    const startTime = Date.now();
    
    res.on('finish', async () => {
      try {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        
        await UserActivity.create({
          userId: req.user._id,
          dashboardId: req.params.dashboardId || null,
          action: req.method.toLowerCase() === 'get' ? 'view' : req.method.toLowerCase(),
          duration,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: {
            url: req.originalUrl,
            method: req.method,
            statusCode: res.statusCode
          }
        });
      } catch (err) {
        console.error('Error tracking activity:', err);
      }
    });
  }
  
  next();
}

module.exports = trackActivity;