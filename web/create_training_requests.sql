-- Create training_requests table
CREATE TABLE IF NOT EXISTS public.training_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) NOT NULL,
    training_standard_id UUID REFERENCES public.training_standards(id) NOT NULL,
    requested_by UUID REFERENCES public.users(id) NOT NULL,
    preferred_start_date DATE NOT NULL,
    preferred_end_date DATE NOT NULL,
    requested_participant_count INTEGER NOT NULL CHECK (requested_participant_count > 0),
    notes TEXT,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by UUID REFERENCES public.users(id),
    reviewed_at TIMESTAMPTZ,
    decision_note TEXT
);

-- Enable RLS
ALTER TABLE public.training_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Org Members can view their own requests
CREATE POLICY "Org members can view own requests" ON public.training_requests
    FOR SELECT TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Policy: Org Admins can insert requests for their own org
CREATE POLICY "Org admins can create requests" ON public.training_requests
    FOR INSERT TO authenticated
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Policy: ERNAM Admins can do everything
CREATE POLICY "Ernam admins full access requests" ON public.training_requests
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'ernam_admin'
        )
    );
