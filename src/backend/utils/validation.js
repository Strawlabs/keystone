import { z } from 'zod';

// Company registration (tenant signup)
export const registerCompanySchema = z.object({
  company_name: z.string().min(1, 'Company Name is required.'),
  company_email: z.string().email('Invalid Company Email.'),
  admin_email: z.string().email('Invalid Admin Email.'),
  company_address: z.string().min(1, 'Company Address is required.'),
  company_number: z.string().min(1, 'Company Number is required.')
});

// Admin invite user
export const inviteUserSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  role: z.enum(['architect', 'staff', 'client'], {
    errorMap: () => ({ message: 'Role must be architect, staff, or client.' })
  }),
  tenantId: z.string().uuid('Invalid tenant ID.'),
  adminId: z.string().uuid('Invalid admin ID.')
});

// Create project
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project Name is required.'),
  code: z.string().min(2, 'Project Code must be at least 2 characters.').toUpperCase(),
  client_name: z.string().min(1, 'Client Name is required.'),
  client_email: z.string().email('Invalid client email.').optional().or(z.literal('')),
  location: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).default('planning'),
  start_date: z.string().optional().or(z.null()),
  end_date: z.string().optional().or(z.null())
});

// Update project
export const updateProjectSchema = createProjectSchema.partial();

// Create task
export const createTaskSchema = z.object({
  project_id: z.string().uuid('Invalid Project ID.'),
  title: z.string().min(1, 'Task title is required.'),
  description: z.string().optional(),
  assigned_to: z.string().uuid('Invalid assigned user.').optional().or(z.literal('')),
  priority: z.enum(['low', 'medium', 'high']),
  due_date: z.string().optional().or(z.null())
});

// Update task
export const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(['pending', 'in_progress', 'completed', 'delayed']).optional()
});

// Create site log
export const createSiteLogSchema = z.object({
  project_id: z.string().uuid('Invalid Project ID.'),
  notes: z.string().min(1, 'Site log notes are required.'),
  site_status: z.string().optional()
});

// Create drawing
export const createDrawingSchema = z.object({
  project_id: z.string().uuid('Invalid Project ID.'),
  name: z.string().min(1, 'Drawing Name is required.'),
  drawing_number: z.string().optional(),
  category: z.enum([
    'architectural', 'structural', 'interior', 'electrical',
    'plumbing', 'elevation', 'miscellaneous',
    'site_photos', 'project_documents'
  ], { errorMap: () => ({ message: 'Invalid drawing category.' }) }),
  file_url: z.string().min(1, 'File URL is required.'),
  storage_path: z.string().optional()
});

// Update drawing metadata
export const updateDrawingSchema = z.object({
  name: z.string().min(1, 'Drawing Name is required.').optional(),
  drawing_number: z.string().optional(),
  category: z.enum([
    'architectural', 'structural', 'interior', 'electrical',
    'plumbing', 'elevation', 'miscellaneous',
    'site_photos', 'project_documents'
  ]).optional()
});

// Create drawing revision
export const createDrawingRevisionSchema = z.object({
  file_url: z.string().min(1, 'File URL is required.'),
  storage_path: z.string().optional(),
  notes: z.string().min(1, 'Revision notes are required.')
});

// Get signed URL
export const getSignedUrlSchema = z.object({
  storagePath: z.string().min(1, 'Storage path is required.')
});

// Create approval request
export const createApprovalSchema = z.object({
  drawing_id: z.string().uuid('Invalid Drawing ID.'),
  client_id: z.string().uuid('Invalid Client ID.'),
  comments: z.string().optional(),
  submission_notes: z.string().optional(),
  due_date: z.string().optional().or(z.null())
});
