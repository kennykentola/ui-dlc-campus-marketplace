
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { UserRole } from "../types";

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    matricNumber: "",
    department: "",
    level: "100",
    adminCode: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdminField, setShowAdminField] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const { register } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match.");
    }
    setLoading(true);
    setError("");
    try {
      const role = formData.adminCode === "UIDLC_ADMIN_MARKET" ? UserRole.ADMIN : UserRole.STUDENT;
      await register({ ...formData, role });
      navigate("/"); // Auto-login handles the session
    } catch (err: any) {
      setError(err.message || "Register failed. That account may already exist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#28826f] relative overflow-hidden pt-32 pb-40">
      {/* Vibrant Background Blobs */}
      <div className="gradient-blob blob-blue opacity-5"></div>
      <div className="gradient-blob blob-gold opacity-10"></div>

      <div className="w-full max-w-3xl bg-white p-10 md:p-14 rounded-[40px] border border-slate-100 shadow-[0_40px_100px_-20px_rgba(0,51,102,0.1)] space-y-12 animate-slideUp relative z-10">
        <div 
          className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl border border-slate-50 mx-auto mb-6 group hover:scale-110 transition-transform cursor-pointer"
          onClick={() => {
            if (logoClicks >= 4) setShowAdminField(true);
            else setLogoClicks(prev => prev + 1);
          }}
        >
          <img src="/logo.png" className="h-10" alt="Logo" />
        </div>

        <div className="text-center space-y-4">
          <h1 className="text-4xl font-black text-brand-primary uppercase tracking-tighter leading-none">
            <span className="text-brand-secondary">Register</span>
          </h1>
          <p className="text-slate-600 text-[11px] font-medium">
            Create your account
          </p>
        </div>

        {error && (
          <div className="p-5 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-rose-100 flex items-center gap-4 animate-fadeIn">
            <i className="fa-solid fa-circle-exclamation text-lg"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Full Name</label>
              <input name="name" required className="w-full bg-slate-50 border border-slate-50 rounded-2xl px-6 py-5 text-sm font-black text-brand-primary outline-none focus:bg-white focus:ring-4 focus:ring-brand-secondary/5 focus:border-brand-secondary transition-all placeholder:text-slate-200" placeholder="Tunde Adebayo" value={formData.name} onChange={handleChange} />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Student Email</label>
              <input name="email" type="email" autoComplete="email" required className="w-full bg-slate-50 border border-slate-50 rounded-2xl px-6 py-5 text-sm font-black text-brand-primary outline-none focus:bg-white focus:ring-4 focus:ring-brand-secondary/5 focus:border-brand-secondary transition-all placeholder:text-slate-200" placeholder="student@dlc.ui.edu.ng" value={formData.email} onChange={handleChange} />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Department</label>
              <input name="department" required className="w-full bg-slate-50 border border-slate-50 rounded-2xl px-6 py-5 text-sm font-black text-brand-primary outline-none focus:bg-white focus:ring-4 focus:ring-brand-secondary/5 focus:border-brand-secondary transition-all placeholder:text-slate-200" placeholder="Statistics" value={formData.department} onChange={handleChange} />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Matric Number</label>
              <input name="matricNumber" required className="w-full bg-slate-50 border border-slate-50 rounded-2xl px-6 py-5 text-sm font-black text-brand-primary outline-none focus:bg-white focus:ring-4 focus:ring-brand-secondary/5 focus:border-brand-secondary transition-all placeholder:text-slate-200" placeholder="DLC/21/XXXX" value={formData.matricNumber} onChange={handleChange} />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  className="w-full bg-slate-50 border border-slate-50 rounded-2xl px-6 py-5 pr-14 text-sm font-black text-brand-primary outline-none focus:bg-white focus:ring-4 focus:ring-brand-secondary/5 focus:border-brand-secondary transition-all placeholder:text-slate-200"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-brand-secondary transition-colors">
                  <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} text-xs`}></i>
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Confirm Password</label>
              <div className="relative group">
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  className="w-full bg-slate-50 border border-slate-50 rounded-2xl px-6 py-5 pr-14 text-sm font-black text-brand-primary outline-none focus:bg-white focus:ring-4 focus:ring-brand-secondary/5 focus:border-brand-secondary transition-all placeholder:text-slate-200"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button type="button" aria-label="Toggle password visibility" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-brand-secondary transition-colors">
                  <i className={`fa-solid ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"} text-xs`}></i>
                </button>
              </div>
            </div>
          </div>

          {showAdminField && (
            <div className="space-y-3 animate-fadeIn">
              <label className="text-[10px] font-black text-brand-primary uppercase tracking-widest ml-1">Admin Protocol Code</label>
              <input name="adminCode" type="password" className="w-full bg-slate-50 border border-brand-primary/20 rounded-2xl px-6 py-5 text-sm font-black text-brand-primary outline-none focus:bg-white focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all placeholder:text-slate-300" placeholder="••••••••" value={formData.adminCode} onChange={handleChange} />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary text-white py-6 rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-2xl shadow-brand-primary/10 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register"}
            <i className="fa-solid fa-user-plus text-[10px]"></i>
          </button>
        </form>

        <div className="pt-8 border-t border-slate-50 text-center">
          <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
            Already have an account?{" "}
            <Link to="/login" className="text-brand-secondary hover:underline underline-offset-4 ml-2">
              login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
