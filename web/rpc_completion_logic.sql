-- RPC: CHECK AND ISSUE CERTIFICATE
-- Objective: Validate if a user has finished a course, and if so, issue certificate.

-- 1. Helper: Check Progress
CREATE OR REPLACE FUNCTION public.check_course_completion(
    check_course_id UUID,
    check_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    total_lessons INT;
    completed_lessons INT;
    all_quizzes_passed BOOLEAN;
    course_is_completed BOOLEAN;
BEGIN
    -- Count Published Lessons in the Course
    SELECT COUNT(*) INTO total_lessons
    FROM public.lessons l
    JOIN public.modules m ON l.module_id = m.id
    WHERE m.course_id = check_course_id
    AND l.status = 'published'
    AND m.status = 'published';

    IF total_lessons = 0 THEN
         -- Edge case: Empty course.
         RETURN jsonb_build_object('complete', false, 'message', 'Course has no content');
    END IF;

    -- Count Completed Lessons for User
    SELECT COUNT(*) INTO completed_lessons
    FROM public.lesson_progress lp
    JOIN public.lessons l ON lp.lesson_id = l.id
    JOIN public.modules m ON l.module_id = m.id
    WHERE lp.user_id = check_user_id
    AND m.course_id = check_course_id
    AND lp.status = 'completed';

    -- Check if all Quizzes are passed (if any exist)
    -- We assume 'completed' status in lesson_progress implies quiz passed, 
    -- BUT for strictness, we could query quiz_submissions directly. 
    -- Let's stick to lesson_progress as valid ground truth for now (assuming quiz submission updates it).
    
    IF completed_lessons >= total_lessons THEN
        course_is_completed := true;
    ELSE
        course_is_completed := false;
    END IF;

    RETURN jsonb_build_object(
        'complete', course_is_completed,
        'progress', (completed_lessons::float / total_lessons::float),
        'total', total_lessons,
        'completed', completed_lessons
    );
END;
$$;


-- 2. Transactional Action: Issue Certificate
CREATE OR REPLACE FUNCTION public.issue_certificate(
    target_course_id UUID,
    target_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    completion_data JSONB;
    new_cert_number TEXT;
    existing_cert UUID;
    cert_id UUID;
BEGIN
    -- Check Completion
    completion_data := public.check_course_completion(target_course_id, target_user_id);
    
    IF (completion_data->>'complete')::boolean = false THEN
        RETURN jsonb_build_object('success', false, 'message', 'Course requirements not met', 'detail', completion_data);
    END IF;

    -- Check if already issued
    SELECT id INTO existing_cert FROM public.certificates
    WHERE user_id = target_user_id AND course_id = target_course_id AND revoked_at IS NULL;

    IF existing_cert IS NOT NULL THEN
        RETURN jsonb_build_object('success', true, 'message', 'Certificate already exists', 'certificate_id', existing_cert);
    END IF;

    -- Generate Certificate Number (Simple format: ERNAM-COURSE-USER-TIMESTAMP)
    new_cert_number := 'CERT-' || LEFT(target_course_id::text, 8) || '-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LEFT(gen_random_uuid()::text, 4);

    -- Insert Certificate
    INSERT INTO public.certificates (
        certificate_number,
        user_id,
        course_id,
        issued_at
    ) VALUES (
        UPPER(new_cert_number),
        target_user_id,
        target_course_id,
        NOW()
    ) RETURNING id INTO cert_id;

    -- Update Enrollment Status
    UPDATE public.enrollments
    SET status = 'completed'
        -- completed_at = NOW() -- if column exists
    WHERE user_id = target_user_id AND course_id = target_course_id;

    -- Audit Log
    INSERT INTO public.audit_logs (
        actor_id,
        action,
        entity,
        entity_id,
        metadata
    ) VALUES (
        auth.uid(),
        'issue_certificate',
        'certificates',
        cert_id,
        jsonb_build_object('user', target_user_id, 'course', target_course_id)
    );

    RETURN jsonb_build_object('success', true, 'certificate_id', cert_id, 'number', new_cert_number);

END;
$$;
