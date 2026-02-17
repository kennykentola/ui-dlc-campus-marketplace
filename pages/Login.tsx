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
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 md:py-12 px-4 shadow-sm md:shadow-none">
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-2xl shadow-slate-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-700 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
            U
          </div>
          <h1 className="text-2xl font-black text-slate-800">Welcome Back</h1>
          <p className="text-slate-500 text-sm mt-1">
            Sign in to the UI DLC Marketplace
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
            <i className="fa-solid fa-triangle-exclamation mr-2"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:bg-white transition"
              placeholder="e.g. name@dlc.ui.edu.ng"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => alert("Password reset functionality coming soon!")}
                className="text-xs font-bold text-blue-700 hover:underline"
              >
                Forgot?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:bg-white transition"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-800 transition transform active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <i className="fa-solid fa-circle-notch fa-spin"></i>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-50 text-center">
          <p className="text-slate-500 text-sm">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-blue-700 font-bold hover:underline"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
