// Supabase JS v2-style snippet for trainee
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'public-anon-key';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 1) List public courses
async function listCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false });

  if (error) console.error('listCourses error', error);
  else console.log('courses', data);
}

// 2) Request enrollment (must set requester_id to auth.user().id)
async function requestEnrollment(courseId) {
  const user = supabase.auth.getUser(); // or supabase.auth.getSession() depending on version
  const userId = (await user).data.user.id;

  const { data, error } = await supabase.from('enrollment_requests').insert([{
    course_id: courseId,
    requester_id: userId
  }]);

  if (error) console.error('requestEnrollment error', error);
  else console.log('requested', data);
}