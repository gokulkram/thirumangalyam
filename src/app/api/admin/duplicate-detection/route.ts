import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { User, Profile } from "@/lib/db/models";

export async function GET(_request: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [phoneDupes, emailDupes, nameDupes] = await Promise.all([
      // Users sharing the same phone number
      User.aggregate([
        { $match: { phone: { $exists: true, $ne: null, $gt: "" } } },
        {
          $group: {
            _id: "$phone",
            count: { $sum: 1 },
            userIds: { $push: { id: "$_id", status: "$status", plan: "$plan", createdAt: "$createdAt" } },
          },
        },
        { $match: { count: { $gt: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 100 },
      ]),
      // Users sharing the same email
      User.aggregate([
        { $match: { email: { $exists: true, $ne: null, $gt: "" } } },
        {
          $group: {
            _id: "$email",
            count: { $sum: 1 },
            userIds: { $push: { id: "$_id", status: "$status", plan: "$plan", createdAt: "$createdAt" } },
          },
        },
        { $match: { count: { $gt: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 100 },
      ]),
      // Profiles sharing the same full name
      Profile.aggregate([
        { $match: { fullName: { $exists: true, $ne: null, $gt: "" } } },
        {
          $group: {
            _id: "$fullName",
            count: { $sum: 1 },
            entries: { $push: { userId: "$userId", community: "$community", city: "$city", createdAt: "$createdAt" } },
          },
        },
        { $match: { count: { $gt: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 100 },
      ]),
    ]);

    // Enrich phone/email groups with profile names
    async function enrichUserGroups(
      groups: { _id: string; count: number; userIds: { id: any; status: string; plan: string; createdAt: Date }[] }[]
    ) {
      const allIds = groups.flatMap((g) => g.userIds.map((u) => u.id));
      const profiles = await Profile.find({ userId: { $in: allIds } })
        .select("userId fullName city community photos")
        .lean();
      const profileMap = new Map(profiles.map((p: any) => [p.userId.toString(), p]));

      return groups.map((g) => ({
        key: g._id,
        count: g.count,
        users: g.userIds.map((u) => {
          const p = profileMap.get(u.id.toString()) as any;
          return {
            id: u.id.toString(),
            fullName: p?.fullName || "—",
            city: p?.city || "—",
            community: p?.community || "—",
            status: u.status,
            plan: u.plan,
            createdAt: u.createdAt,
            primaryPhoto: p?.photos?.find((ph: any) => ph.isPrimary)?.url || p?.photos?.[0]?.url || null,
          };
        }),
      }));
    }

    const [enrichedPhone, enrichedEmail] = await Promise.all([
      enrichUserGroups(phoneDupes as any),
      enrichUserGroups(emailDupes as any),
    ]);

    // Enrich name groups with user IDs → user status/plan
    const nameGroupUserIds = nameDupes.flatMap((g: any) => g.entries.map((e: any) => e.userId));
    const nameUsers = await User.find({ _id: { $in: nameGroupUserIds } }).select("_id status plan").lean();
    const nameUserMap = new Map((nameUsers as any[]).map((u) => [u._id.toString(), u]));

    const enrichedNames = (nameDupes as any[]).map((g) => ({
      key: g._id,
      count: g.count,
      users: g.entries.map((e: any) => {
        const u = nameUserMap.get(e.userId?.toString()) as any;
        return {
          id: e.userId?.toString(),
          fullName: g._id,
          city: e.city || "—",
          community: e.community || "—",
          status: u?.status || "unknown",
          plan: u?.plan || "free",
          createdAt: e.createdAt,
          primaryPhoto: null,
        };
      }),
    }));

    return NextResponse.json({
      phoneDupes: enrichedPhone,
      emailDupes: enrichedEmail,
      nameDupes: enrichedNames,
    });
  } catch (error: any) {
    console.error("GET /api/admin/duplicate-detection error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
