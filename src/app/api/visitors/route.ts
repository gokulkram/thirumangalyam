import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { ProfileView, Profile } from "@/lib/db/models";

export async function GET() {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const isPremium = (session.user as any).isPremium;

    const views = await ProfileView.find({ viewedUserId: userId })
      .sort({ createdAt: -1 })
      .lean();

    // Deduplicate by viewerId (keep most recent)
    const seen = new Set<string>();
    const uniqueViews: any[] = [];
    for (const view of views) {
      const viewerId = (view as any).viewerId.toString();
      if (!seen.has(viewerId)) {
        seen.add(viewerId);
        uniqueViews.push(view);
      }
    }

    // Populate viewer profiles
    const results = await Promise.all(
      uniqueViews.map(async (view: any, index: number) => {
        const profile = await Profile.findOne({ userId: view.viewerId })
          .select("userId fullName age city photos")
          .lean();

        return {
          ...view,
          profile,
          blurred: !isPremium && index >= 5,
        };
      })
    );

    // For non-premium, include all but mark as blurred after first 5
    const visibleResults = isPremium
      ? results
      : results.map((r, i) => {
          if (i >= 5) {
            return {
              ...r,
              profile: {
                userId: r.profile?.userId,
                fullName: "***",
                age: null,
                city: "***",
                photos: [],
              },
              blurred: true,
            };
          }
          return r;
        });

    return NextResponse.json({
      visitors: visibleResults,
      total: uniqueViews.length,
      isPremium,
    });
  } catch (error: any) {
    console.error("GET /api/visitors error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
