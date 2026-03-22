/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Load Environment Variables
console.log('🔌 Loading credentials...');

const envPathLocal = path.join(process.cwd(), '.env.local');
const envPath = path.join(process.cwd(), '.env');
let envContent = '';

if (fs.existsSync(envPathLocal)) envContent = fs.readFileSync(envPathLocal, 'utf8');
else if (fs.existsSync(envPath)) envContent = fs.readFileSync(envPath, 'utf8');
else {
    console.error('❌ ERROR: No .env.local or .env found.');
    process.exit(1);
}

const envConfig = {};
envContent.split(/\r?\n/).forEach(line => {
    let text = line.trim();
    if (!text || text.startsWith('#')) return;
    text = text.replace(/^export\s+/, '');
    const parts = text.split('=');
    if (parts.length < 2) return;
    const key = parts.shift().trim();
    let value = parts.join('=').trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
    }
    envConfig[key] = value;
});

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    process.exit(1);
}

// NOTE: Using Anon Key because we leverage the "Developer Backdoor" trigger in the database
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const NEW_ADMIN = {
    email: 'admin@ernam.aero',
    password: 'password123',
    full_name: 'Sys Super Admin'
};

async function createAdmin() {
    console.log(`\n🚀 Creating Admin User: ${NEW_ADMIN.email}...`);
    console.log('ℹ️  Using "Developer Backdoor" (Metadata Trigger) strategy.');

    const { data, error } = await supabase.auth.signUp({
        email: NEW_ADMIN.email,
        password: NEW_ADMIN.password,
        options: {
            data: {
                full_name: NEW_ADMIN.full_name,
                admin_secret: 'ERNAM2026' // <--- The Secret Key that triggers 'ernam_admin' role
            }
        }
    });

    if (error) {
        console.error('❌ Creation Failed:', error.message);
        return;
    }

    if (data.user) {
        console.log(`✅ Auth Identity Created. ID: ${data.user.id}`);
        console.log('🎉 SUCCESS! User created. The database trigger should have auto-assigned "ernam_admin" role.');
        console.log(`👉 Login here: http://localhost:3001/auth/login`);
        console.log(`👉 Email: ${NEW_ADMIN.email}`);
        console.log(`👉 Password: ${NEW_ADMIN.password}`);
    } else {
        console.log('⚠️  User created but no session returned. Check email confirmation settings if login fails.');
    }
}

createAdmin();
