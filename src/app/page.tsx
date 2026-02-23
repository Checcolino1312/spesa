"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Plus, LogIn, Loader2, AlertCircle } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createList = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/lista", { method: "POST" });
      const data = await res.json();
      router.push(`/lista/${data.code}`);
    } catch {
      setError("Errore nella creazione della lista");
      setCreating(false);
    }
  };

  const joinList = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setJoining(true);
    setError(null);
    try {
      const res = await fetch(`/api/lista?code=${code}`);
      if (res.ok) {
        router.push(`/lista/${code}`);
      } else {
        setError("Lista non trovata. Controlla il codice.");
        setJoining(false);
      }
    } catch {
      setError("Errore di connessione");
      setJoining(false);
    }
  };

  const handleJoinKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") joinList();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        {/* Logo / Brand */}
        <div className="mb-10">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">
            Lista Spesa
          </h1>
          <p className="text-text-secondary mt-1 text-sm">
            La spesa in famiglia, semplice
          </p>
        </div>

        {/* Action Cards */}
        <div className="space-y-3">
          {/* Create new list */}
          <button
            onClick={createList}
            disabled={creating}
            className="group flex items-center gap-4 w-full bg-primary hover:bg-primary-dark text-white rounded-2xl px-5 py-4 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
            style={{ boxShadow: "0 8px 24px rgba(108, 92, 231, 0.3)" }}
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              {creating ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Plus className="w-6 h-6" />
              )}
            </div>
            <div className="text-left">
              <p className="font-semibold text-[15px]">Crea nuova lista</p>
              <p className="text-white/70 text-xs">Genera un codice da condividere</p>
            </div>
          </button>

          {/* Join existing list */}
          <div
            className="bg-surface rounded-2xl border border-border px-5 py-4"
            style={{ boxShadow: "var(--shadow-md)" }}
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <LogIn className="w-6 h-6 text-accent" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-[15px] text-text-primary">Unisciti a una lista</p>
                <p className="text-text-tertiary text-xs">Inserisci il codice condiviso</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                onKeyDown={handleJoinKeyDown}
                placeholder="Es. ABC123"
                maxLength={6}
                className="flex-1 bg-surface-secondary text-text-primary text-center text-sm font-mono font-semibold tracking-widest px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-text-tertiary placeholder:tracking-normal placeholder:font-normal"
              />
              <button
                onClick={joinList}
                disabled={joining || !joinCode.trim()}
                className="bg-accent hover:bg-accent/90 text-white text-sm font-medium px-4 py-2.5 rounded-xl disabled:opacity-50 transition-all"
              >
                {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : "Vai"}
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 justify-center mt-4 text-danger text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
