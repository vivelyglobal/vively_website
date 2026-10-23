import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, CheckCircle2, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'info' | 'exp';
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center space-y-1.5 w-full max-w-xs pointer-events-none px-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -8 }}
            className={`pointer-events-auto flex items-center space-x-2 px-3.5 py-2 rounded-2xl shadow-lg text-xs font-semibold backdrop-blur-md ${
              toast.type === 'exp'
                ? 'bg-black text-white'
                : toast.type === 'success'
                ? 'bg-zinc-900 text-white'
                : 'bg-white text-zinc-900'
            }`}
            onClick={() => onDismiss(toast.id)}
          >
            {toast.type === 'exp' ? (
              <Sparkles className="w-3.5 h-3.5 text-[#B5A8DE]" />
            ) : toast.type === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300" />
            ) : (
              <Info className="w-3.5 h-3.5 text-[#B5A8DE]" />
            )}
            <span className="truncate">{toast.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
