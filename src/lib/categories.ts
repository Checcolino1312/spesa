export interface Category {
  key: string;
  label: string;
  emoji: string;
}

export const CATEGORIES: Category[] = [
  { key: "Frutta e Verdura", label: "Frutta e Verdura", emoji: "🥬" },
  { key: "Latticini", label: "Latticini", emoji: "🧀" },
  { key: "Carne e Pesce", label: "Carne e Pesce", emoji: "🥩" },
  { key: "Pane e Cereali", label: "Pane e Cereali", emoji: "🍞" },
  { key: "Bevande", label: "Bevande", emoji: "🥤" },
  { key: "Surgelati", label: "Surgelati", emoji: "🧊" },
  { key: "Snack e Dolci", label: "Snack e Dolci", emoji: "🍪" },
  { key: "Condimenti", label: "Condimenti", emoji: "🫒" },
  { key: "Igiene e Casa", label: "Igiene e Casa", emoji: "🧹" },
  { key: "Altro", label: "Altro", emoji: "📦" },
];

export const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.key, c]));

export function getCategoryEmoji(key: string): string {
  return CATEGORY_MAP.get(key)?.emoji ?? "📦";
}

export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);
