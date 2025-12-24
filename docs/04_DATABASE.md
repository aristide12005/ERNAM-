# 04. Database Schema

## Core Tables (Conceptual ERD)

### `users`
*   `id` (UUID, Primary Key)
*   `email` (Text, Unique)
*   `role` (Enum: 'trainee', 'trainer', 'admin', 'director')
*   `full_name` (Text)
*   `language_pref` (Enum: 'fr', 'en')
*   `avatar_url` (Text)
*   `meta_data` (JSONB): Passport info, medical cert status.

### `courses`
*   `id` (UUID, Primary Key)
*   `title_fr` (Text)
*   `title_en` (Text)
*   `description_fr` (Text)
*   `description_en` (Text)
*   `start_date` (Timestamp)
*   `end_date` (Timestamp)
*   `instructor_id` (UUID, FK -> users)
*   `status` (Enum: 'upcoming', 'active', 'completed')

### `enrollments`
*   `id` (UUID, Primary Key)
*   `user_id` (FK -> users)
*   `course_id` (FK -> courses)
*   `status` (Enum: 'pending_payment', 'active', 'completed', 'failed')
*   `grade_current` (Float)

### `materials`
*   `id` (UUID, Primary Key)
*   `course_id` (FK -> courses)
*   `title` (Text)
*   `type` (Enum: 'pdf', 'video', 'slide')
*   `file_url` (Text -> Storage)
*   `created_at` (Timestamp)

### `archives` (Read-only / Historical)
*   `id` (UUID, Primary Key)
*   `user_id` (FK -> users)
*   `diploma_url` (Text)
*   `year` (Integer)
*   `license_number` (Text)
*   `course_name_snapshot` (Text)

### `audit_logs`
*   `id` (UUID, Primary Key)
*   `admin_id` (FK -> users)
*   `action` (Text): e.g., "Validated Grade", "Exported Compliance Report".
*   `timestamp` (Timestamp)
*   `target_resource` (Text)

### `assets` (Asset Twin)
*   `id` (UUID, Primary Key)
*   `name` (Text): "Simulateur 3"
*   `status` (Enum: 'operational', 'maintenance', 'offline')
*   `next_maintenance` (Date)
