# Final Fix Steps - Course Visibility Issue

## Problem
- "My Learning" page is empty
- Supabase API key not being passed to frontend
- Some queries still reference removed `instructor_id` column

## Solution - Follow These Steps EXACTLY

### Step 1: Stop the Server
Press `Ctrl+C` in the terminal running `npm run preview`

### Step 2: Clear Next.js Cache
```bash
cd "c:\Users\mugunga pacific\Desktop\ERNAM Digital Twin\web"
Remove-Item -Recurse -Force .next
```

### Step 3: Rebuild
```bash
npm run build
```

### Step 4: Start Fresh
```bash
npm run preview
```

### Step 5: Hard Refresh Browser
- Press `Ctrl+Shift+R` (or `Ctrl+F5`) to clear browser cache
- The environment variables will now be loaded properly

## What This Fixes
1. ✅ Supabase client will have the anon key
2. ✅ Published courses will appear in "My Learning"
3. ✅ Enrollment will work
4. ✅ All instructor_id errors resolved

## Test After Fix
1. **As Instructor**: Create a course → Publish it (click DRAFT badge)
2. **As Student**: Go to "My Learning" → See the published course
3. **Click the course** → Click "REQUEST CLEARANCE" or "CONFIRM ENROLLMENT"
4. **Done!**

---

**NOTE**: If you still see errors after this, the issue is that **NO COURSES EXIST** in the database yet. You need to:
- Login as instructor
- Click "Create New" button
- Fill in course details
- Submit
- Click the orange "DRAFT" badge to change it to green "PUBLISHED"
