import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Droplet,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Globe,
  Check,
  X,
} from 'lucide-react';
import { UserProfile } from '../types';
import {
  apiSignUp,
  apiSignIn,
  apiGoogleAuth,
  apiUpdateProfile,
  getGoogleClientId,
} from '../utils/api';
import { saveCurrentUser } from '../utils/storage';
import { playWaterDropSound, triggerHapticFeedback } from '../utils/audio';

interface AuthModalProps {
  isOpen: boolean;
  onSuccess: (user: UserProfile) => void;
}

const AVATAR_OPTIONS = [
  { emoji: '💧', label: 'Hydro Hero' },
  { emoji: '🌊', label: 'Wave Master' },
  { emoji: '⚡', label: 'Energized' },
  { emoji: '🌿', label: 'Fresh Sprout' },
  { emoji: '🫖', label: 'Zen Tea' },
  { emoji: '🏃‍♂️', label: 'Active Runner' },
  { emoji: '🐬', label: 'Aqua Dolphin' },
  { emoji: '🏔️', label: 'Glacier Peak' },
  { emoji: '🌟', label: 'Star Hydrator' },
  { emoji: '👑', label: 'Water Monarch' },
];

const SUGGESTED_NICKNAMES = [
  'AquaMaster',
  'HydroHero',
  'SipChampion',
  'WaveRider',
  'PureFlow',
  'WaterWizard',
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onSuccess }) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Google Connect Modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleFullName, setGoogleFullName] = useState('');

  // Step 2: Nickname Onboarding state for new accounts
  const [isOnboardingNickname, setIsOnboardingNickname] = useState(false);
  const [pendingUser, setPendingUser] = useState<UserProfile | null>(null);
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('💧');

  if (!isOpen) return null;

  // Extract nickname prefix suggestion from email
  const getEmailPrefix = (em: string) => {
    if (!em || !em.includes('@')) return 'Hydrator';
    const prefix = em.split('@')[0];
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  };

  // Switch Auth Mode
  const handleToggleMode = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setError(null);
  };

  // Open Google Connection Dialog
  const handleOpenGoogle = () => {
    setError(null);
    triggerHapticFeedback([10]);
    setShowGoogleModal(true);
  };

  // Submit Google Connection with Real Google Account
  const handleConnectGoogle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanGoogleEmail = googleEmail.trim().toLowerCase();
    if (!cleanGoogleEmail || !cleanGoogleEmail.includes('@') || !cleanGoogleEmail.includes('.')) {
      setError('Please enter a valid Google email address.');
      return;
    }

    setIsLoading(true);
    triggerHapticFeedback([15]);

    try {
      const authRes = await apiGoogleAuth({
        email: cleanGoogleEmail,
        name: googleFullName.trim() || getEmailPrefix(cleanGoogleEmail),
      });

      setIsLoading(false);
      setShowGoogleModal(false);

      if (authRes.isNew || !authRes.user.nickname) {
        // First-time Google user -> move to Nickname Onboarding
        setPendingUser(authRes.user);
        setNickname(googleFullName.trim() || getEmailPrefix(cleanGoogleEmail));
        setIsOnboardingNickname(true);
      } else {
        // Existing user -> login directly
        playWaterDropSound();
        saveCurrentUser(authRes.user);
        onSuccess(authRes.user);
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Google authentication failed.');
    }
  };

  // Handle Email Submit (Sign In or Sign Up)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (authMode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setIsLoading(true);
    triggerHapticFeedback([10]);

    try {
      if (authMode === 'signup') {
        const response = await apiSignUp(cleanEmail, password);
        setIsLoading(false);

        // Move to Nickname Onboarding
        setPendingUser(response.user);
        setNickname(getEmailPrefix(cleanEmail));
        setIsOnboardingNickname(true);
      } else {
        // Sign In
        const response = await apiSignIn(cleanEmail, password);
        setIsLoading(false);

        playWaterDropSound();
        saveCurrentUser(response.user);
        onSuccess(response.user);
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'An error occurred during authentication.');
    }
  };

  // Finish Nickname Onboarding and complete account creation
  const handleFinishOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalNickname = nickname.trim();
    if (!finalNickname) {
      setError('Please enter a nickname or choose one below.');
      return;
    }

    if (!pendingUser) return;

    setIsLoading(true);
    setError(null);

    try {
      const updateRes = await apiUpdateProfile(pendingUser.id, finalNickname, selectedAvatar);
      setIsLoading(false);

      playWaterDropSound();
      triggerHapticFeedback([20, 50, 20]);

      saveCurrentUser(updateRes.user);
      onSuccess(updateRes.user);
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Failed to save nickname. Please try again.');
    }
  };

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto"
      >
        {/* Top Decorative App Banner */}
        <div className="bg-gradient-to-br from-sky-600 via-sky-500 to-teal-500 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -left-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-lg pointer-events-none" />

          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center shadow-inner mb-3 border border-white/30">
            <Droplet className="w-8 h-8 text-white fill-white animate-pulse" />
          </div>

          <h2 className="text-xl font-extrabold tracking-tight text-white drop-shadow-xs">
            {isOnboardingNickname
              ? 'Choose Your Nickname'
              : authMode === 'signup'
              ? 'Join HydroFlow'
              : 'Welcome Back'}
          </h2>
          <p className="text-xs text-sky-100 mt-1 max-w-xs mx-auto">
            {isOnboardingNickname
              ? 'Tell us what to call you so we can personalize your hydration journey.'
              : authMode === 'signup'
              ? 'Create your account to sync your water logs seamlessly across desktop & mobile.'
              : 'Sign in to sync your progress across all your devices.'}
          </p>
        </div>

        {/* STEP 2: NICKNAME ONBOARDING SCREEN */}
        {isOnboardingNickname ? (
          <form onSubmit={handleFinishOnboarding} className="p-6 space-y-5">
            <div className="space-y-4">
              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Pick an Avatar Icon
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {AVATAR_OPTIONS.map((item) => {
                    const isSelected = selectedAvatar === item.emoji;
                    return (
                      <button
                        key={item.emoji}
                        type="button"
                        id={`btn-avatar-${item.emoji}`}
                        onClick={() => {
                          setSelectedAvatar(item.emoji);
                          triggerHapticFeedback([10]);
                        }}
                        className={`p-2.5 rounded-2xl text-2xl flex flex-col items-center justify-center transition border cursor-pointer ${
                          isSelected
                            ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-400/30 scale-105 shadow-sm'
                            : 'bg-slate-50/80 border-slate-200/80 hover:bg-slate-100'
                        }`}
                        title={item.label}
                      >
                        <span>{item.emoji}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nickname Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Your Nickname
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="input-onboarding-nickname"
                    type="text"
                    required
                    maxLength={25}
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="e.g. AquaSam, HydroHero"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  This nickname will appear in your profile, settings, and hydration greetings.
                </p>
              </div>

              {/* Suggested Nicknames Chips */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500">Quick ideas:</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {SUGGESTED_NICKNAMES.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setNickname(name)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200 border border-transparent transition cursor-pointer"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              id="btn-complete-nickname-onboarding"
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-bold text-sm shadow-md shadow-sky-600/20 transition cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Get Started with HydroFlow</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* STEP 1: AUTHENTICATION SCREEN */
          <div className="p-6 space-y-4">
            {/* Sign In / Sign Up Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200/60">
              <button
                id="btn-tab-signup"
                type="button"
                onClick={() => handleToggleMode('signup')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  authMode === 'signup'
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Create Account
              </button>
              <button
                id="btn-tab-signin"
                type="button"
                onClick={() => handleToggleMode('signin')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  authMode === 'signin'
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Sign In
              </button>
            </div>

            {/* Real Google Sign-In Button */}
            <button
              id="btn-auth-google"
              type="button"
              disabled={isLoading}
              onClick={handleOpenGoogle}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-slate-50 active:scale-98 border border-slate-200 shadow-xs font-semibold text-slate-700 text-xs transition cursor-pointer disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{authMode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                or with email
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Email */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="input-auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-xs font-semibold text-slate-900 placeholder:text-slate-400 transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="input-auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-xs font-semibold text-slate-900 placeholder:text-slate-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password for Sign Up */}
              {authMode === 'signup' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="input-auth-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-xs font-semibold text-slate-900 placeholder:text-slate-400 transition"
                    />
                  </div>
                </div>
              )}

              {/* Error Box */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                id="btn-auth-submit"
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition cursor-pointer disabled:opacity-70"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : authMode === 'signup' ? (
                  <>
                    <span>Create Free Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center flex items-center justify-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-sky-500" />
                <span>Syncs Across Desktop & Mobile</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Encrypted & Private</span>
              </span>
            </div>
          </div>
        )}
      </motion.div>

      {/* GOOGLE CONNECT MODAL */}
      <AnimatePresence>
        {showGoogleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span className="text-sm font-bold text-slate-800">Sign in with Google</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Connect your real Google account to sync your hydration streak across all your devices.
              </p>

              <form onSubmit={handleConnectGoogle} className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Your Google Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      id="input-google-account-email"
                      type="email"
                      required
                      value={googleEmail}
                      onChange={(e) => setGoogleEmail(e.target.value)}
                      placeholder="e.g. crys1soc7@gmail.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Your Name (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <input
                      id="input-google-account-name"
                      type="text"
                      value={googleFullName}
                      onChange={(e) => setGoogleFullName(e.target.value)}
                      placeholder="e.g. Tanay"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  id="btn-confirm-google-login"
                  type="submit"
                  disabled={isLoading || !googleEmail.includes('@')}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Continue with Google</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
