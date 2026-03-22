
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
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError("Security keys do not match. Protocol aborted.");
    }
    setLoading(true);
    setError("");
    try {
      const role = formData.adminCode === "UIDLC_ADMIN_2024" ? UserRole.ADMIN : UserRole.STUDENT;
      await register({ ...formData, role });
      navigate("/login");
    } catch (err: any) {
      setError(err.message || "Registry protocol failed. Unique identity may already exist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white relative overflow-hidden pt-32 pb-40">
      {/* Vibrant Background Blobs */}
      <div className="gradient-blob blob-blue opacity-5"></div>
      <div className="gradient-blob blob-gold opacity-10"></div>

      <div className="w-full max-w-3xl bg-white p-10 md:p-14 rounded-[40px] border border-slate-100 shadow-[0_40px_100px_-20px_rgba(0,51,102,0.1)] space-y-12 animate-slideUp relative z-10">
        
        <div className="text-center space-y-4">
           <h1 className="text-4xl font-black text-[#003366] uppercase tracking-tighter leading-none">
              Hub <span className="text-[#14b8a6]">Registry.</span>
           </h1>
           <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] italic">
              Student Identity Initialization
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
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Full Name</label>
              <input name="name" required className="w-full bg-slate-50 border border-slate-50 rounded-2xl px-6 py-5 text-sm font-black text-[#003366] outline-none focus:bg-white focus:ring-4 focus:ring-[#14b8a6]/5 focus:border-[#14b8a6] transition-all placeholder:text-slate-200" placeholder="Tunde Adebayo" value={formData.name} onChange={handleChange} />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Student Email</label>
              <input name="email" type="email" required className="w-full bg-slate-50 border border-slate-50 rounded-2xl px-6 py-5 text-sm font-black text-[#003366] outline-none focus:bg-white focus:ring-4 focus:ring-[#14b8a6]/5 focus:border-[#14b8a6] transition-all placeholder:text-slate-200" placeholder="student@dlc.ui.edu.ng" value={formData.email} onChange={handleChange} />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Department</label>
              <input name="department" required className="w-full bg-slate-50 border border-slate-50 rounded-2xl px-6 py-5 text-sm font-black text-[#003366] outline-none focus:bg-white focus:ring-4 focus:ring-[#14b8a6]/5 focus:border-[#14b8a6] transition-all placeholder:text-slate-200" placeholder="Statistics" value={formData.department} onChange={handleChange} />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Matric Number</label>
              <input name="matricNumber" required className="w-full bg-slate-50 border border-slate-50 rounded-2xl px-6 py-5 text-sm font-black text-[#003366] outline-none focus:bg-white focus:ring-4 focus:ring-[#14b8a6]/5 focus:border-[#14b8a6] transition-all placeholder:text-slate-200" placeholder="DLC/21/XXXX" value={formData.matricNumber} onChange={handleChange} />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Security Key</label>
              <input name="password" type="password" required className="w-full bg-slate-50 border border-slate-50 rounded-2xl px-6 py-5 text-sm font-black text-[#003366] outline-none focus:bg-white focus:ring-4 focus:ring-[#14b8a6]/5 focus:border-[#14b8a6] transition-all placeholder:text-slate-200" placeholder="••••••••" value={formData.password} onChange={handleChange} />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Confirm Security Key</label>
              <input name="confirmPassword" type="password" required className="w-full bg-slate-50 border border-slate-50 rounded-2xl px-6 py-5 text-sm font-black text-[#003366] outline-none focus:bg-white focus:ring-4 focus:ring-[#14b8a6]/5 focus:border-[#14b8a6] transition-all placeholder:text-slate-200" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Admin Validation Code (Optional)</label>
            <input name="adminCode" className="w-full bg-slate-50 border border-slate-50 rounded-2xl px-6 py-5 text-sm font-black text-[#003366] outline-none focus:bg-white focus:ring-4 focus:ring-[#14b8a6]/5 focus:border-[#14b8a6] transition-all placeholder:text-slate-200" placeholder="••••••••" value={formData.adminCode} onChange={handleChange} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#003366] text-white py-6 rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-2xl shadow-blue-900/10 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
          >
            {loading ? "Registering Identity..." : "Finalize Registry Protocol"}
            <i className="fa-solid fa-user-plus text-[10px]"></i>
          </button>
        </form>

        <div className="pt-8 border-t border-slate-50 text-center">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
              Already Registered?{" "}
              <Link to="/login" className="text-[#14b8a6] hover:underline underline-offset-4 ml-2">
                Initiate Login Protocol
              </Link>
           </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
