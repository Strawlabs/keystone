import { create } from 'zustand';

// Zero-dependency API fetch wrapper to automatically attach Bearer JWT token
const apiFetch = async (url, options = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('keystone_token') : null;
  const storeState = typeof useStore !== 'undefined' && useStore.getState ? useStore.getState() : {};
  const headers = {
    'Content-Type': 'application/json',
    'x-tenant-id': storeState.currentTenantId || 't1',
    'x-user-id': storeState.currentUser?.id || 'u1',
    'x-user-role': storeState.currentUser?.role || 'admin',
    ...options.headers
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    ...options,
    headers
  });
  if ((res.status === 401 || res.status === 403) && typeof window !== 'undefined') {
    if (!url.includes('/api/auth/login') && !url.includes('/api/company/register')) {
      const store = useStore.getState();
      let errorMsg = '';
      try {
        const cloned = res.clone();
        const data = await cloned.json();
        errorMsg = data?.error || '';
      } catch (e) {}

      const isDeactivated = errorMsg.toLowerCase().includes('deactivated') || errorMsg.toLowerCase().includes('disabled');

      if (res.status === 401 || isDeactivated) {
        if (store.isAuthenticated) {
          store.logout();
          store.setError(isDeactivated ? 'Your account has been deactivated or disabled.' : 'Session expired or unauthorized. Please log in again.');
        }
      }
    }
  }
  return res;
};

const MOCK_USERS = [
  { id: 'u1', name: 'Company Admin', email: 'admin@corporate.com', role: 'admin', status: 'active', designation: 'Principal Architect' },
  { id: 'u2', name: 'Sarah Jenkins', email: 'sarah@corporate.com', role: 'architect', status: 'active', designation: 'Senior Lead Architect' },
  { id: 'u3', name: 'Rajesh Kumar', email: 'rajesh@client.com', role: 'client', status: 'active', client_company: 'Skyline Developers' }
];

const MOCK_PROJECTS = [
  { id: 'p1', name: 'Strawlabs Innovation Hub', code: 'SL-2026', client_name: 'Skyline Developers', client_email: 'rajesh@client.com', status: 'active', start_date: '2026-01-15', end_date: '2026-12-30', description: 'State of the art sustainable commercial building layout.' },
  { id: 'p2', name: 'Horizon Luxury Residences', code: 'HL-2026', client_name: 'Skyline Developers', client_email: 'rajesh@client.com', status: 'planning', start_date: '2026-03-01', end_date: '2027-06-01', description: 'Premium waterfront architectural plan and structural elevations.' }
];

