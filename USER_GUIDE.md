# ERNAM Digital Twin - User Guide

**Welcome to the ERNAM Digital Twin Application.**
This platform is the central nervous system for ERNAM's aviation training operations. It combines a Learning Management System (LMS) with robust Organization & Aviation Management tools.

This guide ensures that no user—whether an administrator, instructor, or trainee—will ever be a stranger to the system.

---

## 1. Getting Started & Access

### Public Access & Organization Application
New organizations (Airlines, Maintenance Companies) can apply to join ERNAM via the public portal.
1.  Navigate to `/apply`.
2.  **Organization Details**: Fill in your official entity name and contact info.
3.  **Administrator Account**: Create the primary admin account for your organization.
4.  **Submit**: Your application will be sent to ERNAM Admins for review. You will receive an email upon approval.

### Signing In
1.  Go to the login page.
2.  Enter your **Email** and **Password**.
3.  **First Time Login**: You may be prompted to change your temporary password.

### The Control Center
The **Control Center** is your global quick-access panel, available anywhere in the app (click the settings/gear icon or time display).
-   **Smart Clock**: Displays official operational time.
-   **Theme Toggle**: Switch between **Light Mode** (Day ops) and **Dark Mode** (Night/Hangar ops).
-   **Language**: Instantly toggle between **English** and **Français**.

---

## 2. User Roles Overview

The system is built around 4 distinct roles. Your dashboard changes completely based on who you are.

| Role | Responsibility | Key Features |
| :--- | :--- | :--- |
| **ERNAM Admin** | **Superuser**. Manages the entire platform. | Define Standards, Approve Orgs, Audit Logs, Global User Mgmt. |
| **Org Admin** | **Client Manager**. Manages their own company's staff & trainees. | Request Training, Manage Staff, View Validity/Certificates. |
| **Instructor** | **Trainer**. Delivers content and grades students. | My Schedule, Attendance Logs, Grading, Content Upload. |
| **Participant** | **Trainee**. Consumes content. | My Training, Lessons, Assessments, Certificates. |

---

## 3. For ERNAM Administrators (Superusers)

You are the controllers of the system. Your view focuses on High-Level Operations.

### Training Operations
The core logic of ERNAM is divided into **Standards** and **Sessions**.
1.  **Standards (`/dashboard?view=standards`)**:
    *   These are the *blueprints* for courses (e.g., "A320 Type Rating", "Safety Management Systems").
    *   Define the syllabus, duration, and default requirements here.
2.  **Sessions (`/dashboard?view=sessions`)**:
    *   These are the *actual scheduled instances* of a standard (e.g., "A320 Type Rating - Oct 2025 Cohort").
    *   Assign Instructors and Dates to a session here.
3.  **Training Requests**:
    *   View requests coming from Organizations.
    *   **Action**: Approve a request to automatically convert it into a planned Session.

### Administration
1.  **Organizations**: View all partner companies.
2.  **Applications**: Review pending applications from `/apply`.
    *   *Approve*: Creates the Org and the Admin User active.
    *   *Reject*: Sends a notification to the applicant.
3.  **Audit Logs**: A read-only immutable log of every critical action taken in the system (Login, Grade Change, Delete).

---

## 4. For Organization Administrators

You manage your company's presence within ERNAM.

### Managing Your Team
1.  **Staff (`/dashboard?view=participants`)**: Add your company's internal admins or coordinators.
2.  **Participants**:
    *   **Create User**: Manually add a trainee.
    *   **Bulk Import**: (If enabled) Upload a CSV of trainees.

### Training Management
1.  **Request Training (`/dashboard?view=training-requests`)**:
    *   Click **"Request Training"** to open the wizard.
    *   Select a **Training Standard** (Course Type).
    *   Propose **Dates** and number of **Participants (Pax)**.
    *   *Status*: Track if ERNAM has Approved your request.
2.  **Sessions**: View sessions where your employees are enrolled.
3.  **Certificates & Validity**:
    *   Track expiring licenses or certificates for your employees.
    *   Download PDF certificates for completed training.

---

## 5. For Instructors

Your dashboard is focused on Day-to-Day delivery.

### Daily Workflow
1.  **My Schedule**: A calendar view of your upcoming classes.
2.  **Session Management**:
    *   Click on a Session to enter the **Classroom View**.
    *   **Attendance**: Mark students as Present/Absent.
    *   **Log Book**: For flight training, log specific flight hours/sim hours.
3.  **Grading**:
    *   Input grades for assessments.
    *   *Note*: Grades are locked once a session is finalized.

---

## 6. For Participants (Trainees)

Your view is simple and focused on learning.

1.  **My Training**:
    *   See courses you are currently enrolled in.
    *   Click **"Continue"** to enter the player.
2.  **Learning Player**:
    *   Read PDF materials, watch video lessons, or take quizzes.
    *   Progress is saved automatically.
3.  **Profile & Certificates**:
    *   Download your transcripts and completion certificates.

---

## 7. Support & Troubleshooting

**Q: I cannot log in.**
A: Contact your Organization Admin to reset your password. If you are an Org Admin, contact ERNAM Support.

**Q: The system is slow or not loading.**
A: Check the **Control Center** (Clock icon). If the system is offline, a status indicator will appear. Try refreshing (F5).

**Q: Data is not saving.**
A: Ensure you have a stable internet connection. The system creates a local draft but requires connection to sync.

---

*© ERNAM Digital Twin. All Rights Reserved.*
