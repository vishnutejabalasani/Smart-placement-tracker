import React from 'react';
import { GraduationCap, Briefcase, Code2, Edit3 } from 'lucide-react';

const ProfileSidebar = ({ user, onEditProfile, API_URL }) => {
  return (
    <div className="bg-white border border-purple-100 rounded-3xl p-6 space-y-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-extrabold text-sm text-slate-700 tracking-wider uppercase">Credentials</h3>
        <button 
          onClick={onEditProfile}
          className="text-xs text-purple-650 hover:text-white transition-all font-semibold flex items-center gap-1 bg-purple-50 hover:bg-purple-600 px-2.5 py-1.5 rounded-lg border border-purple-100"
        >
          <Edit3 className="w-3.5 h-3.5" /> Edit Profile
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wide">CGPA</span>
            <span className="text-sm font-black text-slate-800">{user?.profile?.cgpa?.toFixed(2) || '0.00'} / 10.0</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-650">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wide">Department</span>
            <span className="text-sm font-black text-slate-800">{user?.profile?.branch || 'N/A'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Code2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wide">Skills Profile</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {user?.profile?.skills?.length > 0 ? (
                user.profile.skills.map((s, i) => (
                  <span key={i} className="text-[9px] px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600 font-semibold">{s}</span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No skills specified</span>
              )}
            </div>
          </div>
        </div>

        {user?.profile?.resumeUrl && (
          <div className="flex items-center gap-3 border-t border-slate-100 pt-3 mt-1">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-650">
              <span className="text-lg">📄</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wide">Resume File</span>
              <a 
                href={`${API_URL}/api/auth/profile/resume/${user._id}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs font-extrabold text-purple-600 hover:text-purple-705 underline transition-all flex items-center gap-1"
              >
                View Uploaded Resume
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSidebar;
