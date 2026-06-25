import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Detect placeholder or missing values and print a helpful startup message
const isPlaceholder = (val) =>
  !val ||
  val.includes('YOUR_') ||
  val.includes('placeholder') ||
  val === 'your_supabase_project_url' ||
  val === 'your_supabase_anon_key' ||
  val === 'your_supabase_service_role_key';

if (isPlaceholder(supabaseUrl) || isPlaceholder(supabaseServiceKey)) {
  console.error(
    '\n╔══════════════════════════════════════════════════════════════╗\n' +
    '║  ❌  SUPABASE NOT CONFIGURED — App cannot connect to DB    ║\n' +
    '╠══════════════════════════════════════════════════════════════╣\n' +
    '║  Edit .env.local and fill in your real Supabase credentials:║\n' +
    '║                                                              ║\n' +
    '║  NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co          ║\n' +
    '║  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...                       ║\n' +
    '║  SUPABASE_SERVICE_ROLE_KEY=eyJ...                           ║\n' +
    '║                                                              ║\n' +
    '║  Find these at: Supabase Dashboard → Project Settings → API ║\n' +
    '╚══════════════════════════════════════════════════════════════╝\n'
  );
}

const resolvedUrl = supabaseUrl || 'https://placeholder-project.supabase.co';
const resolvedServiceKey = supabaseServiceKey || 'placeholder-key';

