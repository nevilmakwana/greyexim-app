"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from "react";

const CART_STORAGE_KEY = "greyexim_cart";

/* =====================
   TYPES
===================== */

export interface CartItem {
  _id: string;
  designName: string;
  price: number;
  image: string;
  quantity: number;
  designCode: string;
}

interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  
  // UI States
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  toggleCart: () => void; // ✅ Added helper

  // Actions
  addToCart: (product: any) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  increaseQty: (id: string) => void;
  decreaseQty: (id: string) => void;
}

/* =====================
   CONTEXT
===================== */

const CartContext = createContext<CartContextType | undefined>(undefined);

/* =====================
   PROVIDER
===================== */

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  /* ---------- 1. Load cart on Mount ---------- */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadCart = () => {
      try {
        const saved = localStorage.getItem(CART_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setCart(parsed);
          }
        }
      } catch (err) {
        console.error("Failed to load cart:", err);
      }
    };

    loadCart();
    setHydrated(true);

    // ✅ Premium Feature: Sync across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY) {
        loadCart();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  /* ---------- 2. Save cart on Change ---------- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Guard against React StrictMode double-mount in dev: don't overwrite storage
    // until we've attempted to hydrate from storage once.
    if (!hydrated) return;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  /* ---------- 3. Helper Functions ---------- */
  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), []);

  /* ---------- 4. Add to cart Logic ---------- */
  const addToCart = useCallback((product: any) => {
    if (!product?._id) return;

    setCart((prev) => {
      const existing = prev.find((i) => i._id === product._id);

      if (existing) {
        return prev.map((i) =>
          i._id === product._id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }

      // ✅ Robust Image Handling (Handles both 'image' string and 'images' array)
      const imageUrl = 
        product.image || 
        (Array.isArray(product.images) ? product.images[0] : "") || 
        "/placeholder.jpg";

      return [
        ...prev,
        {
          _id: product._id,
          designName: product.designName,
          price: Number(product.price) || 0, // Ensure price is a number
          image: imageUrl,
          quantity: 1,
          designCode: product.designCode || "N/A",
        },
      ];
    });

    // Do not auto-open drawer on add; user opens via cart icon
  }, []);

  /* ---------- Remove item ---------- */
  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((i) => i._id !== id));
  }, []);

  /* ---------- Clear cart ---------- */
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  /* ---------- Quantity Controls ---------- */
  const increaseQty = useCallback((id: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item._id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }, []);

  const decreaseQty = useCallback((id: string) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item._id === id
            ? { ...item, quantity: Math.max(item.quantity - 1, 0) }
            : item
        )
        .filter((item) => item.quantity > 0) // Remove if 0
    );
  }, []);

  /* ---------- Computed Values ---------- */
  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  /* ---------- Provide Values ---------- */
  const value = useMemo(
    () => ({
      cart,
      cartCount,
      cartTotal,
      isCartOpen,
      setIsCartOpen,
      toggleCart,
      addToCart,
      removeFromCart,
      clearCart,
      increaseQty,
      decreaseQty,
    }),
    [
      cart,
      cartCount,
      cartTotal,
      isCartOpen,
      toggleCart,
      addToCart,
      removeFromCart,
      clearCart,
      increaseQty,
      decreaseQty,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

/* =====================
   HOOK
===================== */

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
