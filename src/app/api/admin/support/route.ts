import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { SupportTicket } from "@/lib/db/models";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !(session.user as any).isAdmin)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const priority = searchParams.get("priority") || "";
    const isPremium = searchParams.get("isPremium") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));

    const filter: any = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (isPremium === "true") filter.isPremium = true;
    if (isPremium === "false") filter.isPremium = false;

    const [total, tickets] = await Promise.all([
      SupportTicket.countDocuments(filter),
      SupportTicket.find(filter)
        .sort({ isPremium: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("-messages")
        .lean(),
    ]);

    const openCount = await SupportTicket.countDocuments({ status: "open" });

    return NextResponse.json({ tickets, total, openCount, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
