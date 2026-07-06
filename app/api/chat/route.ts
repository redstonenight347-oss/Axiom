import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
  // User verification here

  const { userText } = await req.json();

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userText }] }],
      })
    })
    if (!response.ok) {
      console.log(response)
      return NextResponse.json({ error: "LLM fetch failed" }, { status: 501 })
    }
    const llmReply = await response.json()

    const filteredText = llmReply?.candidates[0]?.content?.parts[0]?.text
// console.log(llmReply)
    return NextResponse.json({ message: "Successful connection with a LLM", reply: filteredText }, { status: 200 })
  }
  catch (err) {
    console.log(err)
    return NextResponse.json({ error: "Internal serer error" }, { status: 500 })
  }
}