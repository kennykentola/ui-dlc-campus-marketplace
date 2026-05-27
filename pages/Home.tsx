import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { Product, UserRole, LearningHub, BuyerRequest } from "../types";
import { databases } from "../lib/appwrite";
import { Query } from "appwrite";
import ProductCard from "../components/ProductCard";
import { CATEGORIES } from "../constants";

const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [requests, setRequests] = useState<BuyerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedHub, setSelectedHub] = useState("All Hubs");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          "products",
          [Query.orderDesc("$createdAt"), Query.limit(100)]
        );
        setProducts(response.documents as unknown as Product[]);

        const reqResponse = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          "requests",
          [Query.orderDesc("createdAt"), Query.limit(3)]
        );
        setRequests(reqResponse.documents as unknown as BuyerRequest[]);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;
    const matchesHub =
      selectedHub === "All Hubs" || product.learningHub === selectedHub;
    return matchesSearch && matchesCategory && matchesHub;
  });

  const featuredProducts = filteredProducts.slice(0, 3);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-transparent pb-32 pt-28 text-brand-ink dark:text-slate-100">

      <div className="container relative mx-auto max-w-7xl space-y-16 px-4 sm:px-6 lg:px-8">
        <section className="grid items-center gap-12 rounded-[40px] border border-slate-100/60 bg-white/75 p-8 shadow-[0_32px_90px_-48px_rgba(15,23,42,0.12)] backdrop-blur-xl md:p-12 lg:grid-cols-[1.2fr_0.8fr] dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/8 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-brand-primary">
              UI DLC marketplace
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-950 md:text-6xl dark:text-white">
                Buy and sell campus essentials with clarity and trust.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-700 md:text-lg dark:text-slate-300">
                A simple marketplace for University of Ibadan DLC students to
                discover materials, connect with sellers, and manage
                conversations in one place.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to={user ? "/sell" : "/register"}
                className="inline-flex items-center justify-center rounded-2xl bg-brand-primary px-6 py-4 text-sm font-medium text-white shadow-lg shadow-[#003366]/10 transition hover:brightness-110 active:scale-[0.98]"
              >
                {user ? "List an item" : "Create account"}
              </Link>
              <Link
                to="/messages"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-medium text-slate-700 transition hover:border-teal-200 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-teal-950/50 dark:hover:text-teal-400"
              >
                Open chat
              </Link>
              {user?.role === UserRole.ADMIN && (
                <Link
                  to="/admin"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Admin dashboard
                </Link>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <label className="relative block">
                <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  Search products
                </span>
                <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-5 top-[3.35rem] -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by product name"
                className="w-full rounded-[24px] border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-base text-brand-ink outline-none transition placeholder:text-slate-400 focus:border-brand-secondary focus:bg-white focus:ring-4 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-teal-900 dark:focus:ring-teal-950"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </label>

              <label className="relative block">
                <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  Learning Hub Filter
                </span>
                <i className="fa-solid fa-location-dot pointer-events-none absolute left-5 top-[3.35rem] -translate-y-1/2 text-slate-400" />
                <select
                className="w-full appearance-none rounded-[24px] border border-slate-200 bg-slate-50 py-4 pl-12 pr-10 text-base text-brand-ink outline-none transition focus:border-brand-secondary focus:bg-white focus:ring-4 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-teal-900 dark:focus:ring-teal-950"
                  value={selectedHub}
                  onChange={(e) => setSelectedHub(e.target.value)}
                >
                  <option value="All Hubs">All Regional Hubs</option>
                  {Object.values(LearningHub).map(hub => (
                    <option key={hub} value={hub}>{hub}</option>
                  ))}
                </select>
                <i className="fa-solid fa-chevron-down pointer-events-none absolute right-5 top-[3.35rem] -translate-y-1/2 text-xs text-slate-300" />
              </label>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  Available now
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-brand-ink dark:text-white">
                  {products.length}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  products listed by students
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-linear-to-br from-slate-50 via-white to-teal-50 p-6 shadow-[0_28px_70px_-44px_rgba(15,23,42,0.38)] dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
              <div className="pointer-events-none absolute -right-10 top-8 h-40 w-40 rounded-full bg-teal-100/70 blur-3xl dark:bg-teal-950/20" />
              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
                      Marketplace preview
                    </p>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-brand-ink dark:text-white">
                      Built for fast campus exchange
                    </h2>
                  </div>
                  <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800 dark:border-teal-950/50 dark:bg-teal-950/40 dark:text-teal-400">
                    Student to student
                  </span>
                </div>

                <img
                  src="/hero_marketplace_illustration_1774195137608.png"
                  alt="Marketplace illustration"
                  className="mx-auto w-full max-w-[520px] drop-shadow-[0_24px_40px_rgba(0,51,102,0.18)]"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  Clear discovery
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Search and category filters reduce friction before users open a conversation.
                </p>
              </div>

              <div className="rounded-[28px] bg-linear-to-br from-brand-primary to-brand-secondary p-5 text-white shadow-[0_32px_80px_-36px_rgba(3,34,33,0.55)]">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/70">
                  Quick start
                </p>
                <p className="mt-3 text-sm leading-7 text-white/85">
                  Use a clear title, fair price, and one strong image for better trust and conversion.
                </p>
                <button
                  onClick={() => navigate(user ? "/sell" : "/login")}
                  className="mt-4 inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-medium text-brand-primary transition hover:bg-slate-100 active:scale-[0.98]"
                >
                  {user ? "Create listing" : "Sign in to start"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Campus Noticeboard (Demand-Side Preview) */}
        {!searchTerm && selectedCategory === "All" && requests.length > 0 && (
          <section className="space-y-10 animate-fadeIn">
            <div className="flex items-end justify-between gap-4 px-4 overflow-hidden">
              <div className="space-y-4">
                 <div className="inline-flex items-center gap-2 rounded-full border border-brand-primary/10 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400 shadow-sm animate-pulse">
                    <i className="fa-solid fa-bullhorn text-brand-secondary"></i> Localized Requirements
                 </div>
                 <h2 className="text-4xl font-black text-brand-primary dark:text-white uppercase tracking-tighter leading-none">
                   Campus Noticeboard.
                 </h2>
                 <p className="text-[10px] text-slate-300 dark:text-slate-600 font-bold uppercase tracking-[0.4em] italic leading-none pl-1">
                    Demand-Side Academic Activity Log
                 </p>
              </div>
              <Link to="/requests" className="hidden sm:inline-flex items-center gap-2 text-brand-primary dark:text-teal-400 text-[10px] font-black uppercase tracking-widest hover:gap-4 transition-all">
                Full Registry <i className="fa-solid fa-arrow-right-long"></i>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {requests.slice(0, 3).map((req, i) => (
                <div key={i} className="bg-white/80 backdrop-blur-md border border-slate-100/60 dark:border-slate-800 p-8 rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_-12px_rgba(0,51,102,0.12)] transition-all group flex flex-col justify-between container">
                   <div className="space-y-4">
                      <div className="flex justify-between items-start">
                         <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-brand-primary dark:text-teal-400 shadow-inner group-hover:scale-110 transition-transform">
                            <i className="fa-solid fa-magnifying-glass text-xs"></i>
                         </div>
                         {req.budget > 0 && (
                           <span className="text-brand-secondary font-black text-xs italic">₦{req.budget.toLocaleString()}</span>
                         )}
                      </div>
                      <h3 className="text-lg font-black text-brand-primary dark:text-white uppercase leading-tight group-hover:text-brand-secondary transition-colors line-clamp-1">{req.itemNeeded}</h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed italic line-clamp-2">{req.description}</p>
                   </div>
                   
                   <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                      <p className="text-[9px] font-black text-brand-primary dark:text-slate-400 uppercase tracking-tighter">By {req.userName.split(' ')[0]}</p>
                      <Link to={`/messages?with=${req.userId}&product=request_${req.$id}`} className="text-brand-secondary dark:text-teal-400 text-[10px] font-bold uppercase tracking-widest hover:underline">I Have This</Link>
                   </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-teal-700 dark:text-teal-400">
                Browse marketplace
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl dark:text-white">
                Find what you need faster.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                Categories and search are kept close to the product grid so
                users can refine results without losing context.
              </p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              Showing{" "}
              <span className="font-semibold text-brand-ink dark:text-white">
                {filteredProducts.length}
              </span>{" "}
              result{filteredProducts.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto rounded-[28px] border border-slate-100/60 bg-white/70 backdrop-blur-md p-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={() => setSelectedCategory("All")}
              className={`whitespace-nowrap rounded-2xl px-5 py-3 text-sm font-medium transition ${
                selectedCategory === "All"
                  ? "bg-brand-primary text-white"
                  : "text-slate-600 hover:bg-slate-50 hover:text-brand-ink dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              }`}
            >
              All
            </button>
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap rounded-2xl px-5 py-3 text-sm font-medium transition ${
                  selectedCategory === category
                    ? "bg-brand-secondary text-white"
                    : "text-slate-600 hover:bg-slate-50 hover:text-brand-ink dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {featuredProducts.length > 0 && !loading && !searchTerm && selectedCategory === "All" && (
          <section className="space-y-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-secondary">
                  Curated Assets
                </p>
                <h2 className="mt-4 text-4xl font-black tracking-tight text-brand-primary uppercase leading-none">
                  Featured Picks.
                </h2>
              </div>
              <p className="hidden md:block text-[10px] font-black text-slate-300 uppercase tracking-widest italic">
                Verified Hub Listings
              </p>
            </div>

            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <div
                  key={product.$id}
                  className="group relative flex flex-col rounded-[48px] border border-slate-100 bg-white p-4 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:border-teal-600/10 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900"
                >
                  {/* Navigation Layer */}
                  <Link to={`/product/${product.$id}`} className="flex flex-col grow group/card">
                    {/* Visual Node with Floating Badges */}
                    <div className="relative aspect-square overflow-hidden rounded-[36px] bg-slate-50 dark:bg-slate-950">
                      <img
                        src={product.imageUrls[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=003366&color=fff&size=500&bold=true`}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover/card:scale-110"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=ERROR&background=rose&color=fff&size=500&bold=true`; }}
                      />
                      
                      {/* Badge Protocol Cluster */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                         <span className="px-5 py-2 bg-white rounded-full text-[9px] font-black text-brand-primary uppercase shadow-sm">
                            {product.category}
                         </span>
                         <span className={`px-4 py-1.5 ${product.isNegotiable === false ? 'bg-slate-50 text-slate-400' : 'bg-brand-secondary text-white'} rounded-full text-[8px] font-black uppercase shadow-sm`}>
                            {product.isNegotiable === false ? 'Fixed Price' : 'Negotiable'}
                         </span>
                      </div>
                    </div>

                    {/* Core Metadata Sector */}
                    <div className="flex grow flex-col px-4 py-8 space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-xl font-extrabold tracking-tight text-brand-primary transition-colors group-hover/card:text-brand-secondary dark:text-white capitalize">
                          {product.name}
                        </h3>
                        <p className="text-[12px] font-medium leading-relaxed text-slate-400 line-clamp-2 italic">
                          {product.description}
                        </p>
                      </div>
                    </div>
                  </Link>

                    <div className="mt-auto pt-6 flex items-end justify-between border-t border-slate-50 dark:border-slate-800">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">
                          Price
                        </p>
                        <p className="text-xl font-black text-brand-primary dark:text-teal-400">
                          ₦{product.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[10px] font-black text-brand-primary uppercase leading-none">
                          {product.sellerName.split(' ')[0]}
                        </p>
                        <p className="text-[8px] font-black text-slate-300 uppercase italic">
                          {new Date(product.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/messages?with=${product.sellerId}&product=${product.$id}`}
                      className="w-full h-16 mt-4 flex items-center justify-center gap-4 bg-brand-primary text-white rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all hover:bg-brand-secondary scale-100 active:scale-95"
                    >
                      <i className="fa-solid fa-comments text-lg"></i>
                      Quick Chat
                    </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-8">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {[...Array(8)].map((_, index) => (
                <div
                  key={index}
                  className="aspect-[0.88] animate-pulse rounded-[32px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.$id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-[36px] border border-dashed border-slate-300 bg-white px-6 py-20 text-center dark:border-slate-700 dark:bg-slate-900">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                <i className="fa-solid fa-box-open text-xl"></i>
              </div>
              <h3 className="mt-6 text-2xl font-bold tracking-tight text-brand-ink dark:text-white">
                No products match this filter.
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500 dark:text-slate-400">
                Try a different keyword or switch categories to explore more
                items in the marketplace.
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("All");
                }}
                className="mt-6 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-teal-200 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-teal-950/50 dark:hover:text-teal-400"
              >
                Reset filters
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;
