# Messaging System Troubleshooting Guide

## Quick Fix Steps

### Step 1: Run the Database Setup
1. Open Supabase Dashboard → SQL Editor
2. Run this file: `fix_messaging.sql`
3. Check for any errors in the output

### Step 2: Verify Database Setup
After running the SQL, check:
- ✅ `messages` table exists
- ✅ RLS policies are active
- ✅ Realtime is enabled

### Step 3: Test in Browser
1. Open browser console (F12)
2. Go to Messages page
3. Look for these logs:
   - `"Fetched messages:"` - Should show array of messages
   - `"Grouped conversations:"` - Should show conversation list
   - Any errors in red

## Common Issues & Solutions

### Issue 1: "No messages" or blank screen
**Cause**: Database table not created or RLS blocking access

**Fix**:
```sql
-- Run in Supabase SQL Editor
SELECT * FROM messages LIMIT 1;
```
- If error → Run `fix_messaging.sql`
- If empty → No messages yet (this is OK)

### Issue 2: Can't send messages
**Cause**: RLS policy blocking inserts

**Fix**:
```sql
-- Check if you can insert
INSERT INTO messages (sender_id, receiver_id, content, title)
VALUES (
    auth.uid(),  -- Your user ID
    'some-uuid', -- Recipient ID
    'Test',
    'Test'
);
```
- If error → RLS policy issue, run `fix_messaging.sql`

### Issue 3: Messages not appearing in real-time
**Cause**: Realtime not enabled

**Fix**:
1. Supabase Dashboard → Database → Replication
2. Enable Realtime for `messages` table
3. Or run:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

### Issue 4: "Failed to send message" error
**Check browser console for specific error**:

- `"new row violates row-level security"` → RLS issue
- `"relation does not exist"` → Table not created
- `"null value in column"` → Missing required field

## Testing Messaging

### Test 1: Check Database
```sql
-- See all messages
SELECT 
    id,
    sender_id,
    receiver_id,
    content,
    created_at
FROM messages
ORDER BY created_at DESC;
```

### Test 2: Manual Message Insert
```sql
-- Get your user ID first
SELECT id, email FROM auth.users LIMIT 5;

-- Insert test message (replace UUIDs)
INSERT INTO messages (sender_id, receiver_id, content, title)
VALUES (
    'YOUR_USER_ID',
    'RECIPIENT_USER_ID',
    'Hello! This is a test message.',
    'Test Message'
);
```

### Test 3: Check RLS Policies
```sql
-- Should show 4 policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'messages';
```

Expected output:
- `Users can view sent messages` (SELECT)
- `Users can view received messages` (SELECT)
- `Users can send messages` (INSERT)
- `Users can update own messages` (UPDATE)

## Browser Console Debugging

### Enable Detailed Logging
Open browser console and run:
```javascript
// Check if Supabase is connected
console.log('Supabase client:', supabase);

// Test fetching messages
const { data, error } = await supabase
    .from('messages')
    .select('*')
    .limit(5);
    
console.log('Messages:', data);
console.log('Error:', error);
```

### Expected Console Logs
When messaging works correctly:
```
✅ Fetched messages: Array(X)
✅ Grouped conversations: Array(Y)
✅ Message change detected: {eventType: "INSERT", ...}
```

### Error Logs to Watch For
```
❌ Error fetching conversations: {code: "42501", message: "..."}
   → RLS policy issue

❌ relation "public.messages" does not exist
   → Table not created

❌ Failed to send: new row violates row-level security
   → INSERT policy missing
```

## Quick Checklist

Before reporting messaging doesn't work, verify:

- [ ] Ran `fix_messaging.sql` in Supabase
- [ ] `messages` table exists in database
- [ ] At least 2 users exist in system
- [ ] Checked browser console for errors
- [ ] Tried sending a test message
- [ ] Checked if message appears in database
- [ ] Verified RLS policies exist

## Still Not Working?

### Get Diagnostic Info

Run this in Supabase SQL Editor:
```sql
-- 1. Check table exists
SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'messages'
);

-- 2. Count messages
SELECT COUNT(*) FROM messages;

-- 3. Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'messages';

-- 4. List all policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'messages';
```

Share this output for further troubleshooting.

## Success Indicators

Messaging is working when:
1. ✅ Can see "Messages" page without errors
2. ✅ Can click "New Message" button
3. ✅ Can select recipient from dropdown
4. ✅ Can type and send message
5. ✅ Message appears in conversation list
6. ✅ Recipient sees message in their inbox
7. ✅ Can click conversation to view chat
8. ✅ Can send replies in chat

---

**Next Steps**: Run `fix_messaging.sql` and test again!
