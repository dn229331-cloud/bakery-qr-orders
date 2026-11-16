"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Branch, Category, Product } from "@/types";
import { BUSINESS_CONFIG } from "@/config/business";
import { CartProvider } from "@/context/CartContext";
import ProductCard from "@/components/catalog/ProductCard";
import ProductModal from "@/components/customizer/ProductModal";
import CartDrawer from "@/components/cart/CartDrawer";
import { MapPin, Search, CakeSlice, Loader2 } from "lucide-react";

function CatalogContent() {
  const searchParams = useSearchParams();
  const sedeParam = searchParams.get("sede") || BUSINESS_CONFIG.defaultBranchSlug;

  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranch, setActiveBranch] = useState<Branch | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [branchesRes, categoriesRes, productsRes] = await Promise.all([
        supabase.from("branches").select("*").eq("is_active", true),
        supabase.from("categories").select("*").order("sort_order", { ascending: true }),
        supabase.from("products").select("*").order("created_at", { ascending: false }),
      ]);

      const loadedBranches = (branchesRes.data || []) as Branch[];
      setBranches(loadedBranches);

      // Seleccionar la sede que viene por QR (?sede=...) o la primera disponible
      const matched =
        loadedBranches.find((b) => b.slug.toLowerCase() === sedeParam.toLowerCase()) ||
        loadedBranches[0] ||
        null;
      setActiveBranch(matched);

      setCategories((categoriesRes.data || []) as Category[]);
      setProducts((productsRes.data || []) as Product[]);
      setLoading(false);
    }

    loadData();
  }, [sedeParam]);

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategoryId === "all" || p.category_id === selectedCategoryId;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 text-stone-600 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        <p className="text-sm font-medium">Cargando catálogo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-28">
      {/* Header atractivo Mobile-First */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-sm">
                <CakeSlice className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-stone-900 text-base leading-tight">
                  {BUSINESS_CONFIG.name}
                </h1>
                <p className="text-xs text-stone-500">{BUSINESS_CONFIG.slogan}</p>
              </div>
            </div>

            {/* Selector de Sede */}
            {branches.length > 0 && activeBranch && (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 px-2.5 py-1.5 rounded-xl">
                <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <select
                  value={activeBranch.id}
                  onChange={(e) => {
                    const found = branches.find((b) => b.id === e.target.value);
                    if (found) setActiveBranch(found);
                  }}
                  className="bg-transparent text-xs font-bold text-amber-950 focus:outline-none"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar tortas, pasapalos, postres..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-100 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:bg-white transition-all"
            />
          </div>

          {/* Pills de Categorías */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategoryId("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                selectedCategoryId === "all"
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                  selectedCategoryId === cat.id
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Listado de Productos */}
      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-stone-500 text-sm">
            No encontramos productos con ese filtro.
          </div>
        ) : (
          filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={(prod) => setSelectedProduct(prod)}
            />
          ))
        )}
      </main>

      {/* Modal Personalizador de Torta / Producto */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Barra Flotante + Drawer de Pedido */}
      {activeBranch && <CartDrawer branch={activeBranch} />}
    </div>
  );
}

export default function HomePage() {
  return (
    <CartProvider>
      <Suspense fallback={<div className="p-8 text-center text-sm">Cargando...</div>}>
        <CatalogContent />
      </Suspense>
    </CartProvider>
  );
}