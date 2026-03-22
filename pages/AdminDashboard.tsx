
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { Product, UserProfile, UserRole, SellerStatus, ProductStatus } from "../types";
import { databases } from "../lib/appwrite";
import { Query } from "appwrite";

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<"products" | "sellers" | "reports" | "network">("products");
  const [loading, setLoading] = useState(true);
  const [updatingSellerId, setUpdatingSellerId] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [pRes, uRes] = await Promise.all([
        databases.listDocuments(import.meta.env.VITE_APPWRITE_DATABASE_ID, "products", [Query.limit(100)]),
        databases.listDocuments(import.meta.env.VITE_APPWRITE_DATABASE_ID, "profiles", [Query.limit(100)]),
      ]);
      setProducts(pRes.documents as any);
      setUsers(uRes.documents as any);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== UserRole.ADMIN) {
      navigate("/");
      return;
    }
    fetchAdminData();
  }, [user, navigate]);

  const handleSellerStatusUpdate = async (
    profile: UserProfile,
    nextStatus: SellerStatus,
  ) => {
    try {
      setUpdatingSellerId(profile.userId);
      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        "profiles",
        profile.$id || profile.userId,
        {
          sellerStatus: nextStatus,
          updatedAt: new Date().toISOString(),
        },
      );
      await fetchAdminData();
    } catch (error) {
      console.error("Failed to update seller status:", error);
      alert("Seller verification update failed.");
    } finally {
      setUpdatingSellerId(null);
    }
  };

  if (user?.role !== UserRole.ADMIN) return null;

  return (
    <div className="max-w-7xl mx-auto py-16 px-6 pb-48 animate-fadeIn">
      
      {/* High Contrast Sub-Header */}
      <header className="mb-20 space-y-6">
         <div className="flex items-center gap-4 text-[#22C55E]">
            <span className="w-12 h-1.5 bg-[#22C55E] rounded-full"></span>
            <p className="text-[12px] font-black uppercase tracking-[0.4em]">Administrative Protocol Hub</p>
         </div>
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <h1 className="text-6xl md:text-8xl font-black text-[#0F172A] uppercase tracking-tighter leading-none shrink-0">
               Control <br />
               <span className="text-slate-200">Sector.</span>
            </h1>
            <div className="flex bg-slate-50 p-2 rounded-[32px] border border-slate-100 shadow-sm w-full md:w-auto overflow-x-auto no-scrollbar justify-center md:mx-0 mx-auto">
               {(['products', 'sellers', 'reports', 'network'] as const).map(tab => (
                 <button 
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={`px-8 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? "bg-[#0F172A] text-white shadow-xl scale-[1.05]" : "text-slate-400 hover:text-[#0F172A] hover:bg-white"}`}
                 >
                   {tab}
                 </button>
               ))}
            </div>
         </div>
      </header>

      {/* Main Content Area - Pure White Logic */}
      <div className="bg-white border border-slate-50 rounded-[48px] shadow-2xl p-4 md:p-8 min-h-[600px] relative overflow-hidden">
         <div className="absolute top-0 right-0 w-1/4 h-full bg-linear-to-l from-slate-50/50 to-transparent"></div>
         
         {loading ? (
             <div className="py-20 flex flex-col items-center justify-center space-y-8">
                <div className="w-16 h-16 border-4 border-[#22C55E]/10 border-t-[#22C55E] rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Synchronizing Hub Data...</p>
             </div>
         ) : (
            <div className="relative z-10">
               {activeTab === 'products' && (
                  <div className="space-y-12">
                     <div className="flex items-end justify-between border-b-2 border-slate-50 pb-8">
                        <div className="flex items-center gap-4">
                           <span className="text-4xl font-black text-slate-100 tracking-tighter">01</span>
                           <h2 className="text-3xl font-black text-[#0F172A] uppercase tracking-tighter">Asset Registry</h2>
                        </div>
                        <p className="text-[10px] font-black uppercase text-[#22C55E] tracking-widest animate-pulse">Live Feed Active</p>
                     </div>
                     <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left">
                           <thead>
                              <tr className="border-b border-slate-50 text-[10px] font-black uppercase text-slate-300 tracking-widest">
                                 <th className="px-6 py-6">Identity</th>
                                 <th className="px-6 py-6">Sector</th>
                                 <th className="px-6 py-6">Valuation</th>
                                 <th className="px-6 py-6 text-right">Protocol</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                              {products.map(p => (
                                 <tr key={p.$id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-8">
                                       <div className="flex items-center gap-4">
                                          <img src={p.imageUrls[0]} className="w-16 h-16 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform" />
                                          <div className="overflow-hidden">
                                             <p className="text-[15px] font-black text-[#0F172A] line-clamp-1 truncate leading-tight uppercase tracking-tight">{p.name}</p>
                                             <p className="text-[11px] text-slate-400 font-bold italic truncate leading-relaxed">ID: {p.$id.substring(0,8)}</p>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-6 py-8">
                                       <span className="px-4 py-1.5 bg-slate-50 text-slate-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-100 italic">{p.category}</span>
                                    </td>
                                    <td className="px-6 py-8">
                                       <p className="text-xl font-black text-[#0F172A]">₦{p.price.toLocaleString()}</p>
                                    </td>
                                    <td className="px-6 py-8 text-right">
                                       <button className="px-6 py-3 bg-[#0F172A] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#22C55E] transition-all shadow-xl shadow-slate-900/10 active:scale-95">Inspect</button>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               )}

               {activeTab === 'sellers' && (
                  <div className="space-y-12">
                     <div className="flex items-end justify-between border-b-2 border-slate-50 pb-8">
                        <div className="flex items-center gap-4">
                           <span className="text-4xl font-black text-slate-100 tracking-tighter">02</span>
                           <h2 className="text-3xl font-black text-[#0F172A] uppercase tracking-tighter">Verified Portfolios</h2>
                        </div>
                        <p className="text-[10px] font-black uppercase text-[#22C55E] tracking-widest italic animate-pulse">Vetting Phase</p>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                        {users.map(u => (
                           <div key={u.userId} className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group flex flex-col items-center text-center">
                              <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.name}&background=22C55E&color=fff`} className="w-24 h-24 rounded-full shadow-2xl mb-6 group-hover:scale-110 transition-transform" />
                              <div className="space-y-1 mb-8">
                                 <h3 className="text-lg font-black text-[#0F172A] uppercase tracking-tighter">{u.name}</h3>
                                 <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase italic">{u.role}</p>
                              </div>
                              <div className="w-full h-px bg-slate-200/50 mb-8"></div>
                              <div className="w-full space-y-3">
                                 <div className={`w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl ${
                                   u.sellerStatus === SellerStatus.VERIFIED
                                     ? 'bg-[#22C55E] text-white shadow-green-500/10'
                                     : u.sellerStatus === SellerStatus.PENDING
                                     ? 'bg-amber-100 text-amber-700 shadow-amber-200/40'
                                     : u.sellerStatus === SellerStatus.REJECTED
                                     ? 'bg-rose-100 text-rose-700 shadow-rose-200/40'
                                     : 'bg-slate-200 text-slate-600 shadow-slate-200/40'
                                 }`}>
                                    {u.sellerStatus}
                                 </div>
                                 <button
                                   onClick={() => handleSellerStatusUpdate(u, SellerStatus.VERIFIED)}
                                   disabled={u.sellerStatus === SellerStatus.VERIFIED || updatingSellerId === u.userId}
                                   className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-60 ${
                                     u.sellerStatus === SellerStatus.VERIFIED
                                       ? 'bg-[#22C55E] text-white shadow-green-500/10'
                                       : 'bg-[#0F172A] text-white shadow-slate-900/10 hover:bg-[#22C55E]'
                                   }`}
                                 >
                                    {updatingSellerId === u.userId
                                      ? 'Updating...'
                                      : u.sellerStatus === SellerStatus.VERIFIED
                                      ? 'Authorized'
                                      : 'Grant Protocol'}
                                 </button>
                                 {u.sellerStatus !== SellerStatus.UNVERIFIED && u.sellerStatus !== SellerStatus.REJECTED && (
                                   <button
                                     onClick={() => handleSellerStatusUpdate(u, SellerStatus.REJECTED)}
                                     disabled={updatingSellerId === u.userId}
                                     className="w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-rose-200 text-rose-600 hover:bg-rose-50 transition-all disabled:opacity-60"
                                   >
                                     Reject Seller
                                   </button>
                                 )}
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               )}
               
               {/* Reports & Network Tabs */}
               {(activeTab === 'reports' || activeTab === 'network') && (
                  <div className="py-32 text-center space-y-8 animate-fadeIn">
                     <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                        <i className="fa-solid fa-code-merge text-6xl"></i>
                     </div>
                     <div className="space-y-2">
                        <h3 className="text-2xl font-black text-[#0F172A] uppercase tracking-tighter">Offline Link.</h3>
                        <p className="text-slate-400 font-bold italic text-xs uppercase tracking-widest leading-relaxed">System integration for this sector is currently in sandbox development.</p>
                     </div>
                     <button onClick={() => setActiveTab('products')} className="text-[#22C55E] font-black text-[10px] uppercase tracking-[0.4em] hover:underline transition-all">Emergency Return</button>
                  </div>
               )}
            </div>
         )}
      </div>
    </div>
  );
};

export default AdminDashboard;
