import React, { useState, useEffect, useRef } from 'react';
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
  KeyRound,
  RotateCcw,
  CheckCircle2,
  X,
} from 'lucide-react';
import { UserProfile } from '../types';
import {
  apiSignUp,
  apiSignIn,
  apiGoogleAuth,
  apiUpdateProfile,
  apiSendOtp,
  apiVerifyOtp,
} from '../utils/api';
import { saveCurrentUser } from '../utils/storage';
import { playWaterDropSound, triggerHapticFeedback } from '../utils/audio';

interface AuthModalProps {
  isOpen: boolean;
  onSuccess: (user: UserProfile) => void;
}

type AuthStep = 'credentials' | 'otp' | 'nickname';

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
  const [currentStep, setCurrentStep] = useState<AuthStep>('credentials');

  // Credential Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP Verification state
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [sentOtpPreview, setSentOtpPreview] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState<number>(60);
  const [canResend, setCanResend] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Google Connect Modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleFullName, setGoogleFullName] = useState('');

  // Nickname Onboarding state
  const [pendingUser, setPendingUser] = useState<UserProfile | null>(null);
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('💧');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Resend Countdown Timer
  useEffect(() => {
    let timer: any;
    if (currentStep === 'otp' && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentStep, resendCountdown]);

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
    setCurrentStep('credentials');
    setError(null);
  };

  // Handle Digit Change in 6-digit OTP
  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned && value !== '') return;

    const nextDigits = [...otpDigits];
    nextDigits[index] = cleaned.slice(-1);
    setOtpDigits(nextDigits);
    setError(null);

    // Auto-focus next input
    if (cleaned && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Backspace and Arrow navigation
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle Paste 6-digit code
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const nextDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      nextDigits[i] = pasted[i] || '';
    }
    setOtpDigits(nextDigits);
    setError(null);

    const targetIdx = Math.min(pasted.length, 5);
    otpInputRefs.current[targetIdx]?.focus();
  };

  // Resend 6-digit OTP code
  const handleResendOtp = async () => {
    if (!canResend) return;
    setIsLoading(true);
    setError(null);
    triggerHapticFeedback([10]);

    try {
      const res = await apiSendOtp(email.trim());
      setIsLoading(false);
      setResendCountdown(60);
      setCanResend(false);
      if (res.otp) {
        setSentOtpPreview(res.otp);
      }
      playWaterDropSound();
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Failed to resend verification code.');
    }
  };

  // Open Google Connection Dialog
  const handleOpenGoogle = () => {
    setError(null);
    triggerHapticFeedback([10]);
    setShowGoogleModal(true);
  };

  // Submit Google Connection
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
        setPendingUser(authRes.user);
        setNickname(googleFullName.trim() || getEmailPrefix(cleanGoogleEmail));
        setCurrentStep('nickname');
      } else {
        playWaterDropSound();
        saveCurrentUser(authRes.user);
        onSuccess(authRes.user);
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Google authentication failed.');
    }
  };

  // Handle Email Credentials Submit (Sign In or Trigger OTP on Sign Up)
  const handleSubmitCredentials = async (e: React.FormEvent) => {
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

    if (authMode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please verify.');
        return;
      }

      setIsLoading(true);
      triggerHapticFeedback([10]);

      try {
        // Send 6-digit OTP code to email
        const otpRes = await apiSendOtp(cleanEmail);
        setIsLoading(false);

        if (otpRes.otp) {
          setSentOtpPreview(otpRes.otp);
        }

        setResendCountdown(60);
        setCanResend(false);
        setOtpDigits(['', '', '', '', '', '']);
        setCurrentStep('otp');
        playWaterDropSound();
      } catch (err: any) {
        setIsLoading(false);
        setError(err.message || 'Could not send verification code.');
      }
    } else {
      // Sign In mode
      setIsLoading(true);
      triggerHapticFeedback([10]);

      try {
        const response = await apiSignIn(cleanEmail, password);
        setIsLoading(false);

        playWaterDropSound();
        saveCurrentUser(response.user);
        onSuccess(response.user);
      } catch (err: any) {
        setIsLoading(false);
        setError(err.message || 'Incorrect email or password.');
      }
    }
  };

  // Handle Submit 6-digit OTP Verification
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length < 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setIsLoading(true);
    setError(null);
    triggerHapticFeedback([15]);

    try {
      const cleanEmail = email.trim().toLowerCase();
      // 1. Verify OTP
      await apiVerifyOtp(cleanEmail, fullOtp);

      // 2. Create Verified Account
      const response = await apiSignUp(cleanEmail, password);
      setIsLoading(false);

      playWaterDropSound();
      triggerHapticFeedback([20, 40, 20]);

      setPendingUser(response.user);
      setNickname(getEmailPrefix(cleanEmail));
      setCurrentStep('nickname');
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Incorrect verification code. Please check and try again.');
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

      const finalUser: UserProfile = {
        ...updateRes.user,
        emailVerified: true,
      };

      saveCurrentUser(finalUser);
      onSuccess(finalUser);
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
            {currentStep === 'otp' ? (
              <KeyRound className="w-7 h-7 text-white stroke-[2.2] animate-bounce" />
            ) : currentStep === 'nickname' ? (
              <User className="w-7 h-7 text-white stroke-[2.2]" />
            ) : (
              <Droplet className="w-8 h-8 text-white fill-white animate-pulse" />
            )}
          </div>

          <h2 className="text-xl font-extrabold tracking-tight text-white drop-shadow-xs">
            {currentStep === 'otp'
              ? 'Verify Your Email'
              : currentStep === 'nickname'
              ? 'Choose Your Nickname'
              : authMode === 'signup'
              ? 'Join HydroFlow'
              : 'Welcome Back'}
          </h2>
          <p className="text-xs text-sky-100 mt-1 max-w-xs mx-auto">
            {currentStep === 'otp'
              ? `Enter the 6-digit code sent to ${email}`
              : currentStep === 'nickname'
              ? 'Tell us what to call you so we can personalize your hydration journey.'
              : authMode === 'signup'
              ? 'Create your account with email verification to sync across all devices.'
              : 'Sign in to sync your progress across all your devices.'}
          </p>
        </div>

        {/* STEP 2: 6-DIGIT OTP VERIFICATION SCREEN */}
        {currentStep === 'otp' && (
          <form onSubmit={handleVerifyOtpSubmit} className="p-6 space-y-4">
            {/* Live OTP Demo / Preview helper badge */}
            {sentOtpPreview && (
              <div
                onClick={() => {
                  const chars = sentOtpPreview.split('');
                  setOtpDigits(chars);
                  triggerHapticFeedback([10]);
                }}
                className="flex items-center justify-between p-3 rounded-2xl bg-sky-50 border border-sky-200 text-sky-800 text-xs cursor-pointer hover:bg-sky-100/70 transition"
                title="Click to autofill"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>
                    Verification Code: <strong className="font-mono tracking-wider text-sm">{sentOtpPreview}</strong>
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-600 text-white px-2 py-0.5 rounded-md">
                  Autofill
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 text-center">
                Enter 6-Digit Code
              </label>

              {/* 6 Digit Input Boxes */}
              <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputRefs.current[idx] = el)}
                    id={`otp-input-${idx}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className={`w-11 h-13 text-center text-xl font-extrabold font-mono rounded-2xl border transition ${
                      digit
                        ? 'bg-sky-50 border-sky-500 text-sky-900 ring-2 ring-sky-500/20 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                    }`}
                    autoFocus={idx === 0}
                  />
                ))}
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Verification */}
            <button
              id="btn-verify-otp-submit"
              type="submit"
              disabled={isLoading || otpDigits.join('').length < 6}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Verify Email & Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            {/* Resend & Back Actions */}
            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={() => setCurrentStep('credentials')}
                className="text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
              >
                Change Email
              </button>

              <button
                type="button"
                id="btn-resend-otp"
                disabled={!canResend || isLoading}
                onClick={handleResendOtp}
                className={`flex items-center gap-1 font-bold ${
                  canResend
                    ? 'text-sky-600 hover:text-sky-700 cursor-pointer'
                    : 'text-slate-400 cursor-not-allowed'
                }`}
              >
                <RotateCcw className="w-3 h-3" />
                <span>{canResend ? 'Resend Code' : `Resend in ${resendCountdown}s`}</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: NICKNAME ONBOARDING SCREEN */}
        {currentStep === 'nickname' && (
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
        )}

        {/* STEP 1: CREDENTIALS (SIGN IN / SIGN UP) SCREEN */}
        {currentStep === 'credentials' && (
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

            {/* Google Sign-In Button */}
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
            <form onSubmit={handleSubmitCredentials} className="space-y-3.5">
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
                    <span>Send 6-Digit Code</span>
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
                <span>Multi-Device Sync</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>OTP Verified Email</span>
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
                Connect your Google account to sync your hydration streak across all your devices.
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
