import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'public-anon-key';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Create a course (instructor)
async function createCourse(title, description) {
  const user = await supabase.auth.getUser();
  const userId = user.data.user.id;

  const { data, error } = await supabase.from('courses').insert([{
    title, description, instructor_id: userId, visibility: 'public'
  }]);

  if (error) console.error('createCourse error', error);
  else console.log('course created', data);
}

// Subscribe to notifications for this instructor
async function subscribeNotifications() {
  const user = await supabase.auth.getUser();
  const userId = user.data.user.id;

  const channel = supabase
    .channel('public:notifications')
    .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` },
        (payload) => {
          console.log('notification received', payload);
          // payload.new.payload has the enrollment_request metadata
        }
    )
    .subscribe();

  return channel;
}

// Approve an enrollment request (instructor action)
async function approveRequest(requestId) {
  // Update request status
  const { data, error } = await supabase
    .from('enrollment_requests')
    .update({ status: 'approved' })
    .eq('id', requestId);

  if (error) { console.error('approve error', error); return; }

  // Optionally, create notification to requester (handled by separate trigger or by app)
  const requesterId = (await supabase
    .from('enrollment_requests').select('requester_id').eq('id', requestId).single()).data.requester_id;

  await supabase.from('notifications').insert([{
    type: 'enrollment_response',
    actor_id: (await supabase.auth.getUser()).data.user.id,
    recipient_id: requesterId,
    target_id: requestId,
    payload: { status: 'approved' }
  }]);
}