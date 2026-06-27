/**
 * Seed sample data: interests, shortlists, profile views for all users.
 * Run with: npx tsx scripts/seed-sample-data.ts
 */

import "./load-env";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("MONGODB_URI environment variable is not set");

const INTEREST_NOTES = [
  "Namaskaram! Our family values match well. Would love to connect and discuss further.",
  "Your profile looks very compatible. We are interested in knowing more about your family.",
  "We liked your profile. Our horoscopes seem to match well. Shall we take this forward?",
  "Hi, I found your profile very interesting. Let's connect!",
  "Your education and family background are impressive. We'd like to discuss.",
  "We are looking for a match like yours. Please consider our profile.",
  "Our families share similar values and traditions. Would love to connect.",
  "Impressed by your profile. Looking forward to hearing from you.",
];

function randomNote() {
  return INTEREST_NOTES[Math.floor(Math.random() * INTEREST_NOTES.length)];
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000);
}

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI!);
  console.log("Connected.\n");

  const db = mongoose.connection.db!;
  const usersCol = db.collection("users");
  const profilesCol = db.collection("profiles");
  const interestsCol = db.collection("interests");
  const shortlistsCol = db.collection("shortlists");
  const profileViewsCol = db.collection("profileviews");

  // Get all active users with their profiles
  const users = await usersCol.find({ status: "active" }).toArray();
  const profiles = await profilesCol.find({}).toArray();

  console.log(`Found ${users.length} users, ${profiles.length} profiles.\n`);

  // Build lookup maps
  const profileByUserId = new Map<string, any>();
  for (const p of profiles) {
    profileByUserId.set(p.userId.toString(), p);
  }

  const males = users.filter((u) => u.gender === "male");
  const females = users.filter((u) => u.gender === "female");

  console.log(`Males: ${males.length}, Females: ${females.length}\n`);

  // Clear existing sample data
  console.log("Clearing existing interests, shortlists, profile views...");
  await interestsCol.deleteMany({});
  await shortlistsCol.deleteMany({});
  await profileViewsCol.deleteMany({});
  console.log("Cleared.\n");

  const interestsToInsert: any[] = [];
  const shortlistsToInsert: any[] = [];
  const viewsToInsert: any[] = [];

  // For each user, create interactions with opposite gender
  for (const user of users) {
    const userId = user._id;
    const opposites = user.gender === "male" ? females : males;

    if (opposites.length === 0) continue;

    // Shuffle opposites for variety
    const shuffled = [...opposites].sort(() => Math.random() - 0.5);

    // --- RECEIVED INTERESTS (2-4 per user) ---
    const receivedCount = Math.min(2 + Math.floor(Math.random() * 3), shuffled.length);
    for (let i = 0; i < receivedCount; i++) {
      const sender = shuffled[i];
      // Mix of statuses: mostly pending, some accepted, some declined
      let status = "pending";
      if (i === 0 && Math.random() > 0.3) status = "accepted";
      if (i === receivedCount - 1 && Math.random() > 0.5) status = "declined";

      interestsToInsert.push({
        fromUserId: sender._id,
        toUserId: userId,
        status,
        note: randomNote(),
        respondedAt: status !== "pending" ? daysAgo(Math.floor(Math.random() * 3)) : null,
        createdAt: daysAgo(1 + Math.floor(Math.random() * 10)),
        updatedAt: new Date(),
      });
    }

    // --- SENT INTERESTS (2-4 per user) ---
    const sentStart = receivedCount;
    const sentCount = Math.min(2 + Math.floor(Math.random() * 3), shuffled.length - sentStart);
    for (let i = 0; i < sentCount; i++) {
      const target = shuffled[sentStart + i];
      if (!target) break;

      let status = "pending";
      if (i === 0 && Math.random() > 0.4) status = "accepted";

      interestsToInsert.push({
        fromUserId: userId,
        toUserId: target._id,
        status,
        note: randomNote(),
        respondedAt: status !== "pending" ? daysAgo(Math.floor(Math.random() * 3)) : null,
        createdAt: daysAgo(1 + Math.floor(Math.random() * 8)),
        updatedAt: new Date(),
      });
    }

    // --- SHORTLISTS (3-5 per user) ---
    const shortlistCount = Math.min(3 + Math.floor(Math.random() * 3), shuffled.length);
    for (let i = 0; i < shortlistCount; i++) {
      shortlistsToInsert.push({
        userId,
        shortlistedUserId: shuffled[i]._id,
        createdAt: daysAgo(Math.floor(Math.random() * 14)),
        updatedAt: new Date(),
      });
    }

    // --- PROFILE VIEWS (5-10 per user, from various opposite gender users) ---
    const viewCount = Math.min(5 + Math.floor(Math.random() * 6), shuffled.length);
    for (let i = 0; i < viewCount; i++) {
      viewsToInsert.push({
        viewerId: shuffled[i]._id,
        viewedUserId: userId,
        createdAt: daysAgo(Math.floor(Math.random() * 14)),
        updatedAt: new Date(),
      });
    }
  }

  // Deduplicate interests (same fromUserId + toUserId)
  const interestKeys = new Set<string>();
  const uniqueInterests = interestsToInsert.filter((i) => {
    const key = `${i.fromUserId}-${i.toUserId}`;
    if (interestKeys.has(key)) return false;
    interestKeys.add(key);
    return true;
  });

  // Deduplicate shortlists
  const shortlistKeys = new Set<string>();
  const uniqueShortlists = shortlistsToInsert.filter((s) => {
    const key = `${s.userId}-${s.shortlistedUserId}`;
    if (shortlistKeys.has(key)) return false;
    shortlistKeys.add(key);
    return true;
  });

  // Insert all
  console.log(`Inserting ${uniqueInterests.length} interests...`);
  if (uniqueInterests.length > 0) await interestsCol.insertMany(uniqueInterests);

  console.log(`Inserting ${uniqueShortlists.length} shortlists...`);
  if (uniqueShortlists.length > 0) await shortlistsCol.insertMany(uniqueShortlists);

  console.log(`Inserting ${viewsToInsert.length} profile views...`);
  if (viewsToInsert.length > 0) await profileViewsCol.insertMany(viewsToInsert);

  // Also update profile data to make profiles richer
  console.log("\nUpdating profiles with sample data...");
  const STARS = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha"];
  const RASHIS = ["Mesha (Aries)", "Vrishabha (Taurus)", "Mithuna (Gemini)", "Karka (Cancer)", "Simha (Leo)", "Kanya (Virgo)"];
  const OCCUPATIONS = ["Software Professional", "Doctor", "Engineer", "Business/Entrepreneur", "Government Employee", "Teacher/Professor", "Chartered Accountant", "Banking Professional"];
  const DEGREES = ["B.E./B.Tech", "MBA/PGDM", "M.E./M.Tech", "MBBS", "B.Sc.", "M.Sc.", "BCA", "MCA"];
  const CITIES = ["Chennai", "Bangalore", "Coimbatore", "Madurai", "Hyderabad", "Mumbai", "Pune", "Kochi"];
  const STATES = ["Tamil Nadu", "Karnataka", "Kerala", "Andhra Pradesh", "Telangana", "Maharashtra"];
  const COMMUNITIES = ["Brahmin - Iyer", "Brahmin - Iyengar", "Mudaliar", "Nadar", "Gounder", "Chettiar", "Pillai", "Vanniyar", "Thevar", "Naidu"];
  const INCOMES = ["4-6 Lakhs", "6-8 Lakhs", "8-10 Lakhs", "10-15 Lakhs", "15-20 Lakhs", "20-30 Lakhs"];
  const HEIGHTS_M = ["5'6\"", "5'7\"", "5'8\"", "5'9\"", "5'10\"", "5'11\"", "6'0\""];
  const HEIGHTS_F = ["5'0\"", "5'1\"", "5'2\"", "5'3\"", "5'4\"", "5'5\"", "5'6\""];
  const HOBBIES = ["Music", "Dance", "Reading", "Travel", "Cooking", "Sports", "Yoga", "Photography"];

  function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
  function pickN<T>(arr: T[], n: number): T[] {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  }

  let profilesUpdated = 0;
  for (const user of users) {
    const profile = profileByUserId.get(user._id.toString());
    if (!profile) continue;

    const isMale = user.gender === "male";
    const age = 22 + Math.floor(Math.random() * 12); // 22-33

    const updateData: any = {};

    // Only fill in fields that are empty
    if (!profile.age) updateData.age = age;
    if (!profile.dateOfBirth) {
      const year = new Date().getFullYear() - age;
      updateData.dateOfBirth = `${year}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, "0")}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, "0")}`;
    }
    if (!profile.height) updateData.height = pick(isMale ? HEIGHTS_M : HEIGHTS_F);
    if (!profile.motherTongue) updateData.motherTongue = "Tamil";
    if (!profile.community) updateData.community = pick(COMMUNITIES);
    if (!profile.maritalStatus) updateData.maritalStatus = "never_married";
    if (!profile.religion) updateData.religion = "Hindu";
    if (!profile.star) updateData.star = pick(STARS);
    if (!profile.rashi) updateData.rashi = pick(RASHIS);
    if (profile.hasDosham === undefined || profile.hasDosham === null) updateData.hasDosham = Math.random() > 0.7;
    if (!profile.familyType) updateData.familyType = Math.random() > 0.5 ? "nuclear" : "joint";
    if (!profile.familyStatus) updateData.familyStatus = pick(["Middle Class", "Upper Middle Class", "Rich"]);
    if (!profile.fatherOccupation) updateData.fatherOccupation = pick(["Retired Government Officer", "Business", "Farmer", "Teacher", "Engineer"]);
    if (!profile.motherOccupation) updateData.motherOccupation = pick(["Homemaker", "Teacher", "Doctor", "Business"]);
    if (!profile.highestDegree) updateData.highestDegree = pick(DEGREES);
    if (!profile.occupation) updateData.occupation = pick(OCCUPATIONS);
    if (!profile.annualIncome) updateData.annualIncome = pick(INCOMES);
    if (!profile.city) updateData.city = pick(CITIES);
    if (!profile.state) updateData.state = pick(STATES);
    if (!profile.country) updateData.country = "India";
    if (!profile.diet) updateData.diet = Math.random() > 0.3 ? "vegetarian" : "non_vegetarian";
    if (!profile.smoking) updateData.smoking = "no";
    if (!profile.drinking) updateData.drinking = Math.random() > 0.7 ? "occasionally" : "no";
    if (!profile.hobbies || profile.hobbies.length === 0) updateData.hobbies = pickN(HOBBIES, 3 + Math.floor(Math.random() * 3));
    if (!profile.aboutMe) updateData.aboutMe = `I am a ${isMale ? "kind and family-oriented person" : "cheerful and grounded person"} who values traditions while embracing modern perspectives. Looking for a compatible life partner.`;
    if (!profile.lookingFor) updateData.lookingFor = `Looking for someone who shares similar values, is well-educated, and has a positive outlook on life.`;
    if (!profile.isOnline) updateData.isOnline = Math.random() > 0.5;
    if (!profile.lastActive) updateData.lastActive = daysAgo(Math.floor(Math.random() * 7));

    if (Object.keys(updateData).length > 0) {
      await profilesCol.updateOne({ _id: profile._id }, { $set: updateData });
      profilesUpdated++;
    }
  }

  // Update profile completion for all users
  console.log("Updating profile completion percentages...");
  for (const user of users) {
    const profile = await profilesCol.findOne({ userId: user._id });
    if (!profile) continue;

    const requiredFields = ["fullName", "dateOfBirth", "height", "motherTongue", "community", "maritalStatus", "highestDegree", "occupation", "city", "aboutMe"];
    const filled = requiredFields.filter((f) => profile[f] && String(profile[f]).trim() !== "").length;
    const hasPhoto = profile.photos && profile.photos.length > 0;
    const completeness = Math.round(((filled + (hasPhoto ? 1 : 0)) / (requiredFields.length + 1)) * 100);

    await usersCol.updateOne({ _id: user._id }, { $set: { profileComplete: completeness } });
  }

  console.log(`\n✓ ${profilesUpdated} profiles enriched with sample data`);
  console.log(`✓ ${uniqueInterests.length} interests created`);
  console.log(`✓ ${uniqueShortlists.length} shortlists created`);
  console.log(`✓ ${viewsToInsert.length} profile views created`);
  console.log("\nDone!");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
