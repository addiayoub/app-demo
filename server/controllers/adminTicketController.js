const Ticket = require('../models/Ticket');
const User = require('../models/User');
const emailService = require('../services/emailService');
const Notification = require('../models/Notification');

const adminTicketController = {
  // Obtenir tous les tickets
  getAllTickets: async (req, res) => {
    try {
      const { status, priority, category, sort } = req.query;
      
      let query = {};
      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (category) query.category = category;

      let sortOption = { createdAt: -1 };
      if (sort === 'oldest') sortOption = { createdAt: 1 };
      if (sort === 'updated') sortOption = { lastActivity: -1 };

      const tickets = await Ticket.find(query)
        .populate('user', 'name email avatar')
        .populate('admin', 'name email avatar')
        .sort(sortOption);

      // Marquer comme lus par l'admin
      await Ticket.updateMany(
        { _id: { $in: tickets.map(t => t._id) }, isReadByAdmin: false },
        { $set: { isReadByAdmin: true } }
      );

      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  },

  // Obtenir un ticket spécifique
  getTicket: async (req, res) => {
    try {
      const ticket = await Ticket.findById(req.params.id)
        .populate('user', 'name email avatar')
        .populate('admin', 'name email avatar')
        .populate('replies.user', 'name email avatar');

      if (!ticket) {
        return res.status(404).json({ message: 'Ticket non trouvé' });
      }

      // Marquer comme lu par l'admin s'il ne l'est pas déjà
      if (!ticket.isReadByAdmin) {
        ticket.isReadByAdmin = true;
        await ticket.save();
      }

      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  },

  // Ajouter une réponse admin
 // controllers/adminTicketController.js
 addReply: async (req, res) => {  try {
    const { content } = req.body;
    const adminId = req.user._id;

    const ticket = await Ticket.findById(req.params.id)
      .populate('user', 'name email')
      .populate('admin', 'name email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trouvé' });
    }

    const reply = {
      content,
      user: adminId,
      isAdmin: true,
      createdAt: new Date()
    };

    ticket.replies.push(reply);
    ticket.status = 'pending';
    ticket.admin = adminId;
    ticket.lastActivity = new Date();
    await ticket.save();

    // Émettre l'événement WebSocket
    const io = req.app.get('socketio');
    io.emit('ticketReply', {
      ticketId: ticket._id,
      reply: {
        ...reply,
        user: {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email
        }
      }
    });

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
},
  // Changer le statut du ticket
  updateStatus: async (req, res) => {
    try {
      const { status } = req.body;
      const adminId = req.user._id;

      const ticket = await Ticket.findById(req.params.id)
        .populate('user', 'name email');

      if (!ticket) {
        return res.status(404).json({ message: 'Ticket non trouvé' });
      }

      ticket.status = status;
      ticket.admin = adminId;
      ticket.lastActivity = new Date();
      
      if (status === 'resolved' || status === 'closed') {
        ticket.isReadByUser = false;
      }

      await ticket.save();

      // Créer une notification pour l'utilisateur
      let notificationTitle = '';
      let notificationMessage = '';

      if (status === 'resolved') {
        notificationTitle = 'Ticket résolu';
        notificationMessage = `Votre ticket "${ticket.subject}" a été marqué comme résolu`;
      } else if (status === 'closed') {
        notificationTitle = 'Ticket fermé';
        notificationMessage = `Votre ticket "${ticket.subject}" a été fermé`;
      }

      if (notificationTitle) {
        await Notification.create({
          user: ticket.user._id,
          title: notificationTitle,
          message: notificationMessage,
          type: 'ticket_status',
          relatedId: ticket._id
        });
      }

      // Envoyer un email à l'utilisateur si le statut a changé
      if (status === 'resolved' || status === 'closed') {
        await emailService.sendTicketStatusEmail(
          ticket.user.email,
          ticket.user.name,
          ticket.subject,
          status,
          ticket._id
        );
      }

      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  },

  // Supprimer un ticket
  deleteTicket: async (req, res) => {
    try {
      const ticket = await Ticket.findByIdAndDelete(req.params.id);

      if (!ticket) {
        return res.status(404).json({ message: 'Ticket non trouvé' });
      }

      res.json({ message: 'Ticket supprimé avec succès' });
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  },

  // Statistiques des tickets
  // Statistiques des tickets
  getStats: async (req, res) => {
  try {
    const stats = await Ticket.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
          unassigned: { $sum: { $cond: [{ $eq: ['$admin', null] }, 1, 0] } }
        }
      }
    ]);

    res.json(stats[0] || {
      total: 0,
      open: 0,
      pending: 0,
      resolved: 0,
      closed: 0,
      unassigned: 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
},
getUsers: async (req, res) => {
  try {
    const users = await User.find().select('name email role');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
},

assignTicket: async (req, res) => {
  try {
    const { adminId } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trouvé' });
    }
    ticket.admin = adminId || null;
    ticket.lastActivity = new Date();
    await ticket.save();
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
},
  // Recherche de tickets
  searchTickets: async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.status(400).json({ message: 'Terme de recherche requis' });
      }

      const tickets = await Ticket.find({ $text: { $search: q } })
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(50);

      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }
};

module.exports = adminTicketController;