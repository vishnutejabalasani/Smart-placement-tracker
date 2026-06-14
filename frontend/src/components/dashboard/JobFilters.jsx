import React from 'react';
import { Search } from 'lucide-react';

const JobFilters = ({ search, setSearch, branchFilter, setBranchFilter, eligibleOnly, setEligibleOnly }) => {
  return (
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
  );
};

export default JobFilters;
