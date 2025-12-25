import mongoose from "mongoose";
import { logger } from "./logger";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "❌ MONGODB_URI is not defined. Please add it to your .env.local file.\n" +
    "Format: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database"
  );
}

// Validate connection string format
if (!MONGODB_URI.startsWith("mongodb://") && !MONGODB_URI.startsWith("mongodb+srv://")) {
  logger.warn(
    "MONGODB_URI should start with 'mongodb://' or 'mongodb+srv://'. " +
    "Current value starts with: " + MONGODB_URI.substring(0, 20) + "..."
  );
}

let cached = (global as any).mongoose || { conn: null, promise: null };

export async function connectToDatabase() {
  // Return cached connection if available
  if (cached.conn) {
    return cached.conn;
  }

  // Return existing promise if connection is in progress
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      // Connection options for better reliability
      serverSelectionTimeoutMS: 10000, // Timeout after 10s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      // For MongoDB Atlas SRV connections
      retryWrites: true,
      w: 'majority',
      // Additional options for DNS resolution
      family: 4, // Force IPv4 (can help with DNS issues)
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        logger.info("MongoDB connected successfully");
        return mongoose;
      })
      .catch((error) => {
        logger.error("MongoDB connection error", { message: error.message });
        
        // Provide helpful error messages
        if (error.message.includes("ENOTFOUND") || error.message.includes("querySrv")) {
          logger.error("DNS Resolution Error Detected. Possible causes: MongoDB Atlas cluster might be paused, connection string format might be incorrect, or network/DNS issues. See MONGODB_TROUBLESHOOTING.md for detailed help");
        }
        
        cached.promise = null; // Reset promise on error so we can retry
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null; // Reset promise on error
    throw error;
  }

  return cached.conn;
}
