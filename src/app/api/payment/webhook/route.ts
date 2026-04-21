import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db/connection";
import { Subscription, User, ActivityLog } from "@/lib/db/models";

function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return hmac === signature;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    await connectDB();

    switch (event.event) {
      case "subscription.charged": {
        const sub = event.payload.subscription?.entity;
        const payment = event.payload.payment?.entity;
        if (!sub?.id) break;

        const dbSub = await Subscription.findOne({ razorpaySubscriptionId: sub.id });
        if (dbSub) {
          dbSub.status = "active";
          if (payment?.id) dbSub.razorpayPaymentId = payment.id;
          await dbSub.save();
        }
        break;
      }

      case "subscription.cancelled": {
        const sub = event.payload.subscription?.entity;
        if (!sub?.id) break;

        const dbSub = await Subscription.findOneAndUpdate(
          { razorpaySubscriptionId: sub.id },
          { status: "cancelled" }
        );

        if (dbSub) {
          await User.findByIdAndUpdate(dbSub.userId, {
            isPremium: false,
            plan: "free",
          });
          await ActivityLog.create({
            action: "subscription_cancelled",
            description: `Subscription ${sub.id} cancelled`,
            userId: dbSub.userId,
            userName: dbSub.userName,
          });
        }
        break;
      }

      case "subscription.completed": {
        const sub = event.payload.subscription?.entity;
        if (!sub?.id) break;

        const dbSub = await Subscription.findOneAndUpdate(
          { razorpaySubscriptionId: sub.id },
          { status: "expired" }
        );

        if (dbSub) {
          await User.findByIdAndUpdate(dbSub.userId, {
            isPremium: false,
            plan: "free",
          });
          await ActivityLog.create({
            action: "subscription_expired",
            description: `Subscription ${sub.id} completed`,
            userId: dbSub.userId,
            userName: dbSub.userName,
          });
        }
        break;
      }

      case "payment.failed": {
        const payment = event.payload.payment?.entity;
        const subscriptionId = payment?.subscription_id;
        if (!subscriptionId) break;

        await ActivityLog.create({
          action: "payment_failed",
          description: `Payment failed for subscription ${subscriptionId}`,
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
