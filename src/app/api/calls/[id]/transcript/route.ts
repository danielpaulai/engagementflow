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

    console.log("[transcript] Requesting transcript ID:", id);

    const query = `{ transcript(id: "${id}") { id title sentences { speaker_name text } } }`;

    const res = await fetch("https://api.fireflies.ai/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ query }),
    });

    const rawBody = await res.text();
    console.log("[transcript] Fireflies status:", res.status);
    console.log("[transcript] Fireflies response:", rawBody);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Fireflies API error: ${res.status}`, details: rawBody },
        { status: res.status }
      );
    }

    const json = JSON.parse(rawBody);

    if (json.errors) {
      return NextResponse.json(
        { error: json.errors[0]?.message || "Fireflies GraphQL error", details: json.errors },
        { status: 400 }
      );
    }

    const transcript = json.data?.transcript;
    if (!transcript) {
      return NextResponse.json({ error: "Transcript not found" }, { status: 404 });
    }

    // Format as readable transcript: "SpeakerName: words\n" per line
    const sentences = (transcript.sentences || []) as { speaker_name: string; text: string }[];
    const formatted = sentences
      .map((s) => `${s.speaker_name}: ${s.text}`)
      .join("\n");

    return NextResponse.json({ transcript: formatted, title: transcript.title });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
