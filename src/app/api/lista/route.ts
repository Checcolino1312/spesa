import { NextRequest, NextResponse } from "next/server";
import { getItems, toggleItem, removeItem, clearItems, clearCheckedItems } from "@/lib/store";

export async function GET() {
  const items = await getItems();
  return NextResponse.json({ items });
}

export async function PATCH(request: NextRequest) {
  try {
    const { action, id } = await request.json();

    if (action === "toggle" && id) {
      const items = await toggleItem(id);
      return NextResponse.json({ items });
    }

    if (action === "remove" && id) {
      const items = await removeItem(id);
      return NextResponse.json({ items });
    }

    if (action === "clear_checked") {
      const items = await clearCheckedItems();
      return NextResponse.json({ items });
    }

    if (action === "clear_all") {
      await clearItems();
      return NextResponse.json({ items: [] });
    }

    return NextResponse.json({ error: "Azione non valida" }, { status: 400 });
  } catch (error) {
    console.error("Errore lista:", error);
    return NextResponse.json({ error: "Errore durante l'operazione" }, { status: 500 });
  }
}
