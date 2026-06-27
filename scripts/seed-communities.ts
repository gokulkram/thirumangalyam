/**
 * Seed communities from constants into the database.
 * Run with: npx tsx scripts/seed-communities.ts
 */

import "./load-env";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("MONGODB_URI environment variable is not set");

const SUB_COMMUNITIES: Record<string, string[]> = {
  "Brahmin - Iyer": [
    "Vadama", "Brahacharanam", "Ashtasahasram", "Vathima", "Gurukkal",
    "Mulakanadu", "Kanyakubja", "Saiva Brahmin", "Smartha", "Other",
  ],
  "Brahmin - Iyengar": [
    "Vadakalai", "Thenkalai", "Sri Vaishnava", "Ramanuja", "Ahobilam",
    "Parakala", "Andavan", "Srivaishnava Brahmin", "Uttaradi Math", "Other",
  ],
  "Mudaliar": [
    "Sengunthar Mudaliar", "Agamudayar Mudaliar", "Arcot Mudaliar", "Thuluva Vellalar",
    "Saiva Mudaliar", "Kondaikatti Vellalar", "Karkatta Mudaliar", "Mudali Pillai",
    "Isai Vellalar", "Other",
  ],
  "Nadar": [
    "Hindu Nadar", "Christian Nadar", "Gramani", "Shanar",
    "Nadar Pillai", "Rani Nadar", "Nadan", "Giramar",
    "Nadavarkal", "Other",
  ],
  "Gounder": [
    "Kongu Vellala Gounder", "Vanniya Gounder", "Nattu Gounder", "Vettuva Gounder",
    "Urali Gounder", "Pala Gounder", "Toreya Gounder", "Aeri Vellalar Gounder",
    "Karkatta Gounder", "Other",
  ],
  "Chettiar": [
    "Nagarathar (Nattukotai)", "Arya Vysya", "Devanga Chettiar", "Kongu Chettiar",
    "Beri Chettiar", "Settiyar", "Telugu Chettiar", "Vanigar Chettiar",
    "Saiva Chettiar", "Other",
  ],
  "Pillai": [
    "Nair Pillai", "Saiva Pillai", "Vellalar Pillai", "Mudaliar Pillai",
    "Karaiyar Pillai", "Sengunthar Pillai", "Agamudayar Pillai", "Mudiraj Pillai",
    "Kaikolar Pillai", "Other",
  ],
  "Vanniyar": [
    "Vanniya Kula Kshatriya", "Padayachi", "Gounder (Vanniyar)", "Palli",
    "Agni Kula Kshatriya", "Naikkar", "Kaniyalar", "Mela Naicker",
    "Keerai Naicker", "Other",
  ],
  "Thevar": [
    "Maravar", "Kallar", "Agamudayar", "Mukkulathor",
    "Thanjavur Maravar", "Kondaikatti Kallar", "Ambalakarar", "Servai",
    "Piramalai Kallar", "Other",
  ],
  "Naidu": [
    "Balija Naidu", "Kamma Naidu", "Gavara Naidu", "Telugu Naidu",
    "Kapu Naidu", "Velama Naidu", "Raju Naidu", "Turpu Kapu",
    "Perika Naidu", "Other",
  ],
  "Nair": [
    "Menon", "Kurup", "Pillai (Nair)", "Panicker",
    "Unnithan", "Kaimal", "Nambiar", "Warrier",
    "Nambiath", "Other",
  ],
  "Ezhava": [
    "Thiyya", "Billava", "Ezhava", "Tiyyar",
    "Chowan", "Kadupattan", "Velan", "Kaniyar",
    "Tandan", "Other",
  ],
  "Menon": [
    "Nair Menon", "Karanavar Menon", "Tharwad Menon", "Embranthiri",
    "Potti", "Nambiar Menon", "Adiyodi Menon", "Kiriyathil Menon",
    "Kurup Menon", "Other",
  ],
  "Reddy": [
    "Kapu Reddy", "Panta Reddy", "Motati Reddy", "Deshmukh Reddy",
    "Gona Reddy", "Kamma Reddy", "Velama Reddy", "Gadde Reddy",
    "Munnuru Reddy", "Other",
  ],
  "Kamma": [
    "Kamma Naidu", "Kamma Chowdary", "Andhra Kamma", "Kamma Kapu",
    "Reddi Kamma", "Telaga Kamma", "Gavara Kamma", "Kamma Setty",
    "Kamma Boya", "Other",
  ],
  "Kapu": [
    "Balija", "Telaga", "Ontari", "Munnuru Kapu",
    "Kapu Naidu", "Turpu Kapu", "Pattapu Kapu", "Raju Kapu",
    "Nayi Brahmin", "Other",
  ],
  "Lingayat": [
    "Jangama", "Banajiga", "Sadar Lingayat", "Panchamasali",
    "Gowda Lingayat", "Reddy Lingayat", "Vokkaliga Lingayat", "Kuruba Lingayat",
    "Devanga Lingayat", "Other",
  ],
  "Vokkaliga": [
    "Gangadikar", "Morasu", "Namadhari", "Hallikar",
    "Kunchitiga", "Are Vokkaliga", "Gowda", "Banajigar",
    "Okkaliga", "Other",
  ],
  "Bunts": [
    "Nadava", "Jain Bunt", "Shetty Bunt", "Prabhu Bunt",
    "Rao Bunt", "Salian Bunt", "Nair Bunt", "Mangalorean Bunt",
    "Tulu Bunt", "Other",
  ],
  "Goud Saraswat": [
    "Goud Saraswat Brahmin", "Chitrapur Saraswat", "Rajapur Saraswat", "Sashtikar Saraswat",
    "Kudaldeshkar Saraswat", "Bhanavalikar", "Lotlikar", "Bardeshkar",
    "Mangalore Saraswat", "Other",
  ],
  "Other": [
    "SC/ST", "OBC", "Forward Caste", "Inter-Caste",
    "Muslim", "Christian", "Sikh", "Buddhist",
    "Jain", "Other",
  ],
};

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI!);
  console.log("Connected.\n");

  const db = mongoose.connection.db!;
  const col = db.collection("communities");

  // Clear existing
  await col.deleteMany({});
  console.log("Cleared existing communities.\n");

  const docs = Object.entries(SUB_COMMUNITIES).map(([name, subs]) => ({
    name,
    subCommunities: subs,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  await col.insertMany(docs);
  console.log(`✓ Inserted ${docs.length} communities with sub-communities.`);

  for (const doc of docs) {
    console.log(`  ${doc.name} (${doc.subCommunities.length} subs)`);
  }

  console.log("\nDone!");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
