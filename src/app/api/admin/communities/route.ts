import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { Community } from "@/lib/db/models";

// GET — list all communities
export async function GET() {
  try {
    await connectDB();
    const communities = await Community.find({}).sort({ name: 1 }).lean();
    return NextResponse.json({ communities });
  } catch (error: any) {
    console.error("GET /api/admin/communities error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — create a new community
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { name, subCommunities } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Community name is required" }, { status: 400 });
    }

    const existing = await Community.findOne({ name: name.trim() });
    if (existing) {
      return NextResponse.json({ error: "Community already exists" }, { status: 409 });
    }

    const community = await Community.create({
      name: name.trim(),
      subCommunities: (subCommunities || []).map((s: string) => s.trim()).filter(Boolean),
      isActive: true,
    });

    return NextResponse.json({ community }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/communities error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT — update a community
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id, name, subCommunities, isActive } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Community ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (subCommunities !== undefined) updateData.subCommunities = subCommunities.map((s: string) => s.trim()).filter(Boolean);
    if (isActive !== undefined) updateData.isActive = isActive;

    const community = await Community.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    return NextResponse.json({ community });
  } catch (error: any) {
    console.error("PUT /api/admin/communities error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — delete a community
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Community ID is required" }, { status: 400 });
    }

    const result = await Community.findByIdAndDelete(id);
    if (!result) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Community deleted" });
  } catch (error: any) {
    console.error("DELETE /api/admin/communities error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
