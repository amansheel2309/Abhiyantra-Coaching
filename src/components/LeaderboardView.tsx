import React, { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../types';
import { getStoredLeaderboard } from '../lib/dbStore';
import { Trophy, Award, Target, Hash, Zap, GraduationCap, ChevronUp } from 'lucide-react';
import { motion } from 'motion/react';

export default function LeaderboardView() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const handleUpdate = () => {
      setEntries(getStoredLeaderboard());
    };
    handleUpdate();

    window.addEventListener('db-leaderboard-updated', handleUpdate);
    return () => {
      window.removeEventListener('db-leaderboard-updated', handleUpdate);
    };
  }, []);

  return (
    <div className="space-y-8 text-slate-800 font-sans max-w-4xl mx-auto">
      
      {/* HEADER HERO AREA */}
      <div className="bg-white border border-slate-200 rounded-[2.25rem] p-6 sm:p-8 shadow-sm text-center relative overflow-hidden">
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-80 h-80 bg-indigo-50/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="bg-indigo-50 text-indigo-600 border border-indigo-200 px-4 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase inline-block mb-3">
          ABHIYANTRA ACADEMIC HONORS
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2 font-display">
          <Trophy className="h-7 w-7 text-indigo-600 stroke-[2] animate-pulse" /> Peer Leaderboard Arena
        </h2>
        <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed mt-2 font-medium">
          Foster healthy peer chemistry! Total points increment by +12 for every correct option and +20 for completing evaluation papers on schedule.
        </p>
      </div>

      {/* TOP THREE PODIUM SHOWCASE */}
      {entries.length >= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-end pt-4">
          
          {/* SILVER PODIUM (2nd RANK) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 text-center shadow-sm relative order-2 sm:order-1 sm:h-52 flex flex-col justify-between">
            <span className="absolute top-3 left-4 text-[10px] font-mono text-slate-400 font-bold uppercase">2nd Place</span>
            <div className="pt-2">
              <Award className="h-10 w-10 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900 truncate mt-2">{entries[1].studentName}</h4>
              <span className="text-[10px] text-slate-500 font-mono font-medium block">{entries[1].studentEmail}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-4">
              <span className="text-lg font-black text-slate-700 font-mono">{entries[1].totalPoints} Pts</span>
              <span className="text-[10px] text-slate-500 block font-semibold mt-0.5">Acc: {entries[1].averageScorePercentage}%</span>
            </div>
          </div>

          {/* GOLD PODIUM (1st RANK) */}
          <div className="bg-white border-2 border-indigo-500 rounded-[2rem] p-6 text-center shadow-md relative order-1 sm:order-2 sm:h-60 flex flex-col justify-between scale-105">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-indigo-600 text-white font-black px-4 py-0.5 rounded-b-xl text-[9px] uppercase tracking-wider shadow-sm">
              CAMPUS TOPPER
            </div>
            <div className="pt-4">
              <Trophy className="h-12 w-12 text-amber-500 mx-auto animate-bounce mt-1" />
              <h4 className="text-sm font-black text-indigo-600 truncate mt-2">{entries[0].studentName}</h4>
              <span className="text-[10px] text-slate-500 font-mono font-medium block">{entries[0].studentEmail}</span>
            </div>
            <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-100 mt-4">
              <span className="text-xl font-black text-indigo-600 font-mono">{entries[0].totalPoints} Pts</span>
              <span className="text-[10px] text-indigo-500 block font-semibold mt-0.5">Acc: {entries[0].averageScorePercentage}%</span>
            </div>
          </div>

          {/* BRONZE PODIUM (3rd RANK) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 text-center shadow-sm relative order-3 sm:order-3 sm:h-48 flex flex-col justify-between">
            <span className="absolute top-3 left-4 text-[10px] font-mono text-slate-400 font-bold uppercase">3rd Place</span>
            <div className="pt-2">
              <Award className="h-10 w-10 text-amber-700 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900 truncate mt-2">{entries[2].studentName}</h4>
              <span className="text-[10px] text-slate-500 font-mono font-medium block">{entries[2].studentEmail}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-4">
              <span className="text-lg font-black text-amber-800 font-mono">{entries[2].totalPoints} Pts</span>
              <span className="text-[10px] text-slate-500 block font-semibold mt-0.5">Acc: {entries[2].averageScorePercentage}%</span>
            </div>
          </div>

        </div>
      )}

      {/* DETAILED LEADERBOARD LIST */}
      <div className="bg-white border border-slate-200 rounded-[2.25rem] p-5 sm:p-7 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider">
                <th className="pb-3 pr-4 text-center w-12"><Hash className="h-3.5 w-3.5 mx-auto" /></th>
                <th className="pb-3 px-4">Student Profile</th>
                <th className="pb-3 px-4">Curriculum</th>
                <th className="pb-3 px-4">Tests Taken</th>
                <th className="pb-3 px-4">Avg score</th>
                <th className="pb-3 pl-4 text-right">Points Sum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((entry, idx) => {
                const isTopper = idx === 0;
                
                return (
                  <tr key={idx} className={`hover:bg-slate-50/60 transition-colors ${isTopper ? 'bg-indigo-50/10' : ''}`}>
                    <td className="py-3.5 pr-4 text-center font-bold">
                      {idx < 3 ? (
                        <span className={`inline-block font-black h-6 w-6 rounded-full text-xs flex items-center justify-center border ${
                          idx === 0 ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          idx === 1 ? 'bg-slate-100 text-slate-600 border-slate-300' :
                          'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {idx + 1}
                        </span>
                      ) : (
                        <span className="font-mono text-slate-400 font-bold">{idx + 1}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <span className={`text-xs font-bold block ${isTopper ? 'text-indigo-600' : 'text-slate-800'}`}>
                          {entry.studentName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">{entry.studentEmail}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-600 font-mono text-[10px]">
                        Class {entry.classLevel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                      {entry.testsTaken} papers
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span className="font-mono font-bold text-slate-800">{entry.averageScorePercentage}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      <span className="px-3 py-1 bg-slate-50 border border-slate-200 font-mono font-black text-indigo-600 rounded-lg shadow-sm">
                        {entry.totalPoints} pts
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
