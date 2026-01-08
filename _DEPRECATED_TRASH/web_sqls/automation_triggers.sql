-- 🤖 AUTOMATION TRIGGERS (ERNAM)

-- 1. FUNCTION: Auto-Generate Certificate on Pass
CREATE OR REPLACE FUNCTION public.trigger_generate_certificate()
RETURNS TRIGGER AS $$
DECLARE
    v_training_standard_id UUID;
    v_validity_months INT;
    v_certificate_number TEXT;
BEGIN
    -- Only proceed if result changed to 'pass'
    IF NEW.result = 'pass' AND (OLD.result IS DISTINCT FROM 'pass') THEN
        
        -- Get Standard ID and Validity
        SELECT s.training_standard_id, ts.validity_months 
        INTO v_training_standard_id, v_validity_months
        FROM public.sessions s
        JOIN public.training_standards ts ON s.training_standard_id = ts.id
        WHERE s.id = NEW.session_id;

        -- Generate unique certificate number (Example: CERT-YYYY-RANDOM)
        v_certificate_number := 'CERT-' || to_char(CURRENT_DATE, 'YYYY') || '-' || substr(md5(random()::text), 1, 6);

        -- Insert Certificate
        INSERT INTO public.certificates (
            certificate_number,
            participant_id,
            session_id,
            training_standard_id,
            issue_date,
            expiry_date,
            status
        ) VALUES (
            upper(v_certificate_number),
            NEW.participant_id,
            NEW.session_id,
            v_training_standard_id,
            CURRENT_DATE,
            CURRENT_DATE + (v_validity_months || ' months')::INTERVAL,
            'valid'
        );

        -- Notify User
        INSERT INTO public.notifications (user_id, type, message, reference_id)
        VALUES (
            NEW.participant_id, 
            'success', 
            'Congratulations! You have passed your training and a new certificate has been issued.', 
            NEW.session_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. TRIGGER: Bind Cert Gen to Assessments
DROP TRIGGER IF EXISTS trg_auto_cert ON public.assessments;
CREATE TRIGGER trg_auto_cert
    AFTER UPDATE ON public.assessments
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_generate_certificate();


-- 3. FUNCTION: Notify on Session Enrollment
CREATE OR REPLACE FUNCTION public.trigger_notify_enrollment()
RETURNS TRIGGER AS $$
DECLARE
    v_session_title TEXT;
BEGIN
    -- Get session title
    SELECT ts.title INTO v_session_title
    FROM public.sessions s
    JOIN public.training_standards ts ON s.training_standard_id = ts.id
    WHERE s.id = NEW.session_id;

    INSERT INTO public.notifications (user_id, type, message, reference_id)
    VALUES (
        NEW.participant_id, 
        'info', 
        'You have been enrolled in a new session: ' || v_session_title, 
        NEW.session_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. TRIGGER: Bind Enrollment Notification
DROP TRIGGER IF EXISTS trg_notify_enrollment ON public.session_participants;
CREATE TRIGGER trg_notify_enrollment
    AFTER INSERT ON public.session_participants
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_notify_enrollment();
