import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Mail, Lock, Eye, EyeOff, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginFormProps {
  onToggleToSignup: () => void;
}

export default function LoginForm({ onToggleToSignup }: LoginFormProps) {
  const { login, error, loading, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    // Field validations
    if (!email.trim() || !password.trim()) {
      setValidationError('Please fill in all credentials.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    await login(email, password);
  };

  // Quick action to seed the demo user
  const handleQuickDemo = () => {
    setEmail('demo@jolshaa.com');
    setPassword('Password123!');
    setValidationError(null);
    clearError();
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl shadow-rose-100 border border-pink-100 overflow-hidden">
      {/* Visual Header Banner */}
      <div className="bg-gradient-to-br from-rose-500 to-orange-400 p-8 text-center text-white relative">
        <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md rounded-full p-2">
          <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
        </div>
        <h2 className="text-3xl font-black font-sans tracking-tight">Welcome Back</h2>
        <p className="text-pink-50 text-xs mt-2 font-medium">
          Step back into Jolshaa - the digital lounge for lively assemblies.
        </p>
      </div>

      <div className="p-8">
        {/* Error notifications */}
        {(validationError || error) && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs text-red-800 font-medium">
              {validationError || error}
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} id="login-form" className="space-y-5">
          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block" htmlFor="login-email">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-300">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                id="login-email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setValidationError(null);
                }}
                className="w-full pl-11 pr-4 py-3 bg-pink-50/30 border border-pink-100 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 block" htmlFor="login-password">
                Password
              </label>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-300">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                id="login-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setValidationError(null);
                }}
                className="w-full pl-11 pr-11 py-3 bg-pink-50/30 border border-pink-100 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-rose-300 hover:text-rose-500 rounded cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            id="login-submit-btn"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-rose-500 to-orange-400 hover:from-rose-600 hover:to-orange-500 text-white rounded-xl text-sm font-bold shadow-md shadow-rose-100 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-wait"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Demo Fast-login assist card */}
        <div className="mt-6 p-4 bg-amber-50/70 border border-amber-200/50 rounded-2xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              Developer Demo Sandbox
            </span>
            <button
              onClick={handleQuickDemo}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 underline bg-white px-2 py-0.5 rounded-md shadow-sm border border-pink-100 cursor-pointer"
            >
              Autofill Credentials
            </button>
          </div>
          <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
            Test the app instantly! Use the button above to autofill the pre-seeded demo profile credentials (<span className="font-mono">demo@jolshaa.com</span>).
          </p>
        </div>

        {/* Navigate to sign up */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">
            Don't have an account on Jolshaa yet?{' '}
            <button
              onClick={onToggleToSignup}
              className="text-rose-600 font-bold hover:underline cursor-pointer ml-1"
            >
              Sign Up for Free
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
