import React, { useState, useEffect } from 'react';
import { UserProfile, Quiz, Question, Subject, Lecture } from '../types';
import { getStoredUsersList, saveUsersList, getStoredQuizzes, saveQuiz, getStoredAttempts, saveNotification, getStoredLectures, saveLecture, deleteLecture } from '../lib/dbStore';
import { SYLLABUS_DATA } from '../lib/syllabus';
import {
  Users, ShieldCheck, UserX, UserCheck, AlertTriangle, ToggleLeft, ToggleRight,
  Sparkles, Plus, Image, Check, RefreshCw, Trash2, Award, Video, BookOpen, Clock,
  CheckSquare, FileText, X, Layers, Atom, FlaskConical, Calculator, Leaf, Settings,
  BarChart2, Shield, Crown, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import QuestionsInventory from './QuestionsInventory';

interface AdminConsoleProps {
  user: UserProfile;
  onEnterTest?: (quizId: string) => void;
}

const SUBJECT_MAP = {
  Physics: { icon: Atom, color: 'from-blue-500 to-indigo-600', light: 'bg-blue-50 text-blue-700 border-blue-200', pill: 'bg-blue-100 text-blue-700', emoji: '⚛️' },
  Chemistry: { icon: FlaskConical, color: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50 text-emerald-700 border-emerald-200', pill: 'bg-emerald-100 text-emerald-700', emoji: '🧪' },
  Mathematics: { icon: Calculator, color: 'from-violet-500 to-purple-600', light: 'bg-violet-50 text-violet-700 border-violet-200', pill: 'bg-violet-100 text-violet-700', emoji: '∑' },
  Biology: { icon: Leaf, color: 'from-rose-500 to-pink-600', light: 'bg-rose-50 text-rose-700 border-rose-200', pill: 'bg-rose-100 text-rose-700', emoji: '🧬' },
};

export default function AdminConsole({ user, onEnterTest }: AdminConsoleProps) {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'class'>('users');

  // ── Start Class Modal ────────────────────────────────────────────────
  const [showStartClassModal, setShowStartClassModal] = useState(false);
  const [formStep, setFormStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [classSubject, setClassSubject] = useState<Subject>('Physics');
  const [classLevel, setClassLevel] = useState<11 | 12>(12);
  const [classChapterId, setClassChapterId] = useState('');
  const [classTopic, setClassTopic] = useState('');
  const [classTitle, setClassTitle] = useState('');
  const [classDescription, setClassDescription] = useState('');
  const [classVideoUrl, setClassVideoUrl] = useState('');
  const [classNotesUrl, setClassNotesUrl] = useState('');
  const [classDppQuizId, setClassDppQuizId] = useState('');
  const [classDuration, setClassDuration] = useState<number>(45);

  // ── Data ──────────────────────────────────────────────────────────────
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [quizzesList, setQuizzesList] = useState<Quiz[]>([]);
  const [attemptsCount, setAttemptsCount] = useState(0);

  const loadLectures = () => setLectures(getStoredLectures());
  const loadDatabase = () => {
    setUsersList(getStoredUsersList());
    setQuizzesList(getStoredQuizzes());
    setAttemptsCount(getStoredAttempts().length);
  };

  useEffect(() => {
    loadLectures();
    loadDatabase();
    window.addEventListener('db-lectures-updated', loadLectures);
    window.addEventListener('db-users-updated', loadDatabase);
    window.addEventListener('db-quizzes-updated', loadDatabase);
    const handleOpenModal = () => { setShowStartClassModal(true); setFormStep(1); setActiveSubTab('class'); };
    window.addEventListener('open-start-class-modal', handleOpenModal);
    return () => {
      window.removeEventListener('db-lectures-updated', loadLectures);
      window.removeEventListener('db-users-updated', loadDatabase);
      window.removeEventListener('db-quizzes-updated', loadDatabase);
      window.removeEventListener('open-start-class-modal', handleOpenModal);
    };
  }, []);

  const availableChapters = SYLLABUS_DATA.filter(c => c.subject === classSubject && c.classLevel === classLevel);
  const activeChapterData = SYLLABUS_DATA.find(c => c.id === classChapterId);

  useEffect(() => {
    const chs = SYLLABUS_DATA.filter(c => c.subject === classSubject && c.classLevel === classLevel);
    if (chs.length > 0) { setClassChapterId(chs[0].id); setClassTopic(chs[0].topics[0]); }
  }, [classSubject, classLevel]);

  useEffect(() => {
    if (activeChapterData && activeChapterData.topics.length > 0) {
      setClassTopic(activeChapterData.topics[0]);
      setClassTitle(`${activeChapterData.title} — ${activeChapterData.topics[0]}`);
    }
  }, [classChapterId]);

  useEffect(() => {
    if (classTopic && activeChapterData) setClassTitle(`${activeChapterData.title} — ${classTopic}`);
  }, [classTopic]);

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('drive.google.com')) {
      let fileId = '';
      if (url.includes('/file/d/')) { const m = url.split('/file/d/')[1]; fileId = m ? m.split('/')[0] : ''; }
      else if (url.includes('id=')) { const m = url.split('id=')[1]; fileId = m ? m.split('&')[0] : ''; }
      if (fileId) return `https://drive.google.com/file/d/${fileId.trim()}/preview`;
    }
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('v=')) { const m = url.split('v=')[1]; videoId = m ? m.split('&')[0] : ''; }
      else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1] || '';
      if (videoId) return `https://www.youtube.com/embed/${videoId.trim()}`;
    }
    return url;
  };

  const handlePublishClass = () => {
    if (!classTitle.trim() || !classVideoUrl.trim()) { alert('Please fill the class title and video URL.'); return; }
    const newLecture: Lecture = {
      id: `lec-${Date.now()}`, title: classTitle.trim(),
      description: classDescription.trim() || `${classSubject} class for Class ${classLevel}.`,
      subject: classSubject, classLevel, chapter: activeChapterData?.title, topic: classTopic,
      videoUrl: getEmbedUrl(classVideoUrl), notesUrl: classNotesUrl.trim() || undefined,
      dppQuizId: classDppQuizId || undefined, durationMinutes: Number(classDuration) || 45,
      addedBy: user.name, createdAt: new Date().toISOString()
    };
    saveLecture(newLecture);
    saveNotification({ id: `class-notif-${Date.now()}`, title: `🎥 New Class: ${classSubject}`,
      message: `${user.name} published "${classTitle.trim()}" for Class ${classLevel}.`,
      type: 'test_ready', timestamp: new Date().toISOString(), read: false });
    setShowStartClassModal(false); setFormStep(1);
    setClassTitle(''); setClassDescription(''); setClassVideoUrl('');
    setClassNotesUrl(''); setClassDppQuizId(''); setClassDuration(45);
    alert(`✅ Class published successfully!`);
  };

  const handleDeleteLecture = (id: string, name: string) => {
    if (window.confirm(`Delete class "${name}"?`)) deleteLecture(id);
  };

  // ── User Management ────────────────────────────────────────────────────
  const handleToggleUserStatus = (userId: string) => {
    const list = [...usersList];
    const idx = list.findIndex(u => u.id === userId);
    if (idx >= 0) {
      if (list[idx].id === user.id) { alert('Cannot suspend your own admin account.'); return; }
      list[idx].status = list[idx].status === 'Active' ? 'Suspended' : 'Active';
      saveUsersList(list); setUsersList(list);
      saveNotification({ id: `perm-${userId}-${Date.now()}`, title: 'Profile Updated',
        message: `"${list[idx].name}" status changed to ${list[idx].status}.`,
        type: 'coaching_news', timestamp: new Date().toISOString(), read: false });
    }
  };

  const handleApproveTeacher = (userId: string) => {
    const list = [...usersList]; const idx = list.findIndex(u => u.id === userId);
    if (idx >= 0) {
      list[idx].status = 'Active'; saveUsersList(list); setUsersList(list);
      saveNotification({ id: `approve-${userId}-${Date.now()}`, title: '🏛️ Faculty Approved',
        message: `${list[idx].name}'s credentials approved. Status is now Active.`,
        type: 'coaching_news', timestamp: new Date().toISOString(), read: false });
    }
  };

  const handleChangeUserRole = (userId: string, newRole: 'student' | 'teacher' | 'admin') => {
    const list = [...usersList]; const idx = list.findIndex(u => u.id === userId);
    if (idx >= 0) {
      if (list[idx].id === user.id) { alert('Cannot change your own admin role.'); return; }
      list[idx].role = newRole; saveUsersList(list); setUsersList(list);
    }
  };

  // ── MCQ Form ─────────────────────────────────────────────────────────
  const [targetSubject, setTargetSubject] = useState<'Physics' | 'Chemistry' | 'Mathematics'>('Physics');
  const [targetClass, setTargetClass] = useState<11 | 12>(12);
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState<string[]>(['', '', '', '']);
  const [correctIdx, setCorrectIdx] = useState<number>(0);
  const [qExplanation, setQExplanation] = useState('');
  const [qDifficulty, setQDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [qImageBase64, setQImageBase64] = useState<string>('');
  const [notificationMsg, setNotificationMsg] = useState('');

  useEffect(() => {
    const matched = SYLLABUS_DATA.filter(c => c.subject === targetSubject && c.classLevel === targetClass);
    if (matched.length > 0) { setSelectedChapterId(matched[0].id); setSelectedTopic(matched[0].topics[0]); }
  }, [targetSubject, targetClass]);

  useEffect(() => {
    if (selectedChapterId) {
      const ch = SYLLABUS_DATA.find(c => c.id === selectedChapterId);
      if (ch && ch.topics.length > 0) setSelectedTopic(ch.topics[0]);
    }
  }, [selectedChapterId]);

  const handleOptionChange = (idx: number, text: string) => {
    const opt = [...qOptions]; opt[idx] = text; setQOptions(opt);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const reader = new FileReader();
      reader.onloadend = () => { if (typeof reader.result === 'string') setQImageBase64(reader.result); };
      reader.readAsDataURL(files[0]);
    }
  };

  const handleSaveQuestionToChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim() || qOptions.some(o => !o.trim())) { alert('Complete the question and all 4 options.'); return; }
    if (!selectedChapterId) { alert('Select a chapter first.'); return; }
    const chapter = SYLLABUS_DATA.find(c => c.id === selectedChapterId);
    if (!chapter) return;
    const testId = `quiz-${chapter.id}`;
    const quizzes = getStoredQuizzes();
    let quiz = quizzes.find(q => q.id === testId);
    const newQ: Question = {
      id: `q-admin-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      text: qText.trim(), options: [...qOptions], correctAnswerIndex: correctIdx,
      explanation: qExplanation.trim() || 'Solution provided by admin.',
      topic: selectedTopic || chapter.topics[0], difficulty: qDifficulty, imageUrl: qImageBase64 || undefined
    };
    if (quiz) { quiz.questions = [...quiz.questions, newQ]; saveQuiz(quiz); }
    else {
      saveQuiz({
        id: testId, title: `${chapter.title} Practice Test`,
        description: `Practice for ${chapter.subject} Class ${chapter.classLevel}.`,
        subject: chapter.subject, classLevel: chapter.classLevel, durationMinutes: 15,
        questions: [newQ], createdBy: user.name, createdAt: new Date().toISOString(), isCustom: true
      });
    }
    setNotificationMsg(`Question deployed to "${chapter.title}"`);
    saveNotification({ id: `adminq-${Date.now()}`, title: '📖 Question Added',
      message: `Admin added MCQ to "${chapter.title} » ${selectedTopic}".`,
      type: 'exam_alert', timestamp: new Date().toISOString(), read: false });
    setQText(''); setQOptions(['', '', '', '']); setQExplanation(''); setQImageBase64('');
    setTimeout(() => setNotificationMsg(''), 5000);
  };

  const activeChapter = SYLLABUS_DATA.find(c => c.id === selectedChapterId);
  const subjectInfo = SUBJECT_MAP[classSubject];
  const STEPS = ['Subject & Class', 'Chapter', 'Topic', 'Title & Links', 'Review & Publish'];

  const studentsCount = usersList.filter(u => u.role === 'student').length;
  const teachersCount = usersList.filter(u => u.role === 'teacher').length;

  return (
    <div className="space-y-6 font-sans">

      {/* ── HERO BANNER ─────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-violet-950 border border-slate-700/50 rounded-[2.25rem] p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/10 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-violet-500/20 border border-violet-400/30 rounded-2xl text-violet-300 backdrop-blur-sm">
              <Crown className="h-7 w-7 stroke-[1.5]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-violet-400 font-extrabold mb-0.5">Admin Control Center</p>
              <h2 className="text-xl font-black text-white tracking-tight">Welcome, {user.name.split(' ')[0]} 👑</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-md">Full control over users, classes, tests, and the entire coaching ecosystem.</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-3 flex-wrap">
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-center backdrop-blur-sm min-w-[80px]">
              <span className="text-xl font-black text-white block font-mono">{usersList.length}</span>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Users</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-center backdrop-blur-sm min-w-[80px]">
              <span className="text-xl font-black text-violet-300 block font-mono">{quizzesList.length}</span>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Tests</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-center backdrop-blur-sm min-w-[80px]">
              <span className="text-xl font-black text-emerald-300 block font-mono">{attemptsCount}</span>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Submissions</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-center backdrop-blur-sm min-w-[80px]">
              <span className="text-xl font-black text-indigo-300 block font-mono">{lectures.length}</span>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Classes</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation in banner */}
        <div className="relative z-10 flex gap-2 mt-6">
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-5 py-2 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'users'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/50'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            <Users className="h-3.5 w-3.5" /> Users & MCQ
          </button>
          <button
            onClick={() => setActiveSubTab('class')}
            className={`px-5 py-2 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'class'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/50'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            <Video className="h-3.5 w-3.5" /> Live Classes
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ════════════════════════════════════════════════════════════
            USERS & MCQ TAB
        ════════════════════════════════════════════════════════════ */}
        {activeSubTab === 'users' && (
          <motion.div
            key="users-pane"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-6"
          >
            {/* Role breakdown cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Users className="h-5 w-5" /></div>
                <div>
                  <span className="text-xl font-black text-slate-800 font-mono block">{studentsCount}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Students</span>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><ShieldCheck className="h-5 w-5" /></div>
                <div>
                  <span className="text-xl font-black text-slate-800 font-mono block">{teachersCount}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Teachers</span>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-violet-50 text-violet-600 rounded-xl"><Crown className="h-5 w-5" /></div>
                <div>
                  <span className="text-xl font-black text-slate-800 font-mono block">{usersList.filter(u => u.role === 'admin').length}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Admins</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

              {/* LEFT: User Table */}
              <div className="xl:col-span-8">
                <div className="bg-white border border-slate-200 rounded-[2.25rem] shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Users className="h-5 w-5" /></div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">User Authorization & Permissions</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Manage roles, approve teachers, suspend accounts</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                          <th className="py-3 px-4">User</th>
                          <th className="py-3 px-4">Role</th>
                          <th className="py-3 px-4">Class</th>
                          <th className="py-3 px-4">Control</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {usersList.map((usr) => {
                          const isSelf = usr.id === user.id;
                          const isActive = usr.status !== 'Suspended';
                          const isPending = usr.status === 'Pending';
                          return (
                            <tr key={usr.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white ${
                                    usr.role === 'admin' ? 'bg-violet-600' : usr.role === 'teacher' ? 'bg-emerald-600' : 'bg-indigo-600'
                                  }`}>
                                    {usr.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                                      {usr.name}
                                      {isPending && <span className="text-[8px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-black uppercase animate-pulse">Pending</span>}
                                      {usr.status === 'Suspended' && <span className="text-[8px] bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-black uppercase">Suspended</span>}
                                      {isSelf && <span className="text-[8px] bg-violet-50 text-violet-700 border border-violet-200 px-1.5 py-0.5 rounded font-black uppercase">You</span>}
                                    </div>
                                    <div className="text-[10px] text-slate-400">{usr.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                {isSelf ? (
                                  <span className="px-2 py-1 bg-violet-50 text-violet-700 rounded-lg text-[10px] font-bold uppercase border border-violet-200">Admin</span>
                                ) : (
                                  <select value={usr.role} onChange={e => handleChangeUserRole(usr.id, e.target.value as any)}
                                    className="bg-slate-50 border border-slate-200 text-[11px] py-1.5 px-2 rounded-lg font-semibold text-slate-700 cursor-pointer focus:outline-none">
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {usr.role === 'student' ? (
                                  <span className="px-2 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[10px] font-bold">Class {usr.classLevel}</span>
                                ) : (
                                  <span className="text-indigo-600 font-bold bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-lg text-[10px]">Faculty</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {isSelf ? (
                                  <span className="text-[10px] text-emerald-600 font-bold uppercase flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Full Access</span>
                                ) : (
                                  <div className="flex gap-1.5 items-center flex-wrap">
                                    {isPending && (
                                      <button onClick={() => handleApproveTeacher(usr.id)}
                                        className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black transition-all shadow-sm cursor-pointer">
                                        <UserCheck className="h-3.5 w-3.5" /> APPROVE
                                      </button>
                                    )}
                                    <button onClick={() => handleToggleUserStatus(usr.id)}
                                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold transition-all border cursor-pointer ${
                                        isActive ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                      }`}>
                                      {isActive ? <><UserX className="h-3.5 w-3.5" /> SUSPEND</> : <><UserCheck className="h-3.5 w-3.5" /> ACTIVATE</>}
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* RIGHT: Question Deployer */}
              <div className="xl:col-span-4">
                <div className="bg-white border border-slate-200 rounded-[2.25rem] p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><Plus className="h-4 w-4" /></div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">Quick MCQ Deployer</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Add to any chapter instantly</p>
                    </div>
                  </div>

                  {notificationMsg && (
                    <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-2xl flex items-center gap-1.5">
                      <Check className="h-4 w-4 shrink-0" /> {notificationMsg}
                    </div>
                  )}

                  <form onSubmit={handleSaveQuestionToChapter} className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Class</label>
                        <select value={targetClass} onChange={e => setTargetClass(Number(e.target.value) as 11 | 12)}
                          className="w-full bg-slate-50 border border-slate-200 px-2.5 py-2 rounded-xl font-bold cursor-pointer text-slate-700">
                          <option value={11}>Class 11</option><option value={12}>Class 12</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Subject</label>
                        <select value={targetSubject} onChange={e => setTargetSubject(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 px-2.5 py-2 rounded-xl font-bold cursor-pointer text-slate-700">
                          <option value="Physics">⚛️ Physics</option><option value="Chemistry">🧪 Chemistry</option><option value="Mathematics">∑ Maths</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Chapter</label>
                      <select value={selectedChapterId} onChange={e => setSelectedChapterId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-2.5 py-2 rounded-xl font-semibold cursor-pointer text-slate-800">
                        {SYLLABUS_DATA.filter(c => c.subject === targetSubject && c.classLevel === targetClass).map(ch => (
                          <option key={ch.id} value={ch.id}>{ch.title}</option>
                        ))}
                      </select>
                    </div>

                    {activeChapter && (
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Topic</label>
                        <select value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 px-2.5 py-2 rounded-xl font-semibold cursor-pointer text-slate-800">
                          {activeChapter.topics.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Question Text</label>
                      <textarea placeholder="JEE/NEET MCQ question..." value={qText} onChange={e => setQText(e.target.value)}
                        rows={3} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-medium focus:outline-none focus:border-indigo-400 resize-none" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Options (A–D)</label>
                      {qOptions.map((opt, oIdx) => (
                        <div key={oIdx} className="flex gap-2 items-center">
                          <span className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-black shrink-0 ${oIdx === correctIdx ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <input type="text" placeholder={`Option ${String.fromCharCode(65 + oIdx)}`} value={opt}
                            onChange={e => handleOptionChange(oIdx, e.target.value)}
                            className="flex-1 bg-slate-50 border border-slate-200 px-2.5 py-2 rounded-xl focus:outline-none font-medium" />
                          <button type="button" onClick={() => setCorrectIdx(oIdx)}
                            className={`px-2 py-1 rounded text-[8px] font-black cursor-pointer transition-all ${oIdx === correctIdx ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>✓</button>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Answer</label>
                        <select value={correctIdx} onChange={e => setCorrectIdx(Number(e.target.value))}
                          className="w-full bg-emerald-50 border border-emerald-200 px-2 py-2 rounded-xl font-black text-emerald-700 cursor-pointer">
                          {qOptions.map((_, i) => <option key={i} value={i}>{String.fromCharCode(65 + i)}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Difficulty</label>
                        <select value={qDifficulty} onChange={e => setQDifficulty(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 px-2 py-2 rounded-xl font-black text-slate-700 cursor-pointer">
                          <option value="Easy">🟢 Easy</option><option value="Medium">🟡 Medium</option><option value="Hard">🔴 Hard</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Image (Optional)</label>
                      <div className="flex items-center gap-2 bg-slate-50 border border-dashed border-slate-300 p-2.5 rounded-xl">
                        <Image className="h-4 w-4 text-indigo-400 shrink-0" />
                        <input type="file" accept="image/*" onChange={handleImageFileChange} className="text-[10px] text-slate-500 cursor-pointer w-full" />
                      </div>
                      {qImageBase64 && (
                        <div className="relative mt-1.5 p-1 bg-slate-100 rounded-xl max-h-28 overflow-hidden border border-slate-200">
                          <img src={qImageBase64} alt="preview" className="max-h-24 object-contain rounded mx-auto" />
                          <button type="button" onClick={() => setQImageBase64('')}
                            className="absolute top-1 right-1 px-1.5 py-0.5 bg-red-50 text-rose-600 rounded text-[8px] font-black border border-red-200 cursor-pointer">Remove</button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Solution</label>
                      <textarea placeholder="Explain the answer..." value={qExplanation} onChange={e => setQExplanation(e.target.value)}
                        rows={2} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-medium focus:outline-none focus:border-indigo-400 resize-none" />
                    </div>

                    <button type="submit"
                      className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl hover:from-indigo-700 hover:to-violet-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer">
                      <Check className="h-4 w-4 stroke-[2.5]" /> Deploy Question
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <QuestionsInventory userRole="admin" onEnterTest={onEnterTest} />
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════
            LIVE CLASSES TAB
        ════════════════════════════════════════════════════════════ */}
        {activeSubTab === 'class' && (
          <motion.div
            key="class-pane"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="grid grid-cols-1 xl:grid-cols-12 gap-6"
          >
            {/* LEFT: CTA + Classes */}
            <div className="xl:col-span-7 space-y-5">
              <div className="relative bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[2rem] p-6 shadow-xl overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl pointer-events-none" />
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-violet-200 font-extrabold mb-1">Admin Classroom</p>
                    <h3 className="text-lg font-black text-white leading-tight">Start a new class session</h3>
                    <p className="text-xs text-violet-200 mt-1 max-w-xs">Upload video, notes PDF, and link a DPP — all organised by chapter.</p>
                  </div>
                  <button onClick={() => { setShowStartClassModal(true); setFormStep(1); }}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-violet-700 font-black text-xs rounded-2xl hover:bg-violet-50 active:scale-95 transition-all shadow-lg shrink-0 cursor-pointer">
                    <Video className="h-4 w-4 animate-pulse" /> Start Class →
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Published Classes</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{lectures.length} total</p>
                  </div>
                </div>
                <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
                  {lectures.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <div className="p-4 bg-slate-50 rounded-2xl"><Video className="h-8 w-8 text-slate-300" /></div>
                      <p className="text-xs text-slate-400 font-medium">No classes yet. Click "Start Class".</p>
                    </div>
                  ) : (
                    [...lectures].reverse().map(lec => {
                      const sm = SUBJECT_MAP[lec.subject] || SUBJECT_MAP.Physics;
                      return (
                        <div key={lec.id} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50/70 transition-colors group">
                          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${sm.color} text-white shrink-0 mt-0.5`}><Video className="h-4 w-4" /></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap gap-1.5 mb-1">
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${sm.light}`}>{lec.subject}</span>
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-800 text-white">Cls {lec.classLevel}</span>
                              {lec.chapter && <span className="text-[9px] font-semibold text-slate-400 px-1.5 py-0.5 rounded bg-slate-100">{lec.chapter}</span>}
                            </div>
                            <h4 className="text-xs font-extrabold text-slate-800 truncate">{lec.title}</h4>
                            <div className="flex gap-2 mt-1 text-[9px] text-slate-400 font-bold uppercase font-mono">
                              <span className="flex items-center gap-0.5"><Video className="h-2.5 w-2.5 text-indigo-400" /> Video</span>
                              {lec.notesUrl && <span className="flex items-center gap-0.5"><FileText className="h-2.5 w-2.5 text-blue-400" /> Notes</span>}
                              {lec.dppQuizId && <span className="flex items-center gap-0.5"><CheckSquare className="h-2.5 w-2.5 text-emerald-400" /> DPP</span>}
                            </div>
                          </div>
                          <button onClick={() => handleDeleteLecture(lec.id, lec.title)} title="Delete"
                            className="p-2 opacity-0 group-hover:opacity-100 bg-rose-50 border border-rose-200 text-rose-500 hover:bg-rose-100 rounded-xl transition-all cursor-pointer">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT sidebar */}
            <div className="xl:col-span-5 space-y-5">
              <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-2"><Layers className="h-4 w-4 text-violet-500" /> Syllabus Coverage</h4>
                <div className="space-y-3">
                  {(['Physics', 'Chemistry', 'Mathematics'] as Subject[]).map(subj => {
                    const sm = SUBJECT_MAP[subj]; const Icon = sm.icon;
                    const count = lectures.filter(l => l.subject === subj).length;
                    const chapCount = SYLLABUS_DATA.filter(c => c.subject === subj).length;
                    return (
                      <div key={subj} className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${sm.color} text-white shrink-0`}><Icon className="h-3.5 w-3.5" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-extrabold text-slate-700">{subj}</span>
                            <span className="text-[10px] font-mono text-slate-500">{count}/{chapCount}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full bg-gradient-to-r ${sm.color} rounded-full transition-all`} style={{ width: `${chapCount ? Math.min((count / chapCount) * 100, 100) : 0}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-[2rem] p-5">
                <div className="flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <div>
                    <h4 className="text-xs font-black text-amber-800 mb-1">Pro Tip</h4>
                    <p className="text-[11px] text-amber-700 leading-relaxed">Upload lectures to Google Drive, copy the sharing link, and paste it here. Students see an embedded player — no downloads needed!</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════
          START CLASS WIZARD MODAL (5-step flow)
      ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showStartClassModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden relative"
            >
              <div className={`bg-gradient-to-br ${subjectInfo.color} p-6 relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8" />
                <button onClick={() => setShowStartClassModal(false)}
                  className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all cursor-pointer"><X className="h-4 w-4" /></button>
                <div className="relative z-10">
                  <p className="text-[10px] uppercase tracking-widest text-white/70 font-extrabold">Start a New Class</p>
                  <h2 className="text-lg font-black text-white mt-1">Step {formStep} of 5</h2>
                  <p className="text-xs text-white/70 mt-0.5">{STEPS[formStep - 1]}</p>
                </div>
                <div className="relative z-10 mt-4 flex gap-1">
                  {STEPS.map((_, i) => (<div key={i} className={`flex-1 h-1 rounded-full transition-all ${i < formStep ? 'bg-white' : 'bg-white/25'}`} />))}
                </div>
              </div>

              <div className="p-6 space-y-4">
                {formStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase font-black text-slate-400 mb-2 block">Select Subject</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.entries(SUBJECT_MAP) as [Subject, typeof SUBJECT_MAP.Physics][]).map(([subj, sm]) => {
                          const Icon = sm.icon;
                          return (
                            <button key={subj} type="button" onClick={() => setClassSubject(subj)}
                              className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                                classSubject === subj ? `border-transparent bg-gradient-to-br ${sm.color} text-white shadow-lg` : 'border-slate-200 hover:border-slate-300 text-slate-700'
                              }`}>
                              <Icon className="h-5 w-5 shrink-0" />
                              <span className="font-black text-sm">{subj === 'Mathematics' ? 'Maths' : subj}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-black text-slate-400 mb-2 block">Class Level</label>
                      <div className="grid grid-cols-2 gap-2">
                        {([11, 12] as const).map(cls => (
                          <button key={cls} type="button" onClick={() => setClassLevel(cls)}
                            className={`py-3.5 rounded-2xl border-2 font-black text-sm transition-all cursor-pointer ${
                              classLevel === cls ? 'border-violet-600 bg-violet-600 text-white shadow-md' : 'border-slate-200 text-slate-700 hover:border-violet-300'
                            }`}>Class {cls}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {formStep === 2 && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-slate-400 mb-2 block">{classSubject} · Class {classLevel} Chapters</label>
                    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                      {availableChapters.map(ch => (
                        <button key={ch.id} type="button" onClick={() => setClassChapterId(ch.id)}
                          className={`w-full text-left px-4 py-3 rounded-2xl border-2 text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                            classChapterId === ch.id ? `border-transparent bg-gradient-to-r ${subjectInfo.color} text-white shadow-md` : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                          }`}>
                          <span>{ch.title}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${classChapterId === ch.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>{ch.topics.length} topics</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {formStep === 3 && activeChapterData && (
                  <div className="space-y-2">
                    <div className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 mb-4">
                      <span className={`text-[9px] font-black uppercase ${subjectInfo.pill} px-2 py-0.5 rounded`}>{classSubject}</span>
                      <h4 className="text-sm font-black text-slate-800 mt-1.5">{activeChapterData.title}</h4>
                    </div>
                    <label className="text-[10px] uppercase font-black text-slate-400 mb-2 block">Select Today's Topic</label>
                    <div className="space-y-1.5">
                      {activeChapterData.topics.map(t => (
                        <button key={t} type="button" onClick={() => setClassTopic(t)}
                          className={`w-full text-left px-4 py-3 rounded-2xl border-2 text-xs font-semibold transition-all cursor-pointer ${
                            classTopic === t ? `border-transparent bg-gradient-to-r ${subjectInfo.color} text-white shadow-md` : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                          }`}>{t}</button>
                      ))}
                    </div>
                  </div>
                )}

                {formStep === 4 && (
                  <div className="space-y-3 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black text-slate-400">Lecture Title</label>
                      <input type="text" value={classTitle} onChange={e => setClassTitle(e.target.value)} placeholder="e.g. Current Electricity — Lecture 1"
                        className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-400" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black text-slate-400">Description</label>
                      <textarea rows={2} value={classDescription} onChange={e => setClassDescription(e.target.value)} placeholder="Brief summary..."
                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium focus:outline-none focus:border-indigo-400 text-slate-700 resize-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black text-slate-400">🎬 Video URL *</label>
                      <input type="url" value={classVideoUrl} onChange={e => setClassVideoUrl(e.target.value)} placeholder="https://drive.google.com/file/d/..."
                        className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-indigo-400" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black text-slate-400">📄 Notes PDF (optional)</label>
                      <input type="url" value={classNotesUrl} onChange={e => setClassNotesUrl(e.target.value)} placeholder="https://drive.google.com/file/d/..."
                        className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-indigo-400" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-slate-400">📝 DPP Quiz</label>
                        <select value={classDppQuizId} onChange={e => setClassDppQuizId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 px-2.5 py-2.5 rounded-xl font-semibold cursor-pointer text-slate-700 focus:outline-none">
                          <option value="">-- No DPP --</option>
                          {getStoredQuizzes().filter(q => q.subject === classSubject && q.classLevel === classLevel).map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-slate-400">⏱ Duration</label>
                        <input type="number" min={5} value={classDuration} onChange={e => setClassDuration(Number(e.target.value) || 45)}
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-indigo-400" />
                      </div>
                    </div>
                  </div>
                )}

                {formStep === 5 && (
                  <div className="space-y-3 text-xs">
                    <p className="text-[11px] text-slate-500">Review before publishing:</p>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                      {[
                        { label: 'Subject', val: `${classSubject} — Class ${classLevel}` },
                        { label: 'Chapter', val: activeChapterData?.title || '—' },
                        { label: 'Topic', val: classTopic || '—' },
                        { label: 'Title', val: classTitle || '—' },
                        { label: 'Video', val: classVideoUrl ? '✅ Linked' : '❌ Missing' },
                        { label: 'PDF Notes', val: classNotesUrl ? '✅ Attached' : '— None' },
                        { label: 'DPP', val: classDppQuizId ? '✅ Linked' : '— None' },
                        { label: 'Duration', val: `${classDuration} mins` },
                      ].map(r => (
                        <div key={r.label} className="flex justify-between items-center border-b border-slate-200/70 pb-2 last:border-0 last:pb-0">
                          <span className="font-bold text-slate-500">{r.label}</span>
                          <span className="font-extrabold text-slate-800 text-right max-w-[200px] truncate">{r.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 pb-6 flex gap-3">
                {formStep > 1 && (
                  <button type="button" onClick={() => setFormStep(s => Math.max(1, s - 1) as any)}
                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-2xl transition-all cursor-pointer">← Back</button>
                )}
                {formStep < 5 ? (
                  <button type="button" onClick={() => setFormStep(s => Math.min(5, s + 1) as any)}
                    disabled={formStep === 4 && !classVideoUrl.trim()}
                    className={`flex-1 py-3 font-extrabold text-xs rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      formStep === 4 && !classVideoUrl.trim() ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : `bg-gradient-to-r ${subjectInfo.color} text-white shadow-md hover:opacity-90 active:scale-95`
                    }`}>Continue →</button>
                ) : (
                  <button type="button" onClick={handlePublishClass}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-extrabold text-xs rounded-2xl hover:from-emerald-700 hover:to-green-700 active:scale-95 transition-all shadow-md cursor-pointer flex items-center justify-center gap-2">
                    <Check className="h-4 w-4 stroke-[2.5]" /> 🚀 Publish Class
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
