
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../App";
import { UserRole } from "../types";

const Header: React.FC = () => {
  const { user, logout, unreadCount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Noticeboard", path: "/requests" },
    { name: "Transactions", path: "/transactions" },
    { name: "Chat", path: "/messages", hasNotification: unreadCount > 0 },
    { name: "Support", path: "/support" },
  ];

  if (user?.role === UserRole.ADMIN) {
    navLinks.push({ name: "Admin", path: "/admin" });
  }

  return (
    <header className={`fixed top-0 left-0 w-full z-100 transition-all duration-500 ${isScrolled ? "bg-white/95 backdrop-blur-2xl border-b border-slate-200 py-3 shadow-md" : "bg-white/80 backdrop-blur-xl py-5"}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-10 max-w-[1600px] flex items-center justify-between gap-4">
        
        {/* LOGO LEFT */}
        <div className="flex items-center shrink-0">
           <Link to="/" className="flex items-center gap-4 group lg:mr-10">
              <div className="w-11 h-11 bg-linear-to-br from-brand-primary to-brand-secondary rounded-2xl flex items-center justify-center shadow-lg shadow-[#003366]/20 group-hover:scale-105 transition-transform duration-500">
                 <img src="/logo.png" className="h-6 w-auto" alt="Logo" />
              </div>
              <div className="hidden sm:block">
                 <h1 className="text-xl font-black text-brand-primary tracking-[0.08em] uppercase leading-none">
                    UI DLC <span className="text-brand-secondary">HUB.</span>
                 </h1>
                 <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">Campus Marketplace</p>
              </div>
           </Link>
        </div>

        {/* Universal Navigation Terminal - DESKTOP */}
        <nav className="hidden lg:flex grow items-center justify-center gap-3 rounded-full border border-slate-200/80 bg-white/80 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500 shadow-sm">
               {navLinks.map((link) => (
             <Link 
               key={link.name}
               to={link.path} 
               className={`rounded-full px-5 py-2.5 transition-all relative ${location.pathname === link.path ? "text-brand-primary bg-teal-50" : "hover:bg-slate-50 hover:text-brand-primary"}`}
             >
               {link.name}
               {link.hasNotification && (
                 <span className="absolute top-2 right-2 w-2 h-2 bg-brand-secondary rounded-full"></span>
               )}
             </Link>
           ))}
        </nav>

        {/* Global Action Interface - RIGHT SIDE */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0 lg:ml-8">
           {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 bg-white/85 border border-slate-200 pl-3 pr-4 py-2 rounded-2xl group cursor-pointer hover:border-brand-secondary/30 transition-all shadow-sm">
                  <Link to="/profile" className="flex items-center gap-3">
                     <img 
                       src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=003366&color=fff`}
                       className="w-9 h-9 rounded-xl shadow-md border-2 border-white"
                       alt="Portrait"
                     />
                     <div className="hidden md:block text-left">
                        <p className="text-[10px] font-black uppercase text-brand-primary tracking-[0.18em] leading-none">{user.name}</p>
                        <p className="text-[9px] font-bold uppercase text-brand-secondary tracking-[0.22em] mt-1 italic">Student</p>
                     </div>
                  </Link>
                  <button onClick={logout} aria-label="Log Out" className="ml-1 text-slate-300 hover:text-rose-500 transition-colors">
                     <i className="fa-solid fa-power-off text-xs" aria-hidden="true"></i>
                  </button>
                </div>

                <Link to="/sell" className="flex items-center gap-2 px-5 py-3 bg-brand-secondary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.18em] hover:brightness-110 shadow-xl shadow-teal-600/20 transition-all active:scale-95 whitespace-nowrap">
                  <i className="fa-solid fa-plus-circle"></i> List Asset
                </Link>
              </div>
           ) : (
              <div className="flex items-center gap-3 sm:gap-4">
                 <Link to="/login" className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-brand-primary transition-colors">Login</Link>
                 <Link to="/register" className="px-6 py-3 bg-brand-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.22em] hover:brightness-110 shadow-xl shadow-[#003366]/10 transition-all active:scale-95">Register</Link>
              </div>
           )}

           {/* Mobile Menu Toggle */}
           <button 
             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
             aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
             className="lg:hidden w-11 h-11 flex items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm active:scale-95 transition-all text-brand-primary"
           >
              <i className={`fa-solid ${isMobileMenuOpen ? "fa-xmark" : "fa-bars-staggered"} text-lg`} aria-hidden="true"></i>
           </button>
        </div>
      </div>

      {/* Mobile Sidebar Menu */}
      <div className={`fixed inset-0 z-101 lg:hidden transition-all duration-500 ${isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
         <div className="absolute inset-0 bg-brand-primary/40 backdrop-blur-md" onClick={() => setIsMobileMenuOpen(false)}></div>
         <div className={`absolute right-0 top-0 h-full w-[310px] bg-white shadow-2xl transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col p-8 ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
            
            <div className="flex items-center justify-between mb-12">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg">
                     <img src="/logo.png" className="h-6" alt="Logo" />
                  </div>
                  <span className="font-black text-brand-primary uppercase text-[10px] tracking-[0.3em]">Hub Primary</span>
               </div>
               <button onClick={() => setIsMobileMenuOpen(false)} aria-label="Close sidebar" className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-brand-primary hover:bg-slate-100 transition-all">
                  <i className="fa-solid fa-xmark" aria-hidden="true"></i>
               </button>
            </div>

            <div className="flex flex-col gap-3">
               {navLinks.map((link) => (
                 <Link 
                    key={link.name}
                    to={link.path}
                    className={`flex items-center justify-between px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${location.pathname === link.path ? "bg-brand-primary text-white border-brand-primary shadow-xl shadow-[#003366]/20" : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"}`}
                 >
                    {link.name}
                    {link.hasNotification && <span className={`w-2 h-2 rounded-full ${location.pathname === link.path ? 'bg-white' : 'bg-brand-secondary'}`}></span>}
                 </Link>
               ))}

               <Link 
                  to="/sell"
                  className="mt-6 flex items-center justify-center gap-3 px-6 py-5 bg-brand-secondary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-teal-700/20 active:scale-95 transition-all"
               >
                  List Asset <i className="fa-solid fa-plus-circle"></i>
               </Link>
            </div>

            <div className="mt-auto pt-8 border-t border-slate-100">
               {user ? (
                 <div className="space-y-6">
                    <div className="flex items-center gap-4 px-4 py-4 bg-slate-50 rounded-[28px] border border-slate-100">
                       <img 
                          src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=003366&color=fff`} 
                          className="w-12 h-12 rounded-2xl shadow-md border-2 border-white" 
                          alt="Av"
                       />
                       <div>
                          <p className="text-xs font-black uppercase text-brand-primary tracking-tighter">{user.name}</p>
                          <p className="text-[10px] font-bold uppercase text-brand-secondary tracking-widest mt-1 italic leading-none">Student</p>
                       </div>
                    </div>
                    <button 
                      onClick={logout}
                      className="w-full py-4 text-rose-500 text-[9px] font-black uppercase tracking-widest border border-rose-100 bg-rose-50 rounded-2xl hover:bg-rose-100 transition-all flex items-center justify-center gap-3"
                    >
                       Log Out <i className="fa-solid fa-power-off"></i>
                    </button>
                 </div>
              ) : (
                 <div className="grid grid-cols-2 gap-4">
                    <Link to="/login" className="flex items-center justify-center py-4 bg-slate-100 text-brand-primary rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Login</Link>
                    <Link to="/register" className="flex items-center justify-center py-4 bg-brand-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-[#003366]/10">Register</Link>
                 </div>
               )}
            </div>
         </div>
      </div>
    </header>
  );
};

export default Header;
