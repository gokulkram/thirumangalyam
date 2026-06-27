import "./load-env";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("MONGODB_URI environment variable is not set");

// ─── Helpers ──────────────────────────────────────────────
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pickN = <T>(arr: T[], n: number): T[] => arr.sort(() => 0.5 - Math.random()).slice(0, n);
const randBetween = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const oid = () => new mongoose.Types.ObjectId();
const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000);

// ─── Reference Data ───────────────────────────────────────
const maleNames = [
  "Arun Kumar", "Karthik Rajan", "Vijay Shankar", "Prashanth Nair", "Suresh Babu",
  "Rajesh Kannan", "Ganesh Venkatesh", "Mohan Raj", "Dinesh Kumar", "Sathish Pandian",
  "Harish Subramanian", "Naveen Balaji", "Pradeep Sundaram", "Anand Krishnan", "Vignesh Murali",
  "Ramesh Iyer", "Manoj Pillai", "Ashwin Naidu", "Deepak Gounder", "Senthil Murugan",
  "Bharath Kumar", "Lokesh Reddy", "Srinivas Rao", "Kiran Hegde", "Arvind Menon",
];

const femaleNames = [
  "Priya Lakshmi", "Divya Bharathi", "Meenakshi Sundaram", "Kavitha Rajan", "Sangeetha Nair",
  "Lakshmi Priya", "Anitha Devi", "Revathi Kumar", "Swathi Pillai", "Nithya Srinivasan",
  "Deepika Murugan", "Janani Krishnan", "Pooja Venkatesh", "Gayathri Iyer", "Sowmya Balaji",
  "Archana Gounder", "Pavithra Naidu", "Keerthana Reddy", "Bhavani Subramanian", "Saranya Pandian",
  "Madhumitha Raj", "Thulasi Devi", "Hema Malini", "Shalini Menon", "Ranjitha Kaur",
];

const communities = [
  "Brahmin - Iyer", "Brahmin - Iyengar", "Mudaliar", "Nadar", "Gounder",
  "Chettiar", "Pillai", "Vanniyar", "Thevar", "Naidu",
  "Nair", "Ezhava", "Menon", "Reddy", "Kamma",
  "Kapu", "Lingayat", "Vokkaliga", "Bunts", "Goud Saraswat",
];

const stars = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
  "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha",
  "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha",
  "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
];

const rashis = [
  "Mesha (Aries)", "Vrishabha (Taurus)", "Mithuna (Gemini)", "Karka (Cancer)",
  "Simha (Leo)", "Kanya (Virgo)", "Tula (Libra)", "Vrischika (Scorpio)",
  "Dhanu (Sagittarius)", "Makara (Capricorn)", "Kumbha (Aquarius)", "Meena (Pisces)",
];

const gothras = ["Bharadwaj", "Kashyapa", "Vasishtha", "Vishwamitra", "Atri", "Agastya", "Jamadagni", "Gautama"];

const degrees = ["B.E./B.Tech", "M.E./M.Tech", "MBA/PGDM", "M.Sc.", "MBBS", "B.Sc.", "BCA", "MCA", "Ph.D.", "B.Com", "M.Com", "LLB"];
const occupations = [
  "Software Professional", "Doctor", "Engineer", "Business/Entrepreneur",
  "Government Employee", "Teacher/Professor", "Chartered Accountant", "Banking Professional",
  "Lawyer/Legal", "Scientist/Researcher", "Architect", "Defence/Armed Forces",
];
const employers = [
  "TCS", "Infosys", "Wipro", "HCL Technologies", "Cognizant", "Accenture",
  "Google", "Microsoft", "Amazon", "Zoho", "Freshworks", "Apollo Hospitals",
  "State Government", "Central Government", "Self Employed", "HDFC Bank",
  "ICICI Bank", "Reliance Industries", "L&T", "Capgemini",
];
const incomes = ["4-6 Lakhs", "6-8 Lakhs", "8-10 Lakhs", "10-15 Lakhs", "15-20 Lakhs", "20-30 Lakhs", "30-50 Lakhs", "50 Lakhs - 1 Crore"];
const cities = ["Chennai", "Coimbatore", "Madurai", "Bangalore", "Hyderabad", "Kochi", "Trichy", "Salem", "Tirunelveli", "Mysore", "Mangalore", "Vijayawada", "Thiruvananthapuram", "Tiruppur", "Vellore"];
const states = ["Tamil Nadu", "Karnataka", "Kerala", "Andhra Pradesh", "Telangana"];
const hobbies = ["Music", "Dance", "Reading", "Travel", "Cooking", "Sports", "Yoga", "Photography", "Painting", "Movies", "Gaming", "Gardening"];
const heights = ["5'0\"", "5'1\"", "5'2\"", "5'3\"", "5'4\"", "5'5\"", "5'6\"", "5'7\"", "5'8\"", "5'9\"", "5'10\"", "5'11\"", "6'0\"", "6'1\"", "6'2\""];

