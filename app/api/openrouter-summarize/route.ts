import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let text = "";
  try {
    const body = await req.json();
    text = body.text || "";
    if (!text) {
      return NextResponse.json({ summary: "", intent: "", error: "No text in request body" }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ summary: "", intent: "", error: "Invalid or missing JSON body" }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "No OpenRouter API key" }, { status: 500 });

  const prompt = `
Given the following email content, do two things:
1. Summarize the email in about 60 words.
2. Assign its intent/label as one of these: urgent, meeting, request, update, promotion, personal, social, info, primary, other.

ONLY reply with a JSON object in this format, and nothing else:
{"summary": "...", "intent": "..."}

EMAIL:
${text}
`;

  const model = "google/gemini-flash-1.5";

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "http://localhost:3000/", // Update to your prod domain if needed
      "X-Title": "EmailIntentSummarizer"
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      max_tokens: 400,
      temperature: 0.2
    })
  });

  const data = await response.json();
  console.log("Full OpenRouter API response:", JSON.stringify(data, null, 2));
  const content = data?.choices?.[0]?.message?.content || "";
  console.log("OpenRouter Content:", content);

  let summary = "";
  let intent = "";
  try {
    const match = content.match(/\{[\s\S]*?\}/);
    if (match) {
      const obj = JSON.parse(match[0]);
      summary = obj.summary || "";
      intent = obj.intent || "";
    }
  } catch (e) {
    summary = "";
    intent = "";
  }

  return NextResponse.json({ summary, intent });
}
