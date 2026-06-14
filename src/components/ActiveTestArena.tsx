import React, { useState, useEffect } from 'react';
import { Quiz, Question, UserProfile, QuizAttempt, Lecture } from '../types';
import { submitQuizAttempt, getStoredLectures } from '../lib/dbStore';
import { Clock, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, HelpCircle, RefreshCw, Play, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ActiveTestArenaProps {
  quiz: Quiz;
  user: UserProfile;
  onClose: () => void;
  onAttemptSubmitted: () => void;
}

export default function ActiveTestArena({ quiz, user, onClose, onAttemptSubmitted }: ActiveTestArenaProps) {
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string]: number }>({});
  const [secondsLeft, setSecondsLeft] = useState(quiz.durationMinutes * 60);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [testFinished, setTestFinished] = useState(false);
  const [latestAttemptResult, setLatestAttemptResult] = useState<QuizAttempt | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedLectureForPlay, setSelectedLectureForPlay] = useState<Lecture | null>(null);

  useEffect(() => {
    setLectures(getStoredLectures());
  }, []);

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

  const questions = quiz.questions;
  const currentQuestion = questions[currentQIdx];

  // Active countdown effect
  useEffect(() => {
    if (testFinished) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [testFinished]);

  const handleSelectOption = (optIdx: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: optIdx
    });
  };

  const handleClearSelection = () => {
    const updated = { ...selectedAnswers };
    delete updated[currentQuestion.id];
    setSelectedAnswers(updated);
  };

  const handleAutoSubmit = () => {
    // Clock ran out! Force immediate compilation
    const attempt = submitQuizAttempt(quiz.id, user, questions, selectedAnswers);
    setLatestAttemptResult(attempt);
    setTestFinished(true);
  };

  const handleManualSubmit = () => {
    const attempt = submitQuizAttempt(quiz.id, user, questions, selectedAnswers);
    setLatestAttemptResult(attempt);
    setTestFinished(true);
    setShowConfirmSubmit(false);
  };

  const formatClockTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const skippedCount = questions.length - answeredCount;

  if (testFinished && latestAttemptResult) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-[2.25rem] p-6 sm:p-8 text-slate-800 text-center shadow-md space-y-8 relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-50/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-3">
          <div className="h-14 w-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle className="h-8 w-8 stroke-[2] animate-bounce" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 font-display">Test Completed Successfully!</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
            Great effort! Your test stats are mapped and synced immediately across Abhiyantras leaderboards and student analytics.
          </p>
        </div>

        {/* METRICS RESULTS CARD */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Accuracy Score</span>
            <span className="text-2xl font-black text-indigo-600 font-mono mt-0.5 block">{latestAttemptResult.score}%</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Correct choices</span>
            <span className="text-2xl font-black text-emerald-600 font-mono mt-0.5 block">{latestAttemptResult.correctCount} / {latestAttemptResult.totalQuestions}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Unattempted</span>
            <span className="text-2xl font-black text-slate-500 font-mono mt-0.5 block">{latestAttemptResult.unattemptedCount} skipped</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Mistakes sum</span>
            <span className="text-2xl font-black text-rose-500 font-mono mt-0.5 block">{latestAttemptResult.incorrectCount} choice</span>
          </div>
        </div>

        {/* STUDY RECOMMENDATIONS */}
        {latestAttemptResult.recommendedTopics.length > 0 && (
          <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl text-left space-y-2.5">
            <span className="text-[10px] font-black text-rose-600 tracking-wider flex items-center gap-1.5 uppercase font-mono">
              <AlertTriangle className="h-4 w-4 text-rose-500" /> Targeted Revision Core Areas (<span className="text-rose-600">{latestAttemptResult.recommendedTopics.length}</span>)
            </span>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Based on your response keys, we advise reviewing and practicing standard papers on the following subtopics before attempting other active segments:
            </p>
            <div className="flex flex-wrap gap-3 pt-1.5">
              {latestAttemptResult.recommendedTopics.map(topic => {
                const matchingLec = findMatchingLecture(topic);
                return (
                  <div key={topic} className="flex items-center gap-1.5 bg-white border border-rose-200 px-3 py-1 rounded-xl shadow-sm">
                    <span className="text-rose-700 font-extrabold text-[10px]">
                      {topic}
                    </span>
                    {matchingLec && (
                      <button
                        onClick={() => setSelectedLectureForPlay(matchingLec)}
                        className="px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[8px] font-bold rounded flex items-center gap-0.5 cursor-pointer"
                        title="Watch corresponding video lecture link"
                      >
                        <Play className="h-2 w-2" /> Watch Lesson
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DETAILED EXPLANATION AREA LINK */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-3">
          <h4 className="text-xs font-black text-slate-800 font-display">Interactive Solutions Walkthrough</h4>
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const studentAnswer = selectedAnswers[q.id];
              const isCorrectSelection = studentAnswer === q.correctAnswerIndex;
              
              return (
                <div key={q.id} className="p-4 bg-white rounded-xl space-y-3 text-xs border border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">Question {idx + 1} — {q.topic}</span>
                    {studentAnswer === undefined || studentAnswer === -1 ? (
                      <span className="text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md font-mono">Skipped</span>
                    ) : isCorrectSelection ? (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md font-mono font-bold">Passed</span>
                    ) : (
                      <span className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-md font-mono font-bold">Failed</span>
                    )}
                  </div>
                  <p className="text-slate-600 leading-relaxed font-semibold">{q.text}</p>
                  
                  <div className="text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 block shadow-sm">
                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-wider block font-mono">STEP-BY-STEP PROOF</span>
                    <p className="text-slate-500 leading-relaxed font-semibold">{q.explanation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => {
            onAttemptSubmitted();
            onClose();
          }}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all text-center block w-full sm:w-auto mx-auto cursor-pointer"
        >
          Return to Dashboard
        </button>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-slate-800 font-sans max-w-6xl mx-auto">
      
      {/* LEFT CONTENT: QUESTIONS ARENA PANEL */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[2.25rem] p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Exam Title header & Real-time countdown timer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
          <div>
            <span className="text-indigo-600 text-xs font-black uppercase tracking-wider block">
              {quiz.subject} • Assessment Office
            </span>
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-snug font-display mt-0.5">
              {quiz.title}
            </h2>
          </div>

          <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3 shrink-0 self-stretch sm:self-center">
            <Clock className="h-5 w-5 text-indigo-600 animate-pulse" />
            <div className="text-left font-mono">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Time Remaining</span>
              <span className={`text-base font-black tracking-wider ${secondsLeft < 60 ? 'text-rose-600 animate-ping' : 'text-indigo-605 text-indigo-600'}`}>
                {formatClockTime(secondsLeft)}
              </span>
            </div>
          </div>
        </div>

        {/* Current Question Block */}
        <div className="space-y-5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-extrabold text-slate-500 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded border border-slate-200 font-mono">
              Question {currentQIdx + 1} of {questions.length}
            </span>
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-extrabold rounded uppercase font-mono">
              {currentQuestion.difficulty} (+4 / -1 JEE Code)
            </span>
          </div>

          <p className="text-sm sm:text-base text-slate-800 font-bold leading-relaxed bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
            {currentQuestion.text}
          </p>

          {currentQuestion.imageUrl && (
            <div className="p-3 bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden flex items-center justify-center max-h-72 shadow-sm">
              <img 
                src={currentQuestion.imageUrl} 
                alt="Formulated question illustration diagram" 
                className="max-h-64 object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {/* Multiple Choice Option Buttons */}
          <div className="space-y-3">
            {currentQuestion.options.map((opt, idx) => {
              const isSelected = selectedAnswers[currentQuestion.id] === idx;
              
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full text-left p-4 rounded-xl border transition-all text-xs flex gap-3.5 items-center group cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/50 border-indigo-500 text-indigo-900 font-bold'
                      : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span className={`h-6 w-6 font-mono font-black text-xs rounded-full flex items-center justify-center shrink-0 border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 border-slate-200 text-slate-500 group-hover:text-slate-700 font-bold'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="font-semibold">{opt}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* NAVIGATION ACTIONS */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100 gap-3">
          <button
            onClick={() => setCurrentQIdx(prev => prev - 1)}
            disabled={currentQIdx === 0}
            className="px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>

          <button
            onClick={handleClearSelection}
            disabled={selectedAnswers[currentQuestion.id] === undefined}
            className="px-3 py-2 text-[10px] uppercase font-mono font-bold text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-20 cursor-pointer"
          >
            Clear Choice
          </button>

          <button
            onClick={() => {
              if (currentQIdx === questions.length - 1) {
                setShowConfirmSubmit(true);
              } else {
                setCurrentQIdx(prev => prev + 1);
              }
            }}
            className="px-4.5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-50"
          >
            {currentQIdx === questions.length - 1 ? 'Submit Review' : 'Next Question'}
            <ChevronRight className="h-4 w-4 stroke-[2]" />
          </button>
        </div>

      </div>

      {/* RIGHT CONTENT: QUESTION GRIDS NAVIGATOR */}
      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-[2.25rem] p-5 sm:p-6 shadow-sm space-y-6 flex flex-col justify-between">
        
        <div className="space-y-5">
          <h3 className="text-xs font-black tracking-wider text-slate-400 uppercase pb-2 border-b border-slate-100 font-display">
            Assessment Desk Map
          </h3>

          {/* Grid Numbers */}
          <div className="grid grid-cols-4 gap-2.5">
            {questions.map((q, idx) => {
              const isCurrent = currentQIdx === idx;
              const isAnswered = selectedAnswers[q.id] !== undefined;

              let styleClass = 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100';
              if (isCurrent) {
                styleClass = 'bg-indigo-600 text-white border-indigo-600 font-extrabold shadow-sm';
              } else if (isAnswered) {
                styleClass = 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold';
              }

              return (
                <button
                  key={idx}
                  onClick={() => setCurrentQIdx(idx)}
                  className={`py-2 rounded-xl text-xs font-mono font-bold text-center transition-all cursor-pointer ${styleClass}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Legend index marks */}
          <div className="space-y-2 pt-3 text-[10px] text-slate-400 border-t border-slate-100 font-bold">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 bg-slate-50 border border-slate-200 rounded"></span>
              <span>Not Attempted yet</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 bg-indigo-50 border border-indigo-200 rounded"></span>
              <span>Attempted / Choice set</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 bg-indigo-600 rounded"></span>
              <span>Currently active question</span>
            </div>
          </div>
        </div>

        {/* STATS COUNT & SECURE FINAL SUBMIT BUTTON */}
        <div className="space-y-4 pt-6 border-t border-slate-100">
          <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
            <span>Attempted: <strong className="text-slate-800">{answeredCount}</strong></span>
            <span>Skipped: <strong className="text-rose-500">{skippedCount}</strong></span>
          </div>

          <button
            onClick={() => setShowConfirmSubmit(true)}
            className="w-full py-3 bg-indigo-605 bg-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-sm hover:bg-indigo-700 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CheckCircle className="h-4 w-4 stroke-[2]" /> Submit Entire Test Paper
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] uppercase font-mono font-bold text-slate-500 hover:text-slate-700 text-center rounded-lg transition-colors cursor-pointer"
          >
            Abort test & return
          </button>
        </div>

      </div>

      {/* SECURE SUBMIT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showConfirmSubmit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 text-center"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-[2rem] p-6 max-w-sm w-full space-y-4 shadow-xl relative text-slate-800"
            >
              <div className="bg-amber-50 p-3 rounded-full w-12 h-12 flex justify-center items-center mx-auto text-amber-600 border border-amber-200">
                <AlertTriangle className="h-6 w-6 stroke-[2]" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 font-display">Submit Exam Sheets?</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1 font-semibold">
                  You have answered {answeredCount} and skipped {skippedCount} of the total {questions.length} questions. Once submitted, your scores will lock.
                </p>
              </div>
              <div className="flex gap-3 justify-end pt-2 font-black">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="w-1/2 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100 text-xs rounded-xl transition-all cursor-pointer"
                >
                  Resume Solving
                </button>
                <button
                  onClick={handleManualSubmit}
                  className="w-1/2 py-2.5 bg-indigo-600 text-white text-xs rounded-xl hover:bg-indigo-700 active:scale-95 transition-all text-center cursor-pointer shadow-sm"
                >
                  Yes, Submit!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POPUP: SECURE EMBEDDED VIDEO PLAYER MODAL FROM SCORECARD */}
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
