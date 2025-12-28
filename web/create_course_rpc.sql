-- RPC: Transactional Course Creation
-- Purpose: Create a course and immediately assign the creator as 'owner' in `course_staff`.

-- Drop old function signature first (required when changing parameter names)
DROP FUNCTION IF EXISTS create_new_course(text,text,text,text,timestamp with time zone,timestamp with time zone,integer,text,text,text);


CREATE OR REPLACE FUNCTION create_new_course(
    p_title_en TEXT,
    p_title_fr TEXT,
    p_description_en TEXT,
    p_description_fr TEXT,
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_max_capacity INTEGER DEFAULT 30,
    p_enrollment_mode TEXT DEFAULT 'auto',
    p_thumbnail_url TEXT DEFAULT NULL,
    p_course_status TEXT DEFAULT 'draft'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges to insert into courses and course_staff
SET search_path = public
AS $$
DECLARE
    v_course_id UUID;
    v_new_course RECORD;
BEGIN
    -- 1. Insert into Courses
    INSERT INTO public.courses (
        title_en,
        title_fr,
        description_en,
        description_fr,
        start_date,
        end_date,
        max_capacity,
        enrollment_mode,
        thumbnail_url,
        course_status
    )
    VALUES (
        p_title_en,
        p_title_fr,
        p_description_en,
        p_description_fr,
        p_start_date,
        p_end_date,
        p_max_capacity,
        p_enrollment_mode,
        p_thumbnail_url,
        p_course_status::course_status_new
    )
    RETURNING id, title_en, title_fr INTO v_new_course;
    
    v_course_id := v_new_course.id;

    -- 2. Insert into Course Staff (Creator is Owner)
    INSERT INTO public.course_staff (course_id, user_id, role, assigned_by)
    VALUES (v_course_id, auth.uid(), 'owner', auth.uid());

    -- 3. Audit Log
    INSERT INTO public.audit_logs (action, entity, actor_id, metadata)
    VALUES ('COURSE_CREATED', 'courses', auth.uid(), jsonb_build_object('course_id', v_course_id, 'title', p_title_en));

    -- Return the new ID
    RETURN jsonb_build_object('id', v_course_id, 'message', 'Course created successfully');
END;
$$;
