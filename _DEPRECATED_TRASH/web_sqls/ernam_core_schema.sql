-- CORE DATABASE — ERNAM (MINIMUM, COMPLETE)
-- "No Academic LMS logic. No guessing. No over-engineering."

-- 🟢 0. CLEANUP (Nuclear Option)
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.certificates CASCADE;
DROP TABLE IF EXISTS public.assessments CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.planned_activities CASCADE;
DROP TABLE IF EXISTS public.session_participants CASCADE;
DROP TABLE IF EXISTS public.session_instructors CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.training_standards CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.organization_admins CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE; -- Legacy cleanup

-- 🏢 1. ORGANIZATIONS (CLIENTS) -- MUST BE CREATED BEFORE USERS
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('airport', 'airline', 'government', 'security_company', 'other')),
    country TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 🧑 2. USERS (ALL HUMANS)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- 🔒 STRICT: Must match Auth ID. No random gen.
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('participant', 'instructor', 'org_admin', 'ernam_admin', 'maintainer', 'developer')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')) DEFAULT 'pending',
    organization_id UUID REFERENCES public.organizations(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.organization_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) NOT NULL,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    UNIQUE(organization_id, user_id)
);

-- 📩 3. APPLICATIONS (VERY IMPORTANT)
CREATE TABLE public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_type TEXT NOT NULL CHECK (application_type IN ('organization', 'instructor')),
    applicant_user_id UUID REFERENCES public.users(id), -- Nullable for new orgs? Keeping nullable based on prompt logic
    organization_name TEXT, -- For org apps
    details JSONB DEFAULT '{}'::JSONB,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    reviewed_by UUID REFERENCES public.users(id), -- ERNAM admin
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 🎓 4. TRAINING STANDARDS (TEMPLATES)
CREATE TABLE public.training_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    validity_months INTEGER DEFAULT 24,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 📅 5. TRAINING SESSIONS (THE HEART)
CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    training_standard_id UUID REFERENCES public.training_standards(id) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    location TEXT NOT NULL,
    delivery_mode TEXT CHECK (delivery_mode IN ('onsite', 'online')),
    status TEXT CHECK (status IN ('planned', 'active', 'completed', 'cancelled')) DEFAULT 'planned',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.session_instructors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.sessions(id) NOT NULL,
    instructor_id UUID REFERENCES public.users(id) NOT NULL,
    UNIQUE(session_id, instructor_id)
);

CREATE TABLE public.session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.sessions(id) NOT NULL,
    participant_id UUID REFERENCES public.users(id) NOT NULL,
    organization_id UUID REFERENCES public.organizations(id), -- Snapshot of org at time of session
    attendance_status TEXT CHECK (attendance_status IN ('enrolled', 'attended', 'absent')) DEFAULT 'enrolled',
    UNIQUE(session_id, participant_id)
);

-- 🗂️ 6. PLANNED ACTIVITIES
CREATE TABLE public.planned_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.sessions(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    day_order INTEGER,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 📄 7. DOCUMENTS
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.sessions(id) NOT NULL,
    uploaded_by UUID REFERENCES public.users(id),
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    document_type TEXT CHECK (document_type IN ('material', 'assessment', 'instruction')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 💬 8. COMMUNICATION
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.sessions(id) NOT NULL,
    sender_id UUID REFERENCES public.users(id) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 📝 9. ASSESSMENTS / RESULTS
CREATE TABLE public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.sessions(id) NOT NULL,
    participant_id UUID REFERENCES public.users(id) NOT NULL,
    score NUMERIC, -- Nullable
    result TEXT CHECK (result IN ('pass', 'fail', 'pending')) DEFAULT 'pending',
    remarks TEXT,
    entered_by UUID REFERENCES public.users(id),
    entered_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, participant_id)
);

-- 🏆 10. CERTIFICATES (THE FINAL OUTPUT)
CREATE TABLE public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_number TEXT UNIQUE NOT NULL,
    participant_id UUID REFERENCES public.users(id) NOT NULL,
    session_id UUID REFERENCES public.sessions(id) NOT NULL,
    training_standard_id UUID REFERENCES public.training_standards(id) NOT NULL,
    issue_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    status TEXT CHECK (status IN ('valid', 'expired', 'revoked')) DEFAULT 'valid',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 🔔 11. NOTIFICATIONS
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) NOT NULL,
    type TEXT NOT NULL,
    reference_id UUID,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 📊 12. REPORTING (AUDIT LOGS)
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Enablement (Default secure)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- 🛡️ 13. SECURITY POLICIES (THE BRIDGE)
-- CRITICAL: Without these, the UI cannot read the DB.

-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

-- Users can update their own basic info
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admins can view/edit ALL users
CREATE POLICY "Admins can view all users" ON public.users
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'ernam_admin'
        )
    );

-- Public can submit applications
CREATE POLICY "Public Apply" ON public.applications 
    FOR INSERT TO anon, authenticated 
    WITH CHECK (true);

-- Users can view their own applications
CREATE POLICY "Users view own apps" ON public.applications
    FOR SELECT TO authenticated
    USING (auth.uid() = applicant_user_id);

-- 🔄 14. AUTOMATION TRIGGERS (THE LOGIC)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    submitted_secret TEXT;
BEGIN
    submitted_secret := NEW.raw_user_meta_data->>'admin_secret';

    -- 🔑 DEVELOPER BACKDOOR (ERNAM2026)
    IF submitted_secret = 'ERNAM2026' THEN
        INSERT INTO public.users (id, email, full_name, role, status)
        VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Admin'), 'ernam_admin', 'approved')
        ON CONFLICT (id) DO UPDATE SET role = 'ernam_admin', status = 'approved';
    
    -- 👤 STANDARD SIGNUP (Metadata Driven)
    ELSE
        -- Check if pre-provisioned (e.g. by seed)
        IF EXISTS (SELECT 1 FROM public.users WHERE email = NEW.email) THEN
            UPDATE public.users SET id = NEW.id WHERE email = NEW.email;
        ELSE
            INSERT INTO public.users (id, email, full_name, role, status)
            VALUES (
                NEW.id, 
                NEW.email, 
                COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'), 
                COALESCE(NEW.raw_user_meta_data->>'role', 'participant'), -- Use metadata role if sent, default to participant
                'pending'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 🌱 15. SEED DATA (THE FACT)
-- Force Ensure Admin Exists (link will happen on login if auth missing)
-- 🌱 15. SEED DATA (THE FACT & THE FIX)
-- We check if the Auth User already exists to ensure IDs match (Step 2 of Troubleshooting)
DO $$
DECLARE
    auth_id UUID;
BEGIN
    SELECT id INTO auth_id FROM auth.users WHERE email = 'aristide@ernam.aero';

    IF auth_id IS NOT NULL THEN
        -- Case A: User already signed up in Auth -> Must link IDs
        INSERT INTO public.users (id, email, full_name, role, status)
        VALUES (auth_id, 'aristide@ernam.aero', 'Aristide Niyombabazi', 'ernam_admin', 'approved')
        ON CONFLICT (email) DO UPDATE 
        SET id = EXCLUDED.id, role = 'ernam_admin', status = 'approved';
    ELSE
        -- Case B: Auth User does not exist yet.
        -- We CANNOT create a public user because 'id' is a Foreign Key to auth.users.
        -- The Admin must Sign Up using the 'Developer Admin' backdoor in the UI.
        RAISE NOTICE 'Admin Auth User not found. Please sign up via UI using the Developer Backdoor.';
    END IF;
END $$;

