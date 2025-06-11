// controllers/contactController.js
const emailService = require('../services/emailService');

const contactController = {
  sendContactMessage: async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      // Validation simple
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ 
          success: false,
          message: 'Tous les champs sont requis' 
        });
      }

      // Valider l'email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false,
          message: 'Adresse email invalide' 
        });
      }

      // Envoyer les emails
      await emailService.sendContactEmail(email, name, subject, message);

      res.json({ 
        success: true,
        message: 'Votre message a été envoyé avec succès. Vous recevrez une copie par email.' 
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de l\'envoi du message',
        error: error.message 
      });
    }
  }
};

module.exports = contactController;