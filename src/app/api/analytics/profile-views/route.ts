import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connection";
import { ProfileView } from "@/lib/db/models";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const now = new Date();
    const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const today = day(now);
    const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 6);
    const monthAgo = new Date(today); monthAgo.setDate(today.getDate() - 29);

    const [total, thisWeek, thisMonth, today30, daily] = await Promise.all([
      ProfileView.countDocuments({ viewedUserId: userId }),
      ProfileView.countDocuments({ viewedUserId: userId, createdAt: { $gte: weekAgo } }),
      ProfileView.countDocuments({ viewedUserId: userId, createdAt: { $gte: monthAgo } }),
      ProfileView.countDocuments({ viewedUserId: userId, createdAt: { $gte: today } }),
      // Daily counts for last 30 days
      ProfileView.aggregate([
        { $match: { viewedUserId: userId, createdAt: { $gte: monthAgo } } },
        {
          $group: {
            _id: {
              y: { $year: "$createdAt" },
              m: { $month: "$createdAt" },
              d: { $dayOfMonth: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.y": 1, "_id.m": 1, "_id.d": 1 } },
      ]),
    ]);

    // Normalize daily into a Map keyed by YYYY-MM-DD
    const dailyMap = new Map<string, number>();
    for (const entry of daily) {
      const key = `${entry._id.y}-${String(entry._id.m).padStart(2, "0")}-${String(entry._id.d).padStart(2, "0")}`;
      dailyMap.set(key, entry.count);
    }

    // Build last-14-day array for sparkline
    const trend: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      trend.push({ date: key, count: dailyMap.get(key) ?? 0 });
    }

    return NextResponse.json({ total, thisWeek, thisMonth, today: today30, trend });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
