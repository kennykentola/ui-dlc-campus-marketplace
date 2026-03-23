
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { ProductStatus, SellerStatus, ListingType, DeliveryMethod } from "../types";
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
  const [selectedDeliveries, setSelectedDeliveries] = useState<DeliveryMethod[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

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
      const imageUrls: string[] = [];
      for (const img of images) {
        const file = await storage.createFile(
          import.meta.env.VITE_APPWRITE_BUCKET_ID,
          ID.unique(),
          img
        );
        const url = storage.getFileView(import.meta.env.VITE_APPWRITE_BUCKET_ID, file.$id).toString();
        imageUrls.push(url);
      }

      await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID,
        ID.unique(),
        {
          name,
          description,
          price: parseFloat(price),
          category,
          sellerId: user.userId,
          sellerName: user.name,
          imageUrls,
          status: ProductStatus.APPROVED,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          listingType,
          deliveryMethods: selectedDeliveries,
          isFlagged: false
        }
      );
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Asset creation protocol failed. Re-audit your data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen pb-40 animate-fadeIn relative">
      <header className="fixed top-0 left-0 w-full z-100 bg-white/95 backdrop-blur-xl border-b border-slate-100 py-6 px-10 flex items-center justify-between shadow-sm">
         <button onClick={() => navigate(-1)} className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-[#003366] transition-all">
            <i className="fa-solid fa-arrow-left"></i>
            Cancel Protocol
         </button>
         <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center border border-slate-50 shadow-sm">
               <img src="/logo.png" className="h-5" alt="Logo" />
            </div>
            <h1 className="text-xl font-black text-[#003366] tracking-tighter uppercase leading-none">Sell / Exchange.</h1>
         </div>
         <div className="w-24"></div>
      </header>

      <main className="container mx-auto px-6 max-w-3xl mt-44 space-y-24 animate-slideUp">
         <section className="space-y-16">
            <div className="space-y-3">
               <h2 className="text-4xl font-black text-[#003366] uppercase tracking-tighter leading-none border-l-4 border-teal-600 pl-8">Sell, Lend or Exchange an Item.</h2>
               <p className="text-[11px] text-slate-500 font-medium leading-relaxed pl-8 max-w-2xl">Use this page to post any item you want to sell, lend out, or exchange with another UI DLC student.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-24">
               {/* 01: Visual Evidence */}
               <div className="space-y-10">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-6 mb-10">
                     <h3 className="text-sm font-black text-[#003366] uppercase tracking-widest">01 Add Photos</h3>
                     <span className="text-[9px] font-black text-teal-600 uppercase tracking-[0.3em] italic">Upload clear photos of the item</span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                     {imagePreviews.map((url, i) => (
                       <div key={i} className="relative aspect-square rounded-[32px] overflow-hidden border border-slate-100 bg-slate-50 group hover:border-teal-600/20 transition-all shadow-sm">
                          <img src={url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Prev" />
                          <button type="button" onClick={() => removeImage(i)} className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center text-rose-500 text-xs hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                             <i className="fa-solid fa-trash-can"></i>
                          </button>
                       </div>
                     ))}
                     <label className="aspect-square rounded-[32px] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-300 hover:bg-slate-50 hover:border-teal-600/50 hover:text-teal-600 transition-all cursor-pointer group">
                        <i className="fa-solid fa-plus text-2xl mb-3 group-hover:rotate-90 transition-transform duration-500"></i>
                        <span className="text-[9px] font-black uppercase tracking-widest">Add Photos</span>
                        <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                     </label>
                  </div>
               </div>

               {/* 02: Core Documentation */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  <div className="space-y-12">
                     <div className="space-y-4">
                        <p className="text-[10px] font-black text-[#003366]/40 uppercase tracking-widest">Item Name</p>
                        <input 
                           type="text" 
                           placeholder="e.g. GST 202 Handout, Laptop Bag, Textbook"
                           className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-[#003366] outline-none focus:bg-white focus:border-teal-600 transition-all shadow-sm"
                           value={name} onChange={(e) => setName(e.target.value)} required
                        />
                     </div>

                     <div className="space-y-4">
                        <p className="text-[10px] font-black text-[#003366]/40 uppercase tracking-widest">Valuation (₦)</p>
                        <input 
                           type="number" 
                           placeholder="Price"
                           className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-[#003366] outline-none focus:bg-white focus:border-teal-600 transition-all shadow-sm"
                           value={price} onChange={(e) => setPrice(e.target.value)} required
                        />
                     </div>

                     <div className="space-y-4">
                        <p className="text-[10px] font-black text-[#003366]/40 uppercase tracking-widest">Category</p>
                        <div className="grid grid-cols-2 gap-2">
                           {CATEGORIES.map(c => (
                             <button key={c} type="button" onClick={() => setCategory(c)} className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${category === c ? 'bg-[#003366] text-white border-[#003366] shadow-lg shadow-blue-900/10' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}>{c}</button>
                           ))}
                        </div>
                     </div>
                  </div>

                  <div className="space-y-12">
                     <div className="space-y-4">
                        <p className="text-[10px] font-black text-[#003366]/40 uppercase tracking-widest">Item Description</p>
                        <textarea 
                           placeholder="Describe the item, its condition, and any important details."
                           className="w-full h-[285px] bg-slate-50 border border-slate-100 rounded-[32px] px-6 py-5 text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-teal-600 transition-all shadow-sm resize-none leading-relaxed"
                           value={description} onChange={(e) => setDescription(e.target.value)} required
                        />
                     </div>
                  </div>
               </div>

               {/* 03: Specialized Badge & Logistics */}
               <div className="space-y-16 pt-8 border-t border-slate-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                     <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                           <i className="fa-solid fa-graduation-cap text-teal-600"></i>
                           <h3 className="text-[10px] font-black uppercase tracking-widest text-[#003366]">Item Type</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                           {Object.values(ListingType).map(t => (
                              <button key={t} type="button" onClick={() => setListingType(t)} className={`px-5 py-6 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all border flex flex-col items-center justify-center gap-2 ${listingType === t ? 'bg-[#14b8a6] text-white border-[#14b8a6] shadow-xl shadow-teal-500/10' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                 <i className={`fa-solid ${t === ListingType.COURSE_MATERIAL ? 'fa-book' : t === ListingType.EXAM_PREP ? 'fa-file-shield' : t === ListingType.TEXTBOOK ? 'fa-bookmark' : 'fa-box-open'} text-lg`}></i>
                                 {t === ListingType.NORMAL ? 'Regular Item' : t}
                              </button>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                           <i className="fa-solid fa-truck-fast text-teal-600"></i>
                           <h3 className="text-[10px] font-black uppercase tracking-widest text-[#003366]">How will the buyer get it?</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                           {Object.values(DeliveryMethod).map(m => (
                              <button key={m} type="button" onClick={() => toggleDelivery(m)} className={`px-5 py-6 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all border flex flex-col items-center justify-center gap-2 ${selectedDeliveries.includes(m) ? 'bg-[#003366] text-white border-[#003366] shadow-xl shadow-blue-900/10' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                 <i className={`fa-solid ${m === DeliveryMethod.MEETUP ? 'fa-people-arrows' : m === DeliveryMethod.PICKUP ? 'fa-building-columns' : m === DeliveryMethod.HOSTEL ? 'fa-bed' : 'fa-cloud-arrow-down'} text-lg`}></i>
                                 {m === DeliveryMethod.MEETUP ? 'Meet in Person' : m === DeliveryMethod.PICKUP ? 'Campus Pickup' : m === DeliveryMethod.HOSTEL ? 'Hostel Drop-off' : 'Digital Delivery'}
                                 {selectedDeliveries.includes(m) && <i className="fa-solid fa-circle-check absolute top-2 right-2 text-[10px]"></i>}
                              </button>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>

               <div className="pt-16 border-t border-slate-50 flex items-center justify-between gap-10">
                  <div className="space-y-2 max-w-sm">
                     <div className="flex items-center gap-3 text-teal-600">
                        <i className="fa-solid fa-shield-check"></i>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Before you post</span>
                     </div>
                     <p className="text-[9px] text-slate-400 font-medium italic">Make sure the item details are correct. Only post items that belong to you and are allowed on the platform.</p>
                  </div>
                  <button 
                     type="submit" 
                     disabled={loading}
                     className="grow max-w-md py-6 bg-[#003366] text-white rounded-[24px] font-black text-[12px] uppercase tracking-widest shadow-2xl shadow-blue-900/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                   >
                     {loading ? "Posting..." : "Post Item"}
                     <i className="fa-solid fa-paper-plane text-[10px]"></i>
                  </button>
               </div>
            </form>
         </section>
      </main>
    </div>
  );
};

export default CreateProduct;
