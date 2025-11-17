import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateUser();

    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Check if user is a teacher
    if (auth.user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Hanya guru yang dapat mengakses data ini" },
        { status: 403 }
      );
    }

    // Get teacher record
    const teacher = await prisma.teacher.findFirst({
      where: { userId: auth.user.id },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Data guru tidak ditemukan" },
        { status: 404 }
      );
    }

    // Get dates for the last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6); // 7 days including today

    // Get attendance for the last 7 days
    const attendance = await prisma.teacherAttendance.findMany({
      where: {
        teacherId: teacher.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    // Generate data for all 7 days
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dayAttendance = attendance.find(
        (a) => a.date.toDateString() === date.toDateString()
      );

      let status: "present" | "absent" | "incomplete" = "absent";
      let workDuration = null;

      if (dayAttendance) {
        if (dayAttendance.clockOut) {
          status = "present";
          const diffMs =
            dayAttendance.clockOut.getTime() - dayAttendance.clockIn.getTime();
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          workDuration = { hours, minutes };
        } else {
          status = "incomplete";
        }
      }

      weeklyData.push({
        date: date.toISOString(),
        clockIn: dayAttendance?.clockIn.toISOString() || null,
        clockOut: dayAttendance?.clockOut?.toISOString() || null,
        workDuration,
        status,
      });
    }

    return NextResponse.json({ attendance: weeklyData });
  } catch (error) {
    console.error("Error fetching weekly attendance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
