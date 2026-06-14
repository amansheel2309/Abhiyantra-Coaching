export type Role = 'student' | 'teacher' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  classLevel: 11 | 12;
  phone?: string;
  createdAt: string;
  username?: string;
  password?: string;
  status?: 'Active' | 'Suspended' | 'Pending';
}

export type Subject = 'Physics' | 'Chemistry' | 'Mathematics' | 'Biology';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number; // 0 to 3
  explanation: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  imageUrl?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  subject: Subject;
  classLevel: 11 | 12;
  durationMinutes: number;
  questions: Question[];
  createdBy: string;
  createdAt: string;
  isCustom?: boolean;
}

export interface QuestionAttempt {
  questionId: string;
  selectedOptionIndex: number; // -1 if not attempted
  isCorrect: boolean;
  timeSpentSeconds: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  score: number; // Percentage or absolute marks (e.g. +4 for correct, -1 for wrong or simple percentage)
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  answers: { [questionId: string]: number }; // questionId -> selectedIndex (-1 for skip)
  completedAt: string;
  topicPerformance: {
    [topic: string]: {
      correct: number;
      total: number;
    };
  };
  recommendedTopics: string[]; // Topics that fell below a threshold
}

export interface ChapterTimeline {
  id: string;
  title: string;
  subject: Subject;
  classLevel: 11 | 12;
  topics: string[];
  description: string;
  durationHours: number;
  status: 'not_started' | 'studying' | 'waiting_for_test' | 'test_ready' | 'completed';
  timerStartedAt?: string; // ISO DateTime string
  testId: string; // The test conducted after study time
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'exam_alert' | 'timer_alert' | 'coaching_news' | 'test_ready';
  timestamp: string;
  read: boolean;
  chapterId?: string;
}

export interface LeaderboardEntry {
  studentId: string;
  studentName: string;
  studentEmail: string;
  classLevel: 11 | 12;
  totalPoints: number; // Calculated based on correct answers/attempts
  testsTaken: number;
  averageScorePercentage: number;
  accuracy: number; // e.g. correct / (correct + incorrect)
}

export interface Lecture {
  id: string;
  title: string;
  description: string;
  subject: Subject;
  classLevel: 11 | 12;
  chapter?: string;   // e.g. "Current Electricity"
  topic?: string;     // e.g. "Ohm's Law & Drift Velocity"
  videoUrl: string; // Embed URL (e.g. YouTube embed iframe link)
  notesUrl?: string; // Class notes PDF link
  dppQuizId?: string; // Linked quiz ID representing the DPP
  durationMinutes: number;
  addedBy: string;
  createdAt: string;
}

export interface Doubt {
  id: string;
  studentId: string;
  studentName: string;
  subject: Subject;
  chapterTitle?: string;
  questionText: string;
  imageUrl?: string; // Base64 data URL
  status: 'pending' | 'resolved';
  replyText?: string;
  repliedBy?: string;
  repliedAt?: string;
  createdAt: string;
}

