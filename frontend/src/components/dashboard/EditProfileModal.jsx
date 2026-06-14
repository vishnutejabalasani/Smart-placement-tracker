import React, { useState, useEffect } from 'react';
import { Sparkles, Cpu, Edit3 } from 'lucide-react';

const EditProfileModal = ({ 
  isOpen, 
  onClose, 
  user, 
  token, 
  updateProfile, 
  jobs, 
  fetchData, 
  API_URL 
}) => {
  const [editCgpa, setEditCgpa] = useState('');
  const [editBranch, setEditBranch] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editResumeText, setEditResumeText] = useState('');
  const [editResumeFile, setEditResumeFile] = useState(null);
  const [editResumeUrl, setEditResumeUrl] = useState('');
  const [editUploadStatus, setEditUploadStatus] = useState(''); // '', 'uploading', 'success', 'error'
  const [editPhone, setEditPhone] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [selectedOptimizeJobId, setSelectedOptimizeJobId] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setEditCgpa(user.profile?.cgpa || '0.0');
      setEditBranch(user.profile?.branch || 'CSE');
      setEditSkills(user.profile?.skills?.join(', ') || '');
      setEditResumeText(user.profile?.resumeText || '');
      setEditResumeUrl(user.profile?.resumeUrl || '');
      setEditPhone(user.profile?.phone || '');
    }
  }, [user]);

  if (!isOpen) return null;

  const handleEditFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setEditResumeFile(file);
    setEditUploadStatus('uploading');
    
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await fetch(`${API_URL}/api/auth/profile/upload-resume`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        setEditUploadStatus('success');
        setEditResumeUrl(data.resumeUrl);
        setEditResumeText(data.resumeText);
      } else {
        setEditUploadStatus('error');
        alert(data.message || 'Failed to upload resume');
      }
    } catch (err) {
      console.error('File upload error:', err);
      setEditUploadStatus('error');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setUpdateMessage('');
    setActionLoading(true);

    const skillsArray = editSkills.split(',').map(s => s.trim()).filter(Boolean);
    const result = await updateProfile({
      cgpa: parseFloat(editCgpa),
      branch: editBranch,
      skills: skillsArray,
      resumeText: editResumeText,
      resumeUrl: editResumeUrl,
      phone: editPhone
    });

    setActionLoading(false);
    if (result.success) {
      setUpdateMessage('Profile updated successfully!');
      setOptimizationSuggestions(null); // Clear suggestions once applied
      setTimeout(() => {
        onClose();
        setUpdateMessage('');
      }, 1500);
      fetchData();
    } else {
      setUpdateMessage(`Error: ${result.message}`);
    }
  };

  const triggerResumeOptimization = async () => {
    if (!selectedOptimizeJobId) return;
    setCopilotLoading(true);
    setOptimizationSuggestions(null);
    try {
      const response = await fetch(`${API_URL}/api/auth/profile/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ jobId: selectedOptimizeJobId })
      });
      const data = await response.json();
      if (data.success) {
        setOptimizationSuggestions(data.suggestions);
      } else {
        alert(data.message || 'Failed to optimize profile');
      }
    } catch (err) {
      console.error('Co-pilot optimization failed:', err);
    } finally {
      setCopilotLoading(false);
    }
  };

  const applyCopilotSuggestions = () => {
    if (!optimizationSuggestions) return;
    
    const existing = editSkills.split(',').map(s => s.trim()).filter(Boolean);
    const suggested = optimizationSuggestions.skills || [];
    const merged = Array.from(new Set([...existing.map(s => s.toUpperCase()), ...suggested.map(s => s.toUpperCase())]));
    
    setEditSkills(merged.join(', '));
    setEditResumeText(optimizationSuggestions.optimizedResume);
    alert('AI recommendations applied to form. Click "Save Settings" below to finalize.');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white border border-purple-100 w-full max-w-4xl rounded-3xl p-6 flex flex-col lg:flex-row gap-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* Left Column: Traditional Edit Fields */}
        <form onSubmit={handleSaveProfile} className="flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-base text-slate-800">Edit Academic & Skill Profile</h3>
          </div>

          {updateMessage && (
            <div className={`p-3 rounded-xl text-xs font-semibold text-center ${
              updateMessage.includes('Error') 
                ? 'bg-red-500/10 border border-red-500/20 text-red-600' 
                : 'bg-emerald-50 border border-emerald-100 text-emerald-700'
            }`}>
              {updateMessage}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">CGPA (out of 10.0)</label>
              <input 
                type="number"
                step="0.01"
                min="0"
                max="10"
                required
                value={editCgpa}
                onChange={(e) => setEditCgpa(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 text-slate-800 text-xs focus:ring-1 focus:ring-purple-500 transition-all outline-none font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Branch Department</label>
              <select
                value={editBranch}
                onChange={(e) => setEditBranch(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 text-slate-800 text-xs focus:ring-1 focus:ring-purple-500 transition-all outline-none font-medium"
              >
                <option value="CSE">Computer Science (CSE)</option>
                <option value="IT">Information Technology (IT)</option>
                <option value="ECE">Electronics (ECE)</option>
                <option value="EE">Electrical (EE)</option>
                <option value="ME">Mechanical (ME)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Phone Contact</label>
            <input 
              type="text"
              required
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 text-slate-800 text-xs focus:ring-1 focus:ring-purple-500 transition-all outline-none font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Technical Skills (Comma separated)</label>
            <input 
              type="text"
              value={editSkills}
              onChange={(e) => setEditSkills(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 text-slate-800 text-xs focus:ring-1 focus:ring-purple-500 transition-all outline-none font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center justify-between">
              <span>Resume File (PDF / TXT)</span>
              {editUploadStatus === 'uploading' && <span className="text-[9px] text-purple-600 font-bold animate-pulse">Uploading & parsing...</span>}
              {editUploadStatus === 'success' && <span className="text-[9px] text-emerald-650 font-extrabold">✓ Uploaded & parsed</span>}
              {editUploadStatus === 'error' && <span className="text-[9px] text-red-500 font-bold">⚠️ Upload failed</span>}
            </label>
            
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input 
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleEditFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold flex items-center gap-2 hover:bg-slate-100/50 hover:border-purple-200 transition-all">
                  <span>📁</span>
                  <span className="truncate text-slate-700">
                    {editResumeFile ? editResumeFile.name : editResumeUrl ? "Change uploaded resume file..." : "Select PDF or TXT resume file..."}
                  </span>
                </div>
              </div>
            </div>

            {editResumeText && (
              <div className="mt-2">
                <details className="group border border-slate-100 rounded-xl bg-slate-50/50 overflow-hidden">
                  <summary className="text-[9px] font-bold text-slate-500 uppercase tracking-wider p-2 cursor-pointer hover:bg-slate-50 transition-all flex items-center justify-between select-none">
                    <span>View Parsed Resume Text</span>
                    <span className="text-[8px] transition-transform group-open:rotate-180">▼</span>
                  </summary>
                  <div className="p-3 border-t border-slate-100 bg-white max-h-32 overflow-y-auto">
                    <p className="text-[10px] text-slate-600 font-mono leading-relaxed whitespace-pre-wrap">{editResumeText}</p>
                  </div>
                </details>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-2">
            <button 
              type="button" 
              onClick={() => {
                onClose();
                setOptimizationSuggestions(null);
              }}
              className="px-4 py-2 bg-slate-100 text-slate-650 font-semibold rounded-lg text-xs transition-all hover:bg-slate-200"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-xs transition-all shadow-sm"
            >
              {actionLoading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>

        {/* Right Column: AI Co-Pilot Optimizer Section */}
        <div className="lg:w-96 bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-purple-500/[0.02] blur-xl"></div>
          <div className="border-b border-slate-200 pb-2">
            <h4 className="font-extrabold text-sm text-purple-600 flex items-center gap-1.5 uppercase tracking-wide">
              <Cpu className="w-4 h-4 text-purple-605" /> AI Resume Optimizer
            </h4>
            <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
              Compare your resume details against any placement opening to get customized keyword and profile suggestions.
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase block">Select Target Opening</label>
              <select
                value={selectedOptimizeJobId}
                onChange={(e) => setSelectedOptimizeJobId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs outline-none focus:border-purple-500"
              >
                <option value="">-- Choose Job --</option>
                {jobs.map(j => (
                  <option key={j._id} value={j._id}>{j.companyName} - {j.role}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={triggerResumeOptimization}
              disabled={copilotLoading || !selectedOptimizeJobId}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 disabled:opacity-50 text-white font-bold rounded-lg text-xs uppercase tracking-wide transition-all flex items-center justify-center gap-1"
            >
              {copilotLoading ? 'Analyzing...' : 'Generate Recommendations'}
            </button>
          </div>

          {/* Optimization result payload */}
          {optimizationSuggestions ? (
            <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-1">
              <div className="space-y-1">
                <span className="text-[9px] text-purple-650 uppercase font-black tracking-wider block">Target Skill Tags</span>
                <div className="flex flex-wrap gap-1">
                  {optimizationSuggestions.skills.map((s, idx) => (
                    <span key={idx} className="text-[8px] px-1.5 py-0.5 bg-purple-50 border border-purple-100 text-purple-600 rounded-md font-extrabold">
                      + {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-1 text-left">
                <span className="text-[9px] text-purple-600 uppercase font-black tracking-wider block">Strengths Analysis</span>
                <p className="text-[10px] text-slate-600 leading-normal italic">
                  "{optimizationSuggestions.strengths}"
                </p>
              </div>

              <div className="space-y-1 text-left">
                <span className="text-[9px] text-purple-600 uppercase font-black tracking-wider block">Optimized Resume Draft</span>
                <div className="p-2 rounded bg-white border border-slate-200 text-[9px] text-slate-600 max-h-32 overflow-y-auto font-mono whitespace-pre-line leading-relaxed">
                  {optimizationSuggestions.optimizedResume}
                </div>
              </div>

              <button
                type="button"
                onClick={applyCopilotSuggestions}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg uppercase tracking-wide transition-all"
              >
                Apply Optimization
              </button>
            </div>
          ) : (
            !copilotLoading && (
              <div className="flex-1 flex flex-col items-center justify-center py-12 border border-dashed border-slate-200 rounded-xl">
                <Sparkles className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black">AI Co-Pilot Idle</span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
