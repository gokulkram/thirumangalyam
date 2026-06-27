import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("MONGODB_URI environment variable is not set");

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI!, {
        maxPoolSize: 10,        // max concurrent DB connections
        minPoolSize: 2,         // keep a minimum warm
        serverSelectionTimeoutMS: 5_000,
        socketTimeoutMS: 45_000,
        connectTimeoutMS: 10_000,
        bufferCommands: false,  // fail fast instead of buffering indefinitely
      })
      .then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
