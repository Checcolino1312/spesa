"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

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
    // Optimistic update
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
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
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-green-600 hover:text-green-800 text-sm">
            &larr; Home
          </Link>
          <Link href="/parla" className="text-green-600 hover:text-green-800 text-sm">
            Aggiungi con voce &rarr;
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Lista della spesa
        </h1>
        <p className="text-gray-500 text-center mb-6 text-sm">
          {items.length === 0
            ? "La lista è vuota"
            : `${unchecked.length} da comprare, ${checked.length} presi`}
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <svg className="w-8 h-8 text-green-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-6xl mb-4">🛒</p>
            <p className="text-gray-400">
              Nessun prodotto nella lista.
              <br />
              <Link href="/parla" className="text-green-600 hover:underline">
                Aggiungi con un vocale
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Unchecked items */}
            {unchecked.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-6 h-6 rounded-full border-2 border-green-400 hover:bg-green-50 flex-shrink-0 transition-colors"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 font-medium truncate">{item.name}</p>
                  {item.quantity && (
                    <p className="text-gray-400 text-xs">{item.quantity}</p>
                  )}
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}

            {/* Checked items */}
            {checked.length > 0 && (
              <>
                <div className="flex items-center justify-between pt-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">
                    Presi ({checked.length})
                  </p>
                  <button
                    onClick={clearChecked}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Rimuovi presi
                  </button>
                </div>
                {checked.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 opacity-60"
                  >
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="w-6 h-6 rounded-full bg-green-500 flex-shrink-0 flex items-center justify-center"
                    >
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <p className="text-gray-400 line-through flex-1 truncate">{item.name}</p>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </>
            )}

            {/* Clear all */}
            {items.length > 0 && (
              <div className="pt-4 text-center">
                <button
                  onClick={clearAll}
                  className="text-sm text-red-400 hover:text-red-600"
                >
                  Svuota tutta la lista
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
