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
    <div className="relative min-h-screen bg-transparent pb-16 text-white w-full">
      <div className="w-full space-y-16">
        <section className="grid items-center gap-12 rounded-[40px] glass-panel p-8 md:p-12 lg:grid-cols-[1.2fr_0.8fr] relative animate-slideUp">
          <div className="absolute top-10 left-10 w-32 h-32 bg-[#F5A623]/20 blur-3xl rounded-full animate-pulse-glow"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-[#00E5FF]/10 blur-3xl rounded-full animate-float"></div>
          
          <div className="space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#F5A623] shadow-lg backdrop-blur-md">
              <i className="fa-solid fa-bolt text-[#F5A623]"></i> UI DLC marketplace
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white md:text-6xl drop-shadow-xl leading-[1.1]">
                Buy and sell campus essentials with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5A623] to-yellow-200">clarity and trust.</span>
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
                A premium marketplace for University of Ibadan DLC students to
                discover materials, connect with sellers, and manage
                conversations securely.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row pt-4">
              <Link
                to={user ? "/sell" : "/register"}
                className="btn-gold"
              >
                {user ? "List an asset" : "Enter Marketplace"} <i className="fa-solid fa-arrow-right ml-2"></i>
              </Link>
              <Link
                to="/messages"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-6 py-4 text-[13px] font-black uppercase tracking-[0.15em] text-white transition hover:bg-white/10 backdrop-blur-md"
              >
                Open chat
              </Link>
              {user?.role === UserRole.ADMIN && (
                <Link
                  to="/admin"
                  className="inline-flex items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-[13px] font-black uppercase tracking-[0.15em] text-rose-300 transition hover:bg-rose-500/20 backdrop-blur-md"
                >
                  Admin Portal
                </Link>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_auto] mt-8 pt-8 border-t border-white/10">
              <label className="relative block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Search assets
                </span>
                <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-5 top-[3.35rem] -translate-y-1/2 text-white/50" />
                <input
                  type="text"
                  aria-label="Search by product name"
                  placeholder="Search by product name"
                  className="w-full rounded-[20px] border border-white/10 bg-black/20 py-4 pl-12 pr-4 text-sm font-medium text-white outline-none transition placeholder:text-white/30 focus:border-[#F5A623]/50 focus:bg-black/40 focus:ring-4 focus:ring-[#F5A623]/10 backdrop-blur-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </label>

              <label className="relative block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Learning Hub Filter
                </span>
                <i className="fa-solid fa-location-dot pointer-events-none absolute left-5 top-[3.35rem] -translate-y-1/2 text-white/50" />
                <select
                  aria-label="Learning Hub Filter"
                  title="Learning Hub Filter"
                  className="w-full appearance-none rounded-[20px] border border-white/10 bg-black/20 py-4 pl-12 pr-10 text-sm font-medium text-white outline-none transition focus:border-[#F5A623]/50 focus:bg-black/40 focus:ring-4 focus:ring-[#F5A623]/10 backdrop-blur-md"
                  value={selectedHub}
                  onChange={(e) => setSelectedHub(e.target.value)}
                >
                  <option value="All Hubs" className="text-black">All Regional Hubs</option>
                  {Object.values(LearningHub).map(hub => (
                    <option key={hub} value={hub} className="text-black">{hub}</option>
                  ))}
                </select>
                <i className="fa-solid fa-chevron-down pointer-events-none absolute right-5 top-[3.35rem] -translate-y-1/2 text-xs text-white/30" />
              </label>

              <div className="rounded-[20px] border border-white/10 bg-white/5 p-5 backdrop-blur-md flex flex-col justify-center items-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F5A623]">
                  Live Assets
                </p>
                <p className="mt-1 text-4xl font-black tracking-tighter text-white drop-shadow-md">
                  {products.length}
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

        {featuredProducts.length > 0 && !loading && !searchTerm && selectedCategory === "All" && (
          <section className="space-y-8 animate-fadeIn">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#F5A623]">
                  Curated Assets
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-white leading-none">
                  Featured Picks
                </h2>
              </div>
              <p className="hidden md:block text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                Verified Hub Listings
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <div
                  key={product.$id}
                  className="glass-panel group relative flex flex-col rounded-3xl p-3 hover:-translate-y-2 transition-transform duration-300"
                >
                  <Link to={`/product/${product.$id}`} className="flex flex-col grow group/card">
                    <div className="relative aspect-square overflow-hidden rounded-[20px] bg-black/20">
                      <img
                        src={product.imageUrls[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=003366&color=fff&size=500&bold=true`}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover/card:scale-105"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=ERROR&background=rose&color=fff&size=500&bold=true`; }}
                      />
                      
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                         <span className="px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-xl text-[10px] font-bold text-white shadow-sm">
                            {product.category}
                         </span>
                      </div>
                    </div>

                    <div className="flex grow flex-col px-3 py-4 space-y-2">
                      <h3 className="text-lg font-bold tracking-tight text-white transition-colors group-hover/card:text-[#F5A623] capitalize line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {product.description}
                      </p>
                    </div>
                  </Link>

                  <div className="mt-auto px-3 pb-3 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Price
                      </p>
                      <p className="text-lg font-black text-[#F5A623]">
                        ₦{product.price.toLocaleString()}
                      </p>
                    </div>
                    <Link
                      to={`/messages?with=${product.sellerId}&product=${product.$id}`}
                      className="w-10 h-10 flex items-center justify-center bg-white/10 text-white rounded-xl hover:bg-[#F5A623] hover:text-[#003366] transition-colors"
                      title="Quick Chat"
                    >
                      <i className="fa-solid fa-comment-dots"></i>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Browse Marketplace
              </p>
              <h2 className="text-3xl font-black tracking-tight text-white">
                All Products
              </h2>
            </div>

            <div className="rounded-2xl bg-white/5 backdrop-blur-md px-5 py-3 text-sm text-slate-300">
              Showing{" "}
              <span className="font-bold text-[#F5A623]">
                {filteredProducts.length}
              </span>{" "}
              result{filteredProducts.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto rounded-2xl glass-panel p-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory("All")}
              className={`whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-bold transition-colors ${
                selectedCategory === "All"
                  ? "bg-[#F5A623] text-[#003366]"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              All
            </button>
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-bold transition-colors ${
                  selectedCategory === category
                    ? "bg-[#F5A623] text-[#003366]"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {[...Array(8)].map((_, index) => (
                <div
                  key={index}
                  className="aspect-[0.88] animate-pulse rounded-3xl bg-white/5"
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
            <div className="glass-panel rounded-3xl px-6 py-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-white/50">
                <i className="fa-solid fa-box-open text-xl"></i>
              </div>
              <h3 className="mt-6 text-xl font-bold text-white">
                No products match this filter.
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
                Try a different keyword or switch categories to explore more.
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("All");
                }}
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/20 transition-colors"
              >
                Reset filters
              </button>
            </div>
          )}
        </section>

        {/* Campus Noticeboard (Moved to bottom) */}
        {!searchTerm && selectedCategory === "All" && requests.length > 0 && (
          <section className="space-y-8 pt-12 border-t border-white/10">
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-2">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                    Demand-Side Activity
                 </p>
                 <h2 className="text-3xl font-black text-white tracking-tight">
                   Campus Noticeboard
                 </h2>
              </div>
              <Link to="/requests" className="hidden sm:inline-flex items-center gap-2 text-slate-300 text-xs font-bold hover:text-white transition-colors">
                View All Requests <i className="fa-solid fa-arrow-right"></i>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {requests.slice(0, 3).map((req, i) => (
                <div key={i} className="glass-panel p-6 rounded-3xl hover:bg-white/5 transition-colors flex flex-col justify-between">
                   <div className="space-y-3">
                      <div className="flex justify-between items-start">
                         <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-[#F5A623]">
                            <i className="fa-solid fa-bullhorn text-sm"></i>
                         </div>
                         {req.budget > 0 && (
                           <span className="text-[#F5A623] font-bold text-sm">₦{req.budget.toLocaleString()}</span>
                         )}
                      </div>
                      <h3 className="text-lg font-bold text-white leading-tight line-clamp-1">{req.itemNeeded}</h3>
                      <p className="text-sm text-slate-400 line-clamp-2">{req.description}</p>
                   </div>
                   
                   <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                      <p className="text-xs text-slate-500">By {req.userName.split(' ')[0]}</p>
                      <Link to={`/messages?with=${req.userId}&product=request_${req.$id}`} className="text-[#F5A623] text-xs font-bold hover:underline">I Have This</Link>
                   </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Home;
