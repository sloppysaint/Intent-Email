import mongoose from "mongoose";
const MONGODB = process.env.MONGODB_URI!;

if (!MONGODB) throw new Error("Please define the MONGO_URI environment variable");

let cached = (global as any).mongoose || { conn: null, promise: null };
export async function connectToDatabase() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB, { bufferCommands: false });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
