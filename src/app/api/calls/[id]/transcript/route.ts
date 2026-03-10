import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const apiKey = searchParams.get("api_key");
    const { id } = params;

    if (!apiKey) {
      return NextResponse.json({ error: "Fireflies API key is required" }, { status: 400 });
    }

    const query = `{ transcript(id: "${id}") { id title sentences { speaker_name raw_words } } }`;

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

    return NextResponse.json({ transcript: rawBody });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
