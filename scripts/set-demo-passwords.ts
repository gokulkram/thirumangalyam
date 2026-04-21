/**
 * Sets demo passwords for test users
 * Run: npx tsx scripts/set-demo-passwords.ts
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI =
  "mongodb+srv://thirumangalyam:QA6FQv80xRG0Zh83@cluster0.t1qnu90.mongodb.net/thirumangalyam?appName=Cluster0";

const userSchema = new mongoose.Schema({
  phone: String,
  email: String,
  password: { type: String, default: "" },
  role: { type: String, default: "individual" },
  gender: String,
  isPremium: { type: Boolean, default: false },
  plan: { type: String, default: "free" },
  status: { type: String, default: "active" },
  profileComplete: { type: Number, default: 0 },
}, { timestamps: true });

const adminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: { type: String, default: "" },
  role: { type: String, default: "admin" },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);

async function main() {
  console.log("Connecting...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected!\n");

  const demoPassword = await bcrypt.hash("demo123", 10);
  const adminPassword = await bcrypt.hash("admin123", 10);

  // Set passwords for all users
  const result = await User.updateMany(
    { password: { $in: ["", null] } },
    { $set: { password: demoPassword } }
  );
  console.log(`Updated ${result.modifiedCount} users with password: demo123`);

  // Set admin password
  const adminResult = await Admin.updateMany(
    {},
    { $set: { password: adminPassword } }
  );
  console.log(`Updated ${adminResult.modifiedCount} admins with password: admin123`);

  // Print demo accounts
  console.log("\n=== Demo Accounts ===\n");

  console.log("--- ADMIN ---");
  const admin = await Admin.findOne({});
  if (admin) {
    console.log(`  Email:    ${admin.email}`);
    console.log(`  Password: admin123`);
    console.log(`  URL:      /admin-login\n`);
  }

  console.log("--- PREMIUM USERS ---");
  const premiumUsers = await User.find({ isPremium: true, status: "active" }).limit(3);
  for (const u of premiumUsers) {
    console.log(`  ${u.email}`);
    console.log(`    Phone:    ${u.phone}`);
    console.log(`    Password: demo123`);
    console.log(`    Plan:     ${u.plan}\n`);
  }

  console.log("--- FREE USERS ---");
  const freeUsers = await User.find({ isPremium: false, status: "active" }).limit(3);
  for (const u of freeUsers) {
    console.log(`  ${u.email}`);
    console.log(`    Phone:    ${u.phone}`);
    console.log(`    Password: demo123`);
    console.log(`    Plan:     ${u.plan}\n`);
  }

  await mongoose.disconnect();
  console.log("Done!");
}

main().catch(console.error);
