
import React, { useState } from 'react';
import { useStore } from '../store';
import { Home, BookOpen, Users, Settings, LogOut, FileText, Bell, Paperclip, CheckSquare, Calendar, Award, Clock, PlusCircle, ClipboardList } from 'lucide-react';
import { Role } from '../types';
import Modal from './Modal';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { currentUser, logout, currentCampus } = useStore();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const getMenuItems = () => {
    switch (currentUser?.role) {
      case Role.ADMIN:
        return [
          { id: 'overview', label: 'Inicio', icon: Home },
          { id: 'users', label: 'Usuarios', icon: Users },
          { id: 'academic', label: 'Académico', icon: BookOpen },
          { id: 'enrollment', label: 'Matrícula', icon: ClipboardList }, 
          { id: 'scholarships', label: 'Becas', icon: Award },
          { id: 'notifications', label: 'Avisos', icon: Bell },
          { id: 'settings', label: 'Configuración', icon: Settings },
        ];
      case Role.PROFESSOR:
        return [
          { id: 'overview', label: 'Inicio', icon: Home },
          { id: 'grades', label: 'Notas', icon: BookOpen },
          { id: 'attendance', label: 'Asistencia', icon: Users },
          { id: 'resources', label: 'Recursos', icon: Paperclip },
          { id: 'settings', label: 'Perfil', icon: Settings },
        ];
      case Role.STUDENT:
        return [
          { id: 'overview', label: 'Inicio', icon: Home },
          { id: 'enroll', label: 'Inscripción', icon: PlusCircle },
          { id: 'schedule', label: 'Horario', icon: Clock },
          { id: 'history', label: 'Historial', icon: FileText },
          { id: 'scholarships', label: 'Becas', icon: Award },
          { id: 'notes', label: 'Bloc Notas', icon: CheckSquare },
          { id: 'profile', label: 'Perfil', icon: Users },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full glass z-30 px-4 py-3 flex justify-between items-center border-b border-gray-200">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">U</div>
             <span className="font-bold text-gray-800 text-sm truncate max-w-[150px]">{currentCampus?.name}</span>
          </div>
          <button onClick={() => setActiveTab(currentUser?.role === Role.STUDENT ? 'profile' : 'settings')}>
            <img src={currentUser?.avatar_url || 'https://picsum.photos/200'} className="w-8 h-8 rounded-full border border-gray-200 shadow-sm object-cover" alt="Profile" />
          </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed h-full glass border-r border-gray-200 z-20 top-0 left-0">
        <div className="p-6 flex items-center space-x-3 border-b border-gray-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-200">
            U
          </div>
          <div>
            <h1 className="font-bold text-gray-800">UniSystem</h1>
            <p className="text-xs text-gray-500 truncate max-w-[120px]">{currentCampus?.name}</p>
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <div className="flex items-center space-x-3 mb-6 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <img 
              src={currentUser?.avatar_url || 'https://picsum.photos/200'} 
              alt="Profile" 
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
            />
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-gray-900 truncate">{currentUser?.full_name}</p>
              <p className="text-xs text-gray-500 capitalize">{currentUser?.role}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-100">
          <button onClick={() => setShowLogoutModal(true)} className="w-full flex items-center space-x-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
            <LogOut size={20} />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-24 md:pb-8 min-h-screen">
        <div className="p-4 md:p-8 max-w-7xl mx-auto fade-in-up">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 w-full glass border-t border-gray-200 z-30 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center p-2 overflow-x-auto no-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center p-2 min-w-[60px] rounded-xl transition-all ${
                  isActive ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <div className={`${isActive ? 'bg-blue-100 px-4 py-1 rounded-full' : ''} mb-1 transition-all`}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-medium whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
          {/* Mobile Logout Button */}
          <button
                onClick={() => setShowLogoutModal(true)}
                className="flex flex-col items-center p-2 min-w-[60px] rounded-xl text-red-400"
              >
                <div className="mb-1">
                  <LogOut size={22} />
                </div>
                <span className="text-[10px] font-medium whitespace-nowrap">Salir</span>
          </button>
        </div>
      </div>

      {/* LOGOUT CONFIRMATION MODAL */}
      <Modal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)}
        title="Cerrar Sesión"
        type="warning"
        footer={
          <>
            <button onClick={() => setShowLogoutModal(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors w-full sm:w-auto">
              Cancelar
            </button>
            <button onClick={logout} className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-lg shadow-red-200 transition-colors w-full sm:w-auto">
              Salir Ahora
            </button>
          </>
        }
      >
        <p>¿Estás seguro de que deseas cerrar tu sesión? Perderás cualquier cambio no guardado.</p>
      </Modal>
    </div>
  );
};

export default Layout;
