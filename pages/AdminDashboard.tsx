
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { Product, UserProfile, UserRole, SellerStatus, ProductStatus, ProductReport } from "../types";
import { databases } from "../lib/appwrite";
import { Query } from "appwrite";

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reports, setReports] = useState<ProductReport[]>([]);
  const [activeTab, setActiveTab] = useState<"products" | "sellers" | "reports" | "network">("products");
  const [loading, setLoading] = useState(true);
  const [updatingSellerId, setUpdatingSellerId] = useState<string | null>(null);
  const [resolvingReportId, setResolvingReportId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [pRes, uRes, rRes] = await Promise.all([
        databases.listDocuments(import.meta.env.VITE_APPWRITE_DATABASE_ID, "products", [Query.orderDesc("createdAt"), Query.limit(50)]),
        databases.listDocuments(import.meta.env.VITE_APPWRITE_DATABASE_ID, "profiles", [Query.limit(50)]),
        databases.listDocuments(import.meta.env.VITE_APPWRITE_DATABASE_ID, "reports", [Query.orderDesc("createdAt"), Query.limit(50)]),
      ]);
      setProducts(pRes.documents as any);
      setUsers(uRes.documents as any);
      setReports(rRes.documents as any);
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

  const handleRoleUpdate = async (
    profile: UserProfile,
    nextRole: UserRole,
  ) => {
    try {
      setUpdatingSellerId(profile.userId);
      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        "profiles",
        profile.$id || profile.userId,
        {
          role: nextRole,
          updatedAt: new Date().toISOString(),
        },
      );
      await fetchAdminData();
    } catch (error) {
      console.error("Failed to update role:", error);
      alert("Role update failed.");
    } finally {
      setUpdatingSellerId(null);
    }
  };

  const resolveReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    try {
      setResolvingReportId(reportId);
      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        "reports",
        reportId,
        { status }
      );
      await fetchAdminData();
    } catch (error) {
      console.error(error);
      alert("Report resolution failed.");
    } finally {
      setResolvingReportId(null);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!window.confirm("CRITICAL: Permanent Asset Deletion Protocol. Proceed?")) return;
    try {
      await databases.deleteDocument(import.meta.env.VITE_APPWRITE_DATABASE_ID, "products", productId);
      await fetchAdminData();
    } catch (e) { alert("Deletion failed."); }
  };

  if (user?.role !== UserRole.ADMIN) return null;

  return (
    <div className="max-w-7xl mx-auto py-16 px-6 pb-48 animate-fadeIn">
      
      {/* High Contrast Sub-Header */}
      <header className="mb-20 space-y-6">
         <div className="flex items-center gap-4 text-brand-primary">
            <span className="w-12 h-1.5 bg-brand-primary rounded-full"></span>
            <p className="text-[12px] font-black uppercase tracking-[0.4em]">Administrative Protocol Hub</p>
         </div>
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <h1 className="text-6xl md:text-8xl font-black text-brand-primary uppercase tracking-tighter leading-none shrink-0">
               Control <br />
               <span className="text-slate-200">Sector.</span>
            </h1>
            <div className="flex bg-white p-2 rounded-[32px] border border-slate-100 shadow-xl w-full md:w-auto overflow-x-auto no-scrollbar justify-center md:mx-0 mx-auto">
               {(['products', 'sellers', 'reports', 'network'] as const).map(tab => (
                 <button 
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={`px-8 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? "bg-brand-primary text-white shadow-2xl scale-[1.05]" : "text-slate-400 hover:text-brand-primary hover:bg-slate-50"}`}
                 >
                   {tab}
                 </button>
               ))}
            </div>
         </div>
      </header>

      {/* Main Content Area - Pure White Logic */}
      <div className="bg-white border border-slate-50 rounded-[48px] shadow-2xl p-4 md:p-10 min-h-[700px] relative overflow-hidden">
         
         {loading ? (
              <div className="py-40 flex flex-col items-center justify-center space-y-8">
                 <div className="w-20 h-20 border-4 border-brand-primary/10 border-t-indigo-700 rounded-full animate-spin"></div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Synchronizing Hub Data...</p>
              </div>
         ) : (
            <div className="relative z-10 space-y-12">
               {selectedUser && (
                  <div className="fixed inset-0 z-120 flex items-center justify-center p-6">
                     <div className="absolute inset-0 bg-brand-primary/40 backdrop-blur-md" onClick={() => setSelectedUser(null)}></div>
                     <div className="relative z-10 w-full max-w-3xl rounded-[40px] border border-slate-100 bg-white p-8 md:p-10 shadow-2xl">
                        <div className="flex items-start justify-between gap-6">
                           <div className="flex items-center gap-5">
                              <img
                                src={selectedUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=003366&color=fff`}
                                className="h-20 w-20 rounded-[28px] object-cover shadow-lg"
                                alt={selectedUser.name}
                              />
                              <div>
                                 <h3 className="text-2xl font-black uppercase tracking-tight text-brand-primary">{selectedUser.name}</h3>
                                 <p className="mt-1 text-sm text-slate-500">{selectedUser.email}</p>
                                 <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-brand-primary">{selectedUser.role}</p>
                              </div>
                           </div>
                           <button onClick={() => setSelectedUser(null)} aria-label="Close user details" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 hover:text-rose-500 transition-colors">
                              <i className="fa-solid fa-xmark"></i>
                           </button>
                        </div>

                        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                           <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-5">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Department</p>
                              <p className="mt-2 text-sm font-bold text-brand-primary">{selectedUser.department || "Not provided"}</p>
                           </div>
                           <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-5">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Level</p>
                              <p className="mt-2 text-sm font-bold text-brand-primary">{selectedUser.level || "Not provided"}</p>
                           </div>
                           <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-5">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Matric Number</p>
                              <p className="mt-2 text-sm font-bold text-brand-primary">{selectedUser.matricNumber || "Not provided"}</p>
                           </div>
                           <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-5">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Seller Status</p>
                              <p className="mt-2 text-sm font-bold text-brand-primary">{selectedUser.sellerStatus}</p>
                           </div>
                           <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-5">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone Number</p>
                              <p className="mt-2 text-sm font-bold text-brand-primary">{selectedUser.phoneNumber || "Not provided"}</p>
                           </div>
                           <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-5">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fintech Handle</p>
                              <p className="mt-2 text-sm font-bold text-brand-primary">{selectedUser.fintechHandles || "Not provided"}</p>
                           </div>
                           <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-5">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bank Name</p>
                              <p className="mt-2 text-sm font-bold text-brand-primary">{selectedUser.bankName || "Not provided"}</p>
                           </div>
                           <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-5">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Number</p>
                              <p className="mt-2 text-sm font-bold text-brand-primary">{selectedUser.accountNumber || "Not provided"}</p>
                           </div>
                           <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-5 md:col-span-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Name</p>
                              <p className="mt-2 text-sm font-bold text-brand-primary">{selectedUser.accountName || "Not provided"}</p>
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {activeTab === 'products' && (
                  <div className="space-y-12">
                     <div className="flex items-end justify-between border-b-2 border-slate-50 pb-8">
                        <div className="flex items-center gap-4">
                           <span className="text-4xl font-black text-slate-100 tracking-tighter">01</span>
                           <h2 className="text-3xl font-black text-brand-primary uppercase tracking-tighter">Asset Registry</h2>
                        </div>
                        <p className="text-[10px] font-black uppercase text-brand-primary tracking-widest animate-pulse">Live Feed Active</p>
                     </div>
                     <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left">
                           <thead>
                              <tr className="border-b border-slate-50 text-[10px] font-black uppercase text-slate-300 tracking-widest italic">
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
                                          <img src={p.imageUrls[0]} alt={p.name} className="w-16 h-16 rounded-2xl object-cover shadow-sm group-hover:scale-110 transition-transform" />
                                          <div className="overflow-hidden">
                                             <p className="text-[15px] font-black text-brand-primary line-clamp-1 truncate leading-tight uppercase tracking-tight">{p.name}</p>
                                             <p className="text-[11px] text-slate-400 font-bold italic truncate leading-relaxed">ID: {p.$id.substring(0,8)}</p>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-6 py-8">
                                       <span className="px-4 py-1.5 bg-slate-50 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-100 italic">{p.category}</span>
                                    </td>
                                    <td className="px-6 py-8">
                                       <p className="text-xl font-black text-brand-primary">₦{p.price.toLocaleString()}</p>
                                    </td>
                                    <td className="px-6 py-8 text-right space-x-3">
                                       <Link to={`/product/${p.$id}`} className="px-4 py-3 bg-slate-100 text-brand-primary rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white border border-slate-200 transition-all">Inspect</Link>
                                       <button onClick={() => deleteProduct(p.$id)} className="px-4 py-3 bg-rose-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-rose-900/10">Purge</button>
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
                           <h2 className="text-3xl font-black text-brand-primary uppercase tracking-tighter">Verified Portfolios</h2>
                        </div>
                        <p className="text-[10px] font-black uppercase text-brand-primary tracking-widest italic animate-pulse">Vetting Phase</p>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                        {users.map(u => (
                           <div key={u.userId} className="bg-white p-10 rounded-[48px] border border-slate-50 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group flex flex-col items-center text-center">
                              <div className="relative">
                                 <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=003366&color=fff`} alt={`${u.name}'s avatar`} className="w-24 h-24 rounded-[36px] shadow-2xl mb-8 group-hover:scale-110 transition-transform object-cover" />
                                 <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl flex items-center justify-center text-white border-4 border-white ${u.sellerStatus === SellerStatus.VERIFIED ? 'bg-brand-primary' : 'bg-slate-300'}`}>
                                    <i className="fa-solid fa-shield-check text-xs"></i>
                                 </div>
                              </div>
                              <div className="space-y-2 mb-8">
                                 <h3 className="text-lg font-black text-brand-primary uppercase tracking-tighter leading-none">{u.name}</h3>
                                 <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase italic">{u.department || "Academic Auditor"}</p>
                              </div>
                              <div className="w-full space-y-4">
                                 <div className={`w-full py-4 rounded-3xl text-[9px] font-black uppercase tracking-widest italic flex items-center justify-center gap-3 ${
                                   u.sellerStatus === SellerStatus.VERIFIED ? 'bg-brand-surface text-brand-primary' : 
                                   u.sellerStatus === SellerStatus.PENDING ? 'bg-yellow-50 text-yellow-700' : 
                                   u.sellerStatus === SellerStatus.REJECTED ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-400'
                                 }`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                    {u.sellerStatus} Protocol
                                 </div>
                                 
                                 <div className="grid grid-cols-2 gap-3">
                                    <button
                                      onClick={() => setSelectedUser(u)}
                                      className="col-span-2 py-4 bg-slate-50 border border-slate-200 text-brand-primary rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-white transition-all"
                                    >
                                       View Details
                                    </button>
                                    <button
                                      onClick={() => handleSellerStatusUpdate(u, SellerStatus.VERIFIED)}
                                      disabled={u.sellerStatus === SellerStatus.VERIFIED || updatingSellerId === u.userId}
                                      className="py-4 bg-brand-primary text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50"
                                    >
                                       Authorize
                                    </button>
                                    <button
                                      onClick={() => handleSellerStatusUpdate(u, SellerStatus.REJECTED)}
                                      disabled={u.sellerStatus === SellerStatus.REJECTED || updatingSellerId === u.userId}
                                      className="py-4 bg-white border border-rose-100 text-rose-500 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all disabled:opacity-50"
                                    >
                                       Reject
                                    </button>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {activeTab === 'reports' && (
                  <div className="space-y-12">
                     <div className="flex items-end justify-between border-b-2 border-slate-50 pb-8">
                        <div className="flex items-center gap-4">
                           <span className="text-4xl font-black text-slate-100 tracking-tighter">03</span>
                           <h2 className="text-3xl font-black text-brand-primary uppercase tracking-tighter">Conflict Archive</h2>
                        </div>
                        <p className="text-[10px] font-black uppercase text-rose-500 tracking-widest italic animate-pulse">Critical Alerts ({reports.filter(r => r.status !== 'resolved').length})</p>
                     </div>
                     <div className="grid grid-cols-1 gap-6">
                        {reports.map(r => (
                           <div key={r.$id} className={`p-10 rounded-[48px] border transition-all flex flex-col md:flex-row gap-10 items-start ${r.status === 'resolved' ? 'bg-slate-50/50 border-slate-100 opacity-60' : 'bg-white border-rose-100 shadow-xl shadow-rose-100/10'}`}>
                              <div className="shrink-0 w-20 h-20 bg-rose-500/10 rounded-[32px] flex items-center justify-center text-rose-500">
                                 <i className="fa-solid fa-skull-crossbones text-2xl"></i>
                              </div>
                               <div className="grow space-y-6">
                                  <div className="flex items-center justify-between gap-4 border-b border-slate-50 pb-4">
                                     <div className="flex items-center gap-4">
                                        <h4 className="text-xl font-black text-brand-primary uppercase tracking-tighter">{r.reason}</h4>
                                        <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${r.status === 'resolved' ? 'bg-brand-surface text-brand-primary' : r.status === 'investigating' ? 'bg-brand-surface text-brand-primary' : 'bg-rose-100 text-rose-700'}`}>{r.status || 'Pending'}</span>
                                     </div>
                                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{new Date(r.createdAt).toLocaleString()}</p>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                     <div className="space-y-3 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reporter (The Accuser)</p>
                                        <div>
                                           <p className="text-sm font-black text-brand-primary uppercase">{r.reporterName}</p>
                                           <p className="text-[10px] font-bold text-brand-primary uppercase italic">MATRIC: {(r as any).reporterMatric || 'N/A'}</p>
                                           <p className="text-[10px] font-bold text-slate-400 uppercase">MAIL: {(r as any).reporterEmail || 'N/A'}</p>
                                        </div>
                                     </div>
                                     <div className="space-y-3 p-6 bg-rose-50/30 rounded-3xl border border-rose-100/30">
                                        <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Reported (The Scammer/Target)</p>
                                        <div>
                                           <p className="text-sm font-black text-brand-primary uppercase">{(r as any).reportedName || 'System Hub'}</p>
                                           <p className="text-[10px] font-bold text-rose-600 uppercase italic">MATRIC: {(r as any).reportedMatric || 'N/A'}</p>
                                           <p className="text-[10px] font-bold text-slate-400 uppercase">MAIL: {(r as any).reportedEmail || 'N/A'}</p>
                                        </div>
                                     </div>
                                  </div>

                                  <div className="p-8 bg-white border border-slate-100 rounded-[32px]">
                                     <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-3 italic">Statement of Facts</p>
                                     <p className="text-sm font-medium text-slate-600 leading-relaxed italic">"{r.description}"</p>
                                  </div>
                               </div>
                               <div className="flex shrink-0 gap-3 md:flex-col w-full md:w-56 mt-6 md:mt-0">
                                  <button 
                                    onClick={() => resolveReport(r.$id, 'investigating' as any)} 
                                    disabled={r.status === 'investigating' || r.status === 'resolved' || resolvingReportId === r.$id}
                                    className="grow py-4 px-6 bg-brand-primary text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-brand-primary/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                  >
                                     Investigate <i className="fa-solid fa-magnifying-glass"></i>
                                  </button>
                                  <button 
                                    onClick={() => resolveReport(r.$id, 'resolved')} 
                                    disabled={r.status === 'resolved' || resolvingReportId === r.$id}
                                    className="grow py-4 px-6 bg-brand-primary text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-brand-primary/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                  >
                                     Finalize Case <i className="fa-solid fa-check-double"></i>
                                  </button>
                               </div>
                           </div>
                        ))}
                        {reports.length === 0 && <p className="py-20 text-center uppercase font-black text-slate-200 tracking-widest">No conflict data in registry.</p>}
                     </div>
                  </div>
               )}

               {activeTab === 'network' && (
                  <div className="space-y-12">
                     <div className="flex items-end justify-between border-b-2 border-slate-50 pb-8">
                        <div className="flex items-center gap-4">
                           <span className="text-4xl font-black text-slate-100 tracking-tighter">04</span>
                           <h2 className="text-3xl font-black text-brand-primary uppercase tracking-tighter">Network Topology</h2>
                        </div>
                        <p className="text-[10px] font-black uppercase text-brand-primary tracking-widest italic leading-none">Healthy Status</p>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="bg-slate-50/50 p-10 rounded-[48px] border border-slate-100 space-y-6">
                           <div className="w-14 h-14 bg-brand-primary rounded-2xl flex items-center justify-center text-white shadow-xl">
                              <i className="fa-solid fa-users text-xl"></i>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Scholar Density</p>
                              <h5 className="text-3xl font-black text-brand-primary tracking-tighter">{users.length}</h5>
                           </div>
                        </div>
                        <div className="bg-slate-50/50 p-10 rounded-[48px] border border-slate-100 space-y-6">
                           <div className="w-14 h-14 bg-brand-primary rounded-2xl flex items-center justify-center text-white shadow-xl">
                              <i className="fa-solid fa-boxes-stacked text-xl"></i>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Asset Volume</p>
                              <h5 className="text-3xl font-black text-brand-primary tracking-tighter">{products.length}</h5>
                           </div>
                        </div>
                        <div className="bg-slate-50/50 p-10 rounded-[48px] border border-slate-100 space-y-6">
                           <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-xl">
                              <i className="fa-solid fa-bolt text-xl"></i>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Alert Trigger Rate</p>
                              <h5 className="text-3xl font-black text-brand-primary tracking-tighter">{reports.length}</h5>
                           </div>
                        </div>
                        <div className="bg-brand-primary p-10 rounded-[48px] shadow-2xl space-y-6 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
                           <div className="w-14 h-14 bg-brand-surface0 rounded-2xl flex items-center justify-center text-brand-primary shadow-xl">
                              <i className="fa-solid fa-shield-halved text-xl"></i>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Hub Security</p>
                              <h5 className="text-3xl font-black text-white tracking-tighter">LOCKED</h5>
                           </div>
                        </div>
                     </div>

                     <div className="bg-brand-primary p-12 md:p-16 rounded-[64px] shadow-2xl relative overflow-hidden text-center md:text-left">
                        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,rgba(20,184,166,0.1),transparent)]"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                           <div className="space-y-6">
                              <h4 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">Administrative <br /> Synchronization.</h4>
                              <p className="text-indigo-500/60 font-medium text-sm leading-relaxed max-w-md italic">The UI DLC Hub control sector is fully operational. All scholarly transactions, asset listings, and conflict resolutions are being audited in real-time by the administrative protocol.</p>
                           </div>
                           <button onClick={() => fetchAdminData()} className="px-10 py-6 bg-brand-primary text-white rounded-[28px] font-black text-[12px] uppercase tracking-widest shadow-2xl shadow-indigo-800/40 hover:brightness-110 active:scale-95 transition-all">Recalibrate Registry</button>
                        </div>
                     </div>
                  </div>
               )}
            </div>
         )}
      </div>
    </div>
  );
};

export default AdminDashboard;
