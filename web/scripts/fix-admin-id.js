
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Debugging Path
console.log('CWD:', process.cwd());
const envPath = path.join(process.cwd(), '.env.local');
console.log('Target Env Path:', envPath);

if (!fs.existsSync(envPath)) {
    console.error('ERROR: .env.local not found at', envPath);
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
// console.log('File content length:', envContent.length);

const envConfig = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"]|['"]$/g, '');
        envConfig[key] = value;
    }
});

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
if (!supabaseServiceKey) console.error('Missing SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function fixAdmin() {
    const email = 'aristide@ernam.aero';
    console.log(`Fixing Admin ID for ${email}...`);

    // 1. Get Auth User ID
    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) {
        console.error('Auth Error:', authError);
        return;
    }

    const adminUser = users.find(u => u.email === email);
    if (!adminUser) {
        console.error('Auth user not found for:', email);
        console.log('Available users:', users.map(u => u.email).join(', '));
        return;
    }

    console.log(`Found Auth User ID: ${adminUser.id}`);

    // 2. Update Public User ID directly
    const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
            id: adminUser.id,
            role: 'ernam_admin',
            status: 'approved'
        })
        .eq('email', email);

    if (updateError) {
        console.error('Update Error:', updateError);
    } else {
        console.log('Successfully synced Public User ID with Auth ID.');
    }
}

fixAdmin();
