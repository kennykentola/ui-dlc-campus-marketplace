
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { UserProfile } from "../types";
import { databases } from "../lib/appwrite";
import { ID, Query } from "appwrite";

const Support: React.FC = () => {
  const [searchParams] = useSearchParams();
  const reportedUserIdParam = searchParams.get("reportUser");
  
  const navigate = useNavigate();
  const { user } = useAuth();

  const [category, setCategory] = useState(reportedUserIdParam ? "scam_report" : "");
  const [description, setDescription] = useState("");
  const [reportedUser, setReportedUser] = useState<UserProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
     if (reportedUserIdParam) {
        databases.getDocument(import.meta.env.VITE_APPWRITE_DATABASE_ID, "profiles", reportedUserIdParam)
           .then(res => setReportedUser(res as unknown as UserProfile))
           .catch(() => {});
     }
  }, [reportedUserIdParam]);

  const handleSearch = async (val: string) => {
     setSearchTerm(val);
     if (val.length < 3) { setSearchResults([]); return; }
     setSearching(true);
     try {
        const res = await databases.listDocuments(import.meta.env.VITE_APPWRITE_DATABASE_ID, "profiles", [
           Query.or([
              Query.contains("name", val),
              Query.contains("matricNumber", val)
           ]),
           Query.limit(5)
        ]);
        setSearchResults(res.documents as unknown as UserProfile[]);
     } catch (e) { console.error(e); }
     finally { setSearching(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_REPORTS_COLLECTION_ID || "reports",
        ID.unique(),
        {
          reporterId: user.userId,
          reporterName: user.name,
          reporterEmail: user.email,
          reporterMatric: user.matricNumber,
          reportedUserId: reportedUser?.userId || "system_hub",
          reportedName: reportedUser?.name || "System Hub",
          reportedMatric: reportedUser?.matricNumber || "N/A",
          reportedEmail: reportedUser?.email || "N/A",
          reason: category,
          description: description || "No additional details",
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );
      setSuccess(true);
    } catch (error: any) {
      console.error("Transmission Fail Details:", error);
      alert(`Terminal Error: ${error.message} (Code: ${error.code})`);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8 animate-bounceIn bg-brand-ink/40 backdrop-blur-xl border border-white/10 p-10 rounded-[40px] shadow-2xl">
          <div className="w-24 h-24 bg-brand-secondary/20 text-brand-secondary rounded-full flex items-center justify-center mx-auto shadow-inner border border-brand-secondary/30">
            <i className="fa-solid fa-check-double text-4xl"></i>
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Case Logged.</h1>
            <p className="text-sm font-medium text-brand-surface/70 leading-relaxed">Your report has been securely transmitted to the Campus Authority. An auditor will review the case and contact you via your registered institutional mail.</p>
          </div>
          <button onClick={() => navigate("/")} className="w-full py-5 bg-brand-secondary text-brand-ink rounded-3xl font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all">Return to Terminal</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent min-h-screen pt-32 pb-40 px-6">
      <main className="max-w-2xl mx-auto space-y-16 animate-slideUp">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-rose-500/20 border border-rose-500/30 rounded-full mb-4 backdrop-blur-md">
            <span className="w-2 h-2 bg-rose-400 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black text-rose-300 uppercase tracking-widest">Authority Terminal</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none">Safe Trade <span className="text-brand-secondary">Hub.</span></h1>
          <p className="text-[10px] text-brand-surface/70 font-bold uppercase tracking-[0.4em] italic pl-1 leading-none mt-4">Conflict Resolution & Scholarly Support</p>
        </header>

        <form onSubmit={handleSubmit} className="bg-brand-ink/40 backdrop-blur-2xl border border-white/10 rounded-[56px] p-8 md:p-14 space-y-10 shadow-[0_32px_80px_-36px_rgba(3,34,33,0.8)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
             <i className="fa-solid fa-building-columns text-9xl text-white"></i>
          </div>
          
          <div className="space-y-8 relative z-10">
            {reportedUser ? (
               <div className="p-6 bg-white border border-indigo-100 rounded-3xl flex items-center gap-6 animate-fadeIn shadow-sm">
                  <img src={reportedUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(reportedUser.name)}&background=003366&color=fff`} className="w-14 h-14 rounded-2xl border-2 border-slate-50 shadow-sm" alt="Av" />
                  <div className="grow">
                     <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-1 italic">Linked Suspect Profile</p>
                     <p className="text-sm font-black text-brand-primary uppercase">{reportedUser.name}</p>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">{(reportedUser as any).matricNumber} • {(reportedUser as any).email}</p>
                  </div>
                  <button type="button" onClick={() => setReportedUser(null)} aria-label="Remove suspect" className="w-10 h-10 bg-slate-50 rounded-xl text-slate-300 hover:text-rose-500 transition-all border border-slate-100"><i className="fa-solid fa-circle-xmark"></i></button>
               </div>
            ) : (
               (category === 'scam_report' || category === 'payment_issue') && (
                  <div className="space-y-4 animate-fadeIn">
                     <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest px-1">Identify Suspect (Name or Matric)</label>
                     <div className="relative">
                        <input 
                           type="text" 
                           placeholder="Search campus directory..."
                           className="w-full bg-white border border-slate-100 rounded-2xl px-6 py-5 text-sm font-black text-brand-primary outline-none focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                           value={searchTerm}
                           onChange={e => handleSearch(e.target.value)}
                        />
                        {searching && <div className="absolute right-6 top-5 animate-spin w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full"></div>}
                     </div>
                     
                     {searchResults.length > 0 && (
                        <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-xl divide-y divide-slate-50">
                           {searchResults.map(r => (
                              <button key={r.$id} type="button" onClick={() => { setReportedUser(r); setSearchResults([]); setSearchTerm(""); }} className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-all text-left">
                                 <img src={r.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.name)}&background=003366&color=fff`} alt={`${r.name}'s avatar`} className="w-10 h-10 rounded-xl" />
                                 <div>
                                    <p className="text-xs font-black text-brand-primary uppercase">{r.name}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{r.matricNumber}</p>
                                 </div>
                              </button>
                           ))}
                        </div>
                     )}
                  </div>
               )
            )}

            <div className="space-y-4">
              <label htmlFor="complaint-category" className="text-[10px] font-black text-brand-surface/60 uppercase tracking-widest px-1">Complaint Category</label>
              <select 
                id="complaint-category"
                className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-5 text-sm font-black text-white outline-none focus:ring-4 focus:ring-brand-secondary/30 focus:border-brand-secondary transition-all shadow-inner appearance-none"
                value={category}
                onChange={e => setCategory(e.target.value)}
                required
              >
                <option value="">Select Category</option>
                <option value="scam_report">Report a Scammer / Fake User</option>
                <option value="payment_issue">Payment / Transaction Escalation</option>
                <option value="technical_bug">Technical System Bug</option>
                <option value="harassment">Unprofessional Conduct / Harassment</option>
                <option value="other">Other Conflict</option>
              </select>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-brand-surface/60 uppercase tracking-widest px-1">Statement of Facts</label>
              <textarea 
                placeholder="Describe the incident, providing as much detail as possible for the audit team..."
                className="w-full h-48 bg-black/20 border border-white/10 rounded-[32px] px-8 py-6 text-sm font-medium text-white placeholder:text-white/30 outline-none focus:ring-4 focus:ring-brand-secondary/30 focus:border-brand-secondary transition-all shadow-inner resize-none"
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="pt-6 relative z-10">
            <button 
              type="submit" 
              disabled={submitting}
              className="w-full py-6 bg-brand-secondary text-brand-ink rounded-[30px] font-black text-[12px] uppercase tracking-widest shadow-2xl shadow-brand-secondary/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-4"
            >
              {submitting ? "Transmitting Report..." : "Log Official Complaint"}
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </form>

        <div className="p-8 bg-brand-ink/40 backdrop-blur-xl rounded-[40px] flex items-start gap-6 border border-white/10 shadow-lg">
           <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/5">
              <i className="fa-solid fa-id-card-clip text-brand-secondary"></i>
           </div>
           <p className="text-[11px] text-brand-surface/70 font-medium leading-relaxed italic">
              "Traceability Hub: Your Matric Number ({user.matricNumber}) and Email ({user.email}) are automatically attached to this report for thorough investigation."
           </p>
        </div>
      </main>
    </div>
  );
};

export default Support;
