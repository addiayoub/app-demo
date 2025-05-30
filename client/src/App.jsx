import React from 'react';
import { AuthProvider } from './Auth/AuthContext';
import AppRoutes from './AppRoutes';
import './App.css';

const App = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;