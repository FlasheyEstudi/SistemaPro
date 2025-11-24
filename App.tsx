
import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import { Role } from './types';
import Login from './pages/Login';
import Layout from './components/Layout';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProfessorDashboard from './pages/ProfessorDashboard';

const App = () => {
  const { isAuthenticated, currentUser } = useStore();
  const [activeTab, setActiveTab] = useState('');

  // Set default active tab based on role when user logs in
  useEffect(() => {
    if (currentUser) {
      switch (currentUser.role) {
        case Role.ADMIN: setActiveTab('overview'); break;
        case Role.PROFESSOR: setActiveTab('grades'); break;
        case Role.STUDENT: setActiveTab('overview'); break;
      }
    }
  }, [currentUser]);

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderContent = () => {
    if (!currentUser) return null;

    switch (currentUser.role) {
      case Role.ADMIN:
        return <AdminDashboard currentView={activeTab} />;
      case Role.PROFESSOR:
        return <ProfessorDashboard currentView={activeTab} />;
      case Role.STUDENT:
        // Se pasa setActiveTab para permitir navegación interna (ej. ir a Classroom desde Overview)
        return <StudentDashboard currentView={activeTab} onChangeView={setActiveTab} />;
      default:
        return <div>Rol desconocido</div>;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;