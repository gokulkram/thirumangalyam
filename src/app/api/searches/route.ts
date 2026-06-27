import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { SavedSearch, User } from "@/lib/db/models";

const MAX_SAVED = 5;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const searches = await SavedSearch.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({
      searches: (searches as any[]).map((s) => ({ ...s, id: s._id.toString(), _id: undefined })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const user = await User.findById(session.user.id).select("isPremium").lean() as any;
    if (!user?.isPremium)
      return NextResponse.json({ error: "Saved searches are a Premium feature" }, { status: 403 });

    const { name, filters } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const count = await SavedSearch.countDocuments({ userId: session.user.id });
    if (count >= MAX_SAVED)
      return NextResponse.json({ error: `You can save up to ${MAX_SAVED} searches` }, { status: 400 });

    const saved = await SavedSearch.create({
      userId: session.user.id,
      name: name.trim(),
      filters,
    });

    return NextResponse.json({ search: { ...saved.toObject(), id: saved._id.toString(), _id: undefined } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
