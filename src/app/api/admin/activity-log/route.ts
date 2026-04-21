import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { ActivityLog } from "@/lib/db/models";

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * GET /api/admin/activity-log
 *
 * Query params:
 *   page     - Page number (default: 1)
 *   limit    - Items per page (default: 20, max: 100)
 *   action   - Filter by action type (e.g. "user_registered", "user_login")
 *   userId   - Filter by user ID
 *   from     - Filter from date (ISO string)
 *   to       - Filter to date (ISO string)
 *   search   - Search in description or userName
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.id || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const action = searchParams.get("action");
    const userId = searchParams.get("userId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const search = searchParams.get("search");

    // Build query filter
    const filter: Record<string, any> = {};

    if (action) {
      filter.action = action;
    }

    if (userId) {
      filter.userId = userId;
    }

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    if (search) {
      const escapedSearch = escapeRegex(search);
      filter.$or = [
        { description: { $regex: escapedSearch, $options: "i" } },
        { userName: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    // Fetch data and count in parallel
    const [total, logs] = await Promise.all([
      ActivityLog.countDocuments(filter),
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const entries = logs.map((entry: any) => ({
      id: entry._id.toString(),
      action: entry.action || "",
      description: entry.description || "",
      timestamp: entry.createdAt?.toISOString?.() || new Date().toISOString(),
      userId: entry.userId?.toString() || null,
      userName: entry.userName || "",
    }));

    // Get distinct action types for filtering UI
    const actionTypes = await ActivityLog.distinct("action");

    return NextResponse.json({
      entries,
      actionTypes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/activity-log error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
