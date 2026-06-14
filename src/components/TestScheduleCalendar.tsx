import React, { useState, useEffect } from 'react';
import { UserProfile, Quiz, Question, Subject } from '../types';
import { getStoredQuizzes, saveQuiz, getStoredAttempts, saveNotification } from '../lib/dbStore';
import { SYLLABUS_DATA } from '../lib/syllabus';
import { Calendar as CalendarIcon, Clock, Plus, HelpCircle, Tag, Check, Trash2, ArrowRight, Award, ChevronLeft, ChevronRight, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TestScheduleCalendarProps {
  user: UserProfile;
  onEnterTest: (quizId: string) => void;
}

export default function TestScheduleCalendar({ user, onEnterTest }: TestScheduleCalendarProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  // Navigation states for our custom calendar
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(5); // 0-indexed (5 is June, because Local Time is June 2026)

  // Scheduling Form attributes
  const [showScheduleForm, setShowScheduleForm] = useState<boolean>(false);
  const [scheduleTitle, setScheduleTitle] = useState<string>('');
  const [scheduleDescription, setScheduleDescription] = useState<string>('');
  const [scheduleSubject, setScheduleSubject] = useState<Subject>('Physics');
  const [scheduleClass, setScheduleClass] = useState<11 | 12>(12);
  const [scheduleDuration, setScheduleDuration] = useState<number>(30);
  const [selectionMode, setSelectionMode] = useState<'manual' | 'random'>('random');
  
  // Random picking count
  const [randomCount, setRandomCount] = useState<number>(5);
  
  // Manual picking list
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [searchQuestionTerm, setSearchQuestionTerm] = useState<string>('');

  // Notifications
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Load database entities
  const loadDatabase = () => {
    const list = getStoredQuizzes();
    setQuizzes(list);
    setAttempts(getStoredAttempts());
  };

  useEffect(() => {
    loadDatabase();
    
    // Set default selected date as today in June 2026
    const today = new Date();
    const todayStr = "2026-06-13"; // Set direct to local metadata date
    setSelectedDate(todayStr);

    window.addEventListener('db-quizzes-updated', loadDatabase);
    window.addEventListener('db-attempts-updated', loadDatabase);
    return () => {
      window.removeEventListener('db-quizzes-updated', loadDatabase);
      window.removeEventListener('db-attempts-updated', loadDatabase);
    };
  }, []);

  // Set months text array
  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calendar Calculation Helpers
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Compile all unique questions in the database categorized by Subject and Class level
  const getAvailableQuestionsInDb = (): { question: Question; sourceQuizTitle: string }[] => {
    const allQs: { question: Question; sourceQuizTitle: string }[] = [];
    quizzes.forEach(q => {
      if (q.subject === scheduleSubject && q.classLevel === scheduleClass) {
        q.questions.forEach(question => {
          if (!allQs.some(item => item.question.id === question.id)) {
            allQs.push({
              question,
              sourceQuizTitle: q.title
            });
          }
        });
      }
    });

    // Fallback compilation if there are no questions for this setup
    if (allQs.length === 0) {
      const chapterSyllabusList = SYLLABUS_DATA.filter(s => s.subject === scheduleSubject && s.classLevel === scheduleClass);
      chapterSyllabusList.forEach(chapter => {
        chapter.topics.forEach((topic, idx) => {
          allQs.push({
            question: {
              id: `q-dyn-${chapter.id}-${idx}`,
              text: `Standard IIT-JEE Practice Concept Evaluation: Assess advanced formulations in "${topic}". How do modifying variable spatial constants influence dynamic outputs?`,
              options: [
                'The system constant displays a balanced linear adjustment.',
                'The value decays quadratically based on localized inverse relationships.',
                'Symmetrical boundary configurations ensure core parameters remain stable.',
                'The system approaches state values corresponding to critical thresholds.'
              ],
              correctAnswerIndex: idx % 4,
              explanation: `Deduction framework corresponds directly to syllabus for Class ${scheduleClass} ${scheduleSubject} in "${topic}".`,
              topic,
              difficulty: idx % 3 === 0 ? 'Hard' : idx % 3 === 1 ? 'Medium' : 'Easy'
            },
            sourceQuizTitle: `${chapter.title} Standard Chapters`
          });
        });
      });
    }

    return allQs;
  };

  // Check if a date string has any scheduled tests
  const getQuizzesForDate = (dateStr: string) => {
    return quizzes.filter(q => q.isCustom && q.isCustom === true && (q as any).scheduledDate === dateStr);
  };

  // Handle building & deploying a new test series
  const handleScheduleTestSeries = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!scheduleTitle.trim()) {
      setErrorMsg('Test series title is required.');
      return;
    }

    if (!selectedDate) {
      setErrorMsg('Please select a target date from the calendar first.');
      return;
    }

    const availableQsWithSource = getAvailableQuestionsInDb();
    let questionsToAttach: Question[] = [];

    if (selectionMode === 'manual') {
      if (selectedQuestionIds.length === 0) {
        setErrorMsg('Please select at least 1 question to publish this test series.');
        return;
      }
      questionsToAttach = availableQsWithSource
        .filter(item => selectedQuestionIds.includes(item.question.id))
        .map(item => item.question);
    } else {
      // Random generation mode
      if (randomCount < 1 || randomCount > 25) {
        setErrorMsg('Number of random questions must be between 1 and 25.');
        return;
      }
      
      // Shuffle available elements
      const shuffled = [...availableQsWithSource].sort(() => 0.5 - Math.random());
      questionsToAttach = shuffled
        .slice(0, Math.min(randomCount, shuffled.length))
        .map(item => item.question);
    }

    // Build the scheduled Quiz entity
    const newQuizId = `scheduled-test-${Date.now()}`;
    const newQuiz: Quiz = {
      id: newQuizId,
      title: scheduleTitle.trim(),
      description: scheduleDescription.trim() || `Scheduled syllabus test evaluation for Class ${scheduleClass} covering ${scheduleSubject}. Check your notifications for target timings.`,
      subject: scheduleSubject,
      classLevel: scheduleClass,
      durationMinutes: scheduleDuration,
      questions: questionsToAttach,
      createdBy: user.name,
      createdAt: new Date().toISOString(),
      isCustom: true,
      // Cast custom attributes
      ...({
        scheduledDate: selectedDate,
        isScheduled: true
      } as any)
    };

    // Save test in the main collection list
    saveQuiz(newQuiz);

    // Save Notifications for ALL students in Class Level
    saveNotification({
      id: `scheduled-notif-${Date.now()}`,
      title: `⚡ New Test Series: ${scheduleSubject}`,
      message: `A new custom mock test "${scheduleTitle.trim()}" has been scheduled for Class ${scheduleClass} on ${selectedDate}. Check your calendar to attempt.`,
      type: 'test_ready',
      timestamp: new Date().toISOString(),
      read: false
    });

    setSuccessMsg('Test series successfully compiled, scheduled on calendar, and released to all active students!');
    
    // Reset Form attributes
    setScheduleTitle('');
    setScheduleDescription('');
    setSelectedQuestionIds([]);
    setShowScheduleForm(false);
    loadDatabase();

    setTimeout(() => {
      setSuccessMsg('');
    }, 5000);
  };

  // Student specific attempt state
  const isTestAttemptedByStudent = (quizId: string) => {
    return attempts.find(att => att.quizId === quizId && att.studentId === user.id);
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  // Generate date cells
  const calendarCells = [];
  // Prefill empty blocks
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push(i);
  }

  // Get active selected day quizzes
  const selectedDateQuizzes = getQuizzesForDate(selectedDate);
  const hasSelectedDateQuizzes = selectedDateQuizzes.length > 0;

  // Filter manuals by search term
  const allQsForDropdown = getAvailableQuestionsInDb();
  const filteredQsForSelection = allQsForDropdown.filter(item =>
    item.question.text.toLowerCase().includes(searchQuestionTerm.toLowerCase()) ||
    item.question.topic.toLowerCase().includes(searchQuestionTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 font-sans transition-all">
      
      {/* Header and overview */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-20 -mt-20 blur-3xl opacity-50"></div>
        <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row relative z-10">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
            <CalendarIcon className="h-6 w-6 stroke-[2]" />
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-800 tracking-tight font-display">Test Planner & Academic Calendar</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              {user.role === 'student' 
                ? 'Check upcoming test series scheduled by your faculty. Prepare beforehand and attempt exams on high accuracy standards.' 
                : 'Plan, customize, and publish new mock evaluations directly on specific calendar slots with custom selected questions.'}
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-2xl text-xs font-bold animate-bounce-short">
          ✨ {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMN LEFT (7 COLS): MONTHLY MULTI-COLOR ACCENT CALENDAR CELL GRID */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-[2.25rem] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Academic Schedule</span>
              <h2 className="text-xl font-black text-slate-800 font-display">
                {MONTHS[currentMonth]} {currentYear}
              </h2>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-white hover:text-indigo-600 rounded-lg text-slate-500 transition-all cursor-pointer"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-white hover:text-indigo-600 rounded-lg text-slate-500 transition-all cursor-pointer"
              >
                <ChevronRight className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* CALENDAR MAIN MATRIX GRID */}
          <div className="grid grid-cols-7 gap-2.5 text-center text-xs font-semibold">
            {DAYS_OF_WEEK.map(day => (
              <span key={day} className="text-[10px] uppercase tracking-wider text-slate-400 font-bold py-1">
                {day}
              </span>
            ))}

            {calendarCells.map((dayNum, cellIdx) => {
              if (dayNum === null) {
                return <div key={`empty-${cellIdx}`} className="h-12 bg-slate-50/30 rounded-xl"></div>;
              }

              // Parse date formatted: YYYY-MM-DD
              const monthStr = (currentMonth + 1).toString().padStart(2, '0');
              const dayStr = dayNum.toString().padStart(2, '0');
              const cellDateStr = `${currentYear}-${monthStr}-${dayStr}`;

              const isSelected = selectedDate === cellDateStr;
              const dateQuizzes = getQuizzesForDate(cellDateStr);
              const hasQuizzes = dateQuizzes.length > 0;

              // Color indicators based on subject levels
              const subjectsInCell = dateQuizzes.map(q => q.subject);
              const hasPhysics = subjectsInCell.includes('Physics');
              const hasChemistry = subjectsInCell.includes('Chemistry');
              const hasMaths = subjectsInCell.includes('Mathematics');

              // Highlight if today cell
              const isToday = cellDateStr === "2026-06-13"; // Using local current meta date 

              return (
                <button
                  key={`day-${dayNum}`}
                  onClick={() => setSelectedDate(cellDateStr)}
                  className={`h-14 sm:h-16 rounded-2xl flex flex-col items-center justify-between p-2 interface-element transition-all relative border ${
                    isSelected 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100 scale-102' 
                      : isToday
                        ? 'bg-indigo-50/50 hover:bg-slate-100/80 text-indigo-700 border-indigo-200'
                        : 'bg-slate-50/50 hover:bg-slate-100 border-slate-200/70 text-slate-700 hover:scale-101'
                  }`}
                >
                  <span className={`text-[11px] font-black ${isToday && !isSelected ? 'underline decoration-2' : ''}`}>
                    {dayNum}
                  </span>

                  {/* Multi color dots to represent scheduled exams */}
                  {hasQuizzes && (
                    <div className="flex items-center gap-1 mt-1 justify-center">
                      {hasPhysics && (
                        <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-red-500'}`} title="Physics Test"></span>
                      )}
                      {hasChemistry && (
                        <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} title="Chemistry Test"></span>
                      )}
                      {hasMaths && (
                        <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-500'}`} title="Mathematics Test"></span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* CALENDAR LEGEND & SHORT INFO */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 border-t border-slate-100 text-[10px] text-slate-400">
            <span className="font-bold uppercase tracking-wider font-mono">Legend:</span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500"></span> Physics Exam series
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Chemistry Exam series
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-500"></span> Mathematics Exam series
            </span>
          </div>

        </div>

        {/* COLUMN RIGHT (5 COLS): DETAILED SCHEDULE LIST OR SCHEDULING FORM */}
        <div className="lg:col-span-5 space-y-6">
          <AnimatePresence mode="wait">
            
            {showScheduleForm && user.role !== 'student' ? (
              
              /* EXAMS FORM CREATOR PANEL FOR TEACHERS */
              <motion.div
                key="scheduleForm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white border border-slate-200 rounded-[2.25rem] p-6 shadow-sm space-y-4 text-xs font-sans"
              >
                <div className="flex items-center justify-between pb-3 border-b border-secondary">
                  <h3 className="text-base font-black text-slate-800 font-display flex items-center gap-1.5">
                    <Sparkles className="h-5 w-5 text-indigo-500" /> Package & Schedule Test
                  </h3>
                  <button
                    onClick={() => setShowScheduleForm(false)}
                    className="text-slate-400 hover:text-slate-700 text-[11px] font-bold"
                  >
                    Cancel
                  </button>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 text-red-700 border border-red-200/50 rounded-2xl font-bold font-sans">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleScheduleTestSeries} className="space-y-4">
                  
                  {/* DATE NOTATION FIELD */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-mono font-bold text-indigo-600 block">Target Calendar Slot</span>
                    <span className="text-xs font-black text-slate-850 block mt-0.5">{selectedDate}</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block">Test Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Newton's Mechanics Practice Test"
                      value={scheduleTitle}
                      onChange={(e) => setScheduleTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block">Description (Instructions)</label>
                    <textarea
                      placeholder="Enter guidelines, syllabus limits, or scoring patterns..."
                      value={scheduleDescription}
                      onChange={(e) => setScheduleDescription(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
                    />
                  </div>

                  {/* SUBJECT CATEGORY & CURRICULUM SELECT */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Class Target</label>
                      <select
                        value={scheduleClass}
                        onChange={(e) => setScheduleClass(Number(e.target.value) as 11 | 12)}
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-bold cursor-pointer text-slate-705"
                      >
                        <option value={11}>Class 11</option>
                        <option value={12}>Class 12</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Subject Specialty</label>
                      <select
                        value={scheduleSubject}
                        onChange={(e) => setScheduleSubject(e.target.value as Subject)}
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-bold cursor-pointer text-slate-705"
                      >
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Mathematics">Mathematics</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block">Duration (Minutes)</label>
                    <input
                      type="number"
                      value={scheduleDuration}
                      min={5}
                      max={180}
                      onChange={(e) => setScheduleDuration(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-black text-slate-700"
                    />
                  </div>

                  {/* SELECT QUESTIONS: MANUAL OR RANDOM */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block">Question Selection Mode</label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setSelectionMode('random')}
                        className={`py-1.5 rounded-lg font-bold text-[11px] transition-all whitespace-nowrap cursor-pointer ${
                          selectionMode === 'random' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        🎲 Auto-Random Select
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectionMode('manual')}
                        className={`py-1.5 rounded-lg font-bold text-[11px] transition-all whitespace-nowrap cursor-pointer ${
                          selectionMode === 'manual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        📋 Choose from Library
                      </button>
                    </div>
                  </div>

                  {/* SELECT MODES SECTIONS RENDERING */}
                  {selectionMode === 'random' ? (
                    <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                      <label className="text-[10px] font-mono font-bold text-slate-500 block">Number of Questions to Pick</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={randomCount}
                        onChange={(e) => setRandomCount(Number(e.target.value))}
                        className="w-24 bg-white border border-slate-200 px-3 py-1.5 rounded-xl font-extrabold text-xs text-slate-800"
                      />
                      <span className="text-[9px] text-slate-400 block mt-1 leading-normal">
                        System will grab high-quality, pre-seeded queries matching <strong>Class {scheduleClass} {scheduleSubject}</strong>.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Question Selection List</label>
                        <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-md font-bold font-mono">
                          {selectedQuestionIds.length} Picked
                        </span>
                      </div>

                      <input
                        type="text"
                        placeholder="Filter questions by text..."
                        value={searchQuestionTerm}
                        onChange={(e) => setSearchQuestionTerm(e.target.value)}
                        className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold"
                      />

                      <div className="max-h-48 overflow-y-auto space-y-2 pr-1 text-[11px]">
                        {filteredQsForSelection.length === 0 ? (
                          <div className="py-6 text-center text-slate-400 italic font-medium">No matching library questions found.</div>
                        ) : (
                          filteredQsForSelection.map(item => {
                            const q = item.question;
                            const isChecked = selectedQuestionIds.includes(q.id);
                            return (
                              <button
                                type="button"
                                key={q.id}
                                onClick={() => {
                                  if (isChecked) {
                                    setSelectedQuestionIds(selectedQuestionIds.filter(id => id !== q.id));
                                  } else {
                                    setSelectedQuestionIds([...selectedQuestionIds, q.id]);
                                  }
                                }}
                                className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                                  isChecked 
                                    ? 'bg-indigo-50 border border-indigo-300 text-indigo-800' 
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/50'
                                }`}
                              >
                                <span className={`h-4.5 w-4.5 shrink-0 flex items-center justify-center rounded border ${
                                  isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                                }`}>
                                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                                </span>
                                <div className="space-y-1">
                                  <p className="font-semibold line-clamp-2 leading-snug">{q.text}</p>
                                  <div className="flex gap-2 text-[9px] text-slate-400 font-mono">
                                    <span>#{q.topic}</span>
                                    <span className="font-bold uppercase text-indigo-600">{q.difficulty}</span>
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all text-center flex items-center justify-center gap-1.5 shadow"
                  >
                    <Check className="h-4.5 w-4.5 stroke-[2.5]" /> Deploy Custom Test Series
                  </button>

                </form>
              </motion.div>

            ) : (

              /* VIEW SCHEDULE PANEL */
              <motion.div
                key="scheduleList"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white border border-slate-200 rounded-[2.25rem] p-6 shadow-sm space-y-6"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Detailed List</span>
                    <h3 className="text-base font-black text-slate-800 font-display">
                      Exams on {selectedDate ? selectedDate : 'Select Date'}
                    </h3>
                  </div>
                  {user.role !== 'student' && selectedDate && (
                    <button
                      onClick={() => setShowScheduleForm(true)}
                      className="py-1.5 px-3 bg-indigo-50 border border-indigo-200/20 text-indigo-600 font-bold text-xs rounded-xl flex items-center gap-1 hover:bg-indigo-100 transition-all cursor-pointer"
                    >
                      <Plus className="h-4 w-4 stroke-[2.5]" /> Schedule Test
                    </button>
                  )}
                </div>

                {/* SCHEDULED EXAMS CELLS */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 text-xs">
                  {!selectedDate ? (
                    <div className="py-10 text-center text-slate-400 font-medium italic">
                      Please tap a cell day in the interactive calendar grid to view or manage scheduled examinations.
                    </div>
                  ) : selectedDateQuizzes.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 space-y-2">
                      <HelpCircle className="h-8 w-8 text-slate-300 mx-auto stroke-[1.5]" />
                      <p className="font-semibold text-xs text-slate-500">No scheduled mock tests on this day slot.</p>
                      {user.role !== 'student' ? (
                        <p className="text-[10px] text-slate-400">Deploy custom question packs or start random testing loops directly!</p>
                      ) : (
                        <p className="text-[10px] text-slate-400">Everything looks quiet for today. Study core chapters on your study board!</p>
                      )}
                    </div>
                  ) : (
                    selectedDateQuizzes.map(quiz => {
                      const attemptedObj = isTestAttemptedByStudent(quiz.id);
                      const isAttempted = !!attemptedObj;

                      // Choose badge color based on subject
                      const isPhysics = quiz.subject === 'Physics';
                      const isChemistry = quiz.subject === 'Chemistry';
                      const badgeColor = isPhysics 
                        ? 'bg-rose-50 border-rose-200 text-rose-700' 
                        : isChemistry 
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
                          : 'bg-indigo-50 border-indigo-300 text-indigo-700';

                      return (
                        <div
                          key={quiz.id}
                          className="p-4 bg-slate-50/50 border border-slate-200/85 rounded-2xl space-y-3 hover:border-indigo-200/50 transition-all"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1">
                              <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider ${badgeColor}`}>
                                {quiz.subject} • Class {quiz.classLevel}
                              </span>
                              <h4 className="font-extrabold text-[13px] text-slate-805 leading-tight pt-1">
                                {quiz.title}
                              </h4>
                            </div>
                            {user.role !== 'student' && (
                              <button
                                onClick={() => {
                                  if (window.confirm('Wipe this test schedule and associated notifications?')) {
                                    const filtered = quizzes.filter(q => q.id !== quiz.id);
                                    localStorage.setItem('abhiyantra_quizzes', JSON.stringify(filtered));
                                    loadDatabase();
                                  }
                                }}
                                title="Delete schedule"
                                className="p-1 border border-slate-200 hover:border-red-300 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-500 leading-normal line-clamp-3">
                            {quiz.description}
                          </p>

                          <div className="flex items-center justify-between text-[11px] bg-white border border-slate-200/50 px-3 py-2 rounded-xl text-slate-500">
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="h-3.5 w-3.5 text-slate-400" /> {quiz.durationMinutes} Mins
                            </span>
                            <span className="font-black text-indigo-600">
                              {quiz.questions.length} Question{quiz.questions.length === 1 ? '' : 's'}
                            </span>
                          </div>

                          {/* ACTION FOOTER */}
                          {user.role === 'student' ? (
                            isAttempted ? (
                              <div className="flex items-center justify-between p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl">
                                <span className="text-[10px] font-black uppercase flex items-center gap-1">
                                  <Check className="h-3.5 w-3.5" /> Test Completed
                                </span>
                                <span className="font-mono font-bold text-xs">
                                  Score: {attemptedObj.score}%
                                </span>
                              </div>
                            ) : (
                              <button
                                onClick={() => onEnterTest(quiz.id)}
                                className="w-full py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-1.5 focus:scale-98 shadow-sm cursor-pointer"
                              >
                                🎯 Begin Evaluation Test <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            )
                          ) : (
                            <div className="space-y-2.5">
                              <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-[10px] text-slate-500 font-medium">
                                Written by <strong>{quiz.createdBy || 'Faculty'}</strong>. Deployed and active on student portals.
                              </div>
                              <button
                                onClick={() => onEnterTest(quiz.id)}
                                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-rose-100 cursor-pointer"
                              >
                                <Sparkles className="h-3.5 w-3.5 fill-current text-white animate-pulse" />
                                <span>Start Demo Test (Faculty Mode)</span>
                              </button>
                            </div>
                          )}

                        </div>
                      );
                    })
                  )}
                </div>

              </motion.div>

            )}

          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
