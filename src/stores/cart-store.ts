import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string; // product id
  slug: string;
  name: string;
  price: number; // display only — the server re-prices at checkout
  image: string;
  quantity: number;
  maxStock: number;
}

const MAX_PER_ITEM = 20;

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  replaceItems: (items: CartItem[]) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item, quantity = 1) => {
        const cap = Math.min(item.maxStock, MAX_PER_ITEM);
        const existing = get().items.find((i) => i.id === item.id);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.id === item.id ? { ...i, ...item, quantity: Math.min(i.quantity + quantity, cap) } : i
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, quantity: Math.min(quantity, cap) }] });
        }
      },

      removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) return get().removeItem(id);
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity: Math.min(quantity, i.maxStock, MAX_PER_ITEM) } : i
          ),
        });
      },

      replaceItems: (items) => set({ items }),
      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: "tlu-cart",
      partialize: (s) => ({ items: s.items }),
    }
  )
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity, 0);
export const cartSubtotal = (items: CartItem[]) => items.reduce((n, i) => n + i.price * i.quantity, 0);

const noop = () => () => {};

/** True only after the persisted cart has been read on the client. */
export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false
  );
}
