import React from "react";
import { Link } from "react-router-dom";
import { Product } from "../types";

interface ProductCardProps {
  product: Product;
  onDelete?: () => Promise<void>;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onDelete }) => {
  return (
    <div className="glass-panel overflow-hidden flex flex-col group relative rounded-[28px] hover:-translate-y-1 transition-all duration-300">
      
      {/* Delete button (only if provided) */}
      {onDelete && (
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
          className="absolute top-3 right-3 z-30 w-8 h-8 bg-rose-500/20 backdrop-blur-md rounded-full flex items-center justify-center text-rose-300 hover:bg-rose-500 hover:text-white transition-colors border border-rose-500/30" title="Delete Product"
        >
          <span className="sr-only">Delete Product</span>
          <i className="fa-solid fa-trash-can text-xs" aria-hidden="true"></i>
        </button>
      )}

      {/* Image Area */}
      <div className="relative aspect-[4/3] bg-black/20 overflow-hidden">
        <img 
          src={product.imageUrls[0] || "https://placehold.co/400x400?text=Product"} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=No+Image"; }}
        />
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
           <span className="bg-[#003366]/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded border border-white/10 shadow-sm">
             {product.category}
           </span>
           {product.isExamWeekSafe && (
             <span className="bg-amber-500/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded border border-amber-300/30 shadow-sm w-fit">
               Exam Safe
             </span>
           )}
        </div>
      </div>

      {/* Details Area */}
      <div className="p-5 flex flex-col grow">
        <h3 className="text-white font-bold text-[15px] leading-tight line-clamp-1 group-hover:text-[#F5A623] transition-colors">{product.name}</h3>
        <p className="text-slate-300 text-xs mt-1 truncate">{product.learningHub || 'General Hub'}</p>
        
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/10 mt-4">
           <p className="text-lg font-black text-[#F5A623]">₦{product.price.toLocaleString()}</p>
           <Link 
             to={`/product/${product.$id}`} 
             className="bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/20 text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#F5A623] hover:text-[#003366] transition-colors"
           >
             Details
           </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
