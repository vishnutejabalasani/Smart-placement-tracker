import React from 'react';
import { BookOpen } from 'lucide-react';

const InterviewHistory = ({ pastInterviews }) => {
  return (
    <div className="bg-white border border-purple-100 rounded-3xl p-6 space-y-4 shadow-sm">
      <h4 className="font-extrabold text-sm text-slate-700 tracking-wider uppercase border-b border-slate-100 pb-2 flex items-center gap-1.5">
        <BookOpen className="w-4 h-4 text-purple-600" /> Practice Sessions
      </h4>
      
      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
        {pastInterviews.length === 0 ? (
          <p className="text-[11px] text-slate-400 italic py-4">No practice interviews completed yet. Start one via applied Kanban cards!</p>
        ) : (
          pastInterviews.map((intr) => (
            <div key={intr._id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-left flex flex-col gap-1">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-purple-700 font-black truncate w-32">{intr.job?.companyName}</span>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 rounded border border-emerald-100">
                  {intr.score}% Score
                </span>
              </div>
              <span className="text-[9px] text-slate-500">{intr.job?.role}</span>
              <p className="text-[9px] text-slate-600 line-clamp-2 mt-1 italic">"{intr.feedback}"</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default InterviewHistory;
