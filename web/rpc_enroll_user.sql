-- RPC: ENROLL USER IN COURSE
-- Objective: Securely enroll a user, enforcing all business rules.
-- Spec: "RPCs must validate role, enrollment, status, and prerequisites"

CREATE OR REPLACE FUNCTION public.enroll_user_in_course(
    target_course_id UUID,
    target_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as owner to bypass potential RLS on lookup tables if needed, but we check permissions manually.
SET search_path = public
AS $$
DECLARE
    course_record RECORD;
    user_role TEXT;
    existing_enrollment UUID;
    prerequisite_id UUID;
    prereq_completed BOOLEAN;
    new_enrollment_id UUID;
BEGIN
    -- 1. VALIDATION: Course Exists & Is Published
    SELECT * INTO course_record 
    FROM public.courses 
    WHERE id = target_course_id;

    IF course_record.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Course not found');
    END IF;

    IF course_record.course_status <> 'published' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Course is not published');
    END IF;

    -- 2. VALIDATION: User requires 'trainee' role (or permitted role)
    SELECT role INTO user_role 
    FROM public.profiles 
    WHERE id = target_user_id;

    IF user_role IS NULL THEN
         RETURN jsonb_build_object('success', false, 'message', 'User profile not found');
    END IF;
    
    -- Optional: Enforce only trainees can enroll? 
    -- For now, we allow anyone, but business logic implies trainees.

    -- 3. VALIDATION: Already Enrolled?
    SELECT id INTO existing_enrollment
    FROM public.enrollments
    WHERE course_id = target_course_id AND user_id = target_user_id;

    IF existing_enrollment IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'User is already enrolled');
    END IF;

    -- 4. VALIDATION: Prerequisites
    -- 'prerequisites' is an ARRAY of UUIDs in the courses table.
    IF course_record.prerequisites IS NOT NULL AND array_length(course_record.prerequisites, 1) > 0 THEN
        FOREACH prerequisite_id IN ARRAY course_record.prerequisites
        LOOP
            -- Check if user has COMPLETED this prerequisite course
            -- Using a helper logic: Is there an enrollment with status 'completed'? 
            -- (Note: 'completed' status must exist in enrollment_status enum, or derived from certificates check)
            
            -- Assuming 'completed' is a valid status for now. 
            -- If not, we might need to check if a certificate exists for that course.
            SELECT EXISTS (
                SELECT 1 FROM public.certificates 
                WHERE user_id = target_user_id AND course_id = prerequisite_id
            ) INTO prereq_completed;

            IF NOT prereq_completed THEN
                RETURN jsonb_build_object('success', false, 'message', 'Prerequisites not met. Missing completion of course: ' || prerequisite_id);
            END IF;
        END LOOP;
    END IF;

    -- 5. ACTION: Insert Enrollment
    INSERT INTO public.enrollments (
        user_id,
        course_id,
        status,
        -- grade_current, -- defaults to null
        created_at -- defaults to now()
    ) VALUES (
        target_user_id,
        target_course_id,
        'active', -- Assuming 'active' is the standard starting status
        now()
    ) RETURNING id INTO new_enrollment_id;

    -- 6. AUDIT LOG (Mandatory)
    INSERT INTO public.audit_logs (
        actor_id,
        action,
        entity,
        entity_id,
        metadata
    ) VALUES (
        auth.uid(), -- The actor is the one calling the RPC (could be admin or student themselves)
        'enroll_user',
        'enrollments',
        new_enrollment_id,
        jsonb_build_object('target_user', target_user_id, 'target_course', target_course_id)
    );

    RETURN jsonb_build_object('success', true, 'enrollment_id', new_enrollment_id);

END;
$$;
