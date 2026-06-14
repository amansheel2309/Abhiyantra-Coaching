import React, { useState, useEffect } from 'react';
import { ChapterTimeline, Quiz, UserProfile, AppNotification, Subject, Lecture } from '../types';
import { getStoredTimelines, saveTimeline, getStoredQuizzes, saveNotification, saveLecture, getStoredLectures, getCompletedLectures, toggleLectureCompletion } from '../lib/dbStore';
import { Clock, BookOpen, CheckSquare, Play, Sparkles, ChevronRight, AlertCircle, HelpCircle, Flame, Video, X, Plus, FileText, Zap, Award, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DopamineSparks from './DopamineSparks';

interface TimelineInteractiveProps {
  user: UserProfile;
  onEnterTest: (quizId: string) => void;
  completedQuizzes: string[];
}

export default function TimelineInteractive({ user, onEnterTest, completedQuizzes }: TimelineInteractiveProps) {
  const [timelines, setTimelines] = useState<ChapterTimeline[]>([]);
  const [selectedTimeline, setSelectedTimeline] = useState<ChapterTimeline | null>(null);
  const [filterClass, setFilterClass] = useState<'all' | 11 | 12>('all');
  const [activeTimerDetail, setActiveTimerDetail] = useState<{ [id: string]: number }>({}); // seconds left
  const [isAccelerated, setIsAccelerated] = useState(true); // default accelerated for ease of review

  // Modal start class states
  const [showStartClassModal, setShowStartClassModal] = useState(false);
  const [classTitle, setClassTitle] = useState('');
  const [classDescription, setClassDescription] = useState('');
  const [classVideoUrl, setClassVideoUrl] = useState('');
  const [classNotesUrl, setClassNotesUrl] = useState('');
  const [classDppQuizId, setClassDppQuizId] = useState('');
  const [classSubject, setClassSubject] = useState<Subject>('Physics');
  const [classLevel, setClassLevel] = useState<11 | 12>(12);
  const [classDuration, setClassDuration] = useState<number>(45);

  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [streakExpReward, setStreakExpReward] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  useEffect(() => {
    const handleUpdate = () => {
      const stored = getStoredTimelines();
      setTimelines(stored);
      setLectures(getStoredLectures());
      setQuizzes(getStoredQuizzes());
      setCompletedIds(getCompletedLectures(user.id));
      
      // Auto select matching or saved timeline on mount
      setSelectedTimeline(prev => {
        if (prev) return prev;
        const savedId = localStorage.getItem('abhiyantra_selected_timeline_id');
        const saved = stored.find(t => t.id === savedId);
        if (saved) return saved;
        const matched = stored.filter(t => t.classLevel === user.classLevel);
        return matched.length > 0 ? matched[0] : stored[0];
      });
    };
    handleUpdate();

    window.addEventListener('db-timelines-updated', handleUpdate);
    window.addEventListener('db-lectures-updated', handleUpdate);
    window.addEventListener('db-completed-lectures-updated', handleUpdate);
    window.addEventListener('db-quizzes-updated', handleUpdate);
    return () => {
      window.removeEventListener('db-timelines-updated', handleUpdate);
      window.removeEventListener('db-lectures-updated', handleUpdate);
      window.removeEventListener('db-completed-lectures-updated', handleUpdate);
      window.removeEventListener('db-quizzes-updated', handleUpdate);
    };
  }, [user.classLevel, user.id]);

  useEffect(() => {
    if (selectedTimeline) {
      localStorage.setItem('abhiyantra_selected_timeline_id', selectedTimeline.id);
    }
  }, [selectedTimeline]);

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

  // Main countdown state effect loop
  useEffect(() => {
    const timer = setInterval(() => {
      const updatedTimers: { [id: string]: number } = {};
      let changed = false;

      timelines.forEach(t => {
        if (t.status === 'studying' && t.timerStartedAt) {
          const startTime = new Date(t.timerStartedAt).getTime();
          const durationMs = t.durationHours * 60 * 60 * 1000;
          const endTime = startTime + durationMs;
          const now = Date.now();
          
          let timeLeftMs = endTime - now;

          // If accelerated, speed up time by a huge factor (e.g., 24 hours expires in 30 seconds!)
          if (isAccelerated) {
            const elapsedMs = now - startTime;
            // 24 hours is 86,400,000 ms. If we want it to expire in 30 seconds:
            // accelerated elapsed = real elapsed * (86,400,000 / 30,000) = real elapsed * 2880
            const acceleratedElapsed = elapsedMs * 2880;
            timeLeftMs = durationMs - acceleratedElapsed;
          }

          if (timeLeftMs <= 0) {
            // Timer finished! Conduct test & trigger alerts
            t.status = 'test_ready';
            t.timerStartedAt = undefined;
            saveTimeline(t);
            
            // Create target alerts
            saveNotification({
              id: `test-ready-${t.id}-${Date.now()}`,
              title: '🔥 Chapter Test Unlocked!',
              message: `Your exam schedule for "${t.title}" is complete. The Abhiyantra Test Series is active. Open the Chapter timeline to take your test.`,
              type: 'test_ready',
              timestamp: new Date().toISOString(),
              read: false,
              chapterId: t.id
            });
            changed = true;
          } else {
            updatedTimers[t.id] = Math.max(0, Math.ceil(timeLeftMs / 1000));
          }
        }
      });

      if (changed) {
        setTimelines(getStoredTimelines());
      }
      setActiveTimerDetail(updatedTimers);
    }, 1000);

    return () => clearInterval(timer);
  }, [timelines, isAccelerated]);

  const handleStartChapter = (timeline: ChapterTimeline) => {
    timeline.status = 'studying';
    timeline.timerStartedAt = new Date().toISOString();
    saveTimeline(timeline);
    setSelectedTimeline({ ...timeline });

    // Generate immediate system news feedback
    saveNotification({
      id: `timestart-${timeline.id}`,
      title: '📖 Chapter Study Started!',
      message: `You started the countdown for "${timeline.title}". Recommended preparation time: 24 hrs. Test unlocks soon!`,
      type: 'timer_alert',
      timestamp: new Date().toISOString(),
      read: false
    });
  };

  const handleFastForward = (timeline: ChapterTimeline) => {
    // Instantly unlock the test
    timeline.status = 'test_ready';
    timeline.timerStartedAt = undefined;
    saveTimeline(timeline);
    setSelectedTimeline({ ...timeline });

    saveNotification({
      id: `ff-${timeline.id}-${Date.now()}`,
      title: '⚡ Fast-Forward Exam Alert!',
      message: `Simulated study duration elapsed. Dynamic Test series is now ready to attempt.`,
      type: 'test_ready',
      timestamp: new Date().toISOString(),
      read: false
    });
  };

  const handleStartClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classTitle.trim() || !classDescription.trim() || !classVideoUrl.trim()) {
      alert('Error: Please complete all required fields (Title, Description, and Video URL).');
      return;
    }

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
        if (fileId) return `https://drive.google.com/file/d/${fileId.trim()}/preview`;
      }
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';
        if (url.includes('v=')) {
          const match = url.split('v=')[1];
          videoId = match ? match.split('&')[0] : '';
        } else if (url.includes('youtu.be/')) {
          videoId = url.split('youtu.be/')[1] || '';
        }
        if (videoId) return `https://www.youtube.com/embed/${videoId.trim()}`;
      }
      return url;
    };

    const embedUrl = getEmbedUrl(classVideoUrl);

    const newLecture: Lecture = {
      id: `lec-${Date.now()}`,
      title: classTitle.trim(),
      description: classDescription.trim(),
      subject: classSubject,
      classLevel: classLevel,
      videoUrl: embedUrl,
      notesUrl: classNotesUrl.trim() || undefined,
      dppQuizId: classDppQuizId || undefined,
      durationMinutes: Number(classDuration) || 45,
      addedBy: user.name,
      createdAt: new Date().toISOString()
    };

    saveLecture(newLecture);
    alert(`🎉 Classroom Class started and linked successfully!\n\nLesson "${classTitle}" is now live and synchronized for Class ${classLevel} students.`);

    saveNotification({
      id: `class-notif-${Date.now()}`,
      title: `🎥 New Class Started: ${classSubject}`,
      message: `Faculty ${user.name} started a new class: "${classTitle.trim()}" for Class ${classLevel}. Class Notes and DPP are available.`,
      type: 'test_ready',
      timestamp: new Date().toISOString(),
      read: false
    });

    setClassTitle('');
    setClassDescription('');
    setClassVideoUrl('');
    setClassNotesUrl('');
    setClassDppQuizId('');
    setClassDuration(45);
    setShowStartClassModal(false);
  };

  const formatTimeLeft = (secondsTotal: number) => {
    if (!secondsTotal || secondsTotal <= 0) return '00:00:00';
    
    // If accelerated, we might want to represent it nicely
    const hours = Math.floor(secondsTotal / 3600);
    const minutes = Math.floor((secondsTotal % 3600) / 60);
    const secs = secondsTotal % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredTimelines = timelines.filter(t => {
    if (filterClass === 'all') return true;
    return t.classLevel === filterClass;
  });

  const matchingLectures = selectedTimeline
    ? lectures.filter(l => 
        l.dppQuizId === selectedTimeline.testId ||
        (l.subject === selectedTimeline.subject && 
         l.classLevel === selectedTimeline.classLevel && 
         (l.title.toLowerCase().includes(selectedTimeline.title.toLowerCase()) || 
          selectedTimeline.title.toLowerCase().includes(l.title.toLowerCase())))
      )
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-slate-800 relative">
      
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
                  ? 'bg-emerald-500 border-emerald-400 text-white shadow-emerald-200'
                  : 'bg-rose-500 border-rose-400 text-white'
              }`}
            >
              <Zap className="h-4 w-4 fill-current animate-bounce text-yellow-300" />
              {streakExpReward}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* LEFT COLUMN: CLASS LEVEL NAVIGATION & CHAPTER LIST */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Navigation Filters */}
        <div className="bg-white border border-slate-200/90 rounded-[2rem] p-5 shadow-sm">
          <h3 className="text-xs font-black text-slate-400 mb-3.5 uppercase tracking-widest flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-600" /> Choose Curriculum
          </h3>
          <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200/40">
            {(['all', 11, 12] as const).map(option => (
              <button
                key={option}
                onClick={() => setFilterClass(option)}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  filterClass === option
                    ? 'bg-white text-indigo-600 shadow-sm font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {option === 'all' ? 'All Classes' : `Class ${option}`}
              </button>
            ))}
          </div>
        </div>

        {/* Chapters Scroller */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Flame className="h-4 w-4 text-rose-500 animate-pulse" /> Active Chapters
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-indigo-600 font-bold">
              {filteredTimelines.length} total
            </span>
          </div>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {filteredTimelines.map(t => {
              const isActive = selectedTimeline?.id === t.id;
              const hasTakenQuiz = completedQuizzes.includes(t.testId);

              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTimeline(t)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 group relative ${
                    isActive
                      ? 'bg-indigo-50/50 border-indigo-200/80 shadow-sm'
                      : 'bg-white border-slate-200/70 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className={`mt-0.5 p-2 rounded-xl text-xs font-black ${
                    t.subject === 'Physics' ? 'bg-blue-50 text-blue-600 border border-blue-200/50' :
                    t.subject === 'Chemistry' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50' :
                    'bg-purple-50 text-purple-600 border border-purple-200/50'
                  }`}>
                    {t.subject[0]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">
                        {t.subject} • Class {t.classLevel}
                      </span>
                      {hasTakenQuiz ? (
                        <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                          DONE
                        </span>
                      ) : t.status === 'studying' ? (
                        <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                          <span className="h-1 w-1 bg-indigo-600 rounded-full animate-ping"></span> STUDYING
                        </span>
                      ) : t.status === 'test_ready' ? (
                        <span className="text-[9px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded font-black animate-pulse">
                          TEST ACTIVE
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-lg border border-slate-200/40 font-semibold">
                          LOCKED
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                      {t.title}
                    </h4>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 self-center mt-1" />
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: DETAILED INTERACTIVE TRACKER CARD */}
      <div className="lg:col-span-8">
        <AnimatePresence mode="wait">
          {selectedTimeline ? (
            <motion.div
              key={selectedTimeline.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white border border-slate-200 rounded-[2.25rem] p-6 sm:p-8 shadow-sm relative overflow-hidden"
            >
              {/* Background gradient rings */}
              <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-50/40 rounded-full blur-3xl pointer-events-none"></div>

              {/* Course Title and context */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-mono tracking-wider font-extrabold uppercase mb-2 inline-block">
                    {selectedTimeline.subject} — CLASS {selectedTimeline.classLevel} SYLLABUS
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
                    {selectedTimeline.title}
                  </h2>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-xl mt-1.5">
                    {selectedTimeline.description}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center text-center self-stretch sm:self-center">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold">Preparation Target</span>
                  <span className="text-base font-black text-indigo-600 mt-0.5">{selectedTimeline.durationHours} Hours</span>
                </div>
              </div>

              {/* TIMELINE PROGRESS FLOW CARD */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                
                {/* Step 1: Study Topics */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 space-y-4 relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="h-6 w-6 font-mono text-[10px] font-black rounded-full bg-slate-200/60 text-slate-600 flex items-center justify-center border border-slate-300/60">
                        1
                      </span>
                      <h4 className="text-xs font-black tracking-wider uppercase text-slate-600">Target Core Areas</h4>
                    </div>
                    <ul className="space-y-2">
                      {selectedTimeline.topics.map((t, idx) => (
                        <li key={idx} className="text-[11px] text-slate-600 flex items-start gap-1.5 leading-relaxed">
                          <CheckSquare className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5 stroke-[2]" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {selectedTimeline.status === 'not_started' && user.role === 'student' && (
                    <button
                      onClick={() => handleStartChapter(selectedTimeline)}
                      className="w-full mt-4 py-2.5 bg-indigo-600 text-white font-black text-xs rounded-xl shadow-md hover:bg-indigo-700 active:scale-95 transition-all text-center flex items-center justify-center gap-2 cursor-pointer border border-indigo-700"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" /> Start Study Cycle
                    </button>
                  )}

                  {(user.role === 'teacher' || user.role === 'admin') && (
                    <button
                      onClick={() => {
                        setClassTitle(`${selectedTimeline.title} - Lecture 1`);
                        setClassDescription(`Classroom lesson on ${selectedTimeline.title}. Concepts covered: ${selectedTimeline.topics.join(', ')}.`);
                        setClassSubject(selectedTimeline.subject);
                        setClassLevel(selectedTimeline.classLevel);
                        setClassDppQuizId(selectedTimeline.testId);
                        setShowStartClassModal(true);
                      }}
                      className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-indigo-700"
                    >
                      <Video className="h-4 w-4 animate-pulse" /> Start Class & Link Assets
                    </button>
                  )}
                </div>

                {/* Step 2: Simulated Countdown */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between relative">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="h-6 w-6 font-mono text-[10px] font-black rounded-full bg-slate-200/60 text-slate-600 flex items-center justify-center border border-slate-300/60">
                        2
                      </span>
                      <h4 className="text-xs font-black tracking-wider uppercase text-slate-600">Exam Countdown</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                      Abhiyantras automated test scheduler counts down to the exam. Conduct deep sessions now!
                    </p>
                  </div>

                  {selectedTimeline.status === 'studying' ? (
                    <div className="space-y-3.5 mt-auto">
                      <div className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between">
                        <Clock className="h-5 w-5 text-indigo-600 animate-spin" />
                        <span className="text-lg font-mono font-extrabold text-indigo-600 tracking-wider">
                          {formatTimeLeft(activeTimerDetail[selectedTimeline.id])}
                        </span>
                      </div>

                      {/* Simulator controls */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span className="font-bold">Fast-Sync Mode</span>
                          <button
                            onClick={() => setIsAccelerated(!isAccelerated)}
                            className={`px-1.5 py-0.5 rounded font-extrabold ${isAccelerated ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-slate-200 text-slate-500 border border-slate-300'}`}
                          >
                            {isAccelerated ? 'ON' : 'OFF'}
                          </button>
                        </div>
                        <button
                          onClick={() => handleFastForward(selectedTimeline)}
                          className="w-full py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] uppercase font-bold tracking-wider text-slate-600 hover:bg-slate-100 transition-colors text-center"
                        >
                          ⚡ Skip to Test Now
                        </button>
                      </div>
                    </div>
                  ) : selectedTimeline.status === 'test_ready' || selectedTimeline.status === 'completed' ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-center">
                      <CheckSquare className="h-6 w-6 text-emerald-600 mx-auto mb-1 animate-pulse" />
                      <span className="text-xs font-bold text-emerald-700">Timer Concluded</span>
                    </div>
                  ) : (
                    <div className="py-8 text-center border border-dashed border-slate-300 rounded-xl bg-white">
                      <Clock className="h-5 w-5 text-slate-400 mx-auto mb-1.5" />
                      <span className="text-[10px] text-slate-400 italic block">Unlock after starting Step 1</span>
                    </div>
                  )}
                </div>

                {/* Step 3: Enter evaluation arena */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between relative">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="h-6 w-6 font-mono text-[10px] font-black rounded-full bg-slate-200/60 text-slate-600 flex items-center justify-center border border-slate-300/60">
                        3
                      </span>
                      <h4 className="text-xs font-black tracking-wider uppercase text-slate-600">Test Series Arena</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                      Submit and receive deep performance analytics, peer positioning, and custom recommended revision materials.
                    </p>
                  </div>

                  {completedQuizzes.includes(selectedTimeline.testId) ? (
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-center text-xs text-indigo-700 font-bold">
                      🎉 Test Submitted Successfully!
                    </div>
                  ) : selectedTimeline.status === 'test_ready' ? (
                    <button
                      onClick={() => onEnterTest(selectedTimeline.testId)}
                      className="w-full mt-4 py-2.5 bg-rose-600 text-white font-black text-xs rounded-xl shadow-md border border-rose-700 hover:bg-rose-700 active:scale-95 transition-all text-center flex items-center justify-center gap-2 animate-bounce cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 fill-current" /> Enter Test Arena
                    </button>
                  ) : (
                    <div className="py-8 text-center border border-dashed border-slate-300 rounded-xl bg-white">
                      <AlertCircle className="h-5 w-5 text-slate-400 mx-auto mb-1.5" />
                      <span className="text-[10px] text-slate-400 italic block">Wait for study timer</span>
                    </div>
                  )}
                </div>

              </div>

              {/* CHAPTER CLASSROOM LESSONS & STUDY MATERIALS (DPP / VIDEOS / NOTES) */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/50">
                      <Video className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">
                        Linked Classroom Lectures & DPPs
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Watch concept videos, download teacher PDFs, and launch practice papers.</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg text-indigo-600">
                    {matchingLectures.length} lessons active
                  </span>
                </div>

                {matchingLectures.length === 0 ? (
                  <div className="p-8 bg-slate-50 border border-slate-200 border-dashed rounded-3xl text-center">
                    <Video className="h-8 w-8 text-slate-300 mx-auto mb-2.5 animate-pulse" />
                    <p className="text-xs text-slate-500 font-bold">No live lectures linked to this chapter yet.</p>
                    {(user.role === 'teacher' || user.role === 'admin') ? (
                      <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed font-medium">
                        Use the <strong className="text-indigo-600">"Start Class & Link Assets"</strong> button in Step 1 to publish lectures, PDF notes, and DPPs for this topic.
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed font-medium">
                        Your tutor hasn't linked any custom classroom videos or DPP notes yet. Start the study cycle timer or launch the chapter test series!
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {matchingLectures.map((lec) => {
                      const isCompleted = completedIds.includes(lec.id);
                      const isDppCompleted = lec.dppQuizId ? completedQuizzes.includes(lec.dppQuizId) : false;

                      // Calculate XP progress bar
                      let totalPoints = 0;
                      let maxPoints = 0;
                      
                      // Video points
                      maxPoints += 50;
                      if (isCompleted) totalPoints += 50;
                      
                      // Notes points
                      if (lec.dppQuizId) {
                        maxPoints += 100;
                        if (isDppCompleted) totalPoints += 100;
                      }
                      
                      const progressPercentage = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

                      const dppQuiz = lec.dppQuizId ? quizzes.find(q => q.id === lec.dppQuizId) : null;

                      return (
                        <div 
                          key={lec.id} 
                          className="p-6 rounded-[2.25rem] border transition-all flex flex-col gap-5 relative overflow-hidden group shadow-sm bg-gradient-to-br from-slate-50 to-white border-slate-200 hover:border-slate-300 hover:shadow-md"
                        >
                          {/* Card header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <div>
                              <h4 className="text-sm font-black text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors flex flex-wrap items-center gap-2">
                                <span>{lec.title}</span>
                                {isCompleted && isDppCompleted && (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-[8px] font-black tracking-wider uppercase flex items-center gap-0.5 animate-pulse">
                                    <Award className="h-3 w-3" /> MASTERED (+150 XP)
                                  </span>
                                )}
                              </h4>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed font-medium">
                                {lec.description}
                              </p>
                            </div>

                            {/* Dopamine Progress bar widget */}
                            {user.role === 'student' && (
                              <div className="bg-white border border-slate-200/60 p-2.5 rounded-2xl flex flex-col justify-center min-w-[130px] self-stretch sm:self-center shadow-sm">
                                <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase font-mono mb-1">
                                  <span>Task progress</span>
                                  <span className="text-indigo-600 font-extrabold">{progressPercentage}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/40">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      progressPercentage === 100 ? 'bg-emerald-500 shadow-md shadow-emerald-200' : 'bg-indigo-600'
                                    }`}
                                    style={{ width: `${progressPercentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* INTERACTIVE ASSETS DESK */}
                          <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-inner">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono border-b border-slate-200/60 pb-1.5">
                              Class Materials & Practice Desk
                            </span>

                            {/* Video Lecture row */}
                            <div className="flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Play className={`h-4.5 w-4.5 p-1.5 rounded-lg ${isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`} />
                                <span className="font-bold text-slate-700 truncate">Concept Video Lecture</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] text-slate-400 font-mono font-medium">{lec.durationMinutes} mins</span>
                                {isCompleted ? (
                                  <span className="text-[8px] font-black text-emerald-600 uppercase bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">Watched</span>
                                ) : (
                                  <span className="text-[8px] font-black text-indigo-600 uppercase bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded animate-pulse">Pending (+50 XP)</span>
                                )}
                              </div>
                            </div>

                            {/* PDF Notes Row */}
                            <div className="flex items-center justify-between gap-3 text-xs border-t border-slate-200/60 pt-2.5">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <FileText className={`h-4.5 w-4.5 p-1.5 rounded-lg ${lec.notesUrl ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`} />
                                <span className="font-bold text-slate-700 truncate">Class Notes PDF</span>
                              </div>
                              {lec.notesUrl ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[8px] font-black text-blue-600 uppercase bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded shrink-0">Attached</span>
                                  <a
                                    href={lec.notesUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-blue-600 hover:text-blue-700 font-extrabold underline decoration-blue-200 hover:decoration-blue-500 shrink-0"
                                  >
                                    View Notes
                                  </a>
                                </div>
                              ) : (
                                <span className="text-[8px] font-black text-slate-400 uppercase bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded shrink-0">Missing</span>
                              )}
                            </div>

                            {/* DPP Practice Test Row */}
                            <div className="flex items-center justify-between gap-3 text-xs border-t border-slate-200/60 pt-2.5">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <CheckSquare className={`h-4.5 w-4.5 p-1.5 rounded-lg ${
                                  lec.dppQuizId ? (isDppCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600') : 'bg-slate-100 text-slate-400'
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
                                    <span className="text-[8px] font-black text-emerald-600 uppercase bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">PASSED</span>
                                  ) : (
                                    <span className="text-[8px] font-black text-rose-600 uppercase bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded animate-pulse">PENDING (+100 XP)</span>
                                  )}
                                  <button
                                    onClick={() => onEnterTest(lec.dppQuizId!)}
                                    className="text-[10px] text-indigo-600 hover:text-indigo-700 font-extrabold underline decoration-indigo-200 hover:decoration-indigo-500"
                                  >
                                    {isDppCompleted ? 'Reattempt' : 'Attempt'}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[8px] font-black text-slate-400 uppercase bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded shrink-0">None</span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                            {/* Meta items */}
                            <div className="flex flex-wrap items-center gap-3.5 text-[9px] text-slate-400 font-mono font-bold uppercase">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-slate-400" /> {lec.durationMinutes} Mins
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5 text-slate-400" /> {lec.addedBy.split(' ')[0]}
                              </span>
                              <span className="bg-slate-200/50 px-2 py-0.5 rounded border border-slate-200 text-slate-500">
                                Class {lec.classLevel}
                              </span>
                            </div>

                            {/* Actions toolbar */}
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Video play action */}
                              <button
                                onClick={() => setSelectedLecture(lec)}
                                className={`flex-grow sm:flex-initial px-4.5 py-2.5 text-xs font-black rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                                  isCompleted
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/70'
                                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 border border-indigo-700 text-white hover:opacity-95 hover:shadow-indigo-100 hover:shadow-md'
                                }`}
                              >
                                <Play className="h-3.5 w-3.5 fill-current" /> Play Video
                              </button>

                              {/* Class PDF Notes */}
                              {lec.notesUrl ? (
                                <a
                                  href={lec.notesUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-600 hover:text-blue-700 rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center"
                                  title="Download Class Notes PDF"
                                >
                                  <FileText className="h-4.5 w-4.5" />
                                </a>
                              ) : (
                                <span className="p-2.5 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl cursor-not-allowed" title="No notes provided">
                                  <FileText className="h-4.5 w-4.5 opacity-40" />
                                </span>
                              )}

                              {/* DPP Practice Test */}
                              {lec.dppQuizId ? (
                                <button
                                  onClick={() => onEnterTest(lec.dppQuizId!)}
                                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shadow-sm ${
                                    isDppCompleted
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                                      : 'bg-rose-600 border-rose-700 text-white hover:bg-rose-700 hover:shadow-rose-100 hover:shadow-md'
                                  }`}
                                  title={isDppCompleted ? 'Reattempt practice DPP' : 'Attempt Practice DPP Test'}
                                >
                                  <CheckSquare className="h-4.5 w-4.5 font-bold" />
                                </button>
                              ) : (
                                <span className="p-2.5 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl cursor-not-allowed" title="No DPP linked">
                                  <CheckSquare className="h-4.5 w-4.5 opacity-40" />
                                </span>
                              )}

                              {/* Checkbox watch toggle for student */}
                              {user.role === 'student' && (
                                <button
                                  onClick={() => handleToggleCompletion(lec.id)}
                                  className={`px-3.5 py-2.5 text-[9px] font-mono font-black uppercase rounded-xl border transition-all cursor-pointer ${
                                    isCompleted
                                      ? 'bg-white border-slate-300 text-slate-500 hover:bg-slate-100'
                                      : 'bg-emerald-600 border-emerald-700 text-white hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-100'
                                  }`}
                                  title={isCompleted ? 'Mark as Unwatched' : 'Mark as Watched (+50 EXP)'}
                                >
                                  {isCompleted ? '✓ Watched' : 'Mark Watched'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* EXPLANATION AND INTERACTIVE INFORMATION PANEL */}
              <div className="bg-slate-50 border border-slate-200 mt-6 p-4 rounded-2xl flex items-center gap-3.5 text-xs text-slate-500">
                <HelpCircle className="h-5 w-5 text-indigo-600 shrink-0 stroke-[2]" />
                <p className="leading-relaxed">
                  <strong>Abhiyantra coaching portal guidance</strong>: Designed to match JEE/NEET study cycles. Start a chapter to review key concept areas. Let the preparation timer expire or use the skip switch to immediately activate the competitive evaluative test.
                </p>
              </div>

            </motion.div>
          ) : (
            <div className="text-center py-20 bg-white border border-slate-200 rounded-[2.25rem] shadow-sm">
              <Clock className="h-10 w-10 text-slate-3 w-10 h-10 text-slate-300 mx-auto mb-3 animate-pulse" />
              <p className="text-slate-400 italic font-medium">No chapters available under the selected filter.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* POPUP: SECURE EMBEDDED VIDEO PLAYER MODAL */}
      <AnimatePresence>
        {selectedLecture && (
          <div className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 w-full max-w-4xl border border-slate-800 rounded-[2.25rem] shadow-2xl p-4 sm:p-6 space-y-4 relative overflow-hidden text-white"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setSelectedLecture(null);
                }}
                className="absolute top-4 right-4 p-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-xl transition-all cursor-pointer text-slate-400 hover:text-white"
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
              <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden border border-slate-800 relative shadow-inner">
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
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800">
                  <span>Instructor: <strong className="text-slate-300 font-bold">{selectedLecture.addedBy}</strong></span>
                  <span>Duration: <strong className="text-slate-300 font-bold">{selectedLecture.durationMinutes} Minutes</strong></span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TEACHER START CLASS MODAL */}
      <AnimatePresence>
        {showStartClassModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 w-full max-w-md rounded-[2.25rem] shadow-2xl p-6 sm:p-8 space-y-5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-10 -mt-10 blur-2xl opacity-50"></div>
              
              <button
                onClick={() => setShowStartClassModal(false)}
                className="absolute top-4 right-4 p-1.5 border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-slate-900 font-display">Start a Classroom Lesson</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Link Google Drive classroom videos, PDF notes, and DPP quizzes.</p>
                </div>
              </div>

              <form onSubmit={handleStartClassSubmit} className="space-y-4 text-xs font-sans">
                
                {/* LECTURE TITLE */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Class/Lesson Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Current Electricity - Lecture 1"
                    value={classTitle}
                    onChange={(e) => setClassTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* DESCRIPTION */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Lesson Description</label>
                  <textarea
                    required
                    placeholder="Brief summary of concepts, equations, and topics covered in today's class..."
                    value={classDescription}
                    onChange={(e) => setClassDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium focus:outline-none focus:border-indigo-500 text-slate-700"
                  />
                </div>

                {/* GOOGLE DRIVE VIDEO LINK */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Google Drive Video Link</label>
                  <input
                    type="url"
                    required
                    placeholder="https://drive.google.com/file/d/..."
                    value={classVideoUrl}
                    onChange={(e) => setClassVideoUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[9px] text-slate-400 block mt-0.5">Supports YouTube URLs or Google Drive shareable files.</span>
                </div>

                {/* GOOGLE DRIVE PDF NOTES LINK */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Class Notes PDF Link (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/file/d/..."
                    value={classNotesUrl}
                    onChange={(e) => setClassNotesUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[9px] text-slate-400 block mt-0.5">Paste Google Drive sharing URL for the PDF notes.</span>
                </div>

                {/* LINK DPP TEST SERIES */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Link Daily Practice Paper (DPP)</label>
                  <select
                    value={classDppQuizId}
                    onChange={(e) => setClassDppQuizId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-2.5 py-2.5 rounded-xl font-semibold cursor-pointer text-slate-700 text-xs focus:outline-none"
                  >
                    <option value="">-- No DPP Linked --</option>
                    {getStoredQuizzes()
                      .filter(q => q.subject === classSubject && q.classLevel === classLevel)
                      .map(q => (
                        <option key={q.id} value={q.id}>{q.title}</option>
                      ))}
                  </select>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Attach an active test series quiz as a practice paper.</span>
                </div>

                {/* DETAILS GRID */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Subject</label>
                    <select
                      value={classSubject}
                      onChange={(e) => setClassSubject(e.target.value as Subject)}
                      className="w-full bg-slate-50 border border-slate-200 px-2.5 py-2.5 rounded-xl font-bold cursor-pointer text-slate-700 text-xs"
                    >
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Mathematics">Maths</option>
                      <option value="Biology">Biology</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Class Level</label>
                    <select
                      value={classLevel}
                      onChange={(e) => setClassLevel(Number(e.target.value) as 11 | 12)}
                      className="w-full bg-slate-50 border border-slate-200 px-2.5 py-2.5 rounded-xl font-bold cursor-pointer text-slate-700 text-xs"
                    >
                      <option value={11}>Class 11</option>
                      <option value={12}>Class 12</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Duration (Mins)</label>
                    <input
                      type="number"
                      required
                      min={5}
                      value={classDuration}
                      onChange={(e) => setClassDuration(Number(e.target.value) || 45)}
                      className="w-full bg-slate-50 border border-slate-200 px-2.5 py-2.5 rounded-xl font-bold text-slate-700 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  className="w-full py-3.5 bg-indigo-600 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 shadow-md border border-indigo-700 cursor-pointer"
                >
                  <Video className="h-4 w-4 animate-pulse" /> START & PUBLISH LIVE CLASS
                </button>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
