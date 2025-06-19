const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { isAuthenticated } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configuration multer pour les uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/tickets/');
  },
  filename: function (req, file, cb) {
    // Créer un nom unique pour éviter les conflits
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtre pour les types de fichiers autorisés
const fileFilter = (req, file, cb) => {
  // Types de fichiers autorisés
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Formats acceptés: JPG, PNG, GIF, WebP, PDF, TXT, DOC, DOCX, XLS, XLSX'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB par fichier
    files: 3 // Maximum 3 fichiers
  },
  fileFilter: fileFilter
});

// Middleware pour gérer les erreurs multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Fichier trop volumineux. Taille maximum: 5MB' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Trop de fichiers. Maximum: 3 fichiers' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Champ de fichier inattendu' });
    }
  }
  if (error.message.includes('Type de fichier non autorisé')) {
    return res.status(400).json({ message: error.message });
  }
  next(error);
};

// Routes
router.post('/', isAuthenticated, upload.array('attachments', 3), handleMulterError, ticketController.createTicket);
router.get('/', isAuthenticated, ticketController.getTickets);
router.get('/:id', isAuthenticated, ticketController.getTicket);
router.post('/:id/reply', isAuthenticated, upload.array('attachments', 3), handleMulterError, ticketController.addReply);
router.put('/:id/close', isAuthenticated, ticketController.closeTicket);
router.delete('/:id', isAuthenticated, ticketController.deleteTicket);

// Route pour télécharger les pièces jointes
router.get('/:ticketId/attachment/:attachmentId', isAuthenticated, ticketController.downloadAttachment);

module.exports = router;