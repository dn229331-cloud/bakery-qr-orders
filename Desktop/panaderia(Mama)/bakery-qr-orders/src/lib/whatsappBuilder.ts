import { CartItem } from "@/types";

export interface OrderSummary {
  branchName: string;
  branchWhatsapp: string;
  customerName: string;
  deliveryType: string;
  deliveryDate: string;
  address?: string;
  items: CartItem[];
  total: number;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function buildWhatsAppUrl(order: OrderSummary): string {
  let text = `🎂 *NUEVO PEDIDO WEB - ${order.branchName.toUpperCase()}*\n`;
  text += `----------------------------------\n`;
  text += `👤 *Cliente:* ${order.customerName}\n`;
  text += `📅 *Para el:* ${order.deliveryDate}\n`;
  text += `📍 *Entrega:* ${order.deliveryType}\n`;
  if (order.address && order.address.trim() !== "") {
    text += `🏠 *Dirección:* ${order.address}\n`;
  }
  text += `\n🛒 *DETALLE DEL PEDIDO:*\n`;

  order.items.forEach((item) => {
    text += `\n*${item.quantity}x ${item.name}* ${item.variant ? `(${item.variant})` : ""}\n`;
    if (item.flavor) text += `   • Masa: ${item.flavor}\n`;
    if (item.filling) text += `   • Relleno: ${item.filling}\n`;
    if (item.dedication) text += `   • Dedicatoria: "${item.dedication}"\n`;
    if (item.referenceImageUrl) text += `   • Diseño ref: ${item.referenceImageUrl}\n`;
    text += `   • Subtotal: ${formatCurrency(item.unitPrice * item.quantity)}\n`;
  });

  text += `\n----------------------------------\n`;
  text += `💰 *TOTAL ESTIMADO: ${formatCurrency(order.total)}*\n`;
  text += `_(Envío este pedido para confirmar disponibilidad y abono)_`;

  const cleanPhone = order.branchWhatsapp.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}