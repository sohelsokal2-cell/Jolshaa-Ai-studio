import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Mail, Lock, User as UserIcon, Phone, Calendar, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface SignupFormProps {
  onToggleToLogin: () => void;
}

export default function SignupForm({ onToggleToLogin }: SignupFormProps) {
  const { signup, error, loading, clearError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Simple password strength check variables
  const isLengthValid = password.length >= 6;
  const hasNumber = /\d/.test(password);
  const hasCapital = /[A-Z]/.test(password);

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    // Client side validation checks
    if (!name.trim() || !email.trim() || !password.trim()) {
      setValidationError('Name, email, and password are required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    if (!isLengthValid) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    const signupData = {
      name,
      email,
      password,
      phone: phone.trim() || undefined,
      dateOfBirth: dateOfBirth || undefined,
      gender: gender || undefined,
    };

    const success = await signup(signupData);
    if (success) {
      console.log('Signup completed successfully!');
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-3xl shadow-xl shadow-rose-100 border border-pink-100 overflow-hidden">
      {/* Visual Header */}
      <div className="bg-gradient-to-br from-rose-500 to-orange-400 p-8 text-center text-white relative">
        <h2 className="text-3xl font-black font-sans tracking-tight">Create Account</h2>
        <p className="text-pink-50 text-xs mt-2 font-medium">
          Join Jolshaa today and design your social profile card.
        </p>
      </div>

      <div className="p-8">
        {/* Error notification display */}
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

        <form onSubmit={handleSubmit} id="signup-form" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block" htmlFor="signup-name">
                Full Name *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-300">
                  <UserIcon className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  id="signup-name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setValidationError(null);
                  }}
                  className="w-full pl-11 pr-4 py-2.5 bg-pink-50/30 border border-pink-100 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Email field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block" htmlFor="signup-email">
                Email Address *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-300">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  id="signup-email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setValidationError(null);
                  }}
                  className="w-full pl-11 pr-4 py-2.5 bg-pink-50/30 border border-pink-100 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Password field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block" htmlFor="signup-password">
                Password *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-300">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="signup-password"
                  placeholder="At least 6 chars"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setValidationError(null);
                  }}
                  className="w-full pl-11 pr-11 py-2.5 bg-pink-50/30 border border-pink-100 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
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

            {/* Phone (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block" htmlFor="signup-phone">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-300">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  type="tel"
                  id="signup-phone"
                  placeholder="+1 (555) 019-2834"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-pink-50/30 border border-pink-100 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Password Dynamic Requirements Checklist */}
          {password && (
            <div className="p-3 bg-rose-50/50 rounded-xl border border-pink-100 grid grid-cols-3 gap-2">
              <div className="flex items-center gap-1">
                <CheckCircle2 className={`h-3.5 w-3.5 ${isLengthValid ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span className={`text-[10px] font-semibold ${isLengthValid ? 'text-emerald-800' : 'text-slate-500'}`}>
                  6+ Characters
                </span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className={`h-3.5 w-3.5 ${hasNumber ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span className={`text-[10px] font-semibold ${hasNumber ? 'text-emerald-800' : 'text-slate-500'}`}>
                  Has Number
                </span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className={`h-3.5 w-3.5 ${hasCapital ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span className={`text-[10px] font-semibold ${hasCapital ? 'text-emerald-800' : 'text-slate-500'}`}>
                  Capital Letter
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date of Birth field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block" htmlFor="signup-dob">
                Date of Birth
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-300">
                  <Calendar className="h-4 w-4" />
                </span>
                <input
                  type="date"
                  id="signup-dob"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-pink-50/30 border border-pink-100 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Gender Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Gender
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Male', 'Female', 'Other'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`py-2 px-1 text-xs font-semibold border rounded-xl transition-all cursor-pointer ${
                      gender === g
                        ? 'bg-rose-50 border-rose-500 text-rose-700 font-bold ring-1 ring-rose-500'
                        : 'bg-pink-50/30 border-pink-100 text-slate-600 hover:bg-pink-100/50'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit register */}
          <button
            type="submit"
            id="signup-submit-btn"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-rose-500 to-orange-400 hover:from-rose-600 hover:to-orange-500 text-white rounded-xl text-sm font-bold shadow-md shadow-rose-100 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Profile...
              </>
            ) : (
              'Create Free Account'
            )}
          </button>
        </form>

        {/* Back to sign in */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <button
              onClick={onToggleToLogin}
              className="text-rose-600 font-bold hover:underline cursor-pointer ml-1"
            >
              Log In Instead
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
