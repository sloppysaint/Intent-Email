import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

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
  if (!apiKey) {
    logger.error("OPENROUTER_API_KEY is not set in environment variables");
    return NextResponse.json({ 
      error: "No OpenRouter API key", 
      details: "Please set OPENROUTER_API_KEY in your .env.local file" 
    }, { status: 500 });
  }
  
  logger.debug("OpenRouter API key found", { length: apiKey.length });

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

  // === Use a free model - try multiple options if one fails ===
  // Available free models (in order of preference):
  // 1. meta-llama/llama-3.2-3b-instruct:free - Fast and reliable
  // 2. google/gemini-flash-1.5:free - Good alternative
  // 3. microsoft/phi-3-mini-128k-instruct:free - Backup option
  const model = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.2-3b-instruct:free";
  
  logger.debug("Sending request to OpenRouter API", { model, textLength: text.length });
  
  let response;
  try {
    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
        "X-Title": "EmailIntentSummarizer"
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are an expert email classification assistant. Always respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
        max_tokens: 400,
        temperature: 0.1
      })
    });
  } catch (fetchError) {
    logger.error("Network error calling OpenRouter API", fetchError);
    return NextResponse.json({ 
      summary: "", 
      intent: "other", 
      error: "Network error: " + (fetchError instanceof Error ? fetchError.message : "Unknown error")
    }, { status: 500 });
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unable to read error response");
    logger.error("OpenRouter API error", { status: response.status, error: errorText });
    
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { error: errorText };
    }
    
    // If model not found (404), suggest alternative models
    if (response.status === 404 && errorData.error?.message?.includes("No endpoints found")) {
      logger.warn("Model not found, trying alternative free model");
      
      // Try alternative free model
      const alternativeModel = model.includes("llama") 
        ? "google/gemini-flash-1.5:free"
        : "meta-llama/llama-3.2-3b-instruct:free";
      
      logger.debug("Retrying with model", { alternativeModel });
      
      try {
        const retryResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
            "X-Title": "EmailIntentSummarizer"
          },
          body: JSON.stringify({
            model: alternativeModel,
            messages: [
              { role: "system", content: "You are an expert email classification assistant. Always respond with valid JSON only." },
              { role: "user", content: prompt },
            ],
            max_tokens: 400,
            temperature: 0.1
          })
        });
        
        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          // Process retry response (will continue below)
          const retryContent = retryData?.choices?.[0]?.message?.content?.trim() || "";
          
          if (retryContent) {
            logger.debug("Alternative model worked", { model: alternativeModel });
            // Parse and return the retry response
            try {
              const jsonMatch = retryContent.match(/\{[\s\S]*?"summary"[\s\S]*?"intent"[\s\S]*?\}/);
              if (jsonMatch) {
                const obj = JSON.parse(jsonMatch[0]);
                return NextResponse.json({ 
                  summary: obj.summary || "", 
                  intent: obj.intent?.toLowerCase() || "other" 
                });
              }
            } catch (e) {
              // Fall through to error
            }
          }
        }
      } catch (retryError) {
        logger.error("Retry with alternative model also failed", retryError);
      }
    }
    
    return NextResponse.json({ 
      summary: "", 
      intent: "other", 
      error: `OpenRouter API error (${response.status}): ${errorData.error?.message || errorData.error || errorText}`,
      suggestion: response.status === 404 ? "Try updating OPENROUTER_MODEL in .env.local to a different free model" : undefined
    }, { status: response.status });
  }

  const data = await response.json();
  logger.debug("OpenRouter API response received");

  // --- Robustly check for valid content ---
  let content = "";
  if (
    data &&
    Array.isArray(data.choices) &&
    data.choices.length > 0 &&
    data.choices[0] &&
    data.choices[0].message &&
    typeof data.choices[0].message.content === "string"
  ) {
    content = data.choices[0].message.content.trim();
    logger.debug("Received content from OpenRouter", { length: content.length });
  } else {
    logger.error("OpenRouter returned invalid or empty choices", data);
    return NextResponse.json({ 
      summary: "", 
      intent: "other", 
      error: "OpenRouter returned no completions. Response structure: " + JSON.stringify(data).substring(0, 200)
    }, { status: 200 });
  }

  let summary = "";
  let intent = "";
  try {
    if (!content) throw new Error("No content returned from OpenRouter");

    // Try to extract JSON from the response string
    const jsonMatch = content.match(/\{[\s\S]*?"summary"[\s\S]*?"intent"[\s\S]*?\}/);
    if (jsonMatch) {
      const obj = JSON.parse(jsonMatch[0]);
      summary = obj.summary || "";
      intent = obj.intent || "";
    } else {
      // Fallback: Try to parse the whole content as JSON (sometimes works)
      const obj = JSON.parse(content);
      summary = obj.summary || "";
      intent = obj.intent || "";
    }
  } catch (e) {
    logger.error("JSON parsing error", { error: e, contentPreview: content.substring(0, 500) });
    summary = "";
    intent = "other";
  }

  if (!summary && !intent) {
    logger.warn("No summary or intent extracted", { contentPreview: content.substring(0, 200) });
  } else {
    logger.debug("Successfully extracted summary and intent", { summary: summary.substring(0, 50) + "...", intent });
  }

  return NextResponse.json({ summary, intent });
}
