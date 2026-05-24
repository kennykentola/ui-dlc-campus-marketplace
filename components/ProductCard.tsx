
import React from "react";
import { Link } from "react-router-dom";
import { Product } from "../types";

interface ProductCardProps {
  product: Product;
  onDelete?: () => Promise<void>;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onDelete }) => {
  // Traditional Star Rating Logic (Simulated for demo)
  const rating = 4;

  return (
    <div className="shop-card flex flex-col group relative animate-fadeIn bg-white shadow-sm hover:shadow-2xl transition-all duration-500 rounded-xl overflow-hidden">
      {/* DLC Metadata Nodes */}
      <div className="absolute top-4 left-4 z-30 flex flex-wrap gap-2 max-w-[calc(100%-100px)]">
         {product.learningHub && (
           <span className="bg-white/90 backdrop-blur-sm dark:bg-slate-900/90 border border-slate-100 dark:border-slate-800 rounded-lg px-3 py-1.5 text-[8px] font-black text-brand-primary dark:text-indigo-500 uppercase tracking-widest shadow-sm flex items-center gap-1.5">
              <i className="fa-solid fa-location-dot"></i>
              {product.learningHub.split(' ')[0]}
           </span>
         )}
         {product.isExamWeekSafe && (
           <span className="bg-brand-surface0 text-white rounded-lg px-3 py-1.5 text-[8px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 flex items-center gap-1.5">
              <i className="fa-solid fa-calendar-check"></i>
              Exam Ready
           </span>
         )}
         {product.isSharedLogistics && (
           <span className="bg-amber-500 text-white rounded-lg px-3 py-1.5 text-[8px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 flex items-center gap-1.5">
              <i className="fa-solid fa-truck-fast"></i>
              Shared
           </span>
         )}
      </div>

      {/* Portfolio Tool Hub - Favorite & Rapid Contact */}
      <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
         {onDelete ? (
           <button 
             onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
             className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white hover:shadow-lg transition-all active:scale-95 shadow-sm border border-slate-50"
           >
              <i className="fa-solid fa-trash-can"></i>
           </button>
         ) : (
           <>
             <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 hover:shadow-lg transition-all active:scale-90 shadow-sm border border-slate-50">
                <i className="fa-regular fa-heart"></i>
             </button>
             <Link 
                onClick={(e) => e.stopPropagation()}
                to={`/messages?with=${product.sellerId}&product=${product.$id}`}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-300 hover:text-brand-primary hover:shadow-lg transition-all active:scale-90 shadow-sm border border-slate-50"
             >
                <i className="fa-solid fa-comments"></i>
             </Link>
           </>
         )}
      </div>

      {/* Primary Navigation Layer */}
      <Link 
        to={`/product/${product.$id}`}
        className="flex flex-col grow p-6"
      >
        {/* Product Image Node */}
        <div className="relative aspect-square overflow-hidden mb-8 bg-white flex items-center justify-center">
          <img 
            src={product.imageUrls[0] || "https://placehold.co/400x400?text=Product+Preview"} 
            alt={product.name} 
            className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-1000 p-2"
            onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=Registry+Asset"; }}
          />
        </div>

        {/* Structured Shopio Detail Section */}
        <div className="text-center space-y-4 flex flex-col grow">
          <div className="space-y-2">
             <h3 className="text-sm font-black text-brand-ink group-hover:text-brand-primary transition-colors uppercase tracking-tight leading-tight line-clamp-1">{product.name}</h3>
             <p className="text-[11px] text-slate-400 font-medium italic leading-relaxed line-clamp-2 max-w-[200px] mx-auto">{product.category}</p>
          </div>

          <div className="mt-auto pt-6 flex flex-col gap-4 border-t border-slate-50">
             <div className="flex items-center justify-between">
                {/* Star Rating Node */}
                <div className="flex gap-1">
                   {[...Array(5)].map((_, i) => (
                     <i key={i} className={`fa-solid fa-star text-[9px] ${i < rating ? "text-orange-400" : "text-slate-100"}`}></i>
                   ))}
                </div>
                
                {/* Price Focal Node */}
                <div className="flex flex-col items-end">
                   <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1 italic">Exchange Value</span>
                   <p className="text-lg font-black text-brand-ink tracking-tighter shrink-0">₦{product.price.toLocaleString()}</p>
                </div>
             </div>
          </div>
        </div>
      </Link>

      {/* Secondary Action: Seller Details Node (OUTSIDE primary Link to avoid nesting) */}
      <div className="px-6 pb-6">
        <Link
          to={`/seller/${product.$id}`}
          className="block w-full py-3 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 text-center shadow-xl shadow-slate-900/10 hover:bg-brand-primary"
        >
            View Seller Details
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
