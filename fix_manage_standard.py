import subprocess
import os

schema_path = r"e:\Jumeau numerique\ERNAM\source_of_truth_schema.sql"
api_standard_path = r"e:\Jumeau numerique\ERNAM\web\app\api\admin\manage-standard\route.ts"

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

context = f"""
# DATABASE SCHEMA
{read_file(schema_path)}

# CURRENT CODE: manage-standard
{read_file(api_standard_path)}

# FIX INSTRUCTIONS
1. CRITICAL: The `audit_logs` table does NOT have a `target_resource` column. Use `entity_id` and `entity_type` instead.

# OUTPUT
Return ONLY the complete, fixed TypeScript code. No explanations.
"""

try:
    process = subprocess.Popen(['ollama', 'run', 'deepseek-v3.2:cloud'], 
                               stdin=subprocess.PIPE, 
                               stdout=subprocess.PIPE, 
                               stderr=subprocess.PIPE,
                               text=True,
                               encoding='utf-8')
    stdout, stderr = process.communicate(input=context)
    code = stdout
    if "```typescript" in stdout: code = stdout.split("```typescript")[1].split("```")[0].strip()
    elif "```" in stdout: code = stdout.split("```")[1].split("```")[0].strip()
    with open('manage_standard_fixed.ts', 'w', encoding='utf-8') as f: f.write(code)
    print("Fix generated for manage-standard.")
except Exception as e: print(f"Error: {e}")
