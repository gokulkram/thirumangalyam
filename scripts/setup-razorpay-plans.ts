/**
 * Run once to create Razorpay plans for sandbox/production.
 * Usage: npx ts-node -r tsconfig-paths/register scripts/setup-razorpay-plans.ts
 *
 * Copy the output plan IDs into your .env.local:
 *   RAZORPAY_PLAN_ID_3M=plan_xxx
 *   RAZORPAY_PLAN_ID_6M=plan_yyy
 *   RAZORPAY_PLAN_ID_12M=plan_zzz
 */

import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const plans = [
  {
    envKey: "RAZORPAY_PLAN_ID_3M",
    name: "Thirumangalyam Premium 3 Months",
    amount: 299900,
    period: "monthly" as const,
    interval: 3,
    description: "3 months premium access — one-time charge",
    planId: "premium_3",
  },
  {
    envKey: "RAZORPAY_PLAN_ID_6M",
    name: "Thirumangalyam Premium 6 Months",
    amount: 499900,
    period: "monthly" as const,
    interval: 6,
    description: "6 months premium access — one-time charge",
    planId: "premium_6",
  },
  {
    envKey: "RAZORPAY_PLAN_ID_12M",
    name: "Thirumangalyam Premium 12 Months",
    amount: 799900,
    period: "monthly" as const,
    interval: 12,
    description: "12 months premium access — one-time charge",
    planId: "premium_12",
  },
];

async function main() {
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
        notes: {
          planId: plan.planId,
        },
      });
      console.log(`✓ ${plan.planId}: ${created.id}`);
      console.log(`  Add to .env.local: ${plan.envKey}=${created.id}\n`);
    } catch (err: any) {
      console.error(`✗ ${plan.planId} failed:`, err.message);
    }
  }

  console.log("\nDone. Copy the plan IDs above into your .env.local file.");
}

main();
