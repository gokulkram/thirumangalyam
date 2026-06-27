import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { User, Profile, PartnerPreferences } from "@/lib/db/models";

export interface ScoreFactor {
  label: string;
  description: string;
  points: number;
  maxPoints: number;
  matched: boolean;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { userId: targetId } = await params;
    await connectDB();

    const [myProfile, myPrefs, targetProfile, targetUser] = await Promise.all([
      Profile.findOne({ userId: session.user.id }).lean() as any,
      PartnerPreferences.findOne({ userId: session.user.id }).lean() as any,
      Profile.findOne({ userId: targetId }).lean() as any,
      User.findById(targetId).select("isPremium profileComplete").lean() as any,
    ]);

    if (!myProfile || !targetProfile) return NextResponse.json({ score: 0, factors: [] });

    const pp = myPrefs || {};
    const myCommunity = myProfile.community || "";
    const preferredCommunities: string[] = myCommunity ? [myCommunity] : [];
    if (pp.communities?.length) pp.communities.forEach((c: string) => { if (!preferredCommunities.includes(c)) preferredCommunities.push(c); });

    const communityMatch = preferredCommunities.length > 0 && preferredCommunities.includes(targetProfile.community);
    const ageMatch = pp.ageRange?.length === 2 && targetProfile.age
      ? targetProfile.age >= pp.ageRange[0] && targetProfile.age <= pp.ageRange[1]
      : false;
    const tongueMatch = pp.motherTongues?.length > 0 && pp.motherTongues.includes(targetProfile.motherTongue);
    const locationMatch = pp.locations?.length > 0 && pp.locations.includes(targetProfile.city);
    const maritalMatch = pp.maritalStatus?.length > 0 && pp.maritalStatus.includes(targetProfile.maritalStatus);
    const eduMatch = pp.education?.length > 0 && pp.education.includes(targetProfile.highestDegree);
    const occMatch = pp.occupation?.length > 0 && pp.occupation.includes(targetProfile.occupation);
    const dietMatch = pp.diet === "must_veg" && targetProfile.diet === "vegetarian";
    const isVerified = targetProfile.verificationStatus === "verified";
    const profileComplete = targetUser?.profileComplete ?? 0;
    const profileBonus = Math.round(profileComplete / 10);

    const raw =
      (communityMatch ? 100 : 0) +
      (ageMatch ? 20 : 0) +
      (tongueMatch ? 15 : 0) +
      (locationMatch ? 15 : 0) +
      (maritalMatch ? 10 : 0) +
      (eduMatch ? 10 : 0) +
      (occMatch ? 10 : 0) +
      (dietMatch ? 5 : 0) +
      (isVerified ? 10 : 0) +
      profileBonus;

    const score = Math.min(100, Math.round((raw / 205) * 100));

    const factors: ScoreFactor[] = [
      { label: "Community",       description: `${preferredCommunities.length > 0 ? `Prefers ${preferredCommunities[0]}` : "No community pref set"}`, points: communityMatch ? 100 : 0, maxPoints: 100, matched: communityMatch },
      { label: "Age Range",       description: pp.ageRange?.length === 2 ? `Your range ${pp.ageRange[0]}–${pp.ageRange[1]} yrs` : "No age pref set",        points: ageMatch ? 20 : 0,       maxPoints: 20,  matched: ageMatch },
      { label: "Mother Tongue",   description: pp.motherTongues?.join(", ") || "No language pref",                                                           points: tongueMatch ? 15 : 0,    maxPoints: 15,  matched: tongueMatch },
      { label: "Location",        description: pp.locations?.join(", ") || "No location pref",                                                               points: locationMatch ? 15 : 0,  maxPoints: 15,  matched: locationMatch },
      { label: "Marital Status",  description: pp.maritalStatus?.join(", ") || "No pref set",                                                                points: maritalMatch ? 10 : 0,   maxPoints: 10,  matched: maritalMatch },
      { label: "Education",       description: pp.education?.join(", ") || "No pref set",                                                                    points: eduMatch ? 10 : 0,       maxPoints: 10,  matched: eduMatch },
      { label: "Occupation",      description: pp.occupation?.join(", ") || "No pref set",                                                                   points: occMatch ? 10 : 0,       maxPoints: 10,  matched: occMatch },
      { label: "Diet",            description: pp.diet === "must_veg" ? "Vegetarian required" : "No diet pref",                                              points: dietMatch ? 5 : 0,       maxPoints: 5,   matched: dietMatch },
      { label: "Verified",        description: "Identity-verified profile",                                                                                  points: isVerified ? 10 : 0,     maxPoints: 10,  matched: isVerified },
      { label: "Profile Quality", description: `${profileComplete}% complete`,                                                                               points: profileBonus,            maxPoints: 10,  matched: profileBonus > 0 },
    ];

    return NextResponse.json({ score, factors, rawPoints: raw, maxPoints: 205 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
