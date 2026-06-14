import React, { useState, useEffect } from 'react';
import { UserProfile, Quiz } from './types';
import { getStoredUser, setStoredUser, getStoredQuizzes, getStoredAttempts } from './lib/dbStore';
import Header from './components/Header';
import TimelineInteractive from './components/TimelineInteractive';
import AnalyticsPanel from './components/AnalyticsPanel';
import LeaderboardView from './components/LeaderboardView';
import TeacherConsole from './components/TeacherConsole';
import AdminConsole from './components/AdminConsole';
import ActiveTestArena from './components/ActiveTestArena';
import TestScheduleCalendar from './components/TestScheduleCalendar';
import AuthScreen from './components/AuthScreen';
import LecturesPanel from './components/LecturesPanel';
import { Sparkles, Trophy, BookOpen, GraduationCap, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(getStoredUser());
  const [currentTab, setCurrentTab] = useState<string>(() => {
    return localStorage.getItem('abhiyantra_active_tab') || 'timeline';
  });
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [completedQuizzes, setCompletedQuizzes] = useState<string[]>([]);

  useEffect(() => {
    if (currentTab) {
      localStorage.setItem('abhiyantra_active_tab', currentTab);
    }
  }, [currentTab]);

  useEffect(() => {
    // Synchronize authentication status and update default tab on login shift
    const syncAuth = () => {
      const u = getStoredUser();
      setUser(u);
      
      if (u) {
        // Automatically route default tabs premiumly based on active role
        const savedTab = localStorage.getItem('abhiyantra_active_tab');
        if (savedTab) {
          setCurrentTab(savedTab);
        } else {
          if (u.role === 'admin') {
            setCurrentTab('admin-console');
          } else if (u.role === 'teacher') {
            setCurrentTab('teacher-dashboard');
          } else {
            setCurrentTab('timeline');
          }
        }

        // Load completed quiz histories for student tracking
        const completed = getStoredAttempts()
          .filter(a => a.studentId === u.id)
          .map(a => a.quizId);
        setCompletedQuizzes(completed);
      }
    };
    syncAuth();

    window.addEventListener('auth-status-change', syncAuth);
    window.addEventListener('db-attempts-updated', syncAuth);
    return () => {
      window.removeEventListener('auth-status-change', syncAuth);
      window.removeEventListener('db-attempts-updated', syncAuth);
    };
  }, []);

  const handleUserChange = (newUser: UserProfile) => {
    setStoredUser(newUser);
    setUser(newUser);
  };

  const handleLogout = () => {
    setStoredUser(null);
    setUser(null);
  };

  const handleEnterTest = (quizId: string) => {
    setActiveQuizId(quizId);
  };

  const handleAttemptSubmitted = () => {
    if (!user) return;
    if (user.role === 'student') {
      // Refresh completed stats
      const completed = getStoredAttempts()
        .filter(a => a.studentId === user.id)
        .map(a => a.quizId);
      setCompletedQuizzes(completed);
      setCurrentTab('analytics'); // Redirect student directly to detailed analytics
    } else {
      // Teacher or Admin completed dynamic demo evaluation
      alert(`🔬 Demo Attempt Submitted Successfully!\n\nFantastic job! Under teacher or admin role, this test run behaves as a sandbox preview. Your scores are processed for preview, but do not override competitive student leaderboards.`);
      if (user.role === 'admin') {
        setCurrentTab('admin-console');
      } else {
        setCurrentTab('teacher-dashboard');
      }
    }
  };

  const currentQuiz = activeQuizId ? getStoredQuizzes().find(q => q.id === activeQuizId) : null;

  // Unauthorised session Gate
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-indigo-600 selection:text-white font-sans">
        <AuthScreen onLoginSuccess={handleUserChange} />
        
        {/* FOOTER CO-BRANDING */}
        <footer className="py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="font-medium">© {new Date().getFullYear()} Abhiyantra JEE-NEET Academic Center. All rights reserved.</span>
            <span className="font-medium text-slate-400">made with love by abhiyantra</span>
            <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded-md text-slate-500">Secure AES Session Auth</span>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-indigo-600 selection:text-white font-sans">
      
      {/* Immersive Arena Overlay if quiz is active */}
      {currentQuiz ? (
        <main className="flex-grow p-4 sm:p-6 md:p-8 flex items-center justify-center">
          <div className="w-full max-w-6xl">
            <ActiveTestArena
              quiz={currentQuiz}
              user={user}
              onClose={() => setActiveQuizId(null)}
              onAttemptSubmitted={handleAttemptSubmitted}
            />
          </div>
        </main>
      ) : (
        <>
          {/* Main Navigation Header */}
          <Header
            user={user}
            onChangeUser={handleUserChange}
            currentTab={currentTab}
            onChangeTab={setCurrentTab}
            onLogout={handleLogout}
          />

          {/* Core App Stage Panel */}
          <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              
              {currentTab === 'timeline' && (
                <motion.div
                  key="timeline"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                >
                  {/* Student Welcome Banner styled as a gorgeous Bento header */}
                  <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 border border-indigo-500/30 rounded-[2rem] p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl overflow-hidden">
                    {/* Decorative rings */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-24 -mt-24 pointer-events-none" />
                    <div className="absolute bottom-0 left-20 w-40 h-40 bg-violet-500/20 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row relative z-10">
                      <div className="p-3.5 bg-white/15 text-white rounded-2xl border border-white/20 backdrop-blur-sm">
                        <Sparkles className="h-6 w-6 stroke-[2]" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-white tracking-tight font-display">Welcome back, {user.name}! 🚀</h4>
                        <p className="text-xs text-indigo-200 mt-1 max-w-xl">Select a chapter, watch your lecture, finish the DPP — and watch your rank climb. Every class counts!</p>
                      </div>
                    </div>
                    {completedQuizzes.length > 0 && (
                      <span className="relative z-10 px-4 py-2 bg-white/15 text-white border border-white/25 rounded-2xl text-xs font-bold tracking-wide shadow-sm shrink-0 backdrop-blur-sm">
                        ✨ {completedQuizzes.length} Tests Cleared
                      </span>
                    )}
                  </div>

                  <TimelineInteractive
                    user={user}
                    onEnterTest={handleEnterTest}
                    completedQuizzes={completedQuizzes}
                  />
                </motion.div>
              )}

              {currentTab === 'lectures' && (
                <motion.div
                  key="lectures"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                >
                  <LecturesPanel user={user} onEnterTest={handleEnterTest} />
                </motion.div>
              )}

              {currentTab === 'schedule' && (
                <motion.div
                  key="schedule"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                >
                  <TestScheduleCalendar
                    user={user}
                    onEnterTest={handleEnterTest}
                  />
                </motion.div>
              )}

              {currentTab === 'analytics' && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                >
                  <AnalyticsPanel user={user} />
                </motion.div>
              )}

              {currentTab === 'leaderboard' && (
                <motion.div
                  key="leaderboard"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                >
                  <LeaderboardView />
                </motion.div>
              )}

              {currentTab === 'teacher-dashboard' && (
                <motion.div
                  key="teacher-dashboard"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                >
                  <TeacherConsole user={user} onEnterTest={handleEnterTest} />
                </motion.div>
              )}

              {currentTab === 'admin-console' && (
                <motion.div
                  key="admin-console"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                >
                  <AdminConsole user={user} onEnterTest={handleEnterTest} />
                </motion.div>
              )}

            </AnimatePresence>
          </main>
        </>
      )}

      {/* FOOTER CO-BRANDING */}
      <footer className="py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-medium">© {new Date().getFullYear()} Abhiyantra IIT-JEE & NEET Academy. All rights reserved.</span>
          <span className="font-medium text-slate-400">made with love by abhiyantra</span>
          <div className="flex items-center gap-1.5 font-mono text-[10px] bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Cloud State Synced (Local Persistence ACTIVE)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
