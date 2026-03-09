import { NextResponse } from "next/server";

interface FirefliesSentence {
  speaker_name: string;
  raw_words: string;
}

interface FirefliesTranscript {
  id: string;
  title: string;
  date: string;
  duration: number;
  participants: string[];
  sentences: FirefliesSentence[];
}

const FIREFLIES_QUERY = `
  query {
    transcripts(limit: 20) {
      id
      title
      date
      duration
      participants
      sentences {
        speaker_name
        raw_words
      }
    }
  }
`;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const apiKey = searchParams.get("api_key");

    if (!apiKey) {
      return NextResponse.json({ error: "Fireflies API key is required" }, { status: 400 });
    }

    const res = await fetch("https://api.fireflies.ai/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ query: FIREFLIES_QUERY }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[calls] Fireflies API error:", res.status, text);
      return NextResponse.json(
        { error: `Fireflies API error: ${res.status}` },
        { status: res.status }
      );
    }

    const json = await res.json();

    if (json.errors) {
      console.error("[calls] Fireflies GraphQL errors:", json.errors);
      return NextResponse.json(
        { error: json.errors[0]?.message || "Fireflies GraphQL error" },
        { status: 400 }
      );
    }

    const transcripts = (json.data?.transcripts || []) as FirefliesTranscript[];

    const calls = transcripts.map((t) => {
      // Build preview from first few sentences
      const previewSentences = (t.sentences || []).slice(0, 10);
      const preview = previewSentences
        .map((s) => `${s.speaker_name}: ${s.raw_words}`)
        .join(" ")
        .slice(0, 200);

      return {
        id: t.id,
        title: t.title,
        date: t.date,
        duration: t.duration,
        participants: t.participants || [],
        preview,
      };
    });

    return NextResponse.json({ calls });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[calls] Error:", error.message);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
