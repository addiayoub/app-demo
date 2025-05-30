import React from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Trash2, Loader2 } from 'lucide-react';

const MySwal = withReactContent(Swal);

export const showSuccessAlert = (title, message) => {
  MySwal.fire({
    title: (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-center"
      >
        <CheckCircle className="text-green-500 mr-2" size={32} />
        <span className="text-xl font-semibold">{title}</span>
      </motion.div>
    ),
    html: (
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="text-center"
      >
        {message}
      </motion.p>
    ),
    showConfirmButton: false,
    timer: 2000,
    background: '#f8fafc',
    backdrop: `
      rgba(0,0,0,0.4)
      url("/images/confetti.gif")
      center top
      no-repeat
    `,
    customClass: {
      popup: 'border border-green-200 shadow-xl rounded-xl'
    }
  });
};

export const showErrorAlert = (title, message) => {
  MySwal.fire({
    title: (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-center"
      >
        <AlertCircle className="text-red-500 mr-2" size={32} />
        <span className="text-xl font-semibold">{title}</span>
      </motion.div>
    ),
    html: (
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="text-center"
      >
        {message}
      </motion.p>
    ),
    background: '#f8fafc',
    confirmButtonText: 'Compris',
    confirmButtonColor: '#3b82f6',
    customClass: {
      popup: 'border border-red-200 shadow-xl rounded-xl',
      confirmButton: 'px-4 py-2 rounded-lg font-medium'
    }
  });
};

export const showDeleteConfirmation = (userName, onConfirm) => {
  MySwal.fire({
    title: (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-center"
      >
        <Trash2 className="text-red-500 mr-2" size={32} />
        <span className="text-xl font-semibold">Confirmer la suppression</span>
      </motion.div>
    ),
    html: (
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="text-center"
      >
        <p>Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{userName}</strong> ?</p>
        <p className="text-sm text-gray-500 mt-2">Cette action est irréversible.</p>
      </motion.div>
    ),
    showCancelButton: true,
    confirmButtonText: 'Oui, supprimer',
    cancelButtonText: 'Annuler',
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    background: '#f8fafc',
    customClass: {
      popup: 'border border-red-200 shadow-xl rounded-xl',
      confirmButton: 'px-4 py-2 rounded-lg font-medium',
      cancelButton: 'px-4 py-2 rounded-lg font-medium'
    },
    showClass: {
      popup: 'animate__animated animate__fadeInDown'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOutUp'
    }
  }).then((result) => {
    if (result.isConfirmed) {
      onConfirm();
      showSuccessAlert('Supprimé!', 'Utilisateur supprimé avec succès');
    }
  });
};

export const showLoadingAlert = (title) => {
  return MySwal.fire({
    title: (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center"
      >
        <Loader2 className="animate-spin text-blue-500 mr-2" size={28} />
        <span className="text-xl font-semibold">{title}</span>
      </motion.div>
    ),
    allowOutsideClick: false,
    showConfirmButton: false,
    background: '#f8fafc',
    customClass: {
      popup: 'border border-blue-200 shadow-xl rounded-xl'
    }
  });
};