// Service-role client — used for DB operations (bypasses RLS)
export const supabase = createClient(resolvedUrl, resolvedServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Anon-key client — used for Auth operations (signIn, signUp, verifyOtp)
// Supabase Auth endpoints require the anon key, not the service role key
export const supabaseAuth = createClient(
  resolvedUrl,
  supabaseAnonKey || resolvedServiceKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

export const db = {
  // ---- TENANTS ----
  async getTenants() {
    const { data, error } = await supabase.from('tenants').select('*');
    if (error) throw error;
    return data;
  },

  async getTenant(id) {
    const { data, error } = await supabase.from('tenants').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async createTenant(tenantData) {
    const { data, error } = await supabase.from('tenants').insert([tenantData]).select().single();
    if (error) throw error;
    return data;
  },

  // ---- USERS ----
  async getUsers(tenantId) {
    const { data, error } = await supabase.from('users').select('*').eq('tenant_id', tenantId);
    if (error) throw error;
    return data;
  },

  async getUser(id) {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
  },

  async getUserByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getUserByEmailAndTenant(email, tenantId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('tenant_id', tenantId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async createUser(userData) {
    const { data, error } = await supabase.from('users').insert([userData]).select().single();
    if (error) throw error;
    return data;
  },

  async updateUser(id, updates) {
    const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  // ---- PROJECTS ----
  async getProjects(tenantId) {
    const { data, error } = await supabase.from('projects').select('*').eq('tenant_id', tenantId);
    if (error) throw error;
    return data;
  },

  async getProject(id) {
    const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async createProject(projectData) {
    const { data, error } = await supabase.from('projects').insert([projectData]).select().single();
    if (error) {
      if (error.code === 'PGRST204' && error.message.includes('client_email')) {
        const { client_email, ...fallbackData } = projectData;
        const { data: retryData, error: retryError } = await supabase.from('projects').insert([fallbackData]).select().single();
        if (retryError) throw retryError;
        return retryData;
      }
      throw error;
    }
    return data;
  },

  async updateProject(id, updates) {
    const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select().single();
    if (error) {
      if (error.code === 'PGRST204' && error.message.includes('client_email')) {
        const { client_email, ...fallbackUpdates } = updates;
        const { data: retryData, error: retryError } = await supabase.from('projects').update(fallbackUpdates).eq('id', id).select().single();
        if (retryError) throw retryError;
        return retryData;
      }
      throw error;
    }
    return data;
  },

  async deleteProject(id) {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // ---- DRAWINGS & REVISIONS ----
  async getDrawings(tenantId, projectId = null) {
    let query = supabase.from('drawings').select('*').eq('tenant_id', tenantId);
    if (projectId) query = query.eq('project_id', projectId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getDrawing(id) {
    const { data, error } = await supabase.from('drawings').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async createDrawing(drawingData, initialRevisionNotes = 'Initial version.') {
    const { data, error } = await supabase.from('drawings').insert([drawingData]).select().single();
    if (error) throw error;

    // Create initial drawing version record
    const { error: verError } = await supabase.from('drawing_versions').insert([{
      drawing_id: data.id,
      revision_number: 1,
      revision_notes: initialRevisionNotes,
      file_url: data.file_url,
      uploaded_by: data.uploaded_by
    }]);
    if (verError) throw verError;

    return data;
  },

  async createDrawingRevision(drawingId, revisionData) {
    const { data: drawing, error: drawingError } = await supabase
      .from('drawings')
      .select('*')
      .eq('id', drawingId)
      .single();
    if (drawingError) throw drawingError;

    const nextRev = drawing.current_revision + 1;

    // Insert new version record
    const { data: version, error: verError } = await supabase
      .from('drawing_versions')
      .insert([{
        drawing_id: drawingId,
        revision_number: nextRev,
        revision_notes: revisionData.notes,
        file_url: revisionData.file_url,
        uploaded_by: revisionData.uploaded_by
      }])
      .select()
      .single();
    if (verError) throw verError;

    // Update drawing's current revision pointer
    const { data: updatedDrawing, error: updError } = await supabase
      .from('drawings')
      .update({ current_revision: nextRev, file_url: revisionData.file_url })
      .eq('id', drawingId)
      .select()
      .single();
    if (updError) throw updError;

    return { drawing: updatedDrawing, version };
  },

  async getDrawingVersions(drawingId) {
    const { data, error } = await supabase
      .from('drawing_versions')
      .select('*')
      .eq('drawing_id', drawingId)
      .order('revision_number', { ascending: false });
    if (error) throw error;
    return data;
  },

  // ---- APPROVALS ----
  async getApprovals(tenantId) {
    const { data, error } = await supabase
      .from('approvals')
      .select('*, drawings!inner(*)')
      .eq('drawings.tenant_id', tenantId);
    if (error) throw error;
    return data;
  },

  async getApproval(id) {
    const { data, error } = await supabase.from('approvals').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async createApproval(approvalData) {
    const { data, error } = await supabase.from('approvals').insert([approvalData]).select().single();
    if (error) throw error;
    return data;
  },

  async updateApprovalStatus(id, status, comments) {
    const updates = {
      status,
      comments,
      responded_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from('approvals').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  // ---- TASKS ----
  async getTasks(tenantId, projectId = null) {
    let query = supabase.from('tasks').select('*').eq('tenant_id', tenantId);
    if (projectId) query = query.eq('project_id', projectId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async createTask(taskData) {
    const { data, error } = await supabase.from('tasks').insert([taskData]).select().single();
    if (error) throw error;
    return data;
  },

  async updateTask(id, updates) {
    const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  // ---- SITE LOGS ----
  async getSiteLogs(tenantId, projectId = null) {
    let query = supabase.from('site_logs').select('*, site_log_photos(*)').eq('tenant_id', tenantId);
    if (projectId) query = query.eq('project_id', projectId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async createSiteLog(logData, photoUrls = []) {
    const { data: log, error: logError } = await supabase.from('site_logs').insert([logData]).select().single();
    if (logError) throw logError;

    if (photoUrls.length > 0) {
      const photoInserts = photoUrls.map(url => ({ site_log_id: log.id, image_url: url }));
      const { error: photoError } = await supabase.from('site_log_photos').insert(photoInserts);
      if (photoError) throw photoError;
    }
    return log;
  },

  // ---- NOTIFICATIONS ----
  async getNotifications(tenantId, userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createNotification(notifData) {
    const { data, error } = await supabase.from('notifications').insert([notifData]).select().single();
    if (error) throw error;
    return data;
  },

  async markNotificationRead(id) {
    const { data, error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  // ---- ACTIVITY LOGS ----
  async getActivityLogs(tenantId) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createActivityLog(logData) {
    const { data, error } = await supabase.from('activity_logs').insert([logData]).select().single();
    if (error) throw error;
    return data;
  }
};
