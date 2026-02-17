
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Product, UserProfile, SellerStatus, ProductStatus, ProductReport } from '../types';
import { getStore, saveStore, INITIAL_PROFILES, INITIAL_PRODUCTS, INITIAL_REPORTS } from '../services/mockData';
import { useAuth } from '../App';

interface ProductCardProps {
  product: Product;
  onDelete?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onDelete }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [seller, setSeller] = useState<UserProfile | null>(null);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Scam');
  const [reportDesc, setReportDesc] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (user) {
      const favorites = getStore(`favorites_${user.userId}`, []);
      setIsFavorite(favorites.includes(product.$id));
    }
    
    const allProfiles = getStore('profiles', INITIAL_PROFILES);
    const foundSeller = allProfiles.find((p: UserProfile) => p.userId === product.sellerId);
    if (foundSeller) {
      setSeller(foundSeller);
    }
  }, [user, product.$id, product.sellerId]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return alert("Please login to favorite items.");

    const favorites = getStore(`favorites_${user.userId}`, []);
    let updated;
    if (isFavorite) {
      updated = favorites.filter((id: string) => id !== product.$id);
    } else {
      updated = [...favorites, product.$id];
    }
    saveStore(`favorites_${user.userId}`, updated);
    setIsFavorite(!isFavorite);
  };

  const handleReport = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return alert("Please login to report items.");
    setShowReportModal(true);
  };

  const submitReport = () => {
    if (!user) return;
    const reports = getStore('reports', INITIAL_REPORTS);
    const newReport: ProductReport = {
      $id: Math.random().toString(36).substr(2, 9),
      productId: product.$id,
      productName: product.name,
      reporterId: user.userId,
      reporterName: user.name,
      reason: reportReason,
      description: reportDesc,
      createdAt: new Date().toISOString()
    };
    saveStore('reports', [...reports, newReport]);
    setShowReportModal(false);
    alert("Report submitted successfully. Admins will review it.");
  };

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % product.imageUrls.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + product.imageUrls.length) % product.imageUrls.length);
  };

  const handleSellerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowSellerModal(true);
  };

  const handleQuickChat = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate('/login');
    navigate(`/messages?seller=${product.sellerId}&product=${product.$id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    const allProducts = getStore('products', INITIAL_PRODUCTS);
    const filtered = allProducts.filter((p: Product) => p.$id !== product.$id);
    saveStore('products', filtered);
    setShowDeleteConfirm(false);
    if (onDelete) onDelete();
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/edit-product/${product.$id}`);
  };

  const isOwner = user?.userId === product.sellerId;
  const isExchange = product.transactionType === 'exchange' || product.transactionType === 'both';

  return (
    <>
      <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col h-full relative hover:-translate-y-1">
        {/* Image Area with Carousel */}
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer" onClick={() => navigate(`/product/${product.$id}`)}>
          <img 
            src={product.imageUrls[currentImageIndex] || 'https://placehold.co/600x400?text=No+Image'} 
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
          />
          
          {/* Carousel Arrows */}
          {product.imageUrls.length > 1 && (
            <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-all duration-300">
              <button 
                onClick={prevImage}
                className="w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-slate-800 shadow-lg hover:bg-white active:scale-90"
              >
                <i className="fa-solid fa-chevron-left text-[10px]"></i>
              </button>
              <button 
                onClick={nextImage}
                className="w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-slate-800 shadow-lg hover:bg-white active:scale-90"
              >
                <i className="fa-solid fa-chevron-right text-[10px]"></i>
              </button>
            </div>
          )}

          {/* Overlays */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <div className="px-2.5 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-400 shadow-sm border border-white/40 dark:border-slate-700/50">
              {product.category}
            </div>
            {isExchange && (
               <div className="px-2.5 py-1 bg-amber-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm border border-amber-400">
                 <i className="fa-solid fa-rotate mr-1"></i> SWAP
               </div>
            )}
            {product.isNegotiable && (
               <div className="px-2.5 py-1 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm border border-emerald-400">
                 NEGOTIABLE
               </div>
            )}
          </div>

          {/* Seller Action Buttons */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-10 translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
            <button 
              onClick={toggleFavorite}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-xl backdrop-blur-md border ${isFavorite ? 'bg-rose-500 text-white border-rose-400' : 'bg-white/90 dark:bg-slate-800/90 text-slate-400 dark:text-slate-500 hover:text-rose-500 border-white dark:border-slate-700'}`}
            >
              <i className={`${isFavorite ? 'fa-solid' : 'fa-regular'} fa-heart text-sm`}></i>
            </button>

            {!isOwner && (
              <button 
                onClick={handleReport}
                className="w-9 h-9 bg-white/90 dark:bg-slate-800/90 text-slate-400 dark:text-slate-500 rounded-xl flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 transition shadow-xl border border-white dark:border-slate-700"
                title="Report Item"
              >
                <i className="fa-solid fa-flag text-xs"></i>
              </button>
            )}

            {isOwner && (
              <>
                <button 
                  onClick={handleEdit}
                  className="w-9 h-9 bg-blue-700 text-white rounded-xl flex items-center justify-center hover:bg-blue-800 shadow-xl border border-blue-600 transition"
                  title="Edit"
                >
                  <i className="fa-solid fa-pen text-xs"></i>
                </button>
                <button 
                  onClick={handleDelete}
                  className="w-9 h-9 bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white shadow-xl border border-rose-200 dark:border-rose-900/40 transition"
                  title="Delete"
                >
                  <i className="fa-solid fa-trash text-xs"></i>
                </button>
              </>
            )}
          </div>

          {seller?.sellerStatus === SellerStatus.VERIFIED && (
            <div className="absolute bottom-3 left-3 bg-emerald-500/90 backdrop-blur text-white text-[8px] font-black px-2 py-1 rounded-lg shadow-lg flex items-center tracking-widest border border-white/20">
              <i className="fa-solid fa-circle-check mr-1.5"></i> VERIFIED
            </div>
          )}
        </div>

        {/* Product Details Area */}
        <div className="p-5 flex flex-col flex-grow">
          <div onClick={() => navigate(`/product/${product.$id}`)} className="cursor-pointer mb-auto">
            <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition leading-tight">{product.name}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed font-medium">{product.description}</p>
          </div>
          
          <div className="mt-5 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[9px] text-slate-400 font-black block leading-none mb-1 uppercase tracking-widest">
                {product.transactionType === 'exchange' ? 'Trade For' : 'Price'}
              </span>
              <span className="text-lg font-black text-slate-900 dark:text-white truncate max-w-[120px] block">
                {product.transactionType === 'exchange' ? (product.exchangeTerms || 'Trade') : `₦${product.price.toLocaleString()}`}
              </span>
            </div>
            <div className="text-right">
               <button onClick={handleSellerClick} className="text-[10px] text-blue-700 dark:text-blue-400 font-black uppercase tracking-wider block hover:underline">
                  {product.sellerName.split(' ')[0]}
               </button>
               <span className="text-[9px] text-slate-300 dark:text-slate-600 font-bold uppercase mt-1 block">{new Date(product.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {!isOwner && (
            <button 
              onClick={handleQuickChat}
              className="mt-4 w-full bg-slate-900 dark:bg-slate-800 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 dark:hover:bg-blue-600 transition flex items-center justify-center gap-2 shadow-lg shadow-slate-200 dark:shadow-none"
            >
              <i className="fa-solid fa-comments"></i>
              Quick Chat
            </button>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 max-w-sm w-full shadow-2xl space-y-6 text-center border border-slate-100 dark:border-slate-800">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto text-rose-500 mb-2">
              <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Report Item</h2>
            <div className="space-y-4 text-left">
              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Reason</label>
                <select 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold dark:text-white"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                >
                  <option value="Scam">Scam / Fraud</option>
                  <option value="Inappropriate content">Inappropriate Content</option>
                  <option value="Misleading description">Misleading Description</option>
                  <option value="Counterfeit">Counterfeit Item</option>
                  <option value="Stolen Property">Stolen Property</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Optional Details</label>
                <textarea 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500/20 dark:text-white h-24 resize-none"
                  placeholder="Tell us more..."
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={submitReport}
                className="bg-rose-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-rose-700 transition"
              >
                Submit
              </button>
              <button 
                onClick={() => setShowReportModal(false)}
                className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seller Modal */}
      {showSellerModal && seller && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 max-w-sm w-full shadow-2xl space-y-6 relative border border-slate-100 dark:border-slate-800">
            <button onClick={() => setShowSellerModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
            <div className="flex flex-col items-center text-center space-y-4">
              <img src={seller.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.name)}&background=random`} className="w-24 h-24 rounded-[32px] border-4 border-slate-50 dark:border-slate-800 shadow-xl object-cover" alt="" />
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">{seller.name}</h2>
                <p className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1">{seller.department} • {seller.level}L</p>
              </div>
              <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl">
                 <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (<i key={i} className={`fa-solid fa-star text-[10px] ${i < Math.round(seller.averageRating || 0) ? 'text-yellow-400' : 'text-slate-200 dark:text-slate-700'}`}></i>))}
                 </div>
                 <span className="text-xs font-black text-slate-900 dark:text-slate-100">{seller.averageRating?.toFixed(1) || '0.0'}</span>
              </div>
              <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                 <button onClick={() => { setShowSellerModal(false); navigate(`/messages?seller=${seller.userId}`); }} className="w-full bg-blue-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-blue-800 transition">Chat Now</button>
                 <button onClick={() => setShowSellerModal(false)} className="w-full py-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 max-w-sm w-full shadow-2xl space-y-6 text-center border border-slate-100 dark:border-slate-800">
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto text-rose-500 text-3xl mb-2">
              <i className="fa-solid fa-trash-can"></i>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Delete Listing?</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">This action cannot be undone. Are you sure you want to remove <span className="font-bold text-slate-800 dark:text-slate-200">"{product.name}"</span>?</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={confirmDelete}
                className="bg-rose-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-rose-600 transition active:scale-95"
              >
                Yes, Delete
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductCard;
