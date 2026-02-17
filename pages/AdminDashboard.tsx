import React, { useState, useEffect } from "react";
import {
  Product,
  UserProfile,
  ProductStatus,
  UserRole,
  SellerStatus,
  ProductReport,
} from "../types";
import { databases } from "../lib/appwrite";
import { Query } from "appwrite";
import { sendEmailPlaceholder } from "../services/notification";
import { useAuth } from "../App";

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reports, setReports] = useState<ProductReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"verifications" | "reports" | "listings" | "users">("verifications");
  const [filterTerm, setFilterTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  const toggleProductSelection = (id: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProducts(newSelected);
  };

  const toggleAllProducts = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map((p) => p.$id)));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsRes, usersRes, reportsRes] = await Promise.all([
          databases.listDocuments(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID,
            [Query.limit(100), Query.orderDesc("$createdAt")]
          ),
          databases.listDocuments(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID,
            [Query.limit(100)]
          ),
          databases.listDocuments(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_REPORTS_COLLECTION_ID,
            [Query.limit(100), Query.orderDesc("createdAt")]
          ),
        ]);

        setProducts(productsRes.documents as unknown as Product[]);
        setUsers(usersRes.documents as unknown as UserProfile[]);
        setReports(reportsRes.documents as unknown as ProductReport[]);
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === UserRole.ADMIN) {
      fetchData();
    }
  }, [user]);

  if (!user || user.role !== UserRole.ADMIN) {
    return <div className="p-8 text-center text-rose-500 font-bold">Access Denied</div>;
  }

  if (loading) {
    return <div className="p-8 text-center font-bold text-slate-500">Loading Admin Dashboard...</div>;
  }

  const handleBulkAction = async (status: ProductStatus) => {
    if (
      !window.confirm(
        `Are you sure you want to mark ${selectedProducts.size} items as ${status}?`,
      )
    )
      return;

    try {
      const updates = Array.from(selectedProducts).map((id) =>
        databases.updateDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID,
          id,
          { status, updatedAt: new Date().toISOString() },
        ),
      );

      await Promise.all(updates);

      setProducts((prev) =>
        prev.map((p) =>
          selectedProducts.has(p.$id) ? { ...p, status } : p,
        ),
      );
      setSelectedProducts(new Set());
      alert(`Successfully updated ${selectedProducts.size} items to ${status}.`);
    } catch (error) {
      console.error("Error performing bulk action:", error);
      alert("Failed to perform bulk action.");
    }
  };

  const handleUpdateStatus = async (
    productId: string,
    newStatus: ProductStatus,
  ) => {
    try {
      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID,
        productId,
        { status: newStatus, updatedAt: new Date().toISOString() },
      );
      const updated = products.map((p) =>
        p.$id === productId ? { ...p, status: newStatus } : p,
      );
      setProducts(updated);
    } catch (error) {
      console.error("Error updating product status:", error);
      alert("Failed to update product status.");
    }
  };

  const handleFlagProduct = async (productId: string) => {
    try {
      const product = products.find((p) => p.$id === productId);
      if (!product) return;

      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID,
        productId,
        { isFlagged: !product.isFlagged, updatedAt: new Date().toISOString() },
      );
      const updated = products.map((p) =>
        p.$id === productId ? { ...p, isFlagged: !p.isFlagged } : p,
      );
      setProducts(updated);
    } catch (error) {
      console.error("Error flagging product:", error);
      alert("Failed to flag product.");
    }
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      await databases.deleteDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_REPORTS_COLLECTION_ID,
        reportId,
      );
      const updated = reports.filter((r) => r.$id !== reportId);
      setReports(updated);
    } catch (error) {
      console.error("Error dismissing report:", error);
      alert("Failed to dismiss report.");
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      const targetUser = users.find((u) => u.userId === userId);
      if (!targetUser) return;

      const newSuspendedStatus = !targetUser.isSuspended;

      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID,
        targetUser.$id || targetUser.userId,
        {
          isSuspended: newSuspendedStatus,
          updatedAt: new Date().toISOString(),
        },
      );

      const updated = users.map((u: UserProfile) =>
        u.userId === userId ? { ...u, isSuspended: newSuspendedStatus } : u,
      );
      setUsers(updated);

      const statusText = newSuspendedStatus ? "suspended" : "reactivated";

      // Note: Email functionality would need to be implemented separately
      alert(`User ${statusText} successfully.`);
    } catch (error) {
      console.error("Error suspending user:", error);
      alert("Failed to update user status.");
    }
  };

  const handleUpdateVerification = async (
    userId: string,
    status: SellerStatus,
  ) => {
    try {
      const targetUser = users.find((u) => u.userId === userId);
      if (!targetUser) return;

      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID,
        targetUser.$id || targetUser.userId,
        {
          sellerStatus: status,
          updatedAt: new Date().toISOString(),
        },
      );

      const updated = users.map((u: UserProfile) =>
        u.userId === userId ? { ...u, sellerStatus: status } : u,
      );
      setUsers(updated);

      const isApproved = status === SellerStatus.VERIFIED;
      sendEmailPlaceholder(
        targetUser.email,
        `Seller Verification: ${isApproved ? "Approved ✅" : "Rejected ❌"}`,
        `Hello ${targetUser.name.split(" ")[0]},\n\nYour application for Seller Verification on the UI DLC Marketplace has been ${isApproved ? "APPROVED" : "REJECTED"}.\n\n${isApproved ? 'You can now post items for sale and exchange. Your profile will now display the "Verified Seller" badge.' : "Please ensure your Matric Number and student details are accurate before re-applying."}`,
      );

      alert(
        status === SellerStatus.VERIFIED
          ? "User verified successfully!"
          : "Verification rejected.",
      );
    } catch (error) {
      console.error("Error updating verification status:", error);
      alert("Failed to update verification status.");
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (window.confirm("Delete this listing permanently?")) {
      try {
        await databases.deleteDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID,
          id,
        );

        const updated = products.filter((p) => p.$id !== id);
        setProducts(updated);

        // Clean up reports for this product
        const reportsToDelete = reports.filter((r) => r.productId === id);
        for (const report of reportsToDelete) {
          await databases.deleteDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_REPORTS_COLLECTION_ID,
            report.$id,
          );
        }

        const updatedReports = reports.filter((r) => r.productId !== id);
        setReports(updatedReports);
      } catch (error) {
        console.error("Error deleting listing:", error);
        alert("Failed to delete listing.");
      }
    }
  };

  const pendingVerifications = users.filter(
    (u) => u.sellerStatus === SellerStatus.PENDING,
  );

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Admin Console
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Moderation & Safety Center
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 flex shadow-sm">
          {[
            {
              id: "verifications",
              label: "Verifications",
              count: pendingVerifications.length,
            },
            { id: "reports", label: "Reports", count: reports.length },
            {
              id: "listings",
              label: "Moderation",
              count: products.filter((p) => p.isFlagged).length,
            },
            { id: "users", label: "Students", count: 0 },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id as any);
                setFilterTerm("");
              }}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition relative ${tab === t.id ? "bg-blue-700 text-white shadow-lg shadow-blue-100 dark:shadow-none" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
            >
              {t.label}
              {t.count > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center gap-4">
          <div className="relative flex-grow">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600"></i>
            <input
              type="text"
              placeholder={`Search ${tab}...`}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-12 text-sm focus:ring-2 focus:ring-blue-100 dark:text-white transition"
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
            />
          </div>
        </div>

        {tab === "verifications" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-8 py-5">Applicant</th>
                  <th className="px-8 py-5">Matric Number</th>
                  <th className="px-8 py-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {pendingVerifications
                  .filter((u) =>
                    (u.name || "").toLowerCase().includes(filterTerm.toLowerCase()),
                  )
                  .map((u) => (
                    <tr
                      key={u.$id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center space-x-4">
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || "User")}&background=random`}
                            className="w-10 h-10 rounded-full"
                            alt=""
                          />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {u.name || "Unknown User"}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {u.email || "No Email"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm font-black text-slate-700 dark:text-slate-300">
                        {u.matricNumber}
                      </td>
                      <td className="px-8 py-6 space-x-2">
                        <button
                          onClick={() =>
                            handleUpdateVerification(
                              u.userId,
                              SellerStatus.VERIFIED,
                            )
                          }
                          className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black rounded-xl shadow-lg"
                        >
                          APPROVE
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateVerification(
                              u.userId,
                              SellerStatus.REJECTED,
                            )
                          }
                          className="px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-[10px] font-black rounded-xl"
                        >
                          REJECT
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : tab === "reports" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-8 py-5">Product</th>
                  <th className="px-8 py-5">Reason</th>
                  <th className="px-8 py-5">Reporter</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {reports
                  .filter((r) =>
                    (r.productName || "")
                      .toLowerCase()
                      .includes(filterTerm.toLowerCase()),
                  )
                  .map((r) => (
                    <tr
                      key={r.$id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition"
                    >
                      <td className="px-8 py-5">
                        <p className="font-bold text-slate-900 dark:text-white text-sm">
                          {r.productName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          ID: {r.productId}
                        </p>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-2 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-[9px] font-black uppercase rounded tracking-wider">
                          {r.reason}
                        </span>
                        <p className="text-[10px] text-slate-500 mt-1 italic">
                          "{r.description}"
                        </p>
                      </td>
                      <td className="px-8 py-5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                        {r.reporterName}
                      </td>
                      <td className="px-8 py-5 text-right space-x-3">
                        <button
                          onClick={() => handleDeleteListing(r.productId)}
                          className="px-3 py-1.5 bg-rose-500 text-white text-[9px] font-black rounded-lg shadow-sm"
                        >
                          DELETE ITEM
                        </button>
                        <button
                          onClick={() => handleDismissReport(r.$id)}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-black rounded-lg"
                        >
                          DISMISS
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : tab === "listings" ? (
          <div className="space-y-4">
            {selectedProducts.size > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 flex items-center justify-between border-b border-blue-100 dark:border-blue-900/30 animate-fadeIn">
                <span className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">
                  {selectedProducts.size} Selected
                </span>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleBulkAction(ProductStatus.APPROVED)}
                    className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-200 dark:shadow-none uppercase tracking-widest"
                  >
                    Approve Selected
                  </button>
                  <button
                    onClick={() => handleBulkAction(ProductStatus.REJECTED)}
                    className="px-4 py-2 bg-rose-500 text-white text-[10px] font-black rounded-xl hover:bg-rose-600 transition shadow-lg shadow-rose-200 dark:shadow-none uppercase tracking-widest"
                  >
                    Reject Selected
                  </button>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-8 py-5 w-10">
                      <input
                        type="checkbox"
                        checked={
                          products.length > 0 &&
                          selectedProducts.size === products.length
                        }
                        onChange={toggleAllProducts}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-5">Item</th>
                    <th className="px-4 py-5">Status</th>
                    <th className="px-4 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {products
                    .filter((p) =>
                      (p.name || "").toLowerCase().includes(filterTerm.toLowerCase()),
                    )
                    .map((p) => (
                      <tr
                        key={p.$id}
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition ${p.isFlagged ? "bg-rose-50/30 dark:bg-rose-900/5" : ""}`}
                      >
                        <td className="px-8 py-5">
                          <input
                            type="checkbox"
                            checked={selectedProducts.has(p.$id)}
                            onChange={() => toggleProductSelection(p.$id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex items-center space-x-4">
                            <img
                              src={p.imageUrls && p.imageUrls.length > 0 ? p.imageUrls[0] : "https://placehold.co/100?text=No+Image"}
                              className="w-12 h-12 rounded-xl object-cover shadow-sm"
                              alt=""
                            />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-sm">
                                {p.name || "Unnamed Product"}
                              </p>
                              {p.isFlagged && (
                                <span className="text-[8px] text-rose-500 font-black uppercase tracking-widest bg-rose-100 dark:bg-rose-900/20 px-1.5 py-0.5 rounded">
                                  FLAGGED
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-5">
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${p.status === ProductStatus.APPROVED
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                              : p.status === ProductStatus.PENDING
                                ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                                : "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400"
                              }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-5 text-right space-x-2">
                          {p.status === ProductStatus.PENDING && (
                            <>
                              <button
                                onClick={() =>
                                  handleUpdateStatus(p.$id, ProductStatus.APPROVED)
                                }
                                className="px-3 py-1.5 bg-emerald-600 text-white text-[9px] font-black rounded-lg shadow-sm hover:bg-emerald-700 transition"
                              >
                                APPROVE
                              </button>
                              <button
                                onClick={() =>
                                  handleUpdateStatus(p.$id, ProductStatus.REJECTED)
                                }
                                className="px-3 py-1.5 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 text-[9px] font-black rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 transition"
                              >
                                REJECT
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleFlagProduct(p.$id)}
                            className={`px-3 py-1.5 text-[9px] font-black rounded-lg transition ${p.isFlagged ? "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}
                          >
                            {p.isFlagged ? "UNFLAG" : "FLAG"}
                          </button>
                          <button
                            onClick={() => handleDeleteListing(p.$id)}
                            className="p-1.5 text-rose-400 hover:text-rose-600 transition"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-8 py-5">Student</th>
                  <th className="px-8 py-5">Role</th>
                  <th className="px-8 py-5 text-right">Safety Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {users
                  .filter((u) =>
                    (u.name || "").toLowerCase().includes(filterTerm.toLowerCase()),
                  )
                  .map((u) => (
                    <tr
                      key={u.$id}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition ${u.isSuspended ? "bg-slate-100 dark:bg-slate-800" : ""}`}
                    >
                      <td className="px-8 py-5 flex items-center space-x-4">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`}
                          className="w-10 h-10 rounded-full"
                          alt=""
                        />
                        <div>
                          <p
                            className={`font-bold ${u.isSuspended ? "text-slate-400 line-through" : "text-slate-900 dark:text-white"}`}
                          >
                            {u.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {u.matricNumber}
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[10px] font-black uppercase text-slate-400">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => handleSuspendUser(u.userId)}
                          className={`px-5 py-2 text-[10px] font-black rounded-xl transition ${u.isSuspended ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"}`}
                        >
                          {u.isSuspended ? "RE-ACTIVATE" : "SUSPEND USER"}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
