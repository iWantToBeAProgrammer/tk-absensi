import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Get Active Year
    const activeYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    });

    // 2. Calculate Today's Attendance
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [present, sick, excused, absent] = await Promise.all([
      prisma.attendance.count({
        where: { date: { gte: todayStart, lte: todayEnd }, status: "HADIR" },
      }),
      prisma.attendance.count({
        where: { date: { gte: todayStart, lte: todayEnd }, status: "SAKIT" },
      }),
      prisma.attendance.count({
        where: { date: { gte: todayStart, lte: todayEnd }, status: "IZIN" },
      }),
      prisma.attendance.count({
        where: { date: { gte: todayStart, lte: todayEnd }, status: "ALPA" },
      }),
    ]);

    const total = present + sick + excused + absent;
    const attendanceRate = total > 0 ? (present / total) * 100 : 0;

    const todayAttendance = {
      present,
      sick,
      excused,
      absent,
      total,
      attendanceRate,
    };

    // 3. Weekly Trend
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const dailyAttendanceRaw = await prisma.attendance.groupBy({
      by: ["date"],
      where: {
        date: { gte: oneWeekAgo },
        status: "HADIR",
      },
      _count: true,
    });

    const attendanceTrend = dailyAttendanceRaw
      .map((item) => ({
        date: item.date,
        _count: item._count,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({
      activeYear,
      todayAttendance,
      attendanceTrend,
    });
  } catch (error) {
    console.error("Error fetching attendance stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
