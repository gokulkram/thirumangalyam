import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Community } from "@/lib/db/models";

// Public API — returns active communities for dropdowns
export async function GET() {
  try {
    await connectDB();
    const communities = await Community.find({ isActive: true })
      .sort({ name: 1 })
      .select("name subCommunities")
      .lean();

    // Build map: { "Brahmin - Iyer": ["Vadama", "Brahacharanam", ...] }
    const communityList = communities.map((c: any) => c.name);
    const subCommunityMap: Record<string, string[]> = {};
    for (const c of communities as any[]) {
      subCommunityMap[c.name] = c.subCommunities || [];
    }

    return NextResponse.json({ communities: communityList, subCommunities: subCommunityMap });
  } catch (error: any) {
    console.error("GET /api/communities error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
