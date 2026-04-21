/**
 * Seed 2 male + 2 female users for EVERY community to test match sorting.
 * Run with: npx tsx scripts/seed-community-matches.ts
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://thirumangalyam:QA6FQv80xRG0Zh83@cluster0.t1qnu90.mongodb.net/thirumangalyam?appName=Cluster0";

const COMMUNITIES = [
  "Brahmin - Iyer",
  "Brahmin - Iyengar",
  "Mudaliar",
  "Nadar",
  "Gounder",
  "Chettiar",
  "Pillai",
  "Vanniyar",
  "Thevar",
  "Naidu",
  "Nair",
  "Ezhava",
  "Menon",
  "Reddy",
  "Kamma",
  "Kapu",
  "Lingayat",
  "Vokkaliga",
  "Bunts",
  "Goud Saraswat",
];

const MALE_NAMES = [
  "Arun Kumar", "Bala Murugan", "Chandran S", "Dinesh Raj",
  "Ganesh R", "Hari Prasad", "Karthik M", "Manoj Kumar",
  "Naveen S", "Prabhu V", "Rajesh K", "Senthil M",
  "Surya N", "Tamilselvan", "Vijay Kumar", "Ashwin R",
  "Deepak S", "Gowtham K", "Jagan M", "Lokesh P",
  "Mohan R", "Nandha K", "Prasanth V", "Ramesh B",
  "Santhosh M", "Varun D", "Yuvan S", "Ajith K",
  "Bharath N", "Dhanush V", "Gokul R", "Harish M",
  "Kiran S", "Mani K", "Nithish P", "Pradeep R",
  "Ravi Kumar", "Suresh M", "Vignesh K", "Arjun S",
];

const FEMALE_NAMES = [
  "Anitha S", "Bhuvana R", "Chitra M", "Divya K",
  "Gayathri P", "Harini V", "Janani S", "Kavitha R",
  "Lakshmi M", "Meena K", "Nandhini S", "Priya R",
  "Revathi M", "Sangeetha V", "Thenmozhi K", "Uma S",
  "Vanitha R", "Yamini K", "Aishwarya M", "Deepika S",
  "Geetha R", "Indira M", "Jothi K", "Keerthi S",
  "Mala R", "Nithya M", "Padma K", "Ramya S",
  "Saranya R", "Thulasi M", "Vani K", "Abinaya S",
  "Banu R", "Devi M", "Fathima K", "Gomathi S",
  "Hemalatha R", "Ishwarya M", "Jayalakshmi K", "Kalpana S",
];

const STARS = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni"];
const RASHIS = ["Mesha (Aries)", "Vrishabha (Taurus)", "Mithuna (Gemini)", "Karka (Cancer)", "Simha (Leo)", "Kanya (Virgo)"];
const DEGREES = ["B.E./B.Tech", "MBA/PGDM", "M.E./M.Tech", "MBBS", "B.Sc.", "M.Sc.", "BCA", "MCA"];
const OCCUPATIONS = ["Software Professional", "Doctor", "Engineer", "Business/Entrepreneur", "Government Employee", "Teacher/Professor", "Chartered Accountant", "Banking Professional"];
const CITIES = ["Chennai", "Bangalore", "Coimbatore", "Madurai", "Hyderabad", "Mumbai", "Pune", "Kochi"];
const STATES = ["Tamil Nadu", "Karnataka", "Kerala", "Andhra Pradesh", "Telangana", "Maharashtra"];
const INCOMES = ["4-6 Lakhs", "6-8 Lakhs", "8-10 Lakhs", "10-15 Lakhs", "15-20 Lakhs", "20-30 Lakhs"];
const HEIGHTS_M = ["5'6\"", "5'7\"", "5'8\"", "5'9\"", "5'10\"", "5'11\"", "6'0\""];
const HEIGHTS_F = ["5'0\"", "5'1\"", "5'2\"", "5'3\"", "5'4\"", "5'5\"", "5'6\""];
const HOBBIES = ["Music", "Dance", "Reading", "Travel", "Cooking", "Sports", "Yoga", "Photography"];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function daysAgo(n: number) { return new Date(Date.now() - n * 86400000); }

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.\n");

  const db = mongoose.connection.db!;
  const usersCol = db.collection("users");
  const profilesCol = db.collection("profiles");
  const prefsCol = db.collection("partnerpreferences");

  const hashedPassword = await bcrypt.hash("Test@123", 12);

  let totalUsers = 0;
  let maleIdx = 0;
  let femaleIdx = 0;

  for (const community of COMMUNITIES) {
    console.log(`Seeding community: ${community}`);

    // 2 males + 2 females per community
    for (let g = 0; g < 2; g++) {
      for (const gender of ["male", "female"] as const) {
        const isMale = gender === "male";
        const nameList = isMale ? MALE_NAMES : FEMALE_NAMES;
        const idx = isMale ? maleIdx++ : femaleIdx++;
        const name = nameList[idx % nameList.length];
        const age = 22 + Math.floor(Math.random() * 10);
        const year = new Date().getFullYear() - age;
        const phone = `+919${String(800000000 + totalUsers).slice(0, 9)}`;
        const email = `${name.toLowerCase().replace(/\s+/g, ".")}.${community.toLowerCase().replace(/[^a-z]/g, "").slice(0, 6)}${g}@test.com`;

        // Create user
        const userResult = await usersCol.insertOne({
          phone,
          email,
          password: hashedPassword,
          role: "individual",
          gender,
          isPremium: Math.random() > 0.7,
          plan: Math.random() > 0.7 ? pick(["premium_3", "premium_6", "premium_12"]) : "free",
          status: "active",
          profileComplete: 90,
          createdAt: daysAgo(Math.floor(Math.random() * 60)),
          updatedAt: new Date(),
        });

        const userId = userResult.insertedId;

        // Create profile
        await profilesCol.insertOne({
          userId,
          fullName: name,
          dateOfBirth: `${year}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, "0")}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, "0")}`,
          age,
          height: pick(isMale ? HEIGHTS_M : HEIGHTS_F),
          motherTongue: "Tamil",
          community,
          subCaste: "",
          maritalStatus: "never_married",
          hasChildren: false,
          religion: "Hindu",
          gothra: "",
          star: pick(STARS),
          rashi: pick(RASHIS),
          hasDosham: Math.random() > 0.7,
          familyType: Math.random() > 0.5 ? "nuclear" : "joint",
          familyStatus: pick(["Middle Class", "Upper Middle Class", "Rich"]),
          fatherOccupation: pick(["Retired", "Business", "Farmer", "Teacher"]),
          motherOccupation: pick(["Homemaker", "Teacher"]),
          highestDegree: pick(DEGREES),
          institution: "Anna University",
          occupation: pick(OCCUPATIONS),
          employer: pick(["TCS", "Infosys", "Wipro", "HCL", "Self-employed", "Govt"]),
          annualIncome: pick(INCOMES),
          workLocation: pick(CITIES),
          city: pick(CITIES),
          state: pick(STATES),
          country: "India",
          whatsappNumber: phone,
          diet: Math.random() > 0.3 ? "vegetarian" : "non_vegetarian",
          smoking: "no",
          drinking: Math.random() > 0.7 ? "occasionally" : "no",
          hobbies: pickN(HOBBIES, 3),
          aboutMe: `I am a ${isMale ? "well-settled" : "well-educated"} person from the ${community} community. Looking for a compatible life partner.`,
          lookingFor: `Looking for a ${isMale ? "caring and family-oriented" : "well-settled and kind"} partner from a good family.`,
          photos: [],
          verificationStatus: Math.random() > 0.5 ? "verified" : "unverified",
          isOnline: Math.random() > 0.5,
          lastActive: daysAgo(Math.floor(Math.random() * 5)),
          profileViews: Math.floor(Math.random() * 50),
          createdAt: daysAgo(Math.floor(Math.random() * 60)),
          updatedAt: new Date(),
        });

        // Create partner preferences (prefer same community)
        await prefsCol.insertOne({
          userId,
          ageRange: isMale ? [20, 28] : [24, 34],
          heightRange: isMale ? ["5'0\"", "5'6\""] : ["5'6\"", "6'0\""],
          maritalStatus: ["never_married"],
          childrenAcceptable: "doesnt_matter",
          motherTongues: ["Tamil"],
          communities: [community], // Prefer same community
          gothra: "",
          education: [],
          occupation: [],
          employmentType: "any",
          annualIncomeMin: "",
          locations: [],
          citizenship: "any",
          starCompatibility: "preferred",
          dosham: "doesnt_matter",
          diet: "doesnt_matter",
          smokingAcceptable: "no",
          drinkingAcceptable: "doesnt_matter",
          familyType: "any",
          familyStatus: [],
          complexion: "any",
          physicalDisability: "doesnt_matter",
        });

        totalUsers++;
      }
    }
  }

  console.log(`\n✓ Created ${totalUsers} users across ${COMMUNITIES.length} communities`);
  console.log(`  (${COMMUNITIES.length * 2} males + ${COMMUNITIES.length * 2} females)`);
  console.log(`  Each community has 2 male + 2 female profiles`);
  console.log(`\n  Password for all: Test@123`);
  console.log(`  Login with email or phone\n`);

  // Print a few sample logins
  const sampleUsers = await usersCol.find({ email: /test\.com$/ }).limit(6).toArray();
  console.log("Sample logins:");
  for (const u of sampleUsers) {
    const profile = await profilesCol.findOne({ userId: u._id });
    console.log(`  ${profile?.fullName} (${profile?.community}) — ${u.email} / ${u.phone}`);
  }

  console.log("\nDone!");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
