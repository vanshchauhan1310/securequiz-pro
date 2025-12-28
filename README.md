# Quizify 🎓

A secure, real-time online assessment platform built with React, TypeScript, and Supabase. Quizify enables educators to create, manage, and proctor quizzes with advanced security features and comprehensive analytics.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://quizportal-demo.vercel.app)
[![GitHub](https://img.shields.io/badge/github-repo-blue)](https://github.com/vanshchauhan1310/QuizPortal)

## ✨ Features

### For Quiz Creators
- **Easy Quiz Creation**: Intuitive interface for creating quizzes with multiple question types
- **Bulk Import**: CSV-based bulk import for questions and participant credentials
- **Real-time Analytics**: Comprehensive dashboard showing participation, scores, and performance metrics
- **Participant Management**: Generate and manage one-time credentials for participants

### For Test Takers
- **Secure Environment**: Advanced proctoring features ensure test integrity
- **Timed Assessments**: Per-question and overall quiz timers
- **Instant Feedback**: Automatic grading with immediate results
- **Responsive Design**: Works seamlessly across desktop and mobile devices

### Security & Proctoring
- **Tab Monitoring**: Detects when users switch tabs during assessment
- **Copy/Paste Prevention**: Blocks copying and pasting within the quiz interface
- **Fullscreen Enforcement**: Requires fullscreen mode during active quizzes
- **Activity Tracking**: Logs all security violations for review

## 🛠️ Tech Stack

### Frontend
- **React 18** with **TypeScript** for type-safe component development
- **Vite** for fast development and optimized production builds
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** for consistent, accessible UI components
- **Framer Motion** for smooth animations

### Backend & Data
- **Supabase** for PostgreSQL database and real-time subscriptions
- **PostgREST** style API access via `@supabase/supabase-js`

### State Management & Data Fetching
- **TanStack React Query** for efficient data fetching and caching
- **React Hook Form** for performant form validation

### Additional Libraries
- **Recharts** for data visualization and analytics charts
- **Lucide React** for beautiful, consistent icons
- **React Router DOM** for client-side routing

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm/yarn
- Supabase account and project

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/vanshchauhan1310/QuizPortal.git
cd QuizPortal
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Set up Supabase database**

Run the following SQL in your Supabase SQL editor to create the necessary tables:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'participant')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quizzes table
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER, -- in minutes
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  points INTEGER DEFAULT 1,
  order_index INTEGER
);

-- Quiz attempts table
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES quizzes(id),
  user_id UUID REFERENCES users(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  score INTEGER,
  total_points INTEGER,
  security_violations JSONB DEFAULT '[]'
);

-- Answers table
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id),
  selected_answer TEXT,
  is_correct BOOLEAN,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Participants table (for bulk credential generation)
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  quiz_id UUID REFERENCES quizzes(id),
  credentials_sent BOOLEAN DEFAULT FALSE
);
```

5. **Run the development server**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI primitives (shadcn/ui)
│   ├── layout/          # Layout components
│   ├── quiz/            # Quiz-specific components
│   │   ├── QuestionCard.tsx
│   │   ├── QuestionNavigator.tsx
│   │   ├── SecurityIndicator.tsx
│   │   └── TimerDisplay.tsx
│   └── auth/
│       └── ProtectedRoute.tsx
├── pages/               # Route pages
│   ├── Dashboard.tsx
│   ├── CreateQuiz.tsx
│   ├── TakeQuiz.tsx
│   └── Results.tsx
├── services/            # API service layer
│   ├── quizService.ts
│   ├── attemptService.ts
│   ├── authService.ts
│   └── analyticsService.ts
├── hooks/               # Custom React hooks
│   ├── useSecurityMonitor.ts
│   ├── useTimer.ts
│   └── useMobileDetection.ts
├── lib/
│   └── supabase.ts      # Supabase client configuration
└── types/               # TypeScript type definitions
```

## 🔑 Key Features Implementation

### CSV Bulk Import
Import questions and participants from CSV files:

```typescript
// Example CSV format for questions
question_text,option_a,option_b,option_c,option_d,correct_answer,points
"What is React?","Library","Framework","Language","Database","Library",1
```

### Security Monitoring
The `useSecurityMonitor` hook tracks:
- Tab switches
- Copy/paste attempts
- Fullscreen exits
- Window blur events

### Real-time Analytics
Dashboard provides:
- Total quizzes created
- Active participants
- Average scores
- Completion rates
- Weekly/monthly trends

## 📊 Database Schema

- **users**: User authentication and role management
- **quizzes**: Quiz metadata and configuration
- **questions**: Quiz questions with multiple choice options
- **quiz_attempts**: Track user attempts and scores
- **answers**: Individual question responses
- **participants**: Bulk credential management

## 🔒 Security Features

- App-level authentication with secure password hashing
- Protected routes requiring authentication
- Real-time security violation tracking
- Proctoring features preventing cheating
- One-time participant credentials

## 🎯 Use Cases

- **Educational Institutions**: Conduct online exams and assessments
- **Corporate Training**: Employee skill assessments and certifications
- **Interview Screening**: Technical aptitude tests for candidates
- **Online Courses**: Knowledge checks and module assessments

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👤 Author

**Vansh Raj Chauhan**

- GitHub: [@vanshchauhan1310](https://github.com/vanshchauhan1310)
- LinkedIn: [Vansh Raj Chauhan](https://linkedin.com/in/vansh-raj-chauhan-64b50a258)
- Portfolio: [vansh-portfolio-eight.vercel.app](https://vansh-portfolio-eight.vercel.app)
- Email: vanshchauhan1310@gmail.com

## 🙏 Acknowledgments

- [Supabase](https://supabase.com/) for the amazing backend platform
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for styling utilities

---

⭐ If you find this project helpful, please consider giving it a star!
