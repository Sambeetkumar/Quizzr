# Quizzr — Adaptive Learning & Custom Quiz Evaluation Platform

> A full-stack, responsive web application combining **curated adaptive subject progression**, **custom assessment authoring**, **temporary shareable links with single-attempt enforcement**, and **candidate feedback loops**.

---

## 📖 Executive Summary / Abstract

**Quizzr** is a modern assessment and learning management web application built with **React 19**, **Vite**, **Tailwind CSS**, **Clerk Authentication**, and **Supabase (PostgreSQL)**. 

Traditional quiz systems either present static questions without educational scaffolding or lack flexible sharing mechanisms for instructors and recruiters. Quizzr addresses both challenges:
1. **Adaptive Learning Pathway**: Enforces pedagogical progression in core computer science disciplines. Quizzes are stratified into *Easy*, *Medium*, and *Hard* tiers where advanced quizzes remain locked until candidates prove mastery on prerequisites (≥ 70% on Easy to unlock Medium; ≥ 50% on Medium to unlock Hard).
2. **Custom Assessment & Sharing Engine**: Empowers educators, team leads, and peers to compose bespoke quizzes with variable option counts and timers, generate temporary shareable URLs with strict expiration windows and single-attempt restrictions, and inspect granular candidate attempt breakdowns and question-level issue reports.

---

## 🛠️ Technology Stack & Architecture

### **Core Stack**
| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19** (`react`, `react-dom`) | Modern component-based declarative UI |
| **Build Tool & Bundler** | **Vite 8** (`vite`, `@vitejs/plugin-react`) | Sub-second Hot Module Replacement (HMR) and optimized client production bundles |
| **Routing** | **React Router v7** (`react-router-dom`) | Client-side routing, protected routes, URL parameters |
| **Authentication** | **Clerk** (`@clerk/clerk-react`) | User session management, OAuth/email login, multi-session tokens |
| **Backend as a Service** | **Supabase** (`@supabase/supabase-js`) | Hosted PostgreSQL database, real-time queries, relational joins |
| **Styling & Design System** | **Tailwind CSS v3** + PostCSS + Autoprefixer | Utility-first CSS, dark glassmorphism, responsive grid & flexbox |
| **Icons** | **Lucide React** (`lucide-react`) | Consistent iconography across navigation, actions, and status badges |
| **Document Export** | **docx** | Programmatic document formatting capabilities |

---

### **System Architecture Diagram**

```mermaid
flowchart TD
    Client["Client Browser\n(React 19 + Tailwind CSS)"]
    
    subgraph AuthLayer["Authentication & Security"]
        Clerk["Clerk Auth\n(User Sessions & OAuth)"]
        Guards["Route Guards\n(<SignedIn> / RedirectToSignIn)"]
    end
    
    subgraph AppFeatures["Quizzr Application Core"]
        Nav["Collapsible Responsive Navbar"]
        Catalog["Catalog & Adaptive Engine\n(Easy ➔ Medium ➔ Hard)"]
        Builder["Custom Quiz Creator\n(Dynamic Question Builder)"]
        ShareEngine["Temporary Share Engine\n(Token + Expiration + 1-Attempt)"]
        Runner["Quiz Runner Engine\n(Timer + Scoring + Feedback)"]
        Leaderboard["Analytics & Leaderboards\n(Tie-breaking by timestamp)"]
    end
    
    subgraph DataLayer["Persistence Layer (Supabase / PostgreSQL)"]
        DB_Subjects["subjects"]
        DB_Quizzes["quizzes & questions"]
        DB_Scores["user_scores & user_responses"]
        DB_Custom["custom_quizzes & custom_questions"]
        DB_Shares["custom_quiz_shares"]
        DB_CustomScores["custom_quiz_scores & responses"]
        DB_Reports["custom_question_reports"]
    end

    Client --> Clerk
    Clerk --> Guards
    Guards --> AppFeatures
    AppFeatures --> DataLayer
```

---

## 🗄️ Database Architecture & Table Schemas

Quizzr utilizes **PostgreSQL** hosted on **Supabase** as its relational database. The database is cleanly architected into two modular subsystems:
1. **Curated Catalog Subsystem**: Powers the standard academic subjects, progressive unlock pathways, evaluation scoring, and historical review logs.
2. **Custom Assessment Subsystem**: Operates completely independently to support custom quiz authoring, variable-length multiple-choice options, expiring shareable access tokens, candidate response tracking, and question dispute reporting.

### **Entity-Relationship (ER) Diagram**

