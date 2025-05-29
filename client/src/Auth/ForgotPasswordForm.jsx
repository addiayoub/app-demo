import React, { useState } from 'react';
import axios from 'axios';
import { Mail } from 'lucide-react';

const ForgotPasswordForm = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await axios.post('/api/auth/forgot-password', { email });
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Erreur lors de la demande de réinitialisation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Réinitialisation du mot de passe</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              <span className="animate-pulse">Envoi...</span>
            ) : (
              <>
                <Mail className="h-5 w-5 mr-2" />
                Envoyer le lien de réinitialisation
              </>
            )}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-center ${
            message.includes('réinitialisation') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
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

export default ForgotPasswordForm;