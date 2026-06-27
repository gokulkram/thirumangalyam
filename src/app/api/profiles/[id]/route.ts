import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { User, Profile, ProfileView, PartnerPreferences, Interest, Shortlist } from "@/lib/db/models";
import mongoose from "mongoose";
import { notifyProfileViewed } from "@/lib/notifications/service";

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && new mongoose.Types.ObjectId(id).toString() === id;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid profile ID" }, { status: 400 });
    }

    // Try to find by userId first, then fall back to profile _id
    let user = await User.findById(id).select("-password").lean() as any;
    let profile = user ? await Profile.findOne({ userId: id }).lean() as any : null;

    // If not found by userId, try finding by profile _id
    if (!profile) {
      profile = await Profile.findById(id).lean() as any;
      if (profile) {
        user = await User.findById(profile.userId).select("-password").lean() as any;
      }
    }

    if (!user || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const userId = user._id.toString();
    const isOwnProfile = session.user.id === userId;

    const [partnerPreferences, viewerUser] = await Promise.all([
      PartnerPreferences.findOne({ userId }).lean(),
      isOwnProfile
        ? Promise.resolve(null)
        : User.findById(session.user.id).select("isPremium").lean(),
    ]);

    const viewerIsPremium = isOwnProfile || !!(viewerUser as any)?.isPremium;

    // Check interest and shortlist status for the viewing user
    let interestSent = false;
    let isShortlisted = false;

    if (!isOwnProfile) {
      const [interest, shortlist] = await Promise.all([
        Interest.findOne({
          fromUserId: session.user.id,
          toUserId: userId,
          status: { $in: ["pending", "accepted"] },
        }).lean(),
        Shortlist.findOne({
          userId: session.user.id,
          shortlistedUserId: userId,
        }).lean(),
      ]);

      interestSent = !!interest;
      isShortlisted = !!shortlist;

      // Record profile view (non-blocking)
      ProfileView.create({ viewerId: session.user.id, viewedUserId: userId }).catch(() => {});
      Profile.findOneAndUpdate({ userId }, { $inc: { profileViews: 1 } }).catch(() => {});

      // Notify viewed user if they opted in (throttled per viewer)
      notifyProfileViewed({
        viewedUserId: userId,
        viewerUserId: session.user.id,
        viewerProfileName: (profile as any)?.fullName || null,
        viewerIsPremium: viewerIsPremium,
      }).catch(() => {});
    }

    // Strip contact details from non-premium viewers
    const { phone, email, ...userWithoutContacts } = user as any;
    const { whatsappNumber, ...profileWithoutContacts } = profile as any;

    const safeUser = viewerIsPremium
      ? user
      : { ...userWithoutContacts, phone: undefined, email: undefined };

    const safeProfile = viewerIsPremium
      ? profile
      : { ...profileWithoutContacts, whatsappNumber: undefined };

    return NextResponse.json({
      user: safeUser,
      profile: safeProfile,
      partnerPreferences,
      interestSent,
      isShortlisted,
      canViewContacts: viewerIsPremium,
    });
  } catch (error: any) {
    console.error("GET /api/profiles/[id] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
