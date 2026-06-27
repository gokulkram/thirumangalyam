/**
 * Seed 10 users per community (5 male + 5 female) = 210 total users
 * Run: npx tsx scripts/seed-community-users.ts
 *
 * Only replaces users, profiles, and partnerpreferences.
 * Admins, interests, messages, etc. are preserved.
 */

import "./load-env";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("MONGODB_URI environment variable is not set");

// ─── Helpers ────────────────────────────────────────────────
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pickN = <T>(arr: T[], n: number): T[] => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
const randBetween = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
const oid = () => new mongoose.Types.ObjectId();
const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000);

// ─── Name Banks ─────────────────────────────────────────────
const MALE_FIRST: string[] = [
  "Aarav", "Aditya", "Aravind", "Arun", "Arjun",
  "Ashwin", "Balaji", "Bharath", "Dinesh", "Ganesh",
  "Girish", "Harish", "Jayakumar", "Karthik", "Lokesh",
  "Mahesh", "Manoj", "Naveen", "Nithish", "Pradeep",
  "Rajesh",
];

const FEMALE_FIRST: string[] = [
  "Aishwarya", "Ambika", "Ananya", "Anitha", "Archana",
  "Bhavani", "Deepa", "Divya", "Gayathri", "Harini",
  "Janani", "Kavitha", "Keerthana", "Lakshmi", "Meenakshi",
  "Nithya", "Pavithra", "Priya", "Ramya", "Saranya",
  "Swathi",
];

// ─── Community Configuration ─────────────────────────────────
interface CommConf {
  name: string;
  motherTongue: string;
  state: string;
  cities: string[];
  maleSurnames: string[];
  femaleSurnames: string[];
  subs: string[];
}

