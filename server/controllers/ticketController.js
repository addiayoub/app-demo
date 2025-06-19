const Ticket = require('../models/Ticket');
const User = require('../models/User');
const EmailService = require('../services/emailService');
const path = require('path');
const fs = require('fs').promises;
const mongoose = require('mongoose');

exports.createTicket = async (req, res) => {
  try {
    const { subject, message, priority, category } = req.body;
    const userId = req.user._id;

    // Traitement des pièces jointes
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        attachments.push({
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path
        });
      }
    }

    const ticket = new Ticket({
      subject,
      message,
      priority,
      category,
      user: userId,
      attachments
    });

    await ticket.save();

    // Notification via WebSocket
    const io = req.app.get('socketio');
    io.emit('newTicket', {
      _id: ticket._id,
      subject: ticket.subject,
      category: ticket.category,
      createdAt: ticket.createdAt,
      user: {
        name: req.user.name,
        email: req.user.email
      }
    });

    // Notification aux admins
    const adminUsers = await User.find({ role: 'admin' });
    const adminEmails = adminUsers.map(admin => admin.email);

    if (adminEmails.length > 0) {
      await EmailService.sendNewTicketNotification(
        adminEmails,
        req.user.name,
        ticket
      );
    }

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Erreur création ticket:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getTickets = async (req, res) => {
  try {
    const { status } = req.query;
    const userId = req.user._id;

    let query = { user: userId };
    if (status && ['open', 'pending', 'closed'].includes(status)) {
      query.status = status;
    }

    const tickets = await Ticket.find(query).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('user', 'name email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addReply = async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);

    const ticket = await Ticket.findOne({
      _id: req.params.id,
      $or: [
        { user: userId },
        { admin: userId }
      ]
    }).populate('user', 'name email').populate('admin', 'name email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Traitement des pièces jointes
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        attachments.push({
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path
        });
      }
    }

    const reply = {
      content,
      user: userId,
      isAdmin: user.role === 'admin',
      attachments,
      createdAt: new Date()
    };

    ticket.replies.push(reply);
    ticket.status = user.role === 'admin' ? 'pending' : 'open';
    ticket.lastActivity = new Date();
    
    if (user.role === 'admin') {
      ticket.isReadByUser = false;
      ticket.isReadByAdmin = true;
    } else {
      ticket.isReadByUser = true;
      ticket.isReadByAdmin = false;
    }

    await ticket.save();

    // Préparer les données pour WebSocket
    const replyData = {
      _id: reply._id || new mongoose.Types.ObjectId(),
      content: reply.content,
      createdAt: reply.createdAt,
      isAdmin: reply.isAdmin,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      attachments: reply.attachments
    };

    // Envoyer la notification via WebSocket
    const io = req.app.get('socketio');
    
    io.emit('ticketReply', {
      ticketId: ticket._id,
      ticketSubject: ticket.subject,
      reply: replyData,
      ticketOwner: {
        _id: ticket.user._id,
        name: ticket.user.name,
        email: ticket.user.email
      },
      admin: ticket.admin ? {
        _id: ticket.admin._id,
        name: ticket.admin.name,
        email: ticket.admin.email
      } : null
    });

    // Envoyer les notifications par email
    if (user.role !== 'admin') {
      // Notification aux admins
      const adminUsers = await User.find({ role: 'admin' });
      const adminEmails = adminUsers.map(admin => admin.email);

      if (adminEmails.length > 0) {
        await EmailService.sendTicketReplyNotification(
          adminEmails,
          user.name,
          ticket,
          content
        );
      }
    } else {
      // Notification à l'utilisateur
      if (ticket.user.email) {
        await EmailService.sendAdminReplyNotification(
          ticket.user.email,
          ticket.user.name,
          ticket,
          content
        );
      }
    }

    res.json(ticket);
  } catch (error) {
    console.error('Erreur ajout réponse:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.closeTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id
      },
      { status: 'closed' },
      { new: true }
    ).populate('user', 'name email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Notification WebSocket pour la fermeture du ticket
    const io = req.app.get('socketio');
    io.emit('ticketClosed', {
      ticketId: ticket._id,
      ticketSubject: ticket.subject,
      closedBy: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email
      },
      closedAt: new Date()
    });

    await EmailService.sendTicketClosedNotification(
      req.user.email,
      req.user.name,
      ticket
    );

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Notification WebSocket pour la suppression du ticket
    const io = req.app.get('socketio');
    io.emit('ticketDeleted', {
      ticketId: ticket._id,
      ticketSubject: ticket.subject,
      deletedBy: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email
      },
      deletedAt: new Date()
    });

    // Supprimer les fichiers attachés
    if (ticket.attachments && ticket.attachments.length > 0) {
      for (const attachment of ticket.attachments) {
        try {
          await fs.unlink(attachment.path);
        } catch (err) {
          console.error('Erreur suppression fichier:', err);
        }
      }
    }

    // Supprimer les fichiers des réponses
    if (ticket.replies && ticket.replies.length > 0) {
      for (const reply of ticket.replies) {
        if (reply.attachments && reply.attachments.length > 0) {
          for (const attachment of reply.attachments) {
            try {
              await fs.unlink(attachment.path);
            } catch (err) {
              console.error('Erreur suppression fichier réponse:', err);
            }
          }
        }
      }
    }

    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Nouvelle route pour télécharger les pièces jointes
exports.downloadAttachment = async (req, res) => {
  try {
    const { ticketId, attachmentId } = req.params;
    const userId = req.user._id;

    const ticket = await Ticket.findOne({
      _id: ticketId,
      user: userId
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Chercher dans les pièces jointes du ticket principal
    let attachment = ticket.attachments.find(att => att._id.toString() === attachmentId);
    
    // Si pas trouvé, chercher dans les réponses
    if (!attachment) {
      for (const reply of ticket.replies) {
        if (reply.attachments) {
          attachment = reply.attachments.find(att => att._id.toString() === attachmentId);
          if (attachment) break;
        }
      }
    }

    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    // Vérifier que le fichier existe
    try {
      await fs.access(attachment.path);
    } catch (err) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Définir les headers pour le téléchargement
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
    res.setHeader('Content-Type', attachment.mimetype);
    
    // Envoyer le fichier
    res.sendFile(path.resolve(attachment.path));
  } catch (error) {
    console.error('Erreur téléchargement:', error);
    res.status(500).json({ message: error.message });
  }
};