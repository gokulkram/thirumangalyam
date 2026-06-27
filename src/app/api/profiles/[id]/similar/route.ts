import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { Profile, User } from "@/lib/db/models";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const target = await Profile.findOne({ userId: id }).select("community age userId").lean() as any;
    if (!target) {
      // try by profile._id
      const byPid = await Profile.findById(id).select("community age userId").lean() as any;
      if (!byPid) return NextResponse.json({ profiles: [] });
      Object.assign(target ?? {}, byPid);
    }

    const community = target?.community;
    const age = target?.age || 28;
    const excludeIds = [
      new mongoose.Types.ObjectId(session.user.id),
      target?.userId,
    ].filter(Boolean);

    const profiles = await Profile.aggregate([
      {
        $match: {
          userId: { $nin: excludeIds },
          ...(community ? { community } : {}),
          age: { $gte: age - 6, $lte: age + 6 },
          "photos.0": { $exists: true },
        },
      },
      { $sample: { size: 12 } },
      { $limit: 6 },
      {
        $project: {
          userId: 1,
          fullName: 1,
          age: 1,
          occupation: 1,
          city: 1,
          state: 1,
          community: 1,
          verificationStatus: 1,
          photos: { $slice: ["$photos", 1] },
        },
      },
    ]);

    const mapped = profiles.map((p: any) => ({
      id: p._id.toString(),
      userId: p.userId?.toString(),
      name: p.fullName,
      age: p.age,
      occupation: p.occupation || "",
      location: [p.city, p.state].filter(Boolean).join(", "),
      community: p.community || "",
      primaryPhoto: p.photos?.[0]?.url || null,
      verificationStatus: p.verificationStatus || "unverified",
    }));

    return NextResponse.json({ profiles: mapped });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
