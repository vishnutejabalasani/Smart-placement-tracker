import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Bell, LogOut, ShieldAlert, Award, User as UserIcon } from 'lucide-react';

const Navbar = () => {
  const { user, logout, notifications } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-purple-100 px-6 py-4 flex items-center justify-between">
      {/* Anurag University branding Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-md shrink-0">
          A
        </div>
        <div>
          <span className="font-extrabold text-lg text-slate-800 tracking-wide">
            ANURAG UNIVERSITY
          </span>
          <span className="block text-[9px] text-purple-600 font-extrabold uppercase tracking-widest -mt-0.5">
            Official Placement Portal
          </span>
        </div>
      </div>

      {user && (
        <div className="flex items-center gap-6">
          {/* Active User Badge & Context */}
          <div className="hidden md:flex items-center gap-3 border-r border-slate-100 pr-6">
            <div className="text-right">
              <span className="block text-sm font-semibold text-slate-800">{user.name}</span>
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                {user.role === 'admin' ? '🛡️ Placement Admin' : `🎓 ${user.profile?.branch || 'Student'}`}
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-purple-600">
              <UserIcon className="w-5 h-5" />
            </div>
          </div>

          {/* Real-time Notifications Bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-slate-600 hover:text-slate-800"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-purple-600 rounded-full animate-ping"></span>
              )}
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-purple-600 rounded-full"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 max-h-96 overflow-y-auto bg-white border border-purple-100 rounded-2xl p-4 shadow-xl z-50">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    Notifications ({notifications.length})
                  </h4>
                  <span className="text-[10px] text-purple-650 font-semibold uppercase tracking-wider">Live Socket</span>
                </div>

                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No notifications received in this session.</p>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notif, index) => {
                      const isAnomaly = notif.type?.startsWith('ANOMALY');
                      return (
                        <div 
                          key={index}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isAnomaly 
                              ? 'bg-red-50/80 border-red-100 text-red-800' 
                              : 'bg-purple-50 border-purple-100 text-slate-800'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {isAnomaly ? (
                              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                            ) : (
                              <Award className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className="text-xs font-semibold leading-tight">
                                {isAnomaly ? 'Security Alert Triggered' : 'Placement Status Changed'}
                              </p>
                              <p className={`text-[11px] mt-1 ${isAnomaly ? 'text-red-700' : 'text-slate-600'}`}>
                                {notif.payload?.message || JSON.stringify(notif.payload)}
                              </p>
                              <span className={`block text-[9px] mt-1 ${isAnomaly ? 'text-red-600' : 'text-slate-400'}`}>
                                {new Date(notif.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Secure Logout Toggle */}
          <button 
            onClick={logout}
            className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 hover:text-red-700 transition-all flex items-center gap-2"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden md:inline text-xs font-semibold">Sign Out</span>
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
