import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { Profile } from "@/lib/db/models";

const DEFAULT_PRIVACY = {
  profileVisibility: "all",
  photoPrivacy: "all",
  showContact: true,
  showHoroscope: true,
  showOnline: true,
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const profile = await Profile.findOne({ userId: session.user.id })
      .select("profileVisibility photoPrivacy showContact showHoroscope showOnline")
      .lean() as any;
    return NextResponse.json({
      profileVisibility: profile?.profileVisibility ?? DEFAULT_PRIVACY.profileVisibility,
      photoPrivacy: profile?.photoPrivacy ?? DEFAULT_PRIVACY.photoPrivacy,
      showContact: profile?.showContact ?? DEFAULT_PRIVACY.showContact,
      showHoroscope: profile?.showHoroscope ?? DEFAULT_PRIVACY.showHoroscope,
      showOnline: profile?.showOnline ?? DEFAULT_PRIVACY.showOnline,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const { profileVisibility, photoPrivacy, showContact, showHoroscope, showOnline } = body;
    if (profileVisibility && !["all", "premium", "hidden"].includes(profileVisibility))
      return NextResponse.json({ error: "Invalid profileVisibility" }, { status: 400 });
    if (photoPrivacy && !["all", "accepted", "protected"].includes(photoPrivacy))
      return NextResponse.json({ error: "Invalid photoPrivacy" }, { status: 400 });
    await connectDB();
    await Profile.findOneAndUpdate(
      { userId: session.user.id },
      { $set: { profileVisibility, photoPrivacy, showContact, showHoroscope, showOnline } }
    );
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
