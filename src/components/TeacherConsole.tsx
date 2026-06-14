import React, { useState, useEffect } from 'react';
import { Quiz, Question, Subject, UserProfile, ChapterTimeline, Lecture } from '../types';
import { saveQuiz, getStoredQuizzes, getStoredTimelines, saveTimeline, saveNotification, getQuizOrCreateDynamic, saveLecture, getStoredLectures, deleteLecture } from '../lib/dbStore';
import { SYLLABUS_DATA } from '../lib/syllabus';
import {
  ShieldCheck, Plus, Sparkles, FileText, UploadCloud, Check, Edit3, Trash2, ArrowRight,
  HelpCircle, Image, Video, BookOpen, Clock, CheckSquare, ChevronRight, X, Layers,
  Zap, BarChart2, Users, Play, Award, Atom, FlaskConical, Calculator, Leaf
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import QuestionsInventory from './QuestionsInventory';

interface TeacherConsoleProps {
  user: UserProfile;
  onEnterTest?: (quizId: string) => void;
}

// Subject icon/color map
const SUBJECT_MAP = {
  Physics: { icon: Atom, color: 'from-blue-500 to-indigo-600', light: 'bg-blue-50 text-blue-700 border-blue-200', pill: 'bg-blue-100 text-blue-700', emoji: '⚛️' },
  Chemistry: { icon: FlaskConical, color: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50 text-emerald-700 border-emerald-200', pill: 'bg-emerald-100 text-emerald-700', emoji: '🧪' },
  Mathematics: { icon: Calculator, color: 'from-violet-500 to-purple-600', light: 'bg-violet-50 text-violet-700 border-violet-200', pill: 'bg-violet-100 text-violet-700', emoji: '∑' },
  Biology: { icon: Leaf, color: 'from-rose-500 to-pink-600', light: 'bg-rose-50 text-rose-700 border-rose-200', pill: 'bg-rose-100 text-rose-700', emoji: '🧬' },
};

export default function TeacherConsole({ user, onEnterTest }: TeacherConsoleProps) {
  const [activeSubTab, setActiveSubTab] = useState<'mcq' | 'class'>('class');

  // ── Start Class Modal State ──────────────────────────────────────────────
  const [showStartClassModal, setShowStartClassModal] = useState(false);
  const [formStep, setFormStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step-by-step form state
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

  // ── Lectures ─────────────────────────────────────────────────────────────
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const loadLectures = () => setLectures(getStoredLectures());
  useEffect(() => {
    loadLectures();
    window.addEventListener('db-lectures-updated', loadLectures);
    // Listen for header "Start Class" button
    const handleOpenModal = () => {
      setShowStartClassModal(true);
      setFormStep(1);
    };
    window.addEventListener('open-start-class-modal', handleOpenModal);
    return () => {
      window.removeEventListener('db-lectures-updated', loadLectures);
      window.removeEventListener('open-start-class-modal', handleOpenModal);
    };
  }, []);

  // Chapters for selected subject + class
  const availableChapters = SYLLABUS_DATA.filter(
    c => c.subject === classSubject && c.classLevel === classLevel
  );
  const activeChapterData = SYLLABUS_DATA.find(c => c.id === classChapterId);

  // Reset chapter when subject/class changes
  useEffect(() => {
    const chapters = SYLLABUS_DATA.filter(c => c.subject === classSubject && c.classLevel === classLevel);
    if (chapters.length > 0) {
      setClassChapterId(chapters[0].id);
      setClassTopic(chapters[0].topics[0]);
    }
  }, [classSubject, classLevel]);

  useEffect(() => {
    if (activeChapterData && activeChapterData.topics.length > 0) {
      setClassTopic(activeChapterData.topics[0]);
      // Auto-suggest title
      setClassTitle(`${activeChapterData.title} — ${activeChapterData.topics[0]}`);
    }
  }, [classChapterId]);

  useEffect(() => {
    if (classTopic && activeChapterData) {
      setClassTitle(`${activeChapterData.title} — ${classTopic}`);
    }
  }, [classTopic]);

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

  const handlePublishClass = () => {
    if (!classTitle.trim() || !classVideoUrl.trim()) {
      alert('Please fill the class title and video URL.');
      return;
    }
    const newLecture: Lecture = {
      id: `lec-${Date.now()}`,
      title: classTitle.trim(),
      description: classDescription.trim() || `${classSubject} class on ${classTopic || activeChapterData?.title} for Class ${classLevel}.`,
      subject: classSubject,
      classLevel,
      chapter: activeChapterData?.title,
      topic: classTopic,
      videoUrl: getEmbedUrl(classVideoUrl),
      notesUrl: classNotesUrl.trim() || undefined,
      dppQuizId: classDppQuizId || undefined,
      durationMinutes: Number(classDuration) || 45,
      addedBy: user.name,
      createdAt: new Date().toISOString()
    };
    saveLecture(newLecture);
    saveNotification({
      id: `class-notif-${Date.now()}`,
      title: `🎥 New Class: ${classSubject}`,
      message: `${user.name} published "${classTitle.trim()}" for Class ${classLevel}. Notes & DPP attached.`,
      type: 'test_ready',
      timestamp: new Date().toISOString(),
      read: false
    });
    // Reset
    setShowStartClassModal(false);
    setFormStep(1);
    setClassTitle(''); setClassDescription(''); setClassVideoUrl('');
    setClassNotesUrl(''); setClassDppQuizId(''); setClassDuration(45);
    alert(`✅ Class published! "${classTitle.trim()}" is now live for students.`);
  };

  const handleDeleteLecture = (id: string, name: string) => {
    if (window.confirm(`Delete class "${name}"?`)) deleteLecture(id);
  };

  // ── MCQ Form State ────────────────────────────────────────────────────────
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
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

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

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...qOptions]; updated[idx] = val; setQOptions(updated);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const reader = new FileReader();
      reader.onloadend = () => { if (typeof reader.result === 'string') setQImageBase64(reader.result); };
      reader.readAsDataURL(files[0]);
    }
  };

  const handleAddQuestionManual = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(''); setErrorMsg('');
    if (!qText.trim() || qOptions.some(o => !o.trim())) {
      setErrorMsg('Complete the question text and all four options.');
      return;
    }
    const chapter = SYLLABUS_DATA.find(c => c.id === selectedChapterId);
    if (!chapter) return;
    const quizId = `quiz-${chapter.id}`;
    const quiz = getQuizOrCreateDynamic(quizId);
    const newQ: Question = {
      id: `q-teacher-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      text: qText.trim(), options: [...qOptions], correctAnswerIndex: correctIdx,
      explanation: qExplanation.trim() || 'No explanation provided.',
      topic: selectedTopic, difficulty: qDifficulty, imageUrl: qImageBase64 || undefined
    };
    quiz.questions = [...quiz.questions, newQ];
    saveQuiz(quiz);
    const timelines = getStoredTimelines();
    const idx = timelines.findIndex(t => t.id === `timeline-${chapter.id}`);
    if (idx >= 0) { timelines[idx].status = 'test_ready'; saveTimeline(timelines[idx]); }
    setSuccessMsg(`Question deployed to "${chapter.title}"!`);
    saveNotification({
      id: `facultyq-add-${Date.now()}`, title: '📖 Question Added',
      message: `${user.name} added an MCQ to "${chapter.title} » ${selectedTopic}".`,
      type: 'exam_alert', timestamp: new Date().toISOString(), read: false
    });
    setQText(''); setQOptions(['', '', '', '']); setQExplanation(''); setQImageBase64(''); setCorrectIdx(0);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) { setUploadedFileName(files[0].name); setSuccessMsg(`Syllabus sheet "${files[0].name}" registered.`); }
  };

  const triggerMockAiGeneration = () => {
    setAiGenerating(true); setSuccessMsg(''); setErrorMsg('');
    const chapter = SYLLABUS_DATA.find(c => c.id === selectedChapterId);
    if (!chapter) { setAiGenerating(false); return; }
    setTimeout(() => {
      setAiGenerating(false);
      const quiz = getQuizOrCreateDynamic(`quiz-${chapter.id}`);
      const aiQs: Question[] = chapter.topics.map((t, i) => ({
        id: `q-ai-${chapter.id}-${i}-${Date.now()}`,
        text: `JEE-level conceptual question on "${t}". Which statement is most accurate?`,
        options: ['Proportional decay within defined boundaries.', 'Constant equilibrium maintained at absolute state.', 'Inversely governed by square root parameters.', 'Exponential growth bounded by system limits.'],
        correctAnswerIndex: i % 4, explanation: 'Based on JEE standard derivations.', topic: t, difficulty: 'Hard'
      }));
      quiz.questions = [...quiz.questions, ...aiQs];
      saveQuiz(quiz);
      setSuccessMsg(`AI generated ${aiQs.length} questions for "${chapter.title}"`);
      saveNotification({ id: `ai-gen-${Date.now()}`, title: '🤖 AI Test Generated', message: `Auto-compiled ${aiQs.length} JEE MCQs for "${chapter.title}".`, type: 'exam_alert', timestamp: new Date().toISOString(), read: false });
      setTimeout(() => setSuccessMsg(''), 6000);
    }, 1800);
  };

  const activeChapter = SYLLABUS_DATA.find(c => c.id === selectedChapterId);
  const subjectInfo = SUBJECT_MAP[classSubject];

  // Step labels for progress indicator
  const STEPS = ['Subject & Class', 'Chapter', 'Topic', 'Title & Links', 'Review & Publish'];

  return (
    <div className="space-y-6 font-sans">

      {/* ── HERO WELCOME BANNER ─────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 border border-slate-700/50 rounded-[2.25rem] p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-16 w-48 h-48 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl text-indigo-300 backdrop-blur-sm">
              <ShieldCheck className="h-7 w-7 stroke-[1.5]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-extrabold mb-0.5">Faculty Command Center</p>
              <h2 className="text-xl font-black text-white tracking-tight">Good work, {user.name.split(' ')[0]}! 🎯</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-md">Publish classes, build test series, and track student performance — all from one panel.</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-3 flex-wrap">
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-center backdrop-blur-sm min-w-[80px]">
              <span className="text-xl font-black text-white block font-mono">{lectures.length}</span>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Classes</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-center backdrop-blur-sm min-w-[80px]">
              <span className="text-xl font-black text-indigo-300 block font-mono">{lectures.filter(l => l.dppQuizId).length}</span>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">DPPs Live</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-center backdrop-blur-sm min-w-[80px]">
              <span className="text-xl font-black text-emerald-300 block font-mono">{lectures.filter(l => l.notesUrl).length}</span>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Notes</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation embedded in banner */}
        <div className="relative z-10 flex gap-2 mt-6">
          <button
            onClick={() => setActiveSubTab('class')}
            className={`px-5 py-2 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'class'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            <Video className="h-3.5 w-3.5" /> Live Classroom
          </button>
          <button
            onClick={() => setActiveSubTab('mcq')}
            className={`px-5 py-2 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'mcq'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            <Plus className="h-3.5 w-3.5" /> MCQ Builder
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ════════════════════════════════════════════════════════════
            LIVE CLASSROOM TAB
        ════════════════════════════════════════════════════════════ */}
        {activeSubTab === 'class' && (
          <motion.div
            key="class-pane"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="grid grid-cols-1 xl:grid-cols-12 gap-6"
          >
            {/* LEFT: CTA + Published Classes List */}
            <div className="xl:col-span-7 space-y-5">

              {/* ── START A NEW CLASS CTA CARD ─── */}
              <div className="relative bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2rem] p-6 shadow-xl overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl pointer-events-none" />
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-indigo-200 font-extrabold mb-1">Today's Session</p>
                    <h3 className="text-lg font-black text-white leading-tight">Ready to start a new class?</h3>
                    <p className="text-xs text-indigo-200 mt-1 max-w-xs">Upload video, attach notes PDF, and link a DPP — all in one flow.</p>
                  </div>
                  <button
                    onClick={() => { setShowStartClassModal(true); setFormStep(1); }}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-700 font-black text-xs rounded-2xl hover:bg-indigo-50 active:scale-95 transition-all shadow-lg shrink-0 cursor-pointer"
                  >
                    <Video className="h-4 w-4 animate-pulse" /> Start Class →
                  </button>
                </div>
              </div>

              {/* ── PUBLISHED CLASSES LIST ─── */}
              <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Published Classes</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{lectures.length} total • visible to students</p>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-wider rounded-lg border border-indigo-200">
                    {lectures.filter(l => l.dppQuizId).length} DPPs Active
                  </span>
                </div>

                <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
                  {lectures.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                      <div className="p-4 bg-slate-50 rounded-2xl">
                        <Video className="h-8 w-8 text-slate-300" />
                      </div>
                      <p className="text-xs text-slate-400 font-medium">No classes published yet.<br />Click "Start Class" to begin.</p>
                    </div>
                  ) : (
                    [...lectures].reverse().map(lec => {
                      const sm = SUBJECT_MAP[lec.subject] || SUBJECT_MAP.Physics;
                      return (
                        <div key={lec.id} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50/70 transition-colors group">
                          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${sm.color} text-white shrink-0 mt-0.5`}>
                            <Video className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap gap-1.5 mb-1">
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${sm.light}`}>{lec.subject}</span>
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-800 text-white">Cls {lec.classLevel}</span>
                              {lec.chapter && <span className="text-[9px] font-semibold text-slate-400 px-1.5 py-0.5 rounded bg-slate-100">{lec.chapter}</span>}
                            </div>
                            <h4 className="text-xs font-extrabold text-slate-800 truncate leading-snug">{lec.title}</h4>
                            <div className="flex gap-2 mt-1.5 text-[9px] text-slate-400 font-bold uppercase font-mono">
                              <span className="flex items-center gap-0.5"><Video className="h-2.5 w-2.5 text-indigo-400" /> Video</span>
                              {lec.notesUrl && <span className="flex items-center gap-0.5"><FileText className="h-2.5 w-2.5 text-blue-400" /> Notes</span>}
                              {lec.dppQuizId && <span className="flex items-center gap-0.5"><CheckSquare className="h-2.5 w-2.5 text-emerald-400" /> DPP</span>}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteLecture(lec.id, lec.title)}
                            className="p-2 opacity-0 group-hover:opacity-100 bg-rose-50 border border-rose-200 text-rose-500 hover:bg-rose-100 rounded-xl transition-all cursor-pointer"
                            title="Delete class"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: Quick Action Sidebar */}
            <div className="xl:col-span-5 space-y-5">

              {/* Syllabus Map - subject breakdown */}
              <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-500" /> Syllabus Coverage
                </h4>
                <div className="space-y-3">
                  {(['Physics', 'Chemistry', 'Mathematics'] as Subject[]).map(subj => {
                    const sm = SUBJECT_MAP[subj];
                    const Icon = sm.icon;
                    const count = lectures.filter(l => l.subject === subj).length;
                    const chapCount = SYLLABUS_DATA.filter(c => c.subject === subj && c.classLevel === classLevel).length;
                    return (
                      <div key={subj} className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${sm.color} text-white shrink-0`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-extrabold text-slate-700">{subj}</span>
                            <span className="text-[10px] font-mono text-slate-500">{count}/{chapCount}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${sm.color} rounded-full transition-all`}
                              style={{ width: `${chapCount ? Math.min((count / chapCount) * 100, 100) : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Subject filter for class level */}
              <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-5">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">Filter by Class</h4>
                <div className="flex gap-2">
                  {([11, 12] as const).map(cls => (
                    <button
                      key={cls}
                      onClick={() => setClassLevel(cls)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        classLevel === cls ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      Class {cls}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tip card */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-[2rem] p-5">
                <div className="flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <div>
                    <h4 className="text-xs font-black text-amber-800 mb-1">Pro Tip</h4>
                    <p className="text-[11px] text-amber-700 leading-relaxed">Upload your lecture to Google Drive, copy the sharing link, and paste it here. Students will see an embedded player directly in the app — no downloads needed!</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════
            MCQ BUILDER TAB
        ════════════════════════════════════════════════════════════ */}
        {activeSubTab === 'mcq' && (
          <motion.div
            key="mcq-pane"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* LEFT: Manual Question Input */}
              <div className="lg:col-span-7">
                <div className="bg-white border border-slate-200 rounded-[2.25rem] p-6 sm:p-8 shadow-sm space-y-5">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Plus className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">Add MCQ Question</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Questions go directly into chapter test series</p>
                    </div>
                  </div>

                  {successMsg && (
                    <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2">
                      <Check className="h-4 w-4" /> {successMsg}
                    </div>
                  )}
                  {errorMsg && (
                    <div className="p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs font-bold">
                      ⚠️ {errorMsg}
                    </div>
                  )}

                  <form onSubmit={handleAddQuestionManual} className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Class Level</label>
                        <select
                          value={targetClass}
                          onChange={e => setTargetClass(Number(e.target.value) as 11 | 12)}
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl font-bold cursor-pointer text-slate-700"
                        >
                          <option value={11}>Class 11</option>
                          <option value={12}>Class 12</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Subject</label>
                        <select
                          value={targetSubject}
                          onChange={e => setTargetSubject(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl font-bold cursor-pointer text-slate-700"
                        >
                          <option value="Physics">⚛️ Physics</option>
                          <option value="Chemistry">🧪 Chemistry</option>
                          <option value="Mathematics">∑ Mathematics</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Chapter</label>
                      <select
                        value={selectedChapterId}
                        onChange={e => setSelectedChapterId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl font-semibold cursor-pointer text-slate-800"
                      >
                        {SYLLABUS_DATA.filter(c => c.subject === targetSubject && c.classLevel === targetClass).map(ch => (
                          <option key={ch.id} value={ch.id}>{ch.title}</option>
                        ))}
                      </select>
                    </div>

                    {activeChapter && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Topic</label>
                        <select
                          value={selectedTopic}
                          onChange={e => setSelectedTopic(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl font-semibold cursor-pointer text-slate-800"
                        >
                          {activeChapter.topics.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Question Text</label>
                      <textarea
                        placeholder="Write your JEE/NEET MCQ question here..."
                        value={qText}
                        onChange={e => setQText(e.target.value)}
                        rows={4}
                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium focus:outline-none focus:border-indigo-400 resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Options (A–D)</label>
                      {qOptions.map((opt, idx) => (
                        <div key={idx} className="flex gap-2.5 items-center">
                          <span className={`w-7 h-7 flex items-center justify-center rounded-lg font-black text-[11px] shrink-0 ${idx === correctIdx ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-slate-100 text-slate-500'}`}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <input
                            type="text"
                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                            value={opt}
                            onChange={e => handleOptionChange(idx, e.target.value)}
                            className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-400 font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => setCorrectIdx(idx)}
                            className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black transition-all cursor-pointer shrink-0 ${idx === correctIdx ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                          >
                            ✓
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Correct Answer</label>
                        <select
                          value={correctIdx}
                          onChange={e => setCorrectIdx(Number(e.target.value))}
                          className="w-full bg-emerald-50 border border-emerald-200 px-3 py-2.5 rounded-xl font-black text-emerald-700 cursor-pointer"
                        >
                          {qOptions.map((_, i) => <option key={i} value={i}>Option {String.fromCharCode(65 + i)}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Difficulty</label>
                        <select
                          value={qDifficulty}
                          onChange={e => setQDifficulty(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl font-black text-slate-700 cursor-pointer"
                        >
                          <option value="Easy">🟢 Easy</option>
                          <option value="Medium">🟡 Medium</option>
                          <option value="Hard">🔴 Hard</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Image / Diagram (Optional)</label>
                      <div className="flex items-center gap-3 bg-slate-50 border border-dashed border-slate-300 p-3 rounded-xl hover:bg-slate-100/50 transition-all">
                        <Image className="h-5 w-5 text-indigo-400 shrink-0" />
                        <input type="file" id="fac-image-upload" accept="image/*" onChange={handleImageUpload} className="text-[10px] text-slate-500 cursor-pointer w-full" />
                      </div>
                      {qImageBase64 && (
                        <div className="relative mt-2 p-1.5 bg-slate-100 rounded-2xl max-h-40 overflow-hidden border border-slate-200">
                          <img src={qImageBase64} alt="preview" className="max-h-36 object-contain rounded-xl mx-auto" />
                          <button type="button" onClick={() => setQImageBase64('')} className="absolute top-2 right-2 px-2 py-0.5 bg-red-50 text-rose-600 rounded-lg text-[9px] font-black border border-red-200 cursor-pointer">Clear</button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Solution Explanation</label>
                      <textarea
                        placeholder="Explain the correct answer and key formula..."
                        value={qExplanation}
                        onChange={e => setQExplanation(e.target.value)}
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium focus:outline-none focus:border-indigo-400 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl hover:from-indigo-700 hover:to-violet-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Check className="h-4 w-4 stroke-[2.5]" /> Deploy to Test Series
                    </button>
                  </form>
                </div>
              </div>

              {/* RIGHT: AI Generator + Chapter Stats */}
              <div className="lg:col-span-5 space-y-5 text-xs">
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 border border-slate-700/50 rounded-[2.25rem] p-5 sm:p-6 shadow-xl space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                    <div className="p-2 bg-indigo-500/20 border border-indigo-400/20 rounded-xl text-indigo-300">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">Auto-Generator</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Build JEE/NEET MCQs from syllabus</p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Drop a syllabus PDF or trigger auto-generation. Questions are instantly pushed to chapter test banks.
                  </p>

                  <div
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                      isDragging ? 'border-indigo-400 bg-indigo-500/10' : 'border-slate-600 bg-slate-800/40 hover:bg-slate-800/60'
                    }`}
                  >
                    <UploadCloud className="h-8 w-8 text-indigo-400 mx-auto stroke-[1.5] mb-2" />
                    <p className="font-bold text-slate-300 text-xs">Drop Syllabus File</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">PDF, Excel, or image</p>
                    {uploadedFileName && (
                      <div className="mt-3 py-1.5 px-3 bg-slate-700 rounded-xl inline-block text-[10px] font-mono text-emerald-400 font-bold">
                        📄 {uploadedFileName}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={triggerMockAiGeneration}
                    disabled={aiGenerating}
                    className={`w-full py-3 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      aiGenerating ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600 shadow-lg shadow-indigo-900/50'
                    }`}
                  >
                    {aiGenerating ? (
                      <><span className="h-4 w-4 border-2 border-slate-500 border-t-indigo-400 rounded-full animate-spin" /> Generating...</>
                    ) : (
                      <><Sparkles className="h-4 w-4 fill-current" /> Build Chapter Test</>
                    )}
                  </button>
                </div>

                {activeChapter && (
                  <div className="bg-white border border-slate-200 rounded-[2.25rem] p-5 space-y-4 shadow-sm">
                    <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Chapter Preview</h4>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-indigo-600">{activeChapter.subject} · CLASS {activeChapter.classLevel}</span>
                      <h3 className="text-sm font-extrabold text-slate-800 leading-tight mt-0.5">{activeChapter.title}</h3>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                      <div className="flex justify-between items-center text-[11px] text-slate-500">
                        <span>Questions in bank</span>
                        <span className="font-black text-indigo-600 font-mono">{getQuizOrCreateDynamic(`quiz-${activeChapter.id}`).questions.length}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-500">
                        <span>Topics covered</span>
                        <span className="font-bold text-slate-700">{activeChapter.topics.length}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeChapter.topics.map(t => (
                        <span key={t} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-100">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Questions Inventory */}
            <QuestionsInventory userRole="teacher" onEnterTest={onEnterTest} />
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
              {/* Modal Header */}
              <div className={`bg-gradient-to-br ${subjectInfo.color} p-6 relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8" />
                <button
                  onClick={() => setShowStartClassModal(false)}
                  className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="relative z-10">
                  <p className="text-[10px] uppercase tracking-widest text-white/70 font-extrabold">Start a New Class</p>
                  <h2 className="text-lg font-black text-white mt-1">Step {formStep} of 5</h2>
                  <p className="text-xs text-white/70 mt-0.5">{STEPS[formStep - 1]}</p>
                </div>

                {/* Progress Bar */}
                <div className="relative z-10 mt-4 flex gap-1">
                  {STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-1 rounded-full transition-all ${i < formStep ? 'bg-white' : 'bg-white/25'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">

                {/* STEP 1: Subject & Class */}
                {formStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase font-black text-slate-400 mb-2 block">Select Subject</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.entries(SUBJECT_MAP) as [Subject, typeof SUBJECT_MAP.Physics][]).map(([subj, sm]) => {
                          const Icon = sm.icon;
                          return (
                            <button
                              key={subj}
                              type="button"
                              onClick={() => setClassSubject(subj)}
                              className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                                classSubject === subj
                                  ? `border-transparent bg-gradient-to-br ${sm.color} text-white shadow-lg`
                                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
                              }`}
                            >
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
                          <button
                            key={cls}
                            type="button"
                            onClick={() => setClassLevel(cls)}
                            className={`py-3.5 rounded-2xl border-2 font-black text-sm transition-all cursor-pointer ${
                              classLevel === cls
                                ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                                : 'border-slate-200 text-slate-700 hover:border-indigo-300'
                            }`}
                          >
                            Class {cls}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Chapter */}
                {formStep === 2 && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-slate-400 mb-2 block">
                      {classSubject} · Class {classLevel} Chapters
                    </label>
                    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                      {availableChapters.map(ch => (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => setClassChapterId(ch.id)}
                          className={`w-full text-left px-4 py-3 rounded-2xl border-2 text-xs font-semibold transition-all cursor-pointer flex items-center justify-between group ${
                            classChapterId === ch.id
                              ? `border-transparent bg-gradient-to-r ${subjectInfo.color} text-white shadow-md`
                              : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <span>{ch.title}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${classChapterId === ch.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            {ch.topics.length} topics
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 3: Topic */}
                {formStep === 3 && activeChapterData && (
                  <div className="space-y-2">
                    <div className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 mb-4">
                      <span className={`text-[9px] font-black uppercase ${subjectInfo.pill} px-2 py-0.5 rounded`}>{classSubject}</span>
                      <h4 className="text-sm font-black text-slate-800 mt-1.5">{activeChapterData.title}</h4>
                    </div>
                    <label className="text-[10px] uppercase font-black text-slate-400 mb-2 block">Select Today's Topic</label>
                    <div className="space-y-1.5">
                      {activeChapterData.topics.map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setClassTopic(t)}
                          className={`w-full text-left px-4 py-3 rounded-2xl border-2 text-xs font-semibold transition-all cursor-pointer ${
                            classTopic === t
                              ? `border-transparent bg-gradient-to-r ${subjectInfo.color} text-white shadow-md`
                              : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 4: Title & Links */}
                {formStep === 4 && (
                  <div className="space-y-3 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black text-slate-400">Lecture Title</label>
                      <input
                        type="text"
                        required
                        value={classTitle}
                        onChange={e => setClassTitle(e.target.value)}
                        placeholder="e.g. Current Electricity — Lecture 1"
                        className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black text-slate-400">Short Description (auto-filled, editable)</label>
                      <textarea
                        rows={2}
                        value={classDescription}
                        onChange={e => setClassDescription(e.target.value)}
                        placeholder="Brief summary of what was covered..."
                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium focus:outline-none focus:border-indigo-400 text-slate-700 resize-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black text-slate-400">🎬 Google Drive / YouTube Video URL *</label>
                      <input
                        type="url"
                        required
                        value={classVideoUrl}
                        onChange={e => setClassVideoUrl(e.target.value)}
                        placeholder="https://drive.google.com/file/d/..."
                        className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black text-slate-400">📄 Notes PDF Link (optional)</label>
                      <input
                        type="url"
                        value={classNotesUrl}
                        onChange={e => setClassNotesUrl(e.target.value)}
                        placeholder="https://drive.google.com/file/d/..."
                        className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-slate-400">📝 Link DPP Quiz</label>
                        <select
                          value={classDppQuizId}
                          onChange={e => setClassDppQuizId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 px-2.5 py-2.5 rounded-xl font-semibold cursor-pointer text-slate-700 focus:outline-none"
                        >
                          <option value="">-- No DPP --</option>
                          {getStoredQuizzes()
                            .filter(q => q.subject === classSubject && q.classLevel === classLevel)
                            .map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-slate-400">⏱ Duration (mins)</label>
                        <input
                          type="number" min={5}
                          value={classDuration}
                          onChange={e => setClassDuration(Number(e.target.value) || 45)}
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 5: Review & Publish */}
                {formStep === 5 && (
                  <div className="space-y-3 text-xs">
                    <p className="text-[11px] text-slate-500">Review your class before publishing to students:</p>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                      {[
                        { label: 'Subject', val: `${classSubject} — Class ${classLevel}` },
                        { label: 'Chapter', val: activeChapterData?.title || '—' },
                        { label: 'Topic', val: classTopic || '—' },
                        { label: 'Title', val: classTitle || '—' },
                        { label: 'Video', val: classVideoUrl ? '✅ Linked' : '❌ Missing' },
                        { label: 'PDF Notes', val: classNotesUrl ? '✅ Attached' : '— None' },
                        { label: 'DPP Quiz', val: classDppQuizId ? '✅ Linked' : '— None' },
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

              {/* Modal Footer */}
              <div className="px-6 pb-6 flex gap-3">
                {formStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setFormStep((s) => Math.max(1, s - 1) as any)}
                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-2xl transition-all cursor-pointer"
                  >
                    ← Back
                  </button>
                )}
                {formStep < 5 ? (
                  <button
                    type="button"
                    onClick={() => setFormStep((s) => Math.min(5, s + 1) as any)}
                    disabled={formStep === 4 && !classVideoUrl.trim()}
                    className={`flex-1 py-3 font-extrabold text-xs rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      formStep === 4 && !classVideoUrl.trim()
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : `bg-gradient-to-r ${subjectInfo.color} text-white shadow-md hover:opacity-90 active:scale-95`
                    }`}
                  >
                    Continue → 
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePublishClass}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-extrabold text-xs rounded-2xl hover:from-emerald-700 hover:to-green-700 active:scale-95 transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="h-4 w-4 stroke-[2.5]" /> 🚀 Publish Class Now
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
