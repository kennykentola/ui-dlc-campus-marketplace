
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { DEPARTMENTS, LEVELS } from '../constants';
import { UserRole } from '../types';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    matricNumber: '',
    department: DEPARTMENTS[0],
    level: LEVELS[0],
    password: '',
    role: UserRole.STUDENT,
    adminCode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Institutional Secret for Admin Registration
  const ADMIN_SECRET = "UI-ADMIN-SECURE-25";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // UI DLC Matric number validation
    // Accepts 'e0XXXXXX' (DLC) or 'XXXXXX' (Regular UI)
    const matricRegex = /^(e\d{6}|\d{6})$/i;
    if (!matricRegex.test(formData.matricNumber)) {
      setError("Invalid ID format. Use 'e0XXXXXX' (DLC) or 'XXXXXX' (Regular UI) e.g. e047307");
      setLoading(false);
      return;
    }



    // Role validation
    if (formData.role === UserRole.ADMIN && formData.adminCode !== ADMIN_SECRET) {
      setError("Incorrect Admin Access Code. Please contact the IT department.");
      setLoading(false);
      return;
    }

    try {
      await register({
        name: formData.name,
        email: formData.email,
        matricNumber: formData.matricNumber,
        department: formData.department,
        level: formData.level,
        role: formData.role,
        password: formData.password
      });
      navigate('/');
    } catch (err: any) {
      console.error("Registration failed:", err);
      // Handle "User already exists" specifically
      if (err.message?.includes('already exists')) {
        setError("Account already exists. Please Sign In.");
      } else {
        setError(err.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white p-8 md:p-12 rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200">
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Create Account</h1>
          <p className="text-slate-500 mt-2 font-medium">Join the UI DLC student & staff community.</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold animate-shake">
            <i className="fa-solid fa-triangle-exclamation mr-2"></i> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Role Selection */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Your Role</label>
            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: UserRole.STUDENT })}
                className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 ${formData.role === UserRole.STUDENT ? 'bg-blue-700 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <i className="fa-solid fa-user-graduate"></i>
                Student
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: UserRole.ADMIN })}
                className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 ${formData.role === UserRole.ADMIN ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <i className="fa-solid fa-user-shield"></i>
                Admin
              </button>
            </div>
          </div>

          {/* Admin Code Field (Conditional) */}
          {formData.role === UserRole.ADMIN && (
            <div className="space-y-2 animate-slideDown">
              <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest ml-1">Admin Access Key</label>
              <input
                type="password" required
                className="w-full bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-amber-500/10 transition"
                placeholder="Enter secret verification code"
                value={formData.adminCode}
                onChange={(e) => setFormData({ ...formData, adminCode: e.target.value })}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
              <input
                type="text" required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-700/10 focus:bg-white transition"
                placeholder="e.g. Tunde Adebayo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Institutional Email</label>
              <input
                type="email" required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-700/10 focus:bg-white transition"
                placeholder="name@dlc.ui.edu.ng"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Matric / Staff ID</label>
              <input
                type="text" required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-700/10 focus:bg-white transition"
                placeholder="e.g. e047307 or 134442"
                value={formData.matricNumber}
                onChange={(e) => setFormData({ ...formData, matricNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Level / Grade</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-700/10 focus:bg-white transition"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              >
                {LEVELS.map(l => <option key={l} value={l}>{l === 'N/A' ? 'Administration' : l + 'L'}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department / Office</label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-700/10 focus:bg-white transition"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            >
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 pr-12 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-700/10 focus:bg-white transition"
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
              </button>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl transition transform active:scale-[0.98] disabled:opacity-50 ${formData.role === UserRole.ADMIN ? 'bg-amber-500 text-white shadow-amber-100' : 'bg-blue-700 text-white shadow-blue-100 hover:bg-blue-800'}`}
          >
            {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : `Register as ${formData.role}`}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-slate-500 text-sm font-medium">Already have an account? <Link to="/login" className="text-blue-700 font-black hover:underline">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
