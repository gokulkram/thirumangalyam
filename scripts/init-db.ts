import "./load-env";
import mongoose, { Schema } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("MONGODB_URI environment variable is not set");

async function initDatabase() {
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGODB_URI!);
  console.log("Connected successfully!\n");

  const db = mongoose.connection.db!;

  // DROP the old database completely
  console.log("Dropping old database...");
  await db.dropDatabase();
  console.log("[DROPPED] thirumangalyam database deleted!\n");

  // All 13 collections to create fresh
  const collections = [
    "users",
    "profiles",
    "partnerpreferences",
    "interests",
    "conversations",
    "messages",
    "shortlists",
    "profileviews",
    "verificationrequests",
    "reports",
    "subscriptions",
    "admins",
    "activitylogs",
  ];

  console.log("Creating fresh collections...");
  for (const name of collections) {
    await db.createCollection(name);
    console.log(`  [CREATED] "${name}"`);
  }

  // Create indexes
  console.log("\nCreating indexes...");

  // Users
  await db.collection("users").createIndex({ phone: 1 }, { unique: true, sparse: true });
  await db.collection("users").createIndex({ email: 1 }, { sparse: true });
  console.log("  [INDEX] users: phone (unique), email");

  // Profiles
  await db.collection("profiles").createIndex({ userId: 1 }, { unique: true });
  await db.collection("profiles").createIndex({ community: 1 });
  await db.collection("profiles").createIndex({ star: 1 });
  await db.collection("profiles").createIndex({ city: 1 });
  await db.collection("profiles").createIndex({ "photos.isPrimary": 1 });
  console.log("  [INDEX] profiles: userId (unique), community, star, city");

  // Partner Preferences
  await db.collection("partnerpreferences").createIndex({ userId: 1 }, { unique: true });
  console.log("  [INDEX] partnerpreferences: userId (unique)");

  // Interests
  await db.collection("interests").createIndex({ fromUserId: 1, toUserId: 1 }, { unique: true });
  await db.collection("interests").createIndex({ toUserId: 1, status: 1 });
  await db.collection("interests").createIndex({ fromUserId: 1, status: 1 });
  console.log("  [INDEX] interests: fromUserId+toUserId (unique), status combos");

  // Conversations
  await db.collection("conversations").createIndex({ participants: 1 });
  await db.collection("conversations").createIndex({ lastMessageAt: -1 });
  console.log("  [INDEX] conversations: participants, lastMessageAt");

  // Messages
  await db.collection("messages").createIndex({ conversationId: 1, createdAt: 1 });
  await db.collection("messages").createIndex({ senderId: 1 });
  console.log("  [INDEX] messages: conversationId+createdAt, senderId");

  // Shortlists
  await db.collection("shortlists").createIndex({ userId: 1, shortlistedUserId: 1 }, { unique: true });
  console.log("  [INDEX] shortlists: userId+shortlistedUserId (unique)");

  // Profile Views
  await db.collection("profileviews").createIndex({ viewedUserId: 1, createdAt: -1 });
  await db.collection("profileviews").createIndex({ viewerId: 1, viewedUserId: 1 });
  console.log("  [INDEX] profileviews: viewedUserId+createdAt, viewerId+viewedUserId");

  // Verification Requests
  await db.collection("verificationrequests").createIndex({ userId: 1 });
  await db.collection("verificationrequests").createIndex({ status: 1 });
  console.log("  [INDEX] verificationrequests: userId, status");

  // Reports
  await db.collection("reports").createIndex({ reportedUserId: 1 });
  await db.collection("reports").createIndex({ status: 1 });
  console.log("  [INDEX] reports: reportedUserId, status");

  // Subscriptions
  await db.collection("subscriptions").createIndex({ userId: 1 });
  await db.collection("subscriptions").createIndex({ status: 1 });
  await db.collection("subscriptions").createIndex({ razorpayOrderId: 1 }, { sparse: true });
  console.log("  [INDEX] subscriptions: userId, status, razorpayOrderId");

  // Admins
  await db.collection("admins").createIndex({ email: 1 }, { unique: true });
  console.log("  [INDEX] admins: email (unique)");

  // Activity Logs
  await db.collection("activitylogs").createIndex({ createdAt: -1 });
  await db.collection("activitylogs").createIndex({ userId: 1 });
  console.log("  [INDEX] activitylogs: createdAt, userId");

  // Seed a default admin
  const adminExists = await db.collection("admins").findOne({ email: "admin@thirumangalyam.com" });
  if (!adminExists) {
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash("Admin@123", 10);
    await db.collection("admins").insertOne({
      name: "Super Admin",
      email: "admin@thirumangalyam.com",
      password: hashedPassword,
      role: "super_admin",
      avatarUrl: "",
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("\n[SEED] Default admin created: admin@thirumangalyam.com / Admin@123");
  } else {
    console.log("\n[SEED] Admin already exists, skipping");
  }

  // Final summary
  const finalCollections = (await db.listCollections().toArray()).map((c) => c.name);
  console.log(`\nDone! ${finalCollections.length} collections in "thirumangalyam" database:`);
  finalCollections.sort().forEach((c) => console.log(`  - ${c}`));

  await mongoose.disconnect();
  console.log("\nDisconnected. Database is ready!");
}

initDatabase().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
