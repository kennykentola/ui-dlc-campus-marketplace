
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
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Vibrant Background Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#F5A623]/10 blur-[100px] rounded-full animate-pulse-glow"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#00E5FF]/5 blur-[120px] rounded-full animate-float"></div>

      <div className="w-full max-w-3xl glass-panel p-10 md:p-14 rounded-3xl space-y-12 animate-slideUp relative z-10 my-10">
        <div 
          className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center shadow-xl border border-white/10 mx-auto mb-6 group hover:scale-110 transition-transform cursor-pointer"
          onClick={() => {
            if (logoClicks >= 4) setShowAdminField(true);
            else setLogoClicks(prev => prev + 1);
          }}
        >
          <img src="/logo.png" className="h-10 brightness-200" alt="Logo" />
        </div>

        <div className="text-center space-y-4">
          <h1 className="text-3xl font-black text-white tracking-tight leading-none">
            Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5A623] to-yellow-200">Account</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium">
            Join the Campus Marketplace
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 text-rose-400 rounded-2xl text-xs font-bold border border-rose-500/20 flex items-center gap-3 animate-fadeIn">
            <i className="fa-solid fa-circle-exclamation text-lg"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 ml-1">Full Name</label>
              <input name="name" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium text-white outline-none focus:bg-black/40 focus:ring-2 focus:ring-[#F5A623]/20 focus:border-[#F5A623]/50 transition-all placeholder:text-slate-500" placeholder="Tunde Adebayo" value={formData.name} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 ml-1">Student Email</label>
              <input name="email" type="email" autoComplete="email" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium text-white outline-none focus:bg-black/40 focus:ring-2 focus:ring-[#F5A623]/20 focus:border-[#F5A623]/50 transition-all placeholder:text-slate-500" placeholder="student@dlc.ui.edu.ng" value={formData.email} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 ml-1">Department</label>
              <input name="department" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium text-white outline-none focus:bg-black/40 focus:ring-2 focus:ring-[#F5A623]/20 focus:border-[#F5A623]/50 transition-all placeholder:text-slate-500" placeholder="Statistics" value={formData.department} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 ml-1">Matric Number</label>
              <input name="matricNumber" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium text-white outline-none focus:bg-black/40 focus:ring-2 focus:ring-[#F5A623]/20 focus:border-[#F5A623]/50 transition-all placeholder:text-slate-500" placeholder="DLC/21/XXXX" value={formData.matricNumber} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 ml-1">Password</label>
              <div className="relative group">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 pr-14 text-sm font-medium text-white outline-none focus:bg-black/40 focus:ring-2 focus:ring-[#F5A623]/20 focus:border-[#F5A623]/50 transition-all placeholder:text-slate-500"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#F5A623] transition-colors">
                  <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} text-xs`}></i>
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 ml-1">Confirm Password</label>
              <div className="relative group">
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 pr-14 text-sm font-medium text-white outline-none focus:bg-black/40 focus:ring-2 focus:ring-[#F5A623]/20 focus:border-[#F5A623]/50 transition-all placeholder:text-slate-500"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button type="button" aria-label="Toggle password visibility" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#F5A623] transition-colors">
                  <i className={`fa-solid ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"} text-xs`}></i>
                </button>
              </div>
            </div>
          </div>

          {showAdminField && (
            <div className="space-y-2 animate-fadeIn">
              <label className="text-xs font-bold text-[#F5A623] ml-1">Admin Protocol Code</label>
              <input name="adminCode" type="password" className="w-full bg-white/5 border border-[#F5A623]/30 rounded-2xl px-6 py-4 text-sm font-medium text-white outline-none focus:bg-black/40 focus:ring-2 focus:ring-[#F5A623]/50 focus:border-[#F5A623] transition-all placeholder:text-slate-500" placeholder="••••••••" value={formData.adminCode} onChange={handleChange} />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-gold py-4 rounded-2xl flex items-center justify-center gap-3 mt-4 disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register"}
            <i className="fa-solid fa-user-plus"></i>
          </button>
        </form>

        <div className="pt-6 border-t border-white/10 text-center">
          <p className="text-sm font-medium text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="text-[#F5A623] hover:underline font-bold ml-1">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
