"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mic,
  Circle,
  CircleCheck,
  X,
  Trash2,
  ShoppingCart,
  Loader2,
} from "lucide-react";

interface GroceryItem {
  id: string;
  name: string;
  quantity?: string;
  checked: boolean;
  createdAt: string;
}

export default function ListaPage() {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/lista");
      const data = await res.json();
      setItems(data.items);
    } catch {
      // silently retry on next poll
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll every 3 seconds
  useEffect(() => {
    fetchItems();
    const interval = setInterval(fetchItems, 3000);
    return () => clearInterval(interval);
  }, [fetchItems]);

  const toggleItem = async (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
    await fetch("/api/lista", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle", id }),
    });
  };

  const removeItem = async (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    await fetch("/api/lista", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", id }),
    });
  };

  const clearChecked = async () => {
    setItems((prev) => prev.filter((item) => !item.checked));
    await fetch("/api/lista", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear_checked" }),
    });
  };

  const clearAll = async () => {
    setItems([]);
    await fetch("/api/lista", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear_all" }),
    });
  };

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
          <h1 className="font-semibold text-text-primary text-[15px]">
            Lista della spesa
          </h1>
          <Link
            href="/parla"
            className="flex items-center gap-1.5 text-primary hover:text-primary-dark text-sm font-medium"
          >
            <Mic className="w-4 h-4" />
            Aggiungi
          </Link>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5">
        {/* Counter badge */}
        {!loading && items.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">
              {unchecked.length} da comprare
            </span>
            {checked.length > 0 && (
              <span className="inline-flex items-center gap-1.5 bg-success-light text-success text-xs font-semibold px-3 py-1 rounded-full">
                {checked.length} presi
              </span>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-text-tertiary text-sm mt-3">Caricamento...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-surface-secondary rounded-full flex items-center justify-center mb-4">
              <ShoppingCart className="w-10 h-10 text-text-tertiary" />
            </div>
            <p className="text-text-secondary font-medium mb-1">
              Lista vuota
            </p>
            <p className="text-text-tertiary text-sm mb-4">
              Nessun prodotto nella lista
            </p>
            <Link
              href="/parla"
              className="inline-flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-primary-dark"
            >
              <Mic className="w-4 h-4" />
              Aggiungi con la voce
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Unchecked items */}
            {unchecked.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 bg-surface rounded-xl border border-border px-4 py-3 transition-all hover:border-primary/20"
                style={{ boxShadow: "var(--shadow-sm)" }}
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="flex-shrink-0 text-text-tertiary hover:text-primary transition-colors"
                >
                  <Circle className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary font-medium text-[15px] truncate">
                    {item.name}
                  </p>
                  {item.quantity && (
                    <p className="text-text-tertiary text-xs mt-0.5">
                      {item.quantity}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="flex-shrink-0 text-text-tertiary hover:text-danger transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Divider + Checked items */}
            {checked.length > 0 && (
              <>
                <div className="flex items-center gap-3 pt-3 pb-1">
                  <div className="h-px bg-border flex-1" />
                  <span className="text-xs text-text-tertiary font-medium uppercase tracking-wider">
                    Presi ({checked.length})
                  </span>
                  <div className="h-px bg-border flex-1" />
                </div>
                {checked.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 bg-surface-secondary rounded-xl px-4 py-3 opacity-70"
                  >
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="flex-shrink-0 text-success"
                    >
                      <CircleCheck className="w-5 h-5" />
                    </button>
                    <p className="text-text-tertiary line-through flex-1 truncate text-[15px]">
                      {item.name}
                    </p>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="flex-shrink-0 text-text-tertiary hover:text-danger transition-colors p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={clearChecked}
                  className="flex items-center gap-1.5 text-danger text-xs font-medium mx-auto mt-1 hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Rimuovi presi
                </button>
              </>
            )}

            {/* Clear all */}
            {items.length > 0 && (
              <div className="pt-4 text-center border-t border-border mt-4">
                <button
                  onClick={clearAll}
                  className="text-xs text-text-tertiary hover:text-danger font-medium"
                >
                  Svuota tutta la lista
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating action button */}
      {!loading && items.length > 0 && (
        <Link
          href="/parla"
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary-dark text-white rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          style={{ boxShadow: "0 8px 24px rgba(108, 92, 231, 0.4)" }}
        >
          <Mic className="w-6 h-6" />
        </Link>
      )}
    </div>
  );
}
