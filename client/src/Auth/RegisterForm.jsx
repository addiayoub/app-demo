import React, { useState } from 'react';
import { useAuth } from './AuthContext';

const RegisterForm = ({ onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const { register, loginWithGoogle, resendVerification } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (password !== confirmPassword) {
      setMessage('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setMessage('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsLoading(true);
    const result = await register(name, email, password);
    setMessage(result.message);
    setIsLoading(false);

    if (result.success && result.emailSent) {
      setEmailSent(true);
      setUserEmail(result.userEmail);
    } else if (!result.success) {
      setPassword('');
      setConfirmPassword('');
    }
  };

  const handleResendVerification = async () => {
    setIsLoading(true);
    const result = await resendVerification(userEmail);
    setMessage(result.message);
    setIsLoading(false);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Vérifiez votre email</h2>
            <p className="text-gray-600 mb-4">
              Un email de vérification a été envoyé à :
            </p>
            <p className="font-semibold text-gray-800 mb-6">{userEmail}</p>
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded-lg ${
              message.includes('succès') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Vous n'avez pas reçu l'email ? Vérifiez votre dossier spam ou cliquez ci-dessous :
            </p>
            <button
              onClick={handleResendVerification}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Envoi...' : 'Renvoyer l\'email de vérification'}
            </button>
            <button
              onClick={onSwitchToLogin}
              className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Inscription</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              placeholder="Nom complet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <input
              type="password"
              placeholder="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {isLoading ? 'Inscription...' : 'S\'inscrire'}
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
            message.includes('succès') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <p className="mt-6 text-center text-gray-600">
          Déjà un compte ? 
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

export default RegisterForm;