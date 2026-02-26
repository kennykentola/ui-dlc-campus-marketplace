import React, { useState, useEffect } from "react";
import { Product, ProductStatus } from "../types";
import { CATEGORIES } from "../constants";
import { databases } from "../lib/appwrite";
import { Query } from "appwrite";
import ProductCard from "../components/ProductCard";

const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showSwapsOnly, setShowSwapsOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "price_low" | "price_high">(
    "newest",
  );

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          "products",
          [Query.equal("status", ProductStatus.APPROVED)],
        );
        const approvedProducts = response.documents as unknown as Product[];
        setProducts(approvedProducts);
        setFilteredProducts(approvedProducts);
      } catch (error) {
        console.error("Error loading products:", error);
        setProducts([]);
        setFilteredProducts([]);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    let result = products;

    if (selectedCategory !== "All") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (showSwapsOnly) {
      result = result.filter(
        (p) => p.transactionType === "exchange" || p.transactionType === "both",
      );
    }

    if (search) {
      const term = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term),
      );
    }

    if (sortBy === "newest") {
      result = [...result].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else if (sortBy === "price_low") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_high") {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    setFilteredProducts(result);
  }, [search, selectedCategory, products, sortBy, showSwapsOnly]);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="bg-blue-700 rounded-3xl p-6 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-blue-200">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            The UI DLC <br />
            <span className="text-yellow-400">Student Marketplace</span>
          </h1>
          <p className="mt-4 text-blue-100 text-lg">
            A trusted platform for UI Distance Learning Centre students to buy,
            sell, and connect. From electronics to academic materials.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <div className="relative grow">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-blue-300"></i>
              <input
                type="text"
                placeholder="Search for books, laptops, services..."
                className="w-full bg-blue-800/50 border border-blue-600 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-blue-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none hidden lg:block">
          <i className="fa-solid fa-shop text-[300px] -rotate-12 translate-x-20 translate-y-20"></i>
        </div>
      </section>

      {/* Categories & Filter Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 py-2 border-b border-slate-200">
        <div className="flex flex-col w-full lg:w-auto gap-4">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory("All")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${selectedCategory === "All" ? "bg-blue-700 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}
            >
              All Items
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${selectedCategory === cat ? "bg-blue-700 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSwapsOnly(!showSwapsOnly)}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border transition-all ${showSwapsOnly ? "bg-amber-500 text-white border-amber-400 shadow-md" : "bg-white text-slate-400 border-slate-200 hover:border-amber-300 hover:text-amber-500"}`}
            >
              <i className="fa-solid fa-rotate ${showSwapsOnly ? 'animate-spin-slow' : ''}"></i>
              <span>Exchange Available</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-end lg:self-auto">
          <label className="text-xs font-bold uppercase text-slate-400">
            Sort by
          </label>
          <select
            className="w-full md:w-auto bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="newest">Newest First</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.$id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 text-3xl">
            <i className="fa-solid fa-box-open"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-800">No items found</h3>
          <p className="text-slate-500 mt-2">
            Try adjusting your filters or search keywords.
          </p>
        </div>
      )}
    </div>
  );
};

export default Home;