```mermaid
erDiagram
    subjects ||--o{ quizzes : "has"
    quizzes ||--o{ questions : "contains"
    quizzes ||--o{ user_scores : "evaluates"
    user_scores ||--o{ user_responses : "records"
    questions ||--o{ user_responses : "references"

    custom_quizzes ||--o{ custom_questions : "contains"
    custom_quizzes ||--o{ custom_quiz_shares : "generates"
    custom_quizzes ||--o{ custom_quiz_scores : "evaluates"
    custom_quiz_scores ||--o{ custom_quiz_responses : "records"
    custom_questions ||--o{ custom_quiz_responses : "references"
    custom_quizzes ||--o{ custom_question_reports : "receives"
    custom_questions ||--o{ custom_question_reports : "flagged_in"

    subjects {
        uuid id PK
        text title
        text description
        timestamptz created_at
    }

    quizzes {
        uuid id PK
        uuid subject_id FK
        text title
        text description
        int time_limit
        timestamptz created_at
    }

    questions {
        uuid id PK
        uuid quiz_id FK
        text question_text
        jsonb options
        int correct_option_index
        timestamptz created_at
    }

    user_scores {
        uuid id PK
        uuid quiz_id FK
        text user_id
        text user_name
        int score
        timestamptz completed_at
    }

    user_responses {
        uuid id PK
        uuid score_id FK
        uuid question_id FK
        int selected_option_index
    }

    custom_quizzes {
        uuid id PK
        text created_by
        text creator_name
        text title
        text description
        int time_limit
        timestamptz created_at
    }

    custom_questions {
        uuid id PK
        uuid quiz_id FK
        text question_text
        jsonb options
        int correct_option_index
        timestamptz created_at
    }

    custom_quiz_shares {
        uuid id PK
        uuid quiz_id FK
        text share_token UK
        text created_by
        timestamptz expires_at
        timestamptz created_at
    }

    custom_quiz_scores {
        uuid id PK
        uuid quiz_id FK
        text user_id
        text user_name
        int score
        timestamptz completed_at
    }

    custom_quiz_responses {
        uuid id PK
        uuid score_id FK
        uuid question_id FK
        int selected_option_index
    }

    custom_question_reports {
        uuid id PK
        uuid quiz_id FK
        uuid question_id FK
        text reporter_user_id
        text reporter_name
        text comment
        timestamptz created_at
    }
```

---

### **Detailed Table Specifications**

#### **1. Core Subject & Catalog Tables**

##### Table: `subjects`
Stores academic subject categories (e.g., Theory of Computation, Machine Learning, Operating System, Java Programming).
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique identifier for each subject |
| `title` | `TEXT` | `NOT NULL` | Display title of the subject |
| `description` | `TEXT` | Nullable | Detailed description and syllabus scope |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Record creation timestamp |

##### Table: `quizzes`
Standard quizzes belonging to a specific academic subject.
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique identifier for the quiz |
| `subject_id` | `UUID` | `FOREIGN KEY ➔ subjects(id) ON DELETE CASCADE` | Link to parent academic subject |
| `title` | `TEXT` | `NOT NULL` | Descriptive title (e.g., "OS Concepts & Architecture") |
| `description` | `TEXT` | Nullable | Overview of quiz topics |
| `time_limit` | `INTEGER` | Nullable | Examination time limit in minutes (e.g., 15) |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Timestamp of quiz addition |

##### Table: `questions`
Multiple-choice questions associated with catalog quizzes.
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique identifier for the question |
| `quiz_id` | `UUID` | `FOREIGN KEY ➔ quizzes(id) ON DELETE CASCADE` | Link to corresponding quiz |
| `question_text` | `TEXT` | `NOT NULL` | Question prompt or problem statement |
| `options` | `JSONB` | `NOT NULL` | Array of choices, e.g. `["Option A", "Option B", "Option C", "Option D"]` |
| `correct_option_index` | `INTEGER` | `NOT NULL` | Zero-based index indicating the correct answer |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Question creation timestamp |