const COMMUNITY_CONF: CommConf[] = [
  {
    name: "Brahmin - Iyer",
    motherTongue: "Tamil",
    state: "Tamil Nadu",
    cities: ["Chennai", "Trichy", "Kanchipuram", "Kumbakonam", "Madurai"],
    maleSurnames: ["Iyer", "Subramaniam", "Krishnan", "Venkataraman", "Chakravarthy"],
    femaleSurnames: ["Iyer", "Krishnaswamy", "Subramaniam", "Anantharaman", "Venkataraman"],
    subs: ["Vadama", "Brahacharanam", "Ashtasahasram", "Vathima", "Gurukkal", "Mulakanadu", "Kanyakubja", "Saiva Brahmin", "Smartha", "Other"],
  },
  {
    name: "Brahmin - Iyengar",
    motherTongue: "Tamil",
    state: "Tamil Nadu",
    cities: ["Chennai", "Kanchipuram", "Srirangam", "Tirupati", "Bangalore"],
    maleSurnames: ["Iyengar", "Ramanujam", "Srinivasan", "Vishwanathan", "Venkatachalam"],
    femaleSurnames: ["Iyengar", "Ramanujam", "Srinivasan", "Venkataramani", "Krishnachariar"],
    subs: ["Vadakalai", "Thenkalai", "Sri Vaishnava", "Ramanuja", "Ahobilam", "Parakala", "Andavan", "Srivaishnava Brahmin", "Uttaradi Math", "Other"],
  },
  {
    name: "Mudaliar",
    motherTongue: "Tamil",
    state: "Tamil Nadu",
    cities: ["Chennai", "Vellore", "Arcot", "Kanchipuram", "Salem"],
    maleSurnames: ["Mudaliar", "Velayutham", "Subramani", "Narayana", "Krishnamurthy"],
    femaleSurnames: ["Mudaliar", "Subramani", "Narayana", "Krishnamurthy", "Velayutham"],
    subs: ["Sengunthar Mudaliar", "Agamudayar Mudaliar", "Arcot Mudaliar", "Thuluva Vellalar", "Saiva Mudaliar", "Kondaikatti Vellalar", "Karkatta Mudaliar", "Mudali Pillai", "Isai Vellalar", "Other"],
  },
  {
    name: "Nadar",
    motherTongue: "Tamil",
    state: "Tamil Nadu",
    cities: ["Tirunelveli", "Thoothukudi", "Nagercoil", "Virudhunagar", "Sivakasi"],
    maleSurnames: ["Nadar", "Pandiyaraj", "Rajendran", "Selvaraj", "Tamilarasan"],
    femaleSurnames: ["Nadar", "Pandiyarajan", "Selvarani", "Rajendran", "Tamilselvi"],
    subs: ["Hindu Nadar", "Christian Nadar", "Gramani", "Shanar", "Nadar Pillai", "Rani Nadar", "Nadan", "Giramar", "Nadavarkal", "Other"],
  },
  {
    name: "Gounder",
    motherTongue: "Tamil",
    state: "Tamil Nadu",
    cities: ["Coimbatore", "Erode", "Tiruppur", "Namakkal", "Salem"],
    maleSurnames: ["Gounder", "Palaniswamy", "Murugesan", "Annamalai", "Kannan"],
    femaleSurnames: ["Gounder", "Palaniswami", "Murugesan", "Annamalai", "Kannamma"],
    subs: ["Kongu Vellala Gounder", "Vanniya Gounder", "Nattu Gounder", "Vettuva Gounder", "Urali Gounder", "Pala Gounder", "Toreya Gounder", "Aeri Vellalar Gounder", "Karkatta Gounder", "Other"],
  },
  {
    name: "Chettiar",
    motherTongue: "Tamil",
    state: "Tamil Nadu",
    cities: ["Karaikudi", "Coimbatore", "Chennai", "Madurai", "Kumbakonam"],
    maleSurnames: ["Chettiar", "Nagarajan", "Ganeshan", "Muthuraman", "Venkatesan"],
    femaleSurnames: ["Chettiar", "Nagarajan", "Ganeshan", "Muthuraman", "Venkatesan"],
    subs: ["Nagarathar (Nattukotai)", "Arya Vysya", "Devanga Chettiar", "Kongu Chettiar", "Beri Chettiar", "Settiyar", "Telugu Chettiar", "Vanigar Chettiar", "Saiva Chettiar", "Other"],
  },
  {
    name: "Pillai",
    motherTongue: "Tamil",
    state: "Tamil Nadu",
    cities: ["Chennai", "Thanjavur", "Trichy", "Madurai", "Tirunelveli"],
    maleSurnames: ["Pillai", "Krishnakumar", "Chandran", "Rajagopalan", "Balakrishnan"],
    femaleSurnames: ["Pillai", "Chandran", "Krishnakumar", "Rajagopalan", "Balakrishnan"],
    subs: ["Nair Pillai", "Saiva Pillai", "Vellalar Pillai", "Mudaliar Pillai", "Karaiyar Pillai", "Sengunthar Pillai", "Agamudayar Pillai", "Mudiraj Pillai", "Kaikolar Pillai", "Other"],
  },
  {
    name: "Vanniyar",
    motherTongue: "Tamil",
    state: "Tamil Nadu",
    cities: ["Villupuram", "Cuddalore", "Salem", "Dharmapuri", "Tiruvannamalai"],
    maleSurnames: ["Padayachi", "Murugan", "Selvam", "Anand", "Raj"],
    femaleSurnames: ["Padayachi", "Murugavel", "Selvi", "Anandhi", "Raja"],
    subs: ["Vanniya Kula Kshatriya", "Padayachi", "Gounder (Vanniyar)", "Palli", "Agni Kula Kshatriya", "Naikkar", "Kaniyalar", "Mela Naicker", "Keerai Naicker", "Other"],
  },
  {
    name: "Thevar",
    motherTongue: "Tamil",
    state: "Tamil Nadu",
    cities: ["Madurai", "Dindigul", "Ramanathapuram", "Sivaganga", "Virudhunagar"],
    maleSurnames: ["Thevar", "Rajan", "Muthuswamy", "Marimuthu", "Arul"],
    femaleSurnames: ["Thevar", "Rajan", "Muthuswamy", "Marimuthu", "Arulmozhi"],
    subs: ["Maravar", "Kallar", "Agamudayar", "Mukkulathor", "Thanjavur Maravar", "Kondaikatti Kallar", "Ambalakarar", "Servai", "Piramalai Kallar", "Other"],
  },
  {
    name: "Naidu",
    motherTongue: "Telugu",
    state: "Andhra Pradesh",
    cities: ["Vijayawada", "Visakhapatnam", "Guntur", "Nellore", "Chennai"],
    maleSurnames: ["Naidu", "Reddaiah", "Prasad", "Subrahmanyam", "Venkatesh"],
    femaleSurnames: ["Naidu", "Reddaiah", "Lakshmi", "Subrahmanyam", "Venkatesh"],
    subs: ["Balija Naidu", "Kamma Naidu", "Gavara Naidu", "Telugu Naidu", "Kapu Naidu", "Velama Naidu", "Raju Naidu", "Turpu Kapu", "Perika Naidu", "Other"],
  },
  {
    name: "Nair",
    motherTongue: "Malayalam",
    state: "Kerala",
    cities: ["Thiruvananthapuram", "Kochi", "Thrissur", "Kozhikode", "Kollam"],
    maleSurnames: ["Nair", "Menon", "Warrier", "Kurup", "Pillai"],
    femaleSurnames: ["Nair", "Menon", "Warrier", "Kurup", "Pillai"],
    subs: ["Menon", "Kurup", "Pillai (Nair)", "Panicker", "Unnithan", "Kaimal", "Nambiar", "Warrier", "Nambiath", "Other"],
  },
  {
    name: "Ezhava",
    motherTongue: "Malayalam",
    state: "Kerala",
    cities: ["Kochi", "Thiruvananthapuram", "Alappuzha", "Thrissur", "Kollam"],
    maleSurnames: ["Ezhava", "Krishnan", "Kumar", "Rajan", "Damodaran"],
    femaleSurnames: ["Ezhava", "Krishnan", "Kumar", "Rajan", "Damodaran"],
    subs: ["Thiyya", "Billava", "Ezhava", "Tiyyar", "Chowan", "Kadupattan", "Velan", "Kaniyar", "Tandan", "Other"],
  },
  {
    name: "Menon",
    motherTongue: "Malayalam",
    state: "Kerala",
    cities: ["Thrissur", "Kochi", "Kozhikode", "Palakkad", "Malappuram"],
    maleSurnames: ["Menon", "Nair", "Krishnan", "Varma", "Unni"],
    femaleSurnames: ["Menon", "Nair", "Krishnan", "Varma", "Unni"],
    subs: ["Nair Menon", "Karanavar Menon", "Tharwad Menon", "Embranthiri", "Potti", "Nambiar Menon", "Adiyodi Menon", "Kiriyathil Menon", "Kurup Menon", "Other"],
  },
  {
    name: "Reddy",
    motherTongue: "Telugu",
    state: "Telangana",
    cities: ["Hyderabad", "Warangal", "Vijayawada", "Nellore", "Karimnagar"],
    maleSurnames: ["Reddy", "Narayana", "Venkataramana", "Gopal", "Seshagiri"],
    femaleSurnames: ["Reddy", "Narayana", "Venkataramana", "Gopal", "Laxmi"],
    subs: ["Kapu Reddy", "Panta Reddy", "Motati Reddy", "Deshmukh Reddy", "Gona Reddy", "Kamma Reddy", "Velama Reddy", "Gadde Reddy", "Munnuru Reddy", "Other"],
  },
  {
    name: "Kamma",
    motherTongue: "Telugu",
    state: "Andhra Pradesh",
    cities: ["Vijayawada", "Guntur", "Nellore", "Visakhapatnam", "Hyderabad"],
    maleSurnames: ["Chowdary", "Rao", "Naidu", "Srinivas", "Krishna"],
    femaleSurnames: ["Chowdary", "Rao", "Naidu", "Srinivas", "Krishna"],
    subs: ["Kamma Naidu", "Kamma Chowdary", "Andhra Kamma", "Kamma Kapu", "Reddi Kamma", "Telaga Kamma", "Gavara Kamma", "Kamma Setty", "Kamma Boya", "Other"],
  },
  {
    name: "Kapu",
    motherTongue: "Telugu",
    state: "Andhra Pradesh",
    cities: ["Kakinada", "Rajahmundry", "Eluru", "Vijayawada", "Guntur"],
    maleSurnames: ["Kapu", "Naidu", "Venkatesh", "Prasad", "Rao"],
    femaleSurnames: ["Kapu", "Naidu", "Venkatesh", "Lakshmi", "Rao"],
    subs: ["Balija", "Telaga", "Ontari", "Munnuru Kapu", "Kapu Naidu", "Turpu Kapu", "Pattapu Kapu", "Raju Kapu", "Nayi Brahmin", "Other"],
  },
  {
    name: "Lingayat",
    motherTongue: "Kannada",
    state: "Karnataka",
    cities: ["Bangalore", "Hubli-Dharwad", "Belgaum (Belagavi)", "Davangere", "Gulbarga (Kalaburagi)"],
    maleSurnames: ["Patil", "Naik", "Kulkarni", "Shettar", "Kamble"],
    femaleSurnames: ["Patil", "Naik", "Kulkarni", "Shettar", "Kamble"],
    subs: ["Jangama", "Banajiga", "Sadar Lingayat", "Panchamasali", "Gowda Lingayat", "Reddy Lingayat", "Vokkaliga Lingayat", "Kuruba Lingayat", "Devanga Lingayat", "Other"],
  },
  {
    name: "Vokkaliga",
    motherTongue: "Kannada",
    state: "Karnataka",
    cities: ["Bangalore", "Mysore", "Tumkur", "Mandya", "Hassan"],
    maleSurnames: ["Gowda", "Hegde", "Naik", "Raju", "Patel"],
    femaleSurnames: ["Gowda", "Hegde", "Naik", "Raju", "Patel"],
    subs: ["Gangadikar", "Morasu", "Namadhari", "Hallikar", "Kunchitiga", "Are Vokkaliga", "Gowda", "Banajigar", "Okkaliga", "Other"],
  },
  {
    name: "Bunts",
    motherTongue: "Tulu",
    state: "Karnataka",
    cities: ["Mangalore", "Udupi", "Kundapura", "Bangalore", "Puttur"],
    maleSurnames: ["Shetty", "Kamath", "Prabhu", "Nayak", "Rao"],
    femaleSurnames: ["Shetty", "Kamath", "Prabhu", "Nayak", "Rao"],
    subs: ["Nadava", "Jain Bunt", "Shetty Bunt", "Prabhu Bunt", "Rao Bunt", "Salian Bunt", "Nair Bunt", "Mangalorean Bunt", "Tulu Bunt", "Other"],
  },
  {
    name: "Goud Saraswat",
    motherTongue: "Konkani",
    state: "Goa",
    cities: ["Panaji", "Margao", "Mangalore", "Mumbai", "Bangalore"],
    maleSurnames: ["Kamat", "Shenoy", "Nayak", "Lotlikar", "Rao"],
    femaleSurnames: ["Kamat", "Shenoy", "Nayak", "Lotlikar", "Rao"],
    subs: ["Goud Saraswat Brahmin", "Chitrapur Saraswat", "Rajapur Saraswat", "Sashtikar Saraswat", "Kudaldeshkar Saraswat", "Bhanavalikar", "Lotlikar", "Bardeshkar", "Mangalore Saraswat", "Other"],
  },
  {
    name: "Other",
    motherTongue: "Tamil",
    state: "Tamil Nadu",
    cities: ["Chennai", "Bangalore", "Hyderabad", "Mumbai", "Coimbatore"],
    maleSurnames: ["Kumar", "Singh", "Sharma", "Gupta", "Patel"],
    femaleSurnames: ["Kumar", "Singh", "Sharma", "Devi", "Patel"],
    subs: ["SC/ST", "OBC", "Forward Caste", "Inter-Caste", "Muslim", "Christian", "Sikh", "Buddhist", "Jain", "Other"],
  },
];

