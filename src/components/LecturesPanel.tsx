import React, { useState, useEffect } from 'react';
import { UserProfile, Lecture, Subject, Quiz } from '../types';
import { getStoredLectures, saveLecture, deleteLecture, getCompletedLectures, toggleLectureCompletion, getStoredQuizzes, getStoredAttempts } from '../lib/dbStore';
import { Play, CheckCircle2, Clock, Trash2, Plus, Video, Eye, Filter, BookOpen, User, X, FileText, CheckSquare, Flame, Award, Zap, ChevronRight, Check, Atom, FlaskConical, Calculator, Leaf } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DopamineSparks from './DopamineSparks';
import { SYLLABUS_DATA } from '../lib/syllabus';

interface LecturesPanelProps {
  user: UserProfile;
  onEnterTest: (quizId: string) => void;
}

const SUBJECT_MAP: Record<Subject, { icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { className?: string }>; color: string; emoji: string }> = {
  Physics: { icon: Atom, color: 'from-blue-500 to-indigo-600', emoji: '⚛️' },
  Chemistry: { icon: FlaskConical, color: 'from-emerald-500 to-teal-600', emoji: '🧪' },
  Mathematics: { icon: Calculator, color: 'from-violet-500 to-purple-600', emoji: '∑' },
  Biology: { icon: Leaf, color: 'from-rose-500 to-pink-600', emoji: '🧬' },
};

