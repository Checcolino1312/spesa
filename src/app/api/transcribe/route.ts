import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio, extractGroceryItems } from "@/lib/openai";
import { addItems } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const code = formData.get("code") as string | null;

    if (!audioFile) {
      return NextResponse.json({ error: "Nessun file audio ricevuto" }, { status: 400 });
    }

    if (!code) {
      return NextResponse.json({ error: "Codice lista mancante" }, { status: 400 });
    }

    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const mimeType = audioFile.type || "audio/webm";

    // 1. Trascrivi con Whisper
    const transcript = await transcribeAudio(buffer, mimeType);

    if (!transcript.trim()) {
      return NextResponse.json({ error: "Non sono riuscito a capire il vocale" }, { status: 400 });
    }

    // 2. Estrai prodotti con GPT
    const extractedItems = await extractGroceryItems(transcript);

    if (extractedItems.length === 0) {
      return NextResponse.json({
        transcript,
        items: [],
        message: "Non ho trovato prodotti nel vocale",
      });
    }

    // 3. Salva nella lista
    const savedItems = await addItems(code, extractedItems);

    return NextResponse.json({
      transcript,
      items: savedItems,
      message: `Aggiunti ${savedItems.length} prodotti alla lista`,
    });
  } catch (error) {
    console.error("Errore trascrizione:", error);
    return NextResponse.json({ error: "Errore durante l'elaborazione" }, { status: 500 });
  }
}
