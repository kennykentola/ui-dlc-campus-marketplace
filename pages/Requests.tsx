
import React, { useState, useEffect } from "react";
import { useAuth } from "../App";
import { BuyerRequest } from "../types";
import { databases } from "../lib/appwrite";
import { ID, Query } from "appwrite";

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
    <div className="bg-hub-gradient-light min-h-screen pt-32 pb-40 animate-fadeIn relative text-brand-ink dark:text-slate-100">
      <div className="container mx-auto px-6 max-w-6xl space-y-16 relative z-10">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
           <div className="space-y-4">
               <h1 className="text-5xl font-black text-brand-primary dark:text-white uppercase tracking-tighter leading-none">Campus <span className="text-brand-primary">Noticeboard.</span></h1>
               <p className="text-[10px] text-slate-300 dark:text-slate-600 font-bold uppercase tracking-[0.4em] italic leading-none pl-1">Demand-Side Academic Activity Log</p>
           </div>
           <button 
             onClick={() => setShowModal(true)}
             className="px-10 py-5 bg-brand-primary text-white rounded-[24px] font-black text-[12px] uppercase tracking-widest shadow-2xl shadow-brand-primary/10 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4"
           >
              Deploy Request <i className="fa-solid fa-bullhorn"></i>
           </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              [...Array(6)].map((_, i) => <div key={i} className="h-64 bg-slate-50 dark:bg-slate-900 rounded-[40px] animate-pulse"></div>)
           ) : requests.length > 0 ? (
             requests.map((r, i) => (
                <div key={i} className={`p-10 border border-slate-100 dark:border-slate-800 rounded-[48px] space-y-8 hover:shadow-2xl hover:border-brand-primary/10 transition-all group ${r.isFulfilled ? 'opacity-50 grayscale' : 'bg-white dark:bg-slate-900 shadow-sm'}`}>
                   <div className="flex items-center justify-between">
                      <span className="px-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-full text-[9px] font-black uppercase tracking-widest text-brand-primary dark:text-indigo-500">Request Log #{r.$id.slice(-4)}</span>
                      {r.budget > 0 && <span className="text-brand-primary font-black text-sm italic">₦{r.budget.toLocaleString()}</span>}
                   </div>

                   <div className="space-y-4">
                      <h3 className="text-xl font-black text-brand-primary dark:text-white uppercase tracking-tight group-hover:text-brand-primary transition-colors leading-tight">{r.itemNeeded}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic line-clamp-3">{r.description}</p>
                   </div>

                   <div className="pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white text-xs font-black shadow-lg">
                            {r.userName.charAt(0)}
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-brand-primary dark:text-white uppercase tracking-tighter leading-none">{r.userName}</p>
                            <p className="text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest mt-1">Requester</p>
                         </div>
                      </div>
                      <button aria-label="Send message" className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-brand-primary dark:text-indigo-500 group-hover:bg-brand-primary group-hover:text-white transition-all shadow-sm">
                         <i className="fa-solid fa-paper-plane text-[10px]" aria-hidden="true"></i>
                      </button>
                  </div>
               </div>
             ))
           ) : (
             <div className="col-span-full py-32 text-center space-y-4 opacity-30">
                <i className="fa-solid fa-ghost text-6xl"></i>
                <p className="text-[10px] font-black uppercase tracking-widest">Noticeboard registry is empty.</p>
             </div>
           )}
        </div>
      </div>

      {/* Deploy Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-100 flex items-start justify-center p-6 overflow-y-auto no-scrollbar scroll-smooth animate-fadeIn">
           <div className="fixed inset-0 bg-brand-primary/60 backdrop-blur-xl" onClick={() => setShowModal(false)}></div>
           <div className="relative my-auto bg-white dark:bg-slate-900 w-full max-w-xl rounded-[48px] p-10 md:p-14 shadow-2xl z-10 animate-slideUp border border-white/10 dark:border-slate-800">
              <div className="space-y-4 mb-12">
                 <h2 className="text-3xl font-black text-brand-primary dark:text-white uppercase tracking-tighter leading-none">Deploy Requirement.</h2>
                 <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.3em] italic">Noticeboard Transmission Protocol</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-10">
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest px-1">Item Nomenclature</p>
                    <input type="text" placeholder="e.g. Seeking GST 101 Past Questions" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-8 py-5 text-sm font-black text-brand-primary dark:text-white outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-brand-primary transition-all shadow-sm" value={itemNeeded} onChange={(e) => setItemNeeded(e.target.value)} required />
                 </div>

                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest px-1">Budget Valuation (₦)</p>
                    <input type="number" placeholder="Optional Amount" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-8 py-5 text-sm font-black text-brand-primary dark:text-white outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-brand-primary transition-all shadow-sm" value={budget} onChange={(e) => setBudget(e.target.value)} />
                 </div>

                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest px-1">Requirement Details</p>
                    <textarea placeholder="Condition, time sensitivity, specifications..." className="w-full h-32 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[28px] px-8 py-5 text-sm font-medium text-brand-ink dark:text-slate-300 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-brand-primary transition-all shadow-sm resize-none" value={description} onChange={(e) => setDescription(e.target.value)} required />
                 </div>

                 <div className="pt-6 flex gap-4">
                    <button type="button" onClick={() => setShowModal(false)} className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-rose-500 transition-all">Abort</button>
                    <button type="submit" className="grow py-5 bg-brand-primary text-white rounded-[24px] font-black text-[12px] uppercase tracking-widest shadow-2xl shadow-brand-primary/10 hover:scale-[1.02] active:scale-95 transition-all">Initiate Transmission</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Requests;
