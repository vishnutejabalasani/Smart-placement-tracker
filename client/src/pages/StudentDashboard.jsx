import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/layout/Navbar';
import KanbanBoard from '../components/dashboard/KanbanBoard';
import { 
  Briefcase, Award, GraduationCap, Code2, Sparkles, Search, Edit3, 
  CheckCircle, RefreshCw, Cpu, BookOpen, AlertTriangle, Send, 
  Smile, Award as AwardIcon, CheckCircle2, ChevronRight, X, PlayCircle
} from 'lucide-react';

const StudentDashboard = () => {
  const { user, token, updateProfile, newNotificationAlert, clearAlert } = useAuth();
  
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Job filters
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [eligibleOnly, setEligibleOnly] = useState(false);
  
  // Profile Editor Modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editCgpa, setEditCgpa] = useState('');
  const [editBranch, setEditBranch] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editResumeText, setEditResumeText] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');

  // AI Resume Co-Pilot state
  const [selectedOptimizeJobId, setSelectedOptimizeJobId] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState(null);
  
  // AI Mock Interview Simulation state
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [activeInterview, setActiveInterview] = useState(null);
  const [interviewAnswers, setInterviewAnswers] = useState(['', '', '']);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [submittingAnswers, setSubmittingAnswers] = useState(false);
  const [interviewResult, setInterviewResult] = useState(null);
  const [pastInterviews, setPastInterviews] = useState([]);
  
  const [actionLoading, setActionLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (user) {
      setEditCgpa(user.profile?.cgpa || '0.0');
      setEditBranch(user.profile?.branch || 'CSE');
      setEditSkills(user.profile?.skills?.join(', ') || '');
      setEditResumeText(user.profile?.resumeText || '');
      setEditPhone(user.profile?.phone || '');
    }
  }, [user]);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const jobsRes = await fetch(`${API_URL}/api/jobs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const jobsData = await jobsRes.json();
      if (jobsData.success) setJobs(jobsData.jobs);

      const appsRes = await fetch(`${API_URL}/api/applications/student`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const appsData = await appsRes.json();
      if (appsData.success) setApplications(appsData.applications);

      // Fetch completed interviews
      const listRes = await fetch(`${API_URL}/api/applications/interview/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const listData = await listRes.json();
      if (listData.success) setPastInterviews(listData.interviews);

    } catch (error) {
      console.error('Error fetching dashboard details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  useEffect(() => {
    if (newNotificationAlert && newNotificationAlert.type === 'APPLICATION_STATUS_UPDATED') {
      console.log('Dynamic status push intercepted! Re-polling applications...');
      fetchData();
    }
  }, [newNotificationAlert]);

  const handleApply = async (jobId) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ jobId })
      });
      const data = await response.json();
      
      if (data.success) {
        await fetchData();
      } else {
        alert(data.message || 'Failed to submit application');
      }
    } catch (err) {
      console.error('Apply transaction failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleKanbanStatusChange = async (appId, targetStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/applications/${appId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: targetStatus })
      });
      const data = await response.json();
      if (data.success) {
        setApplications(prev => 
          prev.map(app => app._id === appId ? { ...app, status: targetStatus } : app)
        );
      }
    } catch (err) {
      console.error('Failed to change Kanban position:', err);
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
      phone: editPhone
    });

    setActionLoading(false);
    if (result.success) {
      setUpdateMessage('Profile updated successfully!');
      setOptimizationSuggestions(null); // Clear suggestions once applied
      setTimeout(() => {
        setShowProfileModal(false);
        setUpdateMessage('');
      }, 1500);
      fetchData();
    } else {
      setUpdateMessage(`Error: ${result.message}`);
    }
  };

  // Trigger Resume optimization
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

  // Apply suggestions automatically to form
  const applyCopilotSuggestions = () => {
    if (!optimizationSuggestions) return;
    
    // Merge existing skills with suggested skills
    const existing = editSkills.split(',').map(s => s.trim()).filter(Boolean);
    const suggested = optimizationSuggestions.skills || [];
    const merged = Array.from(new Set([...existing.map(s => s.toUpperCase()), ...suggested.map(s => s.toUpperCase())]));
    
    setEditSkills(merged.join(', '));
    setEditResumeText(optimizationSuggestions.optimizedResume);
    alert('AI recommendations applied to form. Click "Save Settings" below to finalize.');
  };

  // Start Simulation from Kanban reviews
  const handleStartInterview = async (application) => {
    setInterviewLoading(true);
    setShowInterviewModal(true);
    setInterviewResult(null);
    setCurrentQuestionIdx(0);
    setInterviewAnswers(['', '', '']);
    
    try {
      const res = await fetch(`${API_URL}/api/applications/interview/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ applicationId: application._id })
      });
      const data = await res.json();
      if (data.success) {
        setActiveInterview(data.interview);
        // If resuming, set existing answers if present
        if (data.interview.answers && data.interview.answers.length > 0) {
          const ans = [...data.interview.answers];
          while (ans.length < 3) ans.push('');
          setInterviewAnswers(ans);
        }
      } else {
        alert(data.message || 'Failed to initiate mock simulation.');
        setShowInterviewModal(false);
      }
    } catch (err) {
      console.error('Interview start error:', err);
      setShowInterviewModal(false);
    } finally {
      setInterviewLoading(false);
    }
  };

  // Submit interview simulation
  const handleAnswerSubmit = async () => {
    setSubmittingAnswers(true);
    try {
      const res = await fetch(`${API_URL}/api/applications/interview/${activeInterview._id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answers: interviewAnswers })
      });
      const data = await res.json();
      if (data.success) {
        setInterviewResult(data.interview);
        fetchData(); // reload history
      } else {
        alert(data.message || 'Failed to evaluate interview.');
      }
    } catch (err) {
      console.error('Failed to submit interview:', err);
    } finally {
      setSubmittingAnswers(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.companyName.toLowerCase().includes(search.toLowerCase()) || 
                          job.role.toLowerCase().includes(search.toLowerCase());
    
    const matchesBranch = !branchFilter || job.eligibleBranches.length === 0 || 
                          job.eligibleBranches.some(b => b.toUpperCase() === branchFilter.toUpperCase());
    
    const studentCgpa = user?.profile?.cgpa || 0.0;
    const matchesEligibility = !eligibleOnly || studentCgpa >= job.cgpaCutoff;

    return matchesSearch && matchesBranch && matchesEligibility;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <Navbar />

      {newNotificationAlert && (
        <div className="mx-6 mt-4 p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/30 text-slate-800 flex items-center justify-between shadow-md animate-slide-down">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔔</span>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-purple-600">WebSocket Broadcast Alert</p>
              <p className="text-xs text-slate-700 font-semibold">{newNotificationAlert.payload?.message}</p>
            </div>
          </div>
          <button 
            onClick={clearAlert}
            className="text-[10px] bg-slate-200/60 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg transition-all uppercase"
          >
            Acknowledge
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Student Profile summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-purple-100 rounded-3xl p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-700 tracking-wider uppercase">Credentials</h3>
              <button 
                onClick={() => setShowProfileModal(true)}
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
            </div>
          </div>

          <div className="bg-white border border-purple-100 rounded-3xl p-6 space-y-4 shadow-sm">
            <h4 className="font-extrabold text-sm text-slate-700 tracking-wider uppercase border-b border-slate-100 pb-2">Filter Feed</h4>
            
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search company or role..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 text-slate-800 text-xs focus:ring-1 focus:ring-purple-500 transition-all outline-none font-medium"
                />
              </div>

              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 text-slate-800 text-xs focus:ring-1 focus:ring-purple-500 transition-all outline-none font-medium"
              >
                <option value="">All Branches</option>
                <option value="CSE">Computer Science</option>
                <option value="IT">Information Technology</option>
                <option value="ECE">Electronics</option>
                <option value="EE">Electrical</option>
                <option value="ME">Mechanical</option>
              </select>

              <label className="flex items-center gap-2 cursor-pointer pt-1 select-none">
                <input 
                  type="checkbox"
                  checked={eligibleOnly}
                  onChange={(e) => setEligibleOnly(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-50 border-slate-200 text-purple-600 focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-xs text-slate-600 font-medium">Show eligible listings only</span>
              </label>
            </div>
          </div>

          {/* AI Mock Interview History Sidebar */}
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
        </div>

        {/* RIGHT COLUMN: Active Job feed list */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-purple-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-800">Active Placement Opportunities</h3>
                <p className="text-xs text-slate-500">Apply to matching positions to trigger instant Gemini Resume assessments</p>
              </div>
              <button 
                onClick={fetchData}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all border border-slate-200"
                title="Refresh opportunities list"
              >
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
              </button>
            </div>

            {loading ? (
              <div className="py-20 flex items-center justify-center">
                <span className="w-8 h-8 border-3 border-slate-350 border-t-purple-550 rounded-full animate-spin"></span>
              </div>
            ) : filteredJobs.length === 0 ? (
              <p className="text-xs text-slate-450 text-center py-12">No active job listings match your current search filters.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredJobs.map(job => {
                  const studentCgpa = user?.profile?.cgpa || 0.0;
                  const meetsCgpa = studentCgpa >= job.cgpaCutoff;
                  const hasApplied = applications.some(app => app.job?._id === job._id);

                  return (
                    <div 
                      key={job._id}
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
                        ) : meetsCgpa ? (
                          <button
                            onClick={() => handleApply(job._id)}
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
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        <div className="bg-white border border-purple-100 rounded-3xl p-6 shadow-sm">
          <KanbanBoard 
            applications={applications} 
            onStatusChange={handleKanbanStatusChange} 
            onStartInterview={handleStartInterview}
          />
        </div>
      </div>

      {/* EDIT PROFILE MODAL WITH INTEGRATED AI CO-PILOT OPTIMIZER */}
      {showProfileModal && (
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

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Resume Plain Text Contents</label>
                <textarea 
                  value={editResumeText}
                  onChange={(e) => setEditResumeText(e.target.value)}
                  rows="6"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 text-slate-800 text-xs focus:ring-1 focus:ring-purple-500 transition-all outline-none font-medium resize-none text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowProfileModal(false);
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
      )}

      {/* AI STEP-BY-STEP MOCK INTERVIEW SIMULATION MODAL */}
      {showInterviewModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-purple-100 w-full max-w-2xl rounded-3xl p-6 flex flex-col gap-4 shadow-2xl relative overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-600 animate-spin-slow" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">AI Mock Coach Simulator</h3>
                  {activeInterview && (
                    <span className="text-[10px] text-purple-600 font-bold">
                      {activeInterview.job?.companyName || 'Corporate Target'} • Practice Module
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowInterviewModal(false);
                  fetchData(); // refresh history
                }}
                className="text-slate-400 hover:text-slate-700 bg-slate-100 p-1 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Interactive Stage */}
            {interviewLoading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3">
                <span className="w-8 h-8 border-3 border-slate-200 border-t-purple-600 rounded-full animate-spin"></span>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-extrabold animate-pulse">Gemini preparing interview canvas...</p>
              </div>
            ) : interviewResult ? (
              /* Scorecard screen */
              <div className="space-y-5 py-4 flex flex-col items-center">
                <div className="relative w-28 h-28 flex items-center justify-center rounded-full bg-slate-50 border-2 border-emerald-500 shadow-lg">
                  <span className="text-3xl font-black text-slate-800">{interviewResult.score}%</span>
                  <span className="absolute bottom-3 text-[9px] text-emerald-600 uppercase font-black tracking-widest">Score</span>
                </div>
                
                <div className="text-center space-y-1">
                  <h4 className="font-extrabold text-slate-800 text-sm">Evaluation Complete!</h4>
                  <p className="text-xs text-slate-500">Structured recommendations generated by Gemini AI</p>
                </div>

                <div className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2">
                  <span className="text-[10px] text-purple-600 font-black uppercase tracking-wider">Coach Feedback</span>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{interviewResult.feedback}</p>
                </div>

                <button
                  onClick={() => {
                    setShowInterviewModal(false);
                    fetchData(); // refresh
                  }}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  Acknowledge & Close
                </button>
              </div>
            ) : activeInterview ? (
              /* Active Simulation Terminal */
              <div className="space-y-4 text-left">
                {/* Progress bar */}
                <div className="w-full flex justify-between items-center text-[10px] text-slate-500">
                  <span>Question {currentQuestionIdx + 1} of 3</span>
                  <span className="font-extrabold text-purple-600">{Math.round(((currentQuestionIdx + 1)/3)*100)}% Complete</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                    style={{ width: `${((currentQuestionIdx + 1)/3)*100}%` }}
                  ></div>
                </div>

                {/* Question panel */}
                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 min-h-[90px] flex items-center">
                  <p className="text-xs text-slate-800 font-bold leading-relaxed">
                    {activeInterview.questions[currentQuestionIdx]}
                  </p>
                </div>

                {/* Answer box */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Your Response</label>
                  <textarea
                    rows="6"
                    value={interviewAnswers[currentQuestionIdx]}
                    onChange={(e) => {
                      const updated = [...interviewAnswers];
                      updated[currentQuestionIdx] = e.target.value;
                      setInterviewAnswers(updated);
                    }}
                    placeholder="Structure your answer clearly, including relevant coding syntax, system architectures, or examples where applicable..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-slate-800 text-xs transition-all outline-none font-medium resize-none leading-relaxed"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-2">
                  <button
                    disabled={currentQuestionIdx === 0}
                    onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-550 font-semibold rounded-lg text-xs transition-all"
                  >
                    Back
                  </button>
                  
                  {currentQuestionIdx < 2 ? (
                    <button
                      onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                      className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-all"
                    >
                      Next Question
                    </button>
                  ) : (
                    <button
                      onClick={handleAnswerSubmit}
                      disabled={submittingAnswers}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-all flex items-center gap-1 shadow-md"
                    >
                      {submittingAnswers ? 'Evaluating...' : 'Submit Answers'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 italic text-xs">
                Failed to configure practice module.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
