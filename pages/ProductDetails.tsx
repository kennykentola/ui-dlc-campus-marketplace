import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Product,
  UserProfile,
  Review,
  ProductStatus,
  SellerStatus,
  ProductReport,
} from "../types";
import { databases } from "../lib/appwrite";
import { Query, ID } from "appwrite";
import { useAuth } from "../App";

import ProductCard from "../components/ProductCard";

const ProductDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("Scam");
  const [reportDesc, setReportDesc] = useState("");

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const loadProductData = async () => {
      if (!id) return;

      try {
        // Load product from Appwrite
        const productDoc = await databases.getDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID,
          id,
        );
        const foundProduct = productDoc as unknown as Product;
        setProduct(foundProduct);

        // Load seller profile
        const sellerDoc = await databases.getDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID,
          foundProduct.sellerId,
        );
        setSeller(sellerDoc as unknown as UserProfile);

        // Load reviews for this product
        const reviewsResponse = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_REVIEWS_COLLECTION_ID,
          [Query.equal("productId", id)],
        );
        setReviews(reviewsResponse.documents as unknown as Review[]);

        // For now, favorites are not implemented in database - skip
        setIsFavorite(false);

        // Find related products (same category or same seller, excluding current)
        const relatedResponse = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID,
          [
            Query.equal("status", ProductStatus.APPROVED),
            Query.notEqual("$id", id),
            Query.or([
              Query.equal("category", foundProduct.category),
              Query.equal("sellerId", foundProduct.sellerId),
            ]),
          ],
        );
        setRelatedProducts(
          relatedResponse.documents.slice(0, 4) as unknown as Product[],
        );
      } catch (error) {
        console.error("Error loading product data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProductData();
    window.scrollTo(0, 0); // Scroll to top on product change
  }, [id, user]);

  const toggleFavorite = () => {
    // Favorites not implemented in database yet - just show message
    alert("Favorites feature coming soon!");
  };

  const handleReport = () => {
    if (!user) return alert("Please login to report items.");
    setShowReportModal(true);
  };

  const submitReport = async () => {
    if (!user || !product) return;

    try {
      await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_REPORTS_COLLECTION_ID,
        ID.unique(),
        {
          productId: product.$id,
          productName: product.name,
          reporterId: user.userId,
          reporterName: user.name,
          reason: reportReason,
          description: reportDesc,
          createdAt: new Date().toISOString(),
        },
      );
      setShowReportModal(false);
      alert("Report submitted successfully.");
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Failed to submit report. Please try again.");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleBuyItem = async () => {
    if (!user || !product) return navigate("/login");
    const actionText =
      product.transactionType === "exchange"
        ? "propose an exchange"
        : "reserve this item";
    if (
      window.confirm(
        `Simulate reservation? Marking this item as SOLD will allow you to ${actionText}.`,
      )
    ) {
      try {
        await databases.updateDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID,
          product.$id,
          {
            status: ProductStatus.SOLD,
            buyerId: user.userId,
            updatedAt: new Date().toISOString(),
          },
        );
        setProduct({
          ...product,
          status: ProductStatus.SOLD,
          buyerId: user.userId,
        });
        alert("Success! You can now review the seller.");

        // Note: Email functionality would need to be implemented separately
        // For now, we'll skip the email sending
      } catch (error) {
        console.error("Error updating product status:", error);
        alert("Failed to reserve item. Please try again.");
      }
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !product || !seller) return;
    setIsSubmittingReview(true);

    try {
      const newReview = {
        productId: product.$id,
        productName: product.name,
        sellerId: product.sellerId,
        buyerId: user.userId,
        buyerName: user.name,
        rating,
        comment,
        createdAt: new Date().toISOString(),
      };

      await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_REVIEWS_COLLECTION_ID,
        ID.unique(),
        newReview,
      );

      setReviews((prev) => [newReview as Review, ...prev]);
      setComment("");
      setIsSubmittingReview(false);
      alert("Review submitted successfully!");
    } catch (error) {
      console.error("Error submitting review:", error);
      setIsSubmittingReview(false);
      alert("Failed to submit review. Please try again.");
    }
  };

  if (loading)
    return (
      <div className="text-center py-20 font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
        Loading Market Details...
      </div>
    );
  if (!product)
    return (
      <div className="text-center py-20 font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
        Product Not Found
      </div>
    );

  const isOwner = user?.userId === product.sellerId;
  const isExchange =
    product.transactionType === "exchange" ||
    product.transactionType === "both";
  const hasPurchased = product.buyerId === user?.userId;
  const userHasReviewed = reviews.some((r) => r.buyerId === user?.userId);

  const handleQuickChat = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    navigate(`/messages?seller=${product.sellerId}&product=${product.$id}`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fadeIn pb-20">
      <nav className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
        <Link to="/" className="hover:text-blue-700 font-medium">
          Home
        </Link>
        <i className="fa-solid fa-chevron-right text-[10px]"></i>
        <Link
          to={`/?category=${product.category}`}
          className="hover:text-blue-700 font-medium"
        >
          {product.category}
        </Link>
        <i className="fa-solid fa-chevron-right text-[10px]"></i>
        <span className="text-slate-900 dark:text-white font-black line-clamp-1">
          {product.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
        <div className="space-y-6">
          <div className="aspect-4/3 rounded-4xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 relative group shadow-inner">
            <img
              src={
                product.imageUrls[activeImageIndex] ||
                "https://placehold.co/600x400?text=No+Image"
              }
              alt={product.name}
              className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
            />

            <div className="absolute top-6 right-6 flex flex-col gap-3">
              <button
                onClick={toggleFavorite}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-2xl active:scale-90 border-2 ${isFavorite ? "bg-rose-500 text-white border-rose-400" : "bg-white/90 dark:bg-slate-800/90 backdrop-blur text-slate-400 dark:text-slate-500 hover:text-rose-500 border-white dark:border-slate-700"}`}
              >
                <i
                  className={`${isFavorite ? "fa-solid" : "fa-regular"} fa-heart text-2xl`}
                ></i>
              </button>
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="w-14 h-14 bg-white/90 dark:bg-slate-800/90 backdrop-blur text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center transition-all shadow-2xl hover:text-blue-600 dark:hover:text-blue-400 border-2 border-white dark:border-slate-700 active:scale-90"
              >
                <i className="fa-solid fa-share-nodes text-2xl"></i>
              </button>
              {!isOwner && (
                <button
                  onClick={handleReport}
                  className="w-14 h-14 bg-white/90 dark:bg-slate-800/90 backdrop-blur text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center transition-all shadow-2xl hover:text-rose-600 border-2 border-white dark:border-slate-700 active:scale-90"
                >
                  <i className="fa-solid fa-flag text-2xl"></i>
                </button>
              )}
            </div>

            {product.imageUrls.length > 1 && (
              <div className="absolute bottom-6 right-6 flex space-x-3">
                <button
                  onClick={() =>
                    setActiveImageIndex((prev) =>
                      prev > 0 ? prev - 1 : product.imageUrls.length - 1,
                    )
                  }
                  className="w-12 h-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-2xl shadow-xl flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 active:scale-90 transition border border-white/50 dark:border-slate-700/50"
                >
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                <button
                  onClick={() =>
                    setActiveImageIndex((prev) =>
                      prev < product.imageUrls.length - 1 ? prev + 1 : 0,
                    )
                  }
                  className="w-12 h-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-2xl shadow-xl flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 active:scale-90 transition border border-white/50 dark:border-slate-700/50"
                >
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            )}
          </div>

          {product.imageUrls.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-2">
              {product.imageUrls.map((url, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImageIndex(index)}
                  className={`shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-4 transition-all ${activeImageIndex === index ? "border-blue-700 scale-105 shadow-xl" : "border-white dark:border-slate-800 hover:border-blue-100 shadow-sm"}`}
                >
                  <img
                    src={url}
                    className="w-full h-full object-cover"
                    alt={`Thumb ${index + 1}`}
                  />
                </button>
              ))}
            </div>
          )}

          {!isOwner && product.status === ProductStatus.APPROVED && (
            <button
              onClick={handleQuickChat}
              className="w-full bg-blue-700 text-white py-6 rounded-[28px] font-black text-xl shadow-2xl shadow-blue-200 dark:shadow-none hover:bg-blue-800 transition transform active:scale-[0.98] flex items-center justify-center gap-4"
            >
              <i className="fa-solid fa-comments text-2xl"></i>
              CONTACT SELLER NOW
            </button>
          )}

          <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30 shadow-sm">
            <h4 className="text-[10px] font-black text-blue-800 dark:text-blue-400 uppercase tracking-[0.2em] mb-4 flex items-center">
              <i className="fa-solid fa-shield-halved mr-2 text-sm"></i> UI
              Safety Protocols
            </h4>
            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-3 font-medium">
              <li className="flex items-start">
                <span className="text-blue-500 font-black mr-2">01</span> Meet
                at the DLC Office or Faculty area during daylight.
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 font-black mr-2">02</span>{" "}
                Inspect the item thoroughly before any payment.
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 font-black mr-2">03</span> Report
                any suspicious activity to the Admin Panel.
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4 flex-wrap gap-y-2">
              <span className="inline-block px-4 py-1.5 bg-blue-700 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg shadow-blue-100">
                {product.category}
              </span>
              {isExchange && (
                <span className="px-4 py-1.5 bg-amber-500 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg shadow-amber-100">
                  SWAP READY
                </span>
              )}
              {product.isNegotiable && (
                <span className="px-4 py-1.5 bg-emerald-500 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg shadow-emerald-100">
                  NEGOTIABLE
                </span>
              )}
              {product.status !== ProductStatus.APPROVED && (
                <span
                  className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${product.status === ProductStatus.SOLD ? "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400" : "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 shadow-lg shadow-amber-50"}`}
                >
                  {product.status}
                </span>
              )}
            </div>
            <h1 className="text-5xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight">
              {product.name}
            </h1>

            <div className="mt-8 flex flex-col gap-5">
              {(product.transactionType !== "exchange" ||
                product.buyNowPrice) && (
                <div className="flex flex-col">
                  {product.buyNowPrice &&
                    product.transactionType === "exchange" && (
                      <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">
                        Buy Now Price
                      </span>
                    )}
                  <p className="text-5xl font-black text-blue-800 dark:text-blue-400 tracking-tighter">
                    ₦{(product.buyNowPrice || product.price).toLocaleString()}
                  </p>
                </div>
              )}
              {isExchange && (
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-6 rounded-[28px] shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em] block">
                      Exchange Preference
                    </span>
                    {product.buyNowPrice && (
                      <span className="text-[9px] font-black bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-lg uppercase">
                        Cash Option Active
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-black text-amber-900 dark:text-amber-200 leading-tight">
                    <i className="fa-solid fa-arrows-rotate mr-3"></i>{" "}
                    {product.exchangeTerms || "Willing to trade for items"}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="py-8 border-y border-slate-100 dark:border-slate-800 mb-8">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-4">
              Item Details
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed whitespace-pre-line font-medium">
              {product.description}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-4xl p-8 border border-slate-100 dark:border-slate-700 space-y-8 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={
                    seller?.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(seller?.name || "Seller")}&background=random`
                  }
                  className="w-16 h-16 rounded-2xl border-4 border-white dark:border-slate-900 shadow-xl object-cover"
                  alt="Seller"
                />
                <div>
                  <div className="flex items-center space-x-3">
                    <p className="font-black text-slate-900 dark:text-white text-xl leading-none">
                      {seller?.name || "Anonymous"}
                    </p>
                    {seller?.sellerStatus === SellerStatus.VERIFIED && (
                      <div className="bg-emerald-500 text-white text-[8px] font-black px-2.5 py-1 rounded-full flex items-center animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                        <i className="fa-solid fa-circle-check mr-1.5"></i>{" "}
                        VERIFIED SELLER
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 mt-3 bg-white dark:bg-slate-700 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-600 shadow-sm w-fit">
                    <div className="flex text-yellow-400 gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <i
                          key={i}
                          className={`fa-solid fa-star text-[10px] ${i < Math.round(seller?.averageRating || 0) ? "text-yellow-400" : "text-slate-200 dark:text-slate-800"}`}
                        ></i>
                      ))}
                    </div>
                    <span className="text-slate-900 dark:text-white font-black text-xs">
                      {seller?.averageRating?.toFixed(1) || "0.0"}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 font-black text-[9px] uppercase tracking-widest">
                      ({seller?.totalReviews || 0} reviews)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
              <div className="space-y-1.5">
                <h4 className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                  Department
                </h4>
                <p className="text-xs font-black text-slate-800 dark:text-slate-300">
                  {seller?.department || "DLC Student"}
                </p>
              </div>
              <div className="space-y-1.5">
                <h4 className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                  Payment Methods
                </h4>
                <p className="text-xs font-black text-slate-800 dark:text-slate-300">
                  {product.transactionType === "exchange" &&
                  !product.buyNowPrice
                    ? "Trade Only"
                    : "Cash/Transfer/Swap"}
                </p>
              </div>
            </div>

            {!isOwner && product.status === ProductStatus.APPROVED && (
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={handleBuyItem}
                  className="flex-1 bg-blue-700 text-white py-5 rounded-2xl font-black text-sm shadow-xl shadow-blue-100 dark:shadow-none hover:bg-blue-800 transition active:scale-[0.98]"
                >
                  {product.buyNowPrice
                    ? "Buy Now"
                    : product.transactionType === "exchange"
                      ? "Propose Swap"
                      : "Reserve Now"}
                </button>
                <button
                  onClick={handleQuickChat}
                  className="flex-1 bg-slate-900 dark:bg-slate-700 text-white py-5 rounded-2xl font-black text-sm hover:bg-black dark:hover:bg-slate-600 transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl shadow-slate-100 dark:shadow-none"
                >
                  <i className="fa-solid fa-comments text-base"></i>
                  Message
                </button>
              </div>
            )}

            {product.status === ProductStatus.SOLD && (
              <div className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 py-5 rounded-2xl font-black text-center text-[10px] uppercase tracking-[0.3em] shadow-inner">
                LISTING UNAVAILABLE
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-210 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-4xl p-8 max-w-sm w-full shadow-2xl space-y-6 text-center border border-slate-100 dark:border-slate-800">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto text-rose-500 mb-2">
              <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Report Item
            </h2>
            <div className="space-y-4 text-left">
              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                  Reason
                </label>
                <select
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-700/20"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                >
                  <option value="Scam">Scam / Fraud</option>
                  <option value="Inappropriate content">
                    Inappropriate Content
                  </option>
                  <option value="Misleading description">
                    Misleading Description
                  </option>
                  <option value="Counterfeit">Counterfeit Item</option>
                  <option value="Stolen Property">Stolen Property</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                  Optional Details
                </label>
                <textarea
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500/20 dark:text-white h-24 resize-none focus:outline-none"
                  placeholder="Tell us more about the issue..."
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

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="pt-20 border-t border-slate-100 dark:border-slate-800 animate-fadeIn">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              You might also like
            </h2>
            <Link
              to={`/?category=${product.category}`}
              className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest hover:underline"
            >
              View More in {product.category}
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {relatedProducts.map((p) => (
              <div key={p.$id} className="h-full">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[48px] overflow-hidden shadow-2xl animate-bounceIn border border-white/20 dark:border-slate-800">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] text-[10px]">
                Spread the Word
              </h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="w-10 h-10 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center justify-center"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            <div className="p-10 grid grid-cols-4 gap-6 text-center">
              <button className="flex flex-col items-center gap-3 group">
                <div className="w-14 h-14 bg-[#25D366] text-white rounded-2xl flex items-center justify-center text-2xl shadow-xl group-hover:scale-110 transition active:scale-95">
                  <i className="fa-brands fa-whatsapp"></i>
                </div>
                <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  WhatsApp
                </span>
              </button>
              <button className="flex flex-col items-center gap-3 group">
                <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center text-2xl shadow-xl group-hover:scale-110 transition active:scale-95">
                  <i className="fa-brands fa-x-twitter"></i>
                </div>
                <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  X / Twt
                </span>
              </button>
              <button className="flex flex-col items-center gap-3 group">
                <div className="w-14 h-14 bg-[#1877F2] text-white rounded-2xl flex items-center justify-center text-2xl shadow-xl group-hover:scale-110 transition active:scale-95">
                  <i className="fa-brands fa-facebook-f"></i>
                </div>
                <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  F-Book
                </span>
              </button>
              <button
                onClick={handleCopyLink}
                className="flex flex-col items-center gap-3 group"
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-xl group-hover:scale-110 transition active:scale-95 ${copySuccess ? "bg-emerald-500 text-white shadow-emerald-200" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}
                >
                  <i
                    className={`fa-solid ${copySuccess ? "fa-check" : "fa-link"}`}
                  ></i>
                </div>
                <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  {copySuccess ? "Copied" : "Link"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
