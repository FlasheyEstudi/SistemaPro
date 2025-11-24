import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, CheckCircle, Info, ShieldAlert } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  type?: 'default' | 'danger' | 'success' | 'warning';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, type = 'default' }) => {
  const [show, setShow] = useState(isOpen);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      // Small delay to allow render before transition
      setTimeout(() => setAnimate(true), 10);
    } else {
      setAnimate(false);
      setTimeout(() => setShow(false), 300); // Wait for exit animation
    }
  }, [isOpen]);

  if (!show) return null;

  const getTypeStyles = () => {
    switch(type) {
        case 'danger': 
            return { icon: <ShieldAlert size={24}/>, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' };
        case 'success': 
            return { icon: <CheckCircle size={24}/>, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' };
        case 'warning': 
            return { icon: <AlertTriangle size={24}/>, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' };
        default: 
            return { icon: <Info size={24}/>, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' };
    }
  };

  const style = getTypeStyles();

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${animate ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* Backdrop with Deep Blur */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div 
        className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all duration-400 cubic-bezier(0.34, 1.56, 0.64, 1) border border-white/20
        ${animate ? 'scale-100 translate-y-0 opacity-100' : 'scale-90 translate-y-8 opacity-0'}`}
      >
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-white/50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${style.bg} ${style.color}`}>
                    {style.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h3>
            </div>
            <button 
                onClick={onClose} 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
            >
                <X size={20} />
            </button>
        </div>

        {/* Body */}
        <div className="px-8 py-8 text-gray-600 leading-relaxed text-sm md:text-base">
            {children}
        </div>

        {/* Footer */}
        {footer && (
            <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3">
                {footer}
            </div>
        )}
      </div>
    </div>
  );
};

export default Modal;