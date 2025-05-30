import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Lock, Mail, UserPlus, Key, Loader2 } from 'lucide-react';
import './Login.css'
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
    <div id='tous_login' className="bg-gradient-to-br f flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border border-white/20">
          {/* Animated header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-center relative overflow-hidden">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-purple-400 rounded-full opacity-20 animate-blob"></div>
            <div className="absolute -bottom-20 -right-10 w-40 h-40 bg-indigo-400 rounded-full opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-300 rounded-full opacity-20 animate-blob animation-delay-4000"></div>
            
            <h2 className="text-3xl font-bold text-white relative z-10">Bienvenue</h2>
            <p className="text-indigo-100 mt-1 relative z-10">Connectez-vous à votre compte</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email field with floating label */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="h-5 w-5 text-indigo-400" />
                </div>
                <input
                  type="email"
                  placeholder=" "
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block px-4 pb-2 pt-6 w-full text-gray-700 bg-white/50 rounded-lg border border-gray-200 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent peer"
                />
                <label 
                  htmlFor="email" 
                  className="absolute text-sm text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-12 peer-focus:left-12 peer-focus:text-indigo-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3"
                >
                  Adresse email
                </label>
              </div>
              
              {/* Password field with floating label */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="h-5 w-5 text-indigo-400" />
                </div>
                <input
                  type="password"
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block px-4 pb-2 pt-6 w-full text-gray-700 bg-white/50 rounded-lg border border-gray-200 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent peer"
                />
                <label 
                  htmlFor="password" 
                  className="absolute text-sm text-gray-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-12 peer-focus:left-12 peer-focus:text-indigo-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3"
                >
                  Mot de passe
                </label>
              </div>
              
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r cursor-pointer from-indigo-600 to-purple-600 text-white py-3.5 rounded-lg hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 disabled:opacity-70 font-medium flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Connexion en cours...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5" />
                    <span>Se connecter</span>
                  </>
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-sm text-gray-500">ou continuer avec</span>
              </div>
            </div>

            <button 
              onClick={loginWithGoogle}
              className="w-full bg-white cursor-pointer text-gray-700 py-3 rounded-lg border border-gray-300 hover:border-gray-400 hover:shadow-md transition-all duration-300 font-medium flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Google</span>
            </button>

            {message && (
              <div 
                className={`mt-5 p-4 rounded-lg text-center transition-all duration-500 ease-in-out ${
                  message.includes('réussie') 
                    ? 'bg-green-100/90 text-green-700 border border-green-200' 
                    : 'bg-red-100/90 text-red-700 border border-red-200'
                }`}
              >
                {message}
              </div>
            )}

            {needsVerification && (
              <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer animate-pulse">
                <p className="text-amber-800 text-sm mb-3">
                  Votre email n'est pas encore vérifié. Vérifiez votre boîte mail ou cliquez pour renvoyer l'email.
                </p>
                <button
                  onClick={handleResendVerification}
                  disabled={isLoading}
                  className="w-full bg-amber-500 cursor-pointer text-white py-2.5 rounded-lg hover:bg-amber-600 disabled:opacity-50 text-sm flex items-center justify-center space-x-2 transition-colors duration-300"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  <span>Renvoyer l'email de vérification</span>
                </button>
              </div>
            )}

            <div className="mt-6 text-center space-y-3">
              <button 
                onClick={onSwitchToRegister}
                className="text-sm cursor-pointer text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center space-x-1 mx-auto transition-colors duration-300"
              >
                <UserPlus  className="h-4 w-4" />
                <span>Créer un nouveau compte</span>
              </button>
              
              <button 
                onClick={onSwitchToForgotPassword}
                className="text-sm cursor-pointer text-gray-600 hover:text-gray-800 font-medium flex items-center justify-center space-x-1 mx-auto transition-colors duration-300"
              >
                <Key className="h-4 w-4" />
                <span>Mot de passe oublié ?</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;