import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/api-auth";

interface ClockInData {
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
        { error: "Hanya guru yang dapat melakukan clock in" },
        { status: 403 }
      );
    }

    const { location } = (await request.json()) as ClockInData;

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

    // Check if already clocked in today
    const existingAttendance = await prisma.teacherAttendance.findUnique({
      where: {
        teacherId_date: {
          teacherId: teacher.id,
          date: today,
        },
      },
    });

    if (existingAttendance) {
      return NextResponse.json(
        { error: "Anda sudah melakukan clock in hari ini" },
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

      // Optional: Add school location validation
      // const isWithinSchool = await validateSchoolLocation(location);
      // if (!isWithinSchool) {
      //   return NextResponse.json(
      //     { error: "Anda harus berada di area sekolah untuk clock in" },
      //     { status: 400 }
      //   );
      // }
    }

    // Create clock in record
    const attendance = await prisma.teacherAttendance.create({
      data: {
        teacherId: teacher.id,
        date: today,
        clockIn: new Date(),
        location: location,
      },
      include: {
        teacher: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Clock in berhasil",
      attendance: {
        id: attendance.id,
        clockIn: attendance.clockIn,
        location: attendance.location,
        teacherName: attendance.teacher.name,
      },
    });
  } catch (error) {
    console.error("Error clocking in:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Optional: School location validation function
async function validateSchoolLocation(userLocation: {
  latitude: number;
  longitude: number;
}) {
  // You can define your school coordinates here
  const schoolLocation = {
    latitude: -6.2088, // Example: Jakarta coordinates
    longitude: 106.8456,
  };

  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    schoolLocation.latitude,
    schoolLocation.longitude
  );

  // Allow within 500 meters radius
  return distance <= 0.5; // 0.5 km = 500 meters
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
