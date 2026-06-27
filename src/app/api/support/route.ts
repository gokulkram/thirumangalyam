import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { SupportTicket, User, Profile } from "@/lib/db/models";

function genTicketNumber() {
  return `TM-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

/** GET /api/support — list current user's tickets */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const tickets = await SupportTicket.find({ userId: session.user.id })
      .sort({ updatedAt: -1 })
      .select("-messages")
      .lean();
    return NextResponse.json({ tickets });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** POST /api/support — create a new ticket */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();

    const { subject, category, description, priority } = await req.json();
    if (!subject?.trim() || !description?.trim())
      return NextResponse.json({ error: "Subject and description are required" }, { status: 400 });

    const [user, profile] = await Promise.all([
      User.findById(session.user.id).select("email phone isPremium plan").lean() as any,
      Profile.findOne({ userId: session.user.id }).select("fullName").lean() as any,
    ]);

    const isPremium = user?.isPremium ?? false;
    // Premium users default to high; free default to normal
    const resolvedPriority = isPremium
      ? (["high", "urgent"].includes(priority) ? priority : "high")
      : (["low", "normal"].includes(priority) ? priority : "normal");

    const ticket = await SupportTicket.create({
      ticketNumber: genTicketNumber(),
      userId: session.user.id,
      userName: profile?.fullName || "Member",
      userEmail: user?.email || "",
      userPhone: user?.phone || "",
      isPremium,
      subject: subject.trim(),
      category: category || "other",
      priority: resolvedPriority,
      status: "open",
      messages: [{ senderRole: "user", senderName: profile?.fullName || "Member", content: description.trim() }],
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
