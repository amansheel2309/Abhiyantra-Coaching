import React, { useState, useEffect } from 'react';
import { UserProfile, Doubt, Subject } from '../types';
import { getStoredDoubts, saveDoubt, resolveDoubt, saveNotification } from '../lib/dbStore';
import { SYLLABUS_DATA } from '../lib/syllabus';
import { HelpCircle, CheckCircle2, Clock, Send, MessageSquare, Image, X, Search, Filter, BookOpen, AlertCircle, FileText, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DoubtsPanelProps {
  user: UserProfile;
}

export default function DoubtsPanel({ user }: DoubtsPanelProps) {
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [activeTab, setActiveTab] = useState<'ask' | 'history'>(user.role === 'student' ? 'ask' : 'history');
  
  // Student Form State
  const [subject, setSubject] = useState<Subject>('Physics');
  const [chapterId, setChapterId] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Admin/Teacher Answer State
  const [replyTexts, setReplyTexts] = useState<{ [doubtId: string]: string }>({});
  const [activeFilterSubject, setActiveFilterSubject] = useState<Subject | 'All'>('All');
  const [activeFilterStatus, setActiveFilterStatus] = useState<'All' | 'pending' | 'resolved'>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  const availableChapters = SYLLABUS_DATA.filter(
    c => c.subject === subject && c.classLevel === user.classLevel
  );

  useEffect(() => {
    if (availableChapters.length > 0) {
      setChapterId(availableChapters[0].id);
    } else {
      setChapterId('');
    }
  }, [subject]);

  const loadDoubts = () => {
    const list = getStoredDoubts();
    setDoubts(list);
  };

  useEffect(() => {
    loadDoubts();
    window.addEventListener('db-doubts-updated', loadDoubts);
    return () => {
      window.removeEventListener('db-doubts-updated', loadDoubts);
    };
  }, []);

  // Handle image conversion to Base64
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubmitError(null);
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setSubmitError('Image size must be less than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageDataUrl(null);
    const fileInput = document.getElementById('doubt-image-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleAskDoubtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!questionText.trim()) {
      setSubmitError('Please describe your question or doubt.');
      return;
    }

    const selectedChapter = SYLLABUS_DATA.find(c => c.id === chapterId);

    const newDoubt: Doubt = {
      id: `doubt-${Date.now()}`,
      studentId: user.id,
      studentName: user.name,
      subject: subject,
      chapterTitle: selectedChapter?.title || 'General Subject Doubt',
      questionText: questionText.trim(),
      imageUrl: imageDataUrl || undefined,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    saveDoubt(newDoubt);
    
    // Create notifications for teachers and admins
    saveNotification({
      id: `doubt-new-${newDoubt.id}-${Date.now()}`,
      title: '❓ New Doubt Asked!',
      message: `${user.name} (Class ${user.classLevel}) asked a doubt in ${subject}: "${questionText.substring(0, 45)}..."`,
      type: 'coaching_news',
      timestamp: new Date().toISOString(),
      read: false
    });

    setQuestionText('');
    setImageDataUrl(null);
    const fileInput = document.getElementById('doubt-image-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    
    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      setActiveTab('history');
    }, 1500);
  };

  const handleResolveSubmit = (doubtId: string) => {
    const text = replyTexts[doubtId]?.trim();
    if (!text) {
      alert('Please type an answer/solution first.');
      return;
    }

    const targetDoubt = doubts.find(d => d.id === doubtId);
    if (!targetDoubt) return;

    resolveDoubt(doubtId, text, user.name);
    
    // Send private alert notification to the student
    saveNotification({
      id: `doubt-resolved-${doubtId}-${Date.now()}`,
      title: '💬 Doubt Resolved!',
      message: `Teacher ${user.name} answered your doubt: "${targetDoubt.questionText.substring(0, 35)}..."`,
      type: 'coaching_news',
      timestamp: new Date().toISOString(),
      read: false,
      chapterId: targetDoubt.id
    });

    // Clear reply input state
    setReplyTexts(prev => {
      const copy = { ...prev };
      delete copy[doubtId];
      return copy;
    });
  };

  // Filter logic
  const filteredDoubts = doubts.filter(d => {
    // Role based scoping
    if (user.role === 'student' && d.studentId !== user.id) return false;
    
    // Subject filter
    const matchesSubject = activeFilterSubject === 'All' || d.subject === activeFilterSubject;
    
    // Status filter
    const matchesStatus = activeFilterStatus === 'All' || d.status === activeFilterStatus;
    
    // Search keyword query
    const matchesSearch = 
      d.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.chapterTitle && d.chapterTitle.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSubject && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8 text-slate-800 font-sans max-w-6xl mx-auto">
      
      {/* HEADER HERO AREA */}
      <div className="relative bg-gradient-to-br from-violet-600 via-indigo-700 to-indigo-800 border border-indigo-500/30 rounded-[2rem] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-24 -mt-24 pointer-events-none" />
        <div className="absolute bottom-0 left-20 w-40 h-40 bg-violet-500/20 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row relative z-10">
          <div className="p-3.5 bg-white/15 text-white rounded-2xl border border-white/20 backdrop-blur-sm shadow-md shrink-0">
            <HelpCircle className="h-6 w-6 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight font-display">
              {user.role === 'student' ? 'Ask a Doubt Arena' : 'Doubt Solving Desk'}
            </h2>
            <p className="text-xs text-indigo-200 mt-1 max-w-xl">
              {user.role === 'student' 
                ? 'Stuck on a JEE/NEET calculation or concept? Type it out, attach a picture of your notebook, and get answers from our top faculty.' 
                : 'Solve conceptual doubts asked by your students. Provide step-by-step explanations to reinforce their preparation.'}
            </p>
          </div>
        </div>
        
        {user.role === 'student' && (
          <div className="flex bg-white/10 p-1 rounded-2xl border border-white/15 z-10 shrink-0 select-none">
            <button
              onClick={() => setActiveTab('ask')}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${activeTab === 'ask' ? 'bg-white text-indigo-700 shadow-md font-black' : 'text-indigo-200 hover:text-white'}`}
            >
              Ask Doubt
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${activeTab === 'history' ? 'bg-white text-indigo-700 shadow-md font-black' : 'text-indigo-200 hover:text-white'}`}
            >
              My Questions
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        
        {/* ASK QUESTION FORM (STUDENTS ONLY) */}
        {user.role === 'student' && activeTab === 'ask' && (
          <motion.div
            key="ask-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Form Column */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[2.25rem] p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <MessageSquare className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">New Question Details</h3>
              </div>

              {submitError && (
                <div className="flex items-center gap-2.5 p-3.5 bg-red-50 text-red-700 border border-red-200/60 rounded-2xl text-xs font-semibold">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-600" />
                  <p>{submitError}</p>
                </div>
              )}

              {submitSuccess && (
                <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-250 rounded-2xl text-xs font-bold">
                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-600" />
                  <p>Your question has been published and sent to teachers successfully! Redirecting...</p>
                </div>
              )}

              <form onSubmit={handleAskDoubtSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* SUBJECT SELECTOR */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Subject Category</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value as Subject)}
                      className="w-full bg-slate-50 border border-slate-200 px-3.5 py-3 rounded-xl font-bold cursor-pointer text-slate-700 text-base md:text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Physics">⚛️ Physics</option>
                      <option value="Chemistry">🧪 Chemistry</option>
                      <option value="Mathematics">∑ Mathematics</option>
                      <option value="Biology">🧬 Biology</option>
                    </select>
                  </div>

                  {/* CHAPTER SELECTOR */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Target Chapter</label>
                    <select
                      value={chapterId}
                      onChange={(e) => setChapterId(e.target.value)}
                      disabled={availableChapters.length === 0}
                      className="w-full bg-slate-50 border border-slate-200 px-3.5 py-3 rounded-xl font-semibold cursor-pointer text-slate-700 text-base md:text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                    >
                      {availableChapters.length === 0 ? (
                        <option value="">No chapters active for Class {user.classLevel}</option>
                      ) : (
                        availableChapters.map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {/* QUESTION TEXTAREA */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Describe Your Doubt</label>
                  <textarea
                    required
                    rows={6}
                    placeholder="Type the full question text or describe the conceptual confusion. Be specific so teachers can explain step-by-step..."
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-medium focus:outline-none focus:border-indigo-500 text-slate-700 text-base md:text-xs placeholder:text-slate-400"
                  />
                </div>

                {/* IMAGE UPLOAD PANEL */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Attach Image (Optional)</label>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <label className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 border-dashed rounded-xl cursor-pointer transition-all active:scale-95 shrink-0 text-xs font-bold text-slate-600">
                      <Image className="h-4.5 w-4.5 text-slate-500" />
                      <span>Choose File / Screenshot</span>
                      <input
                        type="file"
                        id="doubt-image-upload"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">Supports JPG, PNG up to 2MB.</span>
                  </div>

                  {/* Base64 Preview Box */}
                  {imageDataUrl && (
                    <div className="relative mt-2 p-2 bg-slate-50 border border-slate-200 rounded-2xl w-40 h-40 flex items-center justify-center overflow-hidden group">
                      <img 
                        src={imageDataUrl} 
                        alt="Preview" 
                        className="w-full h-full object-contain rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute top-1.5 right-1.5 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all shadow-md active:scale-90"
                        title="Remove image"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* SUBMIT BUTTON */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-indigo-700 uppercase tracking-widest"
                  >
                    <Send className="h-3.5 w-3.5 fill-current" />
                    Submit Doubt
                  </button>
                </div>
              </form>
            </div>

            {/* Sidebar Guidelines */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-[2.25rem] p-6 shadow-sm space-y-5">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-3 border-b border-slate-100">
                Study Tips
              </h3>
              
              <div className="space-y-4 text-xs font-medium text-slate-600">
                <div className="p-3 bg-violet-50/50 border border-violet-100 rounded-xl">
                  <h4 className="font-bold text-indigo-700 mb-1">📝 Be Specific</h4>
                  <p className="leading-relaxed">Instead of asking "Solve this", explain exactly which step in the formula or derivation is confusing you.</p>
                </div>

                <div className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl">
                  <h4 className="font-bold text-emerald-700 mb-1">📸 Upload Diagrams</h4>
                  <p className="leading-relaxed">Upload a clear photo of your notebook attempt so teachers can identify exactly where you made a mistake.</p>
                </div>

                <div className="p-3 bg-amber-50/40 border border-amber-100 rounded-xl">
                  <h4 className="font-bold text-amber-700 mb-1">🚀 Fast Resolution</h4>
                  <p className="leading-relaxed">Doubts are synced directly to our active teachers. You will receive an immediate notification as soon as a faculty resolves it.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* HISTORY / DOUBT LIST BOARD (STUDENTS & FACULTY) */}
        {(user.role !== 'student' || activeTab === 'history') && (
          <motion.div
            key="doubts-list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* SEARCH AND FILTERS BAR */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search doubts or chapters..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-2.5 rounded-xl text-base md:text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end">
                {/* Subject Filter */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Filter className="h-3 w-3" /> Subject:
                  </span>
                  <select
                    value={activeFilterSubject}
                    onChange={(e) => setActiveFilterSubject(e.target.value as Subject | 'All')}
                    className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-bold cursor-pointer text-slate-600 text-base md:text-[11px] focus:outline-none"
                  >
                    <option value="All">All Subjects</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Biology">Biology</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Status:</span>
                  <select
                    value={activeFilterStatus}
                    onChange={(e) => setActiveFilterStatus(e.target.value as 'All' | 'pending' | 'resolved')}
                    className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-bold cursor-pointer text-slate-600 text-base md:text-[11px] focus:outline-none"
                  >
                    <option value="All">All Statuses</option>
                    <option value="pending">⏳ Pending Resolver</option>
                    <option value="resolved">✅ Resolved</option>
                  </select>
                </div>
              </div>
            </div>

            {/* DOUBTS ITEMS STREAM */}
            {filteredDoubts.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-[2.25rem] p-12 text-center shadow-sm">
                <BookOpen className="h-12 w-12 text-slate-300 mx-auto stroke-[1.5] mb-2" />
                <h4 className="text-sm font-bold text-slate-800">No questions found</h4>
                <p className="text-xs text-slate-400 mt-1">
                  {user.role === 'student' 
                    ? 'You have not asked any doubts matching this filter.' 
                    : 'Great job! No pending student doubts matching this filter.'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredDoubts.map(doubt => {
                  const isPending = doubt.status === 'pending';
                  
                  return (
                    <div
                      key={doubt.id}
                      className="bg-white border border-slate-200 rounded-[2.25rem] p-5 sm:p-7 shadow-sm hover:border-slate-300 transition-all space-y-4"
                    >
                      {/* Doubt Header details */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-mono font-bold ${
                            doubt.subject === 'Physics' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            doubt.subject === 'Chemistry' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            doubt.subject === 'Mathematics' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                            'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {doubt.subject}
                          </span>
                          <span className="text-[11px] font-bold text-slate-600">
                            {doubt.chapterTitle}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(doubt.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          
                          {isPending ? (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded font-bold text-[9px] flex items-center gap-1 animate-pulse shadow-sm">
                              <span className="h-1 w-1 bg-amber-600 rounded-full"></span> PENDING FACULTY
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold text-[9px] flex items-center gap-1 shadow-sm">
                              <span className="h-1 w-1 bg-emerald-600 rounded-full"></span> RESOLVED
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Question Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                        
                        {/* Question Text Column */}
                        <div className={`space-y-2.5 ${doubt.imageUrl ? 'md:col-span-8' : 'md:col-span-12'}`}>
                          {user.role !== 'student' && (
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                              <User className="h-3.5 w-3.5 text-indigo-500" />
                              <span>Asked by: {doubt.studentName}</span>
                            </div>
                          )}
                          <p className="text-xs font-semibold text-slate-700 leading-relaxed whitespace-pre-line">
                            {doubt.questionText}
                          </p>
                        </div>

                        {/* Image Column */}
                        {doubt.imageUrl && (
                          <div className="md:col-span-4 justify-self-center md:justify-self-end shrink-0">
                            <div className="relative bg-slate-50 border border-slate-200 p-1.5 rounded-2xl w-48 h-48 flex items-center justify-center overflow-hidden hover:scale-102 transition-transform shadow-sm cursor-zoom-in">
                              <img 
                                src={doubt.imageUrl} 
                                alt="Doubt notebook upload" 
                                className="w-full h-full object-contain rounded-xl"
                                onClick={() => {
                                  // Simple fullscreen image viewer fallback
                                  const win = window.open();
                                  if (win) {
                                    win.document.write(`<iframe src="${doubt.imageUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                  }
                                }}
                              />
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono text-center block mt-1">Click image to enlarge</span>
                          </div>
                        )}
                      </div>

                      {/* ANSWER SOLUTION CARD */}
                      {!isPending && (
                        <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl space-y-2 relative overflow-hidden">
                          <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200/60 justify-between">
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-700 uppercase tracking-wider">
                              <CheckCircle2 className="h-4.5 w-4.5" /> Faculty Solution response
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono">
                              By {doubt.repliedBy} • {doubt.repliedAt && new Date(doubt.repliedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-600 leading-relaxed whitespace-pre-line">
                            {doubt.replyText}
                          </p>
                        </div>
                      )}

                      {/* TEACHER SOLVE FORM (TEACHERS / ADMINS ONLY) */}
                      {isPending && user.role !== 'student' && (
                        <div className="bg-slate-50 border border-indigo-100 p-5 rounded-[2rem] space-y-4">
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 uppercase tracking-wider">
                            <MessageSquare className="h-4 w-4 stroke-[2.5]" /> Write solution explanation
                          </div>
                          <div className="space-y-3">
                            <textarea
                              rows={3}
                              placeholder="Write a clear, detailed, step-by-step mathematical proof or explanation to solve this doubt..."
                              value={replyTexts[doubt.id] || ''}
                              onChange={(e) => setReplyTexts(prev => ({ ...prev, [doubt.id]: e.target.value }))}
                              className="w-full bg-white border border-slate-200 p-3.5 rounded-xl font-medium focus:outline-none focus:border-indigo-500 text-slate-700 text-base md:text-xs placeholder:text-slate-400"
                            />
                            <button
                              type="button"
                              onClick={() => handleResolveSubmit(doubt.id)}
                              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-700 uppercase tracking-wider"
                            >
                              <Send className="h-3 w-3 fill-current" />
                              Publish Solution & Resolve
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