##### Table: `user_scores`
Audit log of completed attempts on catalog quizzes, powering adaptive progression unlocks and leaderboards.
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique attempt record identifier |
| `quiz_id` | `UUID` | `FOREIGN KEY ➔ quizzes(id) ON DELETE CASCADE` | Link to attempted quiz |
| `user_id` | `TEXT` | `NOT NULL` | Clerk user authentication ID |
| `user_name` | `TEXT` | `DEFAULT 'Anonymous'` | Candidate full name or display name |
| `score` | `INTEGER` | `NOT NULL` | Total number of correctly answered questions |
| `completed_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Submission timestamp (used for leaderboard tie-breakers) |

##### Table: `user_responses`
Granular question-by-question responses for detailed candidate attempt review.
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique response record identifier |
| `score_id` | `UUID` | `FOREIGN KEY ➔ user_scores(id) ON DELETE CASCADE` | Link to the parent attempt score record |
| `question_id` | `UUID` | `FOREIGN KEY ➔ questions(id) ON DELETE CASCADE` | Link to the evaluated question |
| `selected_option_index` | `INTEGER` | Nullable | Zero-based option chosen by candidate (`NULL` if skipped) |

---

#### **2. Custom Assessment, Sharing & Feedback Tables**

##### Table: `custom_quizzes`
Bespoke quizzes created by registered users and instructors.
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique custom quiz identifier |
| `created_by` | `TEXT` | `NOT NULL` | Clerk user ID of quiz creator |
| `creator_name` | `TEXT` | `DEFAULT 'Anonymous'` | Full name or username of creator |
| `title` | `TEXT` | `NOT NULL` | Title of custom evaluation |
| `description` | `TEXT` | Nullable | Instructions, scope, or guidelines |
| `time_limit` | `INTEGER` | Nullable | Duration limit in minutes (`NULL` indicates Untimed) |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Date and time created |

##### Table: `custom_questions`
Questions belonging to custom quizzes, supporting variable option counts.
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique custom question identifier |
| `quiz_id` | `UUID` | `FOREIGN KEY ➔ custom_quizzes(id) ON DELETE CASCADE` | Link to parent custom quiz |
| `question_text` | `TEXT` | `NOT NULL` | Problem statement / question prompt |
| `options` | `JSONB` | `NOT NULL` | Flexible option array (e.g., 2 for True/False, 3, 4, 5+ choices) |
| `correct_option_index` | `INTEGER` | `NOT NULL` | Zero-based index of the designated correct key |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Question creation timestamp |

##### Table: `custom_quiz_shares`
Temporary shareable access tokens with expiration control and revocability.
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique share entry ID |
| `quiz_id` | `UUID` | `FOREIGN KEY ➔ custom_quizzes(id) ON DELETE CASCADE` | Link to shared quiz |
| `share_token` | `TEXT` | `NOT NULL`, `UNIQUE` | Non-guessable alphanumeric token used in URL |
| `created_by` | `TEXT` | `NOT NULL` | Clerk user ID of creator who issued link |
| `expires_at` | `TIMESTAMPTZ` | `NOT NULL` | Timestamp after which access token is invalidated |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Link issuance timestamp |

##### Table: `custom_quiz_scores`
Evaluated attempts for custom quizzes, enforcing single-attempt policies.
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique attempt record identifier |
| `quiz_id` | `UUID` | `FOREIGN KEY ➔ custom_quizzes(id) ON DELETE CASCADE` | Link to evaluated custom quiz |
| `user_id` | `TEXT` | `NOT NULL` | Clerk user ID of the candidate |
| `user_name` | `TEXT` | `DEFAULT 'Anonymous'` | Candidate display name |
| `score` | `INTEGER` | `NOT NULL` | Candidate's total correct answers |
| `completed_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Final submission timestamp |

##### Table: `custom_quiz_responses`
Candidate choice records for custom quizzes, used by creators to inspect class answers.
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique response record identifier |
| `score_id` | `UUID` | `FOREIGN KEY ➔ custom_quiz_scores(id) ON DELETE CASCADE` | Link to attempt score record |
| `question_id` | `UUID` | `FOREIGN KEY ➔ custom_questions(id) ON DELETE CASCADE` | Link to custom question |
| `selected_option_index` | `INTEGER` | Nullable | Option index chosen by candidate (`NULL` if unanswered) |

##### Table: `custom_question_reports`
Candidate question dispute and feedback registry.
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique report identifier |
| `quiz_id` | `UUID` | `FOREIGN KEY ➔ custom_quizzes(id) ON DELETE CASCADE` | Link to custom quiz |
| `question_id` | `UUID` | `FOREIGN KEY ➔ custom_questions(id) ON DELETE CASCADE` | Link to reported question |
| `reporter_user_id` | `TEXT` | `NOT NULL` | Clerk user ID of reporting candidate |
| `reporter_name` | `TEXT` | `DEFAULT 'Candidate'` | Display name of candidate |
| `comment` | `TEXT` | `NOT NULL` | Feedback, dispute rationale, or correction description |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Timestamp of report submission |

---

## 🌟 Comprehensive Feature Breakdown

### 1. Authentication, Identity & Session Security
- **Clerk Integration**: Seamless sign-in and sign-up flows with modal triggers on the landing page.
- **Protected Routing**: Critical user paths (`/dashboard`, `/create`, `/history`, `/subject/:id`, `/quiz/:id`, `/custom-quiz/:id`) are strictly guarded using `<SignedIn>` and `<SignedOut><RedirectToSignIn /></SignedOut>`.
- **Identity Attribution**: All quiz submissions, custom quiz creations, question reports, and share tokens are tagged with the verified user's Clerk ID and display name.

---

### 2. Adaptive Learning Progression System
Designed to ensure structured skill mastery, the adaptive progression engine dynamically calculates qualification criteria from the candidate's highest score.

#### **Target Subjects**
1. **Theory of Computation**
2. **Machine Learning**
3. **Operating System**
4. **Data Mining**

*(Other catalog subjects such as Java Programming and Computer Simulation & Modelling remain unrestricted).*

#### **Progression Criteria**
- **Tier 1 (Easy)**: Unlocked by default for all registered candidates.
- **Tier 2 (Medium)**: Unlocks only when the candidate achieves a score of **≥ 70%** on the corresponding *Easy* quiz of the same subject.
- **Tier 3 (Hard)**: Unlocks only when the candidate achieves a score of **≥ 50%** on the corresponding *Medium* quiz of the same subject.
- **Evaluation Mechanism**: Qualification uses the user's **highest historical score percentage** recorded in `user_scores` for that prerequisite quiz.
- **Two-Tier Enforcement**:
  - **Visual Card Guard ([`QuizCard.jsx`](src/components/QuizCard.jsx))**: Renders an amber "Locked" badge, disables the "Start Quiz" button, and displays the exact requirement note (e.g., *"Requires at least 70% score in the Easy quiz to unlock"*). Leaderboard buttons remain accessible.
  - **Route Guard ([`QuizRunner.jsx`](src/pages/QuizRunner.jsx))**: Intercepts direct URL navigation (e.g., manual navigation to `/quiz/:id`). If locked, stops quiz initialization, halts countdown timers, and presents a dedicated **Quiz Locked** interface displaying the candidate's current prerequisite percentage, target percentage, and a one-click button to launch the prerequisite quiz.

---

### 3. Quiz Difficulty Tagging & Descriptive Titling
- **Difficulty Badges**: Standard catalog quizzes display difficulty pill badges with semantic color-coding:
  - **Easy**: Emerald green (`bg-emerald-500/15 text-emerald-300 border-emerald-500/30`)
  - **Medium**: Amber yellow (`bg-amber-500/15 text-amber-300 border-amber-500/30`)
  - **Hard**: Rose red (`bg-rose-500/15 text-rose-300 border-rose-500/30`)
- **Descriptive Titles**: Converted legacy title strings into concise, academic topics:
  - *Data Mining*: **Data Mining Fundamentals**, **Classification & Clustering**, **Advanced Mining & Ensembles**
  - *Machine Learning*: **Machine Learning Basics**, **Supervised Models & Tuning**, **Neural Networks & Deep Learning**
  - *Operating System*: **OS Concepts & Architecture**, **Processes & Memory Management**, **Storage, Deadlocks & Kernels**
  - *Theory of Computation*: **Automata & Regular Languages**, **Context-Free Grammars & PDA**, **Turing Machines & Complexity**
- **Fallback Rule**: Quizzes without explicit level designations automatically receive the **Easy** badge.

---

### 4. Custom Assessment Authoring Engine
Located under the `/create` workspace, creators have unrestricted flexibility to design evaluations:
- **Quiz Metadata**: Title, optional description, and configurable timer limits.
- **Untimed Mode**: Toggle between strict timed quizzes (1 to 180 minutes) or **"Untimed (No limit)"** mode.
- **Flexible Options Builder**:
  - Unlimited questions per quiz.
  - Variable number of answer options per question (supports 2 for True/False, 3, 4, 5, or more options).
  - Radio button selector to designate the single correct answer key for automated grading.
  - Inline question and option deletion with minimum constraint validation.

---

### 5. Temporary Shareable Links & Single-Attempt Policy
Allows creators to distribute private quiz invitations to students or candidates:
- **Expiration Presets**: **1 Hour**, **6 Hours**, **24 Hours**, **3 Days**, **7 Days**, or **Custom Date & Time**.
- **Timezone-Aware Picker**: Custom date-time selection uses local browser time (`toLocalISOString`), dark scheme calendar styling, and future-timestamp validation.
- **Unique Share Tokens**: Generates non-guessable links format: `/quiz/shared/:shareToken`.
- **Token Lifecycle Management**: Creators can view all generated links with live expiration timestamps and revoke/delete them at any time.
- **Candidate Gate ([`SharedQuiz.jsx`](src/pages/SharedQuiz.jsx))**:
  - Validates share token and checks `expires_at > NOW()`.
  - Displays formatted "Quiz Invitation" preview card showing question count, time limit, and instructions.
  - If expired: Renders a dedicated notice displaying the exact expiration timestamp.
