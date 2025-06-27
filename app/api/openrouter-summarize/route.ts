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
You are an email classification assistant. Analyze the following email and provide:
1. A concise summary (50-60 words)
2. The most appropriate intent category

INTENT CATEGORIES (choose exactly one):
- urgent: Time-sensitive matters requiring immediate attention, deadlines, emergencies
- meeting: Meeting invitations, scheduling, calendar requests, appointment confirmations
- request: Asking for information, help, approval, documents, or action from recipient
- update: Status updates, progress reports, announcements, notifications about changes
- promotion: Marketing emails, sales offers, advertisements, promotional content
- personal: Personal messages, non-work related communication, casual conversations
- social: Social invitations, community events, networking, social media notifications
- info: Educational content, newsletters, articles, general information sharing
- primary: Important business communication, formal correspondence, official notices
- other: Anything that doesn't clearly fit the above categories

INSTRUCTIONS:
- Choose the MOST specific category that fits
- If multiple categories apply, choose the primary purpose
- Be consistent with categorization logic
- Summary should capture the main point and any action items

Respond ONLY with valid JSON in this exact format:
{"summary": "your summary here", "intent": "category_name"}

EMAIL CONTENT:
${text}`;

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
        { role: "system", content: "You are an expert email classification assistant. Always respond with valid JSON only." },
        { role: "user", content: prompt },
      ],
      max_tokens: 400,
      temperature: 0.1 // Lower temperature for more consistent categorization
    })
  });

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || "";
 
  let summary = "";
  let intent = "";
  try {
    // More robust JSON extraction
    const jsonMatch = content.match(/\{[^}]*"summary"[^}]*"intent"[^}]*\}/);
    if (jsonMatch) {
      const obj = JSON.parse(jsonMatch[0]);
      summary = obj.summary || "";
      intent = obj.intent || "";
    } else {
      // Fallback: try to parse the entire content as JSON
      const obj = JSON.parse(content);
      summary = obj.summary || "";
      intent = obj.intent || "";
    }
  } catch (e) {
    console.error("JSON parsing error:", e);
    summary = "";
    intent = "";
  }

  return NextResponse.json({ summary, intent });
}