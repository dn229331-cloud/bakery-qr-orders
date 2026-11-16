"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { uploadReferenceImage } from "@/lib/cloudinary";
import { formatCurrency } from "@/lib/whatsappBuilder";
import { Branch, Category, Product, ProductVariant } from "@/types";
import {
  LogOut,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Loader2,
  Store,
  Package,
  ClipboardList,
  ImagePlus,
  ExternalLink,
} from "lucide-react";

interface OrderLog {
  id: string;
  customer_name: string;
  delivery_type: string;
  delivery_date: string;
  total_amount: number;
  created_at: string;
  branches?: { name: string };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<"products" | "branches" | "orders">("products");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [orders, setOrders] = useState<OrderLog[]>([]);

  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>("");

  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [tempWhatsapp, setTempWhatsapp] = useState<string>("");

  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newBasePrice, setNewBasePrice] = useState("");
  const [newIsCustomizable, setNewIsCustomizable] = useState(false);
  const [newVariantsText, setNewVariantsText] = useState("10 porciones:45000, 20 porciones:75000");
  const [newFlavorsText, setNewFlavorsText] = useState("Vainilla, Chocolate, Red Velvet");
  const [newFillingsText, setNewFillingsText] = useState("Arequipe, Frutos Rojos, Chocolate");
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/admin/login");
        return;
      }
      setCheckingAuth(false);
      fetchAllData();
    }
    init();
  }, [router]);

  async function fetchAllData() {
    const [prodRes, catRes, branchRes, ordRes] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("sort_order", { ascending: true }),
      supabase.from("branches").select("*").order("name", { ascending: true }),
      supabase
        .from("orders_log")
        .select("*, branches(name)")
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    const loadedCats = (catRes.data || []) as Category[];
    setProducts((prodRes.data || []) as Product[]);
    setCategories(loadedCats);
    if (loadedCats.length > 0 && !newCategoryId) setNewCategoryId(loadedCats[0].id);
    setBranches((branchRes.data || []) as Branch[]);
    setOrders((ordRes.data || []) as OrderLog[]);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  const toggleAvailability = async (product: Product) => {
    const updated = !product.is_available;
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_available: updated } : p))
    );
    await supabase.from("products").update({ is_available: updated }).eq("id", product.id);
  };

  const saveQuickPrice = async (productId: string) => {
    const numericPrice = Number(tempPrice);
    if (isNaN(numericPrice) || numericPrice <= 0) return;

    await supabase.from("products").update({ base_price: numericPrice }).eq("id", productId);
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, base_price: numericPrice } : p))
    );
    setEditingPriceId(null);
  };

  const deleteProduct = async (productId: string, name: string) => {
    if (!confirm(`¿Seguro que deseas eliminar "${name}"?`)) return;
    await supabase.from("products").delete().eq("id", productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const saveBranchWhatsapp = async (branchId: string) => {
    const clean = tempWhatsapp.replace(/\D/g, "");
    if (!clean) return;
    await supabase.from("branches").update({ whatsapp_number: clean }).eq("id", branchId);
    setBranches((prev) =>
      prev.map((b) => (b.id === branchId ? { ...b, whatsapp_number: clean } : b))
    );
    setEditingBranchId(null);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);
    try {
      let imageUrl: string | null = null;
      if (newImageFile) {
        imageUrl = await uploadReferenceImage(newImageFile);
      }

      const parsedVariants: ProductVariant[] = newVariantsText
        .split(",")
        .map((pair) => {
          const [label, price] = pair.split(":");
          if (!label || !price || isNaN(Number(price.trim()))) return null;
          return { label: label.trim(), price: Number(price.trim()) };
        })
        .filter((v): v is ProductVariant => v !== null);

      const parsedFlavors = newIsCustomizable
        ? newFlavorsText.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      const parsedFillings = newIsCustomizable
        ? newFillingsText.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      const { error } = await supabase.from("products").insert({
        name: newName.trim(),
        description: newDesc.trim() || null,
        category_id: newCategoryId || null,
        base_price: Number(newBasePrice),
        image_url: imageUrl,
        is_customizable: newIsCustomizable,
        is_available: true,
        variants: parsedVariants,
        flavors: parsedFlavors,
        fillings: parsedFillings,
      });

      if (error) throw error;

      setShowNewModal(false);
      setNewName("");
      setNewDesc("");
      setNewBasePrice("");
      setNewImageFile(null);
      fetchAllData();
    } catch (err) {
      console.error(err);
      alert("Error al crear el producto. Revisa los campos.");
    } finally {
      setSavingProduct(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-7 h-7 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 pb-16">
      <header className="bg-stone-900 text-white px-4 py-3.5 sticky top-0 z-30 shadow-md">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-extrabold text-base">Panel Panadería</h1>
            <a
              href="/"
              target="_blank"
              className="text-[11px] text-amber-400 inline-flex items-center gap-1 hover:underline"
            >
              Ver catálogo público <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Salir
          </button>
        </div>
      </header>

      <div className="bg-white border-b border-stone-200 px-4">
        <div className="max-w-3xl mx-auto flex gap-2 py-2.5">
          <button
            onClick={() => setActiveTab("products")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "products"
                ? "bg-amber-600 text-white"
                : "bg-stone-100 text-stone-600"
            }`}
          >
            <Package className="w-4 h-4" /> Productos ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("branches")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "branches"
                ? "bg-amber-600 text-white"
                : "bg-stone-100 text-stone-600"
            }`}
          >
            <Store className="w-4 h-4" /> Sedes ({branches.length})
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "orders"
                ? "bg-amber-600 text-white"
                : "bg-stone-100 text-stone-600"
            }`}
          >
            <ClipboardList className="w-4 h-4" /> Pedidos ({orders.length})
          </button>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 pt-5">
        {activeTab === "products" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-stone-800 text-sm">Inventario y Precios</h2>
              <button
                onClick={() => setShowNewModal(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Nuevo Producto
              </button>
            </div>

            <div className="space-y-3">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={prod.image_url || "https://via.placeholder.com/80"}
                      alt={prod.name}
                      className="w-14 h-14 rounded-xl object-cover bg-stone-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-stone-900 truncate">{prod.name}</p>

                      {editingPriceId === prod.id ? (
                        <div className="flex items-center gap-1.5 mt-1">
                          <input
                            type="number"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(e.target.value)}
                            className="w-24 px-2 py-1 text-xs border border-amber-500 rounded-lg text-stone-900"
                          />
                          <button
                            onClick={() => saveQuickPrice(prod.id)}
                            className="p-1 bg-emerald-600 text-white rounded-lg"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingPriceId(null)}
                            className="p-1 bg-stone-200 text-stone-700 rounded-lg"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs font-extrabold text-amber-700">
                            {formatCurrency(prod.base_price)}
                          </span>
                          <button
                            onClick={() => {
                              setEditingPriceId(prod.id);
                              setTempPrice(String(prod.base_price));
                            }}
                            className="text-stone-400 hover:text-stone-700 p-0.5"
                            title="Editar precio base"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => toggleAvailability(prod)}
                      className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                        prod.is_available
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {prod.is_available ? "Disponible" : "Agotado"}
                    </button>
                    <button
                      onClick={() => deleteProduct(prod.id, prod.name)}
                      className="p-1.5 text-stone-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "branches" && (
          <div className="space-y-3">
            <h2 className="font-bold text-stone-800 text-sm">
              Números de WhatsApp por Sede
            </h2>
            {branches.map((b) => (
              <div
                key={b.id}
                className="bg-white p-4 rounded-2xl border border-stone-200 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-bold text-sm text-stone-900">{b.name}</p>
                  <p className="text-xs text-stone-500">
                    Link QR: <code className="bg-stone-100 px-1.5 py-0.5 rounded">/?sede={b.slug}</code>
                  </p>
                  {editingBranchId === b.id ? (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        value={tempWhatsapp}
                        onChange={(e) => setTempWhatsapp(e.target.value)}
                        placeholder="573001234567"
                        className="px-2.5 py-1 text-xs border border-amber-500 rounded-lg text-stone-900"
                      />
                      <button
                        onClick={() => saveBranchWhatsapp(b.id)}
                        className="p-1.5 bg-emerald-600 text-white rounded-lg"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-emerald-700">
                        WhatsApp: +{b.whatsapp_number}
                      </span>
                      <button
                        onClick={() => {
                          setEditingBranchId(b.id);
                          setTempWhatsapp(b.whatsapp_number);
                        }}
                        className="text-stone-400 hover:text-stone-800"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-3">
            <h2 className="font-bold text-stone-800 text-sm">Últimos Pedidos Enviados a WhatsApp</h2>
            {orders.length === 0 ? (
              <p className="text-xs text-stone-500 bg-white p-6 rounded-2xl text-center">
                Aún no se han generado pedidos desde el catálogo.
              </p>
            ) : (
              orders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white p-4 rounded-2xl border border-stone-200 flex justify-between items-center"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-sm text-stone-900">{ord.customer_name}</p>
                    <p className="text-xs text-stone-500">
                      {ord.delivery_type} • Para: {ord.delivery_date}
                    </p>
                    {ord.branches?.name && (
                      <span className="inline-block text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                        {ord.branches.name}
                      </span>
                    )}
                  </div>
                  <span className="font-extrabold text-sm text-emerald-700">
                    {formatCurrency(ord.total_amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <h3 className="font-extrabold text-base text-stone-900">Agregar Producto</h3>
              <button onClick={() => setShowNewModal(false)}>
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-5 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Torta Genovesa de Frutas"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Categoría *</label>
                  <select
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm text-stone-900"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Precio Base ($) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newBasePrice}
                    onChange={(e) => setNewBasePrice(e.target.value)}
                    placeholder="45000"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Ingredientes, decoración, detalles..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Foto del producto
                </label>
                <label className="flex items-center gap-2 px-3.5 py-2.5 border border-dashed border-stone-300 rounded-xl cursor-pointer text-xs font-semibold text-stone-700 bg-stone-50">
                  <ImagePlus className="w-4 h-4 text-amber-600" />
                  {newImageFile ? newImageFile.name : "Seleccionar foto desde galería"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewImageFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Tamaños / Precios (Opcional, separados por coma)
                </label>
                <input
                  type="text"
                  value={newVariantsText}
                  onChange={(e) => setNewVariantsText(e.target.value)}
                  placeholder="10 porciones:45000, 20 porciones:75000"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-stone-800 pt-1">
                <input
                  type="checkbox"
                  checked={newIsCustomizable}
                  onChange={(e) => setNewIsCustomizable(e.target.checked)}
                  className="w-4 h-4 accent-amber-600"
                />
                ¿Es torta personalizable? (Habilita sabores, rellenos, dedicatoria y foto)
              </label>

              {newIsCustomizable && (
                <div className="space-y-3 p-3 bg-amber-50/70 rounded-xl border border-amber-200">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Sabores de masa (separados por coma)
                    </label>
                    <input
                      type="text"
                      value={newFlavorsText}
                      onChange={(e) => setNewFlavorsText(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs text-stone-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Rellenos (separados por coma)
                    </label>
                    <input
                      type="text"
                      value={newFillingsText}
                      onChange={(e) => setNewFillingsText(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs text-stone-900 bg-white"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={savingProduct}
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                {savingProduct ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Guardar Producto en Catálogo"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}