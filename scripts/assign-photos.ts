/**
 * Script to assign dummy profile photos to all users who don't have photos.
 * Run with: npx tsx scripts/assign-photos.ts
 */

import "./load-env";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("MONGODB_URI environment variable is not set");

const FEMALE_PHOTOS = [
  "/profiles/bride.jpg",
  "/profiles/bride1.jpg",
  "/profiles/bride2.jpg",
  "/profiles/bride3.jpg",
  "/profiles/bride4.jpg",
  "/profiles/bride5.jpg",
  "/profiles/bride6.jpg",
  "/profiles/bride7.jpg",
  "/profiles/bride8.jpg",
  "/profiles/bride9.jpg",
  "/profiles/bride10.jpg",
  "/profiles/bride11.jpg",
  "/profiles/bride12.jpg",
  "/profiles/bride13.jpg",
  "/profiles/bride14.jpg",
];

const MALE_PHOTOS = [
  "/profiles/groom.jpg",
  "/profiles/groom2.jpg",
  "/profiles/groom3.jpg",
  "/profiles/groom4.jpg",
];

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI!);
  console.log("Connected.");

  const db = mongoose.connection.db!;
  const usersCol = db.collection("users");
  const profilesCol = db.collection("profiles");

  // Get all users
  const users = await usersCol.find({}).toArray();
  console.log(`Found ${users.length} users.`);

  let maleIndex = 0;
  let femaleIndex = 0;
  let updated = 0;

  for (const user of users) {
    const userId = user._id;
    const gender = user.gender || "male";

    // Check if profile already has photos
    const profile = await profilesCol.findOne({ userId });
    if (!profile) {
      console.log(`  No profile for user ${userId}, skipping.`);
      continue;
    }

    const hasPhotos = profile.photos && profile.photos.length > 0 && profile.photos.some((p: any) => p.url);
    if (hasPhotos) {
      console.log(`  User ${profile.fullName || userId} already has photos, skipping.`);
      continue;
    }

    // Assign photo based on gender
    let photoUrl: string;
    if (gender === "female") {
      photoUrl = FEMALE_PHOTOS[femaleIndex % FEMALE_PHOTOS.length];
      femaleIndex++;
    } else {
      photoUrl = MALE_PHOTOS[maleIndex % MALE_PHOTOS.length];
      maleIndex++;
    }

    await profilesCol.updateOne(
      { _id: profile._id },
      {
        $set: {
          photos: [
            { url: photoUrl, isPrimary: true, order: 0 },
          ],
        },
      }
    );

    updated++;
    console.log(`  ✓ ${profile.fullName || "Unknown"} (${gender}) → ${photoUrl}`);
  }

  console.log(`\nDone! Updated ${updated} profiles with photos.`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
