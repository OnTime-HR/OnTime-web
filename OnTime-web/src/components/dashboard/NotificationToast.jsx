// src/components/dashboard/NotificationToast.jsx
import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

const NotificationToast = ({ isOpen, type, message, onClose }) => {
  // Automatically slide out and dismiss after 4 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isSuccess = type === 'success';

  return (
    <div className="fixed top-6 right-6 z-[9999] animate-in fade-in slide-in-from-top-4 duration-300">
      <div className={`flex items-center gap-3.5 px-5 py-4 rounded-2xl border shadow-lg backdrop-blur-md min-w-[320px] max-w-md ${
        isSuccess 
          ? 'bg-emerald-50/90 border-emerald-100 text-emerald-900' 
          : 'bg-rose-50/90 border-rose-100 text-rose-900'
      }`}>
        {/* Status Graphic Node */}
        <div>
          {isSuccess ? (
            <CheckCircle className="text-emerald-500" size={22} />
          ) : (
            <AlertCircle className="text-rose-500" size={22} />
          )}
        </div>

        {/* Message String Content */}
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider opacity-60">
            {isSuccess ? 'System Success' : 'Database Error'}
          </p>
          <p className="text-xs font-semibold leading-relaxed mt-0.5">{message}</p>
        </div>

        {/* Manual Close Cross Trigger */}
        <button
          type="button"
          onClick={onClose}
          className={`p-1 rounded-lg transition-colors ${
            isSuccess ? 'hover:bg-emerald-100/60' : 'hover:bg-rose-100/60'
          }`}
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};

export default NotificationToast;