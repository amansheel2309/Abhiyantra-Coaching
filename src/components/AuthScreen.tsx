import React, { useState } from 'react';
import { UserProfile } from '../types';
import { getStoredUsersList, saveUsersList, setStoredUser } from '../lib/dbStore';
import { GraduationCap, ShieldCheck, Key, User, Mail, Sparkles, BookOpen, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [logoClicks, setLogoClicks] = useState(0);
  
  // Login fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Registration fields
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regClass, setRegClass] = useState<11 | 12>(12);
  const [regRole, setRegRole] = useState<'student' | 'teacher'>('student');

  // Status/Error states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!loginUsername || !loginPassword) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    const users = getStoredUsersList();
    const foundUser = users.find(
      u => u.username?.toLowerCase() === loginUsername.toLowerCase() && u.password === loginPassword
    );

    if (!foundUser) {
      setErrorMsg('Incorrect username or password. Please try again.');
      return;
    }

    if (foundUser.status === 'Suspended') {
      setErrorMsg('Your account has been suspended by the Admin. Please contact Aman (Admin).');
      return;
    }

    if (foundUser.status === 'Pending') {
      setErrorMsg('🛠️ Your Profile registration is currently PENDING review. Please contact Aman Sheel (Admin) to approve and activate your account.');
      return;
    }

    // Success! Let's login
    onLoginSuccess(foundUser);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regName || !regUsername || !regEmail || !regPassword) {
      setErrorMsg('All registration fields are required.');
      return;
    }

    const users = getStoredUsersList();
    const usernameTaken = users.some(u => u.username?.toLowerCase() === regUsername.toLowerCase());
    
    if (usernameTaken) {
      setErrorMsg('This username is already taken. Choose a different one.');
      return;
    }

    const emailTaken = users.some(u => u.email.toLowerCase() === regEmail.toLowerCase());
    if (emailTaken) {
      setErrorMsg('This email address is already registered.');
      return;
    }

    // Create a new user profile with status depending on role
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name: regName,
      email: regEmail,
      role: regRole, // user can choose to sign up as teacher or student!
      classLevel: regClass,
      username: regUsername,
      password: regPassword,
      status: regRole === 'teacher' ? 'Pending' : 'Active',
      createdAt: new Date().toISOString()
    };

    const updatedList = [...users, newUser];
    saveUsersList(updatedList);

    if (regRole === 'teacher') {
      setSuccessMsg(`📝 Faculty registration received! Your account status is now PENDING review from Aman Sheel (Admin). Please coordinate to authorize access.`);
    } else {
      setSuccessMsg(`Registration successful! You can now log in using your student credentials.`);
    }
    
    // Switch parameters
    setLoginUsername(regUsername);
    setLoginPassword(regPassword);
    
    // Clear inputs
    setRegName('');
    setRegUsername('');
    setRegEmail('');
    setRegPassword('');
    
    setTimeout(() => {
      setActiveTab('login');
    }, 1500);
  };

  const fillQuickLogin = (user: 'admin' | 'student' | 'teacher') => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setActiveTab('login');
    if (user === 'admin') {
      setLoginUsername('amansheel');
      setLoginPassword('rsdkdrss');
    } else if (user === 'student') {
      setLoginUsername('aman');
      setLoginPassword('student123');
    } else {
      setLoginUsername('sharma');
      setLoginPassword('teacher123');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-8 bg-slate-50">
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-indigo-50/50 via-slate-50/30 to-transparent -z-10 pointer-events-none"></div>
      
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-10 shadow-lg relative overflow-hidden space-y-6">
        
        {/* Brand identity header */}
        <div className="text-center space-y-2">
          <div 
            onClick={() => {
              const newClicks = logoClicks + 1;
              setLogoClicks(newClicks);
              if (newClicks === 5) {
                alert("🔓 Developer Diagnostics/Tester Credentials Deck is now unlocked and visible at the bottom of the form!");
              }
            }}
            className="mx-auto bg-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-md cursor-pointer select-none active:scale-95 transition-all"
            title="Logo"
          >
            <GraduationCap className="h-7 w-7 text-white stroke-[2]" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-indigo-600 font-extrabold block">Classes 11 & 12 • IIT-JEE & NEET</span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight font-display">
            abhiyantra <span className="text-indigo-600 font-bold">coaching</span>
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Rigorous Mock Test Series with Dynamic Chapters & Performance Analytics
          </p>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 text-xs">
          <button
            onClick={() => { setActiveTab('login'); setErrorMsg(null); }}
            className={`py-2 px-4 rounded-xl font-bold transition-all ${activeTab === 'login' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/20' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab('register'); setErrorMsg(null); }}
            className={`py-2 px-4 rounded-xl font-bold transition-all ${activeTab === 'register' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/20' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Register Student
          </button>
        </div>

        {/* Action Alerts */}
        {errorMsg && (
          <div className="flex items-center gap-2.5 p-3.5 bg-red-50 text-red-700 border border-red-200/60 rounded-2xl text-xs font-semibold animate-shake">
            <AlertCircle className="h-4 w-4 shrink-0 stroke-[2]" />
            <p>{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-250 rounded-2xl text-xs font-bold animate-bounce-short">
            <Sparkles className="h-4 w-4 shrink-0 text-emerald-600" />
            <p>{successMsg}</p>
          </div>
        )}

        {/* Form fields */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full bg-slate-50/50 pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Password</label>
              <div className="relative">
                <Key className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-50/50 pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              Access Test Series
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Aman Sheel"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-slate-50/50 pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Username</label>
                <input
                  type="text"
                  placeholder="aman"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full bg-slate-50/50 px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Password</label>
                <input
                  type="password"
                  placeholder="student123"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full bg-slate-50/50 px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="email"
                  placeholder="student@gmail.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-slate-50/50 pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Class Level</label>
                <select
                  value={regClass}
                  onChange={(e) => setRegClass(Number(e.target.value) as 11 | 12)}
                  className="w-full bg-slate-50 px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-bold text-slate-700"
                >
                  <option value={11}>Class 11</option>
                  <option value={12}>Class 12</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Register As</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as 'student' | 'teacher')}
                  className="w-full bg-slate-50 px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-bold text-slate-700"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher / Faculty</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              Sign Up For Classes
            </button>
          </form>
        )}

        {/* Preseeded Evaluator Help Deck (Hidden for students, tap logo 5 times to reveal) */}
        {logoClicks >= 5 && (
          <div className="pt-3 border-t border-slate-100 animate-fade-in">
            <div className="bg-indigo-50/40 p-4 rounded-out-[1.5rem] rounded-2xl border border-indigo-100/50 space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                <ShieldCheck className="h-4 w-4" /> Tester Credentials Deck (Unlocked)
              </h4>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => fillQuickLogin('admin')}
                  className="py-1 px-2 text-[10px] bg-white border border-slate-200 text-slate-700 rounded-lg hover:border-indigo-400 font-bold text-left transition-all shadow-sm cursor-pointer"
                >
                  💼 <strong>Admin</strong>
                  <span className="block text-[8px] text-slate-400">amansheel / rsdkdrss</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => fillQuickLogin('teacher')}
                  className="py-1 px-2 text-[10px] bg-white border border-slate-200 text-slate-700 rounded-lg hover:border-indigo-400 font-bold text-left transition-all shadow-sm cursor-pointer"
                >
                  🏫 <strong>Teacher</strong>
                  <span className="block text-[8px] text-slate-400">sharma / teacher123</span>
                </button>

                <button
                  type="button"
                  onClick={() => fillQuickLogin('student')}
                  className="py-1 px-2 text-[10px] bg-white border border-slate-200 text-slate-700 rounded-lg hover:border-indigo-400 font-bold text-left transition-all shadow-sm cursor-pointer"
                >
                  🎓 <strong>Student</strong>
                  <span className="block text-[8px] text-slate-400 font-mono">aman / student123</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
