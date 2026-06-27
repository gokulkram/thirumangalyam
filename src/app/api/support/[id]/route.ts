import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { SupportTicket, Profile } from "@/lib/db/models";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/support/[id] — ticket detail with messages */
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    await connectDB();
    const ticket = await SupportTicket.findOne({ _id: id, userId: session.user.id }).lean();
    if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ticket });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** POST /api/support/[id] — user reply */
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const { content } = await req.json();
    if (!content?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });
    await connectDB();

    const ticket = await SupportTicket.findOne({ _id: id, userId: session.user.id });
    if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (ticket.status === "closed") return NextResponse.json({ error: "Ticket is closed" }, { status: 400 });

    const profile = await Profile.findOne({ userId: session.user.id }).select("fullName").lean() as any;
    ticket.messages.push({ senderRole: "user", senderName: profile?.fullName || "Member", content: content.trim() });
    if (ticket.status === "resolved") ticket.status = "open"; // reopen on reply
    await ticket.save();
    return NextResponse.json({ ticket });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
