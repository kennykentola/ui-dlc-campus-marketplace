import React, { useState, useEffect } from "react";
import { useAuth } from "../App";
import {
  Product,
  Review,
  UserProfile,
  ProductStatus,
  SellerStatus,
  NotificationSettings,
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
  const [myOrders, setMyOrders] = useState<Product[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<
    "listings" | "reviews" | "favorites" | "orders" | "blocked" | "verification"
  >("listings");
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // keep notificationSettings strictly as an object for internal editing
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
        // Load user's products
        const productsResponse = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID,
          [Query.equal("sellerId", user.userId)],
        );
        setMyProducts(productsResponse.documents as unknown as Product[]);

        // Load reviews for user's products
        const reviewsResponse = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_REVIEWS_COLLECTION_ID,
          [Query.equal("sellerId", user.userId)],
        );
        setMyReviews(reviewsResponse.documents as unknown as Review[]);

        // For now, favorites are not implemented in database - skip
        setFavorites([]);

        // Load orders (products bought by user)
        const ordersResponse = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID,
          [Query.equal("buyerId", user.userId)],
        );
        setMyOrders(ordersResponse.documents as unknown as Product[]);

        // Load blocked users
        if (user.blockedUserIds && user.blockedUserIds.length > 0) {
          const blockedProfiles: UserProfile[] = [];
          for (const blockedId of user.blockedUserIds) {
            try {
              const profileDoc = await databases.getDocument(
                import.meta.env.VITE_APPWRITE_DATABASE_ID,
                import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID,
                blockedId,
              );
              // The Appwrite SDK returns DefaultDocument – cast once when pushing
              blockedProfiles.push(profileDoc as unknown as UserProfile);
            } catch (error) {
              console.error(`Error loading blocked user ${blockedId}:`, error);
            }
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
            if (
              typeof user.notificationSettings === "string" &&
              user.notificationSettings.length > 0
            ) {
              try {
                return JSON.parse(
                  user.notificationSettings,
                ) as NotificationSettings;
              } catch (e) {
                // Invalid JSON, fallback to default
              }
            }
            // Return existing object or default
            const existing =
              typeof user.notificationSettings === "object"
                ? user.notificationSettings
                : null;
            return (
              (existing as NotificationSettings) || {
                emailMessages: true,
                emailReviews: true,
                emailVerification: true,
              }
            );
          })(),
        });
        setImagePreview(user.avatarUrl || null);
      } catch (error) {
        console.error("Error loading profile data:", error);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [user, activeTab]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      let finalAvatarUrl = user.avatarUrl;

      // Handle Avatar Upload if it's a new base64 image
      if (imagePreview && imagePreview.startsWith("data:")) {
        try {
          const fileBlob = await fetch(imagePreview).then((r) => r.blob());
          const fileId = ID.unique();
          await storage.createFile(
            import.meta.env.VITE_APPWRITE_BUCKET_ID,
            fileId,
            new File([fileBlob], "avatar.jpg", { type: "image/jpeg" }),
          );
          finalAvatarUrl = `https://cloud.appwrite.io/v1/storage/buckets/${import.meta.env.VITE_APPWRITE_BUCKET_ID}/files/${fileId}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`;
        } catch (uploadError) {
          console.error("Avatar upload failed:", uploadError);
          alert("Failed to upload profile picture.");
          return;
        }
      }

      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID,
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
      alert("Profile and settings updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const handleToggleNotification = (key: keyof NotificationSettings) => {
    setEditForm((prev) => ({
      ...prev,
      notificationSettings: {
        ...prev.notificationSettings,
        [key]: !prev.notificationSettings[key],
      },
    }));
  };

  const handleUnblockUser = async (userId: string) => {
    if (!user) return;

    try {
      const blocked = user.blockedUserIds || [];
      const updatedBlockedIds = blocked.filter((id) => id !== userId);

      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID,
        user.$id || user.userId,
        {
          blockedUserIds: updatedBlockedIds,
          updatedAt: new Date().toISOString(),
        },
      );
      refreshUser();
      alert("User unblocked successfully.");
    } catch (error) {
      console.error("Error unblocking user:", error);
      alert("Failed to unblock user. Please try again.");
    }
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !docPreview) return;

    setIsUploadingDoc(true);

    try {
      // Upload document to storage
      const file = await fetch(docPreview).then((r) => r.blob());
      const fileId = ID.unique();
      await storage.createFile(
        import.meta.env.VITE_APPWRITE_BUCKET_ID,
        fileId,
        new File([file], "verification-doc.jpg", { type: "image/jpeg" }),
      );

      // Update profile with verification document and status
      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID,
        user.$id || user.userId,
        {
          sellerStatus: SellerStatus.PENDING,
          verificationDocumentUrl: `https://cloud.appwrite.io/v1/storage/buckets/${import.meta.env.VITE_APPWRITE_BUCKET_ID}/files/${fileId}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`,
          updatedAt: new Date().toISOString(),
        },
      );

      refreshUser();
      setIsUploadingDoc(false);
      setDocPreview(null);
      alert(
        "Documents uploaded! Your seller verification is now PENDING review.",
      );
    } catch (error) {
      console.error("Error submitting verification:", error);
      setIsUploadingDoc(false);
      alert("Failed to submit verification. Please try again.");
    }
  };

  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => setDocPreview(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText === "DELETE ACCOUNT") {
      try {
        if (user) {
          await databases.deleteDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID,
            user.$id || user.userId,
          );
        }
        logout();
        navigate("/login");
      } catch (error) {
        console.error("Error deleting account:", error);
        alert("Failed to delete account. Please try again.");
      }
    } else {
      alert("Please type 'DELETE ACCOUNT' to confirm.");
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

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fadeIn pb-20">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col md:flex-row items-center gap-8 relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 p-8 text-blue-50 dark:text-blue-900/10 opacity-10 pointer-events-none">
          <i className="fa-solid fa-graduation-cap text-[150px]"></i>
        </div>
        <div className="relative">
          <img
            src={
              imagePreview ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=200&background=1e40af&color=fff`
            }
            className="w-32 h-32 md:w-40 md:h-40 rounded-3xl border-4 border-white dark:border-slate-800 shadow-xl object-cover"
            alt=""
          />
          <label
            htmlFor="avatar-upload"
            className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-700 text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800 cursor-pointer hover:bg-blue-800 transition"
          >
            <i className="fa-solid fa-camera text-sm"></i>
          </label>
          <input
            id="avatar-upload"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleAvatarChange}
          />
        </div>
        <div className="text-center md:text-left space-y-2 grow">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <span className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full">
              {user.role} Account
            </span>
            {user.sellerStatus === SellerStatus.VERIFIED ? (
              <span className="inline-block px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                <i className="fa-solid fa-circle-check mr-1"></i> Verified
                Seller
              </span>
            ) : (
              <button
                onClick={() => setActiveTab("verification")}
                className={`inline-block px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${user.sellerStatus === SellerStatus.PENDING ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-blue-700 hover:text-white dark:hover:bg-blue-600"}`}
              >
                {user.sellerStatus === SellerStatus.PENDING ? (
                  <>
                    <i className="fa-solid fa-clock mr-1"></i> Pending
                    Verification
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-shield-halved mr-1"></i> Get
                    Verified
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`text-xs font-bold transition ${isEditing ? "text-rose-500" : "text-slate-400 dark:text-slate-500 hover:text-blue-700 dark:hover:text-blue-400"}`}
            >
              <i
                className={`fa-solid ${isEditing ? "fa-xmark" : "fa-pen-to-square"} mr-1`}
              ></i>{" "}
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            {user.name}
          </h1>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm font-medium text-slate-500 dark:text-slate-400">
            <span>
              <i className="fa-solid fa-hashtag mr-2 text-blue-300 dark:text-blue-600"></i>{" "}
              {user.matricNumber}
            </span>
            <span>
              <i className="fa-solid fa-building-columns mr-2 text-blue-300 dark:text-blue-600"></i>{" "}
              {user.department}
            </span>
            <span>
              <i className="fa-solid fa-layer-group mr-2 text-blue-300 dark:text-blue-600"></i>{" "}
              {user.level}L
            </span>
          </div>

          <div className="flex items-center justify-center md:justify-start space-x-3 mt-2">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <i
                  key={i}
                  className={`fa-solid fa-star ${i < Math.round(user.averageRating || 0) ? "text-yellow-400" : "text-slate-200 dark:text-slate-700"}`}
                ></i>
              ))}
            </div>
            <span className="text-slate-700 dark:text-slate-200 font-bold text-sm">
              {user.averageRating?.toFixed(1) || "0.0"} (
              {user.totalReviews || 0} reviews)
            </span>
          </div>
        </div>
        <div className="md:self-start">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="text-rose-500 text-xs font-bold hover:underline"
          >
            Delete Account
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-white text-center">
              Delete Your Account?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center">
              This action is permanent and cannot be undone. All your listings
              and data will be removed.
            </p>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase text-center block">
                Type 'DELETE ACCOUNT' to confirm
              </label>
              <input
                type="text"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-center focus:ring-2 focus:ring-rose-500/20 dark:text-white"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteAccount}
                className="flex-1 bg-rose-500 text-white py-3 rounded-xl font-bold hover:bg-rose-600 transition"
              >
                Delete Permanently
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 py-3 rounded-xl font-bold"
              >
                Keep Account
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none animate-fadeIn transition-colors">
          <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
            Edit Profile & Account Settings
          </h2>
          <form onSubmit={handleUpdateProfile} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-700/20 dark:text-white"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Department
                </label>
                <select
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 dark:text-white"
                  value={editForm.department}
                  onChange={(e) =>
                    setEditForm({ ...editForm, department: e.target.value })
                  }
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Level
                </label>
                <select
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 dark:text-white"
                  value={editForm.level}
                  onChange={(e) =>
                    setEditForm({ ...editForm, level: e.target.value })
                  }
                >
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}L
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-6">
                <h3 className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2">
                  <i className="fa-solid fa-address-book"></i> Contact
                  Information
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Phone Number (WhatsApp Preferred)
                    </label>
                    <input
                      type="tel"
                      placeholder="080 0000 0000"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-700/20 dark:text-white"
                      value={editForm.phoneNumber}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          phoneNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Fintech Handles (OPay/PalmPay)
                    </label>
                    <input
                      type="text"
                      placeholder="@username or phone"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-700/20 dark:text-white"
                      value={editForm.fintechHandles}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          fintechHandles: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2">
                  <i className="fa-solid fa-building-columns"></i> Bank Details
                  (Optional)
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Access Bank"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-700/20 dark:text-white"
                      value={editForm.bankName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, bankName: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Account Number
                      </label>
                      <input
                        type="text"
                        placeholder="0011223344"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-700/20 dark:text-white"
                        value={editForm.accountNumber}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            accountNumber: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Account Name
                      </label>
                      <input
                        type="text"
                        placeholder="Account Holder"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-700/20 dark:text-white"
                        value={editForm.accountName}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            accountName: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Settings Section */}
            <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                <i className="fa-solid fa-bell"></i> Notification Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                  type="button"
                  onClick={() => handleToggleNotification("emailMessages")}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${editForm.notificationSettings?.emailMessages ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm" : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 opacity-60"}`}
                >
                  <div className="text-left">
                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider leading-none mb-1">
                      New Messages
                    </p>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                      Email alerts for chats
                    </p>
                  </div>
                  <div
                    className={`w-10 h-6 rounded-full relative transition-colors ${editForm.notificationSettings?.emailMessages ? "bg-blue-700" : "bg-slate-300 dark:bg-slate-700"}`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${editForm.notificationSettings?.emailMessages ? "left-5" : "left-1"}`}
                    ></div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleNotification("emailReviews")}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${editForm.notificationSettings?.emailReviews ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 shadow-sm" : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 opacity-60"}`}
                >
                  <div className="text-left">
                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider leading-none mb-1">
                      New Reviews
                    </p>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                      Alerts for feedback
                    </p>
                  </div>
                  <div
                    className={`w-10 h-6 rounded-full relative transition-colors ${editForm.notificationSettings?.emailReviews ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"}`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${editForm.notificationSettings?.emailReviews ? "left-5" : "left-1"}`}
                    ></div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleNotification("emailVerification")}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${editForm.notificationSettings?.emailVerification ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 shadow-sm" : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 opacity-60"}`}
                >
                  <div className="text-left">
                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider leading-none mb-1">
                      Verification
                    </p>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                      Status update alerts
                    </p>
                  </div>
                  <div
                    className={`w-10 h-6 rounded-full relative transition-colors ${editForm.notificationSettings?.emailVerification ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-700"}`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${editForm.notificationSettings?.emailVerification ? "left-5" : "left-1"}`}
                    ></div>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                className="grow bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-800 transition transform active:scale-[0.98]"
              >
                Save Changes & Preferences
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Discard
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto whitespace-nowrap scrollbar-hide">
        {[
          { id: "listings", label: "My Listings" },
          { id: "reviews", label: "Feedback" },
          { id: "favorites", label: "Wishlist" },
          { id: "orders", label: "My Orders" },
          { id: "blocked", label: "Blocked" },
          { id: "verification", label: "Verification Center" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-8 py-4 font-black text-sm uppercase tracking-wider transition-all border-b-2 ${activeTab === t.id ? "border-blue-700 text-blue-700 dark:text-blue-400" : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
          >
            {t.label}
            {t.id === "verification" &&
              user.sellerStatus === SellerStatus.UNVERIFIED && (
                <span className="ml-2 w-2 h-2 bg-rose-500 rounded-full inline-block animate-pulse"></span>
              )}
          </button>
        ))}
      </div>

      <div className="min-h-100">
        {activeTab === "listings" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                Products I'm Selling
              </h2>
              <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-500 dark:text-slate-400">
                {myProducts.length} Items
              </span>
            </div>
            {myProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myProducts.map((p) => (
                  <ProductCard key={p.$id} product={p} onDelete={loadData} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800 transition-colors">
                <p className="text-slate-400 dark:text-slate-600 italic">
                  You aren't selling any items yet.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-8 animate-fadeIn">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">
              Customer Feedback
            </h2>
            {myReviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myReviews.map((review) => (
                  <div
                    key={review.$id}
                    className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-colors"
                  >
                    <div className="flex items-center space-x-2 mb-3">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(review.buyerName)}&background=random`}
                        className="w-8 h-8 rounded-full"
                        alt=""
                      />
                      <p className="font-bold text-slate-800 dark:text-white text-sm">
                        {review.buyerName}
                      </p>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm italic mb-4 leading-relaxed">
                      "{review.comment}"
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex text-yellow-400 text-xs">
                        {[...Array(5)].map((_, i) => (
                          <i
                            key={i}
                            className={`fa-solid fa-star ${i < review.rating ? "text-yellow-400" : "text-slate-200 dark:text-slate-700"}`}
                          ></i>
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800 transition-colors">
                <p className="text-slate-400 dark:text-slate-600 italic">
                  No feedback received yet.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "favorites" && (
          <div className="space-y-8 animate-fadeIn">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">
              My Wishlist
            </h2>
            {favorites.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((p) => (
                  <ProductCard key={p.$id} product={p} onDelete={loadData} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800 transition-colors">
                <p className="text-slate-400 dark:text-slate-600 italic">
                  Your wishlist is empty.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-8 animate-fadeIn">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">
              Purchase History
            </h2>
            {myOrders.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myOrders.map((p) => (
                  <ProductCard key={p.$id} product={p} onDelete={loadData} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800 transition-colors">
                <p className="text-slate-400 dark:text-slate-600 italic">
                  No orders found.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "blocked" && (
          <div className="space-y-8 animate-fadeIn">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">
              Blocked Contacts
            </h2>
            {blockedUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {blockedUsers.map((u) => (
                  <div
                    key={u.userId}
                    className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={
                          u.avatarUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`
                        }
                        className="w-10 h-10 rounded-full"
                        alt=""
                      />
                      <p className="font-bold text-slate-900 dark:text-white">
                        {u.name}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnblockUser(u.userId)}
                      className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest hover:underline"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800 transition-colors">
                <p className="text-slate-400 dark:text-slate-600 italic">
                  No blocked users.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "verification" && (
          <div className="space-y-12 animate-fadeIn max-w-2xl mx-auto">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                Verification Center
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                To maintain a safe community, all sellers must verify their
                student status by uploading a valid University of Ibadan School
                ID card.
              </p>
            </div>

            {user.sellerStatus === SellerStatus.UNVERIFIED ||
            user.sellerStatus === SellerStatus.REJECTED ? (
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-xl space-y-8 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-col">
                    <h3 className="text-xl font-black text-slate-800 dark:text-white">
                      Upload Documents
                    </h3>
                    <button
                      onClick={async () => {
                        await refreshUser();
                        alert("Profile refreshed! Check your status.");
                      }}
                      className="text-[10px] font-bold text-blue-600 dark:text-blue-400 underline self-start mt-1"
                    >
                      Refetch Status
                    </button>
                  </div>
                  <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-[10px] font-black uppercase rounded-lg tracking-widest">
                    Step 1 of 1
                  </span>
                </div>

                {user.sellerStatus === SellerStatus.REJECTED && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-bold mb-6">
                    <i className="fa-solid fa-triangle-exclamation mr-2"></i>{" "}
                    Your previous application was rejected. Please ensure the
                    photo is clear and valid.
                  </div>
                )}

                <form onSubmit={handleSubmitVerification} className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                      UI School ID Card (Front View)
                    </label>
                    <div
                      className={`relative aspect-video w-full rounded-3xl border-4 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center ${docPreview ? "border-blue-700 dark:border-blue-500 bg-white dark:bg-slate-800" : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-600"}`}
                    >
                      {docPreview ? (
                        <>
                          <img
                            src={docPreview}
                            className="w-full h-full object-cover"
                            alt="ID Preview"
                          />
                          <button
                            type="button"
                            onClick={() => setDocPreview(null)}
                            className="absolute top-4 right-4 w-10 h-10 bg-black/50 text-white rounded-xl flex items-center justify-center backdrop-blur-md hover:bg-rose-500 transition shadow-lg"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-2xl shadow-sm flex items-center justify-center text-slate-300 dark:text-slate-500 text-2xl mb-4">
                            <i className="fa-solid fa-id-card"></i>
                          </div>
                          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                            Click to upload photo
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">
                            PNG, JPG or PDF up to 5MB
                          </p>
                        </>
                      )}
                      <input
                        type="file"
                        required
                        accept="image/*,.pdf"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleDocChange}
                      />
                    </div>
                  </div>

                  <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                    <h4 className="text-[10px] font-black text-blue-800 dark:text-blue-400 uppercase tracking-widest mb-3 flex items-center">
                      <i className="fa-solid fa-circle-info mr-2"></i>{" "}
                      Guidelines
                    </h4>
                    <ul className="text-[10px] text-slate-600 dark:text-slate-400 space-y-2 font-bold leading-relaxed">
                      <li>
                        • Ensure your Name and Matric Number are clearly
                        visible.
                      </li>
                      <li>• Document must not be expired.</li>
                      <li>• Standard DLC or UI ID cards only.</li>
                    </ul>
                  </div>

                  <button
                    type="submit"
                    disabled={!docPreview || isUploadingDoc}
                    className="w-full bg-blue-700 text-white py-5 rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-100 dark:shadow-none hover:bg-blue-800 transition transform active:scale-[0.98] disabled:opacity-50"
                  >
                    {isUploadingDoc ? (
                      <>
                        <i className="fa-solid fa-circle-notch fa-spin mr-3"></i>{" "}
                        Submitting...
                      </>
                    ) : (
                      "Submit for Verification"
                    )}
                  </button>
                </form>
              </div>
            ) : user.sellerStatus === SellerStatus.PENDING ? (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-xl text-center space-y-6 transition-colors">
                <div className="w-24 h-24 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-full flex items-center justify-center text-4xl mx-auto shadow-inner relative">
                  <i className="fa-solid fa-hourglass-half animate-pulse"></i>
                  <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 animate-ping"></div>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  Verification in Progress
                </h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto">
                  Our admins are currently reviewing your documents. This
                  usually takes 12-24 hours. You'll receive an email
                  notification once approved.
                </p>
                <div className="pt-6 flex flex-col gap-4 items-center">
                  <Link
                    to="/"
                    className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest hover:underline"
                  >
                    Back to Marketplace
                  </Link>
                  <button
                    onClick={async () => {
                      await refreshUser();
                      alert(
                        "Profile refreshed! Check if status changed to Verified.",
                      );
                    }}
                    className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-blue-600 underline"
                  >
                    Check Status Again
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-xl text-center space-y-6 transition-colors">
                <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center text-4xl mx-auto shadow-inner">
                  <i className="fa-solid fa-circle-check"></i>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  Verified Seller
                </h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto">
                  Congratulations! Your student status is verified. You have
                  full access to list items and exchange goods.
                </p>
                <div className="pt-6">
                  <button
                    onClick={() => setActiveTab("listings")}
                    className="bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 dark:shadow-none hover:bg-blue-800 transition"
                  >
                    View My Listings
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
