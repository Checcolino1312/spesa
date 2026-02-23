import { NextRequest, NextResponse } from "next/server";
import { getHistory } from "@/lib/store";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Codice lista mancante" }, { status: 400 });
  }
  const history = await getHistory(code);
  return NextResponse.json({ history });
}
