import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  loading,
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
    <div className="min-h-screen bg-background flex items-stretch text-on-surface font-sans">
      
      {/* Toast Alert Banners */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {successMessage && (
          <div className="bg-white border border-success/30 shadow-2xl rounded-xl p-4 flex items-center gap-3 animate-fade-in text-on-surface text-sm">
            <span className="material-symbols-outlined text-success text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}
        {error && (
          <div className="bg-white border border-error/30 shadow-2xl rounded-xl p-4 flex items-center gap-3 animate-fade-in text-on-surface text-sm">
            <span className="material-symbols-outlined text-error text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              error
            </span>
            <span className="font-semibold">{error}</span>
          </div>
        )}
      </div>

      {/* Left Side: Architectural Illustration Section */}
      <section className="hidden lg:flex lg:w-1/2 relative bg-surface-container overflow-hidden select-none">
        <div className="absolute inset-0 z-0">
          <img
            alt="Modern skyscraper architecture"
            className="w-full h-full object-cover grayscale opacity-90 transition-transform duration-[10000ms] hover:scale-105"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCghPeRoZ08R9AdXhyrccfoSMSf2xaSx51nH50nXma1q8RFBH8J-rLwVnwYZZ24jZnhvgaxAkZoqC2ziXpxhhPpFwuoktzUVRlWZhTh3g8bKYOinVfrUcsj1QWHvw8DrUqWzTKYUPzhkuRlQAoMGwVf-oumkck41pJK4BrodP9Asgaz2onsnw_fj130lAqY-BBzg4A9C8twtOS6TzD-W60x0g4lTltew4dN0y53pHES1wC-NkUM62CTayrnaOHul58CG1muStMV-Wg"
          />
        </div>
        <div className="absolute inset-0 bg-primary/10 mix-blend-multiply z-10"></div>
        {/* Architectural radial grid simulation */}
        <div
          className="absolute inset-0 opacity-30 z-20"
          style={{
            backgroundImage: 'radial-gradient(#E2E8F0 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        ></div>

        {/* Branding Overlay */}
        <div className="relative z-30 p-12 flex flex-col justify-between h-full w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-on-surface flex items-center justify-center rounded-lg shadow-lg">
              <span className="material-symbols-outlined text-surface text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                architecture
              </span>
            </div>
            <span className="text-headline-md font-black text-ink-black tracking-tight">Keystone</span>
          </div>

          <div className="max-w-md bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20">
            <p className="font-bold text-headline-md text-white mb-4">Precision is not just a standard, it's our foundation.</p>
            <p className="text-body-lg text-white/80 leading-relaxed font-medium">
              Join the network of architects and project managers building the future of the built environment with data-driven insights.
            </p>
          </div>
        </div>
      </section>

      {/* Right Side: Authentication Forms Panel */}
      <section className="w-full lg:w-1/2 bg-surface flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Branding Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-lg">
              <span className="material-symbols-outlined text-white text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                architecture
              </span>
            </div>
            <span className="text-headline-md font-black text-ink-black tracking-tight">Keystone</span>
          </div>

          {/* 1. LOGIN VIEW */}
          {activeTab === 'login' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h1 className="font-headline-lg text-headline-lg text-ink-black font-bold tracking-tight mb-2">
                  Welcome Back
                </h1>
                <p className="text-body-lg text-secondary font-medium">
                  Access your studio dashboard and active projects.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div>
                  <label className="block text-label-md font-bold text-secondary uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                      mail
                    </span>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-white border border-border-subtle rounded-lg py-3 pl-10 pr-4 font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                      placeholder="name@keystonestudio.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-label-md font-bold text-secondary uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setTab('forgot')}
                      className="text-label-md font-bold text-primary hover:underline transition-all cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                      lock
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-white border border-border-subtle rounded-lg py-3 pl-10 pr-10 font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary-container text-white py-3.5 rounded-lg font-bold transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
                  >
                    {loading && (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    <span>{loading ? 'Authenticating...' : 'Login'}</span>
                    {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
                  </button>
                </div>
              </form>

              <div className="text-center">
                <p className="text-body-md text-secondary font-medium">
                  Don't have an account?{' '}
                  <button
                    onClick={() => setTab('signup')}
                    className="text-primary font-bold hover:underline cursor-pointer"
                  >
                    Create a new studio
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* 2. SIGNUP VIEW */}
          {activeTab === 'signup' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h1 className="font-headline-lg text-headline-lg text-ink-black font-bold tracking-tight mb-2">
                  Create Studio Account
                </h1>
                <p className="text-body-lg text-secondary font-medium">
                  Set up your secure architectural firm workspace.
                </p>
              </div>

              <form onSubmit={handleSignupSubmit} className="space-y-5">
                <div>
                  <label className="block text-label-md font-bold text-secondary uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                      person
                    </span>
                    <input
                      type="text"
                      required
                      value={signupForm.name}
                      onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                      className="w-full bg-white border border-border-subtle rounded-lg py-3 pl-10 pr-4 font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                      placeholder="e.g. Sarah Chen"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-label-md font-bold text-secondary uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                      mail
                    </span>
                    <input
                      type="email"
                      required
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      className="w-full bg-white border border-border-subtle rounded-lg py-3 pl-10 pr-4 font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                      placeholder="name@firm.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-label-md font-bold text-secondary uppercase tracking-wider mb-2">
                    Firm / Company Name
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                      corporate_fare
                    </span>
                    <input
                      type="text"
                      required
                      value={signupForm.companyName}
                      onChange={(e) => setSignupForm({ ...signupForm, companyName: e.target.value })}
                      className="w-full bg-white border border-border-subtle rounded-lg py-3 pl-10 pr-4 font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                      placeholder="e.g. Keystone Studio Partners"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-label-md font-bold text-secondary uppercase tracking-wider mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      className="w-full bg-white border border-border-subtle rounded-lg py-3 px-3 font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-label-md font-bold text-secondary uppercase tracking-wider mb-2">
                      Confirm
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={signupForm.confirmPassword}
                      onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                      className="w-full bg-white border border-border-subtle rounded-lg py-3 px-3 font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* Password Strength checker */}
                {signupForm.password.length > 0 && (
                  <div className="space-y-2.5 p-3.5 rounded-xl bg-surface-container-low border border-border-subtle text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-secondary uppercase tracking-wider">Password Strength</span>
                      <span className={`font-bold ${
                        passwordStrengthScore <= 2 ? 'text-error' :
                        passwordStrengthScore <= 4 ? 'text-warning' : 'text-success'
                      }`}>
                        {passwordStrengthScore <= 2 ? 'Weak' : passwordStrengthScore <= 4 ? 'Fair' : 'Strong'}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          i <= passwordStrengthScore
                            ? passwordStrengthScore <= 2 ? 'bg-error' : passwordStrengthScore <= 4 ? 'bg-warning' : 'bg-success'
                            : 'bg-surface-container-high'
                        }`} />
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary-container text-white py-3.5 rounded-lg font-bold transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
                  >
                    {loading && (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    <span>{loading ? 'Creating workspace...' : 'Register Studio'}</span>
                  </button>
                </div>
              </form>

              <div className="text-center">
                <p className="text-body-md text-secondary font-medium">
                  Already registered?{' '}
                  <button
                    onClick={() => setTab('login')}
                    className="text-primary font-bold hover:underline cursor-pointer"
                  >
                    Sign In instead
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* 3. VERIFICATION VIEW */}
          {activeTab === 'verify' && (
            <div className="space-y-8 animate-fade-in text-center">
              <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 select-none">
                <span className="material-symbols-outlined text-primary text-[32px]">mail</span>
              </div>
              <div>
                <h1 className="font-headline-lg text-headline-lg text-ink-black font-bold tracking-tight mb-2">
                  Check Your Inbox
                </h1>
                <p className="text-body-md text-secondary leading-relaxed font-medium">
                  We sent a 6-digit activation code to <br />
                  <span className="font-bold text-ink-black">{signupForm.email || sessionStorage.getItem('verifyEmail')}</span>
                </p>
              </div>

              <form onSubmit={handleVerifySubmit} className="space-y-6">
                <div className="flex justify-center gap-3">
                  {otpArray.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => otpRefs.current[i] = el}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className="w-11 h-14 text-center text-xl font-bold rounded-xl border border-border-subtle bg-white text-ink-black focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                    />
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-success hover:bg-emerald-600 text-white py-3.5 rounded-lg font-bold transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
                  >
                    {loading && (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    <span>{loading ? 'Activating account...' : 'Verify Code & Activate'}</span>
                  </button>
                </div>
              </form>

              <div className="pt-6 border-t border-border-subtle">
                <p className="text-body-md text-secondary mb-3 font-medium">Didn't receive the email code?</p>
                <button
                  onClick={handleResendOtp}
                  disabled={countdown > 0}
                  className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline cursor-pointer disabled:text-secondary disabled:no-underline disabled:cursor-not-allowed transition-all"
                >
                  <span className={`material-symbols-outlined text-[18px] ${countdown > 0 ? 'animate-spin' : ''}`}>
                    autorenew
                  </span>
                  <span>{countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend Code'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. FORGOT PASSWORD VIEW */}
          {activeTab === 'forgot' && (
            <div className="space-y-8 animate-fade-in">
              <button
                onClick={() => setTab('login')}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-container-low hover:bg-surface-container border border-border-subtle text-secondary transition-all cursor-pointer shadow-sm mb-2"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <div>
                <h1 className="font-headline-lg text-headline-lg text-ink-black font-bold tracking-tight mb-2">
                  Reset Password
                </h1>
                <p className="text-body-md text-secondary font-medium">
                  Enter your registered email below, and we will send you a reset link.
                </p>
              </div>

              <form onSubmit={handleResetSubmit} className="space-y-6">
                <div>
                  <label className="block text-label-md font-bold text-secondary uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                      mail
                    </span>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full bg-white border border-border-subtle rounded-lg py-3 pl-10 pr-4 font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                      placeholder="name@keystonestudio.com"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-container text-white py-3.5 rounded-lg font-bold transition-all transform active:scale-[0.98] cursor-pointer shadow-sm"
                  >
                    Send Reset Email Link
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Footer content */}
          <footer className="mt-20 pt-8 border-t border-border-subtle flex flex-wrap justify-between gap-4 text-outline text-label-sm font-semibold select-none">
            <span>© 2026 Keystone Studio Inc.</span>
            <div className="flex gap-4">
              <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
              <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}
