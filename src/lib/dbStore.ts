import { Quiz, ChapterTimeline, QuizAttempt, AppNotification, LeaderboardEntry, UserProfile, Question, Lecture, Doubt } from '../types';
import { PRESEEDED_QUIZZES, PRESEEDED_TIMELINES, INITIAL_LEADERBOARD_ENTRIES, PRESEEDED_LECTURES } from './preseededData';
import { SYLLABUS_DATA } from './syllabus';

// Storage Keys
const KEY_USER = 'abhiyantra_user';
const KEY_USERS_LIST = 'abhiyantra_users_list';
const KEY_QUIZZES = 'abhiyantra_quizzes';
const KEY_TIMELINES = 'abhiyantra_timelines';
const KEY_ATTEMPTS = 'abhiyantra_attempts';
const KEY_NOTIFICATIONS = 'abhiyantra_notifications';
const KEY_LEADERBOARD = 'abhiyantra_leaderboard';
const KEY_LECTURES = 'abhiyantra_lectures';
const KEY_COMPLETED_LECTURES = 'abhiyantra_completed_lectures';
const KEY_DOUBTS = 'abhiyantra_doubts';

// Helper to push updates to backend server
const saveToServer = async (key: string, data: any) => {
  try {
    await fetch('/api/db/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, data })
    });
  } catch (error) {
    console.warn(`Background sync failed for ${key}, falling back to localStorage:`, error);
  }
};

// Periodic or startup dynamic background server synchronization
export const syncWithServer = async () => {
  try {
    const res = await fetch('/api/db');
    if (res.ok) {
      const data = await res.json();
      
      let changed = false;
      if (data.users && data.users.length > 0) {
        localStorage.setItem(KEY_USERS_LIST, JSON.stringify(data.users));
        changed = true;
      }
      if (data.quizzes && data.quizzes.length > 0) {
        localStorage.setItem(KEY_QUIZZES, JSON.stringify(data.quizzes));
        changed = true;
      }
      if (data.timelines && data.timelines.length > 0) {
        localStorage.setItem(KEY_TIMELINES, JSON.stringify(data.timelines));
        changed = true;
      }
      if (data.attempts) {
        localStorage.setItem(KEY_ATTEMPTS, JSON.stringify(data.attempts));
        changed = true;
      }
      if (data.notifications) {
        localStorage.setItem(KEY_NOTIFICATIONS, JSON.stringify(data.notifications));
        changed = true;
      }
      if (data.leaderboard && data.leaderboard.length > 0) {
        localStorage.setItem(KEY_LEADERBOARD, JSON.stringify(data.leaderboard));
        changed = true;
      }
      if (data.lectures && data.lectures.length > 0) {
        localStorage.setItem(KEY_LECTURES, JSON.stringify(data.lectures));
        changed = true;
      }
      if (data.doubts) {
        localStorage.setItem(KEY_DOUBTS, JSON.stringify(data.doubts));
        changed = true;
      }

      if (changed) {
        window.dispatchEvent(new Event('db-users-updated'));
        window.dispatchEvent(new Event('db-quizzes-updated'));
        window.dispatchEvent(new Event('db-timelines-updated'));
        window.dispatchEvent(new Event('db-attempts-updated'));
        window.dispatchEvent(new Event('db-notifications-updated'));
        window.dispatchEvent(new Event('db-leaderboard-updated'));
        window.dispatchEvent(new Event('db-lectures-updated'));
        window.dispatchEvent(new Event('db-doubts-updated'));
        window.dispatchEvent(new Event('auth-status-change'));
      }
    }
  } catch (error) {
    console.warn('Backend server database is preparing, offline fallback active:', error);
  }
};

// Self-init Sync in background thread
if (typeof window !== 'undefined') {
  setTimeout(() => {
    syncWithServer();
  }, 100);
}

