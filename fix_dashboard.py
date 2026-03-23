import subprocess
import os

schema_path = r"e:\Jumeau numerique\ERNAM\source_of_truth_schema.sql"
dashboard_path = r"e:\Jumeau numerique\ERNAM\web\components\dashboard\admin\PurpleAdminDashboard.tsx"

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

dashboard_content = read_file(dashboard_path)

context = f"""
# SYSTEM CONTEXT
You are an expert React/Supabase developer. Finalize the provided Admin Dashboard component.

# DATABASE SCHEMA
{read_file(schema_path)}

# CURRENT CODE: PurpleAdminDashboard.tsx
{dashboard_content[:15000]}
... [TRUNCATED] ...
{dashboard_content[-15000:]}

# FIX INSTRUCTIONS
1. COMPLETE the `fetchStats` function. It currently lacks the logic to set all stats correctly (especially 24h metrics).
2. REMOVE dependency on mock data for the roster tables. Map the real `allUsers` data (trainees, trainers, administrators) to the table rows.
3. FIX Supabase syntax: use `count: 'exact'` (Supabase v2) instead of deprecated `count: 'exact', head: true` if you are just getting counts.
4. ENSURE the dynamic KPI functions (getDynamicTraineeKpis, etc.) work with the real `dashboardStats` state.
5. ENSURE the `status` and `role` mappings match the schema.

# OUTPUT
Return ONLY the complete, fixed TypeScript code for the file. No explanations.
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
    with open('PurpleAdminDashboard_fixed.tsx', 'w', encoding='utf-8') as f: f.write(code)
    print("Fix generated for PurpleAdminDashboard.")
except Exception as e: print(f"Error: {e}")
