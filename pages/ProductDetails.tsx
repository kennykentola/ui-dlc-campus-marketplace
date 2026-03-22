
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Product, UserProfile, Review, DeliveryMethod, ListingType, Transaction, TransactionStatus } from "../types";
import { databases, storage } from "../lib/appwrite";
import { useAuth } from "../App";
import { Query, ID } from "appwrite";
import ProductCard from "../components/ProductCard";

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  
  // Review State
  const [canReview, setCanReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const prod = await databases.getDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          "products",
          id
        );
        setProduct(prod as unknown as Product);

        const sellerProfile = await databases.getDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          "profiles",
          prod.sellerId
        );
        setSeller(sellerProfile as unknown as UserProfile);

        const reviewsRes = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          "reviews",
          [Query.equal("productId", id)]
        );
        setReviews(reviewsRes.documents as unknown as Review[]);

        const relatedRes = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          "products",
          [Query.equal("category", prod.category), Query.notEqual("$id", id), Query.limit(4)]
        );
        setRelatedProducts(relatedRes.documents as unknown as Product[]);

        // Check Transaction for Review Eligibility
        if (user) {
           const txRes = await databases.listDocuments(
             import.meta.env.VITE_APPWRITE_DATABASE_ID,
             "transactions",
             [
               Query.equal("buyerId", user.userId),
               Query.equal("productId", id),
               Query.equal("status", TransactionStatus.COMPLETED)
             ]
           );
           setCanReview(txRes.total > 0);
        }

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  const toggleFavorite = async () => {
    if (!user || !product) return;
    const favorites = user.favorites || [];
    const isFav = favorites.includes(product.$id);
    const updated = isFav ? favorites.filter(f => f !== product.$id) : [...favorites, product.$id];
    
    try {
      await databases.updateDocument(import.meta.env.VITE_APPWRITE_DATABASE_ID, "profiles", user.userId, { favorites: updated });
      refreshUser();
    } catch (e) { alert("Favorite sync failed."); }
  };

  const handleQuickChat = () => {
    if (!user) return navigate("/login");
    navigate(`/messages?with=${seller?.userId}`);
  };

  const initiateEscrow = () => {
    if (!user) return navigate("/login");
    navigate(`/checkout/${product?.$id}`);
  };

  const postReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !product || !seller) return;
    setSubmittingReview(true);
    try {
      await databases.createDocument(import.meta.env.VITE_APPWRITE_DATABASE_ID, "reviews", ID.unique(), {
        productId: product.$id,
        sellerId: seller.userId,
        buyerId: user.userId,
        buyerName: user.name,
        rating,
        comment,
        createdAt: new Date().toISOString()
      });
      setComment("");
      alert("Review archived successfully.");
      // Refresh reviews
    } catch (e) { alert("Review transmission failed."); }
    finally { setSubmittingReview(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!product) return <div className="min-h-screen pt-40 text-center uppercase font-black text-slate-300">Asset Not Found.</div>;

  const isFavorite = user?.favorites?.includes(product.$id);

  return (
    <div className="bg-white min-h-screen pt-12 pb-40 animate-fadeIn relative">
      <div className="container mx-auto px-6 max-w-7xl">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
           {/* Asset Visual Deck */}
           <div className="space-y-10">
              <div className="relative group aspect-square bg-slate-50 border border-slate-100 rounded-[64px] overflow-hidden shadow-2xl shadow-blue-900/5">
                 <img src={product.imageUrls[activeImage]} className="w-full h-full object-contain p-10 transform group-hover:scale-105 transition-transform duration-700" alt="Asset" />
                 <button onClick={toggleFavorite} className={`absolute top-10 right-10 w-16 h-16 rounded-[24px] flex items-center justify-center transition-all shadow-xl active:scale-90 ${isFavorite ? 'bg-rose-500 text-white shadow-rose-500/30' : 'bg-white/80 backdrop-blur-md text-slate-300 hover:text-rose-500 shadow-slate-200/20'}`}>
                    <i className={`fa-solid fa-heart ${isFavorite ? 'scale-110' : ''}`}></i>
                 </button>
              </div>

              {product.imageUrls.length > 1 && (
                 <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                    {product.imageUrls.map((url, i) => (
                       <button key={i} onClick={() => setActiveImage(i)} className={`shrink-0 w-24 h-24 rounded-3xl border-4 transition-all overflow-hidden ${activeImage === i ? 'border-teal-600 shadow-lg scale-105' : 'border-slate-50 opacity-40 hover:opacity-100'}`}>
                          <img src={url} className="w-full h-full object-contain" alt="Sub" />
                       </button>
                    ))}
                 </div>
              )}

              {/* Delivery Protocol Badge Row */}
              <div className="flex flex-wrap gap-4 pt-6">
                 {product.deliveryMethods?.map(m => (
                    <div key={m} className="flex items-center gap-3 px-6 py-4 bg-slate-50 border border-slate-100 rounded-[28px] hover:bg-white hover:border-teal-600/20 transition-all group">
                       <i className={`fa-solid ${m === DeliveryMethod.MEETUP ? 'fa-people-arrows' : m === DeliveryMethod.PICKUP ? 'fa-building-columns' : m === DeliveryMethod.HOSTEL ? 'fa-bed' : 'fa-cloud-arrow-down'} text-teal-600 group-hover:scale-110 transition-transform`}></i>
                       <span className="text-[10px] font-black uppercase text-[#003366] tracking-widest leading-none">{m}</span>
                    </div>
                 ))}
              </div>
           </div>

           {/* Asset Information Terminal */}
           <div className="space-y-12">
              <div className="bg-white p-10 md:p-14 border border-slate-50 shadow-[0_48px_100px_-20px_rgba(0,51,102,0.12)] rounded-[64px] space-y-12 relative overflow-hidden">
                 <div className="space-y-8">
                    <div className="space-y-6">
                       <div className="flex items-center gap-3">
                          <span className="px-5 py-2 bg-teal-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-teal-500/20">Audited Hub</span>
                          {product.listingType && product.listingType !== ListingType.NORMAL && (
                            <span className="px-5 py-2 bg-yellow-400 text-black rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                               <i className="fa-solid fa-graduation-cap"></i> {product.listingType}
                            </span>
                          )}
                       </div>
                       <h1 className="text-5xl font-black text-[#003366] tracking-tighter uppercase leading-[0.95]">{product.name}</h1>
                       <div className="flex items-center gap-6">
                          <div className="flex gap-1 text-teal-500">
                             {[...Array(5)].map((_, i) => <i key={i} className={`fa-solid fa-star text-[10px] ${i < 4 ? 'opacity-100' : 'opacity-20'}`}></i>)}
                          </div>
                          <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest italic leading-none">Authenticity Verified</span>
                       </div>
                    </div>
                    
                    <div className="flex items-end gap-3 text-[#003366]">
                       <span className="text-2xl font-black mb-2 italic tracking-tighter opacity-30">₦</span>
                       <span className="text-7xl font-black tracking-tighter leading-none">{product.price.toLocaleString()}</span>
                    </div>

                    <div className="pt-10 border-t border-slate-50 space-y-4">
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Asset Documentation</p>
                       <p className="text-lg font-medium text-slate-600 leading-relaxed italic pr-6 group-hover:text-slate-900 transition-colors">
                          {product.description}
                       </p>
                    </div>
                 </div>

                 {/* Action Protocol Hub */}
                 <div className="space-y-5">
                    <button 
                       onClick={initiateEscrow}
                       className="w-full bg-[#003366] text-white py-8 rounded-[36px] font-black text-[14px] uppercase tracking-[0.25em] shadow-2xl shadow-blue-900/40 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-4 group"
                    >
                       Initiate Secure Escrow
                       <i className="fa-solid fa-shield-halved text-teal-500 group-hover:rotate-12 transition-transform"></i>
                    </button>
                    <div className="grid grid-cols-2 gap-5">
                       <button onClick={handleQuickChat} className="bg-slate-50 text-[#003366] py-6 rounded-[28px] font-black text-[11px] uppercase tracking-widest hover:bg-white border border-slate-100 transition-all active:scale-95 flex items-center justify-center gap-4 shadow-sm">
                          <i className="fa-solid fa-message-dots text-teal-600"></i>
                          Chat Agent
                       </button>
                       <button className="bg-slate-50 text-[#003366] py-6 rounded-[28px] font-black text-[11px] uppercase tracking-widest hover:bg-white border border-slate-100 transition-all active:scale-95 flex items-center justify-center gap-4 shadow-sm">
                          <i className="fa-solid fa-bell text-teal-600"></i>
                          Price Alert
                       </button>
                    </div>
                 </div>
              </div>

              {/* Verified Seller Node with Metrics */}
              <div className="bg-white p-10 border border-slate-50 rounded-[56px] shadow-sm space-y-10 animate-slideUp">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                       <div className="relative">
                          <img src={seller?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller?.name || "S")}&background=003366&color=fff`} className="w-24 h-24 rounded-[36px] border-4 border-slate-50 shadow-md object-cover" alt="Av" />
                          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-teal-500 rounded-2xl flex items-center justify-center text-white border-4 border-white shadow-lg">
                             <i className="fa-solid fa-check text-[12px]"></i>
                          </div>
                       </div>
                       <div>
                          <h4 className="text-2xl font-black text-[#003366] uppercase tracking-tight mb-1">{seller?.name || "Registry Associate"}</h4>
                          <p className="text-[11px] font-black text-teal-600 uppercase tracking-widest italic">{seller?.department || "Academic Auditor"}</p>
                       </div>
                    </div>
                    <Link to={`/seller/${seller?.userId}`} className="w-14 h-14 flex items-center justify-center bg-slate-50 rounded-2xl text-[#003366] hover:bg-teal-50 hover:text-teal-600 transition-all shadow-sm">
                       <i className="fa-solid fa-chevron-right text-xs"></i>
                    </Link>
                 </div>

                 <div className="grid grid-cols-3 gap-8 pt-10 border-t border-slate-50">
                    <div className="text-center">
                       <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-3">Response</p>
                       <p className="text-sm font-black text-[#003366] tracking-tight truncate">{seller?.responseTime || "Under 2h"}</p>
                    </div>
                    <div className="text-center">
                       <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-3">Completion</p>
                       <p className="text-sm font-black text-[#003366] tracking-tight">{seller?.completionRate || 98}%</p>
                    </div>
                    <div className="text-center">
                       <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-3">Reputation</p>
                       <div className="flex items-center justify-center gap-2 text-teal-500 font-black">
                          <i className="fa-solid fa-star text-[10px]"></i>
                          <span className="text-sm text-[#003366]">{seller?.averageRating || 4.9}</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Dispute Terminal Gateway */}
              <Link to="/transactions" className="px-10 py-8 bg-rose-50/20 border border-rose-100 rounded-[40px] flex items-center gap-6 group hover:bg-rose-50 transition-all">
                 <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                 </div>
                 <div className="grow">
                    <h5 className="text-[11px] font-black text-[#003366] uppercase tracking-widest">Dispute Terminal Access</h5>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Report Conflict in Archive</p>
                 </div>
                 <i className="fa-solid fa-shield-halved text-rose-200 group-hover:text-rose-500 transition-colors"></i>
              </Link>
           </div>
        </div>

        {/* Reviews Section */}
        <section className="mt-40 pt-40 border-t border-slate-100 space-y-20">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
              <div className="space-y-3 px-4">
                 <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Registry Feedback</p>
                 <h2 className="text-5xl font-black text-[#003366] uppercase tracking-tighter leading-none">Activity Feed ({reviews.length}).</h2>
              </div>
              
              {canReview && (
                 <div className="bg-slate-50 p-10 rounded-[48px] border border-slate-100 max-w-xl w-full">
                    <form onSubmit={postReview} className="space-y-6">
                       <h3 className="text-xs font-black text-[#003366] uppercase tracking-widest mb-6">Archive New Feedback</h3>
                       <div className="flex gap-4">
                          {[1,2,3,4,5].map(s => (
                             <button key={s} type="button" onClick={() => setRating(s)} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${rating >= s ? 'bg-[#003366] text-teal-400' : 'bg-white text-slate-200'}`}>
                                <i className="fa-solid fa-star"></i>
                             </button>
                          ))}
                       </div>
                       <textarea placeholder="Document your encounter with this asset..." className="w-full h-32 bg-white border border-slate-100 rounded-[28px] px-8 py-5 text-sm font-medium outline-none focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm resize-none" value={comment} onChange={e => setComment(e.target.value)} required />
                       <button className="w-full py-5 bg-[#003366] text-white rounded-[24px] font-black text-[12px] uppercase tracking-widest shadow-2xl shadow-blue-900/10 hover:brightness-110 active:scale-95 transition-all">Transmit Feedback</button>
                    </form>
                 </div>
              )}
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
              {reviews.map(r => (
                 <div key={r.$id} className="bg-white border border-slate-50 p-10 rounded-[48px] shadow-sm space-y-6 flex flex-col hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between">
                       <div className="flex gap-1 text-teal-500">
                          {[...Array(5)].map((_, i) => <i key={i} className={`fa-solid fa-star text-[9px] ${i < r.rating ? 'opacity-100' : 'opacity-10'}`}></i>)}
                       </div>
                       <span className="text-[9px] font-black text-slate-200 uppercase tracking-widest italic">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-700 leading-relaxed italic grow">"{r.comment}"</p>
                    <div className="pt-6 border-t border-slate-50 flex items-center gap-4">
                       <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[#003366] text-[10px] font-black">
                          {r.buyerName.charAt(0)}
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-[#003366] uppercase tracking-tighter leading-none">{r.buyerName}</p>
                          <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1">Scholarly Buyer</p>
                       </div>
                    </div>
                 </div>
              ))}
              {reviews.length === 0 && !canReview && <div className="col-span-full py-20 text-center uppercase font-black text-slate-200 text-xs tracking-[0.4em]">Registry is empty of feedback.</div>}
           </div>
        </section>

        {relatedProducts.length > 0 && (
           <section className="space-y-12 pt-40 border-t border-slate-100">
              <div className="px-4">
                 <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-3">Registry Expansion</p>
                 <h2 className="text-4xl font-black text-[#003366] uppercase tracking-tighter leading-none">Hub Recommendations.</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
                 {relatedProducts.map(p => <ProductCard key={p.$id} product={p} />)}
              </div>
           </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
