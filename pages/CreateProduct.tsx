
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { SellerStatus, ListingType, DeliveryMethod, TransactionType, LearningHub } from "../types";
import { databases, storage } from "../lib/appwrite";
import { ID } from "appwrite";
import { CATEGORIES } from "../constants";

const CreateProduct: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [listingType, setListingType] = useState<ListingType>(ListingType.NORMAL);
  const [transactionType, setTransactionType] = useState<TransactionType>('sale');
  const [selectedDeliveries, setSelectedDeliveries] = useState<DeliveryMethod[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [exchangeTerms, setExchangeTerms] = useState("");
  const [learningHub, setLearningHub] = useState<LearningHub>(LearningHub.IBADAN);
  const [isExamWeekSafe, setIsExamWeekSafe] = useState(false);
  const [isSharedLogistics, setIsSharedLogistics] = useState(false);

  useEffect(() => {
    if (!user) navigate("/login");
    if (user && user.sellerStatus !== SellerStatus.VERIFIED) {
      alert("You need to be a verified scholar to export assets. Redirecting to profile protocol...");
      navigate("/profile");
    }
  }, [user, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (images.length + files.length > 5) return alert("Archive limit reached: max 5 visual nodes allowed.");
      
      setImages((prev) => [...prev, ...files]);
      const previews = files.map((f) => URL.createObjectURL(f));
      setImagePreviews((prev) => [...prev, ...previews]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleDelivery = (method: DeliveryMethod) => {
    setSelectedDeliveries(prev => 
      prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || images.length === 0 || !category) return alert("Complete the export protocol with visual evidence and category data.");
    if (selectedDeliveries.length === 0) return alert("Select at least one delivery protocol.");
    
    setLoading(true);

    try {
      const imageUrls = await Promise.all(
        images.map(async (file) => {
          const res = await storage.createFile(
            import.meta.env.VITE_APPWRITE_BUCKET_ID,
            ID.unique(),
            file
          );
          const url = storage.getFileView(import.meta.env.VITE_APPWRITE_BUCKET_ID, res.$id);
          return url.toString();
        })
      );

      await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        "products",
        ID.unique(),
        {
          name,
          description,
          price: parseFloat(price),
          category,
          imageUrls,
          sellerId: user.userId,
          sellerName: user.name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          listingType,
          transactionType,
          deliveryMethods: selectedDeliveries,
          isNegotiable,
          exchangeTerms,
          learningHub,
          isExamWeekSafe,
          isSharedLogistics,
          isFlagged: false
        }
      );

      alert("Asset exported successfully to the Registry.");
      navigate("/");
    } catch (error: any) {
      console.error(error);
      alert(`Export transmission failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent py-12 px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none animate-fadeIn">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-black text-brand-ink dark:text-white tracking-tight uppercase">Sell an Item</h1>
            <div className="w-12 h-12 bg-brand-surface dark:bg-brand-primary/20 text-brand-primary dark:text-blue-400 rounded-2xl flex items-center justify-center font-black">
              <i className="fa-solid fa-shop"></i>
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg italic">
            Detailed descriptions and clear photos help you sell faster to UI DLC students.
          </p>

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Title Section */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Title of Item</label>
              <input
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 text-xl font-bold focus:outline-none focus:ring-4 focus:ring-indigo-700/10 focus:bg-white dark:focus:bg-slate-700 dark:text-white transition shadow-sm"
                placeholder="e.g. Casio fx-991EX Calculator (Brand New)"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Grid for Category and Transaction Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Category</label>
                <div className="relative">
                  <select
                    aria-label="Category"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-700/10 transition cursor-pointer appearance-none shadow-sm"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Select Protocol Category</option>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <i className="fa-solid fa-chevron-down"></i>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Transaction Type</label>
                <div className="flex bg-slate-50 dark:bg-slate-800 rounded-2xl p-1.5 border border-slate-200 dark:border-slate-700 shadow-sm flex-wrap gap-1">
                  {['sale', 'exchange', 'both', 'knowledge_barter'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTransactionType(type as TransactionType)}
                      className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                        transactionType === type 
                          ? 'bg-brand-primary text-white shadow-lg' 
                          : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                      }`}
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* DLC Learning Hub Node Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Learning Hub (Primary Base)</label>
                <div className="relative">
                  <select
                    aria-label="Learning Hub"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-700/10 transition cursor-pointer appearance-none shadow-sm"
                    value={learningHub}
                    onChange={(e) => setLearningHub(e.target.value as LearningHub)}
                  >
                    {Object.values(LearningHub).map(hub => (
                      <option key={hub} value={hub}>{hub}</option>
                    ))}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <i className="fa-solid fa-location-dot"></i>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 h-full items-end">
                <button
                  type="button"
                  onClick={() => setIsExamWeekSafe(!isExamWeekSafe)}
                  className={`flex flex-col items-center justify-center p-4 rounded-3xl border transition-all h-[76px] ${isExamWeekSafe ? 'bg-brand-surface border-indigo-200 text-brand-primary shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                >
                  <i className={`fa-solid fa-calendar-day mb-1 ${isExamWeekSafe ? 'animate-bounce' : ''}`}></i>
                  <span className="text-[8px] font-black uppercase tracking-widest leading-none">Exam Week Safe</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSharedLogistics(!isSharedLogistics)}
                  className={`flex flex-col items-center justify-center p-4 rounded-3xl border transition-all h-[76px] ${isSharedLogistics ? 'bg-orange-50 border-orange-200 text-brand-secondary shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                >
                  <i className="fa-solid fa-truck-ramp-box mb-1"></i>
                  <span className="text-[8px] font-black uppercase tracking-widest leading-none">Shared Courier</span>
                </button>
              </div>
            </div>

            {/* Price section with Negotiable toggle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Selling Price (₦)</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-slate-300 dark:text-slate-600">₦</span>
                  <input
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-12 py-4 text-xl font-black focus:outline-none focus:ring-4 focus:ring-indigo-700/10 dark:text-white transition shadow-sm"
                    placeholder="0"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className={`p-6 rounded-3xl mt-4 sm:mt-0 border transition-all ${isNegotiable ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30' : 'bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-800'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all ${isNegotiable ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-slate-200 text-slate-400 shadow-none'}`}>
                      <i className="fa-solid fa-handshake"></i>
                    </div>
                    <div>
                      <p className="text-xs font-black text-brand-ink dark:text-white uppercase tracking-wider">Negotiable</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase">Willing to haggle</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    aria-label="Toggle negotiable status"
                    onClick={() => setIsNegotiable(!isNegotiable)}
                    className={`w-12 h-6 rounded-full transition-all relative ${isNegotiable ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${isNegotiable ? 'left-6.5' : 'left-0.5'}`}></div>
                  </button>
                </div>
              </div>
            </div>

            {/* Description and Exchange Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Item Details & Condition</label>
                <textarea
                  rows={5}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-5 focus:outline-none focus:ring-4 focus:ring-indigo-700/10 focus:bg-white dark:focus:bg-slate-700 dark:text-white transition resize-none leading-relaxed text-base"
                  placeholder="Describe the item condition honestly. Mention if there's any receipt or warranty remaining."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Exchange Protocol (Optional)</label>
                <textarea
                  rows={5}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-5 focus:outline-none focus:ring-4 focus:ring-indigo-700/10 focus:bg-white dark:focus:bg-slate-700 dark:text-white transition resize-none leading-relaxed text-base"
                  placeholder="e.g. Willing to swap for a scientific calculator plus cash balance."
                  value={exchangeTerms}
                  onChange={(e) => setExchangeTerms(e.target.value)}
                />
              </div>
            </div>

            {/* Delivery Methods Hub */}
            <div className="space-y-6 bg-slate-50/50 dark:bg-brand-primary/5 p-8 rounded-4xl border border-slate-100 dark:border-slate-800">
               <div>
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] block">Logistics Hub Protocols</label>
                  <p className="text-[10px] text-slate-400 dark:text-slate-600 font-bold mt-1 uppercase">Select at least one secure exchange protocol</p>
               </div>
               <div className="flex flex-wrap gap-4">
                   {[DeliveryMethod.MEETUP, DeliveryMethod.PICKUP, DeliveryMethod.HOSTEL, DeliveryMethod.DIGITAL, DeliveryMethod.COURIER_HUB].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => toggleDelivery(method)}
                      className={`px-6 py-4 rounded-[24px] border transition-all flex items-center gap-3 ${
                        selectedDeliveries.includes(method)
                          ? 'border-brand-primary bg-brand-surface dark:bg-brand-primary/20 text-brand-primary dark:text-blue-400 shadow-lg'
                          : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      <i className={`fa-solid ${method === DeliveryMethod.MEETUP ? 'fa-people-arrows' : method === DeliveryMethod.PICKUP ? 'fa-building-columns' : method === DeliveryMethod.HOSTEL ? 'fa-bed' : method === DeliveryMethod.COURIER_HUB ? 'fa-truck-fast' : 'fa-cloud-arrow-down'}`}></i>
                      <span className="text-[10px] font-black uppercase tracking-widest">{method}</span>
                    </button>
                  ))}
               </div>
            </div>

            {/* Images section */}
            <div className="space-y-6 bg-slate-50/50 dark:bg-slate-900/50 p-8 rounded-4xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] block">Product Images ({images.length}/5)</label>
                  <p className="text-[10px] text-slate-400 dark:text-slate-600 font-bold mt-1 uppercase">JPG or PNG • Max 5MB per file</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
                {imagePreviews.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm group">
                    <img src={url} className="w-full h-full object-cover" alt="Preview" />
                    <button
                      type="button"
                      aria-label="Remove image"
                      onClick={() => removeImage(i)}
                      className="absolute top-2 right-2 w-8 h-8 bg-rose-500 text-white rounded-xl shadow-lg flex items-center justify-center scale-0 group-hover:scale-100 transition-transform"
                    >
                      <i className="fa-solid fa-trash-can text-sm"></i>
                    </button>
                  </div>
                ))}
                
                {images.length < 5 && (
                  <label className="aspect-square flex flex-col items-center justify-center border-3 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-800 hover:bg-brand-surface dark:hover:bg-slate-700 hover:border-blue-300 dark:hover:border-brand-primary transition-all cursor-pointer group shadow-sm">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition duration-300">
                      <i className="fa-solid fa-camera text-slate-300 dark:text-slate-600 text-xl"></i>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Add Photo</span>
                    <input multiple accept="image/*" className="hidden" type="file" onChange={handleImageChange} />
                  </label>
                )}
              </div>
              <div className="flex items-center space-x-2 text-slate-400 dark:text-slate-600">
                <i className="fa-solid fa-circle-info text-xs"></i>
                <p className="text-[10px] font-bold uppercase tracking-wider">Pro-tip: Clear shots from different angles sell faster.</p>
              </div>
            </div>

            {/* Submission buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pt-10 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="w-full sm:w-auto px-12 py-5 font-black text-slate-400 dark:text-slate-500 hover:text-brand-ink dark:hover:text-white transition uppercase tracking-widest text-sm"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:grow bg-brand-primary text-white py-5 rounded-[28px] font-black text-lg shadow-2xl shadow-blue-200 dark:shadow-none hover:bg-brand-primary transition transform active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest"
              >
                {loading ? 'Transmitting Asset...' : 'Publish to Marketplace'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProduct;
