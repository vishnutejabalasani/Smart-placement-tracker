import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/layout/Navbar';
import { Briefcase, Calendar, CheckCircle, Search, RefreshCw, Sparkles } from 'lucide-react';

const JobFeed = () => {
  const { user, token } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  
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
    } catch (err) {
      console.error('Error fetching job feed details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleApply = async (jobId) => {
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
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.companyName.toLowerCase().includes(search.toLowerCase()) || 
                          job.role.toLowerCase().includes(search.toLowerCase());
    const matchesBranch = !branchFilter || job.eligibleBranches.length === 0 || 
                          job.eligibleBranches.some(b => b.toUpperCase() === branchFilter.toUpperCase());
    return matchesSearch && matchesBranch;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-16 text-slate-800">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 mt-8 space-y-6">
        <div>
          <h2 className="text-2xl font-black tracking-wide text-slate-800">ANURAG UNIVERSITY PLACEMENT FEED</h2>
          <p className="text-xs text-slate-500">Apply to matching positions to trigger instant Gemini Resume assessments</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 bg-white border border-purple-100 p-4 rounded-2xl shadow-sm">
          <div className="relative flex-1">
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
            className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 text-slate-800 text-xs focus:ring-1 focus:ring-purple-500 transition-all outline-none font-medium sm:w-48"
          >
            <option value="">All Branches</option>
            <option value="CSE">Computer Science</option>
            <option value="IT">Information Technology</option>
            <option value="ECE">Electronics</option>
            <option value="EE">Electrical</option>
            <option value="ME">Mechanical</option>
          </select>

          <button 
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all self-end sm:self-auto border border-slate-200"
            title="Refresh Feed"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <span className="w-8 h-8 border-3 border-slate-200 border-t-purple-650 rounded-full animate-spin"></span>
          </div>
        ) : filteredJobs.length === 0 ? (
          <p className="text-xs text-slate-450 text-center py-12">No active job listings match your current search filters.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredJobs.map(job => {
              const studentCgpa = user?.profile?.cgpa || 0.0;
              const meetsCgpa = studentCgpa >= job.cgpaCutoff;
              const hasApplied = applications.some(app => app.job?._id === job._id);

              return (
                <div 
                  key={job._id}
                  className="bg-white border border-slate-150 rounded-2xl p-5 flex flex-col justify-between gap-4 relative overflow-hidden shadow-sm hover:border-purple-200 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] text-purple-600 font-extrabold uppercase tracking-wide">Campus Drive</span>
                        <h4 className="font-extrabold text-sm text-slate-800">{job.companyName}</h4>
                      </div>
                      <span className="text-xs font-black text-purple-700 bg-purple-50 px-2.5 py-0.5 border border-purple-100 rounded-md shrink-0">
                        {job.package} LPA
                      </span>
                    </div>

                    <div>
                      <span className="block text-xs font-semibold text-slate-700">{job.role}</span>
                      <p className="text-[11px] text-slate-500 line-clamp-3 mt-1 leading-relaxed">{job.description}</p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                        meetsCgpa 
                          ? 'bg-emerald-50 border-emerald-105 text-emerald-705' 
                          : 'bg-red-50 border-red-105 text-red-650'
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

                  <div className="border-t border-slate-100 pt-3 mt-2 flex items-center justify-between">
                    <span className="text-[9px] text-slate-400">
                      Deadline: {new Date(job.deadline).toLocaleDateString()}
                    </span>

                    {hasApplied ? (
                      <span className="text-[10px] font-black text-emerald-705 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-650" /> Applied
                      </span>
                    ) : meetsCgpa ? (
                      <button
                        onClick={() => handleApply(job._id)}
                        className="text-[10px] bg-purple-650 hover:bg-purple-705 text-white font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1 shrink-0 transition-all shadow-sm"
                      >
                        <Sparkles className="w-3 h-3" /> Apply & AI Match
                      </button>
                    ) : (
                      <span 
                        className="text-[9px] font-bold text-red-650 bg-red-50 border border-red-100 px-2 py-1.5 rounded-lg flex items-center gap-1 shrink-0 cursor-not-allowed"
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
  );
};

export default JobFeed;
