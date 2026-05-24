
import React, { useState, useEffect } from "react";
import { useAuth } from "../App";
import { Transaction, TransactionStatus } from "../types";
import { databases } from "../lib/appwrite";
import { Query } from "appwrite";

const Transactions: React.FC = () => {
  const { user } = useAuth();
  const [sentTransactions, setSentTransactions] = useState<Transaction[]>([]);
  const [receivedTransactions, setReceivedTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'buying' | 'selling'>('buying');
  const { pendingTxCount } = useAuth();

  const loadTransactions = async () => {
    if (!user) return;
    try {
      const sent = await databases.listDocuments(import.meta.env.VITE_APPWRITE_DATABASE_ID, "transactions", [Query.equal("buyerId", user.userId), Query.orderDesc("updatedAt")]);
      const received = await databases.listDocuments(import.meta.env.VITE_APPWRITE_DATABASE_ID, "transactions", [Query.equal("sellerId", user.userId), Query.orderDesc("updatedAt")]);
      setSentTransactions(sent.documents as unknown as Transaction[]);
      setReceivedTransactions(received.documents as unknown as Transaction[]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    loadTransactions();
  }, [user]);

  // Auto-switch to Inbound tab when seller has pending receipts
  useEffect(() => {
    if (pendingTxCount > 0) {
      setActiveTab('selling');
    }
  }, [pendingTxCount]);

  const confirmPayment = async (txId: string) => {
    try {
      await databases.updateDocument(import.meta.env.VITE_APPWRITE_DATABASE_ID, "transactions", txId, {
        status: TransactionStatus.PAYMENT_CONFIRMED,
        updatedAt: new Date().toISOString()
      });
      loadTransactions();
    } catch (e) { alert("Status update failed."); }
  };

  const completetx = async (txId: string) => {
    try {
      await databases.updateDocument(import.meta.env.VITE_APPWRITE_DATABASE_ID, "transactions", txId, {
        status: TransactionStatus.COMPLETED,
        updatedAt: new Date().toISOString()
      });
      loadTransactions();
    } catch (e) { alert("Status update failed."); }
  };

  return (
    <div className="bg-hub-gradient-light min-h-screen pt-32 pb-40 animate-fadeIn relative px-6">
      <div className="container mx-auto max-w-5xl space-y-16 relative z-10">
         
         <header className="space-y-4">
            <h1 className="text-4xl font-black text-brand-primary uppercase tracking-tighter">Transaction <span className="text-brand-primary">Archive.</span></h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em] italic mb-10 leading-none">Immutable Hub Trade Registry</p>
         </header>

         {/* Protocol Toggle */}
         <div className="flex gap-4 p-2 bg-slate-50 border border-slate-100 rounded-[32px] w-fit mb-12">
            <button onClick={() => setActiveTab('buying')} className={`px-10 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'buying' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-400 hover:text-brand-primary'}`}>Outbound Registry</button>
            <button onClick={() => setActiveTab('selling')} className={`px-10 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'selling' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-400 hover:text-brand-primary'}`}>Inbound Registry</button>
         </div>

          {/* Pending Receipt Alert */}
          {activeTab === 'selling' && pendingTxCount > 0 && (
            <div className="flex items-center gap-4 px-8 py-5 bg-brand-secondary/10 border border-brand-secondary/20 rounded-[28px] animate-slideUp">
              <span className="w-3 h-3 bg-brand-secondary rounded-full animate-pulse shrink-0"></span>
              <p className="text-[11px] font-black text-brand-primary uppercase tracking-widest">
                You have {pendingTxCount} pending payment receipt{pendingTxCount > 1 ? 's' : ''} to review
              </p>
            </div>
          )}

         <div className="space-y-10">
            {loading ? (
               <div className="py-20 flex justify-center"><div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
               (activeTab === 'buying' ? sentTransactions : receivedTransactions).map(tx => (
                  <div key={tx.$id} className="relative bg-white border border-slate-100 p-8 rounded-[48px] shadow-sm flex flex-col md:flex-row items-center justify-between gap-10 hover:shadow-xl hover:border-brand-primary/10 transition-all group animate-slideUp">
                     <div className="flex items-center gap-8 w-full md:w-auto">
                        <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center text-brand-primary text-3xl shadow-inner relative overflow-hidden">
                           <i className={`fa-solid ${tx.status === TransactionStatus.COMPLETED ? 'fa-circle-check text-brand-primary' : tx.status === TransactionStatus.CANCELLED ? 'fa-circle-xmark text-rose-500' : 'fa-hourglass-half animate-pulse'}`}></i>
                        </div>
                        <div className="space-y-2">
                           <div className="flex items-center gap-3">
                              <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${tx.status === TransactionStatus.COMPLETED ? 'bg-brand-surface border-indigo-100 text-brand-primary' : 'bg-yellow-50 border-yellow-100 text-yellow-700'}`}>TX Node: {tx.$id.slice(-6)}</span>
                              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">{new Date(tx.updatedAt).toLocaleDateString()}</span>
                           </div>
                           <h3 className="text-xl font-black text-brand-primary uppercase tracking-tight truncate">{tx.productName}</h3>
                           <p className="text-[12px] font-black text-brand-primary tracking-tight italic leading-none">₦{tx.amount.toLocaleString()}</p>
                        </div>
                     </div>

                     <div className="flex items-center gap-10 w-full md:w-auto justify-between border-t md:border-t-0 md:border-l border-slate-50 pt-8 md:pt-0 pl-0 md:pl-10">
                        <div className="space-y-2">
                           <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">{activeTab === 'buying' ? 'Authorized Seller' : 'Authorized Buyer'}</p>
                           <p className="text-sm font-black text-brand-primary uppercase">{activeTab === 'buying' ? tx.sellerName : tx.buyerName}</p>
                        </div>

                        <div className="flex items-center gap-4">
                            {tx.status !== TransactionStatus.COMPLETED && tx.status !== TransactionStatus.CANCELLED && (
                              <button 
                                onClick={() => window.location.href = `/dispute/${tx.$id}`}
                                className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-rose-100 shadow-sm"
                                title="Report Conflict / Dispute"
                              >
                                <i className="fa-solid fa-triangle-exclamation"></i>
                              </button>
                            )}
                           
                            {tx.paymentProofUrl && (
                             <a href={tx.paymentProofUrl} target="_blank" rel="noopener noreferrer" aria-label="View payment proof" className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-brand-primary transition-all border border-slate-100 shadow-sm"><i className="fa-solid fa-file-invoice" aria-hidden="true"></i></a>
                           )}
                           
                           {/* Administrative Action Nodes */}
                           {activeTab === 'selling' && tx.status === TransactionStatus.PAYMENT_SENT && (
                             <button onClick={() => confirmPayment(tx.$id)} className="px-10 py-5 bg-brand-primary text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all">Confirm Payment</button>
                           )}
                           {activeTab === 'buying' && tx.status === TransactionStatus.PAYMENT_CONFIRMED && (
                             <button onClick={() => completetx(tx.$id)} className="px-10 py-5 bg-brand-primary text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-brand-primary/10 hover:scale-105 active:scale-95 transition-all">Asset Received</button>
                           )}
                        </div>
                     </div>
                  </div>
               ))
            )}

            {!loading && (activeTab === 'buying' ? sentTransactions : receivedTransactions).length === 0 && (
              <div className="py-40 text-center space-y-4 opacity-30">
                 <i className="fa-solid fa-folder-open text-6xl"></i>
                 <p className="text-[10px] font-black uppercase tracking-widest">No activity found in this registry sector.</p>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default Transactions;
