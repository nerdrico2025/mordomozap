import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import Toast from '../components/Toast';

interface FeedbackContextType {
  success: (message: string) => void;
  error: (message: string) => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export const FeedbackProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
  }, []);
  
  const removeToast = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const success = (message: string) => addToast(message, 'success');
  const error = (message: string) => addToast(message, 'error');

  return (
    <FeedbackContext.Provider value={{ success, error }}>
      {children}
      {/* Container posicionado no canto superior direito para renderizar os toasts */}
      <div className="fixed top-5 right-5 z-[100] w-full max-w-sm space-y-3">
        {toasts.map((toast) => (
          <Toast 
            key={toast.id} 
            message={toast.message} 
            type={toast.type} 
            onClose={() => removeToast(toast.id)} 
          />
        ))}
      </div>
    </FeedbackContext.Provider>
  );
};

export const useFeedback = (): FeedbackContextType => {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};
