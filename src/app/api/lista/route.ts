import { NextRequest, NextResponse } from "next/server";
import {
  getItems,
  addItems,
  toggleItem,
  removeItem,
  clearItems,
  clearCheckedItems,
  updateItem,
  createList,
  listExists,
} from "@/lib/store";

// POST: create a new list
export async function POST() {
  const code = await createList();
  return NextResponse.json({ code });
}

// GET: fetch items for a list
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Codice lista mancante" }, { status: 400 });
  }
  const exists = await listExists(code);
  if (!exists) {
    return NextResponse.json({ error: "Lista non trovata" }, { status: 404 });
  }
  const items = await getItems(code);
  return NextResponse.json({ items });
}

// PATCH: modify list items
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, code, name, quantity, items: newItems } = body;

    if (!code) {
      return NextResponse.json({ error: "Codice lista mancante" }, { status: 400 });
    }

    if (action === "toggle" && id) {
      const items = await toggleItem(code, id);
      return NextResponse.json({ items });
    }

    if (action === "remove" && id) {
      const items = await removeItem(code, id);
      return NextResponse.json({ items });
    }

    if (action === "clear_checked") {
      const items = await clearCheckedItems(code);
      return NextResponse.json({ items });
    }

    if (action === "clear_all") {
      await clearItems(code);
      return NextResponse.json({ items: [] });
    }

    if (action === "add" && newItems) {
      const saved = await addItems(code, newItems);
      return NextResponse.json({ items: saved });
    }

    if (action === "update" && id) {
      const items = await updateItem(code, id, { name, quantity });
      return NextResponse.json({ items });
    }

    return NextResponse.json({ error: "Azione non valida" }, { status: 400 });
  } catch (error) {
    console.error("Errore lista:", error);
    return NextResponse.json({ error: "Errore durante l'operazione" }, { status: 500 });
  }
}
