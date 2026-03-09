import { NextResponse } from "next/server";

const TRANSCRIPT_QUERY = `
  query GetTranscript($id: String!) {
    transcript(id: $id) {
      id
      title
      date
      sentences {
        speaker_name
        raw_words
      }
    }
  }
`;

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

    const res = await fetch("https://api.fireflies.ai/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: TRANSCRIPT_QUERY,
        variables: { id },
      }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Fireflies API error: ${res.status}` },
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

    // Format as readable transcript
    const sentences = (transcript.sentences || []) as { speaker_name: string; raw_words: string }[];
    let formatted = `[Call Recording - ${transcript.title}]\nDate: ${transcript.date}\n\n`;

    let lastSpeaker = "";
    for (const s of sentences) {
      if (s.speaker_name !== lastSpeaker) {
        if (lastSpeaker) formatted += "\n\n";
        formatted += `${s.speaker_name}: ${s.raw_words}`;
        lastSpeaker = s.speaker_name;
      } else {
        formatted += ` ${s.raw_words}`;
      }
    }

    return NextResponse.json({ transcript: formatted, title: transcript.title });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