export default function LecturesPanel({ user, onEnterTest }: LecturesPanelProps) {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [completedQuizIds, setCompletedQuizIds] = useState<string[]>([]);
  const [quizScores, setQuizScores] = useState<{ [quizId: string]: number }>({});
  const [activeSubject, setActiveSubject] = useState<Subject | 'All'>('All');
  const [activeClass, setActiveClass] = useState<11 | 12 | 'All'>(
    user.role === 'student' ? user.classLevel : 'All'
  );

  // Gamification floating alert
  const [streakExpReward, setStreakExpReward] = useState<string | null>(null);

  // Form State for Adding Lectures
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [notesUrl, setNotesUrl] = useState('');
  const [dppQuizId, setDppQuizId] = useState('');
  const [subject, setSubject] = useState<Subject>('Physics');
  const [classLevel, setClassLevel] = useState<11 | 12>(12);
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [formStep, setFormStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [chapterId, setChapterId] = useState('');
  const [topic, setTopic] = useState('');

  // Chapter/topic selection for the wizard form
  const availableChapters = SYLLABUS_DATA.filter(c => c.subject === subject && c.classLevel === classLevel);
  const activeChapterData = SYLLABUS_DATA.find(c => c.id === chapterId);

  // Active video player state
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);

  // Load database
  const loadData = () => {
    const storedLectures = getStoredLectures();
    setLectures(storedLectures);
    setQuizzes(getStoredQuizzes());
    
    if (user.role === 'student') {
      setCompletedIds(getCompletedLectures(user.id));
      const attempts = getStoredAttempts().filter(a => a.studentId === user.id);
      setCompletedQuizIds(attempts.map(a => a.quizId));
      
      // Map highest score per quiz
      const scores: { [quizId: string]: number } = {};
      attempts.forEach(a => {
        if (scores[a.quizId] === undefined || a.score > scores[a.quizId]) {
          scores[a.quizId] = a.score;
        }
      });
      setQuizScores(scores);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('db-lectures-updated', loadData);
    window.addEventListener('db-quizzes-updated', loadData);
    if (user.role === 'student') {
      window.addEventListener('db-completed-lectures-updated', loadData);
      window.addEventListener('db-attempts-updated', loadData);
    }

    const handleOpenModal = () => {
      setFormStep(1);
      setShowAddForm(true);
    };
    window.addEventListener('open-start-class-modal', handleOpenModal);

    return () => {
      window.removeEventListener('db-lectures-updated', loadData);
      window.removeEventListener('db-quizzes-updated', loadData);
      window.removeEventListener('open-start-class-modal', handleOpenModal);
      if (user.role === 'student') {
        window.removeEventListener('db-completed-lectures-updated', loadData);
        window.removeEventListener('db-attempts-updated', loadData);
      }
    };
  }, [user.id, user.role]);

  useEffect(() => {
    const chapters = SYLLABUS_DATA.filter(c => c.subject === subject && c.classLevel === classLevel);
    if (chapters.length > 0) {
      setChapterId(chapters[0].id);
      setTopic(chapters[0].topics[0]);
    }
  }, [subject, classLevel]);

  useEffect(() => {
    if (activeChapterData && activeChapterData.topics.length > 0) {
      setTopic(activeChapterData.topics[0]);
      setTitle(`${activeChapterData.title} — ${activeChapterData.topics[0]}`);
    }
  }, [chapterId]);

  useEffect(() => {
    if (topic && activeChapterData) {
      setTitle(`${activeChapterData.title} — ${topic}`);
    }
  }, [topic]);

  // Utility to convert Google Drive / YouTube sharing URLs into embed URLs
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    
    if (url.includes('drive.google.com')) {
      let fileId = '';
      if (url.includes('/file/d/')) {
        const match = url.split('/file/d/')[1];
        fileId = match ? match.split('/')[0] : '';
      } else if (url.includes('id=')) {
        const match = url.split('id=')[1];
        fileId = match ? match.split('&')[0] : '';
      }
      
      if (fileId) {
        return `https://drive.google.com/file/d/${fileId.trim()}/preview`;
      }
    }
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('v=')) {
        const match = url.split('v=')[1];
        videoId = match ? match.split('&')[0] : '';
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1] || '';
      }
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId.trim()}`;
      }
    }
    
    return url;
  };

  const handleAddLecture = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || !description.trim() || !videoUrl.trim()) {
      alert('Error: Please complete all required fields.');
      return;
    }

    const embedLink = getEmbedUrl(videoUrl);
    
    const newLecture: Lecture = {
      id: `lec-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      subject,
      classLevel,
      chapter: activeChapterData?.title,
      topic: topic,
      videoUrl: embedLink,
      notesUrl: notesUrl.trim() || undefined,
      dppQuizId: dppQuizId || undefined,
      durationMinutes: Number(durationMinutes) || 45,
      addedBy: user.name,
      createdAt: new Date().toISOString()
    };

    saveLecture(newLecture);
    alert('🎉 Classroom Lecture created successfully!');
    
    // Reset Form
    setTitle('');
    setDescription('');
    setVideoUrl('');
    setNotesUrl('');
    setDppQuizId('');
    setDurationMinutes(45);
    setFormStep(1);
    setChapterId('');
    setTopic('');
    setShowAddForm(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the lesson "${name}"?`)) {
      deleteLecture(id);
    }
  };

  const handleToggleCompletion = (lectureId: string) => {
    if (user.role !== 'student') return;
    const updated = toggleLectureCompletion(user.id, lectureId);
    setCompletedIds(updated);

    // Dopamine trigger logic
    const isNowCompleted = updated.includes(lectureId);
    if (isNowCompleted) {
      setStreakExpReward('+50 EXP Earned! 🚀');
    } else {
      setStreakExpReward('-50 EXP');
    }
    setTimeout(() => setStreakExpReward(null), 3000);
  };

  // Filter Lectures
  const filteredLectures = lectures.filter((l) => {
    const matchSubject = activeSubject === 'All' || l.subject === activeSubject;
    const matchClass = activeClass === 'All' || l.classLevel === activeClass;
    return matchSubject && matchClass;
  });

  // Calculate student statistics for dopamine kicker
  const studentClassList = lectures.filter(l => l.classLevel === user.classLevel);
  const totalClasses = studentClassList.length;
  const completedClassesCount = studentClassList.filter(l => completedIds.includes(l.id)).length;
  const classPercentage = totalClasses > 0 ? Math.round((completedClassesCount / totalClasses) * 100) : 0;

  // DPP statistics
  const linkedDppQuizzes = studentClassList.filter(l => l.dppQuizId);
  const totalDpps = linkedDppQuizzes.length;
  const completedDppsCount = linkedDppQuizzes.filter(l => completedQuizIds.includes(l.dppQuizId!)).length;
  const dppPercentage = totalDpps > 0 ? Math.round((completedDppsCount / totalDpps) * 100) : 0;

  // Overall EXP level name
  const totalEXP = (completedClassesCount * 50) + (completedDppsCount * 100);
  const getGrowthLevel = (exp: number) => {
    if (exp >= 400) return 'JEE Gladiator (Level 4)';
    if (exp >= 250) return 'JEE Champion (Level 3)';
    if (exp >= 100) return 'Syllabus Challenger (Level 2)';
    return 'Knowledge Explorer (Level 1)';
  };

  return (
    <div className="space-y-8 font-sans text-slate-800 relative">
      
      {/* FLOATING EXP DOPAMINE ALERTS */}
      <AnimatePresence>
        {streakExpReward && (
          <>
            <DopamineSparks trigger={streakExpReward} />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-2 border ${
                streakExpReward.includes('+')
                  ? 'bg-emerald-500 border-emerald-400 text-white shadow-emerald-200/50'
                  : 'bg-rose-500 border-rose-400 text-white'
              }`}
            >
              <Zap className="h-4 w-4 fill-current animate-bounce" />
              {streakExpReward}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* HEADER BENTO CONTAINER WITH STATS OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* WELCOME SECTION (8 COLS) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-[2.25rem] p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-20 -mt-20 blur-3xl opacity-50"></div>
          
          <div className="flex items-start gap-4 relative z-10">
            <div className="p-3.5 bg-indigo-600 text-white rounded-2xl border border-indigo-500 flex items-center justify-center shadow-md shadow-indigo-100">
              <Video className="h-6 w-6 stroke-[2]" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-indigo-600">STUDY ROOM</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display mt-0.5">
                Abhiyantra Digital Classroom
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                Connect your Google Drive class videos, notes PDFs, and Daily Practice Paper (DPP) quizzes. Tutors can organize classes manually, and students get visual milestones.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-slate-100 relative z-10">
            {(user.role === 'admin' || user.role === 'teacher') && (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-2xl text-xs font-black transition-all shadow-md cursor-pointer border border-indigo-700"
              >
                <Plus className="h-4 w-4" /> START A CLASS / LINK ASSETS
              </button>
            )}
            <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[10px] bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              <span>Manual Direct Link Mode ACTIVE</span>
            </div>
          </div>
        </div>

        {/* DOPAMINE STUDENT PROGRESS BOARD (5 COLS - ONLY SHOWN TO STUDENTS) */}
        {user.role === 'student' ? (
          <div className="lg:col-span-5 bg-slate-900 text-white border border-slate-800 rounded-[2.25rem] p-6 sm:p-7 shadow-xl relative overflow-hidden flex flex-col justify-between">
            {/* Background glowing effects */}
            <div className="absolute right-0 bottom-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl opacity-50"></div>
            
            {/* Top row: level and streak */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500 fill-amber-500/20" />
                <div className="text-left">
                  <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold block">Growth Rank</span>
                  <span className="text-xs font-black text-amber-400 font-display">{getGrowthLevel(totalEXP)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 px-3 py-1 rounded-xl">
                <Flame className="h-4 w-4 text-orange-500 fill-orange-500 animate-pulse" />
                <span className="text-[11px] font-black text-orange-400 font-mono">5 DAY STREAK!</span>
              </div>
            </div>

            {/* EXP Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span>Milestone Experience</span>
                <span className="text-indigo-400 font-mono font-black">{totalEXP} EXP</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700/50">
                <div className="h-full bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/50 transition-all duration-700" style={{ width: `${Math.min((totalEXP / 500) * 100, 100)}%` }}></div>
              </div>
            </div>

            {/* Circular/Grid visual indicators */}
            <div className="grid grid-cols-2 gap-4 pt-3.5 mt-3 border-t border-slate-800">
              <div className="space-y-1 text-left">
                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Lessons Completed</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-indigo-400 font-mono">{completedClassesCount}</span>
                  <span className="text-[10px] text-slate-500 font-semibold">/ {totalClasses}</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${classPercentage}%` }}></div>
                </div>
              </div>

              <div className="space-y-1 text-left">
                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">DPP Practice Cleared</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-emerald-500 font-mono">{completedDppsCount}</span>
                  <span className="text-[10px] text-slate-500 font-semibold">/ {totalDpps}</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${dppPercentage}%` }}></div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* TEACHER/ADMIN SUMMARY stats (5 COLS) */
          <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-[2.25rem] p-6 shadow-sm flex flex-col justify-between">
            <div className="border-b border-slate-200 pb-3 mb-2 flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Faculty Room Controls</span>
              <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-black rounded-lg text-[9px] uppercase tracking-wider">Tutor Suite</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm text-left">
                <span className="text-[9px] uppercase font-bold text-slate-400">Classes Scheduled</span>
                <span className="text-2xl font-black text-slate-800 mt-1 block font-mono">{lectures.length}</span>
              </div>
              <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm text-left">
                <span className="text-[9px] uppercase font-bold text-slate-400">Linked DPPs</span>
                <span className="text-2xl font-black text-indigo-600 mt-1 block font-mono">{lectures.filter(l => l.dppQuizId).length}</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 mt-4 leading-relaxed font-semibold">
              Tutor dashboards synchronize changes locally and push updates automatically in the background to connected student feeds.
            </p>
          </div>
        )}

      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <span className="text-[10px] uppercase font-bold text-slate-400 mr-2 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Subject:
          </span>
          {(['All', 'Physics', 'Chemistry', 'Mathematics', 'Biology'] as const).map((sub) => (
            <button
              key={sub}
              onClick={() => setActiveSubject(sub)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeSubject === sub
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              {sub === 'Mathematics' ? 'Maths' : sub}
            </button>
          ))}
        </div>

        {/* CLASS FILTER (FOR TEACHERS/ADMINS) */}
        {user.role !== 'student' ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-400">Class:</span>
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              {([11, 12, 'All'] as const).map((cls) => (
                <button
                  key={cls}
                  onClick={() => setActiveClass(cls)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeClass === cls
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {cls === 'All' ? 'All' : `Class ${cls}`}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl shadow-sm shrink-0">
            🏫 Class {user.classLevel} Syllabus
          </div>
        )}
      </div>

      {/* CLASSROOM LESSONS GRID */}
      {filteredLectures.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-[2.25rem] p-12 text-center shadow-sm">
          <BookOpen className="h-12 w-12 text-slate-300 mx-auto stroke-[1.5]" />
          <h3 className="text-base font-black text-slate-800 mt-4">No Classes Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No classroom lectures were found matching the selected subject or class level. Create one to get started!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredLectures.map((lec) => {
            const isCompleted = completedIds.includes(lec.id);
            const isDppCompleted = lec.dppQuizId ? completedQuizIds.includes(lec.dppQuizId) : false;
            const dppScore = lec.dppQuizId ? quizScores[lec.dppQuizId] : null;

            // Color coding for subject cards
            const getColors = (sub: Subject) => {
              switch (sub) {
                case 'Physics': return {
                  light: 'bg-amber-50 border-amber-100/50',
                  text: 'text-amber-600',
                  fill: 'bg-amber-500',
                  border: 'border-amber-200'
                };
                case 'Chemistry': return {
                  light: 'bg-emerald-50 border-emerald-100/50',
                  text: 'text-emerald-600',
                  fill: 'bg-emerald-500',
                  border: 'border-emerald-200'
                };
                case 'Mathematics': return {
                  light: 'bg-indigo-50 border-indigo-100/50',
                  text: 'text-indigo-600',
                  fill: 'bg-indigo-500',
                  border: 'border-indigo-200'
                };
                case 'Biology': return {
                  light: 'bg-rose-50 border-rose-100/50',
                  text: 'text-rose-600',
                  fill: 'bg-rose-500',
                  border: 'border-rose-200'
                };
              }
            };
            
            const theme = getColors(lec.subject);

            return (
              <motion.div
                key={lec.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-white border border-slate-200 rounded-[2.25rem] overflow-hidden shadow-sm hover:shadow-lg hover:border-slate-300 transition-all flex flex-col justify-between group relative`}
              >
                <div>
                  
                  {/* Subject and Class header bar */}
                  <div className={`p-4 ${theme.light} border-b border-slate-100 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${theme.fill}`}></span>
                      <span className={`text-[10px] font-black uppercase tracking-wider ${theme.text}`}>
                        {lec.subject}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 bg-slate-800 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-md">
                      Class {lec.classLevel}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h4 className="font-black text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors text-sm tracking-tight">
                        {lec.title}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium mt-1.5 line-clamp-3">
                        {lec.description}
                      </p>
                    </div>

                    {/* INTERACTIVE ASSETS DESK */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3.5 shadow-inner">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono border-b border-slate-200 pb-1.5">
                        Class Materials & Practice Desk
                      </span>

                      {/* Video Item */}
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Play className={`h-4.5 w-4.5 p-1.5 rounded-lg ${isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`} />
                          <span className="font-bold text-slate-700 truncate">Concept Video Lecture</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-slate-400 font-mono font-medium">{lec.durationMinutes} mins</span>
                          {isCompleted ? (
                            <span className="text-[8px] font-black text-emerald-600 uppercase bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded">Watched</span>
                          ) : (
                            <span className="text-[8px] font-black text-indigo-600 uppercase bg-indigo-50 border border-indigo-300 px-1.5 py-0.5 rounded animate-pulse">Pending (+50 XP)</span>
                          )}
                        </div>
                      </div>

                      {/* Notes PDF Item */}
                      <div className="flex items-center justify-between gap-3 text-xs border-t border-slate-200/60 pt-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className={`h-4.5 w-4.5 p-1.5 rounded-lg ${lec.notesUrl ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`} />
                          <span className="font-bold text-slate-700 truncate">Class Notes PDF</span>
                        </div>
                        {lec.notesUrl ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[8px] font-black text-blue-600 uppercase bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">Attached</span>
                            <a
                              href={lec.notesUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-blue-600 hover:text-blue-700 font-extrabold underline decoration-blue-200 hover:decoration-blue-500"
                            >
                              View Notes
                            </a>
                          </div>
                        ) : (
                          <span className="text-[8px] font-black text-slate-400 uppercase bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded shrink-0">Missing</span>
                        )}
                      </div>

                      {/* DPP Quiz Item */}
                      <div className="flex items-center justify-between gap-3 text-xs border-t border-slate-200/60 pt-2.5">
                        {(() => {
                          const dppQuiz = lec.dppQuizId ? quizzes.find(q => q.id === lec.dppQuizId) : null;
                          return (
                            <>
                              <div className="flex items-center gap-2.5 min-w-0">
                                <CheckSquare className={`h-4.5 w-4.5 p-1.5 rounded-lg ${
                                  lec.dppQuizId ? (isDppCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600') : 'bg-slate-100 text-slate-400'
                                }`} />
                                <div className="min-w-0">
                                  <span className="font-bold text-slate-700 block truncate">Daily Practice Paper (DPP)</span>
                                  {dppQuiz && (
                                    <span className="text-[10px] text-indigo-500 font-bold block truncate mt-0.5">{dppQuiz.title}</span>
                                  )}
                                </div>
                              </div>
                              {lec.dppQuizId ? (
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {isDppCompleted ? (
                                    <span className="text-[8px] font-black text-emerald-600 uppercase bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded" title={`Highest Score: ${dppScore}%`}>
                                      Passed ({dppScore}%)
                                    </span>
                                  ) : (
                                    <span className="text-[8px] font-black text-orange-600 uppercase bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded animate-pulse">Pending (+100 XP)</span>
                                  )}
                                  <button
                                    onClick={() => onEnterTest(lec.dppQuizId!)}
                                    className="text-[10px] text-indigo-600 hover:text-indigo-700 font-extrabold underline decoration-indigo-200 hover:decoration-indigo-500"
                                  >
                                    {isDppCompleted ? 'Reattempt' : 'Start DPP'}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[8px] font-black text-slate-400 uppercase bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded shrink-0">None</span>
                              )}
                            </>
                          );
                        })()}
                      </div>

                    </div>
                  </div>
                </div>

                {/* CARD FOOTER */}
                <div className="p-6 pt-0 border-t border-slate-50 mt-auto">
                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold py-3 border-b border-slate-100 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Scheduled: {new Date(lec.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="truncate max-w-[120px] text-right">
                      Tutor: {lec.addedBy.split(' ')[0]}
                    </span>
                  </div>

                  {/* Actions Row */}
                  <div className="flex gap-2 items-center">
                    {/* Watch Button */}
                    <button
                      onClick={() => setSelectedLecture(lec)}
                      className="flex-1 py-2.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" /> Play Video
                    </button>

                    {/* PDF Download Button */}
                    {lec.notesUrl && (
                      <a
                        href={lec.notesUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 bg-slate-50 border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 hover:border-slate-300 rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center shrink-0"
                        title="Download Notes PDF"
                      >
                        <FileText className="h-4 w-4" />
                      </a>
                    )}

                    {/* DPP Test Launch Button */}
                    {lec.dppQuizId && (
                      <button
                        onClick={() => onEnterTest(lec.dppQuizId!)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-sm ${
                          isDppCompleted
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-600 hover:bg-emerald-100'
                            : 'bg-indigo-600 border-indigo-700 text-white hover:bg-indigo-700 hover:shadow-indigo-100 hover:shadow-md'
                        }`}
                        title={isDppCompleted ? 'Reattempt linked DPP practice test' : 'Launch Daily Practice Paper (DPP)'}
                      >
                        <CheckSquare className="h-4 w-4" />
                      </button>
                    )}

                    {/* Student Mark Watched Checkbox */}
                    {user.role === 'student' && (
                      <button
                        onClick={() => handleToggleCompletion(lec.id)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-sm ${
                          isCompleted
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-600 shadow-inner'
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                        }`}
                        title={isCompleted ? 'Mark as unwatched' : 'Mark as watched'}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}

                    {/* Delete button (Admins/Teachers) */}
                    {(user.role === 'admin' || user.role === 'teacher') && (
                      <button
                        onClick={() => handleDelete(lec.id, lec.title)}
                        className="p-2.5 bg-rose-50 border border-rose-300 text-rose-600 hover:bg-rose-100 rounded-xl transition-all cursor-pointer shadow-sm shrink-0"
                        title="Delete Classroom Record"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>
      )}

      {/* POPUP: ADD CLASSROOM LECTURE WIZARD MODAL */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 w-full max-w-lg rounded-[2.25rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* GRADIENT HEADER */}
              <div className={`bg-gradient-to-r ${SUBJECT_MAP[subject].color} p-5 pb-4 relative shrink-0`}>
                <button
                  onClick={() => { setShowAddForm(false); setFormStep(1); }}
                  className="absolute top-4 right-4 p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all cursor-pointer backdrop-blur-sm"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Video className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-black tracking-tight text-white font-display">Start a Class</h3>
                    <p className="text-[10px] text-white/70 mt-0.5">Step {formStep} of 5 — {['Pick Subject', 'Select Chapter', 'Select Topic', 'Add Details', 'Review & Publish'][formStep - 1]}</p>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="mt-3 w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${(formStep / 5) * 100}%` }}></div>
                </div>
                {/* Step Indicator Dots */}
                <div className="flex items-center justify-center gap-2 mt-2.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <div key={s} className={`h-2 rounded-full transition-all duration-300 ${s === formStep ? 'w-6 bg-white' : s < formStep ? 'w-2 bg-white/80' : 'w-2 bg-white/30'}`}></div>
                  ))}
                </div>
              </div>

              {/* SCROLLABLE CONTENT AREA */}
              <div className="overflow-y-auto flex-1 p-6 space-y-5">

                {/* ======== STEP 1: SUBJECT + CLASS ======== */}
                {formStep === 1 && (
                  <div className="space-y-5">
                    <div>
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest block mb-3">Choose Subject</label>
                      <div className="grid grid-cols-2 gap-3">
                        {(['Physics', 'Chemistry', 'Mathematics', 'Biology'] as Subject[]).map(sub => {
                          const cfg = SUBJECT_MAP[sub];
                          const Icon = cfg.icon;
                          const isActive = subject === sub;
                          return (
                            <button
                              key={sub}
                              type="button"
                              onClick={() => setSubject(sub)}
                              className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer text-left group ${
                                isActive
                                  ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100'
                                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl ${isActive ? `bg-gradient-to-br ${cfg.color} text-white` : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
                                  <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                  <span className="text-sm font-black text-slate-800 block">{sub === 'Mathematics' ? 'Maths' : sub}</span>
                                  <span className="text-[10px] text-slate-400 font-semibold">{cfg.emoji}</span>
                                </div>
                              </div>
                              {isActive && (
                                <div className="absolute top-2 right-2 p-0.5 bg-indigo-500 rounded-full">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest block mb-3">Class Level</label>
                      <div className="flex gap-3">
                        {([11, 12] as const).map(cls => (
                          <button
                            key={cls}
                            type="button"
                            onClick={() => setClassLevel(cls)}
                            className={`flex-1 py-3.5 rounded-2xl border-2 text-sm font-black transition-all cursor-pointer ${
                              classLevel === cls
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md shadow-indigo-100'
                                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            Class {cls}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ======== STEP 2: CHAPTER ======== */}
                {formStep === 2 && (
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest block">
                      {subject} — Class {classLevel} Chapters ({availableChapters.length})
                    </label>
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {availableChapters.map((ch, idx) => (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => setChapterId(ch.id)}
                          className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 group ${
                            chapterId === ch.id
                              ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${
                            chapterId === ch.id ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-800 block truncate">{ch.title}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{ch.topics.length} topics</span>
                          </div>
                          {chapterId === ch.id && (
                            <Check className="h-4 w-4 text-indigo-500 ml-auto shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ======== STEP 3: TOPIC ======== */}
                {formStep === 3 && activeChapterData && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest block">Chapter</label>
                      <p className="text-sm font-bold text-slate-800 mt-1">{activeChapterData.title}</p>
                    </div>
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest block">Pick Topic</label>
                    <div className="space-y-2">
                      {activeChapterData.topics.map((t, idx) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTopic(t)}
                          className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                            topic === t
                              ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                            topic === t ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-700">{t}</span>
                          {topic === t && (
                            <Check className="h-4 w-4 text-indigo-500 ml-auto shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ======== STEP 4: DETAILS ======== */}
                {formStep === 4 && (
                  <div className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Lesson Title</label>
                      <input
                        type="text"
                        placeholder="Auto-generated from chapter + topic"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Lesson Description</label>
                      <textarea
                        placeholder="Brief summary of concepts covered..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium focus:outline-none focus:border-indigo-500 text-slate-700"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Google Drive / YouTube Video Link</label>
                      <input
                        type="url"
                        placeholder="https://drive.google.com/file/d/..."
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                      <span className="text-[9px] text-slate-400 block mt-0.5">Supports YouTube URLs or Google Drive shareable files.</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Notes PDF Link (Optional)</label>
                      <input
                        type="url"
                        placeholder="https://drive.google.com/file/d/..."
                        value={notesUrl}
                        onChange={(e) => setNotesUrl(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Link DPP Quiz (Optional)</label>
                      <select
                        value={dppQuizId}
                        onChange={(e) => setDppQuizId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-2.5 py-2.5 rounded-xl font-semibold cursor-pointer text-slate-700 text-xs"
                      >
                        <option value="">-- No DPP Linked --</option>
                        {quizzes.filter(q => q.subject === subject && q.classLevel === classLevel).map(q => (
                          <option key={q.id} value={q.id}>{q.title}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Duration (Minutes)</label>
                      <input
                        type="number"
                        min={5}
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(Number(e.target.value) || 45)}
                        className="w-full bg-slate-50 border border-slate-200 px-2.5 py-2.5 rounded-xl font-bold text-slate-700 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {/* ======== STEP 5: REVIEW + PUBLISH ======== */}
                {formStep === 5 && (
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest block">Review Your Lesson</label>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${SUBJECT_MAP[subject].color}`}></span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{subject} • Class {classLevel}</span>
                      </div>
                      <h4 className="text-sm font-black text-slate-800 leading-snug">{title || 'Untitled Lesson'}</h4>
                      {description && <p className="text-xs text-slate-500 leading-relaxed">{description}</p>}

                      <div className="border-t border-slate-200 pt-3 space-y-2">
                        {activeChapterData && (
                          <div className="flex items-center gap-2 text-xs">
                            <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-slate-600 font-semibold">Chapter: <strong>{activeChapterData.title}</strong></span>
                          </div>
                        )}
                        {topic && (
                          <div className="flex items-center gap-2 text-xs">
                            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-slate-600 font-semibold">Topic: <strong>{topic}</strong></span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs">
                          <Video className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-slate-600 font-semibold truncate">{videoUrl || 'No video linked'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-slate-600 font-semibold truncate">{notesUrl || 'No notes PDF'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-slate-600 font-semibold">{durationMinutes} minutes</span>
                        </div>
                        {dppQuizId && (
                          <div className="flex items-center gap-2 text-xs">
                            <CheckSquare className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-slate-600 font-semibold">DPP: {quizzes.find(q => q.id === dppQuizId)?.title || dppQuizId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* FOOTER NAV BUTTONS */}
              <div className="p-5 pt-3 border-t border-slate-100 flex items-center gap-3 shrink-0">
                {formStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setFormStep((formStep - 1) as 1 | 2 | 3 | 4 | 5)}
                    className="px-5 py-3 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Back
                  </button>
                )}
                {formStep < 5 ? (
                  <button
                    type="button"
                    onClick={() => setFormStep((formStep + 1) as 1 | 2 | 3 | 4 | 5)}
                    className={`flex-1 py-3 bg-gradient-to-r ${SUBJECT_MAP[subject].color} text-white font-extrabold text-xs uppercase tracking-widest rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer`}
                  >
                    Continue <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAddLecture()}
                    disabled={!title.trim() || !videoUrl.trim() || !description.trim()}
                    className={`flex-1 py-3 bg-gradient-to-r ${SUBJECT_MAP[subject].color} text-white font-extrabold text-xs uppercase tracking-widest rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Video className="h-4 w-4 animate-pulse" /> Publish Lesson
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP: SECURE EMBEDDED VIDEO PLAYER MODAL */}
      <AnimatePresence>
        {selectedLecture && (
          <div className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-950 w-full max-w-4xl border border-slate-800 rounded-[2.25rem] shadow-2xl p-4 sm:p-6 space-y-4 relative overflow-hidden text-white animate-fade-in"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedLecture(null)}
                className="absolute top-4 right-4 p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl transition-all cursor-pointer text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="pr-12">
                <span className="text-[9px] uppercase font-black tracking-widest text-indigo-400">
                  {selectedLecture.subject} • Class {selectedLecture.classLevel} classroom lesson
                </span>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white mt-1 leading-tight">
                  {selectedLecture.title}
                </h3>
              </div>

              {/* VIDEO PLAYER CONTAINER */}
              <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden border border-slate-850 relative shadow-inner">
                <iframe
                  src={selectedLecture.videoUrl}
                  title={selectedLecture.title}
                  className="w-full h-full absolute inset-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                <p className="text-slate-400 leading-relaxed max-h-24 overflow-y-auto font-medium">
                  {selectedLecture.description}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-900">
                  <span>Instructor: <strong className="text-slate-300 font-bold">{selectedLecture.addedBy}</strong></span>
                  <span>Duration: <strong className="text-slate-300 font-bold">{selectedLecture.durationMinutes} Minutes</strong></span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