// ─── Static Reference Data ───────────────────────────────────
const STARS = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"];
const RASHIS = ["Mesha (Aries)", "Vrishabha (Taurus)", "Mithuna (Gemini)", "Karka (Cancer)", "Simha (Leo)", "Kanya (Virgo)", "Tula (Libra)", "Vrischika (Scorpio)", "Dhanu (Sagittarius)", "Makara (Capricorn)", "Kumbha (Aquarius)", "Meena (Pisces)"];
const GOTHRAS = ["Bharadwaj", "Kashyapa", "Vasishtha", "Vishwamitra", "Atri", "Agastya", "Jamadagni", "Gautama"];
const DEGREES = ["B.E./B.Tech", "M.E./M.Tech", "MBA/PGDM", "M.Sc.", "MBBS", "B.Sc.", "BCA", "MCA", "Ph.D.", "B.Com", "M.Com", "LLB"];
const OCCUPATIONS = ["Software Professional", "Doctor", "Engineer", "Business/Entrepreneur", "Government Employee", "Teacher/Professor", "Chartered Accountant", "Banking Professional", "Lawyer/Legal", "Scientist/Researcher", "Architect", "Defence/Armed Forces"];
const EMPLOYERS = ["TCS", "Infosys", "Wipro", "HCL Technologies", "Cognizant", "Accenture", "Google", "Microsoft", "Amazon", "Zoho", "Apollo Hospitals", "State Government", "Central Government", "Self Employed", "HDFC Bank", "ICICI Bank", "L&T", "Capgemini", "Freshworks", "Reliance Industries"];
const INCOMES = ["4-6 Lakhs", "6-8 Lakhs", "8-10 Lakhs", "10-15 Lakhs", "15-20 Lakhs", "20-30 Lakhs"];
const HOBBIES_LIST = ["Music", "Dance", "Reading", "Travel", "Cooking", "Sports", "Yoga", "Photography", "Painting", "Movies", "Gaming", "Gardening"];
const HEIGHTS_M = ["5'6\"", "5'7\"", "5'8\"", "5'9\"", "5'10\"", "5'11\"", "6'0\"", "6'1\""];
const HEIGHTS_F = ["5'0\"", "5'1\"", "5'2\"", "5'3\"", "5'4\"", "5'5\"", "5'6\""];
const FATHER_OCC = ["Business", "Government Employee", "Retired", "Farmer", "Engineer", "Teacher", "Doctor", "Advocate"];
const MOTHER_OCC = ["Homemaker", "Teacher", "Doctor", "Government Employee", "Business"];
const ABOUT_TEMPLATES = [
  "I am a {occ} working at {emp} in {city}. I come from a close-knit {ft} family with strong values. Looking for a life partner who shares similar interests and respects family traditions.",
  "Professionally working as a {occ} at {emp}. I enjoy {h1} and {h2} in my free time. My family is very supportive and we believe in a blend of traditional values and modern thinking.",
  "I completed my {deg} and currently work as a {occ}. Family-oriented and believe in simple living with strong relationships. Hobbies include {h1}, {h2}, and {h3}.",
  "A dedicated {occ} based in {city}. I value education, career growth, and family bonds equally. I enjoy {h1} and {h2}. Looking for someone caring and understanding.",
  "Passionate {occ} who loves {h1} and {h2}. I believe in mutual respect and trust in a relationship. My family has always been my biggest strength.",
];
const LOOKING_FOR_TEMPLATES = [
  "Looking for an educated, family-oriented partner with good values. Someone from a similar cultural background who respects traditions while being open-minded.",
  "Seeking a caring and understanding life partner who values family, education, and career. Someone honest, supportive, with a positive outlook on life.",
  "I am looking for a well-educated, professionally settled partner who respects elders, loves family, and has a good sense of humour.",
  "Prefer a partner who is kind, ambitious, and grounded. Family values are very important to me. Looking for a best friend and life partner in one.",
  "Seeking a compatible partner who believes in equality, mutual respect, and togetherness. Education and family background are important.",
];

// ─── Main Seed Function ──────────────────────────────────────
async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI!);
  console.log("Connected!\n");

  const db = mongoose.connection.db!;
  const hashedPw = await bcrypt.hash("Demo@1234", 10);

  // Clear only user/profile/partnerprefs data (preserve admins and other data)
  await db.collection("users").deleteMany({});
  await db.collection("profiles").deleteMany({});
  await db.collection("partnerpreferences").deleteMany({});
  console.log("Cleared users, profiles, and partner preferences.\n");

  const users: any[] = [];
  const profiles: any[] = [];
  const partnerPrefs: any[] = [];

  let malePhoneCounter = 0;
  let femalePhoneCounter = 0;

  for (let ci = 0; ci < COMMUNITY_CONF.length; ci++) {
    const conf = COMMUNITY_CONF[ci];
    console.log(`  Seeding: ${conf.name}`);

    // ── 5 Males ──
    for (let ui = 0; ui < 5; ui++) {
      const userId = oid();
      const firstName = MALE_FIRST[(ci * 5 + ui) % MALE_FIRST.length];
      const lastName = conf.maleSurnames[ui];
      const fullName = `${firstName} ${lastName}`;
      const emailSlug = `${firstName.toLowerCase()}${lastName.toLowerCase()}`;
      const phone = `98${String(10000000 + malePhoneCounter++).padStart(8, "0")}`;
      const email = `${emailSlug}.m${ci}${ui}@demo.com`;
      const age = randBetween(24, 35);
      const city = conf.cities[ui % conf.cities.length];
      const state = conf.state;
      const degree = pick(DEGREES);
      const occupation = pick(OCCUPATIONS);
      const employer = pick(EMPLOYERS);
      const star = STARS[(ci * 5 + ui) % STARS.length];
      const rashi = RASHIS[(ci + ui) % RASHIS.length];
      const gothra = pick(GOTHRAS);
      const hobbies = pickN(HOBBIES_LIST, 3);
      const isPremium = ui === 0; // first male in each community is premium
      const profileComplete = isPremium ? 100 : randBetween(70, 95);
      const subCaste = conf.subs[ui % conf.subs.length];
      const createdAt = daysAgo(randBetween(3, 120));

      const aboutMe = pick(ABOUT_TEMPLATES)
        .replace("{occ}", occupation).replace("{emp}", employer).replace("{city}", city)
        .replace("{ft}", pick(["joint", "nuclear"])).replace("{deg}", degree)
        .replace("{h1}", hobbies[0]).replace("{h2}", hobbies[1]).replace("{h3}", hobbies[2] || "Travel");

      users.push({
        _id: userId,
        phone,
        email,
        password: hashedPw,
        role: "individual",
        gender: "male",
        isPremium,
        plan: isPremium ? pick(["premium_3", "premium_6", "premium_12"]) : "free",
        status: "active",
        profileComplete,
        createdAt,
        updatedAt: hoursAgo(randBetween(1, 48)),
      });

      profiles.push({
        _id: oid(),
        userId,
        fullName,
        dateOfBirth: `${2025 - age}-${String(randBetween(1, 12)).padStart(2, "0")}-${String(randBetween(1, 28)).padStart(2, "0")}`,
        age,
        height: pick(HEIGHTS_M),
        motherTongue: conf.motherTongue,
        community: conf.name,
        subCaste,
        maritalStatus: "never_married",
        hasChildren: false,
        numberOfChildren: 0,
        religion: "Hindu",
        gothra,
        star,
        rashi,
        hasDosham: pick([null, null, "Chevvai Dosham", "No Dosham"]),
        familyType: pick(["joint", "nuclear"]),
        familyStatus: pick(["Middle Class", "Upper Middle Class", "Rich"]),
        fatherOccupation: pick(FATHER_OCC),
        motherOccupation: pick(MOTHER_OCC),
        brothersMarried: randBetween(0, 2),
        brothersUnmarried: randBetween(0, 1),
        sistersMarried: randBetween(0, 2),
        sistersUnmarried: randBetween(0, 1),
        highestDegree: degree,
        institution: pick(["Anna University", "IIT Madras", "VIT", "NIT Trichy", "Madras University", "BITS Pilani", "SRM University", "Amrita University", "PSG Tech", "Bharathiar University", "IISc Bangalore", "JNTU Hyderabad", "Osmania University", "Kerala University", "Calicut University"]),
        occupation,
        employer,
        annualIncome: pick(INCOMES),
        workLocation: city,
        city,
        state,
        country: "India",
        whatsappNumber: phone,
        diet: pick(["vegetarian", "vegetarian", "non_vegetarian", "eggetarian"]),
        smoking: pick(["no", "no", "no", "occasionally"]),
        drinking: pick(["no", "no", "occasionally"]),
        hobbies,
        aboutMe,
        lookingFor: pick(LOOKING_FOR_TEMPLATES),
        photos: (() => {
          const GROOM = ["groom", "groom2", "groom3", "groom4"];
          return [
            { url: `/profiles/${GROOM[malePhoneCounter % 4]}.jpg`, isPrimary: true, order: 1 },
            { url: `/profiles/${GROOM[(malePhoneCounter + 1) % 4]}.jpg`, isPrimary: false, order: 2 },
          ];
        })(),
        horoscopeUrl: "",
        verificationStatus: ui < 2 ? "verified" : pick(["unverified", "pending"]),
        isOnline: ui === 0 && ci % 3 === 0,
        lastActive: hoursAgo(randBetween(1, 72)),
        profileViews: randBetween(10, 400),
        createdAt,
        updatedAt: hoursAgo(randBetween(1, 48)),
      });

      partnerPrefs.push({
        _id: oid(),
        userId,
        ageRange: [age - 6, age - 1],
        heightRange: ["4'10\"", "5'7\""],
        maritalStatus: ["never_married"],
        childrenAcceptable: "doesnt_matter",
        motherTongues: [conf.motherTongue],
        communities: [conf.name],
        gothra: "",
        education: pickN(DEGREES, 3),
        occupation: pickN(OCCUPATIONS, 3),
        employmentType: "any",
        annualIncomeMin: "",
        locations: conf.cities.slice(0, 3),
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

    // ── 5 Females ──
    for (let ui = 0; ui < 5; ui++) {
      const userId = oid();
      const firstName = FEMALE_FIRST[(ci * 5 + ui) % FEMALE_FIRST.length];
      const lastName = conf.femaleSurnames[ui];
      const fullName = `${firstName} ${lastName}`;
      const emailSlug = `${firstName.toLowerCase()}${lastName.toLowerCase()}`;
      const phone = `97${String(10000000 + femalePhoneCounter++).padStart(8, "0")}`;
      const email = `${emailSlug}.f${ci}${ui}@demo.com`;
      const age = randBetween(21, 32);
      const city = conf.cities[ui % conf.cities.length];
      const state = conf.state;
      const degree = pick(DEGREES);
      const occupation = pick(OCCUPATIONS);
      const employer = pick(EMPLOYERS);
      const star = STARS[(ci * 5 + ui + 3) % STARS.length];
      const rashi = RASHIS[(ci + ui + 2) % RASHIS.length];
      const gothra = pick(GOTHRAS);
      const hobbies = pickN(HOBBIES_LIST, 3);
      const isPremium = ui === 0; // first female in each community is premium
      const profileComplete = isPremium ? 100 : randBetween(65, 95);
      const subCaste = conf.subs[(ui + 5) % conf.subs.length];
      const createdAt = daysAgo(randBetween(3, 120));

      const aboutMe = pick(ABOUT_TEMPLATES)
        .replace("{occ}", occupation).replace("{emp}", employer).replace("{city}", city)
        .replace("{ft}", pick(["joint", "nuclear"])).replace("{deg}", degree)
        .replace("{h1}", hobbies[0]).replace("{h2}", hobbies[1]).replace("{h3}", hobbies[2] || "Reading");

      users.push({
        _id: userId,
        phone,
        email,
        password: hashedPw,
        role: "individual",
        gender: "female",
        isPremium,
        plan: isPremium ? pick(["premium_3", "premium_6", "premium_12"]) : "free",
        status: "active",
        profileComplete,
        createdAt,
        updatedAt: hoursAgo(randBetween(1, 48)),
      });

      profiles.push({
        _id: oid(),
        userId,
        fullName,
        dateOfBirth: `${2025 - age}-${String(randBetween(1, 12)).padStart(2, "0")}-${String(randBetween(1, 28)).padStart(2, "0")}`,
        age,
        height: pick(HEIGHTS_F),
        motherTongue: conf.motherTongue,
        community: conf.name,
        subCaste,
        maritalStatus: "never_married",
        hasChildren: false,
        numberOfChildren: 0,
        religion: "Hindu",
        gothra,
        star,
        rashi,
        hasDosham: pick([null, null, "Chevvai Dosham", "No Dosham"]),
        familyType: pick(["joint", "nuclear"]),
        familyStatus: pick(["Middle Class", "Upper Middle Class", "Rich"]),
        fatherOccupation: pick(FATHER_OCC),
        motherOccupation: pick(MOTHER_OCC),
        brothersMarried: randBetween(0, 2),
        brothersUnmarried: randBetween(0, 1),
        sistersMarried: randBetween(0, 2),
        sistersUnmarried: randBetween(0, 1),
        highestDegree: degree,
        institution: pick(["Anna University", "Stella Maris College", "Ethiraj College", "MCC Chennai", "Madras Medical College", "Madras University", "VIT", "SRM University", "Amrita University", "PSG Tech", "Kerala University", "Calicut University", "Osmania University", "JNTU Hyderabad", "Christ University Bangalore"]),
        occupation,
        employer,
        annualIncome: pick(INCOMES),
        workLocation: city,
        city,
        state,
        country: "India",
        whatsappNumber: phone,
        diet: pick(["vegetarian", "vegetarian", "vegetarian", "non_vegetarian", "eggetarian"]),
        smoking: "no",
        drinking: pick(["no", "no", "no", "occasionally"]),
        hobbies,
        aboutMe,
        lookingFor: pick(LOOKING_FOR_TEMPLATES),
        photos: [
          { url: `/profiles/bride${(femalePhoneCounter % 11) + 1}.jpg`, isPrimary: true, order: 1 },
          { url: `/profiles/bride${((femalePhoneCounter + 1) % 11) + 1}.jpg`, isPrimary: false, order: 2 },
        ],
        horoscopeUrl: "",
        verificationStatus: ui < 2 ? "verified" : pick(["unverified", "pending"]),
        isOnline: ui === 0 && ci % 4 === 0,
        lastActive: hoursAgo(randBetween(1, 72)),
        profileViews: randBetween(15, 500),
        createdAt,
        updatedAt: hoursAgo(randBetween(1, 48)),
      });

      partnerPrefs.push({
        _id: oid(),
        userId,
        ageRange: [age + 1, age + 8],
        heightRange: ["5'5\"", "6'2\""],
        maritalStatus: ["never_married"],
        childrenAcceptable: "doesnt_matter",
        motherTongues: [conf.motherTongue],
        communities: [conf.name],
        gothra: "",
        education: pickN(DEGREES, 3),
        occupation: pickN(OCCUPATIONS, 3),
        employmentType: pick(["any", "employed"]),
        annualIncomeMin: pick(["6-8 Lakhs", "8-10 Lakhs", ""]),
        locations: conf.cities.slice(0, 3),
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
  }

  // ── Insert All ──
  await db.collection("users").insertMany(users);
  await db.collection("profiles").insertMany(profiles);
  await db.collection("partnerpreferences").insertMany(partnerPrefs);

  const maleCount = users.filter((u) => u.gender === "male").length;
  const femaleCount = users.filter((u) => u.gender === "female").length;

  console.log("\n════════════════════════════════════════════");
  console.log("  COMMUNITY USERS SEED COMPLETE");
  console.log("════════════════════════════════════════════");
  console.log(`  Communities:         ${COMMUNITY_CONF.length}`);
  console.log(`  Total Users:         ${users.length} (${maleCount}M + ${femaleCount}F)`);
  console.log(`  Profiles:            ${profiles.length}`);
  console.log(`  Partner Preferences: ${partnerPrefs.length}`);
  console.log("  Users per community: 5 male + 5 female = 10");
  console.log("────────────────────────────────────────────");
  console.log("  Demo Login (any user):");
  console.log("  Password: Demo@1234");
  console.log("  Male phone:   9810000000 → 9810000104");
  console.log("  Female phone: 9710000000 → 9710000104");
  console.log("════════════════════════════════════════════\n");

  await mongoose.disconnect();
  console.log("Done!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