const aboutMeTemplates = [
  "I am a {occupation} working at {employer} in {city}. I come from a {familyType} family with strong values. Looking for a life partner who shares similar interests and family values.",
  "Professionally working as a {occupation} at {employer}. I enjoy {hobby1} and {hobby2} in my free time. My family is very supportive and we believe in traditional values with a modern outlook.",
  "I completed my {degree} and currently work as a {occupation}. I am family-oriented, believe in simple living and strong relationships. Hobbies include {hobby1}, {hobby2}, and {hobby3}.",
  "Passionate {occupation} based in {city}. I value education, career growth, and family bonds equally. I enjoy {hobby1} and {hobby2}. Looking for someone who is caring and understanding.",
  "A dedicated {occupation} with a love for {hobby1} and {hobby2}. I believe in mutual respect and trust in relationships. My family has been my biggest strength and I cherish those values.",
];

const lookingForTemplates = [
  "Looking for an educated, family-oriented partner with good values. Preference for someone from a similar cultural background who respects traditions while being open-minded.",
  "Seeking a caring and understanding life partner who values family, education, and career. Someone who is honest, supportive, and has a positive outlook on life.",
  "I am looking for a well-educated, professionally settled partner. Someone who is respectful towards elders, loves family, and has a good sense of humor.",
  "Prefer a partner who is kind, ambitious, and grounded. Family values are important. Looking for someone who can be both a best friend and a life partner.",
  "Seeking a compatible life partner who believes in equality, mutual respect, and togetherness. Education and family background are important considerations.",
];

