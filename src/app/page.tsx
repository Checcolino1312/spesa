import Link from "next/link";
import { Mic, ShoppingCart } from "lucide-react";

export default function Home() {
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
          <Link
            href="/parla"
            className="group flex items-center gap-4 bg-primary hover:bg-primary-dark text-white rounded-2xl px-5 py-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ boxShadow: "0 8px 24px rgba(108, 92, 231, 0.3)" }}
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Mic className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-[15px]">Registra</p>
              <p className="text-white/70 text-xs">Di&apos; cosa ti serve</p>
            </div>
          </Link>

          <Link
            href="/lista"
            className="group flex items-center gap-4 bg-surface hover:bg-surface-secondary text-text-primary rounded-2xl px-5 py-4 border border-border transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ boxShadow: "var(--shadow-md)" }}
          >
            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-6 h-6 text-accent" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-[15px]">Lista</p>
              <p className="text-text-tertiary text-xs">Vedi cosa comprare</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
