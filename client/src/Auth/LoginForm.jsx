import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Lock, Mail } from 'lucide-react';

const LoginForm = ({ onSwitchToRegister, onSwitchToForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const { login, loginWithGoogle, resendVerification } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setNeedsVerification(false);

    const result = await login(email, password);
    setMessage(result.message);
    setIsLoading(false);

    if (result.needsVerification) {
      setNeedsVerification(true);
      setUnverifiedEmail(result.email);
    }

    if (!result.success) {
      setPassword('');
    }
  };

  const handleResendVerification = async () => {
    setIsLoading(true);
    const result = await resendVerification(unverifiedEmail);
    setMessage(result.message);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Connexion</h2>
        
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
          
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              <span className="animate-pulse">Connexion...</span>
            ) : (
              <>
                <Lock className="h-5 w-5 mr-2" />
                Se connecter
              </>
            )}
          </button>
        </form>

        <div className="my-6 text-center">
          <span className="text-gray-500">ou</span>
        </div>

        <button 
          onClick={loginWithGoogle}
          className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-medium flex items-center justify-center"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" className="mr-2">
            <path fill="#fff" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
          </svg>
          Continuer avec Google
        </button>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-center ${
            message.includes('réussie') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {needsVerification && (
          <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
            <p className="text-yellow-800 text-sm mb-3">
              Votre email n'est pas encore vérifié. Vérifiez votre boîte mail ou cliquez pour renvoyer l'email.
            </p>
            <button
              onClick={handleResendVerification}
              disabled={isLoading}
              className="w-full bg-yellow-600 text-white py-2 rounded hover:bg-yellow-700 disabled:opacity-50 text-sm flex items-center justify-center"
            >
              <Mail className="h-5 w-5 mr-2" />
              {isLoading ? 'Envoi...' : 'Renvoyer l\'email de vérification'}
            </button>
          </div>
        )}

        <div className="mt-6 text-center text-gray-600 space-y-2">
          <p>
            Pas de compte ? 
            <button 
              onClick={onSwitchToRegister}
              className="ml-1 text-blue-600 hover:underline font-medium"
            >
              S'inscrire
            </button>
          </p>
          <p>
            Mot de passe oublié ? 
            <button 
              onClick={onSwitchToForgotPassword}
              className="ml-1 text-blue-600 hover:underline font-medium"
            >
              Réinitialiser
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;