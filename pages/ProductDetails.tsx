
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
        const prodRes = await databases.getDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          "products",
          id
        );
        const prod = prodRes as unknown as Product;
        setProduct(prod);

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
    window.scrollTo(0, 0);
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
      
      // Real-time Update Registry
      const updatedRes = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID, 
        "reviews", 
        [Query.equal("productId", product.$id)]
      );
      setReviews(updatedRes.documents as unknown as Review[]);
    } catch (e) { alert("Review transmission failed."); }
    finally { setSubmittingReview(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!product) return <div className="min-h-screen pt-40 text-center uppercase font-black text-slate-300">Asset Not Found.</div>;

  const isFavorite = user?.favorites?.includes(product.$id);

  return (
    <>
      <div className="bg-slate-50/30 min-h-screen pt-12 pb-40 animate-fadeIn relative dark:bg-slate-950">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
            {/* Left Column: Visuals & Actions */}
            <div className="space-y-6">
              <div className="aspect-4/3 rounded-[32px] overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 relative group shadow-inner">
                <img
                  alt={product.name}
                  className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                  src={product.imageUrls[activeImage] || "https://placehold.co/800x600?text=Product+Registry+Asset"}
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/800x600?text=Asset+Identification+Required"; }}
                />
                <div className="absolute top-6 right-6 flex flex-col gap-3">
                  <button
                    onClick={toggleFavorite}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-2xl active:scale-90 border-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur ${isFavorite ? 'text-rose-500 border-rose-100' : 'text-slate-400 dark:text-slate-500 border-white dark:border-slate-700'} hover:text-rose-500`}
                  >
                    <i className={`${isFavorite ? 'fa-solid' : 'fa-regular'} fa-heart text-2xl`}></i>
                  </button>
                  <button className="w-14 h-14 bg-white/90 dark:bg-slate-800/90 backdrop-blur text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center transition-all shadow-2xl hover:text-blue-600 dark:hover:text-blue-400 border-2 border-white dark:border-slate-700 active:scale-90">
                    <i className="fa-solid fa-share-nodes text-2xl"></i>
                  </button>
                  <button className="w-14 h-14 bg-white/90 dark:bg-slate-800/90 backdrop-blur text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center transition-all shadow-2xl hover:text-rose-600 border-2 border-white dark:border-slate-700 active:scale-90">
                    <i className="fa-solid fa-flag text-2xl"></i>
                  </button>
                </div>

                {product.imageUrls.length > 1 && (
                  <div className="absolute bottom-6 left-6 right-6 flex gap-2 overflow-x-auto no-scrollbar py-2">
                    {product.imageUrls.map((url, i) => (
                      <button key={i} onClick={() => setActiveImage(i)} className={`shrink-0 w-16 h-12 rounded-xl border-2 transition-all overflow-hidden ${activeImage === i ? 'border-blue-600 scale-105 shadow-lg' : 'border-white/50 opacity-60'}`}>
                        <img src={url} className="w-full h-full object-cover" alt="Thumb" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleQuickChat}
                className="w-full bg-blue-700 text-white py-6 rounded-[28px] font-black text-xl shadow-2xl shadow-blue-200 dark:shadow-none hover:bg-blue-800 transition transform active:scale-[0.98] flex items-center justify-center gap-4"
              >
                <i className="fa-solid fa-comments text-2xl"></i>
                CONTACT SELLER NOW
              </button>

              <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30 shadow-sm">
                <h4 className="text-[10px] font-black text-blue-800 dark:text-blue-400 uppercase tracking-[0.2em] mb-4 flex items-center">
                  <i className="fa-solid fa-shield-halved mr-2 text-sm"></i> UI Safety Protocols
                </h4>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-3 font-medium">
                  <li className="flex items-start">
                    <span className="text-blue-500 font-black mr-2">01</span> Meet at the DLC Office or Faculty area during daylight.
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 font-black mr-2">02</span> Inspect the item thoroughly before any payment.
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 font-black mr-2">03</span> Report any suspicious activity to the Admin Panel.
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column: Metadata & Seller */}
            <div className="flex flex-col">
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-4 flex-wrap gap-y-2">
                  <span className="inline-block px-4 py-1.5 bg-blue-700 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg shadow-blue-100">
                    {product.category}
                  </span>
                  <span className={`px-4 py-1.5 ${product.isNegotiable ? 'bg-emerald-500' : 'bg-slate-400'} text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg ${product.isNegotiable ? 'shadow-emerald-100' : ''}`}>
                    {product.isNegotiable ? 'NEGOTIABLE' : 'FIXED PRICE'}
                  </span>
                  {product.listingType && product.listingType !== ListingType.NORMAL && (
                    <span className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg">
                      {product.listingType}
                    </span>
                  )}
                </div>
                <h1 className="text-5xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight capitalize">
                  {product.name}
                </h1>
                <div className="mt-8 flex flex-col gap-5">
                  <div className="flex flex-col">
                    <p className="text-5xl font-black text-blue-800 dark:text-blue-400 tracking-tighter">
                      ₦{product.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="py-8 border-y border-slate-100 dark:border-slate-800 mb-8">
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-4">Item Details</h3>
                <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed whitespace-pre-line font-medium">
                  {product.description}
                </p>

                {product.exchangeTerms && (
                  <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                    <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-2">Exchange Protocol</p>
                    <p className="text-xs font-bold text-slate-700 italic">"{product.exchangeTerms}"</p>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 rounded-[32px] p-8 border border-slate-100 dark:border-slate-700 space-y-8 shadow-sm">
                <div className="flex items-center justify-between">
                  <Link to={`/seller/${product.$id}`} className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
                    <img
                      className="w-16 h-16 rounded-2xl border-4 border-white dark:border-slate-900 shadow-xl object-cover"
                      alt="Seller"
                      src={seller?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller?.name || "S")}&background=003366&color=fff`}
                    />
                    <div>
                      <div className="flex items-center space-x-3">
                        <p className="font-black text-slate-900 dark:text-white text-xl leading-none">{seller?.name || "Registry Associate"}</p>
                        <div className="bg-emerald-500 text-white text-[8px] font-black px-2.5 py-1 rounded-full flex items-center animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                          <i className="fa-solid fa-circle-check mr-1.5"></i> VERIFIED SELLER
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 mt-3 bg-white dark:bg-slate-700 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-600 shadow-sm w-fit">
                        <div className="flex text-yellow-400 gap-0.5">
                          {[...Array(5)].map((_, i) => {
                            const avg = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 5;
                            return <i key={i} className={`fa-solid fa-star text-[10px] ${i < Math.round(avg) ? 'text-yellow-400' : 'text-slate-200 dark:text-slate-800'}`}></i>;
                          })}
                        </div>
                        <span className="text-slate-900 dark:text-white font-black text-xs">
                          {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "5.0"}
                        </span>
                        <span className="text-slate-400 dark:text-slate-500 font-black text-[9px] uppercase tracking-widest">({reviews.length} reviews)</span>
                      </div>
                    </div>
                  </Link>
                </div>


                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
                  <div className="space-y-1.5">
                    <h4 className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Department</h4>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-300">{seller?.department || "Academic Auditor"}</p>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Logistics Hub</h4>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-300">
                      {product.deliveryMethods && product.deliveryMethods.length > 0 ? product.deliveryMethods[0] : "Campus Pickup"}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={initiateEscrow}
                    className="flex-1 bg-blue-700 text-white py-5 rounded-2xl font-black text-sm shadow-xl shadow-blue-100 dark:shadow-none hover:bg-blue-800 transition active:scale-[0.98]"
                  >
                    Reserve Now
                  </button>
                  <button
                    onClick={handleQuickChat}
                    className="flex-1 bg-slate-900 dark:bg-slate-700 text-white py-5 rounded-2xl font-black text-sm hover:bg-black dark:hover:bg-slate-600 transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl shadow-slate-100 dark:shadow-none"
                  >
                    <i className="fa-solid fa-comments text-base"></i>Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <section className="mt-40 pt-40 container mx-auto px-6 max-w-7xl border-t border-slate-100 space-y-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
            <div className="space-y-3 px-4">
              <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Registry Feedback</p>
              <h2 className="text-5xl font-black text-[#003366] dark:text-white uppercase tracking-tighter leading-none">Activity Feed ({reviews.length}).</h2>
            </div>

            {canReview && (
              <div className="bg-slate-50 dark:bg-slate-800 p-10 rounded-[48px] border border-slate-100 dark:border-slate-700 max-w-xl w-full">
                <form onSubmit={postReview} className="space-y-6">
                  <h3 className="text-xs font-black text-[#003366] dark:text-white uppercase tracking-widest mb-6">Archive New Feedback</h3>
                  <div className="flex gap-4">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button key={s} type="button" onClick={() => setRating(s)} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${rating >= s ? 'bg-[#003366] text-teal-400' : 'bg-white dark:bg-slate-700 text-slate-200'}`}>
                        <i className="fa-solid fa-star"></i>
                      </button>
                    ))}
                  </div>
                  <textarea placeholder="Document your encounter with this asset..." className="w-full h-32 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[28px] px-8 py-5 text-sm font-medium outline-none focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm resize-none" value={comment} onChange={e => setComment(e.target.value)} required />
                  <button className="w-full py-5 bg-[#003366] text-white rounded-[24px] font-black text-[12px] uppercase tracking-widest shadow-2xl shadow-blue-900/10 hover:brightness-110 active:scale-95 transition-all">Transmit Feedback</button>
                </form>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
            {reviews.map(r => (
              <div key={r.$id} className="bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 p-10 rounded-[48px] shadow-sm space-y-6 flex flex-col hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 text-teal-500">
                    {[...Array(5)].map((_, i) => <i key={i} className={`fa-solid fa-star text-[9px] ${i < r.rating ? 'opacity-100' : 'opacity-10'}`}></i>)}
                  </div>
                  <span className="text-[9px] font-black text-slate-200 dark:text-slate-700 uppercase tracking-widest italic">{new Date(r.createdAt || "").toLocaleDateString()}</span>
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic grow">"{r.comment}"</p>
                <div className="pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[#003366] dark:text-teal-400 text-[10px] font-black">
                    {r.buyerName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[#003366] dark:text-white uppercase tracking-tighter leading-none">{r.buyerName}</p>
                    <p className="text-[8px] font-bold text-slate-300 dark:text-slate-500 uppercase tracking-widest mt-1">Scholarly Buyer</p>
                  </div>
                </div>
              </div>
            ))}
            {reviews.length === 0 && (
              <div className="col-span-full py-32 rounded-[56px] border-2 border-dashed border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 flex flex-col items-center justify-center text-center space-y-6 animate-pulse">
                <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-200 dark:text-slate-700 shadow-sm">
                  <i className="fa-solid fa-star-half-stroke text-3xl"></i>
                </div>
                <div className="space-y-2">
                  <p className="text-[12px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.4em]">Registry is empty of feedback.</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium max-w-xs mx-auto">
                    Scholarly encounters for this asset have not yet been archived. {canReview ? "Be the first to transmit your protocol feedback." : "Complete a transaction to authorize your feedback node."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {relatedProducts.length > 0 && (
          <section className="space-y-12 pt-40 container mx-auto px-6 max-w-7xl border-t border-slate-100 dark:border-slate-800">
            <div className="px-4">
              <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-3">Registry Expansion</p>
              <h2 className="text-4xl font-black text-[#003366] dark:text-white uppercase tracking-tighter leading-none">Hub Recommendations.</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
              {relatedProducts.map(p => <ProductCard key={p.$id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </>
  );
};

export default ProductDetails;