// ─── Generate Data ────────────────────────────────────────
async function seed() {
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGODB_URI!);
  console.log("Connected!\n");

  const db = mongoose.connection.db!;
  const hashedPw = await bcrypt.hash("Test@1234", 10);

  // ─── 1. ADMINS ────────────────────────────────────────
  console.log("Seeding Admins...");
  const admins = [
    { _id: oid(), name: "Super Admin", email: "admin@thirumangalyam.com", password: await bcrypt.hash("Admin@123", 10), role: "super_admin", avatarUrl: "", lastLogin: hoursAgo(2), createdAt: daysAgo(180), updatedAt: now },
    { _id: oid(), name: "Priya Moderator", email: "priya.mod@thirumangalyam.com", password: await bcrypt.hash("Mod@1234", 10), role: "moderator", avatarUrl: "", lastLogin: hoursAgo(5), createdAt: daysAgo(120), updatedAt: now },
    { _id: oid(), name: "Ravi Support", email: "ravi.support@thirumangalyam.com", password: await bcrypt.hash("Support@1234", 10), role: "support", avatarUrl: "", lastLogin: daysAgo(1), createdAt: daysAgo(90), updatedAt: now },
  ];
  await db.collection("admins").deleteMany({});
  await db.collection("admins").insertMany(admins);
  console.log(`  ✓ ${admins.length} admins`);

  // ─── 2. USERS (50 total: 25 male + 25 female) ────────
  console.log("Seeding Users...");
  const users: any[] = [];
  const profiles: any[] = [];
  const partnerPrefs: any[] = [];

  // Male users
  for (let i = 0; i < 25; i++) {
    const userId = oid();
    const age = randBetween(24, 35);
    const community = pick(communities);
    const city = pick(cities);
    const state = pick(states);
    const degree = pick(degrees);
    const occupation = pick(occupations);
    const employer = pick(employers);
    const star = pick(stars);
    const rashi = pick(rashis);
    const gothra = pick(gothras);
    const userHobbies = pickN([...hobbies], 3);
    const isPremium = i < 8; // first 8 males are premium
    const profileComplete = isPremium ? 100 : randBetween(60, 95);

    const aboutMe = pick(aboutMeTemplates)
      .replace("{occupation}", occupation).replace("{employer}", employer)
      .replace("{city}", city).replace("{familyType}", pick(["joint", "nuclear"]))
      .replace("{degree}", degree)
      .replace("{hobby1}", userHobbies[0]).replace("{hobby2}", userHobbies[1]).replace("{hobby3}", userHobbies[2] || "Travel");

    users.push({
      _id: userId,
      phone: `98${String(70000000 + i).padStart(8, "0")}`,
      email: maleNames[i].toLowerCase().replace(/ /g, ".") + "@gmail.com",
      password: hashedPw,
      role: i < 22 ? "individual" : "parent",
      gender: "male",
      isPremium,
      plan: isPremium ? pick(["premium_3", "premium_6", "premium_12"]) : "free",
      status: i < 24 ? "active" : "suspended",
      profileComplete,
      createdAt: daysAgo(randBetween(5, 150)),
      updatedAt: hoursAgo(randBetween(1, 72)),
    });

    profiles.push({
      _id: oid(),
      userId,
      fullName: maleNames[i],
      dateOfBirth: `${1991 + (25 - age)}-${String(randBetween(1, 12)).padStart(2, "0")}-${String(randBetween(1, 28)).padStart(2, "0")}`,
      age,
      height: pick(heights.slice(5, 14)), // taller for males
      motherTongue: pick(["Tamil", "Telugu", "Kannada", "Malayalam"]),
      community,
      subCaste: "",
      maritalStatus: i < 22 ? "never_married" : pick(["divorced", "widowed"]),
      hasChildren: i >= 22,
      numberOfChildren: i >= 22 ? 1 : 0,
      religion: "Hindu",
      gothra,
      star,
      rashi,
      hasDosham: pick([null, "Chevvai Dosham", "No Dosham"]),
      familyType: pick(["joint", "nuclear"]),
      familyStatus: pick(["Middle Class", "Upper Middle Class", "Rich"]),
      fatherOccupation: pick(["Business", "Government Employee", "Retired", "Farmer", "Engineer", "Teacher"]),
      motherOccupation: pick(["Homemaker", "Teacher", "Doctor", "Government Employee", "Business"]),
      brothersMarried: randBetween(0, 2),
      brothersUnmarried: randBetween(0, 1),
      sistersMarried: randBetween(0, 2),
      sistersUnmarried: randBetween(0, 1),
      highestDegree: degree,
      institution: pick(["Anna University", "IIT Madras", "VIT", "PSG Tech", "NIT Trichy", "Madras University", "BITS Pilani", "SRM University", "Bharathiar University", "Amrita University"]),
      occupation,
      employer,
      annualIncome: pick(incomes),
      workLocation: city,
      city,
      state,
      country: "India",
      whatsappNumber: `98${String(70000000 + i).padStart(8, "0")}`,
      diet: pick(["vegetarian", "non_vegetarian", "eggetarian"]),
      smoking: pick(["no", "no", "no", "occasionally"]),
      drinking: pick(["no", "no", "occasionally"]),
      hobbies: userHobbies,
      aboutMe,
      lookingFor: pick(lookingForTemplates),
      photos: [
        { url: `/profiles/groom${(i % 6) + 1}.jpg`, isPrimary: true, order: 1 },
        { url: `/profiles/groom${((i + 1) % 6) + 1}.jpg`, isPrimary: false, order: 2 },
      ],
      horoscopeUrl: "",
      verificationStatus: i < 15 ? "verified" : pick(["unverified", "pending"]),
      isOnline: i < 5,
      lastActive: hoursAgo(randBetween(0, 48)),
      profileViews: randBetween(10, 500),
      createdAt: daysAgo(randBetween(5, 150)),
      updatedAt: hoursAgo(randBetween(1, 72)),
    });

    partnerPrefs.push({
      _id: oid(),
      userId,
      ageRange: [age - 5, age - 1],
      heightRange: ["4'10\"", "5'7\""],
      maritalStatus: ["never_married"],
      childrenAcceptable: "doesnt_matter",
      motherTongues: pickN(["Tamil", "Telugu", "Kannada", "Malayalam"], 2),
      communities: pickN([...communities], 3),
      gothra: "",
      education: pickN([...degrees], 3),
      occupation: pickN([...occupations], 3),
      employmentType: "any",
      annualIncomeMin: "",
      locations: pickN([...cities], 4),
      citizenship: "any",
      starCompatibility: pick(["must", "preferred", "not_important"]),
      dosham: pick(["must_not", "doesnt_matter"]),
      diet: pick(["must_veg", "doesnt_matter"]),
      smokingAcceptable: "no",
      drinkingAcceptable: pick(["no", "occasionally_ok"]),
      familyType: "any",
      familyStatus: [],
      complexion: "any",
      physicalDisability: "no_disability",
    });
  }

  // Female users
  for (let i = 0; i < 25; i++) {
    const userId = oid();
    const age = randBetween(21, 32);
    const community = pick(communities);
    const city = pick(cities);
    const state = pick(states);
    const degree = pick(degrees);
    const occupation = pick(occupations);
    const employer = pick(employers);
    const star = pick(stars);
    const rashi = pick(rashis);
    const gothra = pick(gothras);
    const userHobbies = pickN([...hobbies], 3);
    const isPremium = i < 6; // first 6 females are premium
    const profileComplete = isPremium ? 100 : randBetween(55, 95);

    const aboutMe = pick(aboutMeTemplates)
      .replace("{occupation}", occupation).replace("{employer}", employer)
      .replace("{city}", city).replace("{familyType}", pick(["joint", "nuclear"]))
      .replace("{degree}", degree)
      .replace("{hobby1}", userHobbies[0]).replace("{hobby2}", userHobbies[1]).replace("{hobby3}", userHobbies[2] || "Reading");

    users.push({
      _id: userId,
      phone: `97${String(80000000 + i).padStart(8, "0")}`,
      email: femaleNames[i].toLowerCase().replace(/ /g, ".") + "@gmail.com",
      password: hashedPw,
      role: i < 22 ? "individual" : "parent",
      gender: "female",
      isPremium,
      plan: isPremium ? pick(["premium_3", "premium_6", "premium_12"]) : "free",
      status: "active",
      profileComplete,
      createdAt: daysAgo(randBetween(5, 150)),
      updatedAt: hoursAgo(randBetween(1, 72)),
    });

    profiles.push({
      _id: oid(),
      userId,
      fullName: femaleNames[i],
      dateOfBirth: `${1994 + (25 - age)}-${String(randBetween(1, 12)).padStart(2, "0")}-${String(randBetween(1, 28)).padStart(2, "0")}`,
      age,
      height: pick(heights.slice(0, 10)), // shorter range for females
      motherTongue: pick(["Tamil", "Telugu", "Kannada", "Malayalam"]),
      community,
      subCaste: "",
      maritalStatus: i < 23 ? "never_married" : pick(["divorced", "widowed"]),
      hasChildren: i >= 23,
      numberOfChildren: i >= 23 ? 1 : 0,
      religion: "Hindu",
      gothra,
      star,
      rashi,
      hasDosham: pick([null, "Chevvai Dosham", "No Dosham"]),
      familyType: pick(["joint", "nuclear"]),
      familyStatus: pick(["Middle Class", "Upper Middle Class", "Rich"]),
      fatherOccupation: pick(["Business", "Government Employee", "Retired", "Farmer", "Engineer", "Teacher"]),
      motherOccupation: pick(["Homemaker", "Teacher", "Doctor", "Government Employee"]),
      brothersMarried: randBetween(0, 2),
      brothersUnmarried: randBetween(0, 1),
      sistersMarried: randBetween(0, 2),
      sistersUnmarried: randBetween(0, 1),
      highestDegree: degree,
      institution: pick(["Anna University", "Stella Maris College", "Ethiraj College", "WCC", "MCC", "Madras University", "VIT", "SRM University", "Amrita University", "PSG Tech"]),
      occupation,
      employer,
      annualIncome: pick(incomes),
      workLocation: city,
      city,
      state,
      country: "India",
      whatsappNumber: `97${String(80000000 + i).padStart(8, "0")}`,
      diet: pick(["vegetarian", "vegetarian", "non_vegetarian", "eggetarian"]),
      smoking: "no",
      drinking: pick(["no", "no", "no", "occasionally"]),
      hobbies: userHobbies,
      aboutMe,
      lookingFor: pick(lookingForTemplates),
      photos: [
        { url: `/profiles/bride${(i % 11) + 1}.jpg`, isPrimary: true, order: 1 },
        { url: `/profiles/bride${((i + 1) % 11) + 1}.jpg`, isPrimary: false, order: 2 },
      ],
      horoscopeUrl: "",
      verificationStatus: i < 12 ? "verified" : pick(["unverified", "pending"]),
      isOnline: i < 4,
      lastActive: hoursAgo(randBetween(0, 48)),
      profileViews: randBetween(15, 600),
      createdAt: daysAgo(randBetween(5, 150)),
      updatedAt: hoursAgo(randBetween(1, 72)),
    });

    partnerPrefs.push({
      _id: oid(),
      userId,
      ageRange: [age + 1, age + 7],
      heightRange: ["5'5\"", "6'2\""],
      maritalStatus: ["never_married"],
      childrenAcceptable: "doesnt_matter",
      motherTongues: pickN(["Tamil", "Telugu", "Kannada", "Malayalam"], 2),
      communities: pickN([...communities], 3),
      gothra: "",
      education: pickN([...degrees], 3),
      occupation: pickN([...occupations], 3),
      employmentType: pick(["any", "employed"]),
      annualIncomeMin: pick(["6-8 Lakhs", "8-10 Lakhs", ""]),
      locations: pickN([...cities], 4),
      citizenship: "any",
      starCompatibility: pick(["must", "preferred", "not_important"]),
      dosham: pick(["must_not", "doesnt_matter"]),
      diet: pick(["must_veg", "doesnt_matter"]),
      smokingAcceptable: "no",
      drinkingAcceptable: "no",
      familyType: "any",
      familyStatus: [],
      complexion: "any",
      physicalDisability: "no_disability",
    });
  }

  await db.collection("users").deleteMany({});
  await db.collection("users").insertMany(users);
  console.log(`  ✓ ${users.length} users (25 male + 25 female)`);

  await db.collection("profiles").deleteMany({});
  await db.collection("profiles").insertMany(profiles);
  console.log(`  ✓ ${profiles.length} profiles`);

  await db.collection("partnerpreferences").deleteMany({});
  await db.collection("partnerpreferences").insertMany(partnerPrefs);
  console.log(`  ✓ ${partnerPrefs.length} partner preferences`);

  // ─── 3. INTERESTS (30 interests) ─────────────────────
  console.log("Seeding Interests...");
  const maleUsers = users.filter((u) => u.gender === "male");
  const femaleUsers = users.filter((u) => u.gender === "female");
  const interests: any[] = [];
  const interestPairs = new Set<string>();

  for (let i = 0; i < 30; i++) {
    const from = pick(maleUsers);
    const to = pick(femaleUsers);
    const pairKey = `${from._id}-${to._id}`;
    if (interestPairs.has(pairKey)) continue;
    interestPairs.add(pairKey);

    const status = pick(["pending", "pending", "accepted", "accepted", "declined", "expired"]);
    interests.push({
      _id: oid(),
      fromUserId: from._id,
      toUserId: to._id,
      status,
      note: status === "pending" ? pick(["Hi, I liked your profile!", "Your horoscope matches well. Let's connect.", "I found your profile interesting.", ""]) : "",
      respondedAt: status !== "pending" ? daysAgo(randBetween(1, 10)) : null,
      createdAt: daysAgo(randBetween(1, 20)),
      updatedAt: daysAgo(randBetween(0, 5)),
    });
  }

  // Some female-initiated interests too
  for (let i = 0; i < 10; i++) {
    const from = pick(femaleUsers);
    const to = pick(maleUsers);
    const pairKey = `${from._id}-${to._id}`;
    if (interestPairs.has(pairKey)) continue;
    interestPairs.add(pairKey);

    interests.push({
      _id: oid(),
      fromUserId: from._id,
      toUserId: to._id,
      status: pick(["pending", "accepted", "declined"]),
      note: pick(["Profile looks good!", "Interested in connecting.", ""]),
      respondedAt: daysAgo(randBetween(1, 8)),
      createdAt: daysAgo(randBetween(1, 15)),
      updatedAt: daysAgo(randBetween(0, 3)),
    });
  }

  await db.collection("interests").deleteMany({});
  await db.collection("interests").insertMany(interests);
  console.log(`  ✓ ${interests.length} interests`);

  // ─── 4. CONVERSATIONS & MESSAGES ──────────────────────
  console.log("Seeding Conversations & Messages...");
  const acceptedInterests = interests.filter((i) => i.status === "accepted");
  const conversations: any[] = [];
  const messages: any[] = [];

  const chatMessages = [
    "Hi! Thanks for accepting my interest.",
    "Hello! I liked your profile. Tell me more about yourself.",
    "Namaste! I'm glad we connected.",
    "Hi, how are you? I work in {city} as a software professional.",
    "That's great! I'm also from a similar background.",
    "What are your hobbies? I enjoy reading and music.",
    "I love cooking and travelling. Family is very important to me.",
    "My parents would like to talk to your family. Is that okay?",
    "Sure, let me share my parents' number.",
    "That sounds wonderful. Looking forward to meeting your family.",
    "Do you have any preferences for the wedding?",
    "We prefer a traditional ceremony. What about you?",
    "Same here! My family values traditions a lot.",
    "Great! Shall we plan a meeting this weekend?",
    "Yes, that works perfectly. Let me confirm with my family.",
    "How is your work going? Must be busy.",
    "Yes, quite hectic but managing well. How about you?",
    "I'm doing well. Just got promoted last month!",
    "Congratulations! That's wonderful news.",
    "Thank you! I feel blessed.",
  ];

  for (const interest of acceptedInterests.slice(0, 12)) {
    const convId = oid();
    const msgCount = randBetween(4, 10);
    const convMessages: any[] = [];

    for (let m = 0; m < msgCount; m++) {
      const senderId = m % 2 === 0 ? interest.fromUserId : interest.toUserId;
      convMessages.push({
        _id: oid(),
        conversationId: convId,
        senderId,
        content: chatMessages[m % chatMessages.length],
        type: "text",
        isRead: m < msgCount - 2,
        status: m < msgCount - 1 ? "read" : pick(["sent", "delivered"]),
        createdAt: hoursAgo((msgCount - m) * randBetween(2, 12)),
        updatedAt: hoursAgo((msgCount - m) * randBetween(2, 12)),
      });
    }

    // Add a system message
    convMessages.push({
      _id: oid(),
      conversationId: convId,
      senderId: interest.fromUserId,
      content: "You both have exchanged 5 messages! Photo access is now unlocked.",
      type: "system",
      isRead: true,
      status: "read",
      createdAt: hoursAgo(randBetween(20, 48)),
      updatedAt: hoursAgo(randBetween(20, 48)),
    });

    const lastMsg = convMessages[convMessages.length - 2]; // last text message
    conversations.push({
      _id: convId,
      participants: [interest.fromUserId, interest.toUserId],
      lastMessage: lastMsg.content,
      lastMessageAt: lastMsg.createdAt,
      unreadCount: { [String(interest.toUserId)]: 1, [String(interest.fromUserId)]: 0 },
      createdAt: daysAgo(randBetween(5, 15)),
      updatedAt: lastMsg.createdAt,
    });

    messages.push(...convMessages);
  }

  await db.collection("conversations").deleteMany({});
  await db.collection("conversations").insertMany(conversations);
  console.log(`  ✓ ${conversations.length} conversations`);

  await db.collection("messages").deleteMany({});
  await db.collection("messages").insertMany(messages);
  console.log(`  ✓ ${messages.length} messages`);

  // ─── 5. SHORTLISTS ───────────────────────────────────
  console.log("Seeding Shortlists...");
  const shortlists: any[] = [];
  const shortlistPairs = new Set<string>();

  for (let i = 0; i < 40; i++) {
    const user = pick(users);
    const target = pick(user.gender === "male" ? femaleUsers : maleUsers);
    const pairKey = `${user._id}-${target._id}`;
    if (shortlistPairs.has(pairKey)) continue;
    shortlistPairs.add(pairKey);

    shortlists.push({
      _id: oid(),
      userId: user._id,
      shortlistedUserId: target._id,
      createdAt: daysAgo(randBetween(1, 30)),
      updatedAt: daysAgo(randBetween(0, 10)),
    });
  }

  await db.collection("shortlists").deleteMany({});
  await db.collection("shortlists").insertMany(shortlists);
  console.log(`  ✓ ${shortlists.length} shortlists`);

  // ─── 6. PROFILE VIEWS ────────────────────────────────
  console.log("Seeding Profile Views...");
  const profileViews: any[] = [];

  for (let i = 0; i < 100; i++) {
    const viewer = pick(users);
    const viewed = pick(viewer.gender === "male" ? femaleUsers : maleUsers);
    profileViews.push({
      _id: oid(),
      viewerId: viewer._id,
      viewedUserId: viewed._id,
      createdAt: daysAgo(randBetween(0, 30)),
      updatedAt: daysAgo(randBetween(0, 30)),
    });
  }

  await db.collection("profileviews").deleteMany({});
  await db.collection("profileviews").insertMany(profileViews);
  console.log(`  ✓ ${profileViews.length} profile views`);

  // ─── 7. VERIFICATION REQUESTS ────────────────────────
  console.log("Seeding Verification Requests...");
  const verifications: any[] = [];

  for (let i = 0; i < 15; i++) {
    const user = users[i];
    const profile = profiles[i];
    const status = i < 8 ? "approved" : i < 12 ? "pending" : "rejected";
    verifications.push({
      _id: oid(),
      userId: user._id,
      userName: profile.fullName,
      documentType: pick(["aadhaar", "passport", "voter_id", "driving_license"]),
      documentUrl: `/docs/doc_${i + 1}.jpg`,
      selfieUrl: `/docs/selfie_${i + 1}.jpg`,
      status,
      reviewedAt: status !== "pending" ? daysAgo(randBetween(1, 20)) : null,
      reviewedBy: status !== "pending" ? "Super Admin" : null,
      rejectionReason: status === "rejected" ? pick(["Document not clear", "Face doesn't match document", "Expired document"]) : null,
      createdAt: daysAgo(randBetween(5, 40)),
      updatedAt: daysAgo(randBetween(0, 10)),
    });
  }

  await db.collection("verificationrequests").deleteMany({});
  await db.collection("verificationrequests").insertMany(verifications);
  console.log(`  ✓ ${verifications.length} verification requests`);

  // ─── 8. REPORTS ───────────────────────────────────────
  console.log("Seeding Reports...");
  const reports: any[] = [];
  const reasons: any[] = ["fake_profile", "inappropriate_photos", "harassment", "spam", "underage", "other"];

  for (let i = 0; i < 8; i++) {
    const reporter = users[randBetween(0, 49)];
    const reported = users[randBetween(0, 49)];
    if (reporter._id.equals(reported._id)) continue;

    const reporterProfile = profiles.find((p: any) => p.userId.equals(reporter._id));
    const reportedProfile = profiles.find((p: any) => p.userId.equals(reported._id));
    const status = i < 3 ? "resolved" : i < 6 ? "open" : "dismissed";

    reports.push({
      _id: oid(),
      reportedUserId: reported._id,
      reportedUserName: reportedProfile?.fullName || "Unknown",
      reportedByUserId: reporter._id,
      reportedByUserName: reporterProfile?.fullName || "Unknown",
      reason: pick(reasons),
      description: pick([
        "This profile seems fake. Photos look like stock images.",
        "Received inappropriate messages from this user.",
        "This user is sending spam messages to multiple profiles.",
        "Profile information seems misleading and incorrect.",
        "Harassing behavior in chat, using abusive language.",
        "Suspected underage user, age seems incorrect.",
      ]),
      status,
      resolvedAt: status !== "open" ? daysAgo(randBetween(1, 10)) : null,
      resolution: status === "resolved" ? pick(["User warned", "Profile suspended for 7 days", "Photos removed"]) : status === "dismissed" ? "No violation found" : null,
      createdAt: daysAgo(randBetween(2, 30)),
      updatedAt: daysAgo(randBetween(0, 5)),
    });
  }

  await db.collection("reports").deleteMany({});
  await db.collection("reports").insertMany(reports);
  console.log(`  ✓ ${reports.length} reports`);

  // ─── 9. SUBSCRIPTIONS ────────────────────────────────
  console.log("Seeding Subscriptions...");
  const subscriptions: any[] = [];
  const premiumUsers = users.filter((u) => u.isPremium);

  for (const pu of premiumUsers) {
    const profile = profiles.find((p: any) => p.userId.equals(pu._id));
    const plan = pu.plan as string;
    const months = plan === "premium_3" ? 3 : plan === "premium_6" ? 6 : 12;
    const amount = plan === "premium_3" ? 2999 : plan === "premium_6" ? 4999 : 7999;
    const startDate = daysAgo(randBetween(10, 60));
    const endDate = new Date(startDate.getTime() + months * 30 * 86400000);

    subscriptions.push({
      _id: oid(),
      userId: pu._id,
      userName: profile?.fullName || "Unknown",
      plan,
      amount,
      startDate,
      endDate,
      status: endDate > now ? "active" : "expired",
      paymentMethod: pick(["UPI", "Netbanking", "Credit Card", "Debit Card"]),
      razorpayOrderId: `order_${Math.random().toString(36).slice(2, 16)}`,
      razorpayPaymentId: `pay_${Math.random().toString(36).slice(2, 16)}`,
      createdAt: startDate,
      updatedAt: startDate,
    });
  }

  // Add a few expired subscriptions for non-premium users
  for (let i = 0; i < 5; i++) {
    const nonPremium = users.filter((u) => !u.isPremium)[i];
    if (!nonPremium) continue;
    const profile = profiles.find((p: any) => p.userId.equals(nonPremium._id));
    const startDate = daysAgo(randBetween(100, 200));

    subscriptions.push({
      _id: oid(),
      userId: nonPremium._id,
      userName: profile?.fullName || "Unknown",
      plan: "premium_3",
      amount: 2999,
      startDate,
      endDate: new Date(startDate.getTime() + 90 * 86400000),
      status: "expired",
      paymentMethod: pick(["UPI", "Netbanking"]),
      razorpayOrderId: `order_${Math.random().toString(36).slice(2, 16)}`,
      razorpayPaymentId: `pay_${Math.random().toString(36).slice(2, 16)}`,
      createdAt: startDate,
      updatedAt: startDate,
    });
  }

  await db.collection("subscriptions").deleteMany({});
  await db.collection("subscriptions").insertMany(subscriptions);
  console.log(`  ✓ ${subscriptions.length} subscriptions`);

  // ─── 10. ACTIVITY LOGS ───────────────────────────────
  console.log("Seeding Activity Logs...");
  const activityLogs: any[] = [];
  const actions = [
    { action: "user_registered", description: "New user registered via phone OTP" },
    { action: "profile_updated", description: "Profile information updated" },
    { action: "photo_uploaded", description: "New photo uploaded to profile" },
    { action: "interest_sent", description: "Interest sent to another profile" },
    { action: "interest_accepted", description: "Interest accepted from another profile" },
    { action: "interest_declined", description: "Interest declined" },
    { action: "chat_started", description: "New conversation started" },
    { action: "subscription_purchased", description: "Premium subscription purchased" },
    { action: "verification_submitted", description: "ID verification document submitted" },
    { action: "verification_approved", description: "ID verification approved by admin" },
    { action: "verification_rejected", description: "ID verification rejected by admin" },
    { action: "profile_reported", description: "Profile reported by another user" },
    { action: "user_suspended", description: "User account suspended by admin" },
    { action: "profile_shortlisted", description: "Profile added to shortlist" },
    { action: "login", description: "User logged in" },
    { action: "password_changed", description: "Password updated" },
    { action: "contact_shared", description: "Contact number shared in chat" },
    { action: "admin_login", description: "Admin logged into dashboard" },
  ];

  for (let i = 0; i < 60; i++) {
    const user = pick(users);
    const profile = profiles.find((p: any) => p.userId.equals(user._id));
    const actionItem = pick(actions);

    activityLogs.push({
      _id: oid(),
      action: actionItem.action,
      description: actionItem.description,
      userId: user._id,
      userName: profile?.fullName || "Unknown",
      createdAt: daysAgo(randBetween(0, 45)),
      updatedAt: daysAgo(randBetween(0, 45)),
    });
  }

  // Add admin activity logs
  for (const admin of admins) {
    activityLogs.push(
      { _id: oid(), action: "admin_login", description: `Admin ${admin.name} logged in`, userId: admin._id, userName: admin.name, createdAt: hoursAgo(randBetween(1, 24)), updatedAt: hoursAgo(randBetween(1, 24)) },
      { _id: oid(), action: "verification_approved", description: `Admin ${admin.name} approved verification`, userId: admin._id, userName: admin.name, createdAt: daysAgo(randBetween(1, 10)), updatedAt: daysAgo(randBetween(1, 10)) },
    );
  }

  await db.collection("activitylogs").deleteMany({});
  await db.collection("activitylogs").insertMany(activityLogs);
  console.log(`  ✓ ${activityLogs.length} activity logs`);

  // ─── SUMMARY ──────────────────────────────────────────
  console.log("\n════════════════════════════════════════════");
  console.log("  SEED COMPLETE — thirumangalyam database");
  console.log("════════════════════════════════════════════");
  console.log(`  Admins:                 ${admins.length}`);
  console.log(`  Users:                  ${users.length} (25M + 25F)`);
  console.log(`  Profiles:               ${profiles.length}`);
  console.log(`  Partner Preferences:    ${partnerPrefs.length}`);
  console.log(`  Interests:              ${interests.length}`);
  console.log(`  Conversations:          ${conversations.length}`);
  console.log(`  Messages:               ${messages.length}`);
  console.log(`  Shortlists:             ${shortlists.length}`);
  console.log(`  Profile Views:          ${profileViews.length}`);
  console.log(`  Verification Requests:  ${verifications.length}`);
  console.log(`  Reports:                ${reports.length}`);
  console.log(`  Subscriptions:          ${subscriptions.length}`);
  console.log(`  Activity Logs:          ${activityLogs.length}`);
  console.log("════════════════════════════════════════════");
  console.log("\n  Test Login Credentials:");
  console.log("  ─────────────────────────────────────────");
  console.log("  Admin:  admin@thirumangalyam.com / Admin@123");
  console.log("  User:   Phone 9870000000 / Password Test@1234");
  console.log("  User:   Phone 9780000000 / Password Test@1234");
  console.log("════════════════════════════════════════════\n");

  await mongoose.disconnect();
  console.log("Disconnected. Database is ready!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
