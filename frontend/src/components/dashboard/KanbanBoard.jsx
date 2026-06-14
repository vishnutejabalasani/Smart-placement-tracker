import React, { useState } from 'react';
import { Award, Briefcase, ChevronRight, ChevronLeft, Calendar, FileText, AlertCircle, Cpu } from 'lucide-react';

const KanbanBoard = ({ applications, onStatusChange, onStartInterview }) => {
  const [selectedApp, setSelectedApp] = useState(null); 
  const [draggedAppId, setDraggedAppId] = useState(null);

  const columns = [
    { id: 'Wishlist', title: 'Wishlist', color: 'border-t-blue-400 bg-blue-500/[0.02]' },
    { id: 'Applied', title: 'Applied', color: 'border-t-sky-400 bg-sky-500/[0.02]' },
    { id: 'OA', title: 'Assessment', color: 'border-t-amber-400 bg-amber-500/[0.02]' },
    { id: 'Interview', title: 'Interview', color: 'border-t-purple-400 bg-purple-500/[0.02]' },
    { id: 'Offered', title: 'Offered 🚀', color: 'border-t-emerald-400 bg-emerald-500/[0.02]' }
  ];

  const handleDragStart = (e, appId) => {
    setDraggedAppId(appId);
    e.dataTransfer.setData('text/plain', appId);
    e.currentTarget.style.opacity = '0.4';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    setDraggedAppId(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); 
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData('text/plain') || draggedAppId;
    if (appId) {
      onStatusChange(appId, targetStatus);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-755 border-emerald-100 bg-emerald-50';
    if (score >= 60) return 'text-purple-650 border-purple-100 bg-purple-50';
    return 'text-amber-700 border-amber-100 bg-amber-50';
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-wide">Application Roadmap</h2>
          <p className="text-xs text-slate-500 mt-0.5">Drag and drop cards to update your interview stages in real-time</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-purple-600"></span> HTML5 Fluid Drag Enabled
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {columns.map(col => {
          const colApps = applications.filter(app => app.status === col.id);

          return (
            <div 
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`min-h-[500px] rounded-2xl border border-slate-200/80 p-3 flex flex-col gap-3 transition-all duration-300 ${col.color} ${
                draggedAppId ? 'ring-2 ring-purple-500/10 bg-purple-500/[0.01]' : ''
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-600 tracking-wide uppercase">{col.title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-extrabold">
                  {colApps.length}
                </span>
              </div>

              <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[550px]">
                {colApps.length === 0 ? (
                  <div className="flex-1 border border-dashed border-slate-200 rounded-xl flex items-center justify-center py-12">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Drop here</span>
                  </div>
                ) : (
                  colApps.map(app => (
                    <div
                      key={app._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, app._id)}
                      onDragEnd={handleDragEnd}
                      className="bg-white border border-slate-200/60 shadow-sm rounded-xl p-3.5 flex flex-col gap-3 cursor-grab active:cursor-grabbing hover:border-purple-500/20"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 leading-snug">{app.job?.companyName}</h4>
                          <span className="text-[11px] text-slate-500 font-medium">{app.job?.role}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-50 border border-purple-100 text-purple-600 font-extrabold shrink-0">
                          {app.job?.package} LPA
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t border-b border-slate-100 py-2">
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          ⚡ Gemini Score:
                        </span>
                        <div className={`px-2 py-0.5 rounded-lg border text-xs font-black tracking-widest ${getScoreColor(app.matchScore)}`}>
                          {app.matchScore}%
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="text-[10px] text-purple-600 hover:text-white transition-all font-semibold flex items-center gap-1 bg-purple-50 hover:bg-purple-600 px-2 py-1 rounded-md border border-purple-100"
                        >
                          <FileText className="w-3 h-3" /> Review Match
                        </button>
                        <span className="text-[9px] text-slate-400">
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedApp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-purple-100 w-full max-w-xl rounded-2xl p-6 flex flex-col gap-5 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-800">AI Compatibility Analysis</h3>
                <p className="text-xs text-slate-500">{selectedApp.job?.companyName} • {selectedApp.job?.role}</p>
              </div>
              <button 
                onClick={() => setSelectedApp(null)}
                className="text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-lg text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-slate-100 pb-5">
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center rounded-full bg-slate-50 border border-purple-100 shadow-inner">
                <span className="text-2xl font-black text-slate-800">{selectedApp.matchScore}%</span>
                <span className="absolute bottom-2 text-[8px] text-purple-600 uppercase tracking-widest font-extrabold">Alignment</span>
              </div>
              
              <div className="flex-1 text-center sm:text-left space-y-2">
                <h4 className="font-bold text-sm text-slate-800">Gemini Executive Summary</h4>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "{selectedApp.matchFeedback || 'The evaluation was successful, matching core backend/frontend competencies.'}"
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-xs text-purple-600 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-purple-600" /> Recommended Keywords to Add
              </h4>
              <p className="text-xs text-slate-500">
                Integrate these target technical skills, methodologies, or terms in your resume to maximize recruiter shortlist rates:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedApp.recommendedKeywords?.length > 0 ? (
                  selectedApp.recommendedKeywords.map((kw, i) => (
                    <span 
                      key={i} 
                      className="px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-100 text-purple-600 text-xs font-semibold uppercase tracking-wide"
                    >
                      {kw}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-450 italic">No skill optimizations recommended. Your resume matches perfectly!</span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-2">
              <button 
                onClick={() => {
                  setSelectedApp(null);
                  if (onStartInterview) onStartInterview(selectedApp);
                }}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Cpu className="w-3.5 h-3.5" /> Practice Mock Interview
              </button>
              <button 
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
