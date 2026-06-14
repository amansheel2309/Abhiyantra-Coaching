import React, { useState, useEffect } from 'react';
import { QuizAttempt, Quiz, UserProfile, Lecture } from '../types';
import { getStoredAttempts, getStoredQuizzes, getStoredLectures } from '../lib/dbStore';
import { BarChart, TrendingUp, BookOpen, Clock, AlertTriangle, CheckCircle, XCircle, Search, Sparkles, Eye, Play, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AnalyticsPanelProps {
  user: UserProfile;
}

export default function AnalyticsPanel({ user }: AnalyticsPanelProps) {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedAttemptDetail, setSelectedAttemptDetail] = useState<QuizAttempt | null>(null);
  const [selectedLectureForPlay, setSelectedLectureForPlay] = useState<Lecture | null>(null);

  useEffect(() => {
    const loadData = () => {
      setAttempts(getStoredAttempts().filter(a => a.studentId === user.id));
      setQuizzes(getStoredQuizzes());
      setLectures(getStoredLectures());
    };
    loadData();

    window.addEventListener('db-attempts-updated', loadData);
    window.addEventListener('db-lectures-updated', loadData);
    return () => {
      window.removeEventListener('db-attempts-updated', loadData);
      window.removeEventListener('db-lectures-updated', loadData);
    };
  }, [user.id]);

  const findMatchingLecture = (topicName: string) => {
    const normalizedTopic = topicName.toLowerCase();
    return lectures.find(l => {
      const title = l.title.toLowerCase();
      const desc = l.description.toLowerCase();
      
      if (normalizedTopic.includes('motion') || normalizedTopic.includes('friction') || normalizedTopic.includes('atwood')) {
        return title.includes('motion') || title.includes('friction');
      }
      if (normalizedTopic.includes('bond') || normalizedTopic.includes('orbital') || normalizedTopic.includes('dipole') || normalizedTopic.includes('vsepr') || normalizedTopic.includes('hybridization')) {
        return title.includes('bonding') || title.includes('orbital') || title.includes('vsepr') || title.includes('hybridization');
      }
      if (normalizedTopic.includes('potential') || normalizedTopic.includes('capacitance') || normalizedTopic.includes('electrostatic')) {
        return title.includes('potential') || title.includes('electrostatic');
      }
      if (normalizedTopic.includes('limit') || normalizedTopic.includes('continuity') || normalizedTopic.includes('hopital') || normalizedTopic.includes('calculus')) {
        return title.includes('limit') || title.includes('hopital');
      }
      return false;
    });
  };

  // Aggregate Metrics
  const totalTests = attempts.length;
  const averageAll = totalTests > 0 
    ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / totalTests) 
    : 0;
  const totalCorrect = attempts.reduce((sum, a) => sum + a.correctCount, 0);
  const totalWrong = attempts.reduce((sum, a) => sum + a.incorrectCount, 0);
  const totalQuestionsAnswered = totalCorrect + totalWrong;
  const overallAccuracy = totalQuestionsAnswered > 0 
    ? Math.round((totalCorrect / totalQuestionsAnswered) * 100) 
    : 0;

  // Aggregate Topic Statistics
  const topicStats: { [topic: string]: { correct: number; total: number } } = {};
  attempts.forEach(a => {
    Object.entries(a.topicPerformance).forEach(([topic, stats]) => {
      const typedStats = stats as { correct: number; total: number };
      if (!topicStats[topic]) {
        topicStats[topic] = { correct: 0, total: 0 };
      }
      topicStats[topic].correct += typedStats.correct;
      topicStats[topic].total += typedStats.total;
    });
  });

  // Calculate high vs struggling areas
  const weakTopics: string[] = [];
  const strongTopics: string[] = [];
  Object.entries(topicStats).forEach(([topic, stats]) => {
    const pct = (stats.correct / stats.total) * 100;
    if (pct < 70) {
      weakTopics.push(topic);
    } else {
      strongTopics.push(topic);
    }
  });

  return (
    <div className="space-y-8 text-slate-800 font-sans">
      
      {/* HEADER SUMMARY PANEL */}
      <div className="bg-white border border-slate-200 rounded-[2.25rem] p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-50/30 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
            <TrendingUp className="h-6 w-6 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">Performance Summary Report</h2>
            <p className="text-xs text-slate-500">Competitive metric breakdown for {user.name} • Class {user.classLevel}</p>
          </div>
        </div>

        {totalTests === 0 ? (
          <div className="text-center py-12 bg-slate-50 border border-slate-200 p-8 rounded-2xl">
            <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3 animate-pulse" />
            <p className="text-sm font-semibold text-slate-600">You haven't attempted any tests inside this session yet.</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Go to your Chapter Study Board, choose a topic under Class {user.classLevel}, wait for the countdown, and take the dynamic test series evaluation.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            
            <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold block">Evaluations Completed</span>
              <span className="text-2xl sm:text-3xl font-black text-indigo-600 mt-0.5">{totalTests}</span>
              <span className="text-[10px] text-slate-400 block mt-1.5 font-mono font-medium">Series tests taken</span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold block">Average Accuracy</span>
              <span className="text-2xl sm:text-3xl font-black text-indigo-600 mt-0.5">{averageAll}%</span>
              <span className="text-[10px] text-slate-500 block mt-1.5 font-mono font-medium">Cumulative score sum</span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold block">Solving Precision</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 mt-0.5">{overallAccuracy}%</span>
              <span className="text-[10px] text-slate-500 block mt-1.5 font-mono font-medium">Correct choice percentage</span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold block">Correct Submissions</span>
              <span className="text-2xl sm:text-3xl font-black text-blue-600 mt-0.5">{totalCorrect}</span>
              <span className="text-[10px] text-slate-500 block mt-1.5 font-mono font-medium">Across all test papers</span>
            </div>

          </div>
        )}
      </div>

      {totalTests > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* DETAILED TOPIC-MASTER GRIDS */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-[2.25rem] p-6 sm:p-8 shadow-sm space-y-6">
            <h3 className="text-md font-black tracking-tight flex items-center gap-2 pb-3 border-b border-slate-100 font-display">
              <BarChart className="h-5 w-5 text-indigo-600" /> Topic Accuracy Analytics
            </h3>
            
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              {Object.entries(topicStats).map(([topic, stats]) => {
                const percentage = Math.round((stats.correct / stats.total) * 100);
                let colorClass = 'bg-rose-500';
                let progressBg = 'bg-rose-50';
                let borderCol = 'border-rose-100';
                let textCol = 'text-rose-600';

                if (percentage >= 75) {
                  colorClass = 'bg-emerald-500';
                  progressBg = 'bg-emerald-50';
                  borderCol = 'border-emerald-100';
                  textCol = 'text-emerald-600';
                } else if (percentage >= 50) {
                  colorClass = 'bg-amber-500';
                  progressBg = 'bg-amber-50';
                  borderCol = 'border-amber-100';
                  textCol = 'text-amber-600';
                }

                return (
                  <div key={topic} className={`p-4 bg-slate-50 rounded-2xl border ${borderCol} space-y-2.5`}>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700 truncate pr-4">{topic}</span>
                      <span className={`font-mono font-extrabold ${textCol}`}>{percentage}% ({stats.correct}/{stats.total})</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div className={`h-full ${colorClass} rounded-full transition-all`} style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DYNAMIC ANALYSIS & RECOMMENDED REVISION ACTIONS */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-[2.25rem] p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <h3 className="text-md font-black tracking-tight flex items-center gap-2 pb-3 border-b border-slate-100 mb-5 font-display">
                <Sparkles className="h-5 w-5 text-indigo-600" /> Targeted Revise Actions
              </h3>

              {weakTopics.length === 0 ? (
                <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                  <CheckCircle className="h-6 w-6 text-emerald-600 mx-auto" />
                  <h4 className="text-xs font-black text-emerald-600 uppercase tracking-wider">Flawless Conceptual Flow!</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    All topics score above 70% precision. You have mastered initial Newtonian and bonding concepts.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Based on your competitive tests, we recommend spending extra time reviewing resources and practicing papers for correct formulas in:
                  </p>
                  <div className="space-y-3">
                    {weakTopics.slice(0, 4).map(topic => {
                      const matchingLecture = findMatchingLecture(topic);
                      return (
                        <div key={topic} className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                          <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-rose-800">{topic}</h4>
                            {matchingLecture ? (
                              <div className="mt-1 flex items-center justify-between gap-2">
                                <span className="text-[10px] text-slate-400 italic">Concept gap detected!</span>
                                <button
                                  onClick={() => setSelectedLectureForPlay(matchingLecture)}
                                  className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[9px] font-bold rounded flex items-center gap-1 cursor-pointer"
                                >
                                  <Play className="h-2 w-2" /> Watch Lesson
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500 italic mt-0.5 block">Recommended study: Review syllabus core formulas.</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl mt-4">
              <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider flex items-center gap-1.5 mb-1">
                <Clock className="h-3.5 w-3.5" /> Abhiyantra Coach Note
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                JEE/NEET questions require high precision. Our system considers any scoring rate below 70% to represent potential study gaps. Complete targeted reviews.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* COMPACT ATTEMPTS LIST & SOLUTIONS REVIEW MODULE */}
      {totalTests > 0 && (
        <div className="bg-white border border-slate-200 rounded-[2.25rem] p-6 sm:p-8 shadow-sm space-y-5">
          <h3 className="text-sm font-black tracking-tight pb-3 border-b border-slate-100 flex items-center justify-between font-display">
            <span className="text-slate-900">Historical Test Papers Submission Logs</span>
            <span className="text-xs font-mono text-slate-400">Click actions to review explanations</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wide">
                  <th className="pb-3 pr-4">Test Title</th>
                  <th className="pb-3 px-4">Subject</th>
                  <th className="pb-3 px-4">Accuracy</th>
                  <th className="pb-3 px-4 text-center">Correct/Wrong</th>
                  <th className="pb-3 px-4">Attempted At</th>
                  <th className="pb-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attempts.map(att => {
                  const quizDetail = quizzes.find(q => q.id === att.quizId);
                  
                  return (
                    <tr key={att.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 pr-4 max-w-xs font-bold text-slate-800 truncate">
                        {quizDetail ? quizDetail.title : 'Generated Custom Test'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          quizDetail?.subject === 'Physics' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                          quizDetail?.subject === 'Chemistry' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          'bg-purple-50 text-purple-600 border border-purple-100'
                        }`}>
                          {quizDetail?.subject || 'Custom'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 text-sm">
                        {att.score}%
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5 text-slate-600 font-bold font-mono">
                          <span className="text-emerald-600 flex items-center gap-0.5" title="Correct"><CheckCircle className="h-3.5 w-3.5" /> {att.correctCount}</span>
                          <span className="text-rose-500 flex items-center gap-0.5" title="Incorrect"><XCircle className="h-3.5 w-3.5" /> {att.incorrectCount}</span>
                          {att.unattemptedCount > 0 && <span className="text-slate-400 px-1 font-medium" title="Unattempted">Skipped: {att.unattemptedCount}</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono font-medium">
                        {new Date(att.completedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <button
                          onClick={() => setSelectedAttemptDetail(att)}
                          className="px-3.5 py-2 bg-slate-50 border border-slate-200 hover:border-indigo-400 text-slate-700 hover:text-indigo-600 rounded-xl transition-all flex items-center gap-1.5 ml-auto font-black text-[10px] uppercase tracking-wider"
                        >
                          <Eye className="h-3.5 w-3.5" /> Explain Solutions
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE SOLUTION DRILLDOWN DRAWER MODAL */}
      <AnimatePresence>
        {selectedAttemptDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 w-full max-w-4xl max-h-[85vh] rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-xl relative text-slate-800"
            >
              {/* Top Banner and metadata */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold text-indigo-600">EXAM REVISION EXPLAINER</span>
                  <h3 className="text-lg font-black text-slate-900 font-display mt-0.5">
                    {quizzes.find(q => q.id === selectedAttemptDetail.quizId)?.title || 'Generated Custom Test'}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedAttemptDetail(null)}
                  className="px-4 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 font-black rounded-xl text-xs transition-colors"
                >
                  Close Explanations
                </button>
              </div>

              {/* Questions Solution Content */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                {(quizzes.find(q => q.id === selectedAttemptDetail.quizId)?.questions || []).map((q, qIdx) => {
                  const selectedIdx = selectedAttemptDetail.answers[q.id];
                  const isCorrect = selectedIdx === q.correctAnswerIndex;
                  const wasSkipped = selectedIdx === undefined || selectedIdx === -1;

                  return (
                    <div key={q.id} className="p-5 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-4">
                      
                      {/* Question heading */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-2">
                          <span className="h-6 w-6 rounded-lg bg-white text-slate-500 text-xs font-bold font-mono flex items-center justify-center border border-slate-200">
                            Q{qIdx + 1}
                          </span>
                          <span className="text-xs font-black text-slate-500 uppercase tracking-wider self-center font-mono">
                            {q.topic} • {q.difficulty}
                          </span>
                        </div>
                        <div>
                          {wasSkipped ? (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-md border border-slate-200">
                              SKIPPED
                            </span>
                          ) : isCorrect ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-md flex items-center gap-1">
                              <CheckCircle className="h-3.5 w-3.5" /> CORRECT CHOICE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold rounded-md flex items-center gap-1">
                              <XCircle className="h-3.5 w-3.5" /> INCORRECT CHOICE
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Question Content */}
                      <p className="text-xs text-slate-800 font-bold leading-relaxed font-sans">
                        {q.text}
                      </p>

                      {/* Diagnostic Option Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {q.options.map((opt, optIdx) => {
                          const isCorrectOpt = optIdx === q.correctAnswerIndex;
                          const isSelectedOpt = optIdx === selectedIdx;

                          let bCol = 'border-slate-200 bg-white text-slate-600';
                          if (isCorrectOpt) {
                            bCol = 'border-emerald-300 bg-emerald-50/50 text-emerald-800 font-bold';
                          } else if (isSelectedOpt && !isCorrect) {
                            bCol = 'border-rose-300 bg-rose-50/50 text-rose-850';
                          }

                          return (
                            <div key={optIdx} className={`p-3 rounded-xl border text-xs flex gap-2 items-center ${bCol}`}>
                              <span className="font-bold opacity-60 font-mono">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              <span>{opt}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanatory solution walkthrough block */}
                      <div className="mt-3.5 p-4 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-sm">
                        <span className="text-[10px] font-black text-indigo-600 tracking-wider block uppercase font-mono">
                          PROOF / SOLUTION DRILLDOWN
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed font-sans">
                          {q.explanation}
                        </p>
                      </div>

                    </div>
                  );
                })}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POPUP: SECURE EMBEDDED VIDEO PLAYER MODAL FROM REPORTS */}
      <AnimatePresence>
        {selectedLectureForPlay && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-950 w-full max-w-4xl border border-slate-800 rounded-[2.25rem] shadow-2xl p-4 sm:p-6 space-y-4 relative overflow-hidden text-white"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedLectureForPlay(null)}
                className="absolute top-4 right-4 p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl transition-all cursor-pointer text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="pr-12">
                <span className="text-[9px] uppercase font-black tracking-widest text-indigo-400">
                  {selectedLectureForPlay.subject} • Class {selectedLectureForPlay.classLevel} revision tutorial
                </span>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white mt-1 leading-tight">
                  {selectedLectureForPlay.title}
                </h3>
              </div>

              {/* VIDEO PLAYER CONTAINER */}
              <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden border border-slate-850 relative shadow-inner">
                <iframe
                  src={selectedLectureForPlay.videoUrl}
                  title={selectedLectureForPlay.title}
                  className="w-full h-full absolute inset-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                <p className="text-slate-400 leading-relaxed max-h-24 overflow-y-auto">
                  {selectedLectureForPlay.description}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-900">
                  <span>Instructor: <strong className="text-slate-300 font-bold">{selectedLectureForPlay.addedBy}</strong></span>
                  <span>Duration: <strong className="text-slate-300 font-bold">{selectedLectureForPlay.durationMinutes} Minutes</strong></span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
