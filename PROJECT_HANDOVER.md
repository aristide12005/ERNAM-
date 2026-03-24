# ERNAM Digital Twin: Project Handover Document (Go-Live Package)

**Date:** March 24, 2026
**Prepared For:** ERNAM Administration & IT Team
**Project Name:** ERNAM Digital Twin (Learning Management System)
**Live Environment:** [https://www.ernam-jn.online](https://www.ernam-jn.online)

---

## 1. Project Overview & Links

The ERNAM Digital Twin is a modern, role-based Learning Management System designed to manage training standards, sessions, instructors (trainers), and trainees. It features a premium, light-mode exclusive UI tailored to different user roles.

*   **Production URL:** [https://www.ernam-jn.online](https://www.ernam-jn.online)
*   **GitHub Repository:** [https://github.com/aristide12005/ERNAM-](https://github.com/aristide12005/ERNAM-) (Currently Public)

---

## 2. Hosting & Infrastructure Architecture

The application is built on a modern, serverless architecture using Next.js, deployed on Vercel, with Supabase serving as the backend database and authentication provider.

### Providers:
*   **Frontend Hosting (Vercel):** Hosts the Next.js application, handles routing, server-side rendering, and API routes.
*   **Backend & Database (Supabase):** Manages PostgreSQL database, Authentication (JWT), Row Level Security (RLS) policies, and data storage.
*   **Domain Registrar (Porkbun):** Manages the domain name (`ernam-jn.online`) and DNS records.

### Key Deployment Notes:
*   Vercel detects pushes to the `main` branch of the GitHub repository and triggers automatic deployments.
*   The application currently targets a Linux-based deployment (`x64`/`arm64`). Ensure any future dependencies in `package.json` are cross-platform compatible (avoiding strict Windows `win32-x64` locks for production).

---

## 3. Login Credentials

Below are the credentials for accessing the live system across different roles.

> **WARNING:** These credentials provide access to the live production environment. The IT team should prompt users to change these passwords upon first login, especially for administrative accounts.

### 🛡 Administrative Access (ERNAM Admin)
This account has full access to the Admin Dashboard to manage users, roles, sessions, and training standards. It also features an "Act As" (Impersonation) capability for support and troubleshooting.

*   **Email:** `aristide12005@gmail.com`
*   **Password:** *(Please refer to your secure password manager or previous setup notes)*
*   **Role:** Administrator (`org_admin` / `admin`)

### 🎓 Instructor / Trainer Access
This account is used to manage courses, take attendance, publish notes, and grade trainees.

*   **Email:** `instructor@ernam.com` *(Substitute with the actual instructor email created during setup if different)*
*   **Role:** Trainer / Instructor

### 👥 Test Trainee Accounts
A batch of test users was created for verifying the system. These users have the `participant` role and are enrolled in the "Aviation Safety Fundamentals" test session.

**Common Password for all test users:** `TestTrainee2025!`

**Test Accounts:**
*   `eleanor.pena@ernam-test.com`
*   `jessia.rose@ernam-test.com`
*   `jenny.wilson@ernam-test.com`
*   `guy.hawkins@ernam-test.com`
*   `jacob.jones@ernam-test.com`
*   *(And other generic test names generated during the seed process)*

---

## 4. System Usage Guidelines (For IT Team)

### Role-Based Access Control (RBAC)
The system uses strict roles:
1.  **Admin:** Full system configuration, user management, and impersonation.
2.  **Trainer (Instructor):** Course management, grading, attendance tracking.
3.  **Trainee (Participant):** View courses, access notes, view schedules and grades.

### The "Impersonation" Feature
Admins can use the "Act As" feature in the Admin Dashboard to log in as any user (Trainer or Trainee) without knowing their password.
*   **To start:** Click the "Options" menu on a user row and select "Act As".
*   **To stop:** A banner will appear at the top of the screen. Click "Stop Impersonating" to return to the Admin dashboard.

---

## 5. Further Reading & Documentation

To maintain, extend, or troubleshoot the ERNAM Digital Twin, the IT team should familiarize themselves with the core technologies used:

*   **Next.js Documentation:** [https://nextjs.org/docs](https://nextjs.org/docs) (Routing, Server Components, API Routes)
*   **Supabase Documentation:** [https://supabase.com/docs](https://supabase.com/docs) (PostgreSQL, Auth, RLS Policies)
*   **Tailwind CSS Documentation:** [https://tailwindcss.com/docs](https://tailwindcss.com/docs) (Utility-first styling framework used for the UI)
*   **Vercel Documentation:** [https://vercel.com/docs](https://vercel.com/docs) (Deployment and hosting platform)

---
*End of Handover Document*
