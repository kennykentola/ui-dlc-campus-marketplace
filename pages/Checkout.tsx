
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { Product, UserProfile, TransactionStatus } from "../types";
import { databases, storage } from "../lib/appwrite";
import { ID } from "appwrite";

const Checkout: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState(1); // 1: Bank Details, 2: Upload Proof, 3: Success
  const [receipt, setReceipt] = useState<File | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        const prod = await databases.getDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID, 
          "products", 
          id
        );
        setProduct(prod as any);

        const sel = await databases.getDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID, 
          "profiles", 
          prod.sellerId
        );
        setSeller(sel as any);
      } catch (e) {
        console.error(e);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    loadData();
    if (!user && !loading) navigate("/login");
  }, [id, user, navigate, loading]);

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setReceipt(e.target.files[0]);
  };

  const submitProof = async () => {
    if (!receipt || !product || !user || !seller) return;
    setUploading(true);
    try {
      // Appwrite strict validation: The File object MUST have a valid extension in its name.
      // If the user's file is missing an extension on their OS, Appwrite rejects it.
      let ext = 'jpg';
      if (receipt.type === 'application/pdf') ext = 'pdf';
      else if (receipt.type === 'image/png') ext = 'png';
      else if (receipt.type === 'image/webp') ext = 'webp';
      
      const safeFile = new File([receipt], `upload_${ID.unique()}.${ext}`, { type: receipt.type });

      const file = await storage.createFile(
        import.meta.env.VITE_APPWRITE_BUCKET_ID, 
        ID.unique(), 
        safeFile
      );
      const url = storage.getFileView(import.meta.env.VITE_APPWRITE_BUCKET_ID, file.$id).toString();

      // Create Transaction Record
      await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID, 
        "transactions", 
        ID.unique(), 
        {
           productId: product.$id,
           productName: product.name,
           sellerId: seller.userId,
           sellerName: seller.name,
           buyerId: user.userId,
           buyerName: user.name,
           amount: product.price,
           status: TransactionStatus.PAYMENT_SENT,
           paymentProofUrl: url,
           createdAt: new Date().toISOString(),
           updatedAt: new Date().toISOString()
        }
      );

      setStep(3);
    } catch (err) {
      console.error(err);
      alert("Verification protocol failed.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
     <div className="flex flex-col items-center justify-center min-h-screen pt-32 bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[10px] font-black text-brand-primary dark:text-indigo-500 uppercase tracking-widest">Accessing Hub Protocols...</p>
     </div>
  );

  return (
    <div className="bg-transparent min-h-screen pt-40 pb-40 relative px-6 overflow-hidden text-white">
      <div className="gradient-blob blob-teal opacity-[0.05]"></div>
      
      <main className="max-w-xl mx-auto space-y-12 relative z-10">
         <div className="text-center space-y-4">
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
              Escrow <span className="text-[#F5A623]">Protocol.</span>
            </h1>
            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.4em] italic">
              Secure Campus Trade - Node ID: {product?.$id?.slice(-8)}
            </p>
         </div>

         {/* Protocol Progress Bar */}
         <div className="flex items-center gap-4 glass-panel p-6 rounded-[32px]">
            {[1, 2, 3].map(i => (
               <div key={i} className={`grow h-2 rounded-full transition-all duration-700 ${step >= i ? 'bg-[#F5A623]' : 'bg-white/10'}`}></div>
            ))}
         </div>

         {step === 1 && (
            <div className="glass-panel rounded-[48px] p-10 md:p-14 animate-slideUp space-y-12">
               <div className="flex items-center gap-6 pb-12 border-b border-white/10">
                  <img 
                    src={product?.imageUrls[0] || "https://placehold.co/200x200?text=Product"} 
                    className="w-20 h-20 rounded-3xl object-cover bg-black/20 border border-white/10 p-2" 
                    alt="Pr" 
                  />
                  <div>
                     <h2 className="text-xl font-black text-white uppercase tracking-tight">{product?.name}</h2>
                     <p className="text-2xl font-black text-[#F5A623] tracking-tight">₦{product?.price.toLocaleString()}</p>
                  </div>
               </div>

               <div className="space-y-8">
                  <div className="space-y-3">
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Authorized Seller Details</p>
                     <p className="text-lg font-black text-white uppercase">{seller?.name || "Verified Scholar"}</p>
                  </div>

                  <div className="bg-black/20 p-8 rounded-[32px] border border-white/10 space-y-6 shadow-inner">
                     <div className="space-y-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Bank Institution</p>
                        <p className="text-lg font-black text-white uppercase">{seller?.bankName || "Access Bank (Hub Default)"}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Account Node Number</p>
                        <div className="flex items-center justify-between">
                           <p className="text-2xl font-black text-white tracking-tighter">{seller?.accountNumber || "0123456789"}</p>
                           <button 
                             aria-label="Copy account number"
                             onClick={() => {
                               navigator.clipboard.writeText(seller?.accountNumber || "0123456789");
                               alert("Account node copied to clipboard.");
                             }}
                             className="text-[#F5A623] hover:scale-110 transition-transform bg-[#F5A623]/10 p-3 rounded-xl border border-[#F5A623]/20"
                           >
                             <i className="fa-solid fa-copy"></i>
                           </button>
                        </div>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Beneficiary Identity</p>
                        <p className="text-md font-bold text-slate-300 uppercase">{seller?.accountName || "UI DLC SCHOLAR"}</p>
                     </div>
                  </div>

                  <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-3xl flex items-center gap-4">
                     <i className="fa-solid fa-circle-info text-blue-400"></i>
                     <p className="text-[9px] text-blue-300 font-bold uppercase tracking-widest leading-relaxed">
                       Please transmit payment using the details above, then initiate the verification protocol in the next step.
                     </p>
                  </div>
               </div>

               <button 
                  onClick={() => setStep(2)}
                  className="w-full py-6 btn-gold rounded-[24px] font-black text-[12px] tracking-widest shadow-2xl flex items-center justify-center gap-4"
               >
                  I have Transmitted Payment
                  <i className="fa-solid fa-arrow-right"></i>
               </button>
            </div>
         )}

         {step === 2 && (
            <div className="glass-panel rounded-[48px] p-10 md:p-14 animate-slideUp space-y-12 text-center">
               <div className="space-y-4">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Submit Evidence.</h2>
                  <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.3em] italic">Visual Verification Node Required</p>
               </div>

               <div className="space-y-8">
                  <label className={`w-full aspect-video rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer group ${receipt ? 'border-[#F5A623] bg-[#F5A623]/10' : 'border-white/20 bg-black/20 hover:border-white/40'}`}>
                     {receipt ? (
                        <div className="space-y-4">
                           <i className="fa-solid fa-circle-check text-4xl text-[#F5A623]"></i>
                           <p className="text-[10px] font-black text-[#F5A623] uppercase tracking-widest">{receipt.name}</p>
                           <button onClick={(e) => { e.stopPropagation(); setReceipt(null); }} className="text-[9px] font-black text-rose-300 uppercase tracking-widest border border-rose-500/30 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20">Replace Evidence</button>
                        </div>
                     ) : (
                        <>
                           <i className="fa-solid fa-cloud-arrow-up text-4xl text-slate-400 group-hover:scale-110 group-hover:text-white transition-all"></i>
                           <span className="mt-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Drop Screenshot Here</span>
                        </>
                     )}
                     <input type="file" accept="image/jpeg, image/png, image/jpg, image/webp, application/pdf" className="hidden" onChange={handleReceiptUpload} />
                  </label>

                  <div className="space-y-4 pt-12 border-t border-white/10">
                     <button 
                        onClick={submitProof}
                        disabled={!receipt || uploading}
                        className="w-full py-6 btn-gold rounded-[24px] font-black text-[12px] tracking-widest shadow-2xl flex items-center justify-center gap-4 disabled:opacity-50"
                     >
                        {uploading ? "Transmitting Node..." : "Initiate Verification Protocol"}
                        <i className="fa-solid fa-paper-plane"></i>
                     </button>
                     <button onClick={() => setStep(1)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-400 transition-colors">Abort Transaction</button>
                  </div>
               </div>
            </div>
         )}

         {step === 3 && (
            <div className="glass-panel rounded-[48px] p-10 md:p-14 animate-float space-y-12 text-center">
               <div className="w-24 h-24 bg-[#F5A623]/20 border border-[#F5A623]/50 rounded-[32px] flex items-center justify-center text-[#F5A623] text-4xl mx-auto shadow-[0_0_30px_rgba(245,166,35,0.4)]">
                  <i className="fa-solid fa-handshake"></i>
               </div>
               <div className="space-y-6">
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Protocol Initiated.</h2>
                  <p className="text-[12px] text-slate-300 font-medium leading-relaxed italic max-w-sm mx-auto">
                    Your payment verification request has been transmitted to the seller registry. The asset status will be updated upon seller confirmation.
                  </p>
               </div>
               
               <div className="pt-12 border-t border-white/10 space-y-4">
                  <button 
                     onClick={() => navigate("/")}
                     className="w-full py-6 btn-gold rounded-[24px] font-black text-[12px] tracking-widest shadow-2xl"
                  >
                     Return to Hub Central
                  </button>
                  <p className="text-[9px] text-emerald-400 font-black uppercase tracking-[0.2em] italic">Secure Hub Seal Active</p>
               </div>
            </div>
         )}

      </main>
    </div>
  );
};

export default Checkout;