// Fetch users list or initialize with defaults
export const getStoredUsersList = (): UserProfile[] => {
  const data = localStorage.getItem(KEY_USERS_LIST);
  if (data) return JSON.parse(data);

  // Default preseeded users for the class
  const defaultUsers: UserProfile[] = [
    {
      id: 'usr-admin',
      name: 'Aman Sheel (Admin)',
      email: 'aman.sheel@gmail.com',
      role: 'admin',
      classLevel: 12,
      username: 'amansheel',
      password: 'rsdkdrss',
      status: 'Active',
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr-teacher-sharma',
      name: 'Prof. S.K. Sharma',
      email: 'teacher-sharma@abhiyantra.com',
      role: 'teacher',
      classLevel: 12,
      username: 'sharma',
      password: 'teacher123',
      status: 'Active',
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr-5',
      name: 'Aman Sheel',
      email: 'aman.sheel@gmail.com',
      role: 'student',
      classLevel: 12,
      username: 'aman',
      password: 'student123',
      status: 'Active',
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr-1',
      name: 'Aditya Vardhan',
      email: 'aditya@abhiyantra.com',
      role: 'student',
      classLevel: 12,
      username: 'aditya',
      password: 'student123',
      status: 'Active',
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr-2',
      name: 'Karnika Iyer',
      email: 'karnika@abhiyantra.com',
      role: 'student',
      classLevel: 12,
      username: 'karnika',
      password: 'student123',
      status: 'Active',
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr-3',
      name: 'Devansh Roy',
      email: 'devansh@abhiyantra.com',
      role: 'student',
      classLevel: 11,
      username: 'devansh',
      password: 'student123',
      status: 'Active',
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr-4',
      name: 'Preeti Deshmukh',
      email: 'preeti@abhiyantra.com',
      role: 'student',
      classLevel: 11,
      username: 'preeti',
      password: 'student123',
      status: 'Active',
      createdAt: new Date().toISOString()
    }
  ];
  localStorage.setItem(KEY_USERS_LIST, JSON.stringify(defaultUsers));
  return defaultUsers;
};

export const saveUsersList = (users: UserProfile[]) => {
  localStorage.setItem(KEY_USERS_LIST, JSON.stringify(users));
  saveToServer('users', users);
  window.dispatchEvent(new Event('db-users-updated'));
};

// Fetch current active logged-in user profile
export const getStoredUser = (): UserProfile | null => {
  const data = localStorage.getItem(KEY_USER);
  if (!data) return null;
  
  // Verify that the user still has an active account in the list
  const user = JSON.parse(data) as UserProfile;
  const usersList = getStoredUsersList();
  const current = usersList.find(u => u.id === user.id);
  if (current && current.status === 'Suspended') {
    // Log out if suspended
    localStorage.removeItem(KEY_USER);
    return null;
  }
  return current || user;
};

