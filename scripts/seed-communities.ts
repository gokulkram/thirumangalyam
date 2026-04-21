/**
 * Seed communities from constants into the database.
 * Run with: npx tsx scripts/seed-communities.ts
 */

import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://thirumangalyam:QA6FQv80xRG0Zh83@cluster0.t1qnu90.mongodb.net/thirumangalyam?appName=Cluster0";

const SUB_COMMUNITIES: Record<string, string[]> = {
  "Brahmin - Iyer": ["Vadama", "Brahacharanam", "Ashtasahasram", "Vathima", "Gurukkal", "Other"],
  "Brahmin - Iyengar": ["Vadakalai", "Thenkalai", "Other"],
  "Mudaliar": ["Sengunthar Mudaliar", "Agamudayar Mudaliar", "Arcot Mudaliar", "Thuluva Vellalar", "Saiva Mudaliar", "Other"],
  "Nadar": ["Hindu Nadar", "Christian Nadar", "Gramani", "Other"],
  "Gounder": ["Kongu Vellala Gounder", "Vanniya Gounder", "Nattu Gounder", "Vettuva Gounder", "Urali Gounder", "Other"],
  "Chettiar": ["Nagarathar (Nattukotai)", "Arya Vysya", "Devanga Chettiar", "Kongu Chettiar", "Other"],
  "Pillai": ["Nair Pillai", "Saiva Pillai", "Vellalar Pillai", "Other"],
  "Vanniyar": ["Vanniya Kula Kshatriya", "Padayachi", "Gounder (Vanniyar)", "Other"],
  "Thevar": ["Maravar", "Kallar", "Agamudayar", "Mukkulathor", "Other"],
  "Naidu": ["Balija Naidu", "Kamma Naidu", "Gavara Naidu", "Telugu Naidu", "Other"],
  "Nair": ["Menon", "Kurup", "Pillai (Nair)", "Panicker", "Unnithan", "Other"],
  "Ezhava": ["Thiyya", "Billava", "Ezhava", "Other"],
  "Menon": ["Nair Menon", "Other"],
  "Reddy": ["Kapu Reddy", "Panta Reddy", "Motati Reddy", "Deshmukh Reddy", "Other"],
  "Kamma": ["Kamma Naidu", "Kamma Chowdary", "Other"],
  "Kapu": ["Balija", "Telaga", "Ontari", "Munnuru Kapu", "Other"],
  "Lingayat": ["Jangama", "Banajiga", "Sadar Lingayat", "Panchamasali", "Other"],
  "Vokkaliga": ["Gangadikar", "Morasu", "Namadhari", "Hallikar", "Other"],
  "Bunts": ["Nadava", "Jain Bunt", "Other"],
  "Goud Saraswat": ["Goud Saraswat Brahmin", "Chitrapur Saraswat", "Rajapur Saraswat", "Other"],
  "Other": ["Other"],
};

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
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
