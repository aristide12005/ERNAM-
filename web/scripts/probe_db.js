const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve(__dirname, '../.env.local');
let envConfig = {};
try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            envConfig[key] = value;
        }
    });
} catch (e) {
    console.error("Could not read .env.local");
}

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Env Vars in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    console.log("--- PROBING DATABASE ---");

    // 1. Check if 'settings' table exists (Accessing it should not 404 if it exists)
    const { data, error } = await supabase.from('settings').select('*').limit(1);

    if (error) {
        console.log("RESULT: Settings Table Check Failed.");
        console.log("ERROR:", error.message, error.code);
        if (error.code === '42P01') console.log("INTERPRETATION: Table 'settings' does NOT exist.");
        else console.log("INTERPRETATION: Fetch failed, possibly RLS or other issue.");
    } else {
        console.log("RESULT: Settings Table Exists.");
        console.log("INTERPRETATION: SQL Fix partially/fully applied.");
    }
}

check();
