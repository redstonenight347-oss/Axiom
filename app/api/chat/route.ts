import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // User verification here

  const { userText } = await req.json();

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:streamGenerateContent?alt=sse&key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userText }] }],
        }),
      }
    );

    if (!response.ok) {
      console.log(response);
      return NextResponse.json({ error: "LLM fetch failed" }, { status: 502 });
    }

    if (!response.body) {
      return NextResponse.json(
        { error: "No response body from LLM" },
        { status: 502 }
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data: ")) continue;

              const jsonStr = trimmed.slice("data: ".length);
              if (jsonStr === "[DONE]") continue;

              try {
                const parsed = JSON.parse(jsonStr);
                const text =
                  parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
                if (text) {
                  controller.enqueue(
                    new TextEncoder().encode(text + "\n")
                  );
                }
              } catch {
                // Ignore malformed JSON lines
              }
            }
          }
        } catch (err) {
          console.error("Stream error:", err);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
