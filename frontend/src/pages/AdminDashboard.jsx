import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/layout/Navbar';
import { 
  Users, Briefcase, Award, TrendingUp, PlusCircle, 
  Trash2, ShieldAlert, CheckCircle, Clock, AlertTriangle, Terminal,
  UserCheck, ShieldCheck, UserX, BarChart2, PieChart
} from 'lucide-react';

const AdminDashboard = () => {
  const { token, notifications } = useAuth();
  
  const [stats, setStats] = useState({
    totalApplications: 0,
    totalPlaced: 0,
    activeJobs: 0,
    averagePackage: 0.0,
    stageBreakdown: {},
    branchPlacements: {},
    packageBrackets: { under5: 0, between5and10: 0, between10and15: 0, above15: 0 }
  });

  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Job Form Inputs
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');
  const [cgpaCutoff, setCgpaCutoff] = useState('7.0');
  const [eligibleBranches, setEligibleBranches] = useState('CSE, IT, ECE');
  const [packageLpa, setPackageLpa] = useState('8.0');
  const [deadline, setDeadline] = useState('');
  
  const [formMessage, setFormMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Active chart hover item
  const [hoveredStage, setHoveredStage] = useState(null);
  const [hoveredBracket, setHoveredBracket] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const statsRes = await fetch(`${API_URL}/api/applications/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.stats);

      const appsRes = await fetch(`${API_URL}/api/applications/admin`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const appsData = await appsRes.json();
      if (appsData.success) setApplications(appsData.applications);

      const jobsRes = await fetch(`${API_URL}/api/jobs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const jobsData = await jobsRes.json();
      if (jobsData.success) setJobs(jobsData.jobs);

      const anomaliesRes = await fetch(`${API_URL}/api/applications/anomalies`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const anomaliesData = await anomaliesRes.json();
      if (anomaliesData.success) setAnomalies(anomaliesData.anomalies);

    } catch (err) {
      console.error('Error fetching admin aggregates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Sync real-time WebSocket notifications into the local state
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      if (latest.type?.startsWith('ANOMALY')) {
        setAnomalies(prev => {
          // Avoid duplicate alerts
          const duplicate = prev.some(a => 
            a.timestamp === latest.timestamp || 
            (a.payload?.timestamp === latest.payload?.timestamp && a.payload?.studentId === latest.payload?.studentId)
          );
          if (duplicate) return prev;
          
          const newAnomaly = {
            _id: latest.payload?.anomalyId || `temp_${Date.now()}`,
            type: latest.type,
            payload: latest.payload,
            status: 'Pending',
            createdAt: latest.timestamp || new Date()
          };
          return [newAnomaly, ...prev];
        });
      }
    }
  }, [notifications]);

  const handleStatusChange = async (appId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/applications/${appId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (data.success) {
        await fetchData();
      }
    } catch (err) {
      console.error('Error updating application status:', err);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setFormMessage('');
    setActionLoading(true);

    try {
      const branchesArray = eligibleBranches.split(',').map(b => b.trim()).filter(Boolean);
      const response = await fetch(`${API_URL}/api/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          companyName,
          role,
          description,
          cgpaCutoff: parseFloat(cgpaCutoff),
          eligibleBranches: branchesArray,
          package: parseFloat(packageLpa),
          deadline
        })
      });
      const data = await response.json();

      if (data.success) {
        setFormMessage('Job posting created successfully! Active on Student feeds.');
        setCompanyName('');
        setRole('');
        setDescription('');
        setDeadline('');
        
        await fetchData();
      } else {
        setFormMessage(`Error: ${data.message}`);
      }
    } catch (err) {
      setFormMessage('Failed to create job posting.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!confirm('Are you sure you want to delete this job posting? This will remove it from student boards.')) return;
    try {
      const response = await fetch(`${API_URL}/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        await fetchData();
      }
    } catch (err) {
      console.error('Error deleting job listing:', err);
    }
  };

  const handleAnomalyAction = async (anomalyId, newStatus) => {
    if (anomalyId.startsWith('temp_')) {
      alert("Real-time alert syncing. Please refresh the page to perform database operations.");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/applications/anomalies/${anomalyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (data.success) {
        setAnomalies(prev => 
          prev.map(a => a._id === anomalyId ? { ...a, status: newStatus } : a)
        );
        fetchData(); // Reload statistics/placements if user is banned
      }
    } catch (err) {
      console.error('Failed to change anomaly state:', err);
    }
  };

  // Truncate function for strings
  const truncate = (str, len) => str.length > len ? str.slice(0, len) + '...' : str;

  // Trigonometric Math helper for SVG Donut chart
  const getDonutSlices = () => {
    const data = [
      { id: 'Wishlist', label: 'Wishlist', val: stats.stageBreakdown['Wishlist'] || 0, color: '#3b82f6' },
      { id: 'Applied', label: 'Applied', val: stats.stageBreakdown['Applied'] || 0, color: '#0ea5e9' },
      { id: 'OA', label: 'OA', val: stats.stageBreakdown['OA'] || 0, color: '#f59e0b' },
      { id: 'Interview', label: 'Interview', val: stats.stageBreakdown['Interview'] || 0, color: '#a855f7' },
      { id: 'Offered', label: 'Offered', val: stats.stageBreakdown['Offered'] || 0, color: '#10b981' },
      { id: 'Rejected', label: 'Rejected', val: stats.stageBreakdown['Rejected'] || 0, color: '#ef4444' }
    ];

    const total = data.reduce((acc, curr) => acc + curr.val, 0);
    let accumPercent = 0;

    return data.map(item => {
      const percent = total > 0 ? (item.val / total) * 100 : 0;
      const startAngle = (accumPercent / 100) * 360;
      accumPercent += percent;
      return { ...item, percent, startAngle };
    });
  };

  const donutSlices = getDonutSlices();
  const totalApplicationsCount = stats.totalApplications || 0;

  // Package Brackets formatting for Area/Line Chart
  const brackets = [
    { label: '< 5 LPA', val: stats.packageBrackets?.under5 || 0, x: 50, color: '#ef4444' },
    { label: '5-10 LPA', val: stats.packageBrackets?.between5and10 || 0, x: 150, color: '#3b82f6' },
    { label: '10-15 LPA', val: stats.packageBrackets?.between10and15 || 0, x: 250, color: '#a855f7' },
    { label: '15+ LPA', val: stats.packageBrackets?.above15 || 0, x: 350, color: '#10b981' }
  ];

  const maxBracketVal = Math.max(...brackets.map(b => b.val), 1);
  const getBracketY = (val) => 150 - (val / maxBracketVal) * 110;

  // Generate SVG Path for Area Chart
  const getAreaPath = () => {
    let path = `M ${brackets[0].x} ${getBracketY(brackets[0].val)}`;
    for (let i = 1; i < brackets.length; i++) {
      path += ` L ${brackets[i].x} ${getBracketY(brackets[i].val)}`;
    }
    // Close area path for gradient
    const closed = `${path} L ${brackets[3].x} 150 L ${brackets[0].x} 150 Z`;
    return { linePath: path, areaPath: closed };
  };

  const { linePath, areaPath } = getAreaPath();

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        {/* ROW 1: Analytics Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-purple-100 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Total Placed</span>
              <h3 className="text-2xl font-black text-slate-800">{stats.totalPlaced} Students</h3>
              <span className="block text-[9px] text-emerald-600 font-semibold uppercase">Offered Stage reached</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Award className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-purple-100 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Average package</span>
              <h3 className="text-2xl font-black text-slate-800">{stats.averagePackage.toFixed(2)} LPA</h3>
              <span className="block text-[9px] text-blue-600 font-semibold uppercase">CTC Mean Value</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-purple-100 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Active listings</span>
              <h3 className="text-2xl font-black text-slate-800">{stats.activeJobs} Jobs</h3>
              <span className="block text-[9px] text-purple-600 font-semibold uppercase">Active Corporate Openings</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Briefcase className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-purple-100 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Total submissions</span>
              <h3 className="text-2xl font-black text-slate-800">{stats.totalApplications} Applications</h3>
              <span className="block text-[9px] text-amber-700 font-semibold uppercase">Kanban active tracking</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* INTERACTIVE SVG ANALYTICS PANEL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Donut Chart - Stage Breakdown */}
          <div className="bg-white border border-purple-100 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-between relative">
            <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <PieChart className="w-4 h-4 text-purple-600" /> Stage Funnel
              </h3>
              <span className="text-[9px] bg-slate-50 px-2 py-1 border border-slate-200 rounded text-slate-500">
                {totalApplicationsCount} total
              </span>
            </div>
            
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(124,58,237,0.05)" strokeWidth="10" />
                {donutSlices.map((slice, i) => {
                  if (slice.val === 0) return null;
                  const radius = 50;
                  const circ = 2 * Math.PI * radius; // 314.16
                  const strokeVal = (slice.val / (totalApplicationsCount || 1)) * circ;
                  const offset = circ - strokeVal;
                  const rotation = slice.startAngle;
                  return (
                    <circle
                      key={slice.id}
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="none"
                      stroke={slice.color}
                      strokeWidth="10"
                      strokeDasharray={`${strokeVal} ${circ}`}
                      strokeDashoffset={0}
                      transform={`rotate(${rotation} 60 60)`}
                      className="transition-all duration-700 cursor-pointer hover:stroke-[12px]"
                      onMouseEnter={() => setHoveredStage(slice)}
                      onMouseLeave={() => setHoveredStage(null)}
                      style={{ transformOrigin: 'center' }}
                    />
                  );
                })}
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-800">
                  {hoveredStage ? hoveredStage.val : totalApplicationsCount}
                </span>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">
                  {hoveredStage ? hoveredStage.label : 'Submissions'}
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100">
              {donutSlices.map(slice => (
                <div key={slice.id} className="flex flex-col items-start text-left">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: slice.color }}></span>
                    <span className="text-[9px] text-slate-500 truncate w-14 font-semibold">{slice.label}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-800 pl-2.5">{slice.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SVG Area Chart - Placed Salary distribution */}
          <div className="bg-white border border-purple-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <TrendingUp className="w-4 h-4 text-purple-600" /> Salary CTC Brackets
              </h3>
              <span className="text-[9px] text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded font-black border border-purple-100">
                Offered Candidates
              </span>
            </div>

            <div className="relative flex-1 flex items-center justify-center">
              <svg viewBox="0 0 400 180" className="w-full h-40 overflow-visible">
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Guide lines */}
                <line x1="30" y1="40" x2="370" y2="40" stroke="rgba(0,0,0,0.03)" strokeDasharray="3 3" />
                <line x1="30" y1="95" x2="370" y2="95" stroke="rgba(0,0,0,0.03)" strokeDasharray="3 3" />
                <line x1="30" y1="150" x2="370" y2="150" stroke="rgba(0,0,0,0.08)" />

                {/* Area under the path */}
                {stats.totalPlaced > 0 && (
                  <path d={areaPath} fill="url(#areaGrad)" className="transition-all duration-1000" />
                )}

                {/* Line path */}
                {stats.totalPlaced > 0 && (
                  <path d={linePath} fill="none" stroke="#8b5cf6" strokeWidth="2.5" className="transition-all duration-1000" />
                )}

                {/* Data Points */}
                {brackets.map((pt, idx) => {
                  const cy = getBracketY(pt.val);
                  return (
                    <g key={pt.label} className="cursor-pointer">
                      <circle
                        cx={pt.x}
                        cy={cy}
                        r="4.5"
                        fill="#8b5cf6"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        className="transition-all duration-300 hover:r-6"
                        onMouseEnter={() => setHoveredBracket(pt)}
                        onMouseLeave={() => setHoveredBracket(null)}
                      />
                      <text
                        x={pt.x}
                        y="170"
                        textAnchor="middle"
                        fill="#64748b"
                        className="text-[9px] font-bold"
                      >
                        {pt.label}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip Overlay */}
              {hoveredBracket && (
                <div 
                  className="absolute bg-white border border-purple-200 text-slate-800 rounded-lg px-2.5 py-1 text-[10px] shadow-md pointer-events-none transition-opacity"
                  style={{
                    left: `${(hoveredBracket.x / 400) * 100}%`,
                    top: `${(getBracketY(hoveredBracket.val) / 180) * 100 - 30}%`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  <p className="font-extrabold text-purple-650">{hoveredBracket.val} Placed</p>
                  <p className="text-[8px] text-slate-450">{hoveredBracket.label}</p>
                </div>
              )}
            </div>
          </div>

          {/* SVG Bar Chart - Branch Placements */}
          <div className="bg-white border border-purple-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <BarChart2 className="w-4 h-4 text-purple-600" /> Placements by Branch
              </h3>
              <span className="text-[9px] bg-slate-50 px-2 py-1 border border-slate-200 rounded text-slate-500">
                Department wise
              </span>
            </div>

            <div className="flex-1 flex flex-col justify-center space-y-4">
              {Object.keys(stats.branchPlacements).length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 italic">
                  No branch placements logged yet.
                </div>
              ) : (
                Object.entries(stats.branchPlacements).map(([branch, count]) => {
                  const maxVal = Math.max(...Object.values(stats.branchPlacements), 1);
                  const widthPercent = (count / maxVal) * 100;
                  return (
                    <div key={branch} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-bold text-slate-700">{branch}</span>
                        <span className="font-extrabold text-purple-600">{count} Offered</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                        <div 
                          style={{ width: `${widthPercent}%` }}
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 shadow-sm transition-all duration-1000"
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ROW 2: Split columns for Job Posting Form + System Anomaly logs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Create Job Posting Form */}
          <div className="lg:col-span-7 bg-white border border-purple-100 rounded-3xl p-6 shadow-sm">
            <h3 className="font-extrabold text-base text-slate-800 tracking-wide border-b border-slate-100 pb-3 mb-4 flex items-center gap-1.5">
              <PlusCircle className="w-5 h-5 text-purple-600" /> Dispatch Corporate Job Listing
            </h3>

            {formMessage && (
              <div className={`p-3 rounded-xl text-xs font-semibold text-center mb-4 ${
                formMessage.includes('Error') 
                  ? 'bg-red-500/10 border border-red-500/20 text-red-600' 
                  : 'bg-emerald-50 border border-emerald-100 text-emerald-700'
              }`}>
                {formMessage}
              </div>
            )}

            <form onSubmit={handleCreateJob} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Company Name</label>
                <input 
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Google, Microsoft, Amazon"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-205 focus:border-purple-500 text-slate-800 text-xs focus:ring-1 focus:ring-purple-500 transition-all outline-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Role Title</label>
                <input 
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Software Engineer Intern"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-205 focus:border-purple-500 text-slate-800 text-xs focus:ring-1 focus:ring-purple-500 transition-all outline-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Salary Package (LPA)</label>
                <input 
                  type="number"
                  step="0.1"
                  required
                  value={packageLpa}
                  onChange={(e) => setPackageLpa(e.target.value)}
                  placeholder="e.g. 12.5"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-205 focus:border-purple-500 text-slate-800 text-xs focus:ring-1 focus:ring-purple-500 transition-all outline-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Min Eligibility CGPA Cutoff</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  required
                  value={cgpaCutoff}
                  onChange={(e) => setCgpaCutoff(e.target.value)}
                  placeholder="e.g. 7.5"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-205 focus:border-purple-500 text-slate-800 text-xs focus:ring-1 focus:ring-purple-500 transition-all outline-none font-medium"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Eligible Branches (Comma separated)</label>
                <input 
                  type="text"
                  value={eligibleBranches}
                  onChange={(e) => setEligibleBranches(e.target.value)}
                  placeholder="CSE, IT, ECE (leave empty for open eligibility)"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-205 focus:border-purple-500 text-slate-800 text-xs focus:ring-1 focus:ring-purple-500 transition-all outline-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Application Deadline</label>
                <input 
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-205 focus:border-purple-500 text-slate-800 text-xs focus:ring-1 focus:ring-purple-500 transition-all outline-none font-medium"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Job Description & Tech Requirements</label>
                <textarea 
                  required
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Specify key expectations, coding capabilities and technical keywords required for candidates..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-205 focus:border-purple-500 text-slate-800 text-xs focus:ring-1 focus:ring-purple-500 transition-all outline-none font-medium resize-none text-[11px]"
                />
              </div>

              <button 
                type="submit" 
                disabled={actionLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold sm:col-span-2 py-3 rounded-xl text-xs uppercase tracking-wider mt-2 transition-all shadow-sm"
              >
                {actionLoading ? 'Publishing...' : 'Broadcast Opportunity'}
              </button>
            </form>
          </div>

          {/* REAL-TIME SECURITY ANOMALY LOGS WITH REMEDIATION ACTIONS */}
          <div className="lg:col-span-5 bg-white border border-purple-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-red-500/[0.01] blur-2xl"></div>
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-800 tracking-wide flex items-center gap-1.5">
                <Terminal className="w-5 h-5 text-red-500 animate-pulse" /> Security Command Center
              </h3>
              <span className="text-[9px] bg-red-50 border border-red-105 text-red-600 px-2 py-1 rounded-md uppercase font-extrabold tracking-wider">
                Active Guardian
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-normal">
              Flagged student attempts captured in real-time. Use buttons below each anomaly log to execute warnings, clear alerts, or ban violators.
            </p>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[380px] pr-1">
              {anomalies.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-20 border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
                  <CheckCircle className="w-8 h-8 text-emerald-500/65 mb-2" />
                  <span className="text-[10px] text-slate-450 font-extrabold uppercase tracking-wide">No anomalies flagged</span>
                  <span className="text-[9px] text-slate-400">All student transactions compliant</span>
                </div>
              ) : (
                anomalies.map((anom) => (
                  <div 
                    key={anom._id} 
                    className="p-3 bg-slate-50 border border-slate-200 hover:border-purple-200 rounded-xl flex flex-col gap-2 text-left transition-all"
                  >
                    <div className="flex items-start gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-red-600 font-black uppercase tracking-wider">
                            {anom.type === 'ANOMALY_CGPA_BYPASS' ? 'CGPA Cutoff Bypass' : 'API Rate Spike'}
                          </span>
                          <span className="text-[8px] text-slate-400">
                            {new Date(anom.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 font-medium">
                          {anom.type === 'ANOMALY_CGPA_BYPASS' 
                            ? `${anom.payload?.studentName || 'Student'} attempted to apply for ${anom.payload?.companyName || 'Job'} but did not meet CGPA cutoff.` 
                            : (anom.payload?.message || `Rate spike from IP ${anom.payload?.ip} with ${anom.payload?.requestCount} hits.`)}
                        </p>
                        {anom.type === 'ANOMALY_CGPA_BYPASS' && (
                          <div className="text-[9px] text-slate-500 bg-white px-2 py-1 rounded border border-slate-100 flex flex-col">
                            <span>Student: {anom.payload?.studentName} (CGPA {anom.payload?.studentCgpa})</span>
                            <span>Required: {anom.payload?.companyName} requires {anom.payload?.requiredCgpa}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 pt-1 text-[9px]">
                          <span className="text-slate-400">Status:</span>
                          <span className={`font-black uppercase px-1.5 py-0.5 rounded ${
                            anom.status === 'Pending' ? 'bg-amber-50 text-amber-705 border border-amber-100' :
                            anom.status === 'Warned' ? 'bg-orange-55 text-orange-700 border border-orange-100' :
                            anom.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            'bg-red-50 text-red-600 border border-red-100'
                          }`}>
                            {anom.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons under anomaly */}
                    {anom.status === 'Pending' && (
                      <div className="flex items-center gap-1.5 justify-end pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleAnomalyAction(anom._id, 'Warned')}
                          className="px-2 py-1 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-100 rounded text-[9px] font-bold uppercase transition-all flex items-center gap-1"
                        >
                          <AlertTriangle className="w-2.5 h-2.5" /> Warn
                        </button>
                        <button
                          onClick={() => handleAnomalyAction(anom._id, 'Resolved')}
                          className="px-2 py-1 bg-emerald-55 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded text-[9px] font-bold uppercase transition-all flex items-center gap-1"
                        >
                          <ShieldCheck className="w-2.5 h-2.5" /> Clear
                        </button>
                        <button
                          onClick={() => handleAnomalyAction(anom._id, 'Banned')}
                          className="px-2 py-1 bg-red-50 hover:bg-red-105 text-red-600 border border-red-100 rounded text-[9px] font-bold uppercase transition-all flex items-center gap-1"
                        >
                          <UserX className="w-2.5 h-2.5" /> Ban
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ROW 3: Student Applications review grid */}
        <div className="bg-white border border-purple-100 rounded-3xl p-6 shadow-sm">
          <h3 className="font-extrabold text-base text-slate-800 tracking-wide border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
            <span>Manage System Applicants</span>
            <span className="text-[10px] text-purple-600 font-semibold uppercase tracking-widest bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100">
              Gemini Integrated
            </span>
          </h3>

          {loading ? (
            <div className="py-20 flex items-center justify-center">
              <span className="w-8 h-8 border-3 border-slate-200 border-t-purple-600 rounded-full animate-spin"></span>
            </div>
          ) : applications.length === 0 ? (
            <p className="text-xs text-slate-450 text-center py-12">No students have applied to any corporate opportunities yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 uppercase tracking-widest text-[9px] font-black">
                    <th className="py-3 pr-4">Student</th>
                    <th className="py-3 pr-4">Applied Job</th>
                    <th className="py-3 pr-4">Eligibility Details</th>
                    <th className="py-3 pr-4 text-center">Gemini Match</th>
                    <th className="py-3 pr-4">Current stage</th>
                    <th className="py-3 pr-4 text-right">Transition Phase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map(app => {
                    const studentCgpa = app.student?.profile?.cgpa || 0.0;
                    const isOverCutoff = studentCgpa >= (app.job?.cgpaCutoff || 0.0);

                    return (
                      <tr key={app._id} className="hover:bg-slate-50/50 transition-all">
                        <td className="py-4 pr-4">
                          <div className="font-bold text-slate-800">{app.student?.name}</div>
                          <div className="text-[10px] text-slate-500">{app.student?.email}</div>
                          {app.student?.profile?.phone?.startsWith('[BANNED]') && (
                            <span className="text-[8px] bg-red-50 border border-red-100 text-red-600 px-1 py-0.2 rounded uppercase font-black tracking-widest mt-0.5 inline-block">
                              🚫 Blocked Account
                            </span>
                          )}
                        </td>

                        <td className="py-4 pr-4">
                          <div className="font-bold text-purple-650">{app.job?.companyName}</div>
                          <div className="text-[10px] text-slate-500">{app.job?.role}</div>
                        </td>

                        <td className="py-4 pr-4">
                          <div className="font-semibold text-slate-700">CGPA: {studentCgpa.toFixed(2)}</div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            isOverCutoff 
                              ? 'bg-emerald-55 border border-emerald-100 text-emerald-700' 
                              : 'bg-red-50 border border-red-100 text-red-600'
                          }`}>
                            {isOverCutoff ? '✅ Meets Cutoff' : '❌ Below Cutoff'}
                          </span>
                        </td>

                        <td className="py-4 pr-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full border text-xs font-black shrink-0 ${
                            app.matchScore >= 80 
                              ? 'text-emerald-700 border-emerald-100 bg-emerald-50' 
                              : app.matchScore >= 60 
                                ? 'text-purple-650 border-purple-100 bg-purple-50' 
                                : 'text-amber-700 border-amber-100 bg-amber-50'
                          }`}>
                            {app.matchScore}%
                          </span>
                        </td>

                        <td className="py-4 pr-4">
                          <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-extrabold uppercase ${
                            app.status === 'Offered' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            app.status === 'Interview' ? 'bg-purple-50 text-purple-650 border-purple-100' :
                            app.status === 'OA' ? 'bg-amber-50 text-amber-705 border-amber-100' :
                            app.status === 'Applied' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            app.status === 'Wishlist' ? 'bg-slate-50 text-slate-500 border-slate-200' :
                            'bg-red-50 text-red-600 border-red-100'
                          }`}>
                            {app.status}
                          </span>
                        </td>

                        <td className="py-4 pr-4 text-right">
                          <select
                            value={app.status}
                            onChange={(e) => handleStatusChange(app._id, e.target.value)}
                            className="px-2 py-1 rounded bg-white border border-slate-200 text-slate-700 text-xs focus:outline-none focus:border-purple-500 transition-all focus:ring-1 focus:ring-purple-500"
                          >
                            <option value="Wishlist">Wishlist</option>
                            <option value="Applied">Applied</option>
                            <option value="OA">OA</option>
                            <option value="Interview">Interview</option>
                            <option value="Offered">Offered</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
