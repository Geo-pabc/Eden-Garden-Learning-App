import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onCancel}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
            isDanger ? 'bg-red-50 text-red-500' : 'bg-primary/10 text-primary'
          }`}>
            <AlertTriangle className="w-8 h-8" />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            {message}
          </p>
          
          <div className="flex w-full gap-3">
            <button 
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
            >
              {cancelText}
            </button>
            <button 
              onClick={onConfirm}
              className={`flex-1 px-4 py-3 rounded-xl text-white font-bold shadow-sm transition-all active:scale-95 ${
                isDanger ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-primary hover:bg-primary/90 shadow-primary/20'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
