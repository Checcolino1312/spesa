"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
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
  Share2,
  Plus,
  Clock,
  Check,
} from "lucide-react";
import { CATEGORIES, getCategoryEmoji } from "@/lib/categories";

interface GroceryItem {
  id: string;
  name: string;
  quantity?: string;
  category?: string;
  checked: boolean;
  createdAt: string;
}

interface HistoryItem {
  name: string;
  count: number;
}

export default function ListaCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const editNameRef = useRef<HTMLInputElement>(null);
  const editQuantityRef = useRef<HTMLInputElement>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`/api/lista?code=${code}`);
      const data = await res.json();
      setItems(data.items);
    } catch {
      // silently retry on next poll
    } finally {
      setLoading(false);
    }
  }, [code]);

  // Fetch history once on mount
  useEffect(() => {
    fetch(`/api/storico?code=${code}`)
      .then((res) => res.json())
      .then((data) => setHistory(data.history ?? []))
      .catch(() => {});
  }, [code]);

  // Poll every 3 seconds, skip when editing
  useEffect(() => {
    fetchItems();
    const interval = setInterval(() => {
      if (!editingId) {
        fetchItems();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchItems, editingId]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        manualInputRef.current &&
        !manualInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleItem = async (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
    await fetch("/api/lista", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle", id, code }),
    });
  };

  const removeItem = async (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    await fetch("/api/lista", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", id, code }),
    });
  };

  const clearChecked = async () => {
    setItems((prev) => prev.filter((item) => !item.checked));
    await fetch("/api/lista", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear_checked", code }),
    });
  };

  const clearAll = async () => {
    setItems([]);
    await fetch("/api/lista", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear_all", code }),
    });
  };

  const shareList = async () => {
    const url = `${window.location.origin}/lista/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  // --- Manual input ---
  const addManualItem = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const normalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    const newItem: GroceryItem = {
      id: "temp-" + Date.now(),
      name: normalized,
      category: "Altro",
      checked: false,
      createdAt: new Date().toISOString(),
    };
    setItems((prev) => [...prev, newItem]);
    setManualInput("");
    setShowSuggestions(false);

    await fetch("/api/lista", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add",
        code,
        items: [{ name: normalized, category: "Altro" }],
      }),
    });
    // Refresh to get real IDs
    fetchItems();
  };

  const handleManualKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addManualItem(manualInput);
    }
  };

  // Filter suggestions
  const filteredSuggestions = manualInput.trim().length > 0
    ? history
        .filter((h) =>
          h.name.toLowerCase().includes(manualInput.toLowerCase()) &&
          !items.some((i) => !i.checked && i.name.toLowerCase() === h.name.toLowerCase())
        )
        .slice(0, 5)
    : [];

  // --- Inline edit ---
  const startEdit = (item: GroceryItem, field: "name" | "quantity") => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditQuantity(item.quantity ?? "");
    setTimeout(() => {
      if (field === "name") editNameRef.current?.focus();
      else editQuantityRef.current?.focus();
    }, 0);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const trimmedName = editName.trim();
    if (!trimmedName) {
      setEditingId(null);
      return;
    }
    // Optimistic update
    setItems((prev) =>
      prev.map((item) =>
        item.id === editingId
          ? { ...item, name: trimmedName, quantity: editQuantity.trim() || undefined }
          : item
      )
    );
    const currentEditId = editingId;
    setEditingId(null);

    await fetch("/api/lista", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update",
        id: currentEditId,
        code,
        name: trimmedName,
        quantity: editQuantity.trim() || undefined,
      }),
    });
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") setEditingId(null);
  };

  // --- Group by category ---
  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  const groupedUnchecked = CATEGORIES
    .map((cat) => ({
      category: cat,
      items: unchecked.filter((i) => (i.category ?? "Altro") === cat.key),
    }))
    .filter((g) => g.items.length > 0);

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
          <div className="flex items-center gap-1.5">
            <h1 className="font-semibold text-text-primary text-[15px]">
              Lista
            </h1>
            <span className="text-xs text-text-tertiary font-mono bg-surface-secondary px-1.5 py-0.5 rounded">
              {code}
            </span>
          </div>
          <button
            onClick={shareList}
            className="flex items-center gap-1.5 text-primary hover:text-primary-dark text-sm font-medium"
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {copied ? "Copiato!" : "Condividi"}
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5">
        {/* Manual input */}
        <div className="relative mb-4">
          <div className="flex items-center gap-2 bg-surface rounded-xl border border-border px-3 py-2.5"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            <Plus className="w-4 h-4 text-text-tertiary flex-shrink-0" />
            <input
              ref={manualInputRef}
              type="text"
              value={manualInput}
              onChange={(e) => {
                setManualInput(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleManualKeyDown}
              placeholder="Aggiungi un prodotto..."
              className="flex-1 bg-transparent text-text-primary text-sm outline-none placeholder:text-text-tertiary"
            />
            {manualInput.trim() && (
              <button
                onClick={() => addManualItem(manualInput)}
                className="text-primary hover:text-primary-dark text-sm font-medium flex-shrink-0"
              >
                Aggiungi
              </button>
            )}
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl overflow-hidden z-20"
              style={{ boxShadow: "var(--shadow-md)" }}
            >
              {filteredSuggestions.map((s) => (
                <button
                  key={s.name}
                  onClick={() => addManualItem(s.name)}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-left hover:bg-surface-secondary text-sm text-text-primary"
                >
                  <Clock className="w-3.5 h-3.5 text-text-tertiary flex-shrink-0" />
                  <span className="capitalize">{s.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

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
            <p className="text-text-secondary font-medium mb-1">Lista vuota</p>
            <p className="text-text-tertiary text-sm mb-4">
              Aggiungi prodotti con la voce o manualmente
            </p>
            <Link
              href={`/parla/${code}`}
              className="inline-flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-primary-dark"
            >
              <Mic className="w-4 h-4" />
              Aggiungi con la voce
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Grouped unchecked items */}
            {groupedUnchecked.map((group) => (
              <div key={group.category.key}>
                <div className="flex items-center gap-2 py-2 px-1">
                  <span className="text-sm">{group.category.emoji}</span>
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    {group.category.label}
                  </span>
                  <span className="text-xs text-text-tertiary">({group.items.length})</span>
                </div>
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 bg-surface rounded-xl border border-border px-4 py-3 mb-2 transition-all hover:border-primary/20"
                    style={{ boxShadow: "var(--shadow-sm)" }}
                  >
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="flex-shrink-0 text-text-tertiary hover:text-primary transition-colors"
                    >
                      <Circle className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                      {editingId === item.id ? (
                        <div className="space-y-1">
                          <input
                            ref={editNameRef}
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={handleEditKeyDown}
                            className="w-full bg-surface-secondary rounded-lg px-2 py-1 text-text-primary font-medium text-[15px] outline-none focus:ring-2 focus:ring-primary/30"
                          />
                          <input
                            ref={editQuantityRef}
                            type="text"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={handleEditKeyDown}
                            placeholder="Quantità"
                            className="w-full bg-surface-secondary rounded-lg px-2 py-1 text-text-tertiary text-xs outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                      ) : (
                        <div
                          onClick={() => startEdit(item, "name")}
                          className="cursor-pointer"
                        >
                          <p className="text-text-primary font-medium text-[15px] truncate">
                            {item.name}
                          </p>
                          {item.quantity && (
                            <p className="text-text-tertiary text-xs mt-0.5">
                              {item.quantity}
                            </p>
                          )}
                        </div>
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
      {!loading && (
        <Link
          href={`/parla/${code}`}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary-dark text-white rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          style={{ boxShadow: "0 8px 24px rgba(108, 92, 231, 0.4)" }}
        >
          <Mic className="w-6 h-6" />
        </Link>
      )}
    </div>
  );
}
