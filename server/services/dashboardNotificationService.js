const cron = require('node-cron');
const User = require('../models/User');
const emailService = require('./emailService');
const Notification = require('../models/Notification');

class DashboardNotificationService {
  constructor() {
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      console.log('Le service de notification est déjà en cours d\'exécution');
      return;
    }

    console.log('Démarrage du service de notification...');
    
    // Vérification quotidienne à 9h00 pour les rappels (7 jours avant)
    cron.schedule('0 9 * * *', async () => {
      console.log('Vérification des dashboards expirant dans 7 jours...');
      await this.checkExpiringDashboards(7);
    });

    // Vérification quotidienne à 18h00 pour les alertes urgentes (24h avant)
    cron.schedule('0 18 * * *', async () => {
      console.log('Vérification des dashboards expirant dans 24 heures...');
      await this.checkExpiringDashboards(1);
    });

    // Vérification toutes les heures pour les expirations imminentes
    cron.schedule('0 * * * *', async () => {
      console.log('Vérification horaire des dashboards expirant bientôt...');
      await this.checkExpiringDashboardsHours(24);
    });

    // Vérification quotidienne à 10h00 pour les dashboards expirés
    cron.schedule('0 10 * * *', async () => {
      console.log('Vérification des dashboards expirés...');
      await this.checkExpiredDashboards();
    });

    this.isRunning = true;
    console.log('Service de notification démarré avec succès');
  }

  stop() {
    this.isRunning = false;
    console.log('Service de notification arrêté');
  }

  async checkExpiringDashboards(daysBeforeExpiration) {
    try {
      const now = new Date();
      const checkDate = new Date(now.getTime() + (daysBeforeExpiration * 24 * 60 * 60 * 1000));
      
      const users = await User.find({
        'dashboards.expiresAt': {
          $exists: true,
          $ne: null,
          $lte: checkDate.toISOString(),
          $gt: now.toISOString()
        }
      }).populate('dashboards.dashboard');

      console.log(`${users.length} utilisateurs avec des dashboards expirant dans ${daysBeforeExpiration} jours`);

      for (const user of users) {
        const expiringDashboards = user.dashboards.filter(d => {
          if (!d.expiresAt) return false;
          const expirationDate = new Date(d.expiresAt);
          return expirationDate <= checkDate && expirationDate > now;
        });

        if (expiringDashboards.length > 0) {
          const shouldSend = await this.shouldSendNotification(user._id, expiringDashboards, daysBeforeExpiration);
          
          if (shouldSend) {
            const dashboardsForEmail = expiringDashboards.map(d => ({
              name: d.dashboard.name,
              url: d.dashboard.url,
              expiresAt: d.expiresAt
            }));

            // Créer une notification
            await Notification.create({
              user: user._id,
              title: 'Expiration de dashboard',
              message: `Certains de vos dashboards expireront dans ${daysBeforeExpiration} jours`,
              type: 'dashboard_expiration',
              relatedId: null
            });

            if (daysBeforeExpiration === 7) {
              await emailService.sendDashboardExpirationReminderEmail(
                user.email,
                user.name,
                dashboardsForEmail
              );
            } else if (daysBeforeExpiration === 1) {
              await emailService.sendDashboardExpirationUrgentEmail(
                user.email,
                user.name,
                dashboardsForEmail
              );
            }

            await this.markNotificationSent(user._id, expiringDashboards, daysBeforeExpiration);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des dashboards expirants:', error);
    }
  }

  async checkExpiringDashboardsHours(hoursBeforeExpiration) {
    try {
      const now = new Date();
      const checkDate = new Date(now.getTime() + (hoursBeforeExpiration * 60 * 60 * 1000));
      
      const users = await User.find({
        'dashboards.expiresAt': {
          $exists: true,
          $ne: null,
          $lte: checkDate.toISOString(),
          $gt: now.toISOString()
        }
      }).populate('dashboards.dashboard');

      for (const user of users) {
        const expiringDashboards = user.dashboards.filter(d => {
          if (!d.expiresAt) return false;
          const expirationDate = new Date(d.expiresAt);
          const hoursLeft = (expirationDate - now) / (1000 * 60 * 60);
          return hoursLeft <= hoursBeforeExpiration && hoursLeft > 0;
        });

        if (expiringDashboards.length > 0) {
          const shouldSend = await this.shouldSendNotification(user._id, expiringDashboards, 'urgent');
          
          if (shouldSend) {
            const dashboardsForEmail = expiringDashboards.map(d => ({
              name: d.dashboard.name,
              url: d.dashboard.url,
              expiresAt: d.expiresAt
            }));

            // Créer une notification urgente
            await Notification.create({
              user: user._id,
              title: 'Expiration imminente de dashboard',
              message: 'Certains de vos dashboards expireront bientôt',
              type: 'dashboard_expiration',
              relatedId: null
            });

            await emailService.sendDashboardExpirationUrgentEmail(
              user.email,
              user.name,
              dashboardsForEmail
            );

            await this.markNotificationSent(user._id, expiringDashboards, 'urgent');
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des dashboards expirants (heures):', error);
    }
  }

  async checkExpiredDashboards() {
    try {
      const now = new Date();
      
      const users = await User.find({
        'dashboards.expiresAt': {
          $exists: true,
          $ne: null,
          $lt: now.toISOString()
        }
      }).populate('dashboards.dashboard');

      for (const user of users) {
        const expiredDashboards = user.dashboards.filter(d => {
          if (!d.expiresAt) return false;
          const expirationDate = new Date(d.expiresAt);
          return expirationDate < now;
        });

        if (expiredDashboards.length > 0) {
          const shouldSend = await this.shouldSendNotification(user._id, expiredDashboards, 'expired');
          
          if (shouldSend) {
            const dashboardsForEmail = expiredDashboards.map(d => ({
              name: d.dashboard.name,
              url: d.dashboard.url,
              expiresAt: d.expiresAt
            }));

            // Créer une notification d'expiration
            await Notification.create({
              user: user._id,
              title: 'Dashboard expiré',
              message: 'Certains de vos dashboards ont expiré',
              type: 'dashboard_expiration',
              relatedId: null
            });

            await emailService.sendDashboardExpiredEmail(
              user.email,
              user.name,
              dashboardsForEmail
            );

            await this.markNotificationSent(user._id, expiredDashboards, 'expired');
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des dashboards expirés:', error);
    }
  }

  async shouldSendNotification(userId, dashboards, type) {
    // Vérifier si une notification a déjà été envoyée aujourd'hui
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingNotification = await Notification.findOne({
      user: userId,
      type: 'dashboard_expiration',
      createdAt: { $gte: today },
      title: type === 'expired' ? 'Dashboard expiré' : 
             type === 'urgent' ? 'Expiration imminente de dashboard' : 
             'Expiration de dashboard'
    });

    return !existingNotification;
  }

  async markNotificationSent(userId, dashboards, type) {
    console.log(`Notification envoyée pour l'utilisateur ${userId}, type: ${type}`);
  }
}

module.exports = new DashboardNotificationService();