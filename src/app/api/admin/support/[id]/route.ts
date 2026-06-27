import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { SupportTicket, ActivityLog } from "@/lib/db/models";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/admin/support/[id] — full ticket with messages */
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await auth();
    if (!session?.user?.id || !(session.user as any).isAdmin)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    await connectDB();
    const ticket = await SupportTicket.findById(id).lean();
    if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ticket });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** PATCH /api/admin/support/[id] — reply, change status/priority, assign */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const session = await auth();
    if (!session?.user?.id || !(session.user as any).isAdmin)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await req.json();
    const { reply, status, priority, assignedTo } = body;

    await connectDB();
    const ticket = await SupportTicket.findById(id);
    if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const adminName = (session.user as any).name || "Admin";

    if (reply?.trim()) {
      ticket.messages.push({ senderRole: "admin", senderName: adminName, content: reply.trim() });
    }
    if (status && ["open", "in_progress", "resolved", "closed"].includes(status)) {
      ticket.status = status;
      if (status === "resolved" || status === "closed") ticket.resolvedAt = new Date();
    }
    if (priority && ["low", "normal", "high", "urgent"].includes(priority)) {
      ticket.priority = priority;
    }
    if (typeof assignedTo === "string") {
      ticket.assignedTo = assignedTo;
    }

    await ticket.save();

    await ActivityLog.create({
      action: "support_ticket_updated",
      description: `Admin ${adminName} updated ticket ${ticket.ticketNumber} — status: ${ticket.status}`,
      userId: ticket.userId,
      userName: ticket.userName,
    });

    return NextResponse.json({ ticket });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
