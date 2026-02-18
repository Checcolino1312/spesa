import { Redis } from "@upstash/redis";
import { v4 as uuidv4 } from "uuid";

export interface GroceryItem {
  id: string;
  name: string;
  quantity?: string;
  checked: boolean;
  createdAt: string;
}

const LISTA_KEY = "spesa:lista";

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
const memoryStore: Map<string, GroceryItem[]> = new Map();

export async function getItems(): Promise<GroceryItem[]> {
  const redis = getRedis();
  if (redis) {
    const data = await redis.get<GroceryItem[]>(LISTA_KEY);
    return data ?? [];
  }
  return memoryStore.get(LISTA_KEY) ?? [];
}

export async function addItems(items: Omit<GroceryItem, "id" | "checked" | "createdAt">[]): Promise<GroceryItem[]> {
  const existing = await getItems();
  const newItems: GroceryItem[] = items.map((item) => ({
    id: uuidv4(),
    name: item.name,
    quantity: item.quantity,
    checked: false,
    createdAt: new Date().toISOString(),
  }));
  const updated = [...existing, ...newItems];
  await saveItems(updated);
  return newItems;
}

export async function toggleItem(id: string): Promise<GroceryItem[]> {
  const items = await getItems();
  const updated = items.map((item) =>
    item.id === id ? { ...item, checked: !item.checked } : item
  );
  await saveItems(updated);
  return updated;
}

export async function removeItem(id: string): Promise<GroceryItem[]> {
  const items = await getItems();
  const updated = items.filter((item) => item.id !== id);
  await saveItems(updated);
  return updated;
}

export async function clearItems(): Promise<void> {
  await saveItems([]);
}

export async function clearCheckedItems(): Promise<GroceryItem[]> {
  const items = await getItems();
  const updated = items.filter((item) => !item.checked);
  await saveItems(updated);
  return updated;
}

async function saveItems(items: GroceryItem[]): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.set(LISTA_KEY, items);
  } else {
    memoryStore.set(LISTA_KEY, items);
  }
}
