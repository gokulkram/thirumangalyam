import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { LoginEvent, User } from "@/lib/db/models";
import { parseDevice } from "@/lib/security/login-alert";

/** GET — return the 20 most recent login events for the current user */
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const events = await LoginEvent.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const normalized = (events as any[]).map((e) => ({
      id: e._id.toString(),
      ip: e.ip,
      device: parseDevice(e.userAgent || ""),
      loginMethod: e.loginMethod,
      isNewDevice: e.isNewDevice,
      createdAt: e.createdAt,
    }));

    return NextResponse.json({ sessions: normalized });
  } catch (error: any) {
    console.error("GET /api/security/sessions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** DELETE — increment sessionVersion to invalidate all existing JWT tokens */
export async function DELETE(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    await User.findByIdAndUpdate(session.user.id, {
      $inc: { sessionVersion: 1 },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("DELETE /api/security/sessions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
