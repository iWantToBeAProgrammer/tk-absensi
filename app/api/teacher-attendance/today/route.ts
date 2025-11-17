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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's attendance
    const attendance = await prisma.teacherAttendance.findUnique({
      where: {
        teacherId_date: {
          teacherId: teacher.id,
          date: today,
        },
      },
      include: {
        teacher: {
          select: {
            name: true,
          },
        },
      },
    });

    let workDuration = null;
    if (attendance?.clockOut) {
      workDuration = calculateWorkDuration(
        attendance.clockIn,
        attendance.clockOut
      );
    }

    return NextResponse.json({
      attendance: attendance
        ? {
            id: attendance.id,
            date: attendance.date,
            clockIn: attendance.clockIn,
            clockOut: attendance.clockOut,
            workDuration,
            location: attendance.location,
            teacherName: attendance.teacher.name,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching today's attendance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function calculateWorkDuration(clockIn: Date, clockOut: Date) {
  const diffMs = clockOut.getTime() - clockIn.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes };
}
