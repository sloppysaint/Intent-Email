// app/api/accounts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { AccountModel } from "@/models/Account";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// Get all accounts for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    const accounts = await AccountModel.find({ 
      userId: session.userId 
    }).sort({ updatedAt: -1 });
    
    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

// Add or update an account
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    const body = await req.json();
    
    if (!body.email) {
      return NextResponse.json(
        { error: "Missing email" },
        { status: 400 }
      );
    }

    // Check if this email already exists for another user
    const existingAccount = await AccountModel.findOne({ 
      email: body.email 
    });
    
    let targetUserId = session.userId;
    
    if (existingAccount && existingAccount.userId !== session.userId) {
      // This email belongs to another user - need to merge users
      // For security, we'll reassign all accounts from the current user to the existing user
      await AccountModel.updateMany(
        { userId: session.userId },
        { $set: { userId: existingAccount.userId } }
      );
      targetUserId = existingAccount.userId;
    }

    // Upsert the account
    const account = await AccountModel.findOneAndUpdate(
      { email: body.email },
      {
        $set: {
          ...body,
          userId: targetUserId,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        }
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error("Error saving account:", error);
    return NextResponse.json(
      { error: "Failed to save account" },
      { status: 500 }
    );
  }
}

// Remove an account
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    
    if (!email) {
      return NextResponse.json(
        { error: "Missing email parameter" },
        { status: 400 }
      );
    }

    // Only allow deletion of accounts belonging to the current user
    const result = await AccountModel.findOneAndDelete({ 
      userId: session.userId, 
      email: email 
    });

    if (!result) {
      return NextResponse.json(
        { error: "Account not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}