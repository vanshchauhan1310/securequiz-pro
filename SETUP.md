# SecureQuiz Pro - Setup Instructions

This project has been updated to use Supabase for dynamic data storage. Follow these steps to get started.

## 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Once created, go to **Project Settings > API**.
3. Copy the **Project URL** and **anon public key**.

## 2. Configure Environment Variables

1. Create a `.env` file in the root directory (copy from `.env.example`).
2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 3. Setup Database Schema

1. Go to the **SQL Editor** in your Supabase dashboard.
2. Open the file `database/schema.sql` from this project.
3. Copy the content and paste it into the SQL Editor.
4. Click **Run** to create the tables and insert sample data.

## 4. Run the Application

```bash
npm run dev
```

## Features Implemented

- **Dynamic Dashboard**: Real-time statistics, recent quizzes, and activity feed.
- **Quiz Management**: Create, view, and manage quizzes dynamically.
- **Taking Quizzes**: Full quiz taking experience with timer, security monitoring, and result saving.
- **Guest Access**: Automatically creates guest profiles for quiz takers.
- **Analytics**: Track pass rates, completion times, and user performance.

## 5. Admin Credentials

Use the following credentials to log in as the administrator:

- **Email**: `edcatalyst.in@gmail.com`
- **Password**: `edcatalyst2025`

## 6. Participant Workflow

1. Log in as Admin.
2. Click **Create Participant** on the dashboard.
3. Enter the participant's email.
4. Share the generated credentials with the participant.
5. The participant can now log in and take the quiz.

