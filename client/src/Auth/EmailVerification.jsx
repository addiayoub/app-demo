import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EmailVerification = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [hasVerified, setHasVerified] = useState(false); // Pour éviter les doubles appels

  useEffect(() => {
    const verifyEmail = async () => {
      // Éviter les doubles appels
      if (hasVerified) return;
      
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      if (!token) {
        setMessage('Token de vérification manquant dans l\'URL');
        setIsLoading(false);
        return;
      }

      setHasVerified(true); // Marquer comme en cours de vérification

      try {
        console.log('Tentative de vérification avec le token:', token);
        const response = await axios.get(`/api/auth/verify-email/${token}`);
        
        console.log('Réponse de vérification:', response.data);
        setMessage(response.data.message);
        setIsVerified(true);
        
        // Nettoyer l'URL pour éviter les rechargements accidentels
        window.history.replaceState({}, document.title, window.location.pathname);
        
      } catch (error) {
        console.error('Erreur lors de la vérification:', error);
        setMessage(error.response?.data?.message || 'Erreur lors de la vérification');
        setIsVerified(false);
        setHasVerified(false); // Permettre de réessayer en cas d'erreur réseau
      } finally {
        setIsLoading(false);
      }
    };

    // Délai court pour éviter les doubles appels rapides
    const timeoutId = setTimeout(verifyEmail, 100);
    
    return () => clearTimeout(timeoutId);
  }, []); // Dependency array vide pour n'exécuter qu'une fois

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de votre email en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            isVerified ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {isVerified ? (
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
              </svg>
            ) : (
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {isVerified ? 'Email vérifié !' : 'Vérification échouée'}
          </h2>
        </div>

        <div className={`p-4 rounded-lg mb-6 ${
          isVerified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>

        <div className="space-y-3">
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            {isVerified ? 'Se connecter maintenant' : 'Retour à la connexion'}
          </button>
          
          {!isVerified && (
            <button
              onClick={() => window.location.href = '/register'}
              className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
            >
              Créer un nouveau compte
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;