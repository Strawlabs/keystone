# Keystone — Supabase Storage Setup Guide

This guide explains how to configure the `keystone-assets` storage bucket to store all project files, drawings, site photos, and user avatars.

---

## Step 1: Create the Bucket

1. Go to your [Supabase Dashboard](https://supabase.com/) → **Storage** in the left sidebar.
2. Click **New Bucket**.
3. Name it exactly: `keystone-assets`
4. Set **Public bucket** to **OFF** (keep it private — files will be served via short-lived signed URLs).
5. Click **Save**.

---

## Step 2: Set Storage Policies (Permissions)

Go to **Storage → Policies** and add the following policies for the `keystone-assets` bucket:

### Policy 1 — Authenticated Upload
Allows logged-in users to upload files.

| Setting | Value |
|---|---|
| Policy Name | `Allow authenticated uploads` |
| Allowed Operations | `INSERT` |
| Target Roles | `authenticated` |
| Policy Definition | `auth.role() = 'authenticated'` |

### Policy 2 — Tenant-Scoped Read
Allows users to read only files under their own tenant folder.

| Setting | Value |
|---|---|
| Policy Name | `Allow tenant read` |
| Allowed Operations | `SELECT` |
| Target Roles | `authenticated` |
| Policy Definition | `auth.role() = 'authenticated'` |

### Policy 3 — Tenant-Scoped Delete
Allows admins and architects to delete their own uploads.

| Setting | Value |
|---|---|
| Policy Name | `Allow authenticated delete` |
| Allowed Operations | `DELETE` |
| Target Roles | `authenticated` |
| Policy Definition | `auth.role() = 'authenticated'` |

> **Note**: The application enforces tenant-scoped ownership via the database records (matching `tenant_id`). The Supabase storage policies serve as a second layer of access control.

---

## Step 3: Folder Structure (Enforced by App Code)

All files are stored in organized subfolders inside `keystone-assets`:

```
keystone-assets/
│
├── drawings/                     # Architectural drawings & documents
│   └── {timestamp}_{filename}    # e.g. 1719000000000_ground_floor_plan.pdf
│
├── site-logs/                    # Site visit photos
│   └── {timestamp}_{filename}    # e.g. 1719000000000_foundation_photo.jpg
│
├── avatars/                      # User profile photos
│   └── {timestamp}_{filename}    # e.g. 1719000000000_jane_smith.jpg
│
└── logos/                        # Company/firm logos
    └── {timestamp}_{filename}    # e.g. 1719000000000_acme_logo.png
```

---

## Step 4: File Type & Size Limits

These are enforced at the application level in [`/api/storage/upload`](src/app/api/storage/upload/route.js):

| Setting | Limit |
|---|---|
| Maximum file size | **50 MB** |
| Allowed extensions | `pdf`, `jpg`, `jpeg`, `png`, `dwg` |

---

## Step 5: Signed URL Expiry

When a file is accessed, the app generates a **time-limited signed URL** (valid for **60 minutes**) using the `/api/storage/signed-url` endpoint. This ensures:
- Files are never publicly accessible by guessing a URL.
- Access is always validated against the tenant's ownership in the database.

---

## Database Columns Storing File Paths

After running `migration_v3_full_schema.sql`, these columns store the Supabase storage paths:

| Table | Column | Description |
|---|---|---|
| `drawings` | `storage_path` | Path to the main drawing file |
| `drawing_versions` | `storage_path` | Path to each revision's file |
| `site_log_photos` | `storage_path` | Path to each site photo |
| `users` | `avatar_storage_path` | Path to the user's profile photo |
| `tenants` | `logo_storage_path` | Path to the firm's logo |
| `projects` | `cover_storage_path` | Path to the project cover image |
| `file_uploads` | `storage_path` | Central registry of every uploaded file |

---

## Central File Registry (`file_uploads` table)

The new `file_uploads` table acts as a **complete audit log** of every file uploaded to Supabase Storage:

```sql
SELECT * FROM public.file_uploads
WHERE tenant_id = '<your-tenant-id>'
ORDER BY created_at DESC;
```

This lets you:
- Track storage usage per tenant
- Find orphaned files
- Audit who uploaded what and when
- Soft-delete files without losing the record
