"use server";

import { prisma } from "@/lib/prisma";

export async function getAdminAttendanceStats(
  dateFrom?: Date,
  dateTo?: Date,
  classId?: string
) {
  try {
    let dateFilter: any = {};

    if (dateFrom && dateTo) {
      const start = new Date(dateFrom);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);

      dateFilter = {
        gte: start,
        lte: end,
      };
    }

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
    let teacherDateFilter: any = {};
    if (dateFrom && dateTo) {
      const start = new Date(dateFrom);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);

      teacherDateFilter = {
        gte: start,
        lte: end,
      };
    }

    const teacherAttendances = await prisma.teacherAttendance.findMany({
      where: {
        date: teacherDateFilter,
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
    let dateFilter: any = {};

    if (dateFrom && dateTo) {
      const start = new Date(dateFrom);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);

      dateFilter = {
        gte: start,
        lte: end,
      };
    }

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
    let dateFilter: any = {};

    if (dateFrom && dateTo) {
      const start = new Date(dateFrom);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);

      dateFilter = {
        gte: start,
        lte: end,
      };
    }

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
    // Get all students with birthdays
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

    // Get all teachers with birthdays
    const teachers = await prisma.teacher.findMany({
      select: {
        id: true,
        name: true,
        dateOfBirth: true,
      },
    });

    const today = new Date();
    const currentYear = today.getFullYear();

    // Calculate days until birthday
    const calculateDaysUntilBirthday = (dob: Date) => {
      const birthday = new Date(dob);
      const nextBirthday = new Date(
        currentYear,
        birthday.getMonth(),
        birthday.getDate()
      );

      // If birthday has passed this year, check next year
      if (nextBirthday < today) {
        nextBirthday.setFullYear(currentYear + 1);
      }

      const diffTime = nextBirthday.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays;
    };

    // Combine and sort birthdays
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
      .slice(0, 4); // Get nearest 4 birthdays

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
