import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((msg, duration) => addToast(msg, 'success', duration), [addToast]);
  const error = useCallback((msg, duration) => addToast(msg, 'error', duration), [addToast]);
  const info = useCallback((msg, duration) => addToast(msg, 'info', duration), [addToast]);
  const warning = useCallback((msg, duration) => addToast(msg, 'warning', duration), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, showToast: addToast, removeToast, success, error, info, warning }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          let bgClass = 'bg-white border-blue-200 text-slate-800';
          let icon = <Info className="w-5 h-5 text-blue-600 animate-soft-pulse flex-shrink-0" />;

          if (toast.type === 'success') {
            bgClass = 'bg-white border-emerald-300 text-slate-800';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 animate-soft-pulse flex-shrink-0" />;
          } else if (toast.type === 'error') {
            bgClass = 'bg-white border-rose-300 text-slate-800';
            icon = <AlertCircle className="w-5 h-5 text-rose-600 animate-soft-pulse flex-shrink-0" />;
          } else if (toast.type === 'warning') {
            bgClass = 'bg-white border-amber-300 text-slate-800';
            icon = <AlertTriangle className="w-5 h-5 text-amber-600 animate-soft-pulse flex-shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg ${bgClass} transform transition-all duration-300 ease-out translate-y-0 opacity-100 hover:shadow-xl`}
              role="alert"
            >
              <div className="mt-0.5">{icon}</div>
              <div className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-700 transition p-1 -mr-1 -mt-1 rounded-lg hover:bg-slate-100"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
