import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Mail, Lock, Eye, EyeOff, User, Building, Sparkles, ChevronRight, Check, X, ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react';
import { useStore } from '@/frontend/store/store';

export default function AuthScreens({
  activeTab,
  setTab,
  login,
  signup,
  verify,
  resetPassword,
  error,
  successMessage,
  setError,
  signupForm,
  setSignupForm,
  signupSentCode,
  setSignupSentCode,
  signupCodeInput,
  setSignupCodeInput,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  showPassword,
  setShowPassword,
  forgotEmail,
  setForgotEmail,
  loading
}) {
  const resendOtp = useStore((state) => state.resendOtp);

  // Countdown timer for OTP resend
  const [countdown, setCountdown] = useState(0);
  const [otpArray, setOtpArray] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);

  // Store signup email in session storage in case of page reload during verify step
  useEffect(() => {
    if (signupForm.email) {
      sessionStorage.setItem('verifyEmail', signupForm.email);
    }
  }, [signupForm.email]);

  useEffect(() => {
    if (activeTab === 'verify') {
      const savedEmail = sessionStorage.getItem('verifyEmail');
      if (savedEmail && !signupForm.email) {
        setSignupForm(prev => ({ ...prev, email: savedEmail }));
      }
      // Start 60s countdown when entering verify tab
      setCountdown(60);
    }
  }, [activeTab]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    await login(loginEmail, loginPassword);
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    await resetPassword(forgotEmail);
    setTab('login');
  };

  // Password strength checks (reactive)
  const passwordChecks = useMemo(() => {
    const pw = signupForm.password || '';
    return {
      length: pw.length >= 8,
      uppercase: /[A-Z]/.test(pw),
      lowercase: /[a-z]/.test(pw),
      number: /[0-9]/.test(pw),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pw),
    };
  }, [signupForm.password]);

  const passwordStrengthScore = useMemo(() => {
    return Object.values(passwordChecks).filter(Boolean).length;
  }, [passwordChecks]);

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side password strength validation (matches server)
    if (passwordStrengthScore < 5) {
      setError('Password does not meet all security requirements.');
      return;
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    const result = await signup(signupForm.name, signupForm.email, signupForm.companyName, signupForm.password);
    if (result) {
      setSignupSentCode(result);
      setTab('verify');
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otpArray];
    newOtp[index] = value;
    setOtpArray(newOtp);
    setSignupCodeInput(newOtp.join(''));
    
    // Auto focus next
    if (value !== '' && index < 5 && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpArray[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    const code = otpArray.join('');
    if (code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    const ok = await verify(signupForm.email, code);
    if (ok) {
      setSignupSentCode(null);
      setSignupForm({ name: '', email: '', companyName: '', password: '', confirmPassword: '' });
      setOtpArray(['', '', '', '', '', '']);
      setSignupCodeInput('');
      sessionStorage.removeItem('verifyEmail');
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    const emailToUse = signupForm.email || sessionStorage.getItem('verifyEmail');
    if (!emailToUse) {
      setError('Email not found. Please sign up again.');
      setTab('signup');
      return;
    }
    const ok = await resendOtp(emailToUse);
    if (ok) {
      setCountdown(60);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row font-sans text-slate-100">
      
      {/* Toast Banners */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {successMessage && (
          <div className="bg-emerald-900/90 text-emerald-100 px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-fade-in border border-emerald-700/50 text-sm backdrop-blur-md">
            <div className="bg-emerald-500/20 p-1 rounded-full">
              <Check className="w-4 h-4 text-emerald-400" />
            </div>
            <span>{successMessage}</span>
          </div>
        )}
        {error && (
          <div className="bg-rose-900/90 text-rose-100 px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-fade-in border border-rose-700/50 text-sm backdrop-blur-md">
            <div className="bg-rose-500/20 p-1 rounded-full">
              <X className="w-4 h-4 text-rose-400" />
            </div>
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="hidden lg:flex lg:w-[48%] relative flex-col justify-between p-12 bg-slate-900 overflow-hidden shrink-0 select-none border-r border-slate-800">
        <div 
          className="absolute inset-0 bg-cover bg-center grayscale contrast-125 opacity-20 mix-blend-luminosity" 
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200')` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18M12 3l9 9M12 3L3 12" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Keystone</span>
        </div>

        <div className="relative z-10 bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50 max-w-md animate-fade-in shadow-2xl">
          <h3 className="text-xl font-bold text-white leading-snug">Precision is our foundation.</h3>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Join the network of top-tier architects and project managers building the future of the built environment with data-driven workflows and real-time collaboration.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center py-12 px-6 sm:px-12 lg:px-20 bg-slate-950 relative">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px]"></div>
          <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px]"></div>
        </div>

        <div className="w-full max-w-sm space-y-8 relative z-10">
          
          {/* LOGIN */}
          {activeTab === 'login' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">Welcome Back</h2>
                <p className="mt-2 text-sm text-slate-400">Sign in to access your secure workspace.</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4.5 w-4.5 text-slate-500" />
                    </div>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-800 rounded-xl text-sm bg-slate-900 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-inner"
                      placeholder="name@keystonestudio.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                    <button 
                      type="button" 
                      onClick={() => setTab('forgot')}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4.5 w-4.5 text-slate-500" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-3 border border-slate-800 rounded-xl text-sm bg-slate-900 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-inner"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-blue-500 transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                    <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                    {!loading && <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </form>

              <div className="text-center text-sm text-slate-400 pt-4">
                <span>New to Keystone? </span>
                <button onClick={() => setTab('signup')} className="font-bold text-white hover:text-blue-400 transition-colors">
                  Create an account
                </button>
              </div>
            </div>
          )}

          {/* SIGNUP */}
          {activeTab === 'signup' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">Create Account</h2>
                <p className="mt-2 text-sm text-slate-400">Set up your secure firm workspace.</p>
              </div>

              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4.5 w-4.5 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      required
                      value={signupForm.name}
                      onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-800 rounded-xl text-sm bg-slate-900 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="David Chen"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4.5 w-4.5 text-slate-500" />
                    </div>
                    <input
                      type="email"
                      required
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-800 rounded-xl text-sm bg-slate-900 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="name@firm.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Firm Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-4.5 w-4.5 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      required
                      value={signupForm.companyName}
                      onChange={(e) => setSignupForm({ ...signupForm, companyName: e.target.value })}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-800 rounded-xl text-sm bg-slate-900 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Keystone Studio Ltd"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      className="block w-full px-3 py-3 border border-slate-800 rounded-xl text-sm bg-slate-900 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Confirm</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={signupForm.confirmPassword}
                      onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                      className="block w-full px-3 py-3 border border-slate-800 rounded-xl text-sm bg-slate-900 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* Password Strength Indicator */}
                {signupForm.password.length > 0 && (
                  <div className="space-y-2 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password Strength</span>
                      <span className={`text-xs font-bold ${
                        passwordStrengthScore <= 2 ? 'text-rose-400' :
                        passwordStrengthScore <= 4 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {passwordStrengthScore <= 2 ? 'Weak' : passwordStrengthScore <= 4 ? 'Fair' : 'Strong'}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= passwordStrengthScore
                            ? passwordStrengthScore <= 2 ? 'bg-rose-500' : passwordStrengthScore <= 4 ? 'bg-amber-500' : 'bg-emerald-500'
                            : 'bg-slate-800'
                        }`} />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1.5">
                      {[
                        { key: 'length', label: '8+ characters' },
                        { key: 'uppercase', label: 'Uppercase' },
                        { key: 'lowercase', label: 'Lowercase' },
                        { key: 'number', label: 'Number' },
                        { key: 'special', label: 'Special char' },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center gap-1.5">
                          <div className={`w-3 h-3 rounded-full flex items-center justify-center transition-all ${
                            passwordChecks[key] ? 'bg-emerald-500/20' : 'bg-slate-800'
                          }`}>
                            {passwordChecks[key] ? (
                              <Check className="w-2 h-2 text-emerald-400" />
                            ) : (
                              <div className="w-1 h-1 rounded-full bg-slate-600" />
                            )}
                          </div>
                          <span className={`text-[10px] ${
                            passwordChecks[key] ? 'text-emerald-400' : 'text-slate-500'
                          }`}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-blue-500 transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                    <span>{loading ? 'Creating...' : 'Create Account'}</span>
                    {!loading && <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </form>

              <div className="text-center text-sm text-slate-400 pt-2">
                <span>Already have an account? </span>
                <button onClick={() => setTab('login')} className="font-bold text-white hover:text-blue-400 transition-colors">
                  Sign In
                </button>
              </div>
            </div>
          )}

          {/* VERIFY */}
          {activeTab === 'verify' && (
            <div className="space-y-6 animate-fade-in text-center">
              <div className="w-16 h-16 bg-blue-900/30 border border-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Check Your Email</h2>
                <p className="mt-2 text-sm text-slate-400">
                  We sent a 6-digit verification code to <br/>
                  <span className="font-semibold text-white">{signupForm.email || sessionStorage.getItem('verifyEmail')}</span>
                </p>
              </div>

              <form onSubmit={handleVerifySubmit} className="space-y-6">
                <div className="flex justify-center gap-2 sm:gap-3">
                  {otpArray.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => otpRefs.current[i] = el}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border border-slate-700 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-inner"
                    />
                  ))}
                </div>

                <div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-emerald-500 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                    <span>{loading ? 'Verifying...' : 'Verify & Activate'}</span>
                    {!loading && <Check className="w-4 h-4" />}
                  </button>
                </div>
              </form>

              <div className="pt-6 border-t border-slate-800">
                <p className="text-sm text-slate-400 mb-3">Didn't receive the code or it expired?</p>
                <button
                  onClick={handleResendOtp}
                  disabled={countdown > 0}
                  className="flex items-center justify-center gap-2 mx-auto text-sm font-semibold text-blue-400 hover:text-blue-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${countdown === 0 ? '' : 'opacity-50'}`} />
                  {countdown > 0 ? `Resend available in ${countdown}s` : 'Resend Code'}
                </button>
              </div>

              <div className="text-center pt-2">
                <button onClick={() => setTab('signup')} className="text-xs font-bold text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-1 mx-auto">
                  <ArrowLeft className="w-3 h-3" />
                  Use a different email
                </button>
              </div>
            </div>
          )}

          {/* FORGOT PASSWORD */}
          {activeTab === 'forgot' && (
            <div className="space-y-6 animate-fade-in">
              <button 
                onClick={() => setTab('login')}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">Reset Password</h2>
                <p className="mt-2 text-sm text-slate-400">Enter your email and we'll send you a link to reset your password.</p>
              </div>

              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4.5 w-4.5 text-slate-500" />
                    </div>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-800 rounded-xl text-sm bg-slate-900 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-inner"
                      placeholder="name@keystonestudio.com"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-blue-500 transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
