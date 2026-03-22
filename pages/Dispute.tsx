
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { Transaction, TransactionStatus } from "../types";
import { databases } from "../lib/appwrite";
import { ID } from "appwrite";

const Dispute: React.FC = () => {
  const { id } = useParams(); // Transaction ID
  const navigate = useNavigate();
  const { user } = useAuth();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadTx = async () => {
      if (!id) return;
      try {
        const tx = await databases.getDocument(import.meta.env.VITE_APPWRITE_DATABASE_ID, "transactions", id);
        setTransaction(tx as any);
      } catch (e) { navigate("/transactions"); }
      finally { setLoading(false); }
    };
    loadTx();
  }, [id, navigate]);

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction || !user) return;
    setSubmitting(true);
    try {
      await databases.updateDocument(import.meta.env.VITE_APPWRITE_DATABASE_ID, "transactions", transaction.$id, {
        status: TransactionStatus.DISPUTED,
        disputeReason: `${reason}: ${description}`,
        updatedAt: new Date().toISOString()
      });
      
      // Create a Report for Admin
      await databases.createDocument(import.meta.env.VITE_APPWRITE_DATABASE_ID, "reports", ID.unique(), {
         productId: transaction.productId,
         productName: transaction.productName,
         reporterId: user.userId,
         reporterName: user.name,
         reason: "Transaction Dispute",
         description: `TX-ID: ${transaction.$id}. Reason: ${reason}. Details: ${description}`,
         createdAt: new Date().toISOString(),
         status: 'pending'
      });

      alert("Dispute transmission successful. Admin audit initiated.");
      navigate("/transactions");
    } catch (e) { alert("Dispute deployment failed."); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen pt-40 flex justify-center"><div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="bg-white min-h-screen pt-32 pb-40 px-6">
      <main className="max-w-2xl mx-auto space-y-12 animate-slideUp">
         <div className="text-center space-y-4">
            <h1 className="text-4xl font-black text-rose-500 uppercase tracking-tighter leading-none">Dispute <span className="text-[#003366]">Protocol.</span></h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em] italic pl-1">Transaction Conflict Resolution Hub</p>
         </div>

         <form onSubmit={handleSubmitDispute} className="bg-slate-50 border border-slate-100 rounded-[56px] p-10 md:p-14 space-y-10 shadow-2xl shadow-rose-500/5">
            <div className="space-y-6 pb-10 border-b border-slate-200/50">
               <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Target Transaction</p>
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic leading-none">Conflicting Node: {transaction?.$id.slice(-6)}</span>
               </div>
               <h3 className="text-2xl font-black text-[#003366] uppercase tracking-tight">{transaction?.productName}</h3>
               <p className="text-lg font-black text-teal-600 leading-none">₦{transaction?.amount.toLocaleString()}</p>
            </div>

            <div className="space-y-8">
               <div className="space-y-4">
                  <p className="text-[10px] font-black text-[#003366]/40 uppercase tracking-widest px-1">Conflict Category</p>
                  <select className="w-full bg-white border border-slate-100 rounded-2xl px-6 py-5 text-sm font-black text-[#003366] outline-none focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm" value={reason} onChange={e => setReason(e.target.value)} required>
                     <option value="">Select Protocol Conflict</option>
                     <option value="fake_listing">Fake Listing / Scams</option>
                     <option value="wrong_item">Asset Mismatch / Wrong Item</option>
                     <option value="no_delivery">Payment Sent, Asset Not Transmitted</option>
                     <option value="unresponsive">Scholarly Associate Unresponsive</option>
                     <option value="defective">Severely Defective Asset</option>
                  </select>
               </div>

               <div className="space-y-4">
                  <p className="text-[10px] font-black text-[#003366]/40 uppercase tracking-widest px-1">Incident Documentation</p>
                  <textarea placeholder="Describe the conflict in detail for administrative audit..." className="w-full h-48 bg-white border border-slate-100 rounded-[32px] px-8 py-6 text-sm font-medium text-slate-800 outline-none focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm resize-none" value={description} onChange={e => setDescription(e.target.value)} required />
               </div>
            </div>

            <div className="pt-10 flex gap-6">
               <button type="button" onClick={() => navigate(-1)} className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-all">Cancel Audit</button>
               <button type="submit" disabled={submitting} className="grow py-5 bg-rose-500 text-white rounded-[24px] font-black text-[12px] uppercase tracking-widest shadow-2xl shadow-rose-900/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-4">
                  {submitting ? "Initiating Conflict Log..." : "Execute Dispute Transmission"}
                  <i className="fa-solid fa-bolt"></i>
               </button>
            </div>
         </form>

         <div className="p-8 bg-rose-50 border border-rose-100 rounded-[32px] flex items-center gap-6">
            <i className="fa-solid fa-shield-halved text-rose-500 text-2xl"></i>
            <p className="text-[10px] text-rose-800 font-bold uppercase tracking-widest leading-relaxed">Admin auditors will review this transmission within 24 hours. Misuse of the dispute terminal may result in scholarly suspension.</p>
         </div>
      </main>
    </div>
  );
};

export default Dispute;
