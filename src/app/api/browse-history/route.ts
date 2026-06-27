import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { ProfileView, Profile } from "@/lib/db/models";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    // Deduplicate: most recent view per unique viewedUserId
    const views = await ProfileView.aggregate([
      { $match: { viewerId: new mongoose.Types.ObjectId(session.user.id) } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$viewedUserId", viewedAt: { $first: "$createdAt" } } },
      { $sort: { viewedAt: -1 } },
      { $limit: 20 },
    ]);

    if (!views.length) return NextResponse.json({ profiles: [] });

    const viewedUserIds = views.map((v: any) => v._id);
    const viewedAtMap = new Map<string, Date>(views.map((v: any) => [v._id.toString(), v.viewedAt]));

    const profiles = await Profile.find({ userId: { $in: viewedUserIds } })
      .select("userId fullName age occupation city state community photos verificationStatus")
      .lean();

    const enriched = (profiles as any[])
      .map((p) => ({
        id: p._id.toString(),
        userId: p.userId.toString(),
        name: p.fullName,
        age: p.age,
        occupation: p.occupation || "",
        location: [p.city, p.state].filter(Boolean).join(", "),
        community: p.community || "",
        primaryPhoto: p.photos?.find((ph: any) => ph.isPrimary)?.url || p.photos?.[0]?.url || null,
        verificationStatus: p.verificationStatus || "unverified",
        viewedAt: viewedAtMap.get(p.userId.toString()),
      }))
      .sort((a, b) => new Date(b.viewedAt ?? 0).getTime() - new Date(a.viewedAt ?? 0).getTime());

    return NextResponse.json({ profiles: enriched });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
