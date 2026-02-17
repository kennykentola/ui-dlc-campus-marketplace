import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

import { useAuth } from "../App";
import { CATEGORIES } from "../constants";
import {
  Product,
  ProductStatus,
  SellerStatus,
  TransactionType,
} from "../types";
import { databases, storage } from "../lib/appwrite";
import { ID } from "appwrite";
import { getStore, INITIAL_PRODUCTS } from "../services/mockData";

const CreateProduct: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: CATEGORIES[0],
    transactionType: "sale" as TransactionType,
    exchangeTerms: "",
    allowBuyNow: false,
    buyNowPrice: "",
    isNegotiable: true,
  });

  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      const products = getStore("products", INITIAL_PRODUCTS);
      const product = products.find((p: Product) => p.$id === id);

      if (product) {
        if (product.sellerId !== user?.userId) {
          alert("Unauthorized access");
          navigate("/");
          return;
        }
        setFormData({
          name: product.name,
          description: product.description,
          price: product.price.toString(),
          category: product.category,
          transactionType: product.transactionType || "sale",
          exchangeTerms: product.exchangeTerms || "",
          allowBuyNow: !!product.buyNowPrice,
          buyNowPrice: product.buyNowPrice?.toString() || "",
          isNegotiable: product.isNegotiable ?? true,
        });
        setImagePreviews(product.imageUrls || []);
      }
    }
  }, [id, user, navigate]);



  const isVerified = user?.sellerStatus === SellerStatus.VERIFIED;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (imagePreviews.length + filesArray.length > 5) {
        alert("Maximum 5 images allowed per listing.");
        return;
      }

      filesArray.forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
    e.target.value = "";
  };

  const handleReplaceImage = (index: number) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const newPreviews = [...imagePreviews];
          newPreviews[index] = reader.result as string;
          setImagePreviews(newPreviews);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const removeImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    if (window.confirm("Remove all photos and start over?")) {
      setImagePreviews([]);
    }
  };

  const moveImage = (index: number, direction: "left" | "right") => {
    const newPreviews = [...imagePreviews];
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newPreviews.length) return;

    [newPreviews[index], newPreviews[targetIndex]] = [
      newPreviews[targetIndex],
      newPreviews[index],
    ];
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isVerified) return;
    if (imagePreviews.length === 0) {
      alert("Please upload at least one image.");
      return;
    }
    setLoading(true);

    try {
      // Upload images to storage
      const uploadedImageUrls: string[] = [];
      for (const imagePreview of imagePreviews) {
        const file = await fetch(imagePreview).then((r) => r.blob());
        const fileId = ID.unique();
        await storage.createFile(
          import.meta.env.VITE_APPWRITE_BUCKET_ID,
          fileId,
          new File([file], `product-${fileId}.jpg`, { type: "image/jpeg" }),
        );
        const fileUrl = `https://cloud.appwrite.io/v1/storage/buckets/${import.meta.env.VITE_APPWRITE_BUCKET_ID}/files/${fileId}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`;
        uploadedImageUrls.push(fileUrl);
      }

      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        category: formData.category,
        transactionType: formData.transactionType,
        exchangeTerms: formData.exchangeTerms,
        buyNowPrice:
          formData.transactionType === "exchange" && formData.allowBuyNow
            ? parseFloat(formData.buyNowPrice)
            : undefined,
        isNegotiable: formData.isNegotiable,
        imageUrls: uploadedImageUrls,
        status: ProductStatus.PENDING,
        sellerId: user.userId,
        sellerName: user.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isEditMode && id) {
        await databases.updateDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID,
          id,
          productData,
        );
      } else {
        await databases.createDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID,
          ID.unique(),
          productData,
        );
      }

      setLoading(false);
      alert(
        isEditMode
          ? "Update successful! Your listing has been re-submitted for review."
          : "Success! Your listing is submitted for admin review.",
      );
      navigate("/profile");
    } catch (error) {
      console.error("Error saving product:", error);
      setLoading(false);
      alert("Failed to save product. Please try again.");
    }
  };

  if (!isVerified) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-fadeIn">
        <div className="bg-white dark:bg-slate-900 p-12 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
          <div className="w-24 h-24 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto text-amber-500 text-4xl shadow-inner">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white">
            Verification Required
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
            Only verified students can list items on the marketplace. This
            ensures a scam-free community for everyone.
          </p>
          <div className="pt-6 space-y-4">
            <Link
              to="/profile"
              className="block w-full bg-blue-700 text-white py-5 rounded-2xl font-black shadow-2xl shadow-blue-200 dark:shadow-none hover:bg-blue-800 transition transform active:scale-[0.98] uppercase tracking-widest"
            >
              Go to Profile to Verify
            </Link>
            <Link
              to="/"
              className="block w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-5 rounded-2xl font-black hover:bg-slate-200 dark:hover:bg-slate-700 transition uppercase tracking-widest"
            >
              Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none animate-fadeIn">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {isEditMode ? "Edit Listing" : "Sell an Item"}
          </h1>
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-2xl flex items-center justify-center font-black">
            <i
              className={`fa-solid ${isEditMode ? "fa-pen-to-square" : "fa-shop"}`}
            ></i>
          </div>
        </div>
        <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg">
          Detailed descriptions and clear photos help you sell faster to UI DLC
          students.
        </p>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Basic Info */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">
              Title of Item
            </label>
            <input
              type="text"
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 text-xl font-bold focus:outline-none focus:ring-4 focus:ring-blue-700/10 focus:bg-white dark:focus:bg-slate-700 dark:text-white transition shadow-sm"
              placeholder="e.g. Casio fx-991EX Calculator (Brand New)"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">
                Category
              </label>
              <select
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-700/10 transition cursor-pointer appearance-none shadow-sm"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">
                Transaction Type
              </label>
              <div className="flex bg-slate-50 dark:bg-slate-800 rounded-2xl p-1.5 border border-slate-200 dark:border-slate-700 shadow-sm">
                {(["sale", "exchange", "both"] as TransactionType[]).map(
                  (type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, transactionType: type })
                      }
                      className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${formData.transactionType === type ? "bg-blue-700 text-white shadow-lg" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"}`}
                    >
                      {type}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* Pricing & Negotiation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">
                {formData.transactionType === "exchange"
                  ? "Estimated Value (₦)"
                  : "Selling Price (₦)"}
              </label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-slate-300 dark:text-slate-600">
                  ₦
                </span>
                <input
                  type="number"
                  required={formData.transactionType !== "exchange"}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-12 py-4 text-xl font-black focus:outline-none focus:ring-4 focus:ring-blue-700/10 dark:text-white transition shadow-sm"
                  placeholder="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-6 rounded-3xl mt-4 sm:mt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.isNegotiable ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-none" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}
                  >
                    <i className="fa-solid fa-handshake"></i>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                      Negotiable
                    </p>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                      Willing to haggle
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      isNegotiable: !formData.isNegotiable,
                    })
                  }
                  className={`w-12 h-6 rounded-full transition-all relative ${formData.isNegotiable ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${formData.isNegotiable ? "left-[26px]" : "left-[2px]"}`}
                  ></div>
                </button>
              </div>
            </div>
          </div>

          {/* Exchange Details */}
          {formData.transactionType !== "sale" && (
            <div className="space-y-6 animate-slideDown">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] ml-1">
                  Exchange For (Items you want)
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl px-6 py-4 text-lg font-bold focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:bg-white dark:focus:bg-slate-800 dark:text-white transition shadow-sm"
                  placeholder="e.g. A fairly used HP Laptop or similar calculator"
                  value={formData.exchangeTerms}
                  onChange={(e) =>
                    setFormData({ ...formData, exchangeTerms: e.target.value })
                  }
                />
              </div>

              {formData.transactionType === "exchange" && (
                <div className="bg-blue-50/50 dark:bg-blue-900/10 p-8 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.allowBuyNow ? "bg-blue-700 text-white shadow-lg" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}
                      >
                        <i className="fa-solid fa-money-bill-transfer"></i>
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                          Enable 'Buy Now' Price?
                        </h4>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                          Accept cash instead of swapping
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          allowBuyNow: !formData.allowBuyNow,
                        })
                      }
                      className={`w-12 h-6 rounded-full transition-all relative ${formData.allowBuyNow ? "bg-blue-700" : "bg-slate-300 dark:bg-slate-700"}`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${formData.allowBuyNow ? "left-[26px]" : "left-[2px]"}`}
                      ></div>
                    </button>
                  </div>

                  {formData.allowBuyNow && (
                    <div className="animate-slideDown space-y-4">
                      <label className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-[0.2em] ml-1">
                        Cash Purchase Price (₦)
                      </label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-slate-300 dark:text-slate-600">
                          ₦
                        </span>
                        <input
                          type="number"
                          required
                          className="w-full bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-900/40 rounded-2xl px-12 py-4 text-xl font-black focus:outline-none focus:ring-4 focus:ring-blue-700/10 dark:text-white transition"
                          placeholder="Set your cash price"
                          value={formData.buyNowPrice}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              buyNowPrice: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-4">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                Item Details & Condition
              </label>

            </div>
            <textarea
              rows={5}
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-5 focus:outline-none focus:ring-4 focus:ring-blue-700/10 focus:bg-white dark:focus:bg-slate-700 dark:text-white transition resize-none leading-relaxed text-base"
              placeholder="Describe the item condition honestly. Mention if there's any receipt or warranty remaining. Be clear about why you are selling."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* Image Management Section */}
          <div className="space-y-6 bg-slate-50/50 dark:bg-slate-900/50 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] block">
                  Product Images ({imagePreviews.length}/5)
                </label>
                <p className="text-[10px] text-slate-400 dark:text-slate-600 font-bold mt-1 uppercase">
                  JPG or PNG • Max 5MB per file
                </p>
              </div>
              {imagePreviews.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllImages}
                  className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
              {imagePreviews.map((preview, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-[24px] overflow-hidden border-2 border-white dark:border-slate-800 shadow-xl group"
                >
                  <img
                    src={preview}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    alt={`Preview ${index}`}
                  />

                  {/* Image Edit Controls Overlay */}
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3">
                    <div className="flex gap-2">
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => moveImage(index, "left")}
                          className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-slate-800 hover:bg-blue-50 transition active:scale-90"
                          title="Move Left"
                        >
                          <i className="fa-solid fa-chevron-left text-sm"></i>
                        </button>
                      )}
                      {index < imagePreviews.length - 1 && (
                        <button
                          type="button"
                          onClick={() => moveImage(index, "right")}
                          className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-slate-800 hover:bg-blue-50 transition active:scale-90"
                          title="Move Right"
                        >
                          <i className="fa-solid fa-chevron-right text-sm"></i>
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 w-full px-4">
                      <button
                        type="button"
                        onClick={() => handleReplaceImage(index)}
                        className="bg-white/20 backdrop-blur-md text-white border border-white/30 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-900 transition"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="bg-rose-500 text-white py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {index === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-blue-700 text-white text-[8px] font-black uppercase py-1 text-center tracking-widest shadow-lg">
                      Main Photo
                    </div>
                  )}
                </div>
              ))}

              {imagePreviews.length < 5 && (
                <label className="aspect-square flex flex-col items-center justify-center border-3 border-dashed border-slate-200 dark:border-slate-800 rounded-[24px] bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 hover:border-blue-300 dark:hover:border-blue-500 transition-all cursor-pointer group shadow-sm">
                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition duration-300">
                    <i className="fa-solid fa-camera text-slate-300 dark:text-slate-600 text-xl"></i>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Add Photo
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
            <div className="flex items-center space-x-2 text-slate-400 dark:text-slate-600">
              <i className="fa-solid fa-circle-info text-xs"></i>
              <p className="text-[10px] font-bold uppercase tracking-wider">
                Pro-tip: Reorder images so the clearest shot is in position #1.
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pt-10 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto px-12 py-5 font-black text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white transition uppercase tracking-widest text-sm"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:flex-grow bg-blue-700 text-white py-5 rounded-[28px] font-black text-lg shadow-2xl shadow-blue-200 dark:shadow-none hover:bg-blue-800 transition transform active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <i className="fa-solid fa-circle-notch fa-spin mr-3"></i>{" "}
                  Processing Listing...
                </span>
              ) : isEditMode ? (
                "Update Listing"
              ) : (
                "Publish to Marketplace"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProduct;
