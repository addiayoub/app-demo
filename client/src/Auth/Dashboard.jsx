import React from 'react';
import { useAuth } from './AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Tableau de bord</h1>
            <button 
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Se déconnecter
            </button>
          </div>
          
          <div className="p-6">
            <div className="bg-gray-50 rounded-lg p-6">
              {user?.avatar && (
                <img 
                  src={user.avatar} 
                  alt="Avatar" 
                  className="w-16 h-16 rounded-full mx-auto mb-4"
                />
              )}
              <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                Bienvenue, {user?.name}!
              </h2>
              
              <div className="space-y-3 text-gray-600">
                <p><span className="font-medium">Email:</span> {user?.email}</p>
                <p><span className="font-medium">Méthode d'authentification:</span> {user?.authMethod === 'google' ? 'Google' : 'Local'}</p>
                <p><span className="font-medium">Statut:</span> 
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${
                    user?.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user?.isVerified ? 'Vérifié' : 'Non vérifié'}
                  </span>
                </p>
                <p><span className="font-medium">Membre depuis:</span> {new Date(user?.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;