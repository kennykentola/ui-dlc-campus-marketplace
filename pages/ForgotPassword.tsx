import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';

const ForgotPassword: React.FC = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Registry access denied. Verify email format.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[48px] p-8 md:p-12 shadow-2xl border border-slate-100 dark:border-slate-800 animate-fadeIn relative overflow-hidden">
        {/* Decorative Grid */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`, backgroundRepeat: 'repeat', backgroundSize: '200px' }}></div>
        
        <div className="relative z-10 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Recovery.</h2>
            <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest italic">Identity Verification Hub</p>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Registry Email</label>
                  <input
                    type="email"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-3xl px-6 py-4 text-sm font-medium focus:ring-4 focus:ring-teal-50 dark:focus:ring-teal-900/20 outline-none transition-all"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <p className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-4 py-2 rounded-xl text-center uppercase tracking-widest">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#003366] text-white rounded-3xl py-4 font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-teal-600 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Send Recovery Link'}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-6 animate-bounceIn">
              <div className="w-20 h-20 bg-teal-50 dark:bg-teal-900/30 rounded-[28px] flex items-center justify-center mx-auto text-teal-600">
                <i className="fa-solid fa-paper-plane text-3xl"></i>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Recovery instructions have been dispatched to your institutional mail.</p>
                <p className="text-[10px] text-slate-400 italic">Please check your inbox (and spam folder) within 5 minutes.</p>
              </div>
            </div>
          )}

          <div className="text-center pt-4">
            <Link to="/login" className="text-[10px] font-black text-[#003366] dark:text-teal-400 uppercase tracking-widest hover:underline">
              Return to Login Terminal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
