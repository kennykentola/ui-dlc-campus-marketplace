import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { databases } from "../lib/appwrite";
import { Product, SellerStatus, UserProfile } from "../types";
import { useAuth } from "../App";

const SellerDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<UserProfile | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadCheckoutData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const productDoc = await databases.getDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID,
          id,
        );
        const loadedProduct = productDoc as unknown as Product;
        setProduct(loadedProduct);

        const sellerDoc = await databases.getDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID,
          loadedProduct.sellerId,
        );
        setSeller(sellerDoc as unknown as UserProfile);
      } catch (error: any) {
        console.error("Error loading seller details:", error);
        if (error.code === 404) setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    loadCheckoutData();
    window.scrollTo(0, 0);
  }, [id]);

  const paymentRows = useMemo(
    () => [
      { label: "Bank name", value: seller?.bankName || "Not provided yet" },
      {
        label: "Account number",
        value: seller?.accountNumber || "Not provided yet",
      },
      {
        label: "Account name",
        value: seller?.accountName || "Not provided yet",
      },
      {
        label: "Fintech handle",
        value: seller?.fintechHandles || "Not provided yet",
      },
      {
        label: "Phone number",
        value: seller?.phoneNumber || "Not provided yet",
      },
    ],
    [seller],
  );

  const handleChat = () => {
    if (!product || !seller) return;
    navigate(`/messages?seller=${seller.userId}&product=${product.$id}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 rounded-full border-4 border-brand-secondary border-t-transparent animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Loading seller details...
        </p>
      </div>
    );
  }

  if (notFound || !product || !seller) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <div className="rounded-[32px] border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-3xl font-bold tracking-tight text-brand-ink dark:text-white">
            Seller details not available
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
            We could not load the seller information for this item.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-2xl bg-brand-primary px-5 py-3 text-sm font-medium text-white"
          >
            Back to marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f7fafc] pb-24 pt-28 dark:bg-slate-950">
      <div className="container mx-auto max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          <Link to="/" className="hover:text-brand-primary dark:hover:text-indigo-400">
            Marketplace
          </Link>
          <span>/</span>
          <Link
            to={`/product/${product.$id}`}
            className="hover:text-brand-primary dark:hover:text-indigo-400"
          >
            Product details
          </Link>
          <span>/</span>
          <span className="text-brand-ink dark:text-white">Seller details</span>
        </div>

        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand-primary dark:text-indigo-400">
              Selected item
            </p>
            <div className="mt-5 overflow-hidden rounded-[24px] bg-slate-50 p-6 dark:bg-slate-950">
              <img
                src={product.imageUrls[0]}
                alt={product.name}
                className="mx-auto h-64 w-full object-contain"
              />
            </div>
            <div className="mt-6 space-y-4">
              <h1 className="text-3xl font-bold tracking-tight text-brand-ink dark:text-white">
                {product.name}
              </h1>
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                {product.description}
              </p>
              <div className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Price
                </span>
                <span className="text-3xl font-bold tracking-tight text-brand-primary dark:text-indigo-400">
                  ₦{product.price.toLocaleString()}
                </span>
              </div>
              <Link
                to={`/product/${product.$id}`}
                className="inline-flex text-sm font-medium text-brand-primary hover:text-brand-primary dark:text-indigo-400 dark:hover:text-white"
              >
                View full product page
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={
                      seller.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.name)}&background=003366&color=fff`
                    }
                    alt={seller.name}
                    className="h-16 w-16 rounded-[20px] object-cover"
                  />
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-brand-ink dark:text-white">
                      {seller.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {seller.department} · {seller.level} level
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${seller.sellerStatus === SellerStatus.VERIFIED
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                    }`}
                >
                  {seller.sellerStatus === SellerStatus.VERIFIED
                    ? "Verified seller"
                    : "Seller pending verification"}
                </span>
              </div>

              <div className="mt-6 rounded-[24px] border border-indigo-100 bg-brand-surface/70 p-4 dark:border-indigo-950/40 dark:bg-indigo-950/20">
                <p className="text-sm font-medium text-indigo-950 dark:text-indigo-200">
                  Payment and contact details
                </p>
                <p className="mt-1 text-sm leading-6 text-brand-primary/80 dark:text-indigo-200/80">
                  Confirm the item and seller before sending payment. If any
                  detail is missing, use chat first.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {paymentRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex flex-col gap-1 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                      {row.label}
                    </span>
                    <span className="text-sm font-medium text-brand-ink dark:text-white">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xl font-bold tracking-tight text-brand-ink dark:text-white">
                Contact the seller privately
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                Your chat is limited to you and this seller. Other users do not
                see this conversation in their inbox.
                and please if you have paid, click on the button below to confirm your payment.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => navigate(`/checkout/${product?.$id}`)}
                  className="inline-flex items-center justify-center rounded-2xl bg-brand-primary px-5 py-4 text-sm font-black text-white uppercase tracking-widest transition hover:brightness-110 active:scale-[0.98] shadow-lg shadow-brand-primary/10"
                >
                  I Have Paid
                </button>
                <button
                  onClick={handleChat}
                  className="inline-flex items-center justify-center rounded-2xl bg-brand-primary px-5 py-4 text-sm font-black text-white uppercase tracking-widest transition hover:brightness-110 active:scale-[0.98]"
                >
                  Chat with seller
                </button>
                <Link
                  to={`/product/${product.$id}`}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-700 transition hover:border-indigo-200 hover:text-brand-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  Back to product
                </Link>
              </div>
              {!user && (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                  Sign in is required before you can chat with the seller.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SellerDetails;
