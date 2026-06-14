import React, { useState, useEffect } from 'react';
import { UserProfile, AppNotification } from '../types';
import { getStoredNotifications, markNotificationsAsRead, resetAllState, setStoredUser, getStoredUsersList } from '../lib/dbStore';
import { Bell, GraduationCap, ShieldCheck, RefreshCw, LogOut, Sparkles, User, HelpCircle, Video, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  user: UserProfile;
  onChangeUser: (user: UserProfile) => void;
  currentTab: string;
  onChangeTab: (tab: string) => void;
  onLogout: () => void;
}

export default function Header({ user, onChangeUser, currentTab, onChangeTab, onLogout }: HeaderProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showBellMenu, setShowBellMenu] = useState(false);
  const [syncedStatus, setSyncedStatus] = useState<'synced' | 'syncing'>('synced');

  useEffect(() => {
    const handleUpdate = () => {
      setNotifications(getStoredNotifications());
    };
    handleUpdate();

    window.addEventListener('db-notifications-updated', handleUpdate);
    return () => {
      window.removeEventListener('db-notifications-updated', handleUpdate);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleRead = () => {
    markNotificationsAsRead();
    setNotifications(getStoredNotifications());
  };

  // Helper evaluator quick switcher - cycles admin -> teacher -> student
  const cycleSimulatorUser = () => {
    setSyncedStatus('syncing');
    const list = getStoredUsersList();
    setTimeout(() => {
      if (user.role === 'student') {
        const foundTeacher = list.find(u => u.role === 'teacher') || list[1];
        onChangeUser(foundTeacher);
        onChangeTab('teacher-dashboard');
      } else if (user.role === 'teacher') {
        const foundAdmin = list.find(u => u.role === 'admin') || list[0];
        onChangeUser(foundAdmin);
        onChangeTab('admin-console');
      } else {
        const foundStudent = list.find(u => u.username === 'aman') || list[2];
        onChangeUser(foundStudent);
        onChangeTab('timeline');
      }
      setSyncedStatus('synced');
    }, 400);
  };

  const triggerReset = () => {
    if (window.confirm('Reset all portal records to initial pre-seeded classes and accounts?')) {
      resetAllState();
      window.location.reload();
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 border-b border-slate-200 backdrop-blur-md text-slate-800 shadow-sm px-4 sm:px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand logo signature */}
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-2xl text-white font-bold tracking-wider shadow-md flex items-center justify-center">
            <GraduationCap className="h-6 w-6 stroke-[2]" />
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-[0.25em] text-indigo-600 font-extrabold block">Classes 11 & 12 • IIT-JEE & NEET</span>
            <h1 className="text-lg font-black text-slate-900 tracking-tight font-display">
              abhiyantra <span className="text-indigo-600 font-bold">coaching</span>
            </h1>
          </div>
        </div>

        {/* Dynamic Context Tabs based on user's authorized permission role */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/60 gap-1 overflow-x-auto w-full md:w-auto">
          {user.role === 'student' && (
            <>
              <button
                type="button"
                onClick={() => onChangeTab('timeline')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${currentTab === 'timeline' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Study Board
              </button>
              <button
                type="button"
                onClick={() => onChangeTab('lectures')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${currentTab === 'lectures' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Video Lectures
              </button>
              <button
                type="button"
                onClick={() => onChangeTab('schedule')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${currentTab === 'schedule' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Test Calendar
              </button>
              <button
                type="button"
                onClick={() => onChangeTab('analytics')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${currentTab === 'analytics' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'}`}
              >
                My Reports
              </button>
              <button
                type="button"
                onClick={() => onChangeTab('leaderboard')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${currentTab === 'leaderboard' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Leaderboard
              </button>
            </>
          )}

          {user.role === 'teacher' && (
            <>
              <button
                type="button"
                onClick={() => onChangeTab('timeline')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${currentTab === 'timeline' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Study Board
              </button>
              <button
                type="button"
                onClick={() => onChangeTab('teacher-dashboard')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${currentTab === 'teacher-dashboard' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Faculty Console
              </button>
              <button
                type="button"
                onClick={() => onChangeTab('lectures')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${currentTab === 'lectures' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Video Lectures
              </button>
              <button
                type="button"
                onClick={() => onChangeTab('schedule')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${currentTab === 'schedule' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Test Calendar
              </button>
              <button
                type="button"
                onClick={() => onChangeTab('leaderboard')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${currentTab === 'leaderboard' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Leaderboard
              </button>
            </>
          )}

          {user.role === 'admin' && (
            <>
              <button
                type="button"
                onClick={() => onChangeTab('timeline')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${currentTab === 'timeline' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Study Board
              </button>
              <button
                type="button"
                onClick={() => onChangeTab('admin-console')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${currentTab === 'admin-console' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Admin Control Panel
              </button>
              <button
                type="button"
                onClick={() => onChangeTab('lectures')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${currentTab === 'lectures' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Video Lectures
              </button>
              <button
                type="button"
                onClick={() => onChangeTab('schedule')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${currentTab === 'schedule' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Test Calendar
              </button>
              <button
                type="button"
                onClick={() => onChangeTab('teacher-dashboard')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${currentTab === 'teacher-dashboard' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Question Form (As Admin)
              </button>
              <button
                type="button"
                onClick={() => onChangeTab('leaderboard')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${currentTab === 'leaderboard' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Leaderboard
              </button>
            </>
          )}
        </div>

        {/* Identity, notifications trigger dropdown, logout action */}
        <div className="flex items-center gap-2.5 justify-end w-full md:w-auto">
          
          {/* Synchronized simulation status resetting button */}
          <button 
            type="button"
            title="Wipe database cache & restart simulation"
            onClick={triggerReset}
            className="p-2 border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {/* Quick-access START CLASS button for teachers/admins — always visible, never hidden */}
          {(user.role === 'teacher' || user.role === 'admin') && (
            <button
              type="button"
              onClick={() => {
                // Navigate to the correct console tab first
                onChangeTab(user.role === 'admin' ? 'admin-console' : 'teacher-dashboard');
                // Dispatch a global event that TeacherConsole / AdminConsole listens to
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('open-start-class-modal'));
                }, 80);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs rounded-xl transition-all shadow-md border border-indigo-700 cursor-pointer shrink-0 whitespace-nowrap"
              title="Open live classroom panel to start and link a class"
            >
              <Video className="h-3.5 w-3.5 animate-pulse" />
              Start Class
            </button>
          )}

          {/* Real-time Alerts notifications bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowBellMenu(!showBellMenu);
                if (!showBellMenu) handleRead();
              }}
              className="p-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100/75 rounded-xl transition-all relative cursor-pointer"
            >
              <Bell className="h-4 w-4 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white font-bold text-[9px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Drawer */}
            <AnimatePresence>
              {showBellMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-3.5 w-80 bg-white border border-slate-200 rounded-[1.75rem] shadow-xl p-4 text-slate-800"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <span className="font-extrabold text-xs tracking-tight text-slate-800 uppercase font-mono">Exam Alerts</span>
                    <button 
                      type="button"
                      onClick={() => setShowBellMenu(false)}
                      className="text-slate-400 hover:text-slate-700 text-[10px] font-bold uppercase"
                    >
                      Dismiss
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-slate-400 text-center py-4 text-xs italic">No alerts.</p>
                    ) : (
                      notifications.map(note => (
                        <div key={note.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs hover:bg-slate-100/30 transition-all">
                          <div className="flex gap-1.5 items-center mb-1 text-slate-800 font-bold">
                            <span className="h-2 w-2 rounded-full bg-indigo-600 shrink-0"></span>
                            <h4>{note.title}</h4>
                          </div>
                          <p className="text-slate-500 leading-relaxed font-medium mb-1.5">{note.message}</p>
                          <span className="text-[9px] text-slate-400 font-mono block text-right">
                            {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User badge display + logout pill */}
          <div className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="text-left leading-tight hidden sm:block">
              <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">
                Authorized {user.role}
              </span>
              <span className="text-xs font-extrabold text-slate-700 block pr-2">
                {user.name.split(' ')[0]} {user.role === 'student' ? `(Class ${user.classLevel})` : ''}
              </span>
            </div>
            
            {/* Quick Demo Shift - Only visible to admin users */}
            {user.role === 'admin' && (
              <button
                type="button"
                onClick={cycleSimulatorUser}
                title="Test Suite Shift (Quick-Switch Roles)"
                className="p-1 px-1.5 bg-indigo-50 border border-indigo-200/50 hover:bg-indigo-100 text-indigo-700 text-[9px] font-bold uppercase rounded-lg transition-all cursor-pointer"
              >
                Role Swift
              </button>
            )}

            {/* Standard Credentials Sign Out */}
            <button
              type="button"
              onClick={onLogout}
              title="Log out from session"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}
