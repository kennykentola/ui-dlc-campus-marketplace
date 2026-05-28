
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../App";
import { UserRole } from "../types";

const Header: React.FC = () => {
  const { user, logout, unreadCount, pendingTxCount } = useAuth();
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
    { name: "Requests", path: "/requests" },
    { name: "Transactions", path: "/transactions", hasNotification: pendingTxCount > 0 },
    { name: "Chat", path: "/messages", hasNotification: unreadCount > 0 },
    { name: "Support", path: "/support" },
  ];

  if (user?.role === UserRole.ADMIN) {
    navLinks.push({ name: "Admin", path: "/admin" });
  }

  return (
    <header className={`fixed top-0 left-0 w-full z-100 transition-all duration-500 ${isScrolled ? "bg-black/40 backdrop-blur-2xl border-b border-white/10 py-3 shadow-lg" : "bg-transparent py-5"}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-10 max-w-[1600px] flex items-center justify-between gap-4">
        
        {/* LOGO LEFT */}
        <div className="flex items-center shrink-0">
           <Link to="/" className="flex items-center gap-4 group lg:mr-10">
              <div className="w-11 h-11 bg-linear-to-br from-[#003366] to-[#08110c] border border-white/20 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-500">
                 <img src="/logo.png" className="h-6 w-auto brightness-200" alt="Logo" />
              </div>
              <div className="hidden sm:block">
                 <h1 className="text-xl font-black text-white tracking-[0.08em] uppercase leading-none">
                    UI DLC <span className="text-[#F5A623]">HUB.</span>
                 </h1>
                 <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.28em] text-slate-300">Campus Marketplace</p>
              </div>
           </Link>
        </div>

        {/* Universal Navigation Terminal - DESKTOP */}
        <nav className="hidden xl:flex grow items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 backdrop-blur-md px-4 py-3 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-300 shadow-lg">
               {navLinks.map((link) => (
             <Link 
               key={link.name}
               to={link.path} 
               className={`rounded-full px-5 py-2.5 transition-all relative ${location.pathname === link.path ? "text-[#003366] bg-[#F5A623] shadow-[0_0_15px_rgba(245,166,35,0.4)]" : "hover:bg-white/10 hover:text-white"}`}
             >
               {link.name}
               {link.hasNotification && (
                 <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(243,33,85,0.8)]"></span>
               )}
             </Link>
           ))}
        </nav>

        {/* Global Action Interface - RIGHT SIDE */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0 lg:ml-8">
           {user ? (
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 pl-3 pr-4 py-2 rounded-2xl group cursor-pointer hover:bg-white/20 transition-all shadow-lg">
                  <Link to="/profile" className="flex items-center gap-3">
                     <img 
                       src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=003366&color=fff`}
                       className="w-9 h-9 rounded-xl shadow-md border border-white/30"
                       alt="Portrait"
                     />
                     <div className="hidden xl:block text-left">
                        <p className="text-[10px] font-black uppercase text-white tracking-[0.18em] leading-none group-hover:text-[#F5A623] transition-colors">{user.name}</p>
                        <p className="text-[9px] font-bold uppercase text-slate-300 tracking-[0.22em] mt-1 italic">Student</p>
                     </div>
                  </Link>
                  <button onClick={logout} aria-label="Log Out" className="ml-1 text-slate-400 hover:text-rose-400 transition-colors">
                     <i className="fa-solid fa-power-off text-xs" aria-hidden="true"></i>
                  </button>
                </div>

                <Link to="/sell" className="btn-gold !py-3 !px-5 !text-[10px]">
                  <i className="fa-solid fa-plus-circle"></i> List Asset
                </Link>
              </div>
           ) : (
              <div className="hidden md:flex items-center gap-3 sm:gap-4">
                 <Link to="/login" className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors">Login</Link>
                 <Link to="/register" className="btn-gold !py-3 !px-6 !text-[10px]">Register</Link>
              </div>
           )}

           {/* Mobile Menu Toggle */}
           <button 
             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
             aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
             className="xl:hidden w-11 h-11 flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md shadow-lg active:scale-95 transition-all text-white"
           >
              <i className={`fa-solid ${isMobileMenuOpen ? "fa-xmark" : "fa-bars-staggered"} text-lg`} aria-hidden="true"></i>
           </button>
        </div>
      </div>

      {/* Mobile Sidebar Menu */}
      <div className={`fixed inset-0 z-101 lg:hidden transition-all duration-500 ${isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
         <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsMobileMenuOpen(false)}></div>
         <div className={`absolute right-0 top-0 h-full w-[310px] bg-gradient-to-b from-[#003366] to-[#08110c] border-l border-white/10 shadow-2xl transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col p-8 ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
            
            <div className="flex items-center justify-between mb-12">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center shadow-lg">
                     <img src="/logo.png" className="h-6 brightness-200" alt="Logo" />
                  </div>
                  <span className="font-black text-white uppercase text-[10px] tracking-[0.3em]">Hub Primary</span>
               </div>
               <button onClick={() => setIsMobileMenuOpen(false)} aria-label="Close sidebar" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all border border-white/10">
                  <i className="fa-solid fa-xmark" aria-hidden="true"></i>
               </button>
            </div>

            <div className="flex flex-col gap-3">
               {navLinks.map((link) => (
                 <Link 
                    key={link.name}
                    to={link.path}
                    className={`flex items-center justify-between px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${location.pathname === link.path ? "bg-[#F5A623] text-[#003366] border-[#F5A623] shadow-xl shadow-[#F5A623]/20" : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white"}`}
                 >
                    {link.name}
                    {link.hasNotification && <span className={`w-2 h-2 rounded-full ${location.pathname === link.path ? 'bg-white' : 'bg-rose-500 shadow-[0_0_8px_rgba(243,33,85,0.8)]'}`}></span>}
                 </Link>
               ))}

               <Link 
                  to="/sell"
                  className="btn-gold mt-6 !py-5"
               >
                  List Asset <i className="fa-solid fa-plus-circle ml-2"></i>
               </Link>
            </div>

            <div className="mt-auto pt-8 border-t border-white/10">
               {user ? (
                 <div className="space-y-6">
                    <div className="flex items-center gap-4 px-4 py-4 bg-white/5 rounded-[28px] border border-white/10">
                       <img 
                          src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=003366&color=fff`} 
                          className="w-12 h-12 rounded-2xl shadow-md border border-white/30" 
                          alt="Av"
                       />
                       <div>
                          <p className="text-xs font-black uppercase text-white tracking-tighter">{user.name}</p>
                          <p className="text-[10px] font-bold uppercase text-slate-300 tracking-widest mt-1 italic leading-none">Student</p>
                       </div>
                    </div>
                    <button 
                      onClick={logout}
                      className="w-full py-4 text-rose-300 text-[9px] font-black uppercase tracking-widest border border-rose-500/30 bg-rose-500/10 rounded-2xl hover:bg-rose-500/20 transition-all flex items-center justify-center gap-3"
                    >
                       Log Out <i className="fa-solid fa-power-off"></i>
                    </button>
                 </div>
              ) : (
                 <div className="grid grid-cols-2 gap-4">
                    <Link to="/login" className="flex items-center justify-center py-4 bg-white/10 border border-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Login</Link>
                    <Link to="/register" className="flex items-center justify-center py-4 bg-[#F5A623] text-[#003366] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(245,166,35,0.4)]">Register</Link>
                 </div>
               )}
            </div>
         </div>
      </div>
    </header>
  );
};

export default Header;
