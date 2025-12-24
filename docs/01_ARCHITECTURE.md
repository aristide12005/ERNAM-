# 01. System Architecture

## Technology Stack
The "Modern Experiential" stack is chosen to ensure the app is fast, scalable, and visually impressive ("The Aura").

*   **Frontend**: React.js (Web) / React Native (Mobile).
*   **Styling**: Tailwind CSS + Framer Motion.
    *   *Focus*: Smooth page transitions, micro-interactions, dark mode support.
*   **Backend & Database**: Supabase.
    *   **Auth**: Magic Links, Bilingual email templates.
    *   **Database**: PostgreSQL.
    *   **Storage**: Large PDF archives (diplomas, manuals) and course videos.
*   **AI Integration**: OpenAI (via Edge Functions) for "Tower" (AI Concierge) and Archive Search.

## Architecture Diagram (Conceptual)
```mermaid
graph TD
    Client_Web[Web App (React)] --> Supabase
    Client_Mobile[Mobile App (React Native)] --> Supabase
    
    subgraph Supabase
        Auth[Authentication]
        DB[(PostgreSQL)]
        Storage[File Storage]
        Edge[Edge Functions]
    end
    
    Edge --> OpenAI[AI Service]
    
    subgraph Modules
        Training[Training Module]
        Governance[Governance Module]
        Archives[Archives Module]
    end
    
    DB --> Training
    DB --> Governance
    DB --> Archives
```

## Security & Non-Functional Requirements
1.  **RBAC (Role-Based Access Control)**: Strict separation between Trainee, Trainer, and Director.
2.  **Row Level Security (RLS)**: Implemented in Supabase to ensure students can ONLY see their own records.
3.  **Offline Capability**: Mobile app must cache schedules and downloaded courseware.
4.  **Bilingual Support (i18n)**: Seamless FR/EN toggle without page reloads (using `react-i18next`).
