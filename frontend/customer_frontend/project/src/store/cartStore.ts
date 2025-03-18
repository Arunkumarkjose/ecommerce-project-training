import { create } from 'zustand';
import { CartState, Product, CartItem } from '../types';

const useCartStore = create<CartState>((set, get) => ({
  items: [],

  setItems: (items: CartItem[]) => {
    set({ items });
  },

  addToCart: (product: Product, quantity: number) => {
    set((state) => {
      const existingItem = state.items.find(item => item.productID === product.productID);
      
      if (existingItem) {
        return {
          items: state.items.map(item => 
            item.productID === product.productID
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        };
      } else {
        return {
          items: [...state.items, { ...product, quantity }]
        };
      }
    });
  },

  removeFromCart: (productId: number) => {
    set((state) => ({
      items: state.items.filter(item => item.productID !== productId)
    }));
  },
  updateQuantity: (productId: number, quantity: number | null) => {
    set((state) => ({
      items: state.items.map(item => 
        item.productID === productId 
          ? { ...item, quantity: quantity !== null ? quantity : item.quantity }
          : item
      )
    }));
  },

  

  clearCart: () => {
    set({ items: [] });
  },

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  getTotalPrice: () => {
    return get().items.reduce(
      (total, item) => total + item.price * item.quantity, 
      0
    );
  }
}));

export default useCartStore;