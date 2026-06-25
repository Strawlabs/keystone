# Setup Instructions: Supabase & Resend Configuration

This guide helps you set up the backend database tables, Row Level Security (RLS) policies, storage buckets, and SMTP settings in your **Supabase** and **Resend** accounts to run **Keystone** in a live/production environment.

---

## 1. Environment Variables Configuration

Copy `.env.example` to a new `.env.local` file at the root of the project:

```bash
cp .env.example .env.local
```

Fill in the following values in your `.env.local` file:

```env
# Supabase Keys (from Project Settings -> API)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Resend Email Keys (from Resend Dashboard)
RESEND_API_KEY=re_your_resend_api_key
SENDER_EMAIL=onboarding@resend.dev # Or your custom domain sender email

# Application Settings
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 2. Supabase Database Configuration

1. Log into your [Supabase Dashboard](https://supabase.com/).
2. Select your project, and navigate to the **SQL Editor** tab from the sidebar.
3. Open a **New Query**, copy the entire contents of the `supabase_schema.sql` file present in the project root, and paste it into the editor.
4. Click **Run**. This will create the required tables:
   - `tenants` (Multi-tenant firm profiles)
   - `users` (User records connected to Supabase Auth)
   - `projects` & `project_members`
   - `drawings` & `drawing_versions` (Revisions history)
   - `approvals` (Client review statuses)
   - `tasks` & `site_logs` & `site_log_photos` (Site execution logs)
   - `notifications` & `activity_logs` (Audit logging engine)
5. It will also initialize the helper function `current_user_tenant_id()` and activate Row Level Security (RLS) policies on all tables to keep data between firms strictly isolated.

---

## 3. Supabase Storage Configuration

To allow architects and team members to upload blueprints, drawings, and site log images:

1. In the Supabase sidebar, click on **Storage**.
2. Click **New Bucket** and name it exactly: `keystone-assets`.
3. Set the bucket to **Public** (so anyone with the URL can view files like drawings).
4. Go to **Policies** in the Storage section to set up upload permissions:
   - Click **New Policy** -> **Create a policy from scratch**.
   - **Allowed Operations**: Check `INSERT`, `SELECT`, `UPDATE` and `DELETE`.
   - **Target Bucket**: Select `keystone-assets`.
   - **Policy Definition**: Use standard authenticated user allowance `auth.role() = 'authenticated'` or allow all public uploads if testing locally.
5. Save the policy.

---

## 4. Resend Integration & Verification SMTP Setup

To enable automated approval requests and notification emails:

1. Create a free account at [Resend](https://resend.com).
2. Go to the **API Keys** section and click **Create API Key** (ensure it has full sending permissions).
3. Copy the key and insert it as `RESEND_API_KEY` in your `.env.local`.
4. If you have a custom domain, add it under **Domains** in Resend and configure the DNS settings. If testing locally, you can use `onboarding@resend.dev` as the `SENDER_EMAIL` to email your registered email address.

---

## 5. Running the Application

After configuring your environment variables and database, install the packages and run the development server:

```bash
# Install dependencies
npm install

# Run the project locally
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to test the Keystone portal. You can use the **Developer Quick Login** options on the login screen to switch user roles and verify the layout views.