const MOCK_DRAWINGS = [
  { id: 'd1', project_id: 'p1', name: 'Ground Floor Master Plan & Structural Grid', drawing_number: 'SL-GF-01', category: 'architectural', current_revision: 2, file_url: 'https://images.unsplash.com/photo-1503387762-592dedbd82d2?w=1000', uploaded_by: 'u2', created_at: '2026-07-10T10:00:00Z', description: 'Complete structural layout featuring reinforced columns and main atrium grid.' },
  { id: 'd2', project_id: 'p1', name: 'North Elevation & Glazing Schematics', drawing_number: 'SL-EL-04', category: 'elevation', current_revision: 1, file_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000', uploaded_by: 'u2', created_at: '2026-07-11T14:30:00Z', description: 'Exterior elevation detailing double-glazed curtain walls and solar shading louvers.' },
  { id: 'd3', project_id: 'p2', name: 'Penthouse MEP & Electrical Routing Plan', drawing_number: 'HL-MEP-02', category: 'electrical', current_revision: 1, file_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1000', uploaded_by: 'u2', created_at: '2026-07-12T09:15:00Z', description: 'Detailed electrical wiring diagram and HVAC duct routing for top level.' },
  { id: 'd4', project_id: 'p1', name: 'Foundation Piling & Rebar Details', drawing_number: 'SL-ST-01', category: 'structural', current_revision: 3, file_url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1000', uploaded_by: 'u2', created_at: '2026-07-13T16:45:00Z', description: 'Foundation structural piling diagram ready for contractor sign-off.' }
];

const MOCK_APPROVALS = [
  { id: 'a1', drawing_id: 'd1', client_id: 'u3', status: 'pending', comments: 'Please verify the main entrance column clearance dimensions.', submission_notes: 'Initial submission for Client review and sign-off.', due_date: '2026-07-20', submitted_by: 'u2', submitted_at: '2026-07-10T11:00:00Z', drawings: MOCK_DRAWINGS[0] },
  { id: 'a2', drawing_id: 'd2', client_id: 'u3', status: 'pending', comments: 'Pending structural glazing insulation certification review.', submission_notes: 'Elevation sheets attached for facade approval.', due_date: '2026-07-22', submitted_by: 'u2', submitted_at: '2026-07-11T15:00:00Z', drawings: MOCK_DRAWINGS[1] },
  { id: 'a3', drawing_id: 'd3', client_id: 'u3', status: 'revision_requested', comments: 'Adjust the master bedroom lighting switch locations.', submission_notes: 'Sent for MEP check.', due_date: '2026-07-25', submitted_by: 'u2', submitted_at: '2026-07-12T10:00:00Z', drawings: MOCK_DRAWINGS[2] },
  { id: 'a4', drawing_id: 'd4', client_id: 'u3', status: 'approved', comments: 'Approved by client. Structural reinforcement exceeds code specifications.', submission_notes: 'Final foundation revision.', due_date: '2026-07-18', submitted_by: 'u2', submitted_at: '2026-07-13T17:00:00Z', responded_at: '2026-07-14T09:00:00Z', drawings: MOCK_DRAWINGS[3] }
];

const MOCK_TASKS = [
  { id: 't-1', project_id: 'p1', title: 'Review Structural Calculations for Atrium', description: 'Verify beam load capacities across floor spans.', assigned_to: 'u2', priority: 'high', status: 'in_progress', due_date: '2026-07-18' },
  { id: 't-2', project_id: 'p2', title: 'Submit Electrical Layout for Municipal Inspection', description: 'Prepare drawing package HL-MEP-02 for code review.', assigned_to: 'u2', priority: 'medium', status: 'pending', due_date: '2026-07-24' }
];

export const useStore = create((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  token: typeof window !== 'undefined' ? localStorage.getItem('keystone_token') : null,
  resetToken: null,
  projects: MOCK_PROJECTS,
  drawings: MOCK_DRAWINGS,
  drawingVersions: {}, // map drawing_id -> versions
  projectMembers: {},  // map project_id -> members
  projectTimeline: {}, // map project_id -> activity timeline
  approvals: MOCK_APPROVALS,
  tasks: MOCK_TASKS,
  siteLogs: [],
  notifications: [],
  activityLogs: [],
  users: MOCK_USERS,
  tenants: [],
  dashboardStats: null, // Aggregated dashboard KPIs and recent data per role
  dashboardStatsLoading: false, // True while /api/dashboard/stats is in-flight
  currentTenant: null, // Full profile of current firm/tenant
  currentTenantId: 't1',
  activeTab: 'login', // Default start page is login
  selectedProjectId: null,
  selectedDrawingId: null,
  selectedApprovalId: null,
  loading: false,
  error: null,
  successMessage: null,
  drawingSort: 'created_at_desc', // 'created_at_desc' | 'name_asc' | 'name_desc' | 'revision_desc'
  _signedUrlCache: {}, // { storagePath -> { url, expiresAt } }

  // Helper to trigger success toast
  setSuccess: (msg) => {
    set({ successMessage: msg });
    setTimeout(() => set({ successMessage: null }), 20000);
  },

  // Helper to trigger error toast
  setError: (msg) => {
    set({ error: msg });
    setTimeout(() => set({ error: null }), 20000);
  },

  // Initialize and load all data from APIs
  fetchData: async (isBackground = false) => {
    const { currentTenantId, currentUser } = get();
    if (!currentUser) return;

    // Guard: if tenantId is a dev mock value (not a real UUID), skip DB calls and populate mocks
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(currentTenantId)) {
      console.info('[Dev Mode] Skipping DB fetch — mock tenant ID detected:', currentTenantId);
      if (get().drawings.length === 0 || get().approvals.length === 0) {
        set({
          projects: MOCK_PROJECTS,
          drawings: MOCK_DRAWINGS,
          approvals: MOCK_APPROVALS,
          users: MOCK_USERS,
          tasks: MOCK_TASKS
        });
      }
      set({ loading: false });
      return;
    }

    if (!isBackground) {
      set({ loading: true });
    }
    try {
      const headers = {
        'x-tenant-id': currentTenantId,
        'x-user-id': currentUser.id
      };

      const isAdmin = currentUser.role === 'admin';
      const isClient = currentUser.role === 'client';

      // Fetch all raw data in parallel for high-performance load balancing
      const [resProj, resDraw, resAppr, resTasks, resLogs, resNotif, resAct, resUsers, resTenant] = await Promise.all([
        apiFetch(`/api/projects?tenantId=${currentTenantId}`, { headers }),
        apiFetch(`/api/drawings?tenantId=${currentTenantId}`, { headers }),
        apiFetch(`/api/approvals?tenantId=${currentTenantId}`, { headers }),
        apiFetch(`/api/tasks?tenantId=${currentTenantId}`, { headers }),
        apiFetch(`/api/site-logs?tenantId=${currentTenantId}`, { headers }),
        apiFetch(`/api/notifications?tenantId=${currentTenantId}&userId=${currentUser.id}`, { headers }),
        isAdmin
          ? apiFetch(`/api/activity-logs?tenantId=${currentTenantId}`, { headers })
          : Promise.resolve({ ok: true, json: () => Promise.resolve({ activityLogs: [] }) }),
        !isClient
          ? apiFetch(`/api/users?tenantId=${currentTenantId}`, { headers })
          : Promise.resolve({ ok: true, json: () => Promise.resolve({ users: [] }) }),
        apiFetch('/api/company', { headers })
      ]);

      const [dataProj, dataDraw, dataAppr, dataTasks, dataLogs, dataNotif, dataAct, dataUsers, dataTenant] = await Promise.all([
        resProj.json(),
        resDraw.json(),
        resAppr.json(),
        resTasks.json(),
        resLogs.json(),
        resNotif.json(),
        resAct.json(),
        resUsers.json(),
        resTenant.ok ? resTenant.json() : Promise.resolve(null)
      ]);

      set({
        projects: (dataProj.projects && dataProj.projects.length > 0) ? dataProj.projects : MOCK_PROJECTS,
        drawings: (dataDraw.drawings && dataDraw.drawings.length > 0) ? dataDraw.drawings : MOCK_DRAWINGS,
        approvals: (dataAppr.approvals && dataAppr.approvals.length > 0) ? dataAppr.approvals : MOCK_APPROVALS,
        tasks: (dataTasks.tasks && dataTasks.tasks.length > 0) ? dataTasks.tasks : MOCK_TASKS,
        siteLogs: dataLogs.siteLogs || [],
        notifications: dataNotif.notifications || [],
        activityLogs: dataAct.activityLogs || [],
        users: dataUsers.users || [],
        currentTenant: dataTenant?.tenant || null,
        loading: false
      });

      // Fetch aggregated dashboard stats (non-blocking)
      get().fetchDashboardStats();
    } catch (e) {
      console.error(e);
      set({ error: 'Failed to load workspace data.', loading: false });
    }
  },

  // Fetch aggregated dashboard KPIs and recent data from the dedicated stats endpoint
  fetchDashboardStats: async () => {
    const { currentTenantId, currentUser } = get();
    if (!currentUser) return;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(currentTenantId)) return; // Skip in dev mock mode

    set({ dashboardStatsLoading: true });
    try {
      const res = await apiFetch(`/api/dashboard/stats?tenantId=${currentTenantId}`, {
        headers: {
          'x-tenant-id': currentTenantId,
          'x-user-id': currentUser.id
        }
      });
      if (!res.ok) {
        set({ dashboardStatsLoading: false });
        return;
      }
      const data = await res.json();
      set({ dashboardStats: data, dashboardStatsLoading: false });
    } catch (e) {
      console.error('[Dashboard Stats] Failed to fetch:', e);
      set({ dashboardStatsLoading: false });
    }
  },

  // Company registration (Replaces default signup)
  signup: async (name, adminName, email, companyName, companyAddress, companyNumber) => {
    set({ loading: true });
    try {
      const res = await apiFetch('/api/company/register', {
        method: 'POST',
        body: JSON.stringify({
          company_name: companyName,
          company_email: email,
          admin_name: adminName,
          admin_email: name, // 'name' arg holds the admin email (from the form's admin email field)
          company_address: companyAddress,
          company_number: companyNumber
        })
      });
      const data = await res.json();
      if (!res.ok) {
        set({ error: data.error || 'Signup failed', loading: false });
        return null;
      }
      
      set({ loading: false, activeTab: 'login' });
      get().setSuccess('Workspace registered! Please check your email for the temporary login password.');
      return data;
    } catch (e) {
      set({ error: 'Server connection failed.', loading: false });
      return null;
    }
  },

  // Legacy verify - preserved for compatibility
  verify: async (email, code) => {
    set({ loading: true, isAuthenticated: true, activeTab: 'dashboard', loading: false });
    return true;
  },

  // Legacy resend OTP - preserved for compatibility
  resendOtp: async (email) => {
    get().setSuccess('Verification code resent');
    return true;
  },

  // Custom multi-tenant login handler
  login: async (email, password, companyId = null) => {
    set({ loading: true });
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ company_id: companyId, email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        set({ error: data.error || 'Login failed', loading: false });
        return false;
      }

      // Check if first-login forced password change is required
      if (data.force_password_change) {
        set({
          activeTab: 'force-reset',
          resetToken: data.reset_token,
          loading: false
        });
        get().setSuccess('Temporary password verified. Please set a new secure password.');
        return true;
      }

      // Store JWT token locally
      localStorage.setItem('keystone_token', data.token);

      // Pre-set token & tenant context so that parallel apiFetch calls inside fetchData work
      set({
        token: data.token,
        currentUser: data.user,
        currentTenantId: data.user.tenant_id
      });

      // Fetch all workspace and dashboard stats in parallel
      await Promise.all([
        get().fetchData(),
        get().fetchDashboardStats()
      ]);

      set({
        isAuthenticated: true,
        activeTab: 'dashboard',
        loading: false
      });
      get().setSuccess(`Logged in as ${data.user.name}`);
      return true;
    } catch (e) {
      set({ error: 'Server connection failed.', loading: false });
      return false;
    }
  },

  // Log out and clear state
  logout: async () => {
    localStorage.removeItem('keystone_token');
    set({
      currentUser: null,
      isAuthenticated: false,
      token: null,
      resetToken: null,
      activeTab: 'login',
      projects: [],
      drawings: [],
      projectMembers: {},
      projectTimeline: {},
      approvals: [],
      tasks: [],
      siteLogs: [],
      notifications: [],
      activityLogs: [],
      users: []
    });
  },

  // Forgot password reset request
  resetPassword: async (email, companyId = null) => {
    set({ loading: true });
    try {
      const res = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ company_id: companyId, email })
      });
      const data = await res.json();
      if (!res.ok) {
        get().setError(data.error || 'Failed to send reset link');
        set({ loading: false });
        return false;
      }
      set({ loading: false, activeTab: 'forgot-otp', resetToken: data.reset_token || null });
      get().setSuccess(data.message || 'Verification code and reset link sent to your email.');
      return true;
    } catch (e) {
      get().setError('Server connection failed.');
      set({ loading: false });
      return false;
    }
  },

  // Complete forgot password reset using 6-digit OTP code + new password
  completePasswordResetWithOtp: async (email, otp, newPassword) => {
    set({ loading: true });
    try {
      const { resetToken } = get();
      const res = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ reset_token: resetToken || undefined, email, otp, new_password: newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        set({ error: data.error || 'Failed to verify code and reset password', loading: false });
        return false;
      }
      set({
        resetToken: null,
        activeTab: 'login',
        loading: false
      });
      get().setSuccess(data.message || 'Password reset successfully. You can now log in.');
      return true;
    } catch (e) {
      set({ error: 'Server connection failed.', loading: false });
      return false;
    }
  },

  // Forced password reset (First Login)
  changePasswordWithToken: async (newPassword) => {
    const { resetToken } = get();
    if (!resetToken) {
      get().setError('Session expired. Please log in again.');
      set({ activeTab: 'login' });
      return false;
    }
    set({ loading: true });
    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ reset_token: resetToken, new_password: newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        set({ error: data.error || 'Failed to update password', loading: false });
        return false;
      }
      set({
        resetToken: null,
        activeTab: 'login',
        loading: false
      });
      get().setSuccess('Password updated successfully! You can now log in.');
      return true;
    } catch (e) {
      set({ error: 'Server connection failed.', loading: false });
      return false;
    }
  },

  // Forgot password reset completion (from reset-password link)
  completePasswordReset: async (newPassword) => {
    const { resetToken } = get();
    if (!resetToken) {
      get().setError('Invalid or expired reset token. Please request a new link.');
      set({ activeTab: 'forgot' });
      return false;
    }
    set({ loading: true });
    try {
      const res = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ reset_token: resetToken, new_password: newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        set({ error: data.error || 'Failed to reset password', loading: false });
        return false;
      }
      set({
        resetToken: null,
        activeTab: 'login',
        loading: false
      });
      get().setSuccess('Password reset successfully. You can now log in.');
      return true;
    } catch (e) {
      set({ error: 'Server connection failed.', loading: false });
      return false;
    }
  },

  // Change password from Settings view (Scenario D)
  changePasswordInSettings: async (oldPassword, newPassword) => {
    set({ loading: true });
    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        get().setError(data.error || 'Failed to update password');
        set({ loading: false });
        return false;
      }
      set({ loading: false });
      get().setSuccess('Password updated successfully.');
      return true;
    } catch (e) {
      get().setError('Server connection failed.');
      set({ loading: false });
      return false;
    }
  },

  // Projects CRUD
  createProject: async (projectData) => {
    const { currentTenantId, currentUser } = get();
    try {
      const res = await apiFetch('/api/projects', {
        method: 'POST',
        headers: {
          'x-tenant-id': currentTenantId,
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ ...projectData, tenant_id: currentTenantId, created_by: currentUser.id })
      });
      const data = await res.json();
      if (!res.ok) {
        get().setError(data.error || 'Failed to create project');
        return false;
      }
      get().setSuccess('Project created successfully');
      await get().fetchData();
      return data.project || true;
    } catch (e) {
      get().setError('Network error creating project.');
      return false;
    }
  },

  updateProject: async (id, updates) => {
    const { currentTenantId, currentUser } = get();
    try {
      const res = await apiFetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'x-tenant-id': currentTenantId,
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ ...updates, tenant_id: currentTenantId, user_id: currentUser.id })
      });
      const data = await res.json();
      if (!res.ok) {
        get().setError(data.error || 'Failed to update project');
        return false;
      }
      get().setSuccess('Project updated successfully');
      await get().fetchData();
      return true;
    } catch (e) {
      get().setError('Network error updating project.');
      return false;
    }
  },

  deleteProject: async (id) => {
    const { currentTenantId, currentUser } = get();
    try {
      const res = await apiFetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: {
          'x-tenant-id': currentTenantId,
          'x-user-id': currentUser.id
        }
      });
      const data = await res.json();
      if (!res.ok) {
        get().setError(data.error || 'Failed to delete project');
        return false;
      }
      get().setSuccess('Project archived successfully');
      await get().fetchData();
      return true;
    } catch (e) {
      get().setError('Network error archiving project.');
      return false;
    }
  },

  // Drawings CRUD
  createDrawing: async (drawingData) => {
    const { currentTenantId, currentUser } = get();
    try {
      const res = await apiFetch('/api/drawings', {
        method: 'POST',
        headers: {
          'x-tenant-id': currentTenantId,
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          ...drawingData,
          tenant_id: currentTenantId,
          uploaded_by: currentUser.id
        })
      });
      const data = await res.json();
      if (!res.ok) {
        get().setError(data.error || 'Failed to upload drawing');
        return false;
      }
      get().setSuccess('Drawing uploaded successfully');
      await get().fetchData();
      return true;
    } catch (e) {
      get().setError('Network error uploading drawing.');
      return false;
    }
  },

  deleteDrawing: async (drawingId) => {
    const { currentTenantId, currentUser } = get();
    try {
      const res = await apiFetch(`/api/drawings/${drawingId}`, {
        method: 'DELETE',
        headers: {
          'x-tenant-id': currentTenantId,
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role
        }
      });
      const data = await res.json();
      if (!res.ok) {
        get().setError(data.error || 'Failed to delete drawing');
        return false;
      }
      get().setSuccess('Drawing deleted successfully');
      await get().fetchData();
      return true;
    } catch (e) {
      get().setError('Network error deleting drawing.');
      return false;
    }
  },

  // Get a signed download URL for a private storage path (with 55-min cache)
  getSignedUrl: async (storagePath) => {
    if (!storagePath) return null;

    // Check cache
    const cache = get()._signedUrlCache;
    const cached = cache[storagePath];
    if (cached && cached.expiresAt > Date.now()) {
      return cached.url;
    }

    const { currentTenantId, currentUser } = get();
    try {
      const res = await apiFetch('/api/storage/signed-url', {
        method: 'POST',
        headers: {
          'x-tenant-id': currentTenantId,
          'x-user-id': currentUser?.id
        },
        body: JSON.stringify({ storagePath })
      });
      const data = await res.json();
      if (!res.ok || !data.signedUrl) return null;

      // Cache for 55 minutes (slightly less than server TTL of 60 min)
      set((state) => ({
        _signedUrlCache: {
          ...state._signedUrlCache,
          [storagePath]: {
            url: data.signedUrl,
            expiresAt: Date.now() + 55 * 60 * 1000
          }
        }
      }));

      return data.signedUrl;
    } catch (e) {
      console.error('Failed to get signed URL:', e);
      return null;
    }
  },

  createDrawingRevision: async (drawingId, file_url, notes, storage_path) => {
    const { currentTenantId, currentUser } = get();
    try {
      const res = await apiFetch(`/api/drawings/${drawingId}/revision`, {
        method: 'POST',
        headers: {
          'x-tenant-id': currentTenantId,
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          file_url,
          storage_path: storage_path || null,
          notes,
          tenant_id: currentTenantId,
          uploaded_by: currentUser.id
        })
      });
      const data = await res.json();
      if (!res.ok) {
        get().setError(data.error || 'Failed to upload revision');
        return false;
      }
      get().setSuccess('Revision uploaded successfully');
      await get().fetchData();
      return true;
    } catch (e) {
      get().setError('Network error uploading revision.');
      return false;
    }
  },

  fetchDrawingVersions: async (drawingId) => {
    const { currentTenantId } = get();
    try {
      const res = await apiFetch(`/api/drawings/${drawingId}/revision?tenantId=${currentTenantId}`);
      const data = await res.json();
      if (res.ok) {
        set((state) => ({
          drawingVersions: { ...state.drawingVersions, [drawingId]: data.versions }
        }));
      }
    } catch (e) {
      console.error(e);
    }
  },

  // Approvals Actions
  // Approvals Actions
  submitApproval: async (approvalData) => {
    const { currentTenantId, currentUser, drawings, approvals } = get();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(currentTenantId)) {
      const drawing = drawings.find(d => d.id === approvalData.drawing_id) || drawings[0];
      const newAppr = {
        id: `a-${Date.now()}`,
        drawing_id: approvalData.drawing_id,
        client_id: approvalData.client_id || 'u3',
        status: 'pending',
        comments: approvalData.comments || '',
        submission_notes: approvalData.submission_notes || '',
        due_date: approvalData.due_date || new Date(Date.now() + 604800000).toISOString().split('T')[0],
        submitted_by: currentUser?.id || 'u2',
        submitted_at: new Date().toISOString(),
        drawings: drawing
      };
      set({ approvals: [newAppr, ...approvals] });
      get().setSuccess('Submitted for approval successfully');
      return true;
    }

    try {
      const res = await apiFetch('/api/approvals', {
        method: 'POST',
        headers: {
          'x-tenant-id': currentTenantId,
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ ...approvalData, tenant_id: currentTenantId, submitted_by: currentUser.id })
      });
      const data = await res.json();
      if (!res.ok) {
        get().setError(data.error || 'Failed to submit for approval');
        return false;
      }
      get().setSuccess('Submitted for approval successfully');
      await get().fetchData();
      return true;
    } catch (e) {
      get().setError('Network error submitting approval.');
      return false;
    }
  },

  approveDrawing: async (approvalId, comments) => {
    const { currentTenantId, currentUser, approvals } = get();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(currentTenantId)) {
      set({
        approvals: approvals.map(a => a.id === approvalId ? {
          ...a,
          status: 'approved',
          comments: comments || a.comments || 'Approved.',
          responded_at: new Date().toISOString()
        } : a)
      });
      get().setSuccess('Drawing approved successfully! 🎉');
      return true;
    }

    try {
      const res = await apiFetch(`/api/approvals/${approvalId}/approve`, {
        method: 'POST',
        headers: {
          'x-tenant-id': currentTenantId,
          'x-user-id': currentUser?.id || 'u1'
        },
        body: JSON.stringify({ comments, tenant_id: currentTenantId, client_id: currentUser?.id || 'u1' })
      });
      const data = await res.json();
      if (!res.ok) {
        get().setError(data.error || 'Failed to approve drawing');
        return false;
      }
      get().setSuccess('Drawing approved successfully! 🎉');
      await get().fetchData();
      return true;
    } catch (e) {
      get().setError('Network error approving drawing.');
      return false;
    }
  },

  rejectDrawing: async (approvalId, comments, isRevisionRequested = false) => {
    const { currentTenantId, currentUser, approvals } = get();
    const newStatus = isRevisionRequested ? 'revision_requested' : 'rejected';
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(currentTenantId)) {
      set({
        approvals: approvals.map(a => a.id === approvalId ? {
          ...a,
          status: newStatus,
          comments: comments || a.comments || (isRevisionRequested ? 'Revision requested.' : 'Rejected.'),
          responded_at: new Date().toISOString()
        } : a)
      });
      get().setSuccess(isRevisionRequested ? 'Revision requested logged.' : 'Drawing rejected logged.');
      return true;
    }

    const endpoint = isRevisionRequested ? `/api/approvals/${approvalId}/revision` : `/api/approvals/${approvalId}/reject`;
    try {
      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: {
          'x-tenant-id': currentTenantId,
          'x-user-id': currentUser?.id || 'u1'
        },
        body: JSON.stringify({
          comments,
          status: newStatus,
          tenant_id: currentTenantId,
          client_id: currentUser?.id || 'u1'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        get().setError(data.error || 'Failed to log feedback');
        return false;
      }
      get().setSuccess(isRevisionRequested ? 'Revision requested logged.' : 'Drawing rejected logged.');
      await get().fetchData();
      return true;
    } catch (e) {
      get().setError('Network error submitting review.');
      return false;
    }
  },

  requestRevision: async (approvalId, comments) => {
    return get().rejectDrawing(approvalId, comments, true);
  },

  // Tasks CRUD
  createTask: async (taskData) => {
    const { currentTenantId, currentUser } = get();
    try {
      const res = await apiFetch('/api/tasks', {
        method: 'POST',
        headers: {
          'x-tenant-id': currentTenantId,
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ ...taskData, tenant_id: currentTenantId, created_by: currentUser.id })
      });
      const data = await res.json();
      if (!res.ok) {
        get().setError(data.error || 'Failed to create task');
        return false;
      }
      get().setSuccess('Task created and assigned');
      await get().fetchData(true); // Background refresh
      return true;
    } catch (e) {
      get().setError('Network error creating task.');
      return false;
    }
  },

  updateTask: async (taskId, updates) => {
    const { currentTenantId, currentUser, tasks } = get();
    // Optimistic update
    const originalTasks = [...tasks];
    set({
      tasks: tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
    });

    try {
      const res = await apiFetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'x-tenant-id': currentTenantId,
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ ...updates, tenant_id: currentTenantId, user_id: currentUser.id })
      });
      const data = await res.json();
      if (!res.ok) {
        set({ tasks: originalTasks }); // Rollback
        get().setError(data.error || 'Failed to update task');
        return false;
      }
      get().setSuccess('Task updated successfully');
      await get().fetchData(true); // Background refresh
      return true;
    } catch (e) {
      set({ tasks: originalTasks }); // Rollback
      get().setError('Network error updating task.');
      return false;
    }
  },

  completeTask: async (taskId) => {
    const { currentTenantId, currentUser, tasks } = get();
    // Optimistic update
    const originalTasks = [...tasks];
    set({
      tasks: tasks.map(t => t.id === taskId ? { ...t, status: 'completed' } : t)
    });

    try {
      const res = await apiFetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: {
          'x-tenant-id': currentTenantId,
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ tenant_id: currentTenantId, user_id: currentUser.id })
      });
      const data = await res.json();
      if (!res.ok) {
        set({ tasks: originalTasks }); // Rollback
        get().setError(data.error || 'Failed to complete task');
        return false;
      }
      get().setSuccess('Task marked as completed');
      await get().fetchData(true); // Background refresh
      return true;
    } catch (e) {
      set({ tasks: originalTasks }); // Rollback
      get().setError('Network error completing task.');
      return false;
    }
  },

  // Site Logs CRUD
  createSiteLog: async (logData) => {
    const { currentTenantId, currentUser } = get();
    try {
      const res = await apiFetch('/api/site-logs', {
        method: 'POST',
        headers: {
          'x-tenant-id': currentTenantId,
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ ...logData, site_status: logData.site_status || 'active', tenant_id: currentTenantId, created_by: currentUser.id })
      });
      const data = await res.json();
      if (!res.ok) {
        get().setError(data.error || 'Failed to create site log');
        return false;
      }
      get().setSuccess('Site log added successfully');
      await get().fetchData();
      return true;
    } catch (e) {
      get().setError('Network error adding site log.');
      return false;
    }
  },

  // Notifications
  markNotificationRead: async (notifId) => {
    try {
      const res = await apiFetch('/api/notifications', {
        method: 'PUT',
        body: JSON.stringify({ id: notifId })
      });
      if (res.ok) {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notifId ? { ...n, is_read: true } : n
          )
        }));
      }
    } catch (e) {
      console.error(e);
    }
  },

  // Admin: Invite a new user
  inviteUser: async (name, email, role) => {
    set({ loading: true });
    try {
      const headers = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('keystone_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/users', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, email, role })
      });
      const data = await res.json();
      if (!res.ok) {
        get().setError(data.error || 'Failed to invite user');
        set({ loading: false });
        return false;
      }
      get().setSuccess(`Invitation sent successfully to ${email}`);
      await get().fetchData();
      return true;
    } catch (e) {
      get().setError('Network error inviting user.');
      set({ loading: false });
      return false;
    }
  },

  // Admin: Update a user's role, name, or status
  updateUserById: async (userId, updates) => {
    try {
      const res = await apiFetch(`/api/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (!res.ok) {
        get().setError(data.error || 'Failed to update user');
        return false;
      }
      get().setSuccess('User updated successfully');
      // Optimistic local update so the list refreshes without a full re-fetch
      set(state => ({ users: state.users.map(u => u.id === userId ? { ...u, ...updates } : u) }));
      get().fetchData();
      return true;
    } catch (e) {
      get().setError('Network error updating user.');
      return false;
    }
  },

  // Admin: Soft-disable a user (blocks login, sets status=disabled)
  disableUser: async (userId) => {
    try {
      const res = await apiFetch(`/api/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        get().setError(data.error || 'Failed to disable user');
        return false;
      }
      get().setSuccess('User disabled successfully');
      set(state => ({ users: state.users.map(u => u.id === userId ? { ...u, status: 'disabled' } : u) }));
      get().fetchData();
      return true;
    } catch (e) {
      get().setError('Network error disabling user.');
      return false;
    }
  },

  // Admin: Persist company settings (name, logo, address, contact email)
  updateCompanySettings: async (settings) => {
    try {
      const res = await apiFetch('/api/company', {
        method: 'PATCH',
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (!res.ok) {
        get().setError(data.error || 'Failed to save settings');
        return false;
      }
      // Update local tenant details in state
      if (data.tenant) {
        set({ currentTenant: data.tenant });
      }
      if (settings.name) {
        set(state => ({
          currentUser: state.currentUser ? { ...state.currentUser, company_name: settings.name } : state.currentUser
        }));
      }
      get().setSuccess('Company settings saved successfully');
      return true;
    } catch (e) {
      get().setError('Network error saving settings.');
      return false;
    }
  },

  // Project Members & Timeline actions
  fetchProjectMembers: async (projectId) => {
    try {
      const res = await apiFetch(`/api/projects/${projectId}/members`);
      const data = await res.json();
      if (res.ok) {
        set((state) => ({
          projectMembers: {
            ...state.projectMembers,
            [projectId]: data.members || []
          }
        }));
      }
    } catch (e) {
      console.error('fetchProjectMembers error:', e);
    }
  },

  addProjectMember: async (projectId, userId, role) => {
    try {
      const res = await apiFetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, role })
      });
      const data = await res.json();
      if (!res.ok) {
        get().setError(data.error || 'Failed to add project member');
        return false;
      }
      get().setSuccess('Project member added successfully');
      await get().fetchProjectMembers(projectId);
      return true;
    } catch (e) {
      get().setError('Network error adding project member.');
      return false;
    }
  },

  removeProjectMember: async (projectId, userId) => {
    try {
      const res = await apiFetch(`/api/projects/${projectId}/members?userId=${userId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        get().setError(data.error || 'Failed to remove project member');
        return false;
      }
      get().setSuccess('Project member removed successfully');
      await get().fetchProjectMembers(projectId);
      return true;
    } catch (e) {
      get().setError('Network error removing project member.');
      return false;
    }
  },

  fetchProjectTimeline: async (projectId) => {
    try {
      const res = await apiFetch(`/api/activity-logs?projectId=${projectId}`);
      const data = await res.json();
      if (res.ok) {
        set((state) => ({
          projectTimeline: {
            ...state.projectTimeline,
            [projectId]: data.activityLogs || []
          }
        }));
      }
    } catch (e) {
      console.error('fetchProjectTimeline error:', e);
    }
  },

  openProjectDetail: async (projectId) => {
    set({ selectedProjectId: projectId, activeTab: 'project-detail' });
    await Promise.all([
      get().fetchProjectMembers(projectId),
      get().fetchProjectTimeline(projectId)
    ]);
  },

  // Navigation Routing Helpers
  setTab: (tab) => set({ activeTab: tab }),
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  setSelectedDrawingId: (id) => set({ selectedDrawingId: id }),
  setSelectedApprovalId: (id) => set({ selectedApprovalId: id }),
  setDrawingSort: (sort) => set({ drawingSort: sort })
}));
