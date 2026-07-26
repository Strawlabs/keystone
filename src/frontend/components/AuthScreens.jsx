import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '@/frontend/store/store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  companyId: z.string().optional()
});

const signupSchema = z.object({
  name: z.string().min(1, "Required"),
  adminName: z.string().min(1, "Required"),
  email: z.string().email("Invalid email format"),
  companyName: z.string().min(1, "Required"),
  companyAddress: z.string().min(1, "Required"),
  companyNumber: z.string().min(1, "Required")
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
  companyId: z.string().optional()
});

const resetPasswordSchema = z.object({
  otp: z.string().min(6, "Code must be 6 digits").optional(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

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
  const completePasswordResetWithOtp = useStore((state) => state.completePasswordResetWithOtp);

  // States for companies list and custom flows
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  
  // React Hook Form setups
  const { register: registerLogin, handleSubmit: handleLoginRHF, formState: { errors: loginErrors }, setValue: setLoginValue } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', companyId: '' }
  });

  const { register: registerSignup, handleSubmit: handleSignupRHF, formState: { errors: signupErrors } } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', adminName: '', email: '', companyName: '', companyAddress: '', companyNumber: '' }
  });

  const { register: registerForgot, handleSubmit: handleForgotRHF, formState: { errors: forgotErrors } } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '', companyId: '' }
  });

  const { register: registerReset, handleSubmit: handleResetRHF, formState: { errors: resetErrors } } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { otp: '', password: '', confirmPassword: '' }
  });


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

  const handleLoginSubmit = async (data) => {
    await login(data.email, data.password, data.companyId || null);
  };

  const handleResetSubmit = async (data) => {
    await resetPassword(data.email, data.companyId || null);
  };

  const handleForceResetSubmit = async (data) => {
    const ok = await changePasswordWithToken(data.password);
    // state will reset since view changes on success usually, or we can leave it
  };

  const handleResetPasswordSubmit = async (data) => {
    const ok = await completePasswordReset(data.password);
    // State reset will be handled by RHF's reset if we use it, but since we switch views, it's fine.
  };

  const handleForgotOtpSubmit = async (data) => {
    const ok = await completePasswordResetWithOtp(forgotEmail, data.otp, data.password);
    // Optional: reset form state
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

  const handleSignupSubmit = async (data) => {
    const result = await signup(
      data.name,       // admin email mapped
      data.adminName,  
      data.email,
      data.companyName,
      data.companyAddress,
      data.companyNumber
    );
    // RHF can handle reset or we can leave it
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

      {/* Left Side: Architectural Studio Section (Stitch Precision Level 0 & Level 3 Glass) */}
      <section className="hidden lg:flex lg:w-1/2 relative bg-[#0a0f1d] overflow-hidden select-none">
        <div className="absolute inset-0 z-0">
          <img
            alt="Modern skyscraper architecture CAD view"
            className="w-full h-full object-cover grayscale opacity-80 transition-transform duration-[10000ms] hover:scale-105"
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1800&q=85"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0a0f1d]/95 via-[#0a0f1d]/60 to-[#004ac6]/30 z-10"></div>
        
        {/* Architectural CAD Blueprint Grid Overlay */}
        <div
          className="absolute inset-0 opacity-25 z-20"
          style={{
            backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        ></div>

        {/* Branding & Live Studio Telemetry Overlay */}
        <div className="relative z-30 p-12 flex flex-col justify-between h-full w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-[#004ac6] flex items-center justify-center rounded-xl shadow-lg shadow-[#004ac6]/30 border border-white/20">
                <span className="material-symbols-outlined text-white text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  architecture
                </span>
              </div>
              <div>
                <span className="text-xl font-black text-white tracking-tight block leading-none">KEYSTONE</span>
                <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-blue-300">Studio SaaS v3.0</span>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-2 text-xs text-white/90 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>TENANT ISOLATION ACTIVE</span>
            </div>
          </div>

          {/* Stitch Level 3 Floating Glass Card */}
          <div className="max-w-lg glass-floating-level-3 !bg-white/10 !border-white/20 p-8 rounded-2xl shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[11px] font-mono uppercase tracking-widest px-2.5 py-1 rounded bg-[#004ac6]/80 text-white font-bold">
                CAD SPEC // MULTI-TENANT
              </span>
              <span className="text-xs text-white/70 font-mono">RLS SECURED</span>
            </div>
            <p className="font-extrabold text-2xl text-white mb-3 tracking-tight leading-snug">
              Precision is not just a standard, it&apos;s our foundation.
            </p>
            <p className="text-sm text-white/80 leading-relaxed font-normal mb-6">
              Empowering architecture firms with real-time CAD blueprint markup, automated revision control, site daily logs, and zero-leakage tenant separation.
            </p>
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/15 text-white/90 font-mono text-xs">
              <div>
                <span className="block text-[10px] text-white/60">ACTIVE STUDIOS</span>
                <span className="font-bold text-sm text-white">48+ Firms</span>
              </div>
              <div>
                <span className="block text-[10px] text-white/60">RLS AUDIT</span>
                <span className="font-bold text-sm text-emerald-300">100% Pass</span>
              </div>
              <div>
                <span className="block text-[10px] text-white/60">UPTIME</span>
                <span className="font-bold text-sm text-white">99.98% SLA</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Right Side: Authentication Forms Panel */}
      <section className="w-full lg:w-1/2 bg-[#f7f9fb] flex items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-md my-auto">
          {/* Mobile Branding Logo */}
          <div className="lg:hidden flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#004ac6] flex items-center justify-center rounded-xl shadow-md">
                <span className="material-symbols-outlined text-white text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  architecture
                </span>
              </div>
              <div>
                <span className="text-lg font-black text-ink-black tracking-tight block leading-none">KEYSTONE</span>
                <span className="text-[10px] font-mono text-secondary">STUDIO PLATFORM</span>
              </div>
            </div>
          </div>

          {/* Quick Tab Switcher Pill */}
          <div className="flex rounded-xl bg-surface-container-low p-1.5 border border-border-subtle mb-8">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white text-ink-black shadow-sm border border-border-subtle'
                  : 'text-secondary hover:text-ink-black'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setTab('signup')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'signup'
                  ? 'bg-white text-ink-black shadow-sm border border-border-subtle'
                  : 'text-secondary hover:text-ink-black'
              }`}
            >
              Register Studio
            </button>
          </div>

          {/* 1. LOGIN VIEW */}
          {activeTab === 'login' && (
            <div className="space-y-7 animate-fade-in">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#004ac6] mb-1 block">
                  AUTHENTICATION // WORKSPACE ENTRY
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-ink-black tracking-tight mb-1.5">
                  Welcome Back
                </h1>
                <p className="text-sm text-secondary font-medium">
                  Select your studio workspace and sign in to access blueprints &amp; active projects.
                </p>
              </div>

              <form onSubmit={handleLoginRHF(handleLoginSubmit)} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                    Studio Workspace (Multi-Tenant)
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                      corporate_fare
                    </span>
                    <select
                      {...registerLogin('companyId')}
                      className="w-full bg-white border border-[#c3c6d6] rounded-xl py-3 pl-11 pr-10 text-sm font-medium text-on-surface focus:outline-none focus:ring-4 focus:ring-[#004ac6]/15 focus:border-[#004ac6] transition-all appearance-none shadow-sm"
                    >
                      <option value="">-- Select Company Workspace --</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">
                      unfold_more
                    </span>
                  </div>
                  {loginErrors.companyId && <p className="text-red-500 text-xs mt-1 font-medium">{loginErrors.companyId.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                      mail
                    </span>
                    <input
                      type="email"
                      {...registerLogin('email')}
                      className={`w-full bg-white border ${loginErrors.email ? 'border-red-500' : 'border-[#c3c6d6]'} rounded-xl py-3 pl-11 pr-4 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-4 focus:ring-[#004ac6]/15 focus:border-[#004ac6] transition-all shadow-sm`}
                      placeholder="architect@studio.com"
                      autoComplete="nope"
                    />
                  </div>
                  {loginErrors.email && <p className="text-red-500 text-xs mt-1 font-medium">{loginErrors.email.message}</p>}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setTab('forgot')}
                      className="text-xs font-bold text-[#004ac6] hover:underline transition-all cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                      lock
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...registerLogin('password')}
                      className={`w-full bg-white border ${loginErrors.password ? 'border-red-500' : 'border-[#c3c6d6]'} rounded-xl py-3 pl-11 pr-11 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-4 focus:ring-[#004ac6]/15 focus:border-[#004ac6] transition-all shadow-sm`}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-[#004ac6] transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  {loginErrors.password && <p className="text-red-500 text-xs mt-1 font-medium">{loginErrors.password.message}</p>}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#004ac6] hover:bg-[#003594] text-white py-3.5 rounded-xl font-bold transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#004ac6]/20 disabled:opacity-60"
                  >
                    {loading && (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    <span>{loading ? 'Authenticating...' : 'Sign Into Studio'}</span>
                    {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
                  </button>
                </div>
                
                {/* SSO Placeholders */}
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-border-subtle"></div>
                  <span className="flex-shrink-0 mx-4 text-xs font-bold text-secondary uppercase">Or sign in with</span>
                  <div className="flex-grow border-t border-border-subtle"></div>
                </div>
                
                <div className="flex gap-3">
                  <button type="button" className="flex-1 bg-white border border-[#c3c6d6] hover:bg-surface-container py-3 rounded-xl flex justify-center items-center gap-2 transition-all cursor-not-allowed opacity-70" title="Coming soon">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" className="w-5 h-5" />
                    <span className="text-sm font-bold text-ink-black">Google</span>
                  </button>
                  <button type="button" className="flex-1 bg-white border border-[#c3c6d6] hover:bg-surface-container py-3 rounded-xl flex justify-center items-center gap-2 transition-all cursor-not-allowed opacity-70" title="Coming soon">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/e/ea/Microsoft_logo_%282012%29.svg" alt="Microsoft" className="w-5 h-5" />
                    <span className="text-sm font-bold text-ink-black">Microsoft</span>
                  </button>
                </div>
              </form>

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

              <form onSubmit={handleSignupRHF(handleSignupSubmit)} className="space-y-5">
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
                      {...registerSignup('companyName')}
                      className={`w-full bg-white border ${signupErrors.companyName ? 'border-red-500' : 'border-border-subtle'} rounded-lg py-3 pl-10 pr-4 font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm`}
                      placeholder="e.g. Acme Corporation"
                    />
                  </div>
                  {signupErrors.companyName && <p className="text-red-500 text-xs mt-1 font-medium">{signupErrors.companyName.message}</p>}
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
                      {...registerSignup('email')}
                      className={`w-full bg-white border ${signupErrors.email ? 'border-red-500' : 'border-border-subtle'} rounded-lg py-3 pl-10 pr-4 font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm`}
                      placeholder="e.g. hello@acme.com"
                    />
                  </div>
                  {signupErrors.email && <p className="text-red-500 text-xs mt-1 font-medium">{signupErrors.email.message}</p>}
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
                      {...registerSignup('companyAddress')}
                      className={`w-full bg-white border ${signupErrors.companyAddress ? 'border-red-500' : 'border-border-subtle'} rounded-lg py-3 pl-10 pr-4 font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm`}
                      placeholder="e.g. 123 Studio Way, New York, NY"
                    />
                  </div>
                  {signupErrors.companyAddress && <p className="text-red-500 text-xs mt-1 font-medium">{signupErrors.companyAddress.message}</p>}
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
                      {...registerSignup('companyNumber')}
                      className={`w-full bg-white border ${signupErrors.companyNumber ? 'border-red-500' : 'border-border-subtle'} rounded-lg py-3 pl-10 pr-4 font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm`}
                      placeholder="e.g. +1 (555) 019-2834"
                    />
                  </div>
                  {signupErrors.companyNumber && <p className="text-red-500 text-xs mt-1 font-medium">{signupErrors.companyNumber.message}</p>}
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
                          {...registerSignup('adminName')}
                          className={`w-full bg-white border ${signupErrors.adminName ? 'border-red-500' : 'border-border-subtle'} rounded-lg py-3 pl-10 pr-4 font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm`}
                          placeholder="e.g. Jane Smith"
                        />
                      </div>
                      {signupErrors.adminName && <p className="text-red-500 text-xs mt-1 font-medium">{signupErrors.adminName.message}</p>}
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
                          {...registerSignup('name')}
                          className={`w-full bg-white border ${signupErrors.name ? 'border-red-500' : 'border-border-subtle'} rounded-lg py-3 pl-10 pr-4 font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm`}
                          placeholder="e.g. admin@acme.com"
                        />
                      </div>
                      {signupErrors.name && <p className="text-red-500 text-xs mt-1 font-medium">{signupErrors.name.message}</p>}
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

              <form onSubmit={handleForgotRHF(handleResetSubmit)} className="space-y-6">
                <div>
                  <label className="block text-label-md font-bold text-secondary uppercase tracking-wider mb-2">
                    Company Workspace
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                      corporate_fare
                    </span>
                    <select
                      {...registerForgot('companyId')}
                      className="w-full bg-white border border-border-subtle rounded-lg py-3 pl-10 pr-4 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none"
                    >
                      <option value="">-- Select Company (Multi-Tenant) --</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  {forgotErrors.companyId && <p className="text-red-500 text-xs mt-1 font-medium">{forgotErrors.companyId.message}</p>}
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
                      {...registerForgot('email')}
                      className={`w-full bg-white border ${forgotErrors.email ? 'border-red-500' : 'border-border-subtle'} rounded-lg py-3 pl-10 pr-4 font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm`}
                      placeholder="name@keystonestudio.com"
                    />
                  </div>
                  {forgotErrors.email && <p className="text-red-500 text-xs mt-1 font-medium">{forgotErrors.email.message}</p>}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-container text-white py-3.5 rounded-lg font-bold transition-all transform active:scale-[0.98] cursor-pointer shadow-sm"
                  >
                    Send Verification Code & Link
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 3b. FORGOT PASSWORD OTP VERIFICATION VIEW */}
          {activeTab === 'forgot-otp' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-3">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Verification Code Sent
                </span>
                <h1 className="font-headline-lg text-headline-lg text-ink-black font-bold tracking-tight mb-2">
                  Verify & Reset Password
                </h1>
                <p className="text-body-lg text-secondary font-medium">
                  We've sent a 6-digit verification code to <span className="font-bold text-ink-black">{forgotEmail}</span>. Enter the code along with your new password below.
                </p>
              </div>

              <form onSubmit={handleResetRHF(handleForgotOtpSubmit)} className="space-y-5">
                <div>
                  <label className="block text-label-md font-bold text-secondary uppercase tracking-wider mb-2">
                    6-Digit Verification Code
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                      pin
                    </span>
                    <input
                      type="text"
                      maxLength={6}
                      {...registerReset('otp')}
                      className={`w-full bg-white border ${resetErrors.otp ? 'border-red-500' : 'border-border-subtle'} rounded-lg py-3.5 pl-11 pr-4 font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-lg font-mono tracking-[0.3em] font-bold`}
                      placeholder="123456"
                    />
                  </div>
                  {resetErrors.otp && <p className="text-red-500 text-xs mt-1 font-medium">{resetErrors.otp.message}</p>}
                  <div className="flex justify-between items-center mt-2 text-xs">
                    <span className="text-secondary">Check your inbox or spam folder</span>
                    <button
                      type="button"
                      onClick={() => resetPassword(forgotEmail, selectedCompanyId || null)}
                      disabled={loading}
                      className="font-bold text-primary hover:underline cursor-pointer transition-all disabled:opacity-50"
                    >
                      Resend Code
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-label-md font-bold text-secondary uppercase tracking-wider mb-2">
                    New Permanent Password
                  </label>
                  <input
                    type="password"
                    {...registerReset('password')}
                    className={`w-full bg-white border ${resetErrors.password ? 'border-red-500' : 'border-border-subtle'} rounded-lg py-3 px-3 font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm`}
                    placeholder="At least 8 characters"
                  />
                  {resetErrors.password && <p className="text-red-500 text-xs mt-1 font-medium">{resetErrors.password.message}</p>}
                </div>

                <div>
                  <label className="block text-label-md font-bold text-secondary uppercase tracking-wider mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    {...registerReset('confirmPassword')}
                    className={`w-full bg-white border ${resetErrors.confirmPassword ? 'border-red-500' : 'border-border-subtle'} rounded-lg py-3 px-3 font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm`}
                    placeholder="Repeat new password"
                  />
                  {resetErrors.confirmPassword && <p className="text-red-500 text-xs mt-1 font-medium">{resetErrors.confirmPassword.message}</p>}
                </div>

                <div className="pt-2 flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary-container text-white py-3.5 rounded-lg font-bold transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-elevated"
                  >
                    {loading && (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    <span>Verify Code & Save Password</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTab('login');
                      setError('');
                    }}
                    className="w-full text-center text-xs font-bold text-secondary hover:text-ink-black py-2 cursor-pointer transition-colors"
                  >
                    Back to Log In
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 4. FORCE PASSWORD RESET VIEW (First login with temp password) */}
          {activeTab === 'force-reset' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold mb-3">
                  <span className="material-symbols-outlined text-[14px]">lock_reset</span>
                  First Login Required
                </span>
                <h1 className="font-headline-lg text-headline-lg text-ink-black font-bold tracking-tight mb-2">
                  Set Permanent Password
                </h1>
                <p className="text-body-lg text-secondary font-medium">
                  You logged in with a temporary password. Please choose a new permanent secure password to continue into your workspace.
                </p>
              </div>

              <form onSubmit={handleResetRHF(handleForceResetSubmit)} className="space-y-5">
                <div>
                  <label className="block text-label-md font-bold text-secondary uppercase tracking-wider mb-2">
                    New Permanent Password
                  </label>
                  <input
                    type="password"
                    {...registerReset('password')}
                    className={`w-full bg-white border ${resetErrors.password ? 'border-red-500' : 'border-border-subtle'} rounded-lg py-3 px-3 font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm`}
                    placeholder="At least 8 characters"
                  />
                  {resetErrors.password && <p className="text-red-500 text-xs mt-1 font-medium">{resetErrors.password.message}</p>}
                </div>

                <div>
                  <label className="block text-label-md font-bold text-secondary uppercase tracking-wider mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    {...registerReset('confirmPassword')}
                    className={`w-full bg-white border ${resetErrors.confirmPassword ? 'border-red-500' : 'border-border-subtle'} rounded-lg py-3 px-3 font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm`}
                    placeholder="Repeat new password"
                  />
                  {resetErrors.confirmPassword && <p className="text-red-500 text-xs mt-1 font-medium">{resetErrors.confirmPassword.message}</p>}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary-container text-white py-3.5 rounded-lg font-bold transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-elevated"
                  >
                    {loading && (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    <span>Save & Enter Workspace</span>
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
