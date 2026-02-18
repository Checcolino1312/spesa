import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
      <div className="max-w-sm mx-auto px-6 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Lista Spesa</h1>
        <p className="text-gray-500 mb-10">La spesa in famiglia, semplice</p>

        <div className="space-y-4">
          <Link
            href="/parla"
            className="flex items-center gap-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl px-6 py-5 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-orange-200"
          >
            <span className="text-3xl">🎤</span>
            <div className="text-left">
              <p className="font-semibold text-lg">Registra</p>
              <p className="text-orange-100 text-sm">Di&apos; cosa ti serve</p>
            </div>
          </Link>

          <Link
            href="/lista"
            className="flex items-center gap-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl px-6 py-5 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-200"
          >
            <span className="text-3xl">🛒</span>
            <div className="text-left">
              <p className="font-semibold text-lg">Lista</p>
              <p className="text-green-100 text-sm">Vedi cosa comprare</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
