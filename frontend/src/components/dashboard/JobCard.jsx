import React from 'react';
import { Sparkles, CheckCircle } from 'lucide-react';

const JobCard = ({ job, userCgpa, hasApplied, onApply, actionLoading }) => {
  const meetsCgpa = userCgpa >= job.cgpaCutoff;
  const isPastDeadline = job.deadline ? new Date() > new Date(job.deadline) : false;

  return (
    <div 
      className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col justify-between gap-4 relative overflow-hidden shadow-sm hover:border-purple-200 transition-all"
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] text-purple-600 font-extrabold uppercase tracking-wide">Job Opening</span>
            <h4 className="font-extrabold text-sm text-slate-800">{job.companyName}</h4>
          </div>
          <span className="text-xs font-black text-purple-700 bg-purple-50 px-2 py-0.5 border border-purple-100 rounded-md shrink-0">
            {job.package} LPA
          </span>
        </div>

        <div>
          <span className="block text-xs font-semibold text-slate-700">{job.role}</span>
          <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{job.description}</p>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
            meetsCgpa 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
              : 'bg-red-50 border-red-100 text-red-600'
          }`}>
            Cutoff: {job.cgpaCutoff.toFixed(2)} CGPA
          </span>
          
          {job.eligibleBranches?.length > 0 && job.eligibleBranches.map((br, index) => (
            <span key={index} className="text-[9px] font-bold bg-slate-50 border border-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase">
              {br}
            </span>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-100 pt-3 mt-1 flex items-center justify-between">
        <span className="text-[9px] text-slate-400">
          Deadline: {new Date(job.deadline).toLocaleDateString()}
        </span>

        {hasApplied ? (
          <span className="text-[10px] font-black text-emerald-700 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Applied
          </span>
        ) : isPastDeadline ? (
          <span 
            className="text-[9px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1.5 rounded-lg flex items-center gap-1 shrink-0 cursor-not-allowed"
            title="The application deadline has passed."
          >
            ⏰ Deadline Passed
          </span>
        ) : meetsCgpa ? (
          <button
            onClick={() => onApply(job._id)}
            disabled={actionLoading}
            className="text-[10px] bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-1.5 rounded-lg flex items-center gap-1 shrink-0 font-bold transition-all shadow-sm"
          >
            <Sparkles className="w-3 h-3 animate-pulse" /> Apply & AI Match
          </button>
        ) : (
          <span 
            className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-1.5 rounded-lg flex items-center gap-1 shrink-0 cursor-not-allowed"
            title="Your CGPA is below the minimum required for this company. Applications are strictly blocked."
          >
            ❌ Cutoff Blocked
          </span>
        )}
      </div>
    </div>
  );
};

export default JobCard;
