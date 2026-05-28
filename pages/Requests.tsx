import React, { useState, useEffect } from "react";
import { useAuth } from "../App";
import { BuyerRequest } from "../types";
import { databases } from "../lib/appwrite";
import { ID, Query } from "appwrite";
import { Link } from "react-router-dom";

const Requests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BuyerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // New Request Form
  const [itemNeeded, setItemNeeded] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");

  const loadRequests = async () => {
    try {
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        "requests",
        [Query.orderDesc("createdAt")]
      );
      setRequests(response.documents as unknown as BuyerRequest[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        "requests",
        ID.unique(),
        {
          userId: user.userId,
          userName: user.name,
          itemNeeded,
          description,
          budget: parseFloat(budget) || 0,
          createdAt: new Date().toISOString(),
          isFulfilled: false
        }
      );
      setShowModal(false);
      setItemNeeded("");
      setDescription("");
      setBudget("");
      loadRequests();
    } catch (err) {
      console.error(err);
      alert("Noticeboard transmission failed.");
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-40 animate-fadeIn relative text-white bg-gradient-to-br from-[#003366] via-[#051830] to-[#08110c] overflow-hidden">
      {/* Vibrant Background Blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#F5A623]/10 blur-[120px] rounded-full animate-pulse-glow pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#00E5FF]/5 blur-[120px] rounded-full animate-float pointer-events-none"></div>

      <div className="container mx-auto px-6 max-w-6xl space-y-16 relative z-10">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
           <div className="space-y-5">
               <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-none">Buyer <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5A623] to-yellow-200">Requests.</span></h1>
               <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.4em] italic leading-none pl-1">Campus Noticeboard</p>
               
               <div className="max-w-2xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md mt-4">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5A623]/10 blur-2xl rounded-full -mr-10 -mt-10 pointer-events-none"></div>
                 <p className="text-sm font-medium text-white/90 leading-relaxed relative z-10">
                   <i className="fa-solid fa-circle-info text-[#F5A623] mr-2 text-lg align-middle"></i>
                   <strong className="text-white tracking-wide">How it works:</strong> Can't find an item on the marketplace? Post a request here! It acts as our digital campus noticeboard. Sellers who have what you need will see your request and message you directly to fulfill it.
                 </p>
               </div>
           </div>
           <button 
             onClick={() => {
               if (!user) {
                 window.location.href = "/login";
               } else {
                 setShowModal(true);
               }
             }}
             className="btn-gold !py-5 !px-10 shrink-0"
           >
              {user ? 'Deploy Request' : 'Login to Request'} <i className="fa-solid fa-bullhorn ml-2"></i>
           </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              [...Array(6)].map((_, i) => <div key={i} className="h-64 glass-panel rounded-[40px] animate-pulse"></div>)
           ) : requests.length > 0 ? (
             requests.map((r, i) => (
                <div key={i} className={`p-10 glass-panel rounded-3xl space-y-8 hover:shadow-[0_20px_50px_-12px_rgba(245,166,35,0.1)] hover:-translate-y-2 hover:border-[#F5A623]/30 transition-all duration-300 group ${r.isFulfilled ? 'opacity-50 grayscale' : ''}`}>
                   <div className="flex items-center justify-between">
                      <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-300">Log #{r.$id.slice(-4)}</span>
                      {r.budget > 0 && <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 font-black text-[10px] uppercase tracking-widest rounded-full border border-emerald-500/20">₦{r.budget.toLocaleString()}</span>}
                   </div>

                   <div className="space-y-4">
                      <h3 className="text-2xl font-black text-white leading-tight tracking-tight group-hover:text-[#F5A623] transition-colors line-clamp-2">{r.itemNeeded}</h3>
                      <p className="text-sm text-slate-400 font-medium leading-relaxed italic line-clamp-3">{r.description}</p>
                   </div>

                   <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-[#F5A623] text-sm font-black">
                            {r.userName.charAt(0)}
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-white uppercase tracking-tighter leading-none">{r.userName}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Requester</p>
                         </div>
                      </div>
                      
                      {user && user.userId !== r.userId && (
                        <Link to={`/messages?with=${r.userId}&product=request_${r.$id}`} aria-label="Send message" className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white hover:bg-[#F5A623] hover:text-[#003366] transition-all shadow-sm group-hover:scale-110 border border-white/10 hover:border-transparent">
                           <i className="fa-solid fa-paper-plane text-xs" aria-hidden="true"></i>
                        </Link>
                      )}
                  </div>
               </div>
             ))
           ) : (
             <div className="col-span-full py-32 text-center space-y-4 opacity-30">
                <i className="fa-solid fa-ghost text-6xl text-white"></i>
                <p className="text-[10px] font-black uppercase tracking-widest text-white">Noticeboard registry is empty.</p>
             </div>
           )}
        </div>
      </div>

      {/* Deploy Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-6 overflow-y-auto no-scrollbar scroll-smooth animate-fadeIn">
           <div className="fixed inset-0 bg-[#001122]/80 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
           <div className="relative my-auto glass-panel w-full max-w-xl rounded-[40px] p-10 md:p-14 shadow-2xl z-10 animate-slideUp border border-white/10">
              <div className="space-y-4 mb-10">
                 <h2 className="text-3xl font-black text-white tracking-tighter leading-none">Deploy Request</h2>
                 <p className="text-xs text-slate-400 font-medium">Tell the campus what you need. Someone might have it!</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-10">
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Item Nomenclature</p>
                    <input type="text" placeholder="e.g. Seeking GST 101 Past Questions" className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-sm font-medium text-white outline-none focus:bg-black/40 focus:border-[#F5A623]/50 focus:ring-2 focus:ring-[#F5A623]/20 transition-all shadow-sm" value={itemNeeded} onChange={(e) => setItemNeeded(e.target.value)} required />
                 </div>

                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Budget Valuation (₦)</p>
                    <input type="number" placeholder="Optional Amount" className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-sm font-medium text-white outline-none focus:bg-black/40 focus:border-[#F5A623]/50 focus:ring-2 focus:ring-[#F5A623]/20 transition-all shadow-sm" value={budget} onChange={(e) => setBudget(e.target.value)} />
                 </div>

                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Requirement Details</p>
                    <textarea placeholder="Condition, time sensitivity, specifications..." className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-sm font-medium text-white outline-none focus:bg-black/40 focus:border-[#F5A623]/50 focus:ring-2 focus:ring-[#F5A623]/20 transition-all shadow-sm resize-none" value={description} onChange={(e) => setDescription(e.target.value)} required />
                 </div>

                 <div className="pt-6 flex gap-4 items-center">
                    <button type="button" onClick={() => setShowModal(false)} className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-400 transition-all">Cancel</button>
                    <button type="submit" className="grow btn-gold !py-5">Post Request</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Requests;
