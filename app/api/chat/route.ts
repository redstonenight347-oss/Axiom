import { NextRequest, NextResponse } from "next/server";
import { genAI, GEMINI_MODEL } from "@/lib/ai/config";
import { webSearchToolDeclaration, WEB_SEARCH_TOOL_NAME } from "@/lib/ai/tools";
import { TavilySearchProvider } from "@/lib/ai/search/tavily";

export async function POST(req: NextRequest) {
  // User verification here

  const { userText } = await req.json();

  if (!userText) {
    return NextResponse.json({ error: "Missing userText" }, { status: 400 });
  }

  try {
    const chat = genAI.chats.create({
      model: GEMINI_MODEL,
      config: {
        tools: [{ functionDeclarations: [webSearchToolDeclaration] }],
      },
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let currentMessage: any = userText;
          
          while (true) {
            const responseStream = await chat.sendMessageStream(currentMessage);
            let functionCallFound = false;
            let currentFunctionCall: any = null;

            for await (const chunk of responseStream) {
              if (chunk.functionCalls && chunk.functionCalls.length > 0) {
                currentFunctionCall = chunk.functionCalls[0];
                functionCallFound = true;
                break; // Stop streaming text, we need to handle the function
              }
              
              if (chunk.text) {
                // Ensure text chunks are sent with newlines as the frontend splits by \n
                controller.enqueue(new TextEncoder().encode(chunk.text + "\n"));
              }
            }

            if (functionCallFound && currentFunctionCall) {
              if (currentFunctionCall.name === WEB_SEARCH_TOOL_NAME) {
                try {
                  const args = currentFunctionCall.args as { query: string; maxResults?: number };
                  const searchProvider = new TavilySearchProvider();
                  const results = await searchProvider.search(args.query, { maxResults: args.maxResults });
                  
                  currentMessage = [{
                    functionResponse: {
                      name: WEB_SEARCH_TOOL_NAME,
                      response: { results }
                    }
                  }];
                  // Continue the loop to send the function response and get the next stream
                  continue;
                } catch (error: any) {
                  currentMessage = [{
                    functionResponse: {
                      name: WEB_SEARCH_TOOL_NAME,
                      response: { error: error.message }
                    }
                  }];
                  continue;
                }
              } else {
                 // Unknown function call, just send a fake response to continue
                 currentMessage = [{
                    functionResponse: {
                      name: currentFunctionCall.name,
                      response: { error: "Function not implemented" }
                    }
                  }];
                  continue;
              }
            }
            
            // If we get here, no function call was found, so the turn is complete.
            break;
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
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
