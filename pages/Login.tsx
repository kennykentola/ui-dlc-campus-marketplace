
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../App";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white relative overflow-hidden pt-32 pb-40">
      {/* Vibrant Background Blobs */}
      <div className="gradient-blob blob-blue opacity-5"></div>
      <div className="gradient-blob blob-gold opacity-10"></div>

      <div className="w-full max-w-md bg-white p-10 md:p-14 rounded-[40px] border border-slate-100 shadow-[0_40px_100px_-20px_rgba(0,51,102,0.1)] space-y-10 animate-slideUp relative z-10">
        
        <div className="text-center space-y-4">
           <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl border border-slate-50">
              <img src="/logo.png" className="h-10" alt="Logo" />
           </div>
           <h1 className="text-4xl font-black text-[#003366] uppercase tracking-tighter leading-none">
              <span className="text-[#14b8a6]">Login</span>
           </h1>
           <p className="text-slate-400 text-[11px] font-medium">
              Login to your account
           </p>
        </div>

        {error && (
          <div className="p-5 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-rose-100 flex items-center gap-4 animate-fadeIn">
            <i className="fa-solid fa-circle-exclamation text-lg"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">
              Student Email
            </label>
            <div className="relative group">
               <i className="fa-solid fa-envelope absolute left-6 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within:text-[#14b8a6] transition-colors"></i>
               <input
                 type="email"
                 required
                 autoComplete="email"
                 className="w-full bg-slate-50 border border-slate-50 rounded-2xl pl-14 pr-6 py-5 text-sm font-black text-[#003366] outline-none focus:bg-white focus:ring-4 focus:ring-[#14b8a6]/5 focus:border-[#14b8a6] transition-all placeholder:text-slate-300"
                 placeholder="name@dlc.ui.edu.ng"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
               />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">
              Password
            </label>
            <div className="relative group">
               <i className="fa-solid fa-lock absolute left-6 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within:text-[#14b8a6] transition-colors"></i>
               <input
                 type={showPassword ? "text" : "password"}
                 required
                 autoComplete="current-password"
                 className="w-full bg-slate-50 border border-slate-50 rounded-2xl pl-14 pr-16 py-5 text-sm font-black text-[#003366] outline-none focus:bg-white focus:ring-4 focus:ring-[#14b8a6]/5 focus:border-[#14b8a6] transition-all placeholder:text-slate-300"
                 placeholder="••••••••"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
               />
               <button
                 type="button"
                 onClick={() => setShowPassword(!showPassword)}
                 className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#14b8a6] transition-colors"
               >
                 <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} text-xs`}></i>
               </button>
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-[10px] font-black text-teal-600 hover:underline uppercase tracking-widest"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#003366] text-white py-6 rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-2xl shadow-blue-900/10 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
            <i className="fa-solid fa-arrow-right text-[10px]"></i>
          </button>
        </form>

        <div className="pt-8 border-t border-slate-50 text-center">
           <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
              If you don't have an account,{" "}
              <Link to="/register" className="text-[#14b8a6] hover:underline underline-offset-4 ml-2">
                register
              </Link>
           </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
