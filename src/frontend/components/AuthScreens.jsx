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
  setSuccess,
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
  const changePasswordWithToken = useStore((state) => state.changePasswordWithToken);
  const completePasswordReset = useStore((state) => state.completePasswordReset);

  // States for companies list and custom flows
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Fetch companies list
  useEffect(() => {
    fetch('/api/company')
      .then(res => res.json())
      .then(data => {
        if (data.companies) {
          setCompanies(data.companies);
        }
      })
      .catch(err => console.error('Failed to load companies:', err));
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    await login(loginEmail, loginPassword, selectedCompanyId || null);
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    await resetPassword(forgotEmail, selectedCompanyId || null);
  };

  const handleForceResetSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }
    const ok = await changePasswordWithToken(newPassword);
    if (ok) {
      setNewPassword('');
      setConfirmNewPassword('');
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }
    const ok = await completePasswordReset(newPassword);
    if (ok) {
      setNewPassword('');
      setConfirmNewPassword('');
    }
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
    if (!signupForm.companyName || !signupForm.email || !signupForm.adminName || !signupForm.name || !signupForm.companyAddress || !signupForm.companyNumber) {
      setError('All fields are required.');
      return;
    }
    const result = await signup(
      signupForm.name,       // admin email (mapped to 'name' arg as before)
      signupForm.adminName,  // admin name (new)
      signupForm.email,
      signupForm.companyName,
      signupForm.companyAddress,
      signupForm.companyNumber
    );
    if (result) {
      setSignupForm({
        name: '',
        adminName: '',
        email: '',
        companyName: '',
        password: '',
        confirmPassword: '',
        companyAddress: '',
        companyNumber: ''
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-stretch text-on-surface font-sans">
      
      {/* Toast Alert Banners */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {successMessage && (
          <div className="bg-white border border-success/30 shadow-2xl rounded-xl p-4 flex items-center justify-between gap-3 animate-fade-in text-on-surface text-sm">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-success text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
              <span className="font-semibold">{successMessage}</span>
            </div>
            <button 
              onClick={() => setSuccess && setSuccess(null)}
              className="text-secondary hover:text-primary transition-colors cursor-pointer text-lg font-bold pl-2 border-l border-border-subtle leading-none"
            >
              &times;
            </button>
          </div>
        )}
        {error && (
          <div className="bg-white border border-error/30 shadow-2xl rounded-xl p-4 flex items-center justify-between gap-3 animate-fade-in text-on-surface text-sm">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-error text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                error
              </span>
              <span className="font-semibold">{error}</span>
            </div>
            <button 
              onClick={() => setError && setError(null)}
              className="text-secondary hover:text-primary transition-colors cursor-pointer text-lg font-bold pl-2 border-l border-border-subtle leading-none"
            >
              &times;
            </button>
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
                    Select Company / Workspace
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                      corporate_fare
                    </span>
                    <select
                      value={selectedCompanyId}
                      onChange={(e) => setSelectedCompanyId(e.target.value)}
                      className="w-full bg-white border border-border-subtle rounded-lg py-3 pl-10 pr-4 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none"
                    >
                      <option value="">-- Select Company (Multi-Tenant) --</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">
                      arrow_drop_down
                    </span>
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
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-white border border-border-subtle rounded-lg py-3 pl-10 pr-4 font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                      placeholder="name@keystonestudio.com"
                      autoComplete="nope"
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
                      autoComplete="new-password"
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
                  Need a SaaS workspace?{' '}
                  <button
                    onClick={() => setTab('signup')}
                    className="text-primary font-bold hover:underline cursor-pointer"
                  >
                    Register new company
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* 2. SIGNUP VIEW (COMPANY REGISTRATION) */}
          {activeTab === 'signup' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h1 className="font-headline-lg text-headline-lg text-ink-black font-bold tracking-tight mb-2">
                  Register Company Workspace
                </h1>
                <p className="text-body-lg text-secondary font-medium">
                  Set up your isolated SaaS company environment.
                </p>
              </div>

              <form onSubmit={handleSignupSubmit} className="space-y-5">
                <div>
                  <label className="block text-label-md font-bold text-secondary uppercase tracking-wider mb-2">
                    Company Name
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
                      placeholder="e.g. Acme Corporation"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-label-md font-bold text-secondary uppercase tracking-wider mb-2">
                    Company Contact Email
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                      contact_mail
                    </span>
                    <input
                      type="email"
                      required
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      className="w-full bg-white border border-border-subtle rounded-lg py-3 pl-10 pr-4 font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                      placeholder="e.g. hello@acme.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-label-md font-bold text-secondary uppercase tracking-wider mb-2">
                    Company Address
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                      location_on
                    </span>
                    <input
                      type="text"
                      required
                      value={signupForm.companyAddress || ''}
                      onChange={(e) => setSignupForm({ ...signupForm, companyAddress: e.target.value })}
                      className="w-full bg-white border border-border-subtle rounded-lg py-3 pl-10 pr-4 font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                      placeholder="e.g. 123 Studio Way, New York, NY"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-label-md font-bold text-secondary uppercase tracking-wider mb-2">
                    Company Number (Phone/Registration)
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                      phone
                    </span>
                    <input
                      type="text"
                      required
                      value={signupForm.companyNumber || ''}
                      onChange={(e) => setSignupForm({ ...signupForm, companyNumber: e.target.value })}
                      className="w-full bg-white border border-border-subtle rounded-lg py-3 pl-10 pr-4 font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                      placeholder="e.g. +1 (555) 019-2834"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border-subtle">
                  <p className="text-xs text-secondary font-semibold uppercase mb-4 tracking-wider">
                    Company Admin Credentials (Will receive temporary password)
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-label-md font-bold text-secondary uppercase tracking-wider mb-2">
                        Admin Full Name
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                          person
                        </span>
                        <input
                          type="text"
                          required
                          value={signupForm.adminName || ''}
                          onChange={(e) => setSignupForm({ ...signupForm, adminName: e.target.value })}
                          className="w-full bg-white border border-border-subtle rounded-lg py-3 pl-10 pr-4 font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                          placeholder="e.g. Jane Smith"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-label-md font-bold text-secondary uppercase tracking-wider mb-2">
                        Admin Email Address
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                          admin_panel_settings
                        </span>
                        <input
                          type="email"
                          required
                          value={signupForm.name}
                          onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                          className="w-full bg-white border border-border-subtle rounded-lg py-3 pl-10 pr-4 font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                          placeholder="e.g. admin@acme.com"
                        />
                      </div>
                    </div>
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
                    <span>{loading ? 'Creating workspace...' : 'Register SaaS Tenant'}</span>
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

          {/* 3. FORCE PASSWORD RESET VIEW (First login) */}
          {activeTab === 'force-reset' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h1 className="font-headline-lg text-headline-lg text-ink-black font-bold tracking-tight mb-2">
                  Setup New Password
                </h1>
                <p className="text-body-lg text-secondary font-medium">
                  First login detected. Please set a permanent password.
                </p>
              </div>

              <form onSubmit={handleForceResetSubmit} className="space-y-5">
                <div>
                  <label className="block text-label-md font-bold text-secondary uppercase tracking-wider mb-2">
                    New Secure Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white border border-border-subtle rounded-lg py-3 px-3 font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-label-md font-bold text-secondary uppercase tracking-wider mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full bg-white border border-border-subtle rounded-lg py-3 px-3 font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    placeholder="••••••••"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-success hover:bg-emerald-600 text-white py-3.5 rounded-lg font-bold transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    {loading && (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    <span>Set Permanent Password</span>
                  </button>
                </div>
              </form>
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
                  Enter company and email to receive a password reset link.
                </p>
              </div>

              <form onSubmit={handleResetSubmit} className="space-y-6">
                <div>
                  <label className="block text-label-md font-bold text-secondary uppercase tracking-wider mb-2">
                    Company Workspace
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                      corporate_fare
                    </span>
                    <select
                      value={selectedCompanyId}
                      onChange={(e) => setSelectedCompanyId(e.target.value)}
                      className="w-full bg-white border border-border-subtle rounded-lg py-3 pl-10 pr-4 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none"
                    >
                      <option value="">-- Select Company (Multi-Tenant) --</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
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

          {/* 5. EMAIL PASSWORD RESET VIEW (From reset link) */}
          {activeTab === 'reset-password' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h1 className="font-headline-lg text-headline-lg text-ink-black font-bold tracking-tight mb-2">
                  Enter New Password
                </h1>
                <p className="text-body-lg text-secondary font-medium">
                  Please enter and confirm your new permanent password.
                </p>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-5">
                <div>
                  <label className="block text-label-md font-bold text-secondary uppercase tracking-wider mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white border border-border-subtle rounded-lg py-3 px-3 font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-label-md font-bold text-secondary uppercase tracking-wider mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full bg-white border border-border-subtle rounded-lg py-3 px-3 font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    placeholder="••••••••"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary-container text-white py-3.5 rounded-lg font-bold transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    {loading && (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    <span>Reset Password</span>
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
