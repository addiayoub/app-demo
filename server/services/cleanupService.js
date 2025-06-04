// services/cleanupService.js
const User = require('../models/User');

class CleanupService {
  constructor() {
    this.isRunning = false;
    this.lastCleanup = null;
    this.stats = {
      totalRuns: 0,
      totalExpiredDashboards: 0,
      totalUsersAffected: 0,
      lastRunStats: null
    };
    // Définir le fuseau horaire (ajustez selon votre localisation)
    this.timezone = 'Africa/Casablanca'; // ou 'Europe/Paris', 'UTC', etc.
  }

  /**
   * Obtient la date/heure actuelle dans le bon fuseau horaire
   */
  getCurrentTime() {
    return new Date();
  }

  /**
   * Formate une date pour l'affichage avec le bon fuseau horaire
   */
  formatDateTime(date) {
    return new Intl.DateTimeFormat('fr-FR', {
      timeZone: this.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    }).format(date);
  }

  /**
   * Nettoie les dashboards expirés pour tous les utilisateurs
   */
  async cleanupExpiredDashboards() {
    if (this.isRunning) {
      console.log('🔄 Nettoyage déjà en cours...');
      return;
    }

    this.isRunning = true;
    const startTime = this.getCurrentTime();
    
    try {
      const now = this.getCurrentTime();
      let totalExpiredDashboards = 0;
      let usersAffected = 0;

      // Log avec l'heure locale correcte
      console.log(`🧹 Début du nettoyage manuel des dashboards expirés... ${this.formatDateTime(now)}`);

      // Trouver tous les utilisateurs avec des dashboards expirés
      const usersWithExpiredDashboards = await User.find({
        'dashboards.expiresAt': { $lt: now, $ne: null }
      });
      
      if (usersWithExpiredDashboards.length === 0) {
        console.log('✅ Aucun dashboard expiré trouvé');
        return {
          totalExpiredDashboards: 0,
          usersAffected: 0,
          message: 'Aucun dashboard expiré trouvé',
          timestamp: this.formatDateTime(now)
        };
      }

      console.log(`📊 ${usersWithExpiredDashboards.length} utilisateur(s) avec des dashboards expirés trouvé(s)`);

      // Nettoyer chaque utilisateur
      for (const user of usersWithExpiredDashboards) {
        const expiredDashboards = user.dashboards.filter(d => 
          d.expiresAt && new Date(d.expiresAt) < now
        );

        if (expiredDashboards.length > 0) {
          console.log(`🔄 Nettoyage de ${expiredDashboards.length} dashboard(s) expiré(s) pour l'utilisateur ${user.email}`);
          
          // Supprimer les dashboards expirés
          user.dashboards = user.dashboards.filter(d => 
            !d.expiresAt || new Date(d.expiresAt) >= now
          );

          await user.save();
          
          totalExpiredDashboards += expiredDashboards.length;
          usersAffected++;

          // Log des dashboards supprimés avec formatage de date
          expiredDashboards.forEach(dashboard => {
            console.log(`  ❌ Dashboard ${dashboard.dashboard} expiré le ${this.formatDateTime(new Date(dashboard.expiresAt))}`);
          });
        }
      }

      // Mettre à jour les statistiques
      this.stats.totalRuns++;
      this.stats.totalExpiredDashboards += totalExpiredDashboards;
      this.stats.totalUsersAffected += usersAffected;
      this.stats.lastRunStats = {
        timestamp: startTime,
        timestampFormatted: this.formatDateTime(startTime),
        expiredDashboards: totalExpiredDashboards,
        usersAffected: usersAffected,
        duration: this.getCurrentTime() - startTime
      };

      this.lastCleanup = startTime;

      const endTime = this.getCurrentTime();
      console.log(`✅ Nettoyage terminé: ${totalExpiredDashboards} dashboard(s) supprimé(s) pour ${usersAffected} utilisateur(s)`);
      console.log(`⏱️  Durée: ${endTime - startTime}ms`);
      console.log(`🕐 Terminé à: ${this.formatDateTime(endTime)}`);

      return {
        totalExpiredDashboards,
        usersAffected,
        duration: endTime - startTime,
        message: `${totalExpiredDashboards} dashboard(s) supprimé(s) pour ${usersAffected} utilisateur(s)`,
        timestamp: this.formatDateTime(endTime)
      };

    } catch (error) {
      console.error('❌ Erreur lors du nettoyage des dashboards expirés:', error);
      console.error(`🕐 Erreur survenue à: ${this.formatDateTime(this.getCurrentTime())}`);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Obtient les statistiques du service
   */
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      lastCleanup: this.lastCleanup,
      lastCleanupFormatted: this.lastCleanup ? this.formatDateTime(this.lastCleanup) : null,
      currentTime: this.formatDateTime(this.getCurrentTime()),
      timezone: this.timezone
    };
  }

  /**
   * Obtient le nombre de dashboards expirés sans les supprimer
   */
  async getExpiredDashboardsCount() {
    try {
      const now = this.getCurrentTime();
      const users = await User.find({
        'dashboards.expiresAt': { $lt: now, $ne: null }
      });

      let totalExpired = 0;
      const expiredDetails = [];
      
      users.forEach(user => {
        const expired = user.dashboards.filter(d => 
          d.expiresAt && new Date(d.expiresAt) < now
        );
        totalExpired += expired.length;
        
        if (expired.length > 0) {
          expiredDetails.push({
            userEmail: user.email,
            expiredCount: expired.length,
            dashboards: expired.map(d => ({
              dashboard: d.dashboard,
              expiresAt: d.expiresAt,
              expiresAtFormatted: this.formatDateTime(new Date(d.expiresAt))
            }))
          });
        }
      });

      return {
        totalExpiredDashboards: totalExpired,
        usersAffected: users.length,
        details: expiredDetails,
        checkedAt: this.formatDateTime(now)
      };
    } catch (error) {
      console.error('Erreur lors du comptage des dashboards expirés:', error);
      return { 
        totalExpiredDashboards: 0, 
        usersAffected: 0, 
        details: [],
        checkedAt: this.formatDateTime(this.getCurrentTime()),
        error: error.message
      };
    }
  }

  /**
   * Nettoyage manuel
   */
  async manualCleanup() {
    console.log(`🔧 Nettoyage manuel déclenché à ${this.formatDateTime(this.getCurrentTime())}`);
    return await this.cleanupExpiredDashboards();
  }

  /**
   * Configuration du fuseau horaire
   */
  setTimezone(timezone) {
    this.timezone = timezone;
    console.log(`🌍 Fuseau horaire configuré: ${timezone}`);
  }
}

// Singleton
const cleanupService = new CleanupService();

module.exports = cleanupService;