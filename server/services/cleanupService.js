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
      return {
        totalExpiredDashboards: 0,
        usersAffected: 0,
        message: 'Nettoyage déjà en cours',
        timestamp: this.formatDateTime(this.getCurrentTime())
      };
    }

    this.isRunning = true;
    const startTime = this.getCurrentTime();
    
    try {
      const now = this.getCurrentTime();
      let totalExpiredDashboards = 0;
      let usersAffected = 0;

      // Log avec l'heure locale correcte
      console.log(`🧹 Début du nettoyage manuel des dashboards expirés... ${this.formatDateTime(now)}`);
      console.log(`🕐 Heure actuelle: ${now.toISOString()}`);

      // CORRECTION 1: Rechercher correctement les utilisateurs avec des dashboards expirés
      // On cherche tous les utilisateurs qui ont au moins un dashboard avec expiresAt défini
      const allUsersWithDashboards = await User.find({
        'dashboards': { $exists: true, $not: { $size: 0 } }
      });
      
      console.log(`👥 ${allUsersWithDashboards.length} utilisateur(s) avec des dashboards trouvé(s)`);

      const usersToUpdate = [];

      // CORRECTION 2: Vérifier chaque utilisateur individuellement
      for (const user of allUsersWithDashboards) {
        const expiredDashboards = [];
        const validDashboards = [];

        console.log(`🔍 Vérification utilisateur: ${user.email}`);
        console.log(`📊 Dashboards de l'utilisateur:`, user.dashboards.map(d => ({
          dashboard: d.dashboard,
          expiresAt: d.expiresAt,
          expiresAtISO: d.expiresAt ? new Date(d.expiresAt).toISOString() : null,
          isExpired: d.expiresAt ? new Date(d.expiresAt) < now : false
        })));

        // CORRECTION 3: Séparer les dashboards expirés des valides
        user.dashboards.forEach(dashboard => {
          if (dashboard.expiresAt) {
            const expirationDate = new Date(dashboard.expiresAt);
            
            // Debug: afficher la comparaison
            console.log(`  📋 Dashboard ${dashboard.dashboard}:`);
            console.log(`     - Expire le: ${expirationDate.toISOString()}`);
            console.log(`     - Maintenant: ${now.toISOString()}`);
            console.log(`     - Expiré?: ${expirationDate < now}`);
            
            if (expirationDate < now) {
              expiredDashboards.push(dashboard);
              console.log(`     ❌ EXPIRÉ - Sera supprimé`);
            } else {
              validDashboards.push(dashboard);
              console.log(`     ✅ VALIDE - Sera conservé`);
            }
          } else {
            // Dashboard sans expiration = valide
            validDashboards.push(dashboard);
            console.log(`  📋 Dashboard ${dashboard.dashboard}: ♾️ PERMANENT - Sera conservé`);
          }
        });

        // Si des dashboards sont expirés, préparer la mise à jour
        if (expiredDashboards.length > 0) {
          console.log(`🔄 ${expiredDashboards.length} dashboard(s) expiré(s) trouvé(s) pour ${user.email}`);
          
          usersToUpdate.push({
            user: user,
            expiredDashboards: expiredDashboards,
            validDashboards: validDashboards
          });
          
          totalExpiredDashboards += expiredDashboards.length;
          usersAffected++;
        }
      }

      // CORRECTION 4: Effectuer les mises à jour si nécessaire
      if (usersToUpdate.length === 0) {
        console.log('✅ Aucun dashboard expiré trouvé');
        return {
          totalExpiredDashboards: 0,
          usersAffected: 0,
          message: 'Aucun dashboard expiré trouvé',
          timestamp: this.formatDateTime(now)
        };
      }

      // Mettre à jour chaque utilisateur
      for (const updateInfo of usersToUpdate) {
        const { user, expiredDashboards, validDashboards } = updateInfo;
        
        console.log(`💾 Mise à jour de l'utilisateur ${user.email}:`);
        console.log(`   - Dashboards à supprimer: ${expiredDashboards.length}`);
        console.log(`   - Dashboards à conserver: ${validDashboards.length}`);
        
        // CORRECTION 5: Mettre à jour avec seulement les dashboards valides
        user.dashboards = validDashboards;
        await user.save();
        
        console.log(`✅ Utilisateur ${user.email} mis à jour avec succès`);
        
        // Log des dashboards supprimés
        expiredDashboards.forEach(dashboard => {
          console.log(`  ❌ Dashboard ${dashboard.dashboard} supprimé (expiré le ${this.formatDateTime(new Date(dashboard.expiresAt))})`);
        });
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
      console.log(`🔍 Vérification des dashboards expirés à: ${now.toISOString()}`);
      
      const allUsersWithDashboards = await User.find({
        'dashboards': { $exists: true, $not: { $size: 0 } }
      });

      let totalExpired = 0;
      const expiredDetails = [];
      
      allUsersWithDashboards.forEach(user => {
        const expired = user.dashboards.filter(d => {
          if (!d.expiresAt) return false;
          const expirationDate = new Date(d.expiresAt);
          const isExpired = expirationDate < now;
          
          console.log(`📋 Dashboard ${d.dashboard} pour ${user.email}:`);
          console.log(`   - Expire: ${expirationDate.toISOString()}`);
          console.log(`   - Maintenant: ${now.toISOString()}`);
          console.log(`   - Expiré: ${isExpired}`);
          
          return isExpired;
        });
        
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

      console.log(`📊 Résultat: ${totalExpired} dashboard(s) expiré(s) trouvé(s)`);

      return {
        totalExpiredDashboards: totalExpired,
        usersAffected: expiredDetails.length,
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