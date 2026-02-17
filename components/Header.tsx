
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { UserRole } from '../types';

const Header: React.FC = () => {
  const { user, logout, isDarkMode, toggleDarkMode, unreadCount } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-[150] shadow-sm transition-colors">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-100 group-hover:scale-105 transition-transform border border-blue-600">
            U
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
              UI DLC <span className="text-blue-700">MARKET</span>
            </span>
            <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest mt-1">
              Official Student Hub
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center space-x-8 text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
          <Link to="/" className="hover:text-blue-700 dark:hover:text-blue-400 transition relative group">
            Browse
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-700 transition-all group-hover:w-full"></span>
          </Link>
          {user && (
            <>
              <Link to="/sell" className="hover:text-blue-700 dark:hover:text-blue-400 transition relative group">
                Sell Item
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-700 transition-all group-hover:w-full"></span>
              </Link>
              <Link to="/messages" className="hover:text-blue-700 dark:hover:text-blue-400 transition relative group flex items-center">
                Messages
                {unreadCount > 0 ? (
                  <span className="ml-2 px-1.5 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full shadow-lg shadow-rose-200 flex items-center justify-center min-w-[1.25rem]">
                    {unreadCount}
                  </span>
                ) : (
                  <span className="ml-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                )}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-700 transition-all group-hover:w-full"></span>
              </Link>
              {user.role === UserRole.ADMIN && (
                <Link to="/admin" className="text-blue-700 dark:text-blue-400 font-black border-2 border-blue-100 dark:border-blue-900/50 px-3 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
                  Admin Panel
                </Link>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          {/* Dark Mode Toggle */}
          <button 
            onClick={toggleDarkMode}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-yellow-400 transition shadow-sm"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <i className={`fa-solid ${isDarkMode ? 'fa-sun text-lg' : 'fa-moon text-lg'}`}></i>
          </button>

          {user ? (
            <div className="flex items-center space-x-4">
              <Link to="/profile" className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-2xl border border-slate-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 transition shadow-sm">
                <img 
                  src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1e40af&color=fff`} 
                  className="w-8 h-8 rounded-full border border-white dark:border-slate-600 shadow-sm object-cover"
                  alt="Avatar" 
                />
                <div className="hidden lg:block">
                  <p className="text-[10px] font-black text-slate-400 leading-none uppercase tracking-widest">Profile</p>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-100 mt-1">{user.name.split(' ')[0]}</p>
                </div>
              </Link>
              <button 
                onClick={handleLogout}
                className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition flex items-center justify-center shadow-sm"
                title="Logout"
              >
                <i className="fa-solid fa-right-from-bracket"></i>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:text-blue-700 transition">Login</Link>
              <Link 
                to="/register" 
                className="text-sm font-black bg-blue-700 text-white px-6 py-3 rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-800 transition transform active:scale-95 uppercase tracking-widest"
              >
                Join
              </Link>
            </div>
          )}
          
          <button 
            className="md:hidden text-slate-600 dark:text-slate-300 w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <i className={`fa-solid ${isMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-6 flex flex-col space-y-5 animate-slideDown">
          <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-slate-800 dark:text-white font-black uppercase tracking-widest text-sm flex items-center">
             <i className="fa-solid fa-house-chimney w-6"></i> Browse Products
          </Link>
          {user ? (
            <>
              <Link to="/sell" onClick={() => setIsMenuOpen(false)} className="text-slate-800 dark:text-white font-black uppercase tracking-widest text-sm flex items-center">
                 <i className="fa-solid fa-plus w-6"></i> Sell Something
              </Link>
              <Link to="/messages" onClick={() => setIsMenuOpen(false)} className="text-slate-800 dark:text-white font-black uppercase tracking-widest text-sm flex items-center justify-between">
                 <div className="flex items-center">
                   <i className="fa-solid fa-comments w-6"></i> Messages
                 </div>
                 {unreadCount > 0 && (
                   <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-full">{unreadCount}</span>
                 )}
              </Link>
              <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="text-slate-800 dark:text-white font-black uppercase tracking-widest text-sm flex items-center">
                 <i className="fa-solid fa-user-graduate w-6"></i> My Profile
              </Link>
              {user.role === UserRole.ADMIN && (
                <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="text-blue-700 dark:text-blue-400 font-black uppercase tracking-widest text-sm flex items-center">
                   <i className="fa-solid fa-toolbox w-6"></i> Admin Dashboard
                </Link>
              )}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                  className="text-rose-500 font-black uppercase tracking-widest text-sm flex items-center w-full"
                >
                   <i className="fa-solid fa-power-off w-6"></i> Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col space-y-3 pt-2 border-t border-slate-50 dark:border-slate-800">
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className="text-slate-800 dark:text-white font-black uppercase tracking-widest text-sm py-3 text-center bg-slate-50 dark:bg-slate-800 rounded-xl">Login</Link>
              <Link to="/register" onClick={() => setIsMenuOpen(false)} className="text-white font-black uppercase tracking-widest text-sm py-3 text-center bg-blue-700 rounded-xl shadow-lg shadow-blue-100">Register</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;