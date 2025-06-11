import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ResetPasswordForm = ({ onSwitchToLogin, onSuccess }) => {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      verifyToken(tokenFromUrl);
    } else {
      setMessage('Token de réinitialisation manquant');
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await axios.get(`/api/auth/reset-password/${token}`);
      setEmail(response.data.email);
      setIsValidToken(true);
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Erreur lors de la vérification du token');
      setIsValidToken(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    if (password !== confirmPassword) {
      setMessage('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/auth/reset-password', {
        token,
        password,
        confirmPassword
      });
      setMessage(response.data.message);
      setResetSuccess(true);
      
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Rediriger automatiquement après 3 secondes
      setTimeout(() => {
        handleBackToLogin();
      }, 3000);
      
    } catch (error) {
      setMessage(error.response?.data?.message || 'Erreur lors de la réinitialisation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    // Si onSwitchToLogin est fourni, l'utiliser (pour la modale)
    if (onSwitchToLogin && typeof onSwitchToLogin === 'function') {
      onSwitchToLogin();
    } 
    // Sinon, naviguer vers la page d'accueil
    else {
      navigate('/');
    }
    
    // Appeler onSuccess si fourni
    if (onSuccess && typeof onSuccess === 'function') {
      onSuccess();
    }
  };

  if (isLoading && !resetSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Nouveau mot de passe</h2>
        
        {isValidToken && !resetSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="password"
                placeholder="Nouveau mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="password"
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center justify-center transition-colors duration-200"
            >
              {isLoading ? (
                <span className="animate-pulse">Réinitialisation...</span>
              ) : (
                <>
                  <Lock className="h-5 w-5 mr-2" />
                  Réinitialiser le mot de passe
                </>
              )}
            </button>
          </form>
        ) : resetSuccess ? (
          // Écran de succès
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Mot de passe réinitialisé !</h3>
            <p className="text-gray-600 mb-6">Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.</p>
            
            <button 
              onClick={handleBackToLogin}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors duration-200"
            >
              Se connecter maintenant
            </button>
            
            <p className="text-sm text-gray-500 mt-4">
              Redirection automatique dans 3 secondes...
            </p>
          </div>
        ) : (
          // Écran d'erreur
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
            <p className="text-red-700 mb-6">{message}</p>
            
            <button 
              onClick={handleBackToLogin}
              className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 font-medium transition-colors duration-200"
            >
              Retour à la connexion
            </button>
          </div>
        )}

        {message && isValidToken && !resetSuccess && (
          <div className={`mt-4 p-3 rounded-lg text-center ${
            message.includes('succès') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {!resetSuccess && (
          <p className="mt-6 text-center text-gray-600">
            Retour à la connexion ? 
            <button 
              onClick={handleBackToLogin}
              className="ml-1 text-blue-600 hover:underline font-medium cursor-pointer"
            >
              Se connecter
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordForm;