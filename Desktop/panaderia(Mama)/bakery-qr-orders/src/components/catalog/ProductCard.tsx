"use client";

import { Product } from "@/types";
import { formatCurrency } from "@/lib/whatsappBuilder";
import { Plus, Sparkles } from "lucide-react";

interface Props {
  product: Product;
  onSelect: (product: Product) => void;
}

export default function ProductCard({ product, onSelect }: Props) {
  return (
    <div
      onClick={() => product.is_available && onSelect(product)}
      className={`flex gap-3.5 p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-sm transition-all ${
        product.is_available
          ? "cursor-pointer active:scale-[0.98] hover:border-amber-300"
          : "opacity-55 grayscale cursor-not-allowed"
      }`}
    >
      {/* Imagen del producto */}
      <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-stone-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">
            Sin foto
          </div>
        )}
        {!product.is_available && (
          <span className="absolute inset-0 bg-black/60 text-white text-[11px] font-semibold flex items-center justify-center text-center px-1">
            Agotado hoy
          </span>
        )}
      </div>

      {/* Información */}
      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-stone-800 text-[15px] leading-snug line-clamp-1">
              {product.name}
            </h3>
            {product.is_customizable && (
              <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                <Sparkles className="w-2.5 h-2.5" /> Personalizable
              </span>
            )}
          </div>
          {product.description && (
            <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2.5">
          <span className="font-extrabold text-stone-900 text-sm">
            {product.variants && product.variants.length > 0
              ? `Desde ${formatCurrency(product.base_price)}`
              : formatCurrency(product.base_price)}
          </span>

          {product.is_available && (
            <button
              type="button"
              className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-sm hover:bg-amber-700"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}