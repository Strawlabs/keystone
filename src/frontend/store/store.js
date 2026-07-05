import { create } from 'zustand';

// Zero-dependency API fetch wrapper to automatically attach Bearer JWT token
const apiFetch = async (url, options = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('keystone_token') : null;
  const headers = {
    'Content-Type': 'application/json',
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
      if (store.isAuthenticated) {
        store.logout();
        store.setError(res.status === 403 ? 'Your account has been deactivated or disabled.' : 'Session expired or unauthorized. Please log in again.');
      }
    }
  }
  return res;
};

export const useStore = create((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  token: typeof window !== 'undefined' ? localStorage.getItem('keystone_token') : null,
  resetToken: null,
  projects: [],
  drawings: [],
  drawingVersions: {}, // map drawing_id -> versions
  approvals: [],
  tasks: [],
  siteLogs: [],
  notifications: [],
  activityLogs: [],
  users: [],
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
  fetchData: async () => {
    const { currentTenantId, currentUser } = get();
    if (!currentUser) return;

    // Guard: if tenantId is a dev mock value (not a real UUID), skip DB calls
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(currentTenantId)) {
      console.info('[Dev Mode] Skipping DB fetch — mock tenant ID detected:', currentTenantId);
      set({ loading: false });
      return;
    }

    set({ loading: true });
    try {
      const headers = {
        'x-tenant-id': currentTenantId,
        'x-user-id': currentUser.id
      };

      // Fetch all raw data in parallel for high-performance load balancing
      const [resProj, resDraw, resAppr, resTasks, resLogs, resNotif, resAct, resUsers, resTenant] = await Promise.all([
        apiFetch(`/api/projects?tenantId=${currentTenantId}`, { headers }),
        apiFetch(`/api/drawings?tenantId=${currentTenantId}`, { headers }),
        apiFetch(`/api/approvals?tenantId=${currentTenantId}`, { headers }),
        apiFetch(`/api/tasks?tenantId=${currentTenantId}`, { headers }),
        apiFetch(`/api/site-logs?tenantId=${currentTenantId}`, { headers }),
        apiFetch(`/api/notifications?tenantId=${currentTenantId}&userId=${currentUser.id}`, { headers }),
        apiFetch(`/api/activity-logs?tenantId=${currentTenantId}`, { headers }),
        apiFetch(`/api/users?tenantId=${currentTenantId}`, { headers }),
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
        projects: dataProj.projects || [],
        drawings: dataDraw.drawings || [],
        approvals: dataAppr.approvals || [],
        tasks: dataTasks.tasks || [],
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
      set({ loading: false });
      get().setSuccess('If the account exists, a password reset link has been sent to your email.');
      return true;
    } catch (e) {
      get().setError('Server connection failed.');
      set({ loading: false });
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
  submitApproval: async (approvalData) => {
    const { currentTenantId, currentUser } = get();
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
    const { currentTenantId, currentUser } = get();
    try {
      const res = await apiFetch(`/api/approvals/${approvalId}/approve`, {
        method: 'POST',
        headers: {
          'x-tenant-id': currentTenantId,
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ comments, tenant_id: currentTenantId, client_id: currentUser.id })
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

  rejectDrawing: async (approvalId, comments, isRevisionRequested = true) => {
    const { currentTenantId, currentUser } = get();
    try {
      const res = await apiFetch(`/api/approvals/${approvalId}/reject`, {
        method: 'POST',
        headers: {
          'x-tenant-id': currentTenantId,
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          comments,
          status: isRevisionRequested ? 'revision_requested' : 'rejected',
          tenant_id: currentTenantId,
          client_id: currentUser.id
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
      await get().fetchData();
      return true;
    } catch (e) {
      get().setError('Network error creating task.');
      return false;
    }
  },

  updateTask: async (taskId, updates) => {
    const { currentTenantId, currentUser } = get();
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
        get().setError(data.error || 'Failed to update task');
        return false;
      }
      get().setSuccess('Task updated successfully');
      await get().fetchData();
      return true;
    } catch (e) {
      get().setError('Network error updating task.');
      return false;
    }
  },

  completeTask: async (taskId) => {
    const { currentTenantId, currentUser } = get();
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
        get().setError(data.error || 'Failed to complete task');
        return false;
      }
      get().setSuccess('Task marked as completed');
      await get().fetchData();
      return true;
    } catch (e) {
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

  // Navigation Routing Helpers
  setTab: (tab) => set({ activeTab: tab }),
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  setSelectedDrawingId: (id) => set({ selectedDrawingId: id }),
  setSelectedApprovalId: (id) => set({ selectedApprovalId: id }),
  setDrawingSort: (sort) => set({ drawingSort: sort })
}));
