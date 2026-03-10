import { NextResponse } from "next/server";

function buildTranscriptQuery(id: string) {
  return `{ transcript(id: "${id}") { id title sentences { speaker_name raw_words } } }`;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const apiKey = searchParams.get("api_key");
    const { id } = params;

    console.log("Transcript ID:", id);

    if (!apiKey) {
      return NextResponse.json({ error: "Fireflies API key is required" }, { status: 400 });
    }

    console.log("Key prefix:", apiKey.substring(0, 8));

    const query = buildTranscriptQuery(id);
    console.log("Query:", query);

    const res = await fetch("https://api.fireflies.ai/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ query }),
    });

    const rawBody = await res.text();
    console.log("Fireflies raw response status:", res.status);
    console.log("Fireflies raw response:", rawBody);

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
