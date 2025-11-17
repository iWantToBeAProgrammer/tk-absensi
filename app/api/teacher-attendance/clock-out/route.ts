import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/api-auth";

interface ClockOutData {
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateUser();

    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Check if user is a teacher
    if (auth.user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Hanya guru yang dapat melakukan clock out" },
        { status: 403 }
      );
    }

    const { location } = (await request.json()) as ClockOutData;

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

    // Check if there's a clock in record for today
    const attendance = await prisma.teacherAttendance.findUnique({
      where: {
        teacherId_date: {
          teacherId: teacher.id,
          date: today,
        },
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { error: "Anda belum melakukan clock in hari ini" },
        { status: 400 }
      );
    }

    if (attendance.clockOut) {
      return NextResponse.json(
        { error: "Anda sudah melakukan clock out hari ini" },
        { status: 400 }
      );
    }

    // Validate location if provided
    if (location) {
      if (
        typeof location.latitude !== "number" ||
        typeof location.longitude !== "number"
      ) {
        return NextResponse.json(
          { error: "Format lokasi tidak valid" },
          { status: 400 }
        );
      }
    }

    // Update with clock out
    const updatedAttendance = await prisma.teacherAttendance.update({
      where: { id: attendance.id },
      data: {
        clockOut: new Date(),
        location: location || attendance.location!,
      },
      include: {
        teacher: {
          select: {
            name: true,
          },
        },
      },
    });

    // Calculate work duration
    const workDuration = calculateWorkDuration(
      updatedAttendance.clockIn,
      updatedAttendance.clockOut!
    );

    return NextResponse.json({
      message: "Clock out berhasil",
      attendance: {
        id: updatedAttendance.id,
        clockIn: updatedAttendance.clockIn,
        clockOut: updatedAttendance.clockOut,
        workDuration,
        location: updatedAttendance.location,
        teacherName: updatedAttendance.teacher.name,
      },
    });
  } catch (error) {
    console.error("Error clocking out:", error);
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
