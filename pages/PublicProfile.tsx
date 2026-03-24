import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { databases } from "../lib/appwrite";
import { Query } from "appwrite";
import { UserProfile, Product, SellerStatus } from "../types";

const PublicProfile: React.FC = () => {
  const { id } = useParams();
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const profile = await databases.getDocument(import.meta.env.VITE_APPWRITE_DATABASE_ID, "profiles", id);
        setTargetUser(profile as unknown as UserProfile);

        const products = await databases.listDocuments(import.meta.env.VITE_APPWRITE_DATABASE_ID, "products", [
           Query.equal("sellerId", id)
        ]);
        setUserProducts(products.documents as unknown as Product[]);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center pt-40"><div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!targetUser) return <div className="min-h-screen flex items-center justify-center pt-40 text-slate-400 uppercase font-black tracking-widest">Student Node Not Found.</div>;

  return (
    <div className="bg-white min-h-screen pt-44 pb-44 px-8 relative overflow-hidden">
       <div className="max-w-6xl mx-auto space-y-24">
          
          <section className="flex flex-col md:flex-row items-center gap-14 bg-slate-50/50 p-12 rounded-[56px] border border-slate-100 shadow-sm relative group overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-teal-100/20 blur-[100px] pointer-events-none group-hover:scale-150 transition-transform duration-1000"></div>
             
             <div className="relative">
                <img src={targetUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(targetUser.name)}&background=003366&color=fff&size=512`} className="w-48 h-48 rounded-[48px] border-8 border-white shadow-2xl object-cover scale-105" alt="Av" />
                <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-xl border border-slate-50">
                   <i className={`fa-solid ${targetUser.sellerStatus === SellerStatus.VERIFIED ? 'fa-shield-check text-[#14b8a6]' : 'fa-clock text-amber-500'} text-2xl`}></i>
                </div>
             </div>

             <div className="space-y-6 text-center md:text-left grow">
                <div className="space-y-2">
                   <h1 className="text-5xl font-black text-[#003366] tracking-tighter uppercase">{targetUser.name}</h1>
                   <p className="text-[12px] font-black text-teal-600 uppercase tracking-[0.3em] italic">{targetUser.department} • {targetUser.level} Level</p>
                </div>
                
                <div className="flex flex-wrap gap-4 pt-4 justify-center md:justify-start">
                   <div className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined {new Date(targetUser.createdAt).toLocaleDateString()}</div>
                   <div className="px-6 py-3 bg-teal-600 text-white rounded-2xl shadow-lg shadow-teal-500/20 text-[10px] font-black uppercase tracking-widest">{targetUser.role.toUpperCase()}</div>
                </div>
             </div>

             <div className="hidden lg:grid grid-cols-2 gap-4 text-center">
                <div className="p-8 bg-white border border-slate-100 rounded-[36px] shadow-sm">
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Listings</p>
                   <p className="text-3xl font-black text-[#003366] tracking-tighter">{userProducts.length}</p>
                </div>
                <div className="p-8 bg-white border border-slate-100 rounded-[36px] shadow-sm">
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Rating</p>
                   <p className="text-3xl font-black text-teal-600 tracking-tighter">{targetUser.averageRating || "5.0"}</p>
                </div>
             </div>
          </section>

          <section className="space-y-12">
             <div className="flex items-center justify-between border-b-2 border-slate-50 pb-8">
                <h2 className="text-4xl font-black text-[#003366] uppercase tracking-tighter">Scholarly <span className="text-teal-600">Inventory.</span></h2>
                <div className="px-5 py-2 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-[#003366]">{userProducts.length} Items</div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {userProducts.map(p => (
                   <Link key={p.$id} to={`/product/${p.$id}`} className="group bg-white rounded-[40px] border border-slate-50 p-6 shadow-sm hover:shadow-2xl hover:border-teal-600/10 transition-all duration-500 overflow-hidden relative">
                      <div className="relative aspect-square rounded-[32px] overflow-hidden mb-6 bg-slate-50">
                         <img src={p.imageUrls[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Pr" />
                         <div className="absolute top-4 right-4 px-4 py-2 bg-white/90 backdrop-blur-md rounded-xl text-[10px] font-black uppercase text-[#003366] shadow-md italic">₦{p.price.toLocaleString()}</div>
                      </div>
                      <h3 className="text-xl font-black text-[#003366] uppercase tracking-tight mb-2 truncate">{p.name}</h3>
                      <p className="text-[10px] font-black text-teal-600/60 uppercase tracking-widest leading-none mb-4">{p.category}</p>
                      <div className="flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">View Node</span>
                         <i className="fa-solid fa-arrow-right text-[10px] text-teal-600"></i>
                      </div>
                   </Link>
                ))}
                {userProducts.length === 0 && <div className="col-span-full py-40 text-center uppercase font-black text-slate-200 text-sm tracking-[1em] italic">Archive Empty.</div>}
             </div>
          </section>

       </div>
    </div>
  );
};

export default PublicProfile;
