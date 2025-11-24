import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastProps {
  toast: ToastMessage;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for exit animation
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-white',
          border: 'border-l-4 border-green-500',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          icon: <CheckCircle size={20} />
        };
      case 'error':
        return {
          bg: 'bg-white',
          border: 'border-l-4 border-red-500',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          icon: <AlertTriangle size={20} />
        };
      case 'info':
      default:
        return {
          bg: 'bg-white',
          border: 'border-l-4 border-blue-500',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          icon: <Info size={20} />
        };
    }
  };

  const styles = getStyles();

  return (
    <div className={`fixed top-6 right-6 z-[60] transition-all duration-300 ease-in-out transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
      <div className={`flex items-start w-full max-w-sm overflow-hidden rounded-xl shadow-2xl ${styles.bg} ${styles.border} backdrop-blur-md bg-opacity-95`}>
        
        <div className="flex-1 p-4 flex gap-4">
          <div className={`shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full ${styles.iconBg} ${styles.iconColor}`}>
            {styles.icon}
          </div>
          <div className="pt-0.5">
            <h3 className="text-sm font-bold text-gray-900 mb-1">{toast.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{toast.message}</p>
          </div>
        </div>

        <button 
          onClick={() => setIsVisible(false)} 
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors mt-2 mr-2"
        >
          <X size={16} />
        </button>

      </div>
      {/* Progress Bar */}
      {isVisible && (
         <div className={`h-1 ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'} toast-progress rounded-b-xl`}></div>
      )}
    </div>
  );
};

export default Toast;