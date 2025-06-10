// services/dashboardNotificationService.js
const cron = require('node-cron');
const User = require('../models/User');
const emailService = require('./emailService');

class DashboardNotificationService {
  constructor() {
    this.isRunning = false;
  }

  // Démarre les tâches cron
  start() {
    if (this.isRunning) {
      console.log('Dashboard notification service is already running');
      return;
    }

    console.log('Starting Dashboard Notification Service...');
    
    // Vérification quotidienne à 9h00 pour les rappels (7 jours avant)
    cron.schedule('0 9 * * *', async () => {
      console.log('Running daily dashboard expiration reminder check...');
      await this.checkExpiringDashboards(7); // 7 jours avant
    });

    // Vérification quotidienne à 18h00 pour les alertes urgentes (24h avant)
    cron.schedule('0 18 * * *', async () => {
      console.log('Running daily dashboard urgent expiration check...');
      await this.checkExpiringDashboards(1); // 1 jour avant
    });

    // Vérification toutes les heures pour les expirations imminentes (moins de 24h)
    cron.schedule('0 * * * *', async () => {
      console.log('Running hourly dashboard urgent expiration check...');
      await this.checkExpiringDashboardsHours(24); // 24 heures avant
    });

    // Vérification quotidienne à 10h00 pour les dashboards expirés
    cron.schedule('0 10 * * *', async () => {
      console.log('Running daily expired dashboard check...');
      await this.checkExpiredDashboards();
    });

    this.isRunning = true;
    console.log('Dashboard Notification Service started successfully');
  }

  // Arrête les tâches cron
  stop() {
    // Note: node-cron ne fournit pas de méthode stop globale
    // Dans un vrai projet, vous pourriez stocker les tâches et les arrêter individuellement
    this.isRunning = false;
    console.log('Dashboard Notification Service stopped');
  }

  // Vérifie les dashboards qui expirent dans X jours
  async checkExpiringDashboards(daysBeforeExpiration) {
    try {
      const now = new Date();
      const checkDate = new Date(now.getTime() + (daysBeforeExpiration * 24 * 60 * 60 * 1000));
      
      // Chercher les utilisateurs avec des dashboards qui expirent
      const users = await User.find({
        'dashboards.expiresAt': {
          $exists: true,
          $ne: null,
          $lte: checkDate.toISOString(),
          $gt: now.toISOString()
        }
      }).populate('dashboards.dashboard');

      console.log(`Found ${users.length} users with dashboards expiring in ${daysBeforeExpiration} days`);

      for (const user of users) {
        const expiringDashboards = user.dashboards.filter(d => {
          if (!d.expiresAt) return false;
          const expirationDate = new Date(d.expiresAt);
          return expirationDate <= checkDate && expirationDate > now;
        });

        if (expiringDashboards.length > 0) {
          // Vérifier si on a déjà envoyé un email pour cette période
          const shouldSend = await this.shouldSendNotification(user._id, expiringDashboards, daysBeforeExpiration);
          
          if (shouldSend) {
            const dashboardsForEmail = expiringDashboards.map(d => ({
              name: d.dashboard.name,
              url: d.dashboard.url,
              expiresAt: d.expiresAt
            }));

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

            // Marquer comme envoyé pour éviter les doublons
            await this.markNotificationSent(user._id, expiringDashboards, daysBeforeExpiration);
          }
        }
      }
    } catch (error) {
      console.error('Error checking expiring dashboards:', error);
    }
  }

  // Vérifie les dashboards qui expirent dans X heures (pour les alertes urgentes)
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
      console.error('Error checking expiring dashboards (hours):', error);
    }
  }

  // Vérifie les dashboards expirés
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

            await emailService.sendDashboardExpiredEmail(
              user.email,
              user.name,
              dashboardsForEmail
            );

            await this.markNotificationSent(user._id, expiredDashboards, 'expired');
            
            // Optionnel: Supprimer les dashboards expirés
            // await this.removeExpiredDashboards(user._id, expiredDashboards);
          }
        }
      }
    } catch (error) {
      console.error('Error checking expired dashboards:', error);
    }
  }

  // Vérifie si on doit envoyer une notification (évite les doublons)
  async shouldSendNotification(userId, dashboards, type) {
    // Implémentez votre logique de vérification des doublons ici
    // Vous pourriez utiliser une collection séparée pour tracker les notifications envoyées
    // ou ajouter un champ dans le modèle User pour tracker les dernières notifications
    
    // Pour simplifier, on retourne true pour l'instant
    // Dans un vrai projet, vérifiez si une notification a déjà été envoyée aujourd'hui
    return true;
  }

  // Marque une notification comme envoyée
  async markNotificationSent(userId, dashboards, type) {
    // Implémentez votre logique de marquage ici
    // Vous pourriez créer une collection 'NotificationLog' ou utiliser un cache Redis
    console.log(`Notification marked as sent for user ${userId}, type: ${type}`);
  }

  // Supprime les dashboards expirés (optionnel)
  async removeExpiredDashboards(userId, expiredDashboards) {
    try {
      const user = await User.findById(userId);
      const expiredIds = expiredDashboards.map(d => d.dashboard._id.toString());
      
      user.dashboards = user.dashboards.filter(
        d => !expiredIds.includes(d.dashboard.toString())
      );
      
      await user.save();
      console.log(`Removed ${expiredDashboards.length} expired dashboards for user ${userId}`);
    } catch (error) {
      console.error('Error removing expired dashboards:', error);
    }
  }

  // Méthode manuelle pour tester les notifications
  async testNotifications() {
    console.log('Testing dashboard notifications...');
    await this.checkExpiringDashboards(7);
    await this.checkExpiringDashboards(1);
    await this.checkExpiringDashboardsHours(24);
    await this.checkExpiredDashboards();
    console.log('Test completed');
  }
}

module.exports = new DashboardNotificationService();