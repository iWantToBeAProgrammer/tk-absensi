"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAttendanceRecords(
  classId?: string,
  date?: Date,
  studentId?: string
) {
  try {
    const where: any = {};

    if (classId) where.classId = classId;
    if (studentId) where.studentId = studentId;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        student: true,
        class: true,
        teacher: { select: { name: true } },
      },
      orderBy: { date: "desc" },
    });

    return { success: true, data: attendances };
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    return { success: false, error: "Failed to fetch attendance records" };
  }
}

export async function markAttendance(
  studentId: string,
  classId: string,
  date: Date,
  status: "HADIR" | "SAKIT" | "IZIN" | "ALPA",
  createdBy: string
) {
  try {
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const result = await prisma.attendance.upsert({
      where: {
        date_studentId: {
          date: attendanceDate,
          studentId,
        },
      },
      update: {
        status,
        createdBy,
      },
      create: {
        date: attendanceDate,
        status,
        studentId,
        classId,
        createdBy,
      },
      include: {
        student: true,
        class: true,
      },
    });

    revalidatePath("/dashboard/attendance");
    return { success: true, data: result };
  } catch (error) {
    console.error("Error marking attendance:", error);
    return { success: false, error: "Failed to mark attendance" };
  }
}

export async function getAttendanceSummary(classId?: string, month?: number) {
  try {
    let dateFilter: any = {};

    if (month !== undefined) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), month - 1, 1);
      const endOfMonth = new Date(now.getFullYear(), month, 0);
      dateFilter = {
        gte: startOfMonth,
        lte: endOfMonth,
      };
    }

    const where: any = { date: dateFilter };
    if (classId) where.classId = classId;

    const attendances = await prisma.attendance.groupBy({
      by: ["status"],
      where,
      _count: true,
    });

    // Transform to simple object: { HADIR: count, SAKIT: count, ... }
    const summary: Record<string, number> = {
      HADIR: 0,
      SAKIT: 0,
      IZIN: 0,
      ALPA: 0,
    };

    attendances.forEach((item: any) => {
      summary[item.status] = item._count;
    });

    return { success: true, data: summary };
  } catch (error) {
    console.error("Error fetching attendance summary:", error);
    return { success: false, error: "Failed to fetch attendance summary" };
  }
}

export async function exportAttendanceToExcel(classId: string, month: Date) {
  try {
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const attendances = await prisma.attendance.findMany({
      where: {
        classId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        student: true,
        class: true,
      },
      orderBy: [{ date: "asc" }, { student: { name: "asc" } }],
    });

    return { success: true, data: attendances };
  } catch (error) {
    console.error("Error exporting attendance:", error);
    return { success: false, error: "Failed to export attendance" };
  }
}
