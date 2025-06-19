const Notification = require('../models/Notification');

const notificationController = {
  // Obtenir les notifications de l'utilisateur
  getNotifications: async (req, res) => {
    try {
      const notifications = await Notification.find({
        user: req.user._id
      }).sort({ createdAt: -1 });

      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  },

  // Marquer une notification comme lue
  markAsRead: async (req, res) => {
    try {
      const notification = await Notification.findOneAndUpdate(
        {
          _id: req.params.id,
          user: req.user._id
        },
        { isRead: true },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({ message: 'Notification non trouvée' });
      }

      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  },

  // Marquer toutes les notifications comme lues
  markAllAsRead: async (req, res) => {
    try {
      await Notification.updateMany(
        { user: req.user._id, isRead: false },
        { $set: { isRead: true } }
      );

      res.json({ message: 'Toutes les notifications marquées comme lues' });
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  },

  // Supprimer une notification
  deleteNotification: async (req, res) => {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id
      });

      if (!notification) {
        return res.status(404).json({ message: 'Notification non trouvée' });
      }

      res.json({ message: 'Notification supprimée avec succès' });
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  },

  // Supprimer toutes les notifications
  clearAll: async (req, res) => {
    try {
      await Notification.deleteMany({ user: req.user._id });

      res.json({ message: 'Toutes les notifications ont été supprimées' });
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }
};

module.exports = notificationController;