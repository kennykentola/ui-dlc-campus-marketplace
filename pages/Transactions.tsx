
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
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

  const handleDownload = async (url: string, txId: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `receipt_TX-${txId.slice(-6)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      alert("Failed to download receipt.");
    }
  };

  const cancelTransaction = async (txId: string) => {
    if (!window.confirm("Are you sure you want to cancel this transaction? This action is immutable.")) return;
    setCancellingId(txId);
    try {
      await databases.updateDocument(import.meta.env.VITE_APPWRITE_DATABASE_ID, "transactions", txId, {
        status: TransactionStatus.CANCELLED,
        updatedAt: new Date().toISOString()
      });
      loadTransactions();
    } catch (error) {
      alert("Failed to cancel transaction.");
    } finally {
      setCancellingId(null);
    }
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
                  <div key={tx.$id} className={`relative bg-white border border-slate-100 p-8 rounded-[48px] shadow-sm flex flex-col gap-8 hover:shadow-xl hover:border-brand-primary/10 transition-all group animate-slideUp ${tx.status === TransactionStatus.CANCELLED ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                     
                     <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="flex items-center gap-8 w-full md:w-auto">
                           <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center text-brand-primary text-3xl shadow-inner relative overflow-hidden shrink-0">
                              <i className={`fa-solid ${tx.status === TransactionStatus.COMPLETED ? 'fa-circle-check text-brand-primary' : tx.status === TransactionStatus.CANCELLED ? 'fa-circle-xmark text-rose-500' : 'fa-hourglass-half animate-pulse'}`}></i>
                           </div>
                           <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-3">
                                 <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${tx.status === TransactionStatus.COMPLETED ? 'bg-brand-surface border-indigo-100 text-brand-primary' : tx.status === TransactionStatus.CANCELLED ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-yellow-50 border-yellow-100 text-yellow-700'}`}>TX Node: {tx.$id.slice(-6)}</span>
                                 <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">{new Date(tx.updatedAt).toLocaleDateString()}</span>
                                 {tx.status === TransactionStatus.CANCELLED && <span className="px-3 py-1 bg-rose-500 text-white rounded-md text-[8px] font-black uppercase tracking-widest">Cancelled</span>}
                              </div>
                              <h3 className="text-xl font-black text-brand-primary uppercase tracking-tight truncate max-w-[200px] sm:max-w-[300px]">{tx.productName}</h3>
                              <p className="text-[12px] font-black text-brand-primary tracking-tight italic leading-none">₦{tx.amount.toLocaleString()}</p>
                           </div>
                        </div>

                        <div className="flex items-center gap-10 w-full md:w-auto justify-between border-t md:border-t-0 md:border-l border-slate-50 pt-8 md:pt-0 pl-0 md:pl-10">
                           <div className="space-y-2">
                              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">{activeTab === 'buying' ? 'Authorized Seller' : 'Authorized Buyer'}</p>
                              <p className="text-sm font-black text-brand-primary uppercase">{activeTab === 'buying' ? tx.sellerName : tx.buyerName}</p>
                           </div>

                           <div className="flex items-center gap-3 flex-wrap justify-end">
                               {tx.status !== TransactionStatus.COMPLETED && tx.status !== TransactionStatus.CANCELLED && (
                                 <button 
                                   onClick={() => window.location.href = `/dispute/${tx.$id}`}
                                   className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-rose-100 shadow-sm"
                                   title="Report Conflict / Dispute"
                                 >
                                   <i className="fa-solid fa-triangle-exclamation"></i>
                                 </button>
                               )}
                              
                               {tx.paymentProofUrl && (
                                <div className="flex gap-2">
                                  <button onClick={() => setPreviewUrl(tx.paymentProofUrl!)} title="View Payment Proof" aria-label="View payment proof" className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-brand-primary transition-all border border-slate-100 shadow-sm"><i className="fa-solid fa-eye" aria-hidden="true"></i></button>
                                  <button onClick={() => handleDownload(tx.paymentProofUrl!, tx.$id)} title="Download Payment Proof" aria-label="Download payment proof" className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-brand-secondary transition-all border border-slate-100 shadow-sm"><i className="fa-solid fa-download" aria-hidden="true"></i></button>
                                </div>
                              )}
                              
                              {/* Administrative Action Nodes */}
                              {activeTab === 'selling' && tx.status === TransactionStatus.PAYMENT_SENT && (
                                <button onClick={() => confirmPayment(tx.$id)} className="px-6 py-4 bg-brand-primary text-white rounded-[20px] font-black text-[9px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Confirm Payment</button>
                              )}
                              {activeTab === 'buying' && tx.status === TransactionStatus.PAYMENT_CONFIRMED && (
                                <button onClick={() => completetx(tx.$id)} className="px-6 py-4 bg-brand-primary text-white rounded-[20px] font-black text-[9px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Asset Received</button>
                              )}

                              {tx.status === TransactionStatus.PAYMENT_SENT && (
                                <button 
                                  onClick={() => cancelTransaction(tx.$id)} 
                                  disabled={cancellingId === tx.$id}
                                  className="px-4 py-4 bg-white text-rose-500 border border-rose-100 rounded-[20px] font-black text-[9px] uppercase tracking-widest hover:bg-rose-50 transition-all disabled:opacity-50"
                                >
                                  {cancellingId === tx.$id ? 'Cancelling...' : 'Cancel'}
                                </button>
                              )}
                           </div>
                        </div>
                     </div>

                     {/* Status Progress Timeline */}
                     {tx.status !== TransactionStatus.CANCELLED && (
                       <div className="w-full bg-slate-50 rounded-3xl p-6 border border-slate-100 mt-2">
                          <div className="flex items-center justify-between relative">
                             <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 z-0 rounded-full"></div>
                             <div className="absolute top-1/2 left-0 h-1 bg-brand-secondary -translate-y-1/2 z-0 rounded-full transition-all duration-1000" style={{ width: tx.status === TransactionStatus.PAYMENT_SENT ? '33%' : tx.status === TransactionStatus.PAYMENT_CONFIRMED ? '66%' : '100%' }}></div>
                             
                             <div className="relative z-10 flex flex-col items-center gap-2">
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs text-white shadow-md transition-colors ${tx.status === TransactionStatus.PAYMENT_SENT || tx.status === TransactionStatus.PAYMENT_CONFIRMED || tx.status === TransactionStatus.COMPLETED ? 'bg-brand-secondary' : 'bg-slate-300'}`}>1</div>
                               <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 px-2 rounded-full hidden sm:block">Payment Sent</span>
                             </div>
                             
                             <div className="relative z-10 flex flex-col items-center gap-2">
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs text-white shadow-md transition-colors ${tx.status === TransactionStatus.PAYMENT_CONFIRMED || tx.status === TransactionStatus.COMPLETED ? 'bg-brand-secondary' : 'bg-slate-300'}`}>2</div>
                               <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 px-2 rounded-full hidden sm:block">Payment Confirmed</span>
                             </div>
                             
                             <div className="relative z-10 flex flex-col items-center gap-2">
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs text-white shadow-md transition-colors ${tx.status === TransactionStatus.COMPLETED ? 'bg-brand-secondary' : 'bg-slate-300'}`}>3</div>
                               <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 px-2 rounded-full hidden sm:block">Completed</span>
                             </div>
                          </div>
                       </div>
                     )}

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

      {/* Receipt Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-6 animate-fadeIn">
          <div className="absolute inset-0 bg-brand-primary/80 backdrop-blur-sm" onClick={() => setPreviewUrl(null)}></div>
          <div className="bg-white rounded-[40px] p-8 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col relative z-10 animate-slideUp shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-brand-primary uppercase tracking-tighter">Payment Proof</h3>
              <div className="flex items-center gap-3">
                <button onClick={() => handleDownload(previewUrl, "preview")} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white transition-all border border-slate-100 shadow-sm" aria-label="Download receipt">
                  <i className="fa-solid fa-download"></i>
                </button>
                <button onClick={() => setPreviewUrl(null)} className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm" aria-label="Close modal">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto bg-slate-50 rounded-[24px] border border-slate-100 flex items-center justify-center p-4">
              {previewUrl.toLowerCase().includes('.pdf') ? (
                <iframe src={previewUrl} className="w-full h-full min-h-[60vh] rounded-[16px]" title="Receipt PDF Preview" />
              ) : (
                <img src={previewUrl} className="max-w-full max-h-[60vh] object-contain rounded-[16px]" alt="Receipt Preview" />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Transactions;
