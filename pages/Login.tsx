
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
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Vibrant Background Blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#F5A623]/10 blur-[100px] rounded-full animate-pulse-glow"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#00E5FF]/5 blur-[120px] rounded-full animate-float"></div>

      <div className="w-full max-w-md glass-panel p-10 md:p-14 rounded-3xl space-y-10 animate-slideUp relative z-10">

        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center shadow-xl border border-white/10 mx-auto">
            <img src="/logo.png" className="h-10 brightness-200" alt="Logo" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight leading-none">
            Welcome <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5A623] to-yellow-200">Back</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium">
            Login to your account
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 text-rose-400 rounded-2xl text-xs font-bold border border-rose-500/20 flex items-center gap-3 animate-fadeIn">
            <i className="fa-solid fa-circle-exclamation text-lg"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 ml-1">
              Student Email
            </label>
            <div className="relative group">
              <i className="fa-solid fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#F5A623] transition-colors"></i>
              <input
                type="email"
                required
                autoComplete="email"
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm font-medium text-white outline-none focus:bg-black/40 focus:ring-2 focus:ring-[#F5A623]/20 focus:border-[#F5A623]/50 transition-all placeholder:text-slate-500"
                placeholder="name@dlc.ui.edu.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 ml-1">
              Password
            </label>
            <div className="relative group">
              <i className="fa-solid fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#F5A623] transition-colors"></i>
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-14 py-4 text-sm font-medium text-white outline-none focus:bg-black/40 focus:ring-2 focus:ring-[#F5A623]/20 focus:border-[#F5A623]/50 transition-all placeholder:text-slate-500"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                aria-label="Toggle password visibility"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#F5A623] transition-colors"
              >
                <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} text-xs`}></i>
              </button>
            </div>
            <div className="flex justify-end pt-1">
              <Link
                to="/forgot-password"
                className="text-xs font-bold text-[#F5A623] hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-gold py-4 rounded-2xl flex items-center justify-center gap-3 mt-4 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </form>

        <div className="pt-6 border-t border-white/10 text-center">
          <p className="text-sm font-medium text-slate-400">
            Don't have an account?{" "}
            <Link to="/register" className="text-[#F5A623] hover:underline font-bold ml-1">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
