import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const apiKey = searchParams.get("api_key");

    if (!apiKey) {
      return NextResponse.json({ error: "Fireflies API key is required" }, { status: 400 });
    }

    const query = "{ transcripts(limit: 20) { id title date duration participants } }";

    const res = await fetch('https://api.fireflies.ai/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ query })
    });

    const rawBody = await res.text();
    console.log('Status:', res.status);
    console.log('Body:', rawBody);

    return NextResponse.json({ calls: rawBody });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[calls] Error:", error.message);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
