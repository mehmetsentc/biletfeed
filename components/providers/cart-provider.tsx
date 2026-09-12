'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode
} from 'react';
import type { CartLine, CartState } from '@/lib/cart/types';
import { CART_EVENT_NAME, CART_STORAGE_KEY } from '@/lib/cart/types';
import {
  assertCartLimits,
  cartSubtotal,
  cartTicketCount,
  emptyCart,
  makeCartLineKey,
  mergeCartLine,
  readCartFromStorage,
  writeCartToStorage
} from '@/lib/cart/storage';

type AddCartLineInput = Omit<CartLine, 'key'> & { key?: string };

type CartContextValue = {
  lines: CartLine[];
  ticketCount: number;
  subtotal: number;
  hydrated: boolean;
  addLine: (line: AddCartLineInput) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>(emptyCart);
  const [hydrated, setHydrated] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const loaded = readCartFromStorage();
    startTransition(() => {
      setState(loaded);
      setHydrated(true);
    });

    function onStorage(e: StorageEvent) {
      if (e.key !== null && e.key !== CART_STORAGE_KEY) return;
      setState(readCartFromStorage());
    }
    function onCartEvent() {
      setState(readCartFromStorage());
    }

    window.addEventListener('storage', onStorage);
    window.addEventListener(CART_EVENT_NAME, onCartEvent);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(CART_EVENT_NAME, onCartEvent);
    };
  }, []);

  const persist = useCallback((next: CartState) => {
    writeCartToStorage(next);
    setState(next);
  }, []);

  const addLine = useCallback(
    (line: AddCartLineInput) => {
      const incoming: CartLine = {
        ...line,
        key:
          line.key ??
          makeCartLineKey({
            eventId: line.eventId,
            ticketTypeId: line.ticketTypeId,
            seatUnitIds: line.seatUnitIds
          })
      };
      const merged = mergeCartLine(state.lines, incoming);
      assertCartLimits(merged);
      persist({
        version: 1,
        lines: merged,
        updatedAt: new Date().toISOString()
      });
    },
    [persist, state.lines]
  );

  const updateQuantity = useCallback(
    (key: string, quantity: number) => {
      const qty = Math.max(0, Math.min(10, Math.floor(quantity)));
      const nextLines =
        qty <= 0
          ? state.lines.filter((l) => l.key !== key)
          : state.lines.map((l) => {
              if (l.key !== key) return l;
              if (l.seatUnitIds && l.seatUnitIds.length > 0) return l;
              return { ...l, quantity: qty };
            });
      assertCartLimits(nextLines);
      persist({
        version: 1,
        lines: nextLines,
        updatedAt: new Date().toISOString()
      });
    },
    [persist, state.lines]
  );

  const removeLine = useCallback(
    (key: string) => {
      persist({
        version: 1,
        lines: state.lines.filter((l) => l.key !== key),
        updatedAt: new Date().toISOString()
      });
    },
    [persist, state.lines]
  );

  const clear = useCallback(() => {
    persist(emptyCart());
  }, [persist]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines: state.lines,
      ticketCount: cartTicketCount(state.lines),
      subtotal: cartSubtotal(state.lines),
      hydrated,
      addLine,
      updateQuantity,
      removeLine,
      clear
    }),
    [state.lines, hydrated, addLine, updateQuantity, removeLine, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart, CartProvider içinde kullanılmalıdır');
  }
  return ctx;
}

export function useCartOptional(): CartContextValue | null {
  return useContext(CartContext);
}
