import { httpClient } from "../httpClient";

export type CartWarning = {
  code: string;
  product_id?: string;
  available?: number;
  message: string;
};

export type CartItemDTO = {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  current_unit_price: number;
  price_changed: boolean;
  line_total: number;
  added_at: string;
  product: {
    id: string;
    name: string;
    image_url: string | null;
    stock_quantity: number;
    status: string;
    provider?: { id: string; business_name: string } | null;
  };
};

export type CartDTO = {
  id: string;
  updated_at: string;
  items: CartItemDTO[];
  totals: {
    subtotal: number;
    discount: number;
    total: number;
    total_items: number;
  };
  warnings: CartWarning[];
};

export type MergeItemInput = { product_id: string; quantity: number };

export const cartService = {
  get() {
    return httpClient.get<CartDTO>("/cart");
  },
  addItem(payload: MergeItemInput) {
    return httpClient.post<CartDTO>("/cart/items", payload);
  },
  updateItem(itemId: string, quantity: number) {
    return httpClient.patch<CartDTO>(`/cart/items/${itemId}`, { quantity });
  },
  removeItem(itemId: string) {
    return httpClient.delete<CartDTO>(`/cart/items/${itemId}`);
  },
  clear() {
    return httpClient.delete<CartDTO>("/cart");
  },
  merge(items: MergeItemInput[]) {
    return httpClient.post<CartDTO>("/cart/merge", { items });
  },
};
