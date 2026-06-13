import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { User, Mail, Lock, Award, GraduationCap, Code2, Phone } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student'); 
  const [phone, setPhone] = useState('');
  
  // Student Profile parameters
  const [cgpa, setCgpa] = useState('8.00');
  const [branch, setBranch] = useState('CSE');
  const [skills, setSkills] = useState('');
  const [resumeText, setResumeText] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (role === 'student') {
      const cgpaNum = parseFloat(cgpa);
      if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
        setError('CGPA must be a valid number between 0.0 and 10.0');
        setLoading(false);
        return;
      }
    }

    const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
    const profileDetails = role === 'student' ? {
      cgpa: parseFloat(cgpa),
      branch,
      skills: skillsArray,
      resumeText: resumeText || `Candidate is skilled in: ${skills}. Completed coursework in ${branch}. CGPA is ${cgpa}.`,
      phone
    } : {};

    try {
      const result = await register(name, email, password, role, profileDetails);
      if (result.success) {
        navigate(role === 'admin' ? '/admin' : '/dashboard');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Registration failed. Server communication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
      {/* Decorative radial gradients */}
      <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-purple-500/5 blur-[130px] animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-indigo-500/5 blur-[130px] animate-pulse"></div>

      <div className="bg-white border border-purple-100 w-full max-w-lg rounded-3xl p-8 flex flex-col gap-5 shadow-xl relative z-10 my-8">
        <div className="text-center space-y-1">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-md mb-3">
            A
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-wide">ANURAG UNIVERSITY</h2>
          <p className="text-xs text-slate-500">Student & Admin Placement Registry Gateway</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-3 rounded-xl text-xs font-semibold text-center">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Account Role Type</label>
            <div className="grid grid-cols-2 p-1 bg-slate-50 border border-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  role === 'student' 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🎓 Student Account
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  role === 'admin' 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🛡️ Placement Admin
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 text-slate-800 text-xs focus:ring-1 focus:ring-purple-500 transition-all outline-none font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="johndoe@anurag.edu.in"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 text-slate-800 text-xs focus:ring-1 focus:ring-purple-500 transition-all outline-none font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Secure Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 text-slate-800 text-xs focus:ring-1 focus:ring-purple-500 transition-all outline-none font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 text-slate-800 text-xs focus:ring-1 focus:ring-purple-500 transition-all outline-none font-medium"
                />
              </div>
            </div>
          </div>

          {role === 'student' && (
            <div className="border-t border-slate-100 pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-purple-650" /> Profile CGPA (Max 10)
                  </label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    required
                    value={cgpa}
                    onChange={(e) => setCgpa(e.target.value)}
                    placeholder="e.g. 8.33"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 text-slate-800 text-xs focus:ring-1 focus:ring-purple-500 transition-all outline-none font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-purple-650" /> Department / Branch
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
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
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                  <Code2 className="w-3.5 h-3.5 text-purple-650" /> Technical Skills
                </label>
                <input 
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="MERN stack, Java, React, SQL"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 text-slate-800 text-xs focus:ring-1 focus:ring-purple-500 transition-all outline-none font-medium"
                />
                <span className="text-[9px] text-slate-400 block">Comma separated list. These will be sent to Gemini for resume keyword matching!</span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Resume Content (Plain Text)</label>
                <textarea 
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  rows="3"
                  placeholder="Paste your resume contents or work experience here. Gemini AI will match this text against job criteria to calculate your profile match percentage."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 text-slate-800 text-xs focus:ring-1 focus:ring-purple-500 transition-all outline-none font-medium resize-none text-[11px]"
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 text-xs font-bold uppercase tracking-wider mt-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md transition-all flex items-center justify-center"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            ) : (
              'Complete Registration'
            )}
          </button>
        </form>

        <div className="text-center pt-3 border-t border-slate-100 text-xs">
          <span className="text-slate-500">Already registered? </span>
          <Link to="/login" className="text-purple-600 hover:text-purple-700 font-bold transition-all underline">
            Secure Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
