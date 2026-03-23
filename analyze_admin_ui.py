import subprocess
import os

schema_path = r"e:\Jumeau numerique\ERNAM\source_of_truth_schema.sql"
api_user_path = r"e:\Jumeau numerique\ERNAM\web\app\api\admin\manage-user\route.ts"
api_session_path = r"e:\Jumeau numerique\ERNAM\web\app\api\admin\manage-session\route.ts"
api_standard_path = r"e:\Jumeau numerique\ERNAM\web\app\api\admin\manage-standard\route.ts"
dashboard_path = r"e:\Jumeau numerique\ERNAM\web\components\dashboard\admin\PurpleAdminDashboard.tsx"

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

context = f"""
# SYSTEM CONTEXT
You are an expert full-stack developer and database architect. Your task is to analyze the provided codebase for "integration failures" in the Admin UI.

# DATABASE SCHEMA (Source of Truth)
{read_file(schema_path)}

# CODEBASE SNIPPETS
## API: manage-user
{read_file(api_user_path)}

## API: manage-session
{read_file(api_session_path)}

## API: manage-standard
{read_file(api_standard_path)}

## UI COMPONENT: PurpleAdminDashboard (Data Fetching Logic)
{read_file(dashboard_path)[:10000]}

# INSTRUCTIONS
1. Compare the API routes and UI data fetching logic against the Database Schema.
2. Identify specifically where the code tries to access or insert columns that do not exist, or uses incorrect table names.
3. Identify potential logical errors in data mapping (e.g., mismatch between role names).
4. Identify any other bugs that would cause 400 or 500 errors in a production environment.
5. Provide a concise bulleted list of "Integration Failures Found".
"""

# Use ollama to run the analysis
try:
    process = subprocess.Popen(['ollama', 'run', 'deepseek-v3.2:cloud'], 
                               stdin=subprocess.PIPE, 
                               stdout=subprocess.PIPE, 
                               stderr=subprocess.PIPE,
                               text=True,
                               encoding='utf-8')
    stdout, stderr = process.communicate(input=context)
    
    with open('analysis_report.txt', 'w', encoding='utf-8') as f:
        f.write(stdout)
        if stderr:
            f.write("\n\n# ERRORS\n")
            f.write(stderr)
    print("Analysis complete. See analysis_report.txt")
except Exception as e:
    print(f"Error running analysis: {e}")
