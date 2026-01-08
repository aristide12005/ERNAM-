/*
 * OFFICIAL ERNAM DIGITAL TWIN - SOURCE OF TRUTH SCHEMA
 * Generated: 2026-01-08
 *
 * OFFICIAL TABLE LIST:
 * 1.  applications
 * 2.  assessments
 * 3.  audit_logs
 * 4.  certificates
 * 5.  compliance_logs
 * 6.  documents
 * 7.  messages
 * 8.  notifications
 * 9.  organization_admins
 * 10. organizations
 * 11. planned_activities
 * 12. session_instructors
 * 13. session_participants
 * 14. session_roster
 * 15. sessions (Merged with training_sessions)
 * 16. settings
 * 17. training_requests
 * 18. training_standards
 * 19. users
 */

-- ==============================================================================
-- 1. USERS & AUTHENTICATION
-- ==============================================================================

CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  full_name text NOT NULL,
  -- STRICT ROLE MAPPING:
  -- "Trainee"  -> 'participant'
  -- "Trainer"  -> 'instructor'
  -- "Director" -> 'ernam_admin'
  -- (Plus system roles: 'org_admin', 'maintainer', 'developer')
  role text NOT NULL CHECK (role = ANY (ARRAY['participant'::text, 'instructor'::text, 'org_admin'::text, 'ernam_admin'::text, 'maintainer'::text, 'developer'::text])),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'suspended'::text])),
  organization_id uuid, -- Constraints added later to allow circular dependencies if needed, usually references organizations(id)
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- ==============================================================================
-- 2. ORGANIZATIONS
-- ==============================================================================

CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text CHECK (type = ANY (ARRAY['airport'::text, 'airline'::text, 'government'::text, 'security_company'::text, 'other'::text])),
  country text,
  contact_email text,
  contact_phone text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  created_at timestamp with time zone DEFAULT now(),
  approved_at timestamp with time zone,
  approved_by uuid,
  CONSTRAINT organizations_pkey PRIMARY KEY (id),
  CONSTRAINT organizations_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id)
);

-- Add Foreign Key for users.organization_id now that organizations table exists
ALTER TABLE public.users ADD CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);

CREATE TABLE public.organization_admins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  CONSTRAINT organization_admins_pkey PRIMARY KEY (id),
  CONSTRAINT organization_admins_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT organization_admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- ==============================================================================
-- 3. APPLICATIONS
-- ==============================================================================

CREATE TABLE public.applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_type text NOT NULL CHECK (application_type = ANY (ARRAY['organization'::text, 'instructor'::text])),
  applicant_user_id uuid,
  organization_name text,
  details jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  reviewed_by uuid,
  review_notes text,
  created_at timestamp with time zone DEFAULT now(),
  applicant_name text,
  applicant_email text,
  applicant_phone text,
  organization_country text,
  CONSTRAINT applications_pkey PRIMARY KEY (id),
  CONSTRAINT applications_applicant_user_id_fkey FOREIGN KEY (applicant_user_id) REFERENCES public.users(id),
  CONSTRAINT applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id)
);

-- ==============================================================================
-- 4. TRAINING STANDARDS (CURRICULUM)
-- ==============================================================================

CREATE TABLE public.training_standards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  validity_months integer DEFAULT 24,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  details jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT training_standards_pkey PRIMARY KEY (id)
);

-- ==============================================================================
-- 5. SESSIONS (MERGED MASTER TABLE)
-- Replaces previous 'training_sessions'
-- ==============================================================================

CREATE TABLE public.sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  training_standard_id uuid NOT NULL,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  location text NOT NULL,
  delivery_mode text CHECK (delivery_mode = ANY (ARRAY['onsite'::text, 'online'::text])),
  -- Merged Statuses: planned/scheduled (future), active/in_progress (now), completed, cancelled
  status text DEFAULT 'planned'::text CHECK (status = ANY (ARRAY['planned'::text, 'scheduled'::text, 'confirmed'::text, 'active'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text, 'audited'::text])),
  max_participants integer DEFAULT 15, -- Imported from training_sessions
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT sessions_training_standard_id_fkey FOREIGN KEY (training_standard_id) REFERENCES public.training_standards(id)
);

-- ==============================================================================
-- 6. SESSION RELATED TABLES
-- ==============================================================================

