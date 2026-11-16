"use client";

import { useState } from "react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/whatsappBuilder";
import { uploadReferenceImage } from "@/lib/cloudinary";
import { X, Camera, Loader2, Minus, Plus, Check } from "lucide-react";

interface Props {
  product: Product | null;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: Props) {
  const { addItem } = useCart();

  const hasVariants = product?.variants && product.variants.length > 0;
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [selectedFlavor, setSelectedFlavor] = useState(product?.flavors?.[0] || "");
  const [selectedFilling, setSelectedFilling] = useState(product?.fillings?.[0] || "");
  const [dedication, setDedication] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!product) return null;

  const currentVariant = hasVariants ? product.variants[selectedVariantIdx] : null;
  const unitPrice = currentVariant ? currentVariant.price : product.base_price;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAddToCart = async () => {
    try {
      setIsUploading(true);
      let referenceImageUrl: string | undefined = undefined;

      if (imageFile) {
        referenceImageUrl = await uploadReferenceImage(imageFile);
      }

      addItem({
        cartItemId: `${product.id}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        image_url: product.image_url,
        quantity,
        unitPrice,
        variant: currentVariant?.label,
        flavor: product.is_customizable ? selectedFlavor : undefined,
        filling: product.is_customizable ? selectedFilling : undefined,
        dedication: product.is_customizable && dedication.trim() ? dedication.trim() : undefined,
        referenceImageUrl,
      });

      onClose();
    } catch (error) {
      alert("Hubo un error subiendo la imagen de referencia. Intenta nuevamente.");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header con imagen */}
        <div className="relative h-48 bg-stone-100 shrink-0">
          {product.image_url && (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 text-stone-800 flex items-center justify-center shadow-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido scrollable */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900">{product.name}</h2>
            {product.description && (
              <p className="text-sm text-stone-500 mt-1">{product.description}</p>
            )}
          </div>

          {/* 1. Variantes / Tamaño / Porciones */}
          {hasVariants && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                Elige tamaño / presentación
              </label>
              <div className="grid grid-cols-2 gap-2">
                {product.variants.map((v, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedVariantIdx(idx)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedVariantIdx === idx
                        ? "border-amber-600 bg-amber-50 text-amber-950 font-semibold"
                        : "border-stone-200 text-stone-700 hover:border-stone-300"
                    }`}
                  >
                    <div className="text-xs">{v.label}</div>
                    <div className="text-sm font-bold mt-0.5">{formatCurrency(v.price)}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Opciones de Torta Personalizable */}
          {product.is_customizable && (
            <>
              {/* Sabor de Masa */}
              {product.flavors.length > 0 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                    Sabor del bizcocho / masa
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.flavors.map((flavor) => (
                      <button
                        key={flavor}
                        type="button"
                        onClick={() => setSelectedFlavor(flavor)}
                        className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-all ${
                          selectedFlavor === flavor
                            ? "bg-amber-600 text-white border-amber-600"
                            : "bg-white text-stone-700 border-stone-200"
                        }`}
                      >
                        {flavor}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Relleno */}
              {product.fillings.length > 0 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                    Relleno
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.fillings.map((filling) => (
                      <button
                        key={filling}
                        type="button"
                        onClick={() => setSelectedFilling(filling)}
                        className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-all ${
                          selectedFilling === filling
                            ? "bg-amber-600 text-white border-amber-600"
                            : "bg-white text-stone-700 border-stone-200"
                        }`}
                      >
                        {filling}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dedicatoria */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                  Mensaje o Dedicatoria (Opcional)
                </label>
                <input
                  type="text"
                  maxLength={50}
                  value={dedication}
                  onChange={(e) => setDedication(e.target.value)}
                  placeholder="Ej: Feliz Cumpleaños Mamá"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              {/* Subir imagen de diseño de referencia */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                  Foto de diseño de referencia (Opcional)
                </label>
                <label className="flex items-center justify-center gap-2 w-full p-3.5 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-amber-500 bg-stone-50">
                  <Camera className="w-5 h-5 text-amber-600" />
                  <span className="text-xs font-semibold text-stone-700">
                    {imageFile ? "Cambiar foto seleccionada" : "Subir foto de cómo quieres tu torta"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {previewUrl && (
                  <div className="mt-2.5 flex items-center gap-3 p-2 bg-amber-50 rounded-xl border border-amber-200">
                    <img
                      src={previewUrl}
                      alt="Vista previa"
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                    <div className="text-xs text-amber-900 flex items-center gap-1 font-medium">
                      <Check className="w-4 h-4 text-emerald-600" /> Imagen lista para enviar
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer fijo con cantidad y botón de agregar */}
        <div className="p-4 border-t border-stone-200 bg-white flex items-center gap-3 shrink-0">
          <div className="flex items-center border border-stone-300 rounded-xl">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="p-2.5 text-stone-600 hover:text-stone-900"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-3 font-bold text-sm text-stone-900">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="p-2.5 text-stone-600 hover:text-stone-900"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            disabled={isUploading}
            onClick={handleAddToCart}
            className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:bg-stone-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Subiendo foto...
              </>
            ) : (
              <>Agregar • {formatCurrency(unitPrice * quantity)}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}