import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models";

const DEFAULT_PREFS = {
  email: {
    newMatches: true,
    interestsReceived: true,
    interestAccepted: true,
    newMessages: true,
    profileViews: false,
    weeklyDigest: true,
  },
  push: { interests: true, messages: true, matchAlerts: true },
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const user = await User.findById(session.user.id).select("notificationPrefs").lean() as any;
    return NextResponse.json(user?.notificationPrefs ?? DEFAULT_PREFS);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const prefs = await req.json();
    await connectDB();
    await User.findByIdAndUpdate(session.user.id, { $set: { notificationPrefs: prefs } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
