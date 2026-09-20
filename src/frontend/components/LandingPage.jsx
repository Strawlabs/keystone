'use client';

import React, { useState } from 'react';

export default function LandingPage({
  setTab,
  onSignIn,
  onGetStarted,
  setSignupForm
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [ctaEmail, setCtaEmail] = useState('');

  const handleSignIn = () => {
    if (onSignIn) {
      onSignIn();
    } else if (setTab) {
      setTab('login');
    }
  };

  const handleGetStarted = (email = '') => {
    if (email && setSignupForm) {
      setSignupForm(prev => ({ ...prev, email }));
    }
    if (onGetStarted) {
      onGetStarted(email);
    } else if (setTab) {
      setTab('signup');
    }
  };

  const handleCtaSubmit = (e) => {
    e.preventDefault();
    handleGetStarted(ctaEmail);
  };

  return (
    <div className="bg-[#F8FAFC] text-[#0F172A] font-sans antialiased selection:bg-[#2563eb] selection:text-white min-h-screen">
      {/* 1. Modern SaaS Header / Navigation */}
      <header className="h-16 fixed top-0 right-0 left-0 z-50 glass-panel border-b border-[#E2E8F0] transition-all duration-300">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-10">
            {/* Logo */}
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#090D14] flex items-center justify-center text-white shadow-sm group-hover:bg-[#2563eb] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                  <polyline points="2 17 12 22 22 17"></polyline>
                  <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-black tracking-tight text-[#090D14] uppercase font-mono">Keystone</span>
                <span className="text-[10px] uppercase font-semibold text-[#2563eb] px-1.5 py-0.5 bg-[#2563eb]/10 rounded tracking-wider">OS</span>
              </div>
            </a>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#64748B]">
              <a className="hover:text-[#090D14] transition-colors" href="#problem">Problem &amp; Why Us</a>
              <a className="hover:text-[#090D14] transition-colors" href="#features">Product</a>
              <div className="relative group py-2" onMouseLeave={() => setSolutionsOpen(false)}>
                <button 
                  onClick={() => setSolutionsOpen(!solutionsOpen)}
                  onMouseEnter={() => setSolutionsOpen(true)}
                  className="hover:text-[#090D14] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  Solutions
                  <span className={`material-symbols-outlined text-[16px] text-slate-400 transition-transform ${solutionsOpen ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
                {solutionsOpen && (
                  <div className="absolute top-full left-0 w-56 p-2 bg-white rounded-xl shadow-xl border border-[#E2E8F0] animate-fade-in z-50">
                    <a className="block px-3 py-2 text-xs font-semibold text-slate-900 rounded-lg hover:bg-slate-50" href="#features" onClick={() => setSolutionsOpen(false)}>
                      Architecture Studios
                    </a>
                    <a className="block px-3 py-2 text-xs font-medium text-[#64748B] rounded-lg hover:bg-slate-50" href="#features" onClick={() => setSolutionsOpen(false)}>
                      Structural Engineering
                    </a>
                    <a className="block px-3 py-2 text-xs font-medium text-[#64748B] rounded-lg hover:bg-slate-50" href="#features" onClick={() => setSolutionsOpen(false)}>
                      MEP &amp; Construction Admins
                    </a>
                  </div>
                )}
              </div>
              <a className="hover:text-[#090D14] transition-colors" href="#comparison">Comparison</a>
              <a className="hover:text-[#090D14] transition-colors" href="#pricing">Pricing</a>
              <a className="hover:text-[#090D14] transition-colors" href="#proof">Stories</a>
            </nav>
          </div>

          {/* Auth / Actions */}
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSignIn}
              className="text-sm font-medium text-[#64748B] hover:text-[#090D14] px-3 py-2 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button 
              onClick={() => handleGetStarted()}
              className="inline-flex items-center gap-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
            >
              Start Free Trial
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-[#64748B] hover:text-[#090D14] rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined text-[24px]">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden glass-panel border-b border-[#E2E8F0] px-4 py-4 space-y-3 animate-fade-in">
            <a 
              href="#problem" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-[#64748B] hover:text-[#090D14] rounded-lg hover:bg-slate-50"
            >
              Problem &amp; Why Us
            </a>
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-[#64748B] hover:text-[#090D14] rounded-lg hover:bg-slate-50"
            >
              Product Pillars
            </a>
            <a 
              href="#comparison" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-[#64748B] hover:text-[#090D14] rounded-lg hover:bg-slate-50"
            >
              Comparison Matrix
            </a>
            <a 
              href="#pricing" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-[#64748B] hover:text-[#090D14] rounded-lg hover:bg-slate-50"
            >
              Pricing
            </a>
            <a 
              href="#proof" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-[#64748B] hover:text-[#090D14] rounded-lg hover:bg-slate-50"
            >
              Client Stories
            </a>
            <div className="pt-2 border-t border-[#E2E8F0] flex gap-2">
              <button 
                onClick={() => { setMobileMenuOpen(false); handleSignIn(); }}
                className="flex-1 py-2 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-slate-800"
              >
                Sign In
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); handleGetStarted(); }}
                className="flex-1 py-2 rounded-lg bg-[#2563eb] text-white text-xs font-semibold"
              >
                Start Trial
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="pt-16">
        {/* 2. High-Impact Hero Section */}
        <section className="relative pt-16 pb-20 overflow-hidden blueprint-grid border-b border-[#E2E8F0]">
          {/* Ambient Blur */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-blue-400/10 via-[#2563eb]/15 to-indigo-400/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Badge Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E2E8F0] shadow-sm mb-6 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[#2563eb]"></span>
              <span className="text-xs font-semibold text-slate-800 tracking-wide">✦ The Modern Practice Management Standard for Architecture Firms</span>
            </div>

            {/* Master Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#090D14] tracking-tight leading-[1.1] max-w-4xl mx-auto">
              Architecture is demanding.<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#2563eb] via-blue-600 to-indigo-600">
                Your practice management shouldn&apos;t be.
              </span>
            </h1>

            {/* Compelling Subheadline */}
            <p className="mt-6 text-base sm:text-lg text-[#475569] max-w-3xl mx-auto leading-relaxed">
              Eliminate lost drawing revisions, disjointed WhatsApp chats, buried email approvals, and delayed contractor invoices. Keystone unifies drawing registers, client sign-offs, field site logs, and milestone stage gates in one high-precision operating system.
            </p>

            {/* Dual CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => handleGetStarted()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-7 py-3.5 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                Start 14-Day Free Studio Trial
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
              <a 
                href="#features" 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-[#E2E8F0] text-[#090D14] px-6 py-3.5 rounded-xl font-semibold text-sm shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-[#2563eb] text-base">play_circle</span>
                Explore Live Studio Demo
              </a>
            </div>

            <p className="mt-4 text-xs text-[#64748B] font-medium tracking-wide">
              No credit card required &nbsp;•&nbsp; Instant CAD &amp; BIM integration &nbsp;•&nbsp; SOC-2 Type II Certified &nbsp;•&nbsp; ISO 19650 Ready
            </p>

            {/* Hero Visual Showcase: Interactive SaaS Studio Viewport */}
            <div className="mt-14 relative max-w-5xl mx-auto">
              <div className="relative rounded-2xl border border-slate-700/80 bg-[#090D14] p-2 sm:p-3 shadow-2xl ring-1 ring-slate-900/5">
                {/* Window Chrome */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 text-xs text-slate-400 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                    <span className="ml-2 text-slate-400 font-sans text-[11px] font-medium hidden sm:inline">Keystone Studio OS — Project: 2024-BERLIN-HYBRID-TOWER</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-[11px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      RIBA Stage 4 (Technical Design)
                    </span>
                    <span className="hidden sm:inline text-slate-500">Auto-synced CAD 12:44 PM</span>
                  </div>
                </div>

                {/* Product App Canvas Layout */}
                <div className="bg-slate-900 rounded-b-xl grid grid-cols-1 lg:grid-cols-12 overflow-hidden text-left min-h-[460px]">
                  {/* Left Sidebar Navigation */}
                  <div className="hidden lg:block lg:col-span-3 border-r border-slate-800 p-4 bg-slate-950/60 font-sans">
                    <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-3">Project Register</div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-[#2563eb]/15 text-white text-xs font-medium border-l-2 border-[#2563eb]">
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-[#2563eb]">layers</span>
                          Drawing Sheets
                        </span>
                        <span className="bg-[#2563eb]/30 text-blue-200 text-[10px] px-1.5 py-0.5 rounded font-mono">48</span>
                      </div>
                      <div className="flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 text-xs font-medium">
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                          Client Sign-offs
                        </span>
                        <span className="bg-emerald-950 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded">2 Pending</span>
                      </div>
                      <div className="flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 text-xs font-medium">
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">pin_drop</span>
                          Field Site Logs
                        </span>
                        <span className="text-slate-400 text-[10px]">Today (3)</span>
                      </div>
                      <div className="flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 text-xs font-medium">
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">payments</span>
                          Fee Milestones
                        </span>
                        <span className="text-emerald-400 font-mono text-[10px]">$148k</span>
                      </div>
                    </div>

                    {/* Active Team Pill */}
                    <div className="mt-8 pt-4 border-t border-slate-800/80">
                      <div className="text-[10px] uppercase font-semibold text-slate-500 mb-2">Live Collaborators (5)</div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-[10px] font-bold text-white flex items-center justify-center">MK</div>
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-[10px] font-bold text-white flex items-center justify-center">AR</div>
                        <div className="w-6 h-6 rounded-full bg-amber-600 text-[10px] font-bold text-white flex items-center justify-center">SL</div>
                        <div className="text-xs text-slate-400">+2 MEP</div>
                      </div>
                    </div>
                  </div>

                  {/* Main Sheet Viewer & CAD Blueprint Canvas */}
                  <div className="lg:col-span-6 relative p-4 sm:p-6 blueprint-grid-dark flex flex-col justify-between">
                    {/* Top Sheet Bar */}
                    <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#2563eb] text-sm">description</span>
                        <span className="text-xs font-mono font-medium text-slate-200">A-104_Core_Structural_Grid_Rev04.pdf</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-semibold border border-emerald-500/30">
                          STATUS: APPROVED
                        </span>
                      </div>
                    </div>

                    {/* Center Interactive Drawing Blueprint Preview with Pin Overlays */}
                    <div className="my-4 relative h-64 sm:h-72 rounded-lg border border-slate-800 bg-slate-950/60 p-4 flex items-center justify-center overflow-hidden">
                      {/* Architectural Elevation / Plan Silhouette */}
                      <div className="absolute inset-0 opacity-20 flex items-center justify-center pointer-events-none">
                        <svg className="w-full h-full text-slate-500" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 400 200">
                          <rect height="160" width="340" x="30" y="20"></rect>
                          <line x1="30" x2="370" y1="60" y2="60"></line>
                          <line x1="30" x2="370" y1="120" y2="120"></line>
                          <line x1="120" x2="120" y1="20" y2="180"></line>
                          <line x1="240" x2="240" y1="20" y2="180"></line>
                          <circle cx="120" cy="90" r="18"></circle>
                          <circle cx="240" cy="90" r="18"></circle>
                        </svg>
                      </div>

                      {/* Live Client Annotation Pin 1 */}
                      <div className="absolute top-10 left-10 bg-emerald-500/90 hover:bg-emerald-500 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-lg border border-emerald-300/40 flex items-center gap-1.5 backdrop-blur-sm transition-transform hover:scale-105">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        <span>Rev 04 Approved by Client (Foster Rep)</span>
                      </div>

                      {/* Live Pin 2: RFI Note */}
                      <div className="absolute bottom-8 right-8 bg-blue-600/90 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-lg border border-blue-400/40 flex items-center gap-1.5 backdrop-blur-sm">
                        <span className="material-symbols-outlined text-[14px]">help_center</span>
                        <span>RFI #104: Steel Flange tolerance verified</span>
                      </div>

                      {/* Center Crosshair Datum */}
                      <div className="text-center font-mono text-slate-500 text-xs">
                        <div className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-900/90 px-3 py-1 rounded border border-slate-700">
                          <span className="material-symbols-outlined text-[14px] text-[#2563eb]">search</span>
                          Diff Comparison: Rev 03 (Red) vs Rev 04 (Blue)
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Transmittal Strip */}
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-emerald-400 text-sm">verified_user</span>
                        Legally signed &amp; timestamped
                      </span>
                      <span className="text-[#2563eb] font-mono text-[11px] flex items-center gap-1">
                        Export Transmittal PDF
                        <span className="material-symbols-outlined text-[12px]">download</span>
                      </span>
                    </div>
                  </div>

                  {/* Right Inspector: Live Site Telemetry */}
                  <div className="hidden lg:flex lg:col-span-3 border-l border-slate-800 p-4 bg-slate-950/40 flex-col justify-between font-sans">
                    <div>
                      <div className="flex items-center justify-between text-[11px] uppercase font-semibold text-slate-400 mb-3">
                        <span>Site Telemetry</span>
                        <span className="text-emerald-400 font-mono text-[10px]">LIVE</span>
                      </div>
                      {/* Mini Site Photo Card */}
                      <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-900 mb-3 group">
                        <div className="relative h-28 w-full bg-slate-800">
                          <img 
                            alt="Active Site Inspection" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSiSAP62qSTTXcLHw5sP31G-cs0OatEWsZUNBv__ZbV1He1KlCjgfZcUA4OeZN3gs_eSyspQQa9VkxESOFdjp1Uxj7Ejh2KrwjJaH_sENGrfzmu_SnbfJbmNsQCBFL4QCH9FbXYFK7x26wvTousENnzyAbXgD7olXH1zssVQeDT_7Hp8R0CI_cra4chQvqeK840-pqco_mGT5ecO2f1yewKWAVKuYuClH9_jTB3OR8xHuTosW-q0o9c36o5EPk2CagAB_KS47_K1M"
                          />
                          <div className="absolute bottom-1.5 left-1.5 bg-slate-950/90 text-white font-mono text-[9px] px-1.5 py-0.5 rounded">
                            Level 14 Core Pour
                          </div>
                        </div>
                        <div className="p-2.5 text-xs text-slate-300">
                          <p className="font-medium text-white text-[11px]">Site Memo #42 Logged</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Weather: 18°C, Dry • 32 Workers on deck</p>
                        </div>
                      </div>

                      {/* Milestone Fee Gate */}
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-medium">Stage 4 Milestone Billing</div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-white font-bold text-xs">$64,500.00</span>
                          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">Trigger Ready</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div className="bg-[#2563eb] h-full w-[90%] rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Status */}
                    <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Drawing Rev Audit: Clean</span>
                      <span className="text-emerald-400">0 Conflicts</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Proof Bar */}
            <div className="mt-16 pt-8 border-t border-[#E2E8F0]">
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-6">
                Trusted by over 450+ forward-thinking architecture practices, ateliers &amp; engineering studios
              </p>
              <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-70 grayscale hover:grayscale-0 transition-all duration-300">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-lg sm:text-xl text-slate-800 tracking-tighter">STUDIO·OMA</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-sans font-extrabold text-lg sm:text-xl text-slate-800 tracking-tight">FOSTER &amp; BLOOM</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-lg sm:text-xl text-slate-800">KPF·ATELIER</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-sans font-black text-lg sm:text-xl text-slate-800 tracking-widest">GENSLER·PARTNERS</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-lg sm:text-xl text-slate-800">BIG·STUDIOS</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. The Problem Section ("The Architecture Practice Dilemma") */}
        <section className="py-24 bg-white border-b border-[#E2E8F0]" id="problem">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
                <span className="material-symbols-outlined text-sm">warning</span>
                The Architecture Practice Dilemma
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#090D14] tracking-tight">
                The Chaos of Disconnected Tools
              </h2>
              <p className="mt-4 text-base text-[#475569]">
                Most architecture studios run multi-million dollar capital projects on software built for marketing teams or 90s accounting software. The result? 20+ wasted billable hours every week.
              </p>
            </div>

            {/* 3 High-Impact Problem Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="p-8 rounded-2xl bg-[#F8FAFC] border border-red-100 hover:border-red-300 transition-all hover:shadow-md relative group">
                <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-2xl">layers_clear</span>
                </div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-600">Friction 01</span>
                <h3 className="mt-2 text-xl font-bold text-[#090D14]">The Versioning Abyss</h3>
                <p className="mt-3 text-sm text-[#475569] leading-relaxed">
                  Outdated PDFs circulating on job sites. Contractors building off superseded <code className="text-xs font-mono bg-slate-200 px-1 py-0.5 rounded">Rev 02</code> while <code className="text-xs font-mono bg-slate-200 px-1 py-0.5 rounded">Rev 04</code> is buried deep in a lost email thread. Result: Costly tear-downs, rework claims, and delayed handovers.
                </p>
                <div className="mt-6 pt-4 border-t border-slate-200 text-xs font-mono text-slate-500 flex items-center justify-between">
                  <span>Cost of rework:</span>
                  <span className="font-bold text-red-600">Up to 7% project margin</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-8 rounded-2xl bg-[#F8FAFC] border border-red-100 hover:border-red-300 transition-all hover:shadow-md relative group">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-2xl">chat_bubble_outline</span>
                </div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600">Friction 02</span>
                <h3 className="mt-2 text-xl font-bold text-[#090D14]">Unrecorded Scope Creep</h3>
                <p className="mt-3 text-sm text-[#475569] leading-relaxed">
                  WhatsApp voice notes, ambiguous &quot;looks good!&quot; Slack messages, and casual site banter that never get formalized. When owners demand extra variations without fee adjustments, firms have zero defensible audit trails to protect their billing.
                </p>
                <div className="mt-6 pt-4 border-t border-slate-200 text-xs font-mono text-slate-500 flex items-center justify-between">
                  <span>Lost unbilled design:</span>
                  <span className="font-bold text-amber-600">~180 hrs / project</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-8 rounded-2xl bg-[#F8FAFC] border border-red-100 hover:border-red-300 transition-all hover:shadow-md relative group">
                <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-2xl">wrong_location</span>
                </div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600">Friction 03</span>
                <h3 className="mt-2 text-xl font-bold text-[#090D14]">The Disconnected Job Site</h3>
                <p className="mt-3 text-sm text-[#475569] leading-relaxed">
                  Site observations recorded on crumbled notebooks or messy personal smartphone rolls. Project architects spend whole Sundays wrestling Word templates just to format formal site inspection memos and snag lists for GC distribution.
                </p>
                <div className="mt-6 pt-4 border-t border-slate-200 text-xs font-mono text-slate-500 flex items-center justify-between">
                  <span>Admin burden:</span>
                  <span className="font-bold text-slate-700">6 hrs / site visit</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. The Keystone Solution ("Engineered for Architectural Rigor") */}
        <section className="py-24 bg-[#F8FAFC] blueprint-grid" id="features">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-[#2563eb] rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
                <span className="material-symbols-outlined text-sm">construction</span>
                The Keystone Solution
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-[#090D14] tracking-tight">
                Engineered for Architectural Rigor
              </h2>
              <p className="mt-4 text-base sm:text-lg text-[#475569]">
                Four purpose-built pillars that replace the patchwork of Dropbox, WhatsApp, spreadsheets, and clunky enterprise software.
              </p>
            </div>

            {/* Feature 1: Drawing Control & Vector Revisions */}
            <div className="mb-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-5 space-y-5">
                <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#2563eb] bg-[#2563eb]/10 px-2.5 py-1 rounded">
                  PILLAR 01 • DRAWING REVISION ENGINE
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#090D14]">
                  Centralized Drawing Control &amp; Vector Revisions
                </h3>
                <p className="text-[#475569] text-sm sm:text-base leading-relaxed">
                  Never wonder what revision is active. Keystone automatically categorizes plan sets from Rev 01 through Rev 04 with deterministic audit trails. Built-in vector diffing highlights every wall, door swing, or column grid change in high-contrast overlay.
                </p>
                <ul className="space-y-2.5 text-sm font-medium text-[#0F172A]">
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#2563eb] text-base">check_circle</span>
                    Instant CAD, Revit &amp; PDF multi-sheet rendering
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#2563eb] text-base">check_circle</span>
                    Automated document transmittal ledgers with QR verification
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#2563eb] text-base">check_circle</span>
                    Prevents contractors downloading superseded sheets
                  </li>
                </ul>
              </div>
              <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-md">
                <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] font-mono text-xs">
                  <span className="font-bold text-slate-800">DRAWING REGISTER: LEVEL 03 FLOOR PLAN</span>
                  <span className="text-[#2563eb] bg-[#2563eb]/10 px-2 py-0.5 rounded font-semibold">4 REVISIONS LOGGED</span>
                </div>
                <div className="mt-4 space-y-2.5">
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-[#2563eb] text-white flex items-center justify-center font-mono font-bold text-xs">04</span>
                      <div>
                        <div className="text-xs font-bold text-slate-900">A-201_Level03_PartitionPlan_Rev04.pdf</div>
                        <div className="text-[11px] text-[#64748B]">Issued by: M. Kohler • Structural grid adjusted at gridline E</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-full">Active Site Set</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between opacity-60">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-slate-300 text-slate-700 flex items-center justify-center font-mono font-bold text-xs">03</span>
                      <div>
                        <div className="text-xs font-semibold text-slate-700">A-201_Level03_PartitionPlan_Rev03.pdf</div>
                        <div className="text-[11px] text-[#64748B]">Superseded Oct 12 • Egress corridor redesign</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-200 text-slate-700 font-semibold text-xs rounded-full">Superseded</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between opacity-40">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-slate-300 text-slate-700 flex items-center justify-center font-mono font-bold text-xs">02</span>
                      <div>
                        <div className="text-xs font-semibold text-slate-700">A-201_Level03_PartitionPlan_Rev02.pdf</div>
                        <div className="text-[11px] text-[#64748B]">Superseded Sep 28 • MEP Coordination check</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-200 text-slate-700 font-semibold text-xs rounded-full">Archived</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2: Client Approval & Sign-Off Portal */}
            <div className="mb-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 order-2 lg:order-1 bg-[#090D14] text-white p-6 rounded-2xl border border-slate-800 shadow-md">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                    <span className="text-xs font-mono font-semibold text-slate-300">CLIENT PORTAL: PACIFIC HEIGHTS RESIDENCE</span>
                  </div>
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                    NO APP / LOGIN REQUIRED
                  </span>
                </div>
                {/* Preview interactive approval box */}
                <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Milestone Sign-off Request</span>
                      <h4 className="text-base font-bold text-white mt-0.5">Design Development (DD) Stage Sign-Off</h4>
                      <p className="text-xs text-slate-400 mt-1">Client: Victoria Sterling • Owner Representative</p>
                    </div>
                    <span className="bg-[#2563eb] text-white text-[11px] font-semibold px-2.5 py-1 rounded">2 Days Remaining</span>
                  </div>
                  {/* Pin annotations summary */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-400 text-sm">chat</span>
                      <span className="text-slate-300">3 client pin notes resolved on Schematics</span>
                    </div>
                    <span className="text-emerald-400 font-mono text-[11px]">All Approved ✓</span>
                  </div>
                  {/* Client Defensible Sign Button */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-400 font-mono">
                      Cryptographic SHA-256 Signature • IP: 194.22.10.4
                    </div>
                    <button 
                      onClick={() => handleGetStarted()}
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">draw</span>
                      Digital Client Approval Executed
                    </button>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-5 order-1 lg:order-2 space-y-5">
                <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded">
                  PILLAR 02 • WHITE-LABELED CLIENT PORTAL
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#090D14]">
                  Frictionless Client Approvals with Defensible Sign-Offs
                </h3>
                <p className="text-[#475569] text-sm sm:text-base leading-relaxed">
                  Never lose another dispute over &quot;we never agreed to that finish&quot;. Clients get a bespoke, branded link where they can pan through presentation sets, drop point annotations, and digitally sign off on milestones without creating cumbersome software accounts.
                </p>
                <ul className="space-y-2.5 text-sm font-medium text-[#0F172A]">
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-emerald-600 text-base">verified</span>
                    Legally defensible digital milestone sign-off certificates
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-emerald-600 text-base">verified</span>
                    Direct pin-point markups right on architectural drawings
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-emerald-600 text-base">verified</span>
                    Automatic scope change cost notification triggers
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 3: Field Telemetry & Mobile Site Logs */}
            <div className="mb-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-5 space-y-5">
                <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#2563eb] bg-[#2563eb]/10 px-2.5 py-1 rounded">
                  PILLAR 03 • SITE TELEMETRY &amp; CA
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#090D14]">
                  Field Telemetry &amp; Instant Mobile Site Logs
                </h3>
                <p className="text-[#475569] text-sm sm:text-base leading-relaxed">
                  Turn frantic site walks into polished, formal site observation reports in minutes. Snap geo-tagged defect photos, voice-dictate field snags, log weather telemetry, and distribute branded PDF reports to the GC before leaving the site office.
                </p>
                <ul className="space-y-2.5 text-sm font-medium text-[#0F172A]">
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#2563eb] text-base">check_circle</span>
                    Offline-ready mobile app for remote construction zones
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#2563eb] text-base">check_circle</span>
                    Auto weather logging, trades headcount, and inspection checklists
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#2563eb] text-base">check_circle</span>
                    Instant 1-click formal AIA / RIBA formatted field reports
                  </li>
                </ul>
              </div>
              <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-md">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl overflow-hidden border border-[#E2E8F0] bg-slate-50">
                    <div className="relative h-44 bg-slate-200">
                      <img 
                        alt="Architectural structure facade inspect" 
                        className="w-full h-full object-cover" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDn4TcdJ2Nti1E2O5rUIMK2BdFQpb-ybQPVG7kf4TdOeWlKu_euAoJXGgkSKrLIrPgZH-p8WYn8crSBeBX70DHV-SHMkA97cFJj88GbzTZuOPaESjtWMgs4B6PR7V8GghBneyn6RN-YIvjmlMHcY2rQ0m01waVKbbLNyDOB4UNbEGJgYAJz5JlfXShfGfg9YZEpTTBFQpKk2p2Nv9AQOUTl8UY5ibUW8U_i-U9sLEG81OYPvMeZ_71vIoTZjl18bFlfWT68X1USoFk"
                      />
                      <span className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">Snag Item #14</span>
                    </div>
                    <div className="p-3">
                      <div className="text-xs font-bold text-slate-800">Glazing Mullion Alignment</div>
                      <div className="text-[11px] text-[#64748B] mt-1">Grid B-3: Sealant gap exceeds 12mm spec. Notice served to Facade Subcontractor.</div>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between p-4 rounded-xl bg-slate-50 border border-[#E2E8F0]">
                    <div>
                      <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 font-mono">FIELD REPORT GENERATOR</div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-200">
                          <span className="text-[#64748B]">Project:</span>
                          <span className="font-semibold text-slate-800">Nordic Arts Center</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200">
                          <span className="text-[#64748B]">Inspection Date:</span>
                          <span className="font-semibold text-slate-800">Today, 10:30 AM</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200">
                          <span className="text-[#64748B]">Inspector:</span>
                          <span className="font-semibold text-slate-800">David Chen (Lead PA)</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200">
                          <span className="text-[#64748B]">Snags Tracked:</span>
                          <span className="font-bold text-amber-600">3 Open / 1 Closed</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleGetStarted()}
                      className="mt-4 w-full bg-[#090D14] hover:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                      Download Field Report PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 4: Phase-Gated Financial Milestones & Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 order-2 lg:order-1 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-md">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <span className="text-xs font-bold font-mono text-slate-900">RIBA STAGES 1 TO 6 • FEE GATES</span>
                  <span className="text-xs font-semibold text-[#2563eb]">100% Audit Protected</span>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-[#E2E8F0]">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">✓</span>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Stage 2: Concept Design</div>
                        <div className="text-[11px] text-[#64748B]">Approved by Client • Transmittal #092 Issued</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono text-slate-800">$28,000 Invoiced &amp; Paid</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 border border-blue-200">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#2563eb] text-white flex items-center justify-center text-xs font-bold">3</span>
                      <div>
                        <div className="text-xs font-bold text-[#2563eb]">Stage 3: Spatial Coordination</div>
                        <div className="text-[11px] text-[#64748B]">Planning pack submitted • Structural coordination 95%</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono text-[#2563eb]">$42,500 Gate Ready</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-dashed border-slate-300 opacity-60">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-xs font-bold">4</span>
                      <div>
                        <div className="text-xs font-semibold text-slate-700">Stage 4: Technical Design</div>
                        <div className="text-[11px] text-[#64748B]">Locked until Stage 3 client approval verified</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono text-slate-500">$75,000 Locked</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-5 order-1 lg:order-2 space-y-5">
                <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#2563eb] bg-[#2563eb]/10 px-2.5 py-1 rounded">
                  PILLAR 04 • PRACTICE BILLING INTEGRITY
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#090D14]">
                  Phase-Gated Financial Milestones &amp; Deliverables
                </h3>
                <p className="text-[#475569] text-sm sm:text-base leading-relaxed">
                  Stop giving away fee work before milestone criteria are fulfilled. Keystone coordinates task delivery directly with AIA B101 and RIBA stage agreements. Drawing release gates trigger client invoice notifications in real-time.
                </p>
                <ul className="space-y-2.5 text-sm font-medium text-[#0F172A]">
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#2563eb] text-base">check_circle</span>
                    Ties drawing release sets directly to client fee drawdowns
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#2563eb] text-base">check_circle</span>
                    Gantt &amp; resource forecasting built for architect-to-project ratios
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#2563eb] text-base">check_circle</span>
                    Xero, QuickBooks, and Deltek billing sync
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 5. "Before Keystone vs. With Keystone" Comparison Matrix */}
        <section className="py-24 bg-white border-y border-[#E2E8F0]" id="comparison">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#090D14] tracking-tight">
                The Practice Transformation
              </h2>
              <p className="mt-4 text-base text-[#475569]">
                See why over 450+ firms replaced generic project tools with Keystone&apos;s dedicated architecture operating system.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-300">
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-[#64748B]">Studio Workflow Dimension</th>
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50/40 rounded-t-xl">The Fragmented Legacy Way</th>
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-[#2563eb] bg-blue-50/60 rounded-t-xl">The Keystone Practice OS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-[#090D14]">Drawing Revisions &amp; Sets</td>
                    <td className="py-4 px-6 text-slate-600 bg-red-50/20">Dropbox &amp; WeTransfer links; duplicate filenames like <span className="font-mono text-xs">Plan_final_v3_REAL.pdf</span></td>
                    <td className="py-4 px-6 text-[#1d4ed8] font-medium bg-blue-50/30">Deterministic Rev ledger, automated transmittals, and multi-sheet visual diffing</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-[#090D14]">Client Sign-Offs</td>
                    <td className="py-4 px-6 text-slate-600 bg-red-50/20">Scattered WhatsApp chats, casual email replies, leaving studios liable for disputes</td>
                    <td className="py-4 px-6 text-[#1d4ed8] font-medium bg-blue-50/30">Frictionless white-labeled portal, pin annotations, and cryptographically verified approvals</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-[#090D14]">Site Observation / CA</td>
                    <td className="py-4 px-6 text-slate-600 bg-red-50/20">Handwritten notes, cluttered camera rolls, and hours spent formatting Word templates</td>
                    <td className="py-4 px-6 text-[#1d4ed8] font-medium bg-blue-50/30">Offline field app with geo-tagged defect capture and instant 1-click PDF site memos</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-[#090D14]">Stage Gate Billing</td>
                    <td className="py-4 px-6 text-slate-600 bg-red-50/20">Disjointed spreadsheets; architects drafting next phases before prior invoices are cleared</td>
                    <td className="py-4 px-6 text-[#1d4ed8] font-medium bg-blue-50/30">Deliverable-locked fee gates mapped directly to AIA &amp; RIBA milestone schedules</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-[#090D14]">Audit &amp; Legal Protection</td>
                    <td className="py-4 px-6 text-slate-600 bg-red-50/20">Fragile email searches when lawyers or insurance brokers demand verification proof</td>
                    <td className="py-4 px-6 text-[#1d4ed8] font-medium bg-blue-50/30">Immutable timestamped logs for every sheet revision, transmittal dispatch, and contractor download</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 6. Quantifiable Customer ROI & Proof Section */}
        <section className="py-24 bg-[#090D14] text-white relative overflow-hidden" id="proof">
          <div className="absolute inset-0 blueprint-grid-dark opacity-40"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2563eb]/20 text-blue-200 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
                Proven Impact
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Transforming Studio Economics
              </h2>
              <p className="mt-4 text-slate-400 text-base">
                Real numbers measured across 450+ practices in North America, the UK, and Europe.
              </p>
            </div>

            {/* 4 High-Impact Metric Counters */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="text-4xl sm:text-5xl font-black text-[#2563eb] font-mono tracking-tight">84%</div>
                <div className="mt-2 text-xs uppercase tracking-wider text-slate-400 font-semibold">Reduction in Revision Delays</div>
                <p className="mt-1 text-xs text-slate-500">Eliminates GC confusion and duplicate prints</p>
              </div>
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="text-4xl sm:text-5xl font-black text-emerald-400 font-mono tracking-tight">14 Days</div>
                <div className="mt-2 text-xs uppercase tracking-wider text-slate-400 font-semibold">Faster Client Sign-Offs</div>
                <p className="mt-1 text-xs text-slate-500">Accelerated milestone turnaround</p>
              </div>
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">$72k</div>
                <div className="mt-2 text-xs uppercase tracking-wider text-slate-400 font-semibold">Annual Billable Hours Saved</div>
                <p className="mt-1 text-xs text-slate-500">Calculated per 15-architect studio</p>
              </div>
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="text-4xl sm:text-5xl font-black text-blue-400 font-mono tracking-tight">100%</div>
                <div className="mt-2 text-xs uppercase tracking-wider text-slate-400 font-semibold">Transmittal Audit Compliance</div>
                <p className="mt-1 text-xs text-slate-500">Bulletproof legal defensibility</p>
              </div>
            </div>

            {/* Testimonial Cards */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                <p className="text-slate-300 text-sm leading-relaxed italic">
                  &quot;Before Keystone, we lost at least $40,000 on a single project due to unrecorded client variations made over phone calls. Keystone gives our studio bulletproof milestone protection.&quot;
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs">ER</div>
                  <div>
                    <div className="font-bold text-sm text-white">Elena Rostova, AIA</div>
                    <div className="text-xs text-slate-400">Principal, Rostova Studio (Zurich &amp; NY)</div>
                  </div>
                </div>
              </div>
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                <p className="text-slate-300 text-sm leading-relaxed italic">
                  &quot;The Drawing Control engine alone is worth 10x the price. Our project architects don&apos;t spend Friday afternoons manually compiling transmittal tables anymore. It is instantaneous.&quot;
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-xs">MB</div>
                  <div>
                    <div className="font-bold text-sm text-white">Marcus Sterling, RIBA</div>
                    <div className="text-xs text-slate-400">Managing Director, Sterling Form Atelier</div>
                  </div>
                </div>
              </div>
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                <p className="text-slate-300 text-sm leading-relaxed italic">
                  &quot;We replaced Procore and Monday.com with Keystone. It feels like software finally designed by people who understand what a Section Cut, RFI, and RIBA Stage 4 actually mean.&quot;
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center font-bold text-white text-xs">JH</div>
                  <div>
                    <div className="font-bold text-sm text-white">Julia Thorne</div>
                    <div className="text-xs text-slate-400">Head of Operations, GridLab Architecture</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Transparent, Predictable SaaS Pricing Preview */}
        <section className="py-24 bg-[#F8FAFC]" id="pricing">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2563eb]/10 text-[#2563eb] rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
                Transparent Practice Plans
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#090D14] tracking-tight">
                Predictable Pricing for High-Performance Studios
              </h2>
              <p className="mt-4 text-base text-[#475569]">
                Simple per-seat pricing with unlimited project sheets, unlimited client portal links, and CAD integration.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
              {/* Starter Studio */}
              <div className="p-8 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#64748B]">Starter Studio</div>
                  <h3 className="text-2xl font-bold text-[#090D14] mt-2">Boutique</h3>
                  <p className="text-xs text-[#64748B] mt-1">Ideal for emerging practices with 1-5 architects</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-[#090D14] font-mono">$39</span>
                    <span className="text-xs text-[#64748B] font-medium">/ user / month</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Billed annually ($49 billed monthly)</p>
                  <div className="mt-6 pt-6 border-t border-[#E2E8F0] space-y-3 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#2563eb] text-sm">check</span>
                      Up to 10 Active Projects
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#2563eb] text-sm">check</span>
                      Automated Drawing Revision Engine
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#2563eb] text-sm">check</span>
                      Client Approval Portals (Unlimited clients)
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#2563eb] text-sm">check</span>
                      Standard Field Site Logs
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleGetStarted()}
                  className="mt-8 block text-center w-full bg-slate-100 hover:bg-slate-200 text-[#090D14] font-semibold text-xs py-3 rounded-lg transition-colors cursor-pointer"
                >
                  Start Free 14-Day Trial
                </button>
              </div>

              {/* Growth Practice (Most Popular) */}
              <div className="p-8 rounded-2xl bg-white border-2 border-[#2563eb] shadow-lg flex flex-col justify-between relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2563eb] text-white font-mono uppercase tracking-wider text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                  Most Popular Choice
                </div>
                <div>
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#2563eb]">Growth Practice</div>
                  <h3 className="text-2xl font-bold text-[#090D14] mt-2">Studio Pro</h3>
                  <p className="text-xs text-[#64748B] mt-1">Designed for established studios with 6-30 architects</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-[#2563eb] font-mono">$79</span>
                    <span className="text-xs text-[#64748B] font-medium">/ user / month</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Billed annually ($95 billed monthly)</p>
                  <div className="mt-6 pt-6 border-t border-[#E2E8F0] space-y-3 text-xs text-slate-700 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#2563eb] text-sm">check_circle</span>
                      Unlimited Projects &amp; Sheet Storage
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#2563eb] text-sm">check_circle</span>
                      Vector CAD &amp; Multi-Sheet Diff Comparisons
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#2563eb] text-sm">check_circle</span>
                      White-Labeled Client Portals &amp; Custom Domain
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#2563eb] text-sm">check_circle</span>
                      AIA &amp; RIBA Phase-Gated Fee Tracking
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#2563eb] text-sm">check_circle</span>
                      Full Mobile Field CA App &amp; Offline Sync
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleGetStarted()}
                  className="mt-8 block text-center w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-xs py-3 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  Start Free 14-Day Trial
                </button>
              </div>

              {/* Enterprise Atelier */}
              <div className="p-8 rounded-2xl bg-[#090D14] text-white border border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Enterprise Atelier</div>
                  <h3 className="text-2xl font-bold text-white mt-2">Global Firm</h3>
                  <p className="text-xs text-slate-400 mt-1">Multi-office studios, large engineering &amp; multidisciplinary firms</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white font-mono">Custom</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Tailored volume tiers &amp; dedicated SLA</p>
                  <div className="mt-6 pt-6 border-t border-slate-800 space-y-3 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-400 text-sm">check</span>
                      Revit, BIM 360 &amp; Deltek Vision Integrations
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-400 text-sm">check</span>
                      Custom Security SSO (SAML, Okta, Azure AD)
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-400 text-sm">check</span>
                      Dedicated Studio Success Architect
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-400 text-sm">check</span>
                      Custom Legal Transmittal Templates
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleGetStarted()}
                  className="mt-8 block text-center w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs py-3 rounded-lg transition-colors cursor-pointer"
                >
                  Contact Studio Enterprise
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 8. High-Converting Bottom CTA Banner */}
        <section className="py-24 bg-[#090D14] relative overflow-hidden text-center text-white" id="trial">
          <div className="absolute inset-0 blueprint-grid-dark opacity-30 pointer-events-none"></div>
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#2563eb]/20 blur-3xl rounded-full pointer-events-none"></div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-mono text-blue-200 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Deploy Keystone in under 5 minutes
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Ready to elevate your studio&apos;s <br /> operational precision?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
              Join over 450+ leading architecture and design practices that trust Keystone to run their projects from concept to occupancy.
            </p>
            {/* Work Email Quick Input Box */}
            <form className="mt-8 max-w-md mx-auto flex flex-col sm:flex-row gap-2" onSubmit={handleCtaSubmit}>
              <input 
                className="bg-slate-900/90 border border-slate-700 text-white placeholder-slate-400 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2563eb] flex-1 font-sans" 
                placeholder="Enter your studio work email..." 
                type="email"
                value={ctaEmail}
                onChange={(e) => setCtaEmail(e.target.value)}
                required
              />
              <button 
                className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-md cursor-pointer" 
                type="submit"
              >
                Get Started Free
              </button>
            </form>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-400 text-sm">lock</span>
                SOC-2 Type II Certified
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-400 text-sm">verified</span>
                ISO 19650 BIM Standard
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-400 text-sm">credit_card_off</span>
                No credit card needed
              </span>
            </div>
            <div className="mt-8">
              <button 
                onClick={() => handleGetStarted()}
                className="text-xs text-slate-400 hover:text-white underline underline-offset-4 transition-colors cursor-pointer"
              >
                Prefer a personalized walkthrough? Schedule a Practice Audit with our Architectural Solutions team →
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 9. Comprehensive Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] pt-16 pb-12 text-sm text-[#64748B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Col 1: Brand Info */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#090D14] flex items-center justify-center text-white">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                    <polyline points="2 17 12 22 22 17"></polyline>
                    <polyline points="2 12 12 17 22 12"></polyline>
                  </svg>
                </div>
                <span className="font-mono font-black text-[#090D14] text-sm tracking-tight uppercase">Keystone OS</span>
              </div>
              <p className="text-xs text-[#475569] max-w-sm leading-relaxed">
                The purpose-built operating system engineered exclusively for architecture, engineering, and spatial design firms worldwide.
              </p>
              <div className="text-xs text-slate-500 font-mono">
                Architectural Rigor. Frictionless Delivery.
              </div>
            </div>

            {/* Col 2: Product */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#090D14] font-mono">Product</div>
              <ul className="space-y-2 text-xs">
                <li><a className="hover:text-[#2563eb] transition-colors" href="#features">Drawing Control &amp; CAD</a></li>
                <li><a className="hover:text-[#2563eb] transition-colors" href="#features">Client Approval Portals</a></li>
                <li><a className="hover:text-[#2563eb] transition-colors" href="#features">Field Site Logs &amp; CA</a></li>
                <li><a className="hover:text-[#2563eb] transition-colors" href="#features">Phase-Gated Financials</a></li>
                <li><a className="hover:text-[#2563eb] transition-colors" href="#features">Vector Revisions Engine</a></li>
                <li><a className="hover:text-[#2563eb] transition-colors" href="#pricing">Studio Pricing</a></li>
              </ul>
            </div>

            {/* Col 3: Practice Standards */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#090D14] font-mono">Standards</div>
              <ul className="space-y-2 text-xs">
                <li><span className="text-[#64748B]">RIBA Plan of Work (0-7)</span></li>
                <li><span className="text-[#64748B]">AIA B101 Contracts</span></li>
                <li><span className="text-[#64748B]">ISO 19650 BIM Workflows</span></li>
                <li><span className="text-[#64748B]">RAIC / OAA Deliverables</span></li>
                <li><span className="text-[#64748B]">Revit &amp; ArchiCAD Connect</span></li>
              </ul>
            </div>

            {/* Col 4: Trust & Legal */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#090D14] font-mono">Trust &amp; Legal</div>
              <ul className="space-y-2 text-xs">
                <li><span className="text-[#64748B]">SOC-2 Type II Report</span></li>
                <li><span className="text-[#64748B]">GDPR &amp; Data Privacy</span></li>
                <li><span className="text-[#64748B]">Terms of Studio Service</span></li>
                <li><span className="text-[#64748B]">Legal Signature Admissibility</span></li>
                <li><span className="text-[#64748B]">System Status: 99.99%</span></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div>
              © 2026 Keystone Studio Systems Inc. Designed for architectural craft and operational precision.
            </div>
            <div className="flex items-center gap-6">
              <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                All Systems Operational
              </span>
              <span>Version 4.2.1-prod</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
