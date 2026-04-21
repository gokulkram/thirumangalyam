import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { User, Profile, PartnerPreferences } from "@/lib/db/models";

export async function GET() {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [user, profile, partnerPreferences] = await Promise.all([
      User.findById(userId).select("-password").lean(),
      Profile.findOne({ userId }).lean(),
      PartnerPreferences.findOne({ userId }).lean(),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user,
      profile,
      partnerPreferences,
    });
  } catch (error: any) {
    console.error("GET /api/profiles/me error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { partnerPreferences: ppData, email, password, ...profileData } = body;

    // Update user-level fields (email, password)
    const userUpdate: Record<string, any> = {};
    if (email !== undefined && email !== "") {
      userUpdate.email = email;
    }
    if (password && password.trim().length >= 6) {
      userUpdate.password = await bcrypt.hash(password, 12);
    }
    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(userId, { $set: userUpdate });
    }

    // Remove empty string values for enum fields to avoid validation errors
    const enumFields = ["maritalStatus", "familyType", "diet", "smoking", "drinking", "verificationStatus"];
    for (const field of enumFields) {
      if (profileData[field] === "" || profileData[field] === undefined) {
        delete profileData[field];
      }
    }

    // Update profile
    const profile = await Profile.findOneAndUpdate(
      { userId },
      { $set: profileData },
      { new: true, upsert: true, runValidators: true }
    );

    // Update partner preferences
    let partnerPreferences = null;
    if (ppData) {
      partnerPreferences = await PartnerPreferences.findOneAndUpdate(
        { userId },
        { $set: ppData },
        { new: true, upsert: true, runValidators: true }
      );
    }

    // Calculate profile completeness
    const requiredFields = [
      "fullName", "dateOfBirth", "height", "motherTongue", "community",
      "maritalStatus", "highestDegree", "occupation", "city", "aboutMe",
    ];
    const filledFields = requiredFields.filter(
      (f) => profile[f] && String(profile[f]).trim() !== ""
    );
    const hasPhoto = profile.photos && profile.photos.length > 0;
    const completeness = Math.round(
      ((filledFields.length + (hasPhoto ? 1 : 0)) / (requiredFields.length + 1)) * 100
    );

    await User.findByIdAndUpdate(userId, { profileComplete: completeness });

    return NextResponse.json({
      profile,
      partnerPreferences,
      profileComplete: completeness,
    });
  } catch (error: any) {
    console.error("PUT /api/profiles/me error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
