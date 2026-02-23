import OpenAI from "openai";
import { CATEGORY_KEYS } from "./categories";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
  const ext = mimeType.includes("webm") ? "webm" : mimeType.includes("mp4") ? "mp4" : "wav";
  const uint8 = new Uint8Array(audioBuffer);
  const file = new File([uint8], `audio.${ext}`, { type: mimeType });

  const transcription = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file,
    language: "it",
  });

  return transcription.text;
}

export async function extractGroceryItems(
  text: string
): Promise<{ name: string; quantity?: string; category?: string }[]> {
  const categoryList = CATEGORY_KEYS.join(", ");

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Sei un assistente per la lista della spesa. Dall'input dell'utente, estrai i prodotti da comprare.
Rispondi SOLO con un JSON valido nel formato:
{"items": [{"name": "nome prodotto", "quantity": "quantità se specificata", "category": "categoria"}]}
- Normalizza i nomi (prima lettera maiuscola)
- Se la quantità non è specificata, ometti il campo quantity
- Raggruppa duplicati sommando le quantità
- Ignora parole non relative a prodotti (saluti, riempitivi, ecc.)
- Assegna a ogni prodotto una delle seguenti categorie: ${categoryList}
- Se non sai la categoria, usa "Altro"`,
      },
      {
        role: "user",
        content: text,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return [];

  try {
    const parsed = JSON.parse(content);
    return parsed.items ?? [];
  } catch {
    return [];
  }
}
