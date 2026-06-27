import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { ProfileBoost, User, ActivityLog, Profile } from "@/lib/db/models";

const BOOST_DAYS = 7;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();

    const boost = await ProfileBoost.findOne({ userId: session.user.id }).lean() as any;
    if (!boost) return NextResponse.json({ active: false, canBoost: true, expiresAt: null, nextBoostAt: null });

    const now = new Date();
    const isActive = boost.isActive && new Date(boost.expiresAt) > now;
    const nextBoostAt = new Date(boost.boostedAt);
    nextBoostAt.setDate(nextBoostAt.getDate() + BOOST_DAYS);
    const canBoost = nextBoostAt <= now;

    return NextResponse.json({
      active: isActive,
      canBoost,
      expiresAt: boost.expiresAt,
      lastBoostedAt: boost.boostedAt,
      nextBoostAt: canBoost ? null : nextBoostAt,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();

    const user = await User.findById(session.user.id).select("isPremium").lean() as any;
    if (!user?.isPremium)
      return NextResponse.json({ error: "Profile boost is a Premium feature" }, { status: 403 });

    const existing = await ProfileBoost.findOne({ userId: session.user.id }).lean() as any;
    if (existing) {
      const nextBoostAt = new Date(existing.boostedAt);
      nextBoostAt.setDate(nextBoostAt.getDate() + BOOST_DAYS);
      if (nextBoostAt > new Date())
        return NextResponse.json(
          { error: `Next boost available on ${nextBoostAt.toLocaleDateString("en-IN")}` },
          { status: 400 }
        );
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + BOOST_DAYS);

    await ProfileBoost.findOneAndUpdate(
      { userId: session.user.id },
      { boostedAt: now, expiresAt, isActive: true },
      { upsert: true, new: true }
    );

    const profile = await Profile.findOne({ userId: session.user.id }).select("fullName").lean() as any;
    await ActivityLog.create({
      action: "profile_boosted",
      description: `${profile?.fullName || "User"} activated a 7-day profile boost`,
      userId: session.user.id,
      userName: profile?.fullName || "",
    });

    return NextResponse.json({ success: true, expiresAt });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
