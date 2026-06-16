import { create } from 'zustand';

export const useStore = create((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
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
  currentTenantId: 't1',
  activeTab: 'login', // Default start page is login
  selectedProjectId: null,
  selectedDrawingId: null,
  selectedApprovalId: null,
  loading: false,
  error: null,
  successMessage: null,

  // Helper to trigger success toast
  setSuccess: (msg) => {
    set({ successMessage: msg });
    setTimeout(() => set({ successMessage: null }), 4000);
  },

  // Helper to trigger error toast
  setError: (msg) => {
    set({ error: msg });
    setTimeout(() => set({ error: null }), 4000);
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

      // 1. Projects
      const resProj = await fetch(`/api/projects?tenantId=${currentTenantId}`, { headers });
      const dataProj = await resProj.json();

      // 2. Drawings
      const resDraw = await fetch(`/api/drawings?tenantId=${currentTenantId}`, { headers });
      const dataDraw = await resDraw.json();

      // 3. Approvals
      const resAppr = await fetch(`/api/approvals?tenantId=${currentTenantId}`, { headers });
      const dataAppr = await resAppr.json();

      // 4. Tasks
      const resTasks = await fetch(`/api/tasks?tenantId=${currentTenantId}`, { headers });
      const dataTasks = await resTasks.json();

      // 5. Site Logs
      const resLogs = await fetch(`/api/site-logs?tenantId=${currentTenantId}`, { headers });
      const dataLogs = await resLogs.json();

      // 6. Notifications
      const resNotif = await fetch(`/api/notifications?tenantId=${currentTenantId}&userId=${currentUser.id}`, { headers });
      const dataNotif = await resNotif.json();

      // 7. Activity Logs
      const resAct = await fetch(`/api/activity-logs?tenantId=${currentTenantId}`, { headers });
      const dataAct = await resAct.json();

      // 8. Users
      const resUsers = await fetch(`/api/users?tenantId=${currentTenantId}`, { headers });
      const dataUsers = await resUsers.json();

      set({
        projects: dataProj.projects || [],
        drawings: dataDraw.drawings || [],
        approvals: dataAppr.approvals || [],
        tasks: dataTasks.tasks || [],
        siteLogs: dataLogs.siteLogs || [],
        notifications: dataNotif.notifications || [],
        activityLogs: dataAct.activityLogs || [],
        users: dataUsers.users || [],
        loading: false
      });
    } catch (e) {
      console.error(e);
      set({ error: 'Failed to load workspace data.', loading: false });
    }
  },

  // Auth Actions
  signup: async (name, email, companyName, password) => {
    // Client-side password strength check (mirrors server validation)
    const pwErrors = [];
    if (password.length < 8) pwErrors.push('at least 8 characters');
    if (!/[A-Z]/.test(password)) pwErrors.push('an uppercase letter');
    if (!/[a-z]/.test(password)) pwErrors.push('a lowercase letter');
    if (!/[0-9]/.test(password)) pwErrors.push('a number');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) pwErrors.push('a special character');
    
    if (pwErrors.length > 0) {
      set({ error: `Password must contain ${pwErrors.join(', ')}.` });
      return null;
    }

    set({ loading: true });
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, companyName, password })
      });
      const data = await res.json();
      if (!res.ok) {
        set({ error: data.error || 'Signup failed', loading: false });
        return null;
      }
      set({ loading: false });
      get().setSuccess('Verification OTP sent! Check your email.');
      return data;
    } catch (e) {
      set({ error: 'Server connection failed.', loading: false });
      return null;
    }
  },

  verify: async (email, code) => {
    set({ loading: true });
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      if (!res.ok) {
        set({ error: data.error || 'Verification failed', loading: false });
        return false;
      }
      set({
        currentUser: data.user,
        isAuthenticated: true,
        currentTenantId: data.user.tenant_id,
        activeTab: 'dashboard',
        loading: false
      });
      get().setSuccess('Email verified! Account activated.');
      await get().fetchData();
      return true;
    } catch (e) {
      set({ error: 'Server connection failed.', loading: false });
      return false;
    }
  },

  resendOtp: async (email) => {
    try {
      const res = await fetch('/api/auth/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        get().setError(data.error || 'Failed to resend code');
        return false;
      }
      get().setSuccess(data.message || 'Verification code resent');
      return true;
    } catch (e) {
      get().setError('Server connection failed.');
      return false;
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        set({ error: data.error || 'Login failed', loading: false });
        return false;
      }
      set({
        currentUser: data.user,
        isAuthenticated: true,
        currentTenantId: data.user.tenant_id,
        activeTab: 'dashboard',
        loading: false
      });
      get().setSuccess(`Logged in as ${data.user.name}`);
      await get().fetchData();
      return true;
    } catch (e) {
      set({ error: 'Server connection failed.', loading: false });
      return false;
    }
  },

  logout: async () => {
    const { currentUser, currentTenantId } = get();
    if (currentUser) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, tenantId: currentTenantId })
      });
    }
    set({
      currentUser: null,
      isAuthenticated: false,
      activeTab: 'login',
      projects: [],
      drawings: [],
      approvals: [],
      tasks: [],
      siteLogs: [],
      notifications: [],
      activityLogs: []
    });
  },

  // Reset password
  resetPassword: async (email) => {
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        get().setError(data.error || 'Failed to send reset link');
        return false;
      }
      get().setSuccess(data.message);
      return true;
    } catch (e) {
      get().setError('Server connection failed.');
      return false;
    }
  },

  // Projects CRUD
  createProject: async (projectData) => {
    const { currentTenantId, currentUser } = get();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(currentTenantId)) {
      get().setError('Sign up and log in with a real account to create projects. Quick Login is for UI preview only.');
      return false;
    }
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      return true;
    } catch (e) {
      get().setError('Network error creating project.');
      return false;
    }
  },

  updateProject: async (id, updates) => {
    const { currentTenantId, currentUser } = get();
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
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
      const res = await fetch(`/api/projects/${id}`, {
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
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(currentTenantId)) {
      get().setError('Sign up and log in with a real account to upload drawings. UI Preview is read-only.');
      return false;
    }
    try {
      const res = await fetch('/api/drawings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

  createDrawingRevision: async (drawingId, file_url, notes) => {
    const { currentTenantId, currentUser } = get();
    try {
      const res = await fetch(`/api/drawings/${drawingId}/revision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': currentTenantId,
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ file_url, notes, tenant_id: currentTenantId, uploaded_by: currentUser.id })
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
      const res = await fetch(`/api/drawings/${drawingId}/revision?tenantId=${currentTenantId}`);
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
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      const res = await fetch(`/api/approvals/${approvalId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      const res = await fetch(`/api/approvals/${approvalId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
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
      const res = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      const res = await fetch('/api/site-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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

  // Admin: Invite a new user (creates Supabase Auth account + DB profile + sends invite email)
  inviteUser: async (name, email, role) => {
    const { currentTenantId, currentUser } = get();
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, tenantId: currentTenantId, adminId: currentUser.id })
      });
      const data = await res.json();
      if (!res.ok) {
        get().setError(data.error || 'Failed to invite user');
        return false;
      }
      get().setSuccess(`Invitation sent to ${email}`);
      await get().fetchData();
      return true;
    } catch (e) {
      get().setError('Network error inviting user.');
      return false;
    }
  },

  // Admin: Update a user's role or status
  updateUserById: async (userId, updates) => {
    const { currentTenantId, currentUser } = get();
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tenantId: currentTenantId, adminId: currentUser.id, updates })
      });
      const data = await res.json();
      if (!res.ok) {
        get().setError(data.error || 'Failed to update user');
        return false;
      }
      get().setSuccess('User updated successfully');
      await get().fetchData();
      return true;
    } catch (e) {
      get().setError('Network error updating user.');
      return false;
    }
  },

  // Navigation Routing Helpers
  setTab: (tab) => set({ activeTab: tab }),
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  setSelectedDrawingId: (id) => set({ selectedDrawingId: id }),
  setSelectedApprovalId: (id) => set({ selectedApprovalId: id })
}));