- **Strict Single-Attempt Enforcement**:
  - Candidates can attempt a shared quiz **only once**.
  - Dual-layer verification: verified via Supabase `custom_quiz_scores` and synchronized with client `localStorage`.
  - Re-attempting blocks the quiz and renders a score review summary card with a link to the leaderboard.

---

### 6. Interactive Quiz Runner Engine
Shared across standard catalog quizzes ([`QuizRunner.jsx`](src/pages/QuizRunner.jsx)) and custom quizzes ([`CustomQuizRunner.jsx`](src/pages/CustomQuizRunner.jsx)):
- **Real-Time Synchronized Timer**: Countdown timer with minutes and seconds display; pulses with red warning alerts when under 60 seconds.
- **Auto-Submission**: Automatically evaluates and finalizes answers when the timer reaches 00:00.
- **Dynamic Progress Bar**: Live visual percentage indicator reflecting question advancement.
- **Automated Grading**: Compares chosen answers against the database answer key, recording the total score and question-by-question responses.
- **Comprehensive Review**:
  - Results card with prominent gradient percentage score (`80%`, `100%`).
  - Answer review showing question text, correct answer highlighted in emerald, candidate choice highlighted in red (if incorrect), and confirmation markers.

---

### 7. Candidate Question Feedback & Reporting Loop
- **In-Review Flagging**: Candidates reviewing custom quiz results can click **"🚩 Report Question"** on any question.
- **Feedback Modal ([`QuestionReportModal.jsx`](src/components/QuestionReportModal.jsx))**: Allows candidates to describe typos, ambiguity, or disputed answer keys.
- **Creator Report Inspector ([`OwnerReportsModal.jsx`](src/components/OwnerReportsModal.jsx))**:
  - Aggregates feedback grouped by question.
  - Displays reporter name, submission timestamp, question text, and candidate comments.

---

### 8. Real-Time Leaderboards & Performance Analytics
- **Global Leaderboard ([`Leaderboard.jsx`](src/pages/Leaderboard.jsx))**:
  - Displays rankings for standard catalog quizzes.
  - **Tie-Breaking Logic**: Ranks by highest score descending; ties are broken by earliest completion timestamp (`completed_at ASC`).
  - Distinct rank presentation for top performers: 🥇 1st Place, 🥈 2nd Place, 🥉 3rd Place.
- **Custom Quiz Leaderboard ([`CustomQuizLeaderboard.jsx`](src/pages/CustomQuizLeaderboard.jsx))**:
  - Tracks candidate rankings for user-created quizzes.
- **Creator Attempts Analytics ([`OwnerAttemptsModal.jsx`](src/components/OwnerAttemptsModal.jsx))**:
  - Total attempts counter, class average score percentage, and highest recorded score.
  - Expandable candidate response inspector showing the exact option selected for every question.

---

### 9. Attempt History & Personal Progress
- **History Log ([`History.jsx`](src/pages/History.jsx))**:
  - Chronological audit log of all completed quizzes for the signed-in user.
  - Shows subject name, quiz title, difficulty badge, percentage score, score ratio, and timestamp.
- **Attempt Detail Inspector ([`AttemptResult.jsx`](src/pages/AttemptResult.jsx))**:
  - Accessible by clicking any historical attempt row.
  - Loads recorded responses and compares them against question answer keys for thorough post-exam revision.

---

### 10. Responsive Glassmorphic UI & Collapsible Navigation
- **Design System**: Modern dark theme with radial background glow effects, backdrop blur panels (`backdrop-blur-md`), translucent borders (`border-white/10`), and indigo/violet gradients.
- **Collapsible Mobile Navbar ([`Navbar.jsx`](src/components/Navbar.jsx))**:
  - Desktop view (`≥ 768px`): Sleek horizontal navbar with brand logo, nav links, and Clerk User profile.
  - Mobile view (`< 768px`): Compact bar featuring a hamburger menu button (`Menu` / `X` toggle).
  - Mobile Dropdown: Expands to full-width navigation links with icons (`Home`, `Create`, `History`) and active gradient pills. Auto-closes on link selection or route change.
- **Responsive Tables**: All 4-column data tables (Leaderboards and History) feature dedicated horizontal scroll containers (`overflow-x-auto min-w-[500px]`), ensuring clean rendering without column squishing on narrow mobile screens.

---