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

    const res = await fetch("https://api.fireflies.ai/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      return NextResponse.json(
        { error: `Fireflies API error: ${res.status}`, details: errorBody },
        { status: res.status }
      );
    }

    const json = await res.json();

    if (json.errors) {
      return NextResponse.json(
        { error: json.errors[0]?.message || "Fireflies GraphQL error" },
        { status: 400 }
      );
    }

    const transcript = json.data?.transcript;
    if (!transcript) {
      return NextResponse.json({ error: "Transcript not found" }, { status: 404 });
    }

    // Format as readable transcript: "SpeakerName: words\n" per line
    const sentences = (transcript.sentences || []) as { speaker_name: string; raw_words: string }[];
    const formatted = sentences
      .map((s) => `${s.speaker_name}: ${s.raw_words}`)
      .join("\n");

    return NextResponse.json({ transcript: formatted, title: transcript.title });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
