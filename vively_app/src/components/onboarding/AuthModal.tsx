import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Mail, Lock, Sparkles, ArrowRight, Check } from 'lucide-react';
import { VivelyLogo } from '../common/VivelyLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  onSuccess: (email: string, isNewUser: boolean) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signup',
  onSuccess,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    onSuccess(email.trim(), mode === 'signup');
  };

  const handleSocialAuth = (provider: string) => {
    // Standard social auth flow prompt
    onSuccess(`${provider.toLowerCase()}.user@domain.com`, mode === 'signup');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
      />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden z-10 p-6"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-black flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="text-center pt-2 pb-4 flex flex-col items-center">
          <VivelyLogo size="md" className="mb-2" />
          <h3 className="font-vively text-xl font-extrabold text-black">
            {mode === 'signup' ? 'Create Creator Account' : 'Welcome Back'}
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            {mode === 'signup'
              ? 'Connect with Seoul brands & nurture your 3D plant'
              : 'Access your campaigns, perks & wallet'}
          </p>
        </div>

        {/* Mode Toggle Pills */}
        <div className="flex bg-zinc-100 p-1 rounded-2xl mb-4 text-xs font-semibold">
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              mode === 'signup'
                ? 'bg-black text-white shadow-xs font-bold'
                : 'text-zinc-500 hover:text-black'
            }`}
          >
            Sign Up
          </button>
          <button
            onClick={() => setMode('signin')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              mode === 'signin'
                ? 'bg-black text-white shadow-xs font-bold'
                : 'text-zinc-500 hover:text-black'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-2 mb-4">
          {/* Google */}
          <button
            onClick={() => handleSocialAuth('google')}
            type="button"
            className="w-full py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-black font-semibold text-xs rounded-xl flex items-center justify-center space-x-2.5 transition-all shadow-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.1 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8 0-1.3.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.8 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.1-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Apple */}
          <button
            onClick={() => handleSocialAuth('apple')}
            type="button"
            className="w-full py-2.5 px-4 bg-black hover:bg-zinc-800 text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-2.5 transition-all shadow-xs"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.6-7.85-11.7-14.42-6.41-10.23-11.45-21.78-15.11-34.66-3.66-12.87-5.49-24.8-5.49-35.78 0-16.7 4.17-30.34 12.51-40.91 8.34-10.58 18.7-15.98 31.08-16.2 4.47 0 9.77 1.26 15.9 3.79 6.13 2.53 10.22 3.86 12.28 4 1.52-.22 5.56-1.53 12.11-3.92 6.55-2.39 11.96-3.47 16.23-3.23 10.59.54 19.34 4.3 26.26 11.28 4.13 4.13 7.39 8.92 9.78 14.36-9.13 5.55-13.63 13.06-13.5 22.53.13 8.38 3.51 15.34 10.14 20.89 6.63 5.54 14.46 8.79 23.49 9.74-2.18 6.42-4.9 12.74-8.16 18.96zM119.22 31.84c0-7.39 2.67-14.51 8-21.36 5.34-6.85 11.97-10.48 19.9-10.48.22 1.09.28 2.07.19 2.94-.33 6.96-3.11 13.91-8.33 20.86-5.23 6.96-11.8 10.76-19.76 11.41-.01-1.09 0-2.22 0-3.37z" />
            </svg>
            <span>Continue with Apple</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex py-2 items-center justify-center">
          <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
            Or with email
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div>
            <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="creator@example.com"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B5A8DE] bg-zinc-100"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B5A8DE] bg-zinc-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1">
            <label className="flex items-center space-x-1.5 text-zinc-600 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded text-black focus:ring-black"
              />
              <span>Remember me</span>
            </label>
            <a href="#forgot" className="text-zinc-600 hover:text-black hover:underline">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
          >
            <span>{mode === 'signup' ? 'Proceed to Creator Profile' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4 text-[#B5A8DE]" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};