CREATE TABLE public.session_instructors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  instructor_id uuid NOT NULL,
  CONSTRAINT session_instructors_pkey PRIMARY KEY (id),
  CONSTRAINT session_instructors_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id),
  CONSTRAINT session_instructors_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.users(id)
);

CREATE TABLE public.session_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  participant_id uuid NOT NULL,
  organization_id uuid,
  attendance_status text DEFAULT 'enrolled'::text CHECK (attendance_status = ANY (ARRAY['enrolled'::text, 'attended'::text, 'absent'::text])),
  CONSTRAINT session_participants_pkey PRIMARY KEY (id),
  CONSTRAINT session_participants_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id),
  CONSTRAINT session_participants_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.users(id),
  CONSTRAINT session_participants_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

CREATE TABLE public.session_roster (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL, -- UPDATED: REFERENCES sessions instead of training_sessions
  user_id uuid NOT NULL,
  status text DEFAULT 'nominated'::text CHECK (status = ANY (ARRAY['nominated'::text, 'approved'::text, 'attended'::text, 'failed'::text, 'certified'::text])),
  attendance_log jsonb DEFAULT '[]'::jsonb,
  exam_score numeric,
  certificate_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT session_roster_pkey PRIMARY KEY (id),
  CONSTRAINT session_roster_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id)
);

CREATE TABLE public.planned_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  day_order integer,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT planned_activities_pkey PRIMARY KEY (id),
  CONSTRAINT planned_activities_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id),
  CONSTRAINT planned_activities_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);

CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  uploaded_by uuid,
  title text NOT NULL,
  file_url text NOT NULL,
  document_type text CHECK (document_type = ANY (ARRAY['material'::text, 'assessment'::text, 'instruction'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id),
  CONSTRAINT documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id)
);

CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id)
);

-- ==============================================================================
-- 7. ASSESSMENTS & CERTIFICATES
-- ==============================================================================

CREATE TABLE public.assessments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  participant_id uuid NOT NULL,
  score numeric,
  result text DEFAULT 'pending'::text CHECK (result = ANY (ARRAY['pass'::text, 'fail'::text, 'pending'::text])),
  remarks text,
  entered_by uuid,
  entered_at timestamp with time zone DEFAULT now(),
  CONSTRAINT assessments_pkey PRIMARY KEY (id),
  CONSTRAINT assessments_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id),
  CONSTRAINT assessments_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.users(id),
  CONSTRAINT assessments_entered_by_fkey FOREIGN KEY (entered_by) REFERENCES public.users(id)
);

CREATE TABLE public.certificates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  certificate_number text NOT NULL UNIQUE,
  participant_id uuid NOT NULL,
  session_id uuid NOT NULL,
  training_standard_id uuid NOT NULL,
  issue_date date DEFAULT CURRENT_DATE,
  expiry_date date,
  status text DEFAULT 'valid'::text CHECK (status = ANY (ARRAY['valid'::text, 'expired'::text, 'revoked'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT certificates_pkey PRIMARY KEY (id),
  CONSTRAINT certificates_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.users(id),
  CONSTRAINT certificates_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id),
  CONSTRAINT certificates_training_standard_id_fkey FOREIGN KEY (training_standard_id) REFERENCES public.training_standards(id)
);

-- ==============================================================================
-- 8. TRAINING REQUESTS
-- ==============================================================================

CREATE TABLE public.training_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  training_standard_id uuid NOT NULL,
  requested_by uuid NOT NULL,
  preferred_start_date date NOT NULL,
  preferred_end_date date NOT NULL,
  requested_participant_count integer NOT NULL CHECK (requested_participant_count > 0),
  notes text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  created_at timestamp with time zone DEFAULT now(),
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  decision_note text,
  CONSTRAINT training_requests_pkey PRIMARY KEY (id),
  CONSTRAINT training_requests_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT training_requests_training_standard_id_fkey FOREIGN KEY (training_standard_id) REFERENCES public.training_standards(id),
  CONSTRAINT training_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id),
  CONSTRAINT training_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id)
);

-- ==============================================================================
-- 9. SYSTEM & LOGS
-- ==============================================================================

CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  reference_id uuid,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  ip_address text,
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id)
);

CREATE TABLE public.compliance_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  target_resource text NOT NULL,
  details jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT compliance_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE public.settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  key text NOT NULL UNIQUE,
  value jsonb DEFAULT '{}'::jsonb,
  description text,
  CONSTRAINT settings_pkey PRIMARY KEY (id)
);
