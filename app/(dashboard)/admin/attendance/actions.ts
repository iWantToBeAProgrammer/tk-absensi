"use server";

import { prisma } from "@/lib/prisma";

// Helper to adjust a date object to Jakarta Start/End of day in UTC
// 00:00 WIB = 17:00 UTC (Previous Day)
// 23:59 WIB = 16:59 UTC (Current Day)
function getJakartaDateFilter(from?: Date, to?: Date) {
  if (!from || !to) return {};

  const start = new Date(from);
  // Set to 00:00:00 UTC, then subtract 7 hours to get 00:00 WIB
  start.setUTCHours(0 - 7, 0, 0, 0);

  const end = new Date(to);
  // Set to 23:59:59 UTC, then subtract 7 hours to get 23:59 WIB
  end.setUTCHours(23 - 7, 59, 59, 999);

  return {
    gte: start,
    lte: end,
  };
}

export async function getAdminAttendanceStats(
  dateFrom?: Date,
  dateTo?: Date,
  classId?: string
) {
  try {
    const dateFilter = getJakartaDateFilter(dateFrom, dateTo);

    const where: any = {};
    if (Object.keys(dateFilter).length > 0) where.date = dateFilter;
    if (classId) where.classId = classId;

    // Student attendance stats
    const studentAttendances = await prisma.attendance.groupBy({
      by: ["status"],
      where,
      _count: true,
    });

    const studentStats: Record<string, number> = {
      HADIR: 0,
      SAKIT: 0,
      IZIN: 0,
      ALPA: 0,
    };

    studentAttendances.forEach((item: any) => {
      studentStats[item.status] = item._count;
    });

    // Teacher attendance stats
    // Teachers might use a different logic if their attendance table structure differs,
    // but applying the same timezone logic is generally safer.
    const teacherDateFilter = getJakartaDateFilter(dateFrom, dateTo);

    const teacherAttendances = await prisma.teacherAttendance.findMany({
      where: {
        date:
          Object.keys(teacherDateFilter).length > 0
            ? teacherDateFilter
            : undefined,
      },
      include: {
        teacher: true,
      },
    });

    const totalTeacherCheckins = teacherAttendances.length;
    const totalTeachers = await prisma.teacher.count();

    return {
      success: true,
      data: {
        student: {
          ...studentStats,
          total: Object.values(studentStats).reduce((a, b) => a + b, 0),
        },
        teacher: {
          checkins: totalTeacherCheckins,
          total: totalTeachers,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching admin attendance stats:", error);
    return {
      success: false,
      error: "Gagal mengambil data statistik absensi",
    };
  }
}

export async function getStudentAttendanceRecords(
  classId?: string,
  dateFrom?: Date,
  dateTo?: Date,
  limit = 50,
  offset = 0
) {
  try {
    const dateFilter = getJakartaDateFilter(dateFrom, dateTo);

    const where: any = {};
    if (Object.keys(dateFilter).length > 0) where.date = dateFilter;
    if (classId) where.classId = classId;

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          student: true,
          class: true,
          teacher: { select: { name: true } },
        },
        orderBy: { date: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.attendance.count({ where }),
    ]);

    return {
      success: true,
      data: {
        records: attendances,
        total,
        limit,
        offset,
      },
    };
  } catch (error) {
    console.error("Error fetching student attendance records:", error);
    return {
      success: false,
      error: "Gagal mengambil catatan absensi siswa",
    };
  }
}

export async function getTeacherAttendanceRecords(
  dateFrom?: Date,
  dateTo?: Date,
  limit = 50,
  offset = 0
) {
  try {
    const dateFilter = getJakartaDateFilter(dateFrom, dateTo);

    const where: any = {};
    if (Object.keys(dateFilter).length > 0) where.date = dateFilter;

    const [attendances, total] = await Promise.all([
      prisma.teacherAttendance.findMany({
        where,
        include: {
          teacher: true,
        },
        orderBy: { date: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.teacherAttendance.count({ where }),
    ]);

    return {
      success: true,
      data: {
        records: attendances,
        total,
        limit,
        offset,
      },
    };
  } catch (error) {
    console.error("Error fetching teacher attendance records:", error);
    return {
      success: false,
      error: "Gagal mengambil catatan absensi guru",
    };
  }
}

export async function getAllClasses() {
  try {
    const classes = await prisma.class.findMany({
      include: {
        _count: {
          select: {
            students: {
              where: { status: "ACTIVE" },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return {
      success: true,
      data: classes,
    };
  } catch (error) {
    console.error("Error fetching classes:", error);
    return {
      success: false,
      error: "Gagal mengambil daftar kelas",
    };
  }
}

export async function getUpcomingBirthdays() {
  try {
    const students = await prisma.student.findMany({
      where: {
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        dateOfBirth: true,
        class: {
          select: {
            name: true,
          },
        },
      },
    });

    const teachers = await prisma.teacher.findMany({
      select: {
        id: true,
        name: true,
        dateOfBirth: true,
      },
    });

    // FIX: Get current time in Jakarta
    const now = new Date();
    // Convert UTC 'now' to a string representing Jakarta time
    const jakartaTimeStr = now.toLocaleString("en-US", {
      timeZone: "Asia/Jakarta",
    });
    // Create a new Date object where the internal time matches Jakarta wall-clock time
    // This allows us to use .getFullYear(), .getMonth() etc directly
    const todayJakarta = new Date(jakartaTimeStr);

    const currentYear = todayJakarta.getFullYear();

    const calculateDaysUntilBirthday = (dob: Date) => {
      // dob is stored as UTC in DB, typically with 00:00 time
      const birthday = new Date(dob);

      const nextBirthday = new Date(
        currentYear,
        birthday.getMonth(),
        birthday.getDate()
      );

      // If birthday has passed this year (in Jakarta time), check next year
      if (nextBirthday < todayJakarta) {
        nextBirthday.setFullYear(currentYear + 1);
      }

      const diffTime = nextBirthday.getTime() - todayJakarta.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays;
    };

    const allBirthdays = [
      ...students.map((student) => ({
        id: student.id,
        name: student.name,
        dateOfBirth: student.dateOfBirth!,
        type: "student" as const,
        className: student.class.name,
        daysUntil: calculateDaysUntilBirthday(student.dateOfBirth!),
      })),
      ...teachers.map((teacher) => ({
        id: teacher.id,
        name: teacher.name,
        dateOfBirth: teacher.dateOfBirth!,
        type: "teacher" as const,
        className: null,
        daysUntil: calculateDaysUntilBirthday(teacher.dateOfBirth!),
      })),
    ]
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 4);

    return {
      success: true,
      data: allBirthdays,
    };
  } catch (error) {
    console.error("Error fetching birthdays:", error);
    return {
      success: false,
      error: "Failed to fetch birthdays",
      data: [],
    };
  }
}
