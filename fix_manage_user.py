import subprocess
import os

schema_path = r"e:\Jumeau numerique\ERNAM\source_of_truth_schema.sql"
api_user_path = r"e:\Jumeau numerique\ERNAM\web\app\api\admin\manage-user\route.ts"

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

context = f"""
# SYSTEM CONTEXT
You are an expert full-stack developer. Fix the provided API route to match the Database Schema.

# DATABASE SCHEMA
{read_file(schema_path)}

# CURRENT CODE: manage-user
{read_file(api_user_path)}

# FIX INSTRUCTIONS
1. CRITICAL: The `audit_logs` table does NOT have a `target_resource` column. Use `entity_id` and `entity_type` instead.
2. CRITICAL: In DELETE, you must delete from `public.users` BEFORE `auth.users` to avoid foreign key violations.
3. IMPROVEMENT: In POST, use `.upsert()` or ensure the profile exists before updating, as triggers might not have fired yet. Actually, a clean `.upsert()` based on `id` is better.
4. Ensure all role and status values match the schema check constraints.

# OUTPUT
Return ONLY the complete, fixed TypeScript code for the file. No explanations.
"""

# Use ollama to run the fix
try:
    process = subprocess.Popen(['ollama', 'run', 'deepseek-v3.2:cloud'], 
                               stdin=subprocess.PIPE, 
                               stdout=subprocess.PIPE, 
                               stderr=subprocess.PIPE,
                               text=True,
                               encoding='utf-8')
    stdout, stderr = process.communicate(input=context)
    
    # Extract code between ```typescript and ``` if present, otherwise take raw stdout
    code = stdout
    if "```typescript" in stdout:
        code = stdout.split("```typescript")[1].split("```")[0].strip()
    elif "```" in stdout:
        code = stdout.split("```")[1].split("```")[0].strip()

    with open('manage_user_fixed.ts', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Fix generated. See manage_user_fixed.ts")
except Exception as e:
    print(f"Error running fix: {e}")
