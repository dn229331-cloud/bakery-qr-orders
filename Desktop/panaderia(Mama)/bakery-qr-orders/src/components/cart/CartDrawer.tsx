"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { Branch } from "@/types";
import { BUSINESS_CONFIG } from "@/config/business";
import { buildWhatsAppUrl, formatCurrency } from "@/lib/whatsappBuilder";
import { supabase } from "@/lib/supabase";
import { ShoppingBag, X, Trash2, Send, Loader2 } from "lucide-react";

interface Props {
  branch: Branch;
}

export default function CartDrawer({ branch }: Props) {
  const { items, removeItem, clearCart, totalItems, totalAmount } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [deliveryType, setDeliveryType] = useState<string>(BUSINESS_CONFIG.deliveryOptions[0]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [address, setAddress] = useState("");
  const [isSending, setIsSending] = useState(false);

  if (totalItems === 0) return null;

  const handleSendWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !deliveryDate) {
      alert("Por favor completa tu nombre y la fecha/hora de entrega.");
      return;
    }

    setIsSending(true);
    try {
      // 1. Guardar respaldo silencioso en Supabase (orders_log)
      await supabase.from("orders_log").insert({
        branch_id: branch.id,
        customer_name: customerName.trim(),
        delivery_type: deliveryType,
        delivery_date: deliveryDate,
        total_amount: totalAmount,
        order_details: items,
      });

      // 2. Generar URL de WhatsApp
      const formattedDate = new Date(deliveryDate).toLocaleString("es-CO", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });

      const waUrl = buildWhatsAppUrl({
        branchName: branch.name,
        branchWhatsapp: branch.whatsapp_number,
        customerName: customerName.trim(),
        deliveryType,
        deliveryDate: formattedDate,
        address: deliveryType === "Domicilio" ? address : undefined,
        items,
        total: totalAmount,
      });

      clearCart();
      setIsOpen(false);
      window.location.href = waUrl;
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al procesar el pedido.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Barra flotante inferior estilo Rappi */}
      <div className="fixed bottom-4 left-0 right-0 z-40 px-4 max-w-2xl mx-auto">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full py-3.5 px-5 rounded-2xl bg-stone-900 text-white shadow-xl flex items-center justify-between hover:bg-stone-800 active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-amber-500 text-stone-950 font-extrabold text-xs flex items-center justify-center">
              {totalItems}
            </span>
            <span className="font-bold text-sm">Ver mi pedido</span>
          </div>
          <span className="font-extrabold text-base text-amber-400">
            {formatCurrency(totalAmount)}
          </span>
        </button>
      </div>

      {/* Drawer / Modal del carrito */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-600" />
                <h2 className="font-extrabold text-lg text-stone-900">Tu Pedido</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendWhatsApp} className="overflow-y-auto p-5 space-y-5 flex-1">
              {/* Lista de productos */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex justify-between gap-3"
                  >
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-sm text-stone-900">
                        {item.quantity}x {item.name}
                      </p>
                      {item.variant && <p className="text-stone-600">• {item.variant}</p>}
                      {item.flavor && <p className="text-stone-600">• Masa: {item.flavor}</p>}
                      {item.filling && <p className="text-stone-600">• Relleno: {item.filling}</p>}
                      {item.dedication && (
                        <p className="text-amber-800 font-medium">• "{item.dedication}"</p>
                      )}
                      {item.referenceImageUrl && (
                        <a
                          href={item.referenceImageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline inline-block"
                        >
                          Ver foto adjunta
                        </a>
                      )}
                      <p className="font-extrabold text-stone-900 pt-1">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.cartItemId)}
                      className="text-stone-400 hover:text-red-500 self-start p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Datos de entrega */}
              <div className="space-y-3 pt-2 border-t border-stone-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Datos para el pedido ({branch.name})
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Tu Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej: Laura Gómez"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ¿Cómo recibes tu pedido?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {BUSINESS_CONFIG.deliveryOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDeliveryType(opt)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border ${
                          deliveryType === opt
                            ? "bg-amber-600 text-white border-amber-600"
                            : "bg-white text-stone-700 border-stone-300"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {deliveryType === "Domicilio" && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Dirección de entrega *
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Barrio, calle, número de casa/apto"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Fecha y hora para cuándo lo necesitas *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900"
                  />
                </div>

                <p className="text-[11px] text-stone-500 bg-amber-50 p-2.5 rounded-lg border border-amber-200/70">
                  {BUSINESS_CONFIG.depositNote}
                </p>
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Enviar pedido por WhatsApp ({formatCurrency(totalAmount)})
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}