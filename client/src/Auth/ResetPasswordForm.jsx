import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Lock } from 'lucide-react';

const ResetPasswordForm = ({ onSwitchToLogin }) => {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);

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
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Erreur lors de la réinitialisation');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
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
        
        {isValidToken ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="password"
                placeholder="Nouveau mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center justify-center"
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
        ) : (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
            <p className="text-red-700">{message}</p>
          </div>
        )}

        {message && isValidToken && (
          <div className={`mt-4 p-3 rounded-lg text-center ${
            message.includes('succès') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <p className="mt-6 text-center text-gray-600">
          Retour à la connexion ? 
          <button 
            onClick={onSwitchToLogin}
            className="ml-1 text-blue-600 hover:underline font-medium"
          >
            Se connecter
          </button>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordForm;