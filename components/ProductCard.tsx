import React from "react";
import { Link } from "react-router-dom";
import { Product } from "../types";

interface ProductCardProps {
  product: Product;
  onDelete?: () => Promise<void>;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onDelete }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-shadow overflow-hidden flex flex-col group relative">
      
      {/* Delete button (only if provided) */}
      {onDelete && (
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
          className="absolute top-3 right-3 z-30 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-colors shadow-sm" title="Delete Product"
        >
          <span className="sr-only">Delete Product</span>
          <i className="fa-solid fa-trash-can text-xs" aria-hidden="true"></i>
        </button>
      )}

      {/* Image Area */}
      <div className="relative aspect-[4/3] bg-slate-50 overflow-hidden">
        <img 
          src={product.imageUrls[0] || "https://placehold.co/400x400?text=Product"} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=No+Image"; }}
        />
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
           <span className="bg-[#003366] text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
             {product.category}
           </span>
           {product.isExamWeekSafe && (
             <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm w-fit">
               Exam Safe
             </span>
           )}
        </div>
      </div>

      {/* Details Area */}
      <div className="p-5 flex flex-col grow">
        <h3 className="text-[#003366] font-bold text-[15px] leading-tight line-clamp-1 group-hover:text-[#004080] transition-colors">{product.name}</h3>
        <p className="text-slate-500 text-xs mt-1 truncate">{product.learningHub || 'General Hub'}</p>
        
        <div className="mt-auto pt-4 flex items-center justify-between">
           <p className="text-lg font-black text-[#003366]">₦{product.price.toLocaleString()}</p>
           <Link 
             to={`/product/${product.$id}`} 
             className="bg-slate-100 text-[#003366] text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#003366] hover:text-white transition-colors border border-slate-200"
           >
             Details
           </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
