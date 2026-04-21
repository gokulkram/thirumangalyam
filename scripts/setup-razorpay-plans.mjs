import Razorpay from "razorpay";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local
try {
  const envFile = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const plans = [
  {
    envKey: "RAZORPAY_PLAN_ID_3M",
    name: "Thirumangalyam Premium 3 Months",
    amount: 299900,
    period: "monthly",
    interval: 3,
    description: "3 months premium access — one-time charge",
    planId: "premium_3",
  },
  {
    envKey: "RAZORPAY_PLAN_ID_6M",
    name: "Thirumangalyam Premium 6 Months",
    amount: 499900,
    period: "monthly",
    interval: 6,
    description: "6 months premium access — one-time charge",
    planId: "premium_6",
  },
  {
    envKey: "RAZORPAY_PLAN_ID_12M",
    name: "Thirumangalyam Premium 12 Months",
    amount: 799900,
    period: "monthly",
    interval: 12,
    description: "12 months premium access — one-time charge",
    planId: "premium_12",
  },
];

console.log("Creating Razorpay plans...\n");

for (const plan of plans) {
  try {
    const created = await razorpay.plans.create({
      period: plan.period,
      interval: plan.interval,
      item: {
        name: plan.name,
        amount: plan.amount,
        currency: "INR",
        description: plan.description,
      },
      notes: { planId: plan.planId },
    });
    console.log(`✓ ${plan.planId}: ${created.id}`);
    console.log(`  ${plan.envKey}=${created.id}\n`);
  } catch (err) {
    console.error(`✗ ${plan.planId} failed:`, JSON.stringify(err, null, 2));
  }
}

console.log("Copy the plan IDs above into your .env.local");