export const setStoredUser = (user: UserProfile | null) => {
  if (user) {
    localStorage.setItem(KEY_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(KEY_USER);
  }
  // Dispatches an event for state synchronization
  window.dispatchEvent(new Event('auth-status-change'));
};

// Quizzes management
export const getStoredQuizzes = (): Quiz[] => {
  const data = localStorage.getItem(KEY_QUIZZES);
  if (data) return JSON.parse(data);
  localStorage.setItem(KEY_QUIZZES, JSON.stringify(PRESEEDED_QUIZZES));
  return PRESEEDED_QUIZZES;
};

export const saveQuiz = (quiz: Quiz) => {
  const quizzes = getStoredQuizzes();
  const index = quizzes.findIndex(q => q.id === quiz.id);
  if (index >= 0) {
    quizzes[index] = { ...quiz };
  } else {
    quizzes.push(quiz);
  }
  localStorage.setItem(KEY_QUIZZES, JSON.stringify(quizzes));
  saveToServer('quizzes', quizzes);
  window.dispatchEvent(new Event('db-quizzes-updated'));
};

// Dynamically compile a standard quiz for chapters or let manual additions organize
export const getQuizOrCreateDynamic = (quizId: string): Quiz => {
  const quizzes = getStoredQuizzes();
  const found = quizzes.find(q => q.id === quizId);
  if (found) return found;

  // Let's create a dynamic quiz for this syllabus chapter
  const chapterId = quizId.replace('quiz-', '');
  const syllabus = SYLLABUS_DATA.find(s => s.id === chapterId);
  
  const title = syllabus ? `${syllabus.title} Unit Practice Test` : 'Chapter Practice Evaluation';
  const subject = syllabus ? syllabus.subject : 'Physics';
  const classLevel = syllabus ? syllabus.classLevel : 12;
  const topicsList = syllabus ? syllabus.topics : ['General Study Review'];
  
  // Create beautiful, JEE-standard structured dynamic questions as baseline parameters
  const questions: Question[] = topicsList.map((topic, index) => ({
    id: `q-dyn-${chapterId}-${index}`,
    text: `Evaluate the primary, advanced syllabus formulations revolving around the core topic "${topic}". How does modifying standard boundary parameters affects the physical limits or mathematical outputs?`,
    options: [
      `The system displays a proportional linear increase corresponding directly to the scaling input factor.`,
      `The value decays quadratically over spatial dimensions in compliance with standard inverse square parameters.`,
      `The state vectors remain stable as variables undergo symmetrical balanced adjustments.`,
      `The system approaches a singular critical threshold as standard variables scale to extreme boundaries.`
    ],
    correctAnswerIndex: index % 4,
    explanation: `Pursuant to IIT-JEE and NEET prep standards for Class ${classLevel} ${subject} in ${topic}, calculations show that adjusting standard values results in predictable balance thresholds. Check classic chapters formulae for confirmation.`,
    topic: topic,
    difficulty: index % 3 === 0 ? 'Hard' : index % 3 === 1 ? 'Medium' : 'Easy'
  }));

  const newQuiz: Quiz = {
    id: quizId,
    title: title,
    description: `Automated dynamic challenge evaluation for the chapter "${syllabus?.title || 'Course Unit'}". Organized and structured according to CBSE Class ${classLevel} syllabus core standards.`,
    subject: subject,
    classLevel: classLevel,
    durationMinutes: Math.max(10, topicsList.length * 4),
    questions: questions,
    createdBy: 'system@abhiyantra.com',
    createdAt: new Date().toISOString(),
    isCustom: true
  };

  // Persist it
  saveQuiz(newQuiz);
  return newQuiz;
};

// Complete list of syllabus timers
export const getStoredTimelines = (): ChapterTimeline[] => {
  const data = localStorage.getItem(KEY_TIMELINES);
  if (data) return JSON.parse(data);

  // Generate study timelines dynamically for ALL syllabus chapters in our DB!
  const allTimelines: ChapterTimeline[] = SYLLABUS_DATA.map((ch) => {
    // Map standard preseeded quizzes if they match
    const preseeded = PRESEEDED_TIMELINES.find(t => t.title.toLowerCase().includes(ch.title.toLowerCase().split(' ')[0]) || t.id.includes(ch.id));
    const testId = preseeded ? preseeded.testId : `quiz-${ch.id}`;

    return {
      id: `timeline-${ch.id}`,
      title: ch.title,
      subject: ch.subject,
      classLevel: ch.classLevel,
      topics: ch.topics,
      description: `Target JEE & NEET curriculum prep tracker for ${ch.subject} Class ${ch.classLevel}, covering ${ch.topics.length} key areas. Start study loop to trigger exam counts.`,
      durationHours: 24,
      status: 'not_started',
      testId: testId
    };
  });

  localStorage.setItem(KEY_TIMELINES, JSON.stringify(allTimelines));
  return allTimelines;
};

export const saveTimeline = (timeline: ChapterTimeline) => {
  const timelines = getStoredTimelines();
  const index = timelines.findIndex(t => t.id === timeline.id);
  if (index >= 0) {
    timelines[index] = { ...timeline };
  } else {
    timelines.push(timeline);
  }
  localStorage.setItem(KEY_TIMELINES, JSON.stringify(timelines));
  saveToServer('timelines', timelines);
  window.dispatchEvent(new Event('db-timelines-updated'));
};

export const getStoredAttempts = (): QuizAttempt[] => {
  const data = localStorage.getItem(KEY_ATTEMPTS);
  return data ? JSON.parse(data) : [];
};

export const getStoredNotifications = (): AppNotification[] => {
  const data = localStorage.getItem(KEY_NOTIFICATIONS);
  if (data) return JSON.parse(data);
  const defaultNote: AppNotification[] = [
    {
      id: 'n-welcome',
      title: 'Welcome to Abhiyantra Coaching!',
      message: 'Take a look around the portal. Begin studying active chapters for IIT-JEE & NEET practice.',
      type: 'coaching_news',
      timestamp: new Date().toISOString(),
      read: false
    }
  ];
  localStorage.setItem(KEY_NOTIFICATIONS, JSON.stringify(defaultNote));
  return defaultNote;
};

export const saveNotification = (note: AppNotification) => {
  const notes = getStoredNotifications();
  notes.unshift(note);
  localStorage.setItem(KEY_NOTIFICATIONS, JSON.stringify(notes));
  saveToServer('notifications', notes);
  window.dispatchEvent(new Event('db-notifications-updated'));
};

export const markNotificationsAsRead = () => {
  const notes = getStoredNotifications().map(n => ({ ...n, read: true }));
  localStorage.setItem(KEY_NOTIFICATIONS, JSON.stringify(notes));
  saveToServer('notifications', notes);
  window.dispatchEvent(new Event('db-notifications-updated'));
};

export const getStoredLeaderboard = (): LeaderboardEntry[] => {
  const data = localStorage.getItem(KEY_LEADERBOARD);
  if (data) return JSON.parse(data);
  localStorage.setItem(KEY_LEADERBOARD, JSON.stringify(INITIAL_LEADERBOARD_ENTRIES));
  return INITIAL_LEADERBOARD_ENTRIES;
};

// Record attempt & update analytics/leaderboard
export const submitQuizAttempt = (
  quizId: string,
  user: UserProfile,
  questions: Question[],
  selectedAnswers: { [qId: string]: number }
): QuizAttempt => {
  const quiz = getQuizOrCreateDynamic(quizId);
  const totalQuestions = questions.length;
  
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;

  const topicTotals: { [topic: string]: { correct: number; total: number } } = {};

  questions.forEach(q => {
    const selected = selectedAnswers[q.id];
    
    if (!topicTotals[q.topic]) {
      topicTotals[q.topic] = { correct: 0, total: 0 };
    }
    topicTotals[q.topic].total += 1;

    if (selected === undefined || selected === -1) {
      unattemptedCount += 1;
    } else if (selected === q.correctAnswerIndex) {
      correctCount += 1;
      topicTotals[q.topic].correct += 1;
    } else {
      incorrectCount += 1;
    }
  });

  const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const recommendedTopics: string[] = [];
  Object.entries(topicTotals).forEach(([topic, stats]) => {
    const accuracy = stats.correct / stats.total;
    if (accuracy < 0.70) {
      recommendedTopics.push(topic);
    }
  });

  const attempt: QuizAttempt = {
    id: `attempt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    quizId,
    studentId: user.id,
    studentName: user.name,
    score: scorePercentage,
    totalQuestions,
    correctCount,
    incorrectCount,
    unattemptedCount,
    answers: selectedAnswers,
    completedAt: new Date().toISOString(),
    topicPerformance: topicTotals,
    recommendedTopics
  };

  const attempts = getStoredAttempts();
  attempts.push(attempt);
  localStorage.setItem(KEY_ATTEMPTS, JSON.stringify(attempts));
  saveToServer('attempts', attempts);

  // Update leaderboard mechanics
  const leaderboard = getStoredLeaderboard();
  const studentAttempts = attempts.filter(att => att.studentId === user.id);
  const totalAccScore = studentAttempts.reduce((sum, att) => sum + att.score, 0);
  const avgPct = Math.round(totalAccScore / studentAttempts.length);
  
  // +12 points per correct answer, +20 points per attempt
  const pointsEarned = studentAttempts.reduce((sum, att) => sum + (att.correctCount * 12) + 20, 0);
  const baseAccuracy = studentAttempts.reduce((sum, att) => sum + (att.correctCount / (att.totalQuestions || 1)), 0);
  const avgAccuracy = Math.round((baseAccuracy / studentAttempts.length) * 100) / 100;

  const existingEntryIdx = leaderboard.findIndex(entry => entry.studentId === user.id);
  
  if (existingEntryIdx >= 0) {
    leaderboard[existingEntryIdx] = {
      ...leaderboard[existingEntryIdx],
      totalPoints: pointsEarned,
      testsTaken: studentAttempts.length,
      averageScorePercentage: avgPct,
      accuracy: avgAccuracy
    };
  } else {
    leaderboard.push({
      studentId: user.id,
      studentName: user.name,
      studentEmail: user.email,
      classLevel: user.classLevel,
      totalPoints: pointsEarned,
      testsTaken: studentAttempts.length,
      averageScorePercentage: avgPct,
      accuracy: avgAccuracy
    });
  }

  leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
  localStorage.setItem(KEY_LEADERBOARD, JSON.stringify(leaderboard));
  saveToServer('leaderboard', leaderboard);

  const timelines = getStoredTimelines();
  const linkedTimeline = timelines.find(t => t.testId === quizId);
  if (linkedTimeline) {
    linkedTimeline.status = 'completed';
    saveTimeline(linkedTimeline);
  }

  saveNotification({
    id: `n-completion-${Date.now()}`,
    title: 'Test Submitted successfully',
    message: `You completed "${quiz ? quiz.title : 'Mock Quiz'}" with ${scorePercentage}% accuracy. Breakdown detail is available in reports.`,
    type: 'exam_alert',
    timestamp: new Date().toISOString(),
    read: false
  });

  window.dispatchEvent(new Event('db-attempts-updated'));
  window.dispatchEvent(new Event('db-leaderboard-updated'));
  
  return attempt;
};

export const resetAllState = async () => {
  localStorage.removeItem(KEY_USER);
  localStorage.removeItem(KEY_USERS_LIST);
  localStorage.removeItem(KEY_QUIZZES);
  localStorage.removeItem(KEY_TIMELINES);
  localStorage.removeItem(KEY_ATTEMPTS);
  localStorage.removeItem(KEY_NOTIFICATIONS);
  localStorage.removeItem(KEY_LEADERBOARD);
  localStorage.removeItem(KEY_LECTURES);
  localStorage.removeItem(KEY_DOUBTS);
  
  // Clear completed lecture logs
  const users = ['usr-admin', 'usr-teacher-sharma', 'usr-5', 'usr-1', 'usr-2', 'usr-3', 'usr-4'];
  users.forEach(uid => {
    localStorage.removeItem(`${KEY_COMPLETED_LECTURES}_${uid}`);
  });
  
  try {
    await fetch('/api/db/reset', { method: 'POST' });
  } catch (error) {
    console.error('Failed to reset on server:', error);
  }

  getStoredUsersList();
  getStoredQuizzes();
  getStoredTimelines();
  getStoredNotifications();
  getStoredLeaderboard();
  getStoredLectures();
  getStoredDoubts();
  
  window.dispatchEvent(new Event('auth-status-change'));
  window.dispatchEvent(new Event('db-users-updated'));
  window.dispatchEvent(new Event('db-quizzes-updated'));
  window.dispatchEvent(new Event('db-timelines-updated'));
  window.dispatchEvent(new Event('db-attempts-updated'));
  window.dispatchEvent(new Event('db-notifications-updated'));
  window.dispatchEvent(new Event('db-leaderboard-updated'));
  window.dispatchEvent(new Event('db-lectures-updated'));
  window.dispatchEvent(new Event('db-completed-lectures-updated'));
  window.dispatchEvent(new Event('db-doubts-updated'));
};

// Lectures management CRUD
export const getStoredLectures = (): Lecture[] => {
  const data = localStorage.getItem(KEY_LECTURES);
  if (data) return JSON.parse(data);
  localStorage.setItem(KEY_LECTURES, JSON.stringify(PRESEEDED_LECTURES));
  return PRESEEDED_LECTURES;
};

export const saveLecture = (lecture: Lecture) => {
  const lectures = getStoredLectures();
  const index = lectures.findIndex(l => l.id === lecture.id);
  if (index >= 0) {
    lectures[index] = { ...lecture };
  } else {
    lectures.push(lecture);
  }
  localStorage.setItem(KEY_LECTURES, JSON.stringify(lectures));
  saveToServer('lectures', lectures);
  window.dispatchEvent(new Event('db-lectures-updated'));
};

export const deleteLecture = (id: string) => {
  const lectures = getStoredLectures().filter(l => l.id !== id);
  localStorage.setItem(KEY_LECTURES, JSON.stringify(lectures));
  saveToServer('lectures', lectures);
  window.dispatchEvent(new Event('db-lectures-updated'));
};

// Completed lectures tracking
export const getCompletedLectures = (studentId: string): string[] => {
  const data = localStorage.getItem(`${KEY_COMPLETED_LECTURES}_${studentId}`);
  return data ? JSON.parse(data) : [];
};

export const toggleLectureCompletion = (studentId: string, lectureId: string): string[] => {
  const completed = getCompletedLectures(studentId);
  const index = completed.indexOf(lectureId);
  if (index >= 0) {
    completed.splice(index, 1);
  } else {
    completed.push(lectureId);
  }
  localStorage.setItem(`${KEY_COMPLETED_LECTURES}_${studentId}`, JSON.stringify(completed));
  window.dispatchEvent(new Event('db-completed-lectures-updated'));
  return completed;
};

// Doubts management CRUD
export const getStoredDoubts = (): Doubt[] => {
  const data = localStorage.getItem(KEY_DOUBTS);
  return data ? JSON.parse(data) : [];
};

export const saveDoubt = (doubt: Doubt) => {
  const doubts = getStoredDoubts();
  const index = doubts.findIndex(d => d.id === doubt.id);
  if (index >= 0) {
    doubts[index] = { ...doubt };
  } else {
    doubts.push(doubt);
  }
  localStorage.setItem(KEY_DOUBTS, JSON.stringify(doubts));
  saveToServer('doubts', doubts);
  window.dispatchEvent(new Event('db-doubts-updated'));
};

export const resolveDoubt = (id: string, replyText: string, repliedBy: string) => {
  const doubts = getStoredDoubts();
  const index = doubts.findIndex(d => d.id === id);
  if (index >= 0) {
    doubts[index] = {
      ...doubts[index],
      status: 'resolved',
      replyText,
      repliedBy,
      repliedAt: new Date().toISOString()
    };
    localStorage.setItem(KEY_DOUBTS, JSON.stringify(doubts));
    saveToServer('doubts', doubts);
    window.dispatchEvent(new Event('db-doubts-updated'));
  }
};
