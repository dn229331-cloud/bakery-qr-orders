export interface Branch {
  id: string;
  slug: string;
  name: string;
  whatsapp_number: string;
  address: string | null;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  sort_order: number;
}

export interface ProductVariant {
  label: string;
  price: number;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  base_price: number;
  image_url: string | null;
  is_customizable: boolean;
  is_available: boolean;
  variants: ProductVariant[];
  flavors: string[];
  fillings: string[];
}

export interface CartItem {
  cartItemId: string; // ID único en el carrito (ej. producto + variante + dedicatoria)
  productId: string;
  name: string;
  image_url: string | null;
  quantity: number;
  unitPrice: number;
  variant?: string;
  flavor?: string;
  filling?: string;
  dedication?: string;
  referenceImageUrl?: string;
}