import { Redis } from "@upstash/redis";
import { v4 as uuidv4 } from "uuid";

export interface GroceryItem {
  id: string;
  name: string;
  quantity?: string;
  category?: string;
  checked: boolean;
  createdAt: string;
}

// Characters excluding ambiguous 0/O/1/I/l
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateListCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

function listKey(code: string): string {
  return `spesa:lista:${code.toUpperCase()}`;
}

function historyKey(code: string): string {
  return `spesa:storico:${code.toUpperCase()}`;
}

// --- Upstash Redis (production) ---
function getRedis(): Redis | null {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return null;
}

// --- In-memory fallback (local dev) ---
const memoryStore: Map<string, unknown> = new Map();

export async function createList(): Promise<string> {
  const code = generateListCode();
  const redis = getRedis();
  const key = listKey(code);
  if (redis) {
    await redis.set(key, []);
  } else {
    memoryStore.set(key, []);
  }
  return code;
}

export async function listExists(code: string): Promise<boolean> {
  const redis = getRedis();
  const key = listKey(code);
  if (redis) {
    return (await redis.exists(key)) === 1;
  }
  return memoryStore.has(key);
}

export async function getItems(listCode: string): Promise<GroceryItem[]> {
  const redis = getRedis();
  const key = listKey(listCode);
  if (redis) {
    const data = await redis.get<GroceryItem[]>(key);
    return data ?? [];
  }
  return (memoryStore.get(key) as GroceryItem[] | undefined) ?? [];
}

// --- Deduplication helpers ---

function normalizeForCompare(name: string): string {
  return name.toLowerCase().trim();
}

interface ParsedQuantity {
  value: number;
  unit: string;
}

function parseQuantity(q: string): ParsedQuantity | null {
  const match = q.trim().match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);
  if (!match) return null;
  return { value: parseFloat(match[1].replace(",", ".")), unit: match[2].toLowerCase().trim() };
}

function mergeQuantities(existing: string | undefined, incoming: string | undefined): string | undefined {
  if (!existing && !incoming) return undefined;
  if (!existing) return incoming;
  if (!incoming) return existing;

  const pExisting = parseQuantity(existing);
  const pIncoming = parseQuantity(incoming);

  if (pExisting && pIncoming && pExisting.unit === pIncoming.unit) {
    const sum = pExisting.value + pIncoming.value;
    const formatted = Number.isInteger(sum) ? sum.toString() : sum.toFixed(1);
    return pIncoming.unit ? `${formatted} ${pIncoming.unit}` : formatted;
  }

  // Can't merge numerically, concatenate
  return `${existing} + ${incoming}`;
}

export async function addItems(
  listCode: string,
  items: Omit<GroceryItem, "id" | "checked" | "createdAt">[]
): Promise<GroceryItem[]> {
  const existing = await getItems(listCode);
  const newItems: GroceryItem[] = [];

  for (const item of items) {
    const normalizedName = normalizeForCompare(item.name);
    const match = existing.find(
      (e) => !e.checked && normalizeForCompare(e.name) === normalizedName
    );

    if (match) {
      // Merge quantity
      match.quantity = mergeQuantities(match.quantity, item.quantity);
      // Update category if new one is more specific
      if (item.category && item.category !== "Altro" && (!match.category || match.category === "Altro")) {
        match.category = item.category;
      }
    } else {
      const newItem: GroceryItem = {
        id: uuidv4(),
        name: item.name,
        quantity: item.quantity,
        category: item.category ?? "Altro",
        checked: false,
        createdAt: new Date().toISOString(),
      };
      existing.push(newItem);
      newItems.push(newItem);
    }
  }

  await saveItems(listCode, existing);

  // Track in history
  const allNames = items.map((i) => i.name);
  await trackItems(listCode, allNames);

  return newItems;
}

export async function toggleItem(listCode: string, id: string): Promise<GroceryItem[]> {
  const items = await getItems(listCode);
  const updated = items.map((item) =>
    item.id === id ? { ...item, checked: !item.checked } : item
  );
  await saveItems(listCode, updated);
  return updated;
}

export async function removeItem(listCode: string, id: string): Promise<GroceryItem[]> {
  const items = await getItems(listCode);
  const updated = items.filter((item) => item.id !== id);
  await saveItems(listCode, updated);
  return updated;
}

export async function clearItems(listCode: string): Promise<void> {
  await saveItems(listCode, []);
}

export async function clearCheckedItems(listCode: string): Promise<GroceryItem[]> {
  const items = await getItems(listCode);
  const updated = items.filter((item) => !item.checked);
  await saveItems(listCode, updated);
  return updated;
}

export async function updateItem(
  listCode: string,
  id: string,
  updates: { name?: string; quantity?: string }
): Promise<GroceryItem[]> {
  const items = await getItems(listCode);
  const updated = items.map((item) =>
    item.id === id ? { ...item, ...updates } : item
  );
  await saveItems(listCode, updated);
  return updated;
}

// --- History (frequent products) ---

export async function trackItems(listCode: string, names: string[]): Promise<void> {
  const redis = getRedis();
  const key = historyKey(listCode);
  if (redis) {
    for (const name of names) {
      await redis.hincrby(key, name.toLowerCase(), 1);
    }
  } else {
    const history = (memoryStore.get(key) as Record<string, number> | undefined) ?? {};
    for (const name of names) {
      const k = name.toLowerCase();
      history[k] = (history[k] ?? 0) + 1;
    }
    memoryStore.set(key, history);
  }
}

export async function getHistory(listCode: string): Promise<{ name: string; count: number }[]> {
  const redis = getRedis();
  const key = historyKey(listCode);
  if (redis) {
    const data = await redis.hgetall<Record<string, number>>(key);
    if (!data) return [];
    return Object.entries(data)
      .map(([name, count]) => ({ name, count: Number(count) }))
      .sort((a, b) => b.count - a.count);
  }
  const history = (memoryStore.get(key) as Record<string, number> | undefined) ?? {};
  return Object.entries(history)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

// --- Migration: check old global list ---

export async function getOldListItems(): Promise<GroceryItem[] | null> {
  const redis = getRedis();
  const OLD_KEY = "spesa:lista";
  if (redis) {
    const data = await redis.get<GroceryItem[]>(OLD_KEY);
    return data && data.length > 0 ? data : null;
  }
  const data = memoryStore.get(OLD_KEY) as GroceryItem[] | undefined;
  return data && data.length > 0 ? data : null;
}

export async function migrateOldList(newCode: string): Promise<GroceryItem[]> {
  const oldItems = await getOldListItems();
  if (!oldItems || oldItems.length === 0) return [];
  // Add category default
  const itemsWithCategory = oldItems.map((item) => ({
    ...item,
    category: item.category ?? "Altro",
  }));
  await saveItems(newCode, itemsWithCategory);
  // Clear old key
  const redis = getRedis();
  const OLD_KEY = "spesa:lista";
  if (redis) {
    await redis.del(OLD_KEY);
  } else {
    memoryStore.delete(OLD_KEY);
  }
  return itemsWithCategory;
}

async function saveItems(listCode: string, items: GroceryItem[]): Promise<void> {
  const redis = getRedis();
  const key = listKey(listCode);
  if (redis) {
    await redis.set(key, items);
  } else {
    memoryStore.set(key, items);
  }
}
