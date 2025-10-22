import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

// SVG Icons for better quality and accessibility
const SuccessIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
);

const ErrorIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
);

const CloseIcon = () => (
     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
    </svg>
);


const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Handles animations and auto-close timer
  useEffect(() => {
    // 1. Animate in on mount
    setIsVisible(true);

    // 2. Set timer for auto-close
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleClose = () => {
    // Animate out
    setIsVisible(false);
    // Remove from DOM after animation completes
    setTimeout(() => {
      onClose();
    }, 300); // This duration must match the CSS transition duration
  };

  const baseClasses = "w-full px-4 py-3 rounded-lg shadow-2xl text-white flex items-center transition-all duration-300 ease-in-out";
  const typeClasses = {
    success: 'bg-green-600',
    error: 'bg-red-600',
  };
  
  // Controls the slide-in and fade-in/out animations
  const visibilityClasses = isVisible 
    ? 'opacity-100 translate-x-0'
    : 'opacity-0 translate-x-full';


  return (
    <div className={`${baseClasses} ${typeClasses[type]} ${visibilityClasses}`} role="alert">
       <div className="flex-shrink-0">
        {type === 'success' ? <SuccessIcon /> : <ErrorIcon />}
      </div>
      <p className="flex-grow px-3 font-medium">{message}</p>
      <button 
        onClick={handleClose} 
        aria-label="Fechar notificação" 
        className="p-1 rounded-full opacity-80 hover:opacity-100 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
      >
        <CloseIcon />
      </button>
    </div>
  );
};

export default Toast;
