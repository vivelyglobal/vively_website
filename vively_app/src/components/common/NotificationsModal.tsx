import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, Sparkles, Package, Gift, HeartHandshake } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPetModal: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onOpenPetModal,
}) => {
  if (!isOpen) return null;

  // Real notifications list (empty by default for new accounts)
  const notifications: Array<{
    id: string;
    title: string;
    description: string;
    time: string;
    type: string;
    icon: any;
    color: string;
  }> = [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
      />
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden z-10 p-5"
      >
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-black" />
            <h3 className="font-vively font-bold text-black text-sm">Notifications</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-black flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {notifications.length > 0 ? (
          <div className="space-y-2.5 pt-3">
            {notifications.map((n) => {
              const Icon = n.icon;
              return (
                <div
                  key={n.id}
                  onClick={() => {
                    if (n.type === 'perk') {
                      onClose();
                      onOpenPetModal();
                    }
                  }}
                  className="p-3 rounded-2xl bg-zinc-50 hover:bg-zinc-100 transition-colors flex items-start space-x-3 cursor-pointer"
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${n.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-black truncate">{n.title}</p>
                      <span className="text-[9px] text-zinc-400">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">
                      {n.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 px-4 text-center space-y-2">
            <div className="w-11 h-11 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
              <Bell className="w-5 h-5 text-zinc-400" />
            </div>
            <h4 className="font-bold text-xs text-zinc-800">You're all caught up!</h4>
            <p className="text-[11px] text-zinc-400 max-w-xs mx-auto leading-relaxed">
              New campaign updates, PR shipping dispatches, and creator perks will appear here.
            </p>
          </div>
        )}

        <div className="mt-4 pt-1 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-black hover:bg-zinc-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
