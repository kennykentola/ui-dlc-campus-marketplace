
import React, { useState, useEffect } from "react";
import { useAuth } from "../App";
import {
  Product,
  Review,
  UserProfile,
  ProductStatus,
  SellerStatus,
  NotificationSettings,
  Transaction,
  TransactionStatus
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
        finalAvatarUrl = storage.getFileView(import.meta.env.VITE_APPWRITE_BUCKET_ID, fileId).toString();
      }

      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        "profiles",
        user.$id || user.userId,
        {
          ...editForm,
          notificationSettings: JSON.stringify(editForm.notificationSettings),
          avatarUrl: finalAvatarUrl,
          updatedAt: new Date().toISOString(),
        },
      );
      refreshUser();
      setIsEditing(false);
      alert("Profile nodes updated!");
    } catch (error) { alert("Update execution failed."); }
  };

  const handleToggleNotification = (key: keyof NotificationSettings) => {
    setEditForm((prev) => ({
      ...prev,
      notificationSettings: { ...prev.notificationSettings, [key]: !prev.notificationSettings[key] },
    }));
  };

  const handleUnblockUser = async (userId: string) => {
    if (!user) return;
    try {
      const updatedBlockedIds = (user.blockedUserIds || []).filter((id) => id !== userId);
      await databases.updateDocument(import.meta.env.VITE_APPWRITE_DATABASE_ID, "profiles", user.$id || user.userId, { blockedUserIds: updatedBlockedIds, updatedAt: new Date().toISOString() });
      refreshUser();
    } catch (error) { alert("Unblock failed."); }
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !docPreview) return;
    setIsUploadingDoc(true);
    try {
      const file = await fetch(docPreview).then((r) => r.blob());
      const fileId = ID.unique();
      await storage.createFile(import.meta.env.VITE_APPWRITE_BUCKET_ID, fileId, new File([file], "verification-doc.jpg", { type: "image/jpeg" }));
      await databases.updateDocument(import.meta.env.VITE_APPWRITE_DATABASE_ID, "profiles", user.$id || user.userId, {
        sellerStatus: SellerStatus.PENDING,
        updatedAt: new Date().toISOString(),
      });
      refreshUser();
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

  const stats = [
    { label: "Listings", value: myProducts.length },
    { label: "History", value: transactions.length },
    { label: "Reputation", value: user.averageRating || "New" },
  ];

  const sectionHeadingClass = "text-2xl font-black text-brand-primary uppercase tracking-tighter";
  const sectionSubtleClass = "text-[10px] text-slate-400 font-bold uppercase tracking-widest";
  const emptyStateClass = "rounded-[40px] border border-dashed border-slate-100 bg-slate-50/50 px-6 py-20 text-center space-y-4";

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fadeIn pb-40 pt-16 px-6">
      
      {/* Profile Identity Deck */}
      <div className="relative overflow-hidden rounded-[56px] border border-slate-50 bg-white p-10 md:p-14 shadow-[0_40px_100px_-20px_rgba(0,51,102,0.08)] flex flex-col lg:flex-row lg:items-center justify-between gap-12">
         <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="relative group">
               <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=300&background=003366&color=ffffff`} className="w-36 h-36 rounded-[48px] border-8 border-slate-50 shadow-xl object-cover transition-all group-hover:scale-105" alt="Av" />
               <label htmlFor="av-up" className="absolute -bottom-2 -right-2 w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center text-white border-4 border-white cursor-pointer shadow-lg hover:rotate-12 transition-all">
                  <i className="fa-solid fa-camera"></i>
                  <input id="av-up" type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
               </label>
            </div>

            <div className="text-center md:text-left space-y-4">
               <div className="flex items-center justify-center md:justify-start gap-3">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${user.sellerStatus === SellerStatus.VERIFIED ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-slate-100 text-slate-400'}`}>
                     {user.sellerStatus === SellerStatus.VERIFIED ? 'Verified Scholar' : 'Registry Pending'}
                  </span>
                  <span className="px-4 py-1.5 bg-brand-primary/5 text-brand-primary rounded-full text-[9px] font-black uppercase tracking-widest">{user.role}</span>
               </div>
               <h1 className="text-5xl font-black text-brand-primary tracking-tighter uppercase leading-none">{user.name}</h1>
               <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>{user.department}</span>
                  <div className="w-1.5 h-1.5 bg-slate-100 rounded-full"></div>
                  <span>{user.level}L</span>
                  <div className="w-1.5 h-1.5 bg-slate-100 rounded-full"></div>
                  <span>{user.matricNumber}</span>
               </div>
            </div>
         </div>

         {/* Metrics Block */}
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:w-[420px]">
            {stats.map(s => (
               <div key={s.label} className="bg-slate-50/50 border border-slate-100 p-6 rounded-[32px] text-center hover:bg-white hover:border-brand-primary/20 transition-all group">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-3 group-hover:text-brand-primary">{s.label}</p>
                  <p className="text-2xl font-black text-brand-primary tracking-tighter">{s.value}</p>
               </div>
            ))}
            <div className="sm:col-span-3 flex justify-end pt-4">
               <button onClick={() => setIsEditing(!isEditing)} className="px-10 py-5 bg-brand-primary text-white rounded-[24px] font-black text-[12px] uppercase tracking-widest shadow-2xl shadow-brand-primary/10 hover:brightness-110 active:scale-95 transition-all">
                  {isEditing ? 'Cancel Audit' : 'Update Profile'}
               </button>
            </div>
         </div>
      </div>

      {/* Profile Tab Switcher */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 p-3 bg-slate-50 border border-slate-100 rounded-[32px]">
         {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`shrink-0 flex items-center gap-4 px-8 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-400 hover:text-brand-primary'}`}>
               <i className={`fa-solid ${t.icon} ${activeTab === t.id ? 'text-brand-primary' : 'opacity-40'}`}></i>
               {t.label}
            </button>
         ))}
      </div>

      {/* Content Engine */}
      <div className="animate-slideUp min-h-[500px]">
         {activeTab === 'listings' && (
            <div className="space-y-12">
               <div className="flex items-end justify-between px-4">
                  <div className="space-y-2">
                     <p className={sectionSubtleClass}>Asset Registry Feed</p>
                     <h2 className={sectionHeadingClass}>Your Exported Scholarly Nodes.</h2>
                  </div>
                  <Link to="/sell" className="text-brand-primary text-[10px] font-black uppercase tracking-[0.2em] border-b-2 border-brand-primary/20 hover:border-brand-primary transition-all">+ Export New Asset</Link>
               </div>
               {myProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                     {myProducts.map(p => <ProductCard key={p.$id} product={p} onDelete={loadData} />)}
                  </div>
               ) : (
                  <div className={emptyStateClass}>
                     <i className="fa-solid fa-cloud-arrow-up text-4xl text-slate-100"></i>
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Registry Sector is empty.</p>
                  </div>
               )}
            </div>
         )}

         {activeTab === 'favorites' && (
            <div className="space-y-12">
               <div className="px-4 space-y-2">
                  <p className={sectionSubtleClass}>Wishlist Protocol</p>
                  <h2 className={sectionHeadingClass}>Saved Scholarly Resources.</h2>
               </div>
               {favorites.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                     {favorites.map(p => <ProductCard key={p.$id} product={p} />)}
                  </div>
               ) : (
                  <div className={emptyStateClass}>
                     <i className="fa-solid fa-heart-crack text-4xl text-slate-100"></i>
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No saved assets in this node.</p>
                  </div>
               )}
            </div>
         )}

         {activeTab === 'transactions' && (
            <div className="space-y-12">
               <div className="px-4 space-y-2">
                  <p className={sectionSubtleClass}>Deal History Log</p>
                  <h2 className={sectionHeadingClass}>Immutable Trade Registry.</h2>
               </div>
               {transactions.length > 0 ? (
                  <div className="space-y-6">
                     {transactions.map(tx => (
                        <div key={tx.$id} className="bg-white border border-slate-50 p-6 rounded-[32px] flex items-center justify-between group hover:border-brand-primary/20 transition-all shadow-sm">
                           <div className="flex items-center gap-6">
                              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-brand-primary group-hover:bg-brand-surface transition-all">
                                 <i className={`fa-solid ${tx.status === TransactionStatus.COMPLETED ? 'fa-check-double text-brand-primary' : 'fa-clock opacity-20'}`}></i>
                              </div>
                              <div>
                                 <h4 className="text-sm font-black text-brand-primary uppercase">{tx.productName}</h4>
                                 <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1 italic">Status: <span className="text-brand-primary">{tx.status}</span></p>
                              </div>
                           </div>
                            <div className="flex items-center gap-3">
                               {tx.paymentProofUrl && (
                                  <a 
                                    href={tx.paymentProofUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-brand-primary transition-all border border-slate-100 dark:border-slate-800 shadow-sm"
                                    title="View Payment Evidence"
                                  >
                                     <i className="fa-solid fa-file-invoice text-lg"></i>
                                  </a>
                               )}
                               <Link to="/transactions" className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-200 hover:text-brand-primary transition-colors border border-slate-100 dark:border-slate-800"><i className="fa-solid fa-chevron-right"></i></Link>
                            </div>
                         </div>
                     ))}
                  </div>
               ) : (
                  <div className={emptyStateClass}>
                     <i className="fa-solid fa-receipt text-4xl text-slate-100"></i>
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No trade logs found.</p>
                  </div>
               )}
            </div>
         )}

         {activeTab === 'reviews' && (
            <div className="space-y-12">
               <div className="px-4 space-y-2">
                  <p className={sectionSubtleClass}>Reputation Audit</p>
                  <h2 className={sectionHeadingClass}>Scholarly Activity Feedback.</h2>
               </div>
               {myReviews.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {myReviews.map(r => (
                        <div key={r.$id} className="bg-white border border-slate-50 p-8 rounded-[40px] shadow-sm space-y-4">
                           <div className="flex gap-1 text-brand-primary">
                              {[...Array(5)].map((_, i) => <i key={i} className={`fa-solid fa-star text-[9px] ${i < r.rating ? 'opacity-100' : 'opacity-10'}`}></i>)}
                           </div>
                           <p className="text-xs font-medium text-slate-600 italic leading-relaxed">"{r.comment}"</p>
                           <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest pt-2 border-t border-slate-50">BY: {r.buyerName}</p>
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className={emptyStateClass}>
                     <i className="fa-solid fa-star-half-stroke text-4xl text-slate-100"></i>
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No feedback received in this sector.</p>
                  </div>
               )}
            </div>
         )}

          {activeTab === 'verification' && (
            <div className="min-h-100 animate-fadeIn max-w-2xl mx-auto py-12">
               {user.sellerStatus === SellerStatus.VERIFIED ? (
                 <div className="space-y-12">
                    <div className="text-center space-y-4">
                      <h2 className="text-3xl font-black text-brand-ink dark:text-white uppercase tracking-tighter">Verification Center</h2>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">Your identity is secure within the UI DLC Registry.</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-12 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-[0_40px_100px_-20px_rgba(0,51,102,0.1)] text-center space-y-8 transition-colors">
                      <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center text-4xl mx-auto shadow-inner">
                        <i className="fa-solid fa-circle-check"></i>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-2xl font-black text-brand-ink dark:text-white uppercase tracking-tight">Verified Seller</h3>
                        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto text-sm leading-relaxed">
                          Congratulations! Your student status is verified. You have full access to list items and exchange goods in the hub.
                        </p>
                      </div>
                      <div className="pt-6">
                        <button onClick={() => setActiveTab('listings')} className="bg-brand-primary text-white px-10 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-indigo-100 dark:shadow-none hover:brightness-110 active:scale-95 transition-all">
                          View My Listings
                        </button>
                      </div>
                    </div>
                 </div>
               ) : user.sellerStatus === SellerStatus.PENDING ? (
                 <div className="bg-slate-50 dark:bg-slate-900/50 p-16 rounded-[48px] border-2 border-dashed border-slate-100 dark:border-slate-800 text-center space-y-8">
                    <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-full flex items-center justify-center text-3xl mx-auto animate-pulse">
                      <i className="fa-solid fa-hourglass-half"></i>
                    </div>
                    <div className="space-y-3">
                       <h3 className="text-2xl font-black text-brand-primary dark:text-white uppercase tracking-tighter">Audit in Progress</h3>
                       <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em]">Registry protocol: UIDLC-VERIFY-PENDING</p>
                       <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
                         Our academic auditors are reviewing your credentials. This typically takes 12-24 scholarly hours.
                       </p>
                    </div>
                 </div>
               ) : (
                 <div className="space-y-12">
                    <div className="text-center space-y-4">
                      <h2 className="text-3xl font-black text-brand-ink dark:text-white uppercase tracking-tighter">Verification Center</h2>
                      <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed max-w-lg mx-auto">
                        To maintain a safe community, all scholars must verify their student status by uploading a valid University of Ibadan School ID card.
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-12 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-xl space-y-10">
                      <form onSubmit={handleSubmitVerification} className="space-y-10">
                        <label className={`aspect-video rounded-[32px] border-3 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer group ${docPreview ? 'border-brand-primary bg-brand-surface dark:bg-indigo-950/20' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 group-hover:border-indigo-500'}`}>
                           {docPreview ? (
                             <img src={docPreview} className="w-full h-full object-cover rounded-[30px]" alt="ID Preview" />
                           ) : (
                             <div className="text-center space-y-4">
                               <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-3xl flex items-center justify-center text-slate-200 dark:text-slate-600 shadow-sm mx-auto group-hover:scale-110 transition-transform">
                                 <i className="fa-solid fa-id-card text-2xl"></i>
                               </div>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transmit Scholarly ID Node</p>
                             </div>
                           )}
                           <input type="file" className="hidden" accept="image/*" onChange={e => {
                             if(e.target.files?.[0]) {
                               const reader = new FileReader();
                               reader.onloadend = () => setDocPreview(reader.result as string);
                               reader.readAsDataURL(e.target.files[0]);
                             }
                           }} />
                        </label>
                        
                        <div className="flex flex-col gap-6">
                           <div className="p-6 bg-brand-surface dark:bg-brand-primary/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/20 flex items-center gap-4">
                              <i className="fa-solid fa-shield-halved text-brand-primary text-xl"></i>
                              <p className="text-[10px] text-brand-primary dark:text-blue-400 font-bold uppercase leading-relaxed tracking-wider">
                                Your ID is encrypted and only used for registry verification. It will not be shared with other students.
                              </p>
                           </div>
                           <button 
                             type="submit" 
                             disabled={!docPreview || isUploadingDoc}
                             className="w-full py-6 bg-brand-primary text-white rounded-[24px] font-black text-[12px] uppercase tracking-widest shadow-2xl shadow-brand-primary/10 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                           >
                             {isUploadingDoc ? 'Transmitting Node...' : 'Submit ID for Scholar Verification'}
                           </button>
                        </div>
                      </form>
                    </div>
                 </div>
               )}
            </div>
          )}
        </div>

      {/* Editor Hub Fragment */}
      {isEditing && (
         <div className="fixed inset-0 z-100 flex items-center justify-center p-6 animate-fadeIn">
            <div className="absolute inset-0 bg-brand-primary/40 backdrop-blur-xl" onClick={() => setIsEditing(false)}></div>
            <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[56px] p-10 md:p-14 shadow-2xl relative z-10 animate-slideUp space-y-12 no-scrollbar">
               <div className="flex items-center justify-between border-b border-slate-100 pb-8">
                  <h2 className="text-3xl font-black text-brand-primary uppercase tracking-tighter leading-none">Profile Audit Protocol.</h2>
                  <button onClick={() => setIsEditing(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-all"><i className="fa-solid fa-xmark"></i></button>
               </div>
               
               <form onSubmit={handleUpdateProfile} className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="space-y-4">
                        <p className={sectionSubtleClass}>Scholar Nomenclature</p>
                        <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-brand-primary outline-none focus:bg-white focus:border-brand-primary shadow-sm" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required />
                     </div>
                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                           <p className={sectionSubtleClass}>Department sector</p>
                           <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-xs font-black text-brand-primary outline-none" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})}>
                              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                           </select>
                        </div>
                        <div className="space-y-4">
                           <p className={sectionSubtleClass}>Level Code</p>
                           <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-xs font-black text-brand-primary outline-none" value={editForm.level} onChange={e => setEditForm({...editForm, level: e.target.value})}>
                              {LEVELS.map(l => <option key={l} value={l}>{l}L</option>)}
                           </select>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-slate-50">
                     <div className="space-y-8">
                        <h3 className="text-xs font-black text-brand-primary uppercase tracking-widest">Digital Terminals</h3>
                        <div className="space-y-4">
                           <input type="tel" placeholder="WhatsApp Number" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-brand-primary outline-none focus:bg-white focus:border-brand-primary shadow-sm" value={editForm.phoneNumber} onChange={e => setEditForm({...editForm, phoneNumber: e.target.value})} />
                           <input type="text" placeholder="OPay / PalmPay Handles" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-brand-primary outline-none focus:bg-white focus:border-brand-primary shadow-sm" value={editForm.fintechHandles} onChange={e => setEditForm({...editForm, fintechHandles: e.target.value})} />
                        </div>
                     </div>
                     <div className="space-y-8">
                        <h3 className="text-xs font-black text-brand-primary uppercase tracking-widest">Bank Node Details</h3>
                        <div className="space-y-4">
                           <input type="text" placeholder="Bank Name" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-brand-primary outline-none focus:bg-white focus:border-brand-primary shadow-sm" value={editForm.bankName} onChange={e => setEditForm({...editForm, bankName: e.target.value})} />
                           <div className="grid grid-cols-2 gap-4">
                              <input type="text" placeholder="Account Number" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-brand-primary outline-none focus:bg-white focus:border-brand-primary shadow-sm" value={editForm.accountNumber} onChange={e => setEditForm({...editForm, accountNumber: e.target.value})} />
                              <input type="text" placeholder="Account Name" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-brand-primary outline-none focus:bg-white focus:border-brand-primary shadow-sm" value={editForm.accountName} onChange={e => setEditForm({...editForm, accountName: e.target.value})} />
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="pt-10 flex gap-6">
                     <button type="button" onClick={() => setIsEditing(false)} className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-rose-500 transition-all border border-transparent hover:border-rose-100 rounded-2xl">Abort Deployment</button>
                     <button type="submit" className="grow py-5 bg-brand-primary text-white rounded-[24px] font-black text-[12px] uppercase tracking-widest shadow-2xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all">Execute Audit Sync</button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

export default Profile;
