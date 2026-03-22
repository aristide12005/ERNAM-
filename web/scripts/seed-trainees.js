// Seed script: Create training standard, session, and add test trainees
// Uses the service role key to bypass RLS
// Run: node scripts/seed-trainees.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fspcwmtsnycscvonfbdd.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzcGN3bXRzbnljc2N2b25mYmRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODA3MDYyNywiZXhwIjoyMDczNjQ2NjI3fQ.IoVVU5DTJEDI5Dwkb51vJL8otskxUCm2uA0lbM32LY4';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const TEST_TRAINEES = [
    { full_name: 'Eleanor Pena', email: 'eleanor.pena@ernam-test.com' },
    { full_name: 'Jessia Rose', email: 'jessia.rose@ernam-test.com' },
    { full_name: 'Jenny Wilson', email: 'jenny.wilson@ernam-test.com' },
    { full_name: 'Guy Hawkins', email: 'guy.hawkins@ernam-test.com' },
    { full_name: 'Jacob Jones', email: 'jacob.jones@ernam-test.com' },
    { full_name: 'Jane Cooper', email: 'jane.cooper@ernam-test.com' },
    { full_name: 'Floyd Miles', email: 'floyd.miles@ernam-test.com' },
    { full_name: 'Amadou Diallo', email: 'amadou.diallo@ernam-test.com' },
    { full_name: 'Fatou Sow', email: 'fatou.sow@ernam-test.com' },
    { full_name: 'Ousmane Ndiaye', email: 'ousmane.ndiaye@ernam-test.com' },
    { full_name: 'Mariama Ba', email: 'mariama.ba@ernam-test.com' },
    { full_name: 'Ibrahima Fall', email: 'ibrahima.fall@ernam-test.com' },
];

async function main() {
    console.log('🚀 Seeding test trainees (using service role key)...\n');

    // ====== Step 1: Ensure a training_standard exists ======
    let standardId;
    const { data: existingStds } = await supabase
        .from('training_standards')
        .select('id, title, code')
        .limit(5);

    if (existingStds && existingStds.length > 0) {
        standardId = existingStds[0].id;
        console.log(`📋 Using existing standard: ${existingStds[0].title} (${standardId})\n`);
    } else {
        console.log('📦 Creating training standard...');
        const { data: newStd, error: stdErr } = await supabase
            .from('training_standards')
            .insert({
                title: 'Aviation Safety Fundamentals',
                code: 'ASF-2025',
                description: 'Comprehensive training on aviation safety regulations and procedures.',
                validity_months: 24,
                active: true,
                details: {},
            })
            .select('id')
            .single();

        if (stdErr) {
            console.error('❌ Failed to create standard:', stdErr.message);
            return;
        }
        standardId = newStd.id;
        console.log(`   ✅ Created standard: ${standardId}\n`);
    }

    // ====== Step 2: Ensure a session exists ======
    let targetSessionId;
    const { data: existingSessions } = await supabase
        .from('sessions')
        .select('id, status')
        .limit(5);

    if (existingSessions && existingSessions.length > 0) {
        targetSessionId = existingSessions[0].id;
        console.log(`📋 Using existing session: ${targetSessionId}\n`);
    } else {
        console.log('📦 Creating session...');
        const { data: newSess, error: sessErr } = await supabase
            .from('sessions')
            .insert({
                training_standard_id: standardId,
                start_date: '2025-09-01',
                end_date: '2025-12-15',
                location: 'Dakar, Senegal',
                status: 'active',
                max_participants: 30,
            })
            .select('id')
            .single();

        if (sessErr) {
            console.error('❌ Failed to create session:', sessErr.message);
            return;
        }
        targetSessionId = newSess.id;
        console.log(`   ✅ Created session: ${targetSessionId}\n`);
    }

    // ====== Step 3: Link instructor to session ======
    const { data: instructors } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('role', 'trainer')
        .limit(1);

    if (instructors && instructors.length > 0) {
        const instrId = instructors[0].id;
        const { data: existing } = await supabase
            .from('session_instructors')
            .select('id')
            .eq('session_id', targetSessionId)
            .eq('instructor_id', instrId)
            .single();

        if (!existing) {
            const { error } = await supabase
                .from('session_instructors')
                .insert({ session_id: targetSessionId, instructor_id: instrId });
            if (error) {
                console.log(`   ⚠️  Could not link instructor: ${error.message}`);
            } else {
                console.log(`   ✅ Linked instructor ${instructors[0].full_name}\n`);
            }
        } else {
            console.log(`   ⏭️  Instructor ${instructors[0].full_name} already linked\n`);
        }
    }

    // ====== Step 4: Create trainee users ======
    console.log('👥 Creating trainee users...');
    const createdUserIds = [];

    for (const trainee of TEST_TRAINEES) {
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('email', trainee.email)
            .single();

        if (existing) {
            console.log(`   ⏭️  ${trainee.full_name} already exists (${existing.id})`);
            createdUserIds.push(existing.id);
            continue;
        }

        // Create auth user first (service role can do this)
        const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
            email: trainee.email,
            password: 'TestTrainee2025!',
            email_confirm: true,
            user_metadata: { full_name: trainee.full_name },
        });

        if (authErr) {
            console.error(`   ❌ Auth error for ${trainee.full_name}:`, authErr.message);
            // Try direct insert into users table as fallback
            const { data: directUser, error: directErr } = await supabase
                .from('users')
                .insert({
                    full_name: trainee.full_name,
                    email: trainee.email,
                    role: 'trainee',
                    status: 'approved',
                })
                .select('id')
                .single();

            if (directErr) {
                console.error(`   ❌ Direct insert also failed for ${trainee.full_name}:`, directErr.message);
            } else {
                console.log(`   ✅ Created ${trainee.full_name} directly (${directUser.id})`);
                createdUserIds.push(directUser.id);
            }
            continue;
        }

        const userId = authData.user.id;

        // Update the users table profile with correct role
        await supabase
            .from('users')
            .upsert({
                id: userId,
                email: trainee.email,
                full_name: trainee.full_name,
                role: 'participant',
                status: 'approved',
            });

        console.log(`   ✅ Created ${trainee.full_name} (${userId})`);
        createdUserIds.push(userId);
    }

    console.log(`\n👥 ${createdUserIds.length} trainee(s) ready.\n`);

    if (createdUserIds.length === 0) {
        console.log('⚠️  No trainees were created.');
        return;
    }

    // ====== Step 5: Enroll trainees in the session ======
    console.log(`📌 Enrolling trainees in session: ${targetSessionId}\n`);

    for (const userId of createdUserIds) {
        const { data: existingEnroll } = await supabase
            .from('session_participants')
            .select('id')
            .eq('session_id', targetSessionId)
            .eq('participant_id', userId)
            .single();

        if (existingEnroll) {
            console.log(`   ⏭️  User ${userId} already enrolled`);
            continue;
        }

        const { error: enrollErr } = await supabase
            .from('session_participants')
            .insert({
                session_id: targetSessionId,
                participant_id: userId,
                attendance_status: 'enrolled',
            });

        if (enrollErr) {
            console.error(`   ❌ Failed to enroll ${userId}:`, enrollErr.message);
        } else {
            console.log(`   ✅ Enrolled ${userId}`);
        }
    }

    console.log('\n🎉 Seeding complete! Refresh your dashboard to see the trainees.');
}

main().catch(console.error);
