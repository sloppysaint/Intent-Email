import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { AccountModel } from "@/models/Account";

export async function POST(req: NextRequest) {
  try {
    const { accountId, emailId, action } = await req.json();
    
    if (!accountId || !emailId || !action) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    await connectToDatabase();
    const account = await AccountModel.findById(accountId);
    
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const accessToken = account.accessToken;
    
    // Check if token is valid/not expired
    if (!accessToken) {
      return NextResponse.json({ error: "No access token found" }, { status: 401 });
    }

    // Gmail API endpoints and payloads
    let url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}/modify`;
    let payload = {
      addLabelIds: [] as string[],
      removeLabelIds: [] as string[],
    };

    // Configure action-specific payloads
    switch (action) {
      case "markRead":
        payload.removeLabelIds = ["UNREAD"];
        break;
      case "markUnread":
        payload.addLabelIds = ["UNREAD"];
        break;
      case "star":
        payload.addLabelIds = ["STARRED"];
        break;
      case "unstar":
        payload.removeLabelIds = ["STARRED"];
        break;
      case "archive":
        payload.removeLabelIds = ["INBOX"];
        break;
      case "delete":
        // Delete uses a different endpoint
        url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}/trash`;
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Make Gmail API call
    let gmailRes;
    
    if (action === "delete") {
      // Use POST to /trash endpoint instead of DELETE
      gmailRes = await fetch(url, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
      });
    } else {
      gmailRes = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    }

    if (!gmailRes.ok) {
      const errText = await gmailRes.text();
      console.error(`Gmail API error for action ${action}:`, errText);
      
      // Handle specific Gmail API errors
      if (gmailRes.status === 401) {
        return NextResponse.json({ error: "Token expired or invalid" }, { status: 401 });
      }
      if (gmailRes.status === 403) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
      }
      if (gmailRes.status === 404) {
        return NextResponse.json({ error: "Email not found" }, { status: 404 });
      }
      
      return NextResponse.json({ 
        error: `Gmail API error: ${errText}`,
        status: gmailRes.status 
      }, { status: gmailRes.status });
    }

    const result = await gmailRes.json();
    console.log(`Successfully executed ${action} on email ${emailId}`);
    
    return NextResponse.json({ 
      success: true, 
      action,
      emailId,
      result 
    });

  } catch (err) {
    console.error("Gmail action error:", err);
    return NextResponse.json({ 
      error: "Server error", 
      details: err instanceof Error ? err.message : "Unknown error"
    }, { status: 500 });
  }
}