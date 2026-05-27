import React, { useState, useEffect } from "react";
import { useAuth } from "../App";
import {
  Product,
  Review,
  UserProfile,
  SellerStatus,
  NotificationSettings,
  Transaction,
} from "../types";
import { databases, storage } from "../lib/appwrite";
import { Query, ID } from "appwrite";
import ProductCard from "../components/ProductCard";
import { DEPARTMENTS, LEVELS } from "../constants";
import { useNavigate, Link } from "react-router-dom";

const Profile: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<
    "listings" | "reviews" | "favorites" | "transactions" | "blocked" | "verification"
  >("listings");
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  type EditableProfile = Omit<Partial<UserProfile>, "notificationSettings"> & {
    notificationSettings: NotificationSettings;
  };

  const [editForm, setEditForm] = useState<EditableProfile>({
    name: "",
    department: "",
    level: "",
    phoneNumber: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
    fintechHandles: "",
    avatarUrl: "",
    notificationSettings: {
      emailMessages: true,
      emailReviews: true,
      emailVerification: true,
    },
  });

  const loadData = async () => {
    if (user) {
      try {
        const productsResponse = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          "products",
          [Query.equal("sellerId", user.userId)],
        );
        setMyProducts(productsResponse.documents as unknown as Product[]);

        const reviewsResponse = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          "reviews",
          [Query.equal("sellerId", user.userId)],
        );
        setMyReviews(reviewsResponse.documents as unknown as Review[]);

        if (user.favorites && user.favorites.length > 0) {
           const favResponse = await databases.listDocuments(
             import.meta.env.VITE_APPWRITE_DATABASE_ID,
             "products",
             [Query.equal("$id", user.favorites)]
           );
           setFavorites(favResponse.documents as unknown as Product[]);
        } else {
           setFavorites([]);
        }

        const txResponse = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          "transactions",
          [Query.or([
            Query.equal("buyerId", user.userId),
            Query.equal("sellerId", user.userId)
          ]), Query.orderDesc("updatedAt")]
        );
        setTransactions(txResponse.documents as unknown as Transaction[]);

        if (user.blockedUserIds && user.blockedUserIds.length > 0) {
          const blockedProfiles: UserProfile[] = [];
          for (const blockedId of user.blockedUserIds) {
            try {
              const profileDoc = await databases.getDocument(
                import.meta.env.VITE_APPWRITE_DATABASE_ID,
                "profiles",
                blockedId,
              );
              blockedProfiles.push(profileDoc as unknown as UserProfile);
            } catch (error) {}
          }
          setBlockedUsers(blockedProfiles);
        } else {
          setBlockedUsers([]);
        }

        setEditForm({
          name: user.name,
          department: user.department,
          level: user.level,
          phoneNumber: user.phoneNumber || "",
          bankName: user.bankName || "",
          accountNumber: user.accountNumber || "",
          accountName: user.accountName || "",
          fintechHandles: user.fintechHandles || "",
          avatarUrl: user.avatarUrl || "",
          notificationSettings: (() => {
            if (typeof user.notificationSettings === "string" && user.notificationSettings.length > 0) {
              try { return JSON.parse(user.notificationSettings) as NotificationSettings; } catch (e) {}
            }
            const existing = typeof user.notificationSettings === "object" ? user.notificationSettings : null;
            return (existing as NotificationSettings) || { emailMessages: true, emailReviews: true, emailVerification: true };
          })(),
        });
        setImagePreview(user.avatarUrl || null);
      } catch (error) {
        console.error("Error loading profile data:", error);
      }
    }
  };

  useEffect(() => { loadData(); }, [user, activeTab]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      let finalAvatarUrl = user.avatarUrl;
      if (imagePreview && imagePreview.startsWith("data:")) {
        const fileBlob = await fetch(imagePreview).then((r) => r.blob());
        const fileId = ID.unique();
        await storage.createFile(import.meta.env.VITE_APPWRITE_BUCKET_ID, fileId, new File([fileBlob], "avatar.jpg", { type: "image/jpeg" }));
        finalAvatarUrl = `https://cloud.appwrite.io/v1/storage/buckets/${import.meta.env.VITE_APPWRITE_BUCKET_ID}/files/${fileId}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`;
      }

      const updateData = { ...editForm, avatarUrl: finalAvatarUrl, notificationSettings: JSON.stringify(editForm.notificationSettings) };

      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        "profiles",
        user.$id || user.userId,
        updateData,
      );
      
      await refreshUser();
      setIsEditing(false);
      alert("Profile updated successfully");
    } catch (error) {
      console.error("Profile update failed:", error);
      alert("Profile update failed.");
    }
  };

  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
         const reader = new FileReader();
         reader.onloadend = () => setDocPreview(reader.result as string);
         reader.readAsDataURL(file);
      } else {
         setDocPreview("pdf-doc");
      }
    }
  };

  const handleVerificationSubmit = async () => {
    if (!user || !docPreview) return;
    try {
      setIsUploadingDoc(true);
      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        "profiles",
        user.$id || user.userId,
        { sellerStatus: SellerStatus.PENDING }
      );
      await refreshUser();
      setIsUploadingDoc(false);
      setDocPreview(null);
      alert("Verification protocol initiated.");
    } catch (error) { setIsUploadingDoc(false); }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText === "DELETE ACCOUNT") {
      try {
        if (user) await databases.deleteDocument(import.meta.env.VITE_APPWRITE_DATABASE_ID, "profiles", user.$id || user.userId);
        logout();
        navigate("/login");
      } catch (error) { alert("Account clearance failed."); }
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  if (!user) return null;

  const tabs = [
    { id: "listings", label: "Registry", icon: "fa-shopping-bag" },
    { id: "reviews", label: "Activity", icon: "fa-star" },
    { id: "favorites", label: "Wishlist", icon: "fa-heart" },
    { id: "transactions", label: "History", icon: "fa-receipt" },
    { id: "blocked", label: "Privacy", icon: "fa-user-shield" },
    { id: "verification", label: "Verification", icon: "fa-id-card" },
  ] as const;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col font-sans animate-fadeIn">
      {/* Top Header */}
      <header className="bg-[#003366] text-white flex items-center justify-between px-6 py-4 shadow-md z-20 relative">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1 shadow-inner">
            <div className="w-full h-full bg-yellow-500 rounded flex items-center justify-center border-2 border-[#003366]">
              <span className="text-[#003366] font-black text-xs">DLC</span>
            </div>
          </div>
          <h1 className="text-xl md:text-2xl font-medium tracking-wide">
            {user.role === "admin" ? "Administrator Dashboard" : "Student Portal"}
          </h1>
        </div>
        <Link to="/" className="text-white hover:text-slate-300 transition-colors px-4 py-2 text-sm font-bold bg-white/10 rounded-lg">
          Exit Portal
        </Link>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar */}
        <aside className="w-72 bg-[#003366] text-white hidden lg:flex flex-col py-8 shadow-xl z-10 shrink-0 overflow-y-auto no-scrollbar">
          
          {/* USER PROFILE IN SIDEBAR */}
          <div className="px-6 flex flex-col items-center text-center border-b border-white/10 pb-6 mb-6">
            <div className="relative group mb-4">
               <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=300&background=003366&color=ffffff`} className="w-24 h-24 rounded-full border-4 border-white/20 shadow-xl object-cover transition-all group-hover:scale-105" alt="Avatar" />
               <label htmlFor="av-up" className="absolute bottom-0 right-0 w-8 h-8 bg-brand-secondary rounded-full flex items-center justify-center text-white border-2 border-[#003366] cursor-pointer shadow-lg hover:scale-110 transition-all">
                  <i className="fa-solid fa-camera text-xs"></i>
                  <input id="av-up" type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} aria-label="Upload avatar image" />
               </label>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight leading-tight mb-1">{user.name}</h2>
            <div className="flex items-center gap-2 mb-4">
               <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${user.sellerStatus === SellerStatus.VERIFIED ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-white/50'}`}>
                  {user.sellerStatus === SellerStatus.VERIFIED ? 'Verified Scholar' : 'Unverified'}
               </span>
               <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-[9px] font-bold uppercase tracking-wider">{user.role}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 w-full mt-2 mb-4">
               <div className="bg-white/5 rounded-lg py-2">
                 <p className="text-[9px] text-white/50 uppercase tracking-widest">Listings</p>
                 <p className="font-bold text-base">{myProducts.length}</p>
               </div>
               <div className="bg-white/5 rounded-lg py-2">
                 <p className="text-[9px] text-white/50 uppercase tracking-widest">History</p>
                 <p className="font-bold text-base">{transactions.length}</p>
               </div>
               <div className="bg-white/5 rounded-lg py-2">
                 <p className="text-[9px] text-white/50 uppercase tracking-widest">Rating</p>
                 <p className="font-bold text-base">{user.averageRating || "New"}</p>
               </div>
            </div>
            
            <button onClick={() => setIsEditing(!isEditing)} className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors">
               {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </div>

          <nav className="flex-1 space-y-2 px-4">
             {tabs.map(t => (
                <button 
                  key={t.id} 
                  onClick={() => { setActiveTab(t.id as any); setIsEditing(false); }} 
                  className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-sm font-medium transition-all ${activeTab === t.id && !isEditing ? 'bg-white/20 shadow-inner text-white' : 'hover:bg-white/10 text-white/70'}`}
                >
                  <i className={`fa-solid ${t.icon} w-5`}></i> {t.label}
                </button>
             ))}
             
             <div className="pt-8 pb-4">
                <div className="h-px w-full bg-white/10"></div>
             </div>
             <button onClick={logout} className="w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-sm font-medium hover:bg-rose-500/20 text-rose-300 transition-all">
                <i className="fa-solid fa-right-from-bracket w-5"></i> Logout
             </button>
          </nav>
        </aside>

        {/* Mobile Navigation (Tabs) */}
        <div className="lg:hidden absolute top-0 left-0 w-full bg-[#003366] flex overflow-x-auto p-2 gap-2 shadow-md z-10 no-scrollbar">
           {tabs.map(t => (
              <button 
                key={t.id}
                onClick={() => { setActiveTab(t.id as any); setIsEditing(false); }}
                className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${activeTab === t.id && !isEditing ? 'bg-white/20 text-white' : 'text-white/70'}`}
              >
                 {t.label}
              </button>
           ))}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 bg-slate-100 p-4 md:p-8 overflow-y-auto mt-12 lg:mt-0">
          
          <div className="max-w-5xl mx-auto space-y-8 pb-20">
             
             {isEditing ? (
               <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 animate-slideUp">
                  <h2 className="text-xl font-bold text-[#003366] mb-6 border-b border-slate-100 pb-3">Edit Profile & Settings</h2>
                  
                  <form onSubmit={handleUpdateProfile} className="space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                      
                      {/* Personal Identification block */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                           <i className="fa-solid fa-id-badge text-brand-primary"></i>
                           <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Personal Identification</h3>
                        </div>
                        <div className="space-y-2">
                           <label htmlFor="edit-name" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                           <input id="edit-name" type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm font-medium text-slate-700 focus:outline-none focus:border-brand-primary transition-colors" value={editForm.name || ""} onChange={e => setEditForm({...editForm, name: e.target.value})} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <label htmlFor="edit-dept" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Department</label>
                              <select id="edit-dept" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm font-medium text-slate-700 focus:outline-none focus:border-brand-primary" value={editForm.department || ""} onChange={e => setEditForm({...editForm, department: e.target.value})} required>
                                 <option value="" disabled>Select Dept</option>
                                 {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                           </div>
                           <div className="space-y-2">
                              <label htmlFor="edit-level" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Level</label>
                              <select id="edit-level" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm font-medium text-slate-700 focus:outline-none focus:border-brand-primary" value={editForm.level || ""} onChange={e => setEditForm({...editForm, level: e.target.value})} required>
                                 <option value="" disabled>Select Level</option>
                                 {LEVELS.map(l => <option key={l} value={l}>{l}L</option>)}
                              </select>
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label htmlFor="edit-phone" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Phone Number</label>
                           <input id="edit-phone" type="tel" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm font-medium text-slate-700 focus:outline-none focus:border-brand-primary" value={editForm.phoneNumber || ""} onChange={e => setEditForm({...editForm, phoneNumber: e.target.value})} required placeholder="080..." />
                        </div>
                      </div>

                      {/* Financial Protocols block */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                           <i className="fa-solid fa-building-columns text-brand-primary"></i>
                           <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Financial Protocols</h3>
                        </div>
                        <div className="space-y-2">
                           <label htmlFor="edit-bank" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bank Name</label>
                           <input id="edit-bank" type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm font-medium text-slate-700 focus:outline-none focus:border-brand-primary" value={editForm.bankName || ""} onChange={e => setEditForm({...editForm, bankName: e.target.value})} placeholder="e.g. Guarantee Trust Bank" />
                        </div>
                        <div className="space-y-2">
                           <label htmlFor="edit-acc-num" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Account Number</label>
                           <input id="edit-acc-num" type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm font-medium text-slate-700 focus:outline-none focus:border-brand-primary" value={editForm.accountNumber || ""} onChange={e => setEditForm({...editForm, accountNumber: e.target.value})} placeholder="10 digit number" />
                        </div>
                        <div className="space-y-2">
                           <label htmlFor="edit-acc-name" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Account Name</label>
                           <input id="edit-acc-name" type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm font-medium text-slate-700 focus:outline-none focus:border-brand-primary" value={editForm.accountName || ""} onChange={e => setEditForm({...editForm, accountName: e.target.value})} placeholder="Exact name on account" />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-4 pt-8 border-t border-slate-100">
                       <button type="button" onClick={() => setIsEditing(false)} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-200 transition-colors">Cancel</button>
                       <button type="submit" className="px-8 py-4 bg-[#003366] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#004080] transition-colors shadow-lg">Save Configuration</button>
                    </div>
                  </form>
               </div>
             ) : (
               <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 animate-slideUp">
                  
                  {/* Dynamic Tab Content rendering - adapted to match AdminDashboard styling */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                     <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{activeTab === 'listings' ? 'Asset Registry Feed' : activeTab === 'reviews' ? 'Performance Metrics' : activeTab}</p>
                        <h2 className="text-xl font-bold text-[#003366] capitalize">{activeTab} Details</h2>
                     </div>
                     {activeTab === 'listings' && (
                        <Link to="/sell" className="px-4 py-2 bg-[#008080] text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:brightness-110 shadow-sm transition-all flex items-center gap-2">
                           <i className="fa-solid fa-plus-circle"></i> List Asset
                        </Link>
                     )}
                  </div>

                  {activeTab === 'listings' && (
                     <div className="space-y-6">
                        {myProducts.length > 0 ? (
                           <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                              {myProducts.map(p => <ProductCard key={p.$id} product={p} onDelete={async () => {
                                 if(window.confirm("Delete this listing permanently?")) {
                                    try {
                                       await databases.deleteDocument(import.meta.env.VITE_APPWRITE_DATABASE_ID, "products", p.$id);
                                       loadData();
                                    } catch(e) { alert("Deletion failed"); }
                                 }
                              }} />)}
                           </div>
                        ) : (
                           <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center space-y-4">
                              <i className="fa-solid fa-cloud-arrow-up text-4xl text-slate-300"></i>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registry Sector is empty.</p>
                           </div>
                        )}
                     </div>
                  )}

                  {activeTab === 'reviews' && (
                     <div className="space-y-4">
                        {myReviews.length > 0 ? (
                           myReviews.map(r => (
                              <div key={r.$id} className="p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                                 <div className="flex items-center gap-2 mb-3">
                                    {[...Array(5)].map((_,i) => <i key={i} className={`fa-solid fa-star text-xs ${i < r.rating ? "text-orange-400" : "text-slate-200"}`}></i>)}
                                 </div>
                                 <p className="text-slate-600 text-sm italic">"{r.comment}"</p>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">Buyer ID: {r.buyerId.substring(0,8)}</p>
                              </div>
                           ))
                        ) : (
                           <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No reviews logged yet.</p>
                           </div>
                        )}
                     </div>
                  )}

                  {activeTab === 'favorites' && (
                     <div className="space-y-6">
                        {favorites.length > 0 ? (
                           <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                              {favorites.map(p => <ProductCard key={p.$id} product={p} />)}
                           </div>
                        ) : (
                           <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wishlist is empty.</p>
                           </div>
                        )}
                     </div>
                  )}

                  {activeTab === 'transactions' && (
                     <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                           <thead>
                              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                 <th className="pb-4 px-2">TX ID</th>
                                 <th className="pb-4 px-2">Role</th>
                                 <th className="pb-4 px-2">Status</th>
                                 <th className="pb-4 px-2 text-right">Actions</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                              {transactions.map(tx => {
                                 const isSeller = tx.sellerId === user.userId;
                                 return (
                                    <tr key={tx.$id} className="hover:bg-slate-50 transition-colors">
                                       <td className="py-4 px-2 font-mono text-slate-500 text-xs">{tx.$id.substring(0,8)}</td>
                                       <td className="py-4 px-2">
                                          <span className={`px-2 py-1 rounded text-[10px] font-bold ${isSeller ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                             {isSeller ? 'SELLER' : 'BUYER'}
                                          </span>
                                       </td>
                                       <td className="py-4 px-2">
                                          <span className="text-xs font-bold text-slate-600">{tx.status}</span>
                                       </td>
                                       <td className="py-4 px-2 text-right">
                                          <Link to={`/checkout/${tx.$id}`} className="text-[10px] font-bold text-[#003366] hover:underline uppercase tracking-widest">Details</Link>
                                       </td>
                                    </tr>
                                 )
                              })}
                              {transactions.length === 0 && <tr><td colSpan={4} className="py-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">No transactions logged.</td></tr>}
                           </tbody>
                        </table>
                     </div>
                  )}

                  {activeTab === 'verification' && (
                     <div className="max-w-xl space-y-8">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                           <h3 className="text-sm font-bold text-[#003366] uppercase tracking-widest mb-2">Verification Status</h3>
                           <div className="flex items-center gap-4 mt-4">
                              <span className={`w-3 h-3 rounded-full ${user.sellerStatus === SellerStatus.VERIFIED ? 'bg-green-500' : user.sellerStatus === SellerStatus.PENDING ? 'bg-amber-500' : 'bg-slate-300'}`}></span>
                              <span className="text-sm font-bold text-slate-700">{user.sellerStatus}</span>
                           </div>
                           <p className="text-xs text-slate-500 mt-4 leading-relaxed">
                              Verification unlocks your ability to list items on the marketplace. Admins review uploaded documents.
                           </p>
                        </div>
                        
                        {user.sellerStatus !== SellerStatus.VERIFIED && (
                           <div className="space-y-4">
                              <h3 className="text-sm font-bold text-[#003366] uppercase tracking-widest">Submit Documents</h3>
                              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50">
                                 {docPreview ? (
                                    <div className="space-y-4">
                                       <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl"><i className="fa-solid fa-check"></i></div>
                                       <p className="text-xs font-bold text-slate-600">Document Selected</p>
                                       <button onClick={handleVerificationSubmit} disabled={isUploadingDoc} className="px-6 py-3 bg-[#003366] text-white rounded-xl text-xs font-bold uppercase tracking-widest w-full mt-4 hover:bg-[#004080] disabled:opacity-50">
                                          {isUploadingDoc ? 'Uploading...' : 'Submit to Admin'}
                                       </button>
                                    </div>
                                 ) : (
                                    <>
                                       <i className="fa-solid fa-file-pdf text-4xl text-slate-300 mb-4"></i>
                                       <p className="text-xs text-slate-500 mb-6">Upload student ID or course form (PDF/Image)</p>
                                       <label className="px-6 py-3 bg-white border border-slate-200 text-[#003366] rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-slate-50 transition-colors inline-block">
                                          Select File
                                          <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleDocSelect} aria-label="Upload verification document" />
                                       </label>
                                    </>
                                 )}
                              </div>
                           </div>
                        )}
                        
                        <div className="pt-12 border-t border-rose-100 mt-12">
                           <h3 className="text-sm font-bold text-rose-600 uppercase tracking-widest mb-4">Danger Zone</h3>
                           <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100">
                              <p className="text-xs text-rose-700 mb-6">Permanently delete your account and all associated data. This action cannot be reversed.</p>
                              {!showDeleteModal ? (
                                 <button onClick={() => setShowDeleteModal(true)} className="px-6 py-3 bg-white text-rose-600 border border-rose-200 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-colors">Initiate Clearance</button>
                              ) : (
                                 <div className="space-y-4">
                                    <input type="text" placeholder="Type DELETE ACCOUNT" aria-label="Type DELETE ACCOUNT to confirm" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} className="w-full px-4 py-3 bg-white border border-rose-200 rounded-xl text-sm focus:outline-none focus:border-rose-500" />
                                    <div className="flex gap-2">
                                       <button onClick={handleDeleteAccount} disabled={deleteConfirmText !== "DELETE ACCOUNT"} className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-rose-700 disabled:opacity-50">Confirm</button>
                                       <button onClick={() => setShowDeleteModal(false)} className="px-6 py-3 bg-white text-slate-500 rounded-xl text-xs font-bold uppercase tracking-widest border border-slate-200 hover:bg-slate-100">Cancel</button>
                                    </div>
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>
                  )}

               </div>
             )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
