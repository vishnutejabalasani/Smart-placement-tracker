import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/layout/Navbar';
import KanbanBoard from '../components/dashboard/KanbanBoard';
import ProfileSidebar from '../components/dashboard/ProfileSidebar';
import JobFilters from '../components/dashboard/JobFilters';
import InterviewHistory from '../components/dashboard/InterviewHistory';
import JobCard from '../components/dashboard/JobCard';
import EditProfileModal from '../components/dashboard/EditProfileModal';
import MockInterviewModal from '../components/dashboard/MockInterviewModal';
import { RefreshCw } from 'lucide-react';

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
          <ProfileSidebar 
            user={user} 
            onEditProfile={() => setShowProfileModal(true)} 
            API_URL={API_URL} 
          />

          <JobFilters 
            search={search} 
            setSearch={setSearch} 
            branchFilter={branchFilter} 
            setBranchFilter={setBranchFilter} 
            eligibleOnly={eligibleOnly} 
            setEligibleOnly={setEligibleOnly} 
          />

          <InterviewHistory pastInterviews={pastInterviews} />
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
                {filteredJobs.map(job => (
                  <JobCard 
                    key={job._id}
                    job={job}
                    userCgpa={user?.profile?.cgpa || 0.0}
                    hasApplied={applications.some(app => app.job?._id === job._id)}
                    onApply={handleApply}
                    actionLoading={actionLoading}
                  />
                ))}
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
      <EditProfileModal 
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        token={token}
        updateProfile={updateProfile}
        jobs={jobs}
        fetchData={fetchData}
        API_URL={API_URL}
      />

      {/* AI STEP-BY-STEP MOCK INTERVIEW SIMULATION MODAL */}
      <MockInterviewModal
        isOpen={showInterviewModal}
        onClose={() => {
          setShowInterviewModal(false);
          fetchData(); // refresh history
        }}
        interviewLoading={interviewLoading}
        activeInterview={activeInterview}
        interviewAnswers={interviewAnswers}
        setInterviewAnswers={setInterviewAnswers}
        currentQuestionIdx={currentQuestionIdx}
        setCurrentQuestionIdx={setCurrentQuestionIdx}
        handleAnswerSubmit={handleAnswerSubmit}
        submittingAnswers={submittingAnswers}
        interviewResult={interviewResult}
      />
    </div>
  );
};

export default StudentDashboard;
