// app/api/admin/attendance/analytics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();

    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const months = parseInt(searchParams.get("months") || "3");
    const classId = searchParams.get("classId");

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Build where clause
    const whereClause: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (classId && classId !== "all") {
      whereClause.classId = classId;
    }

    // Fetch all attendance records
    const attendanceRecords = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            class: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    // Calculate previous period for trend comparison
    const prevStartDate = new Date(startDate);
    prevStartDate.setMonth(prevStartDate.getMonth() - months);
    const prevEndDate = new Date(startDate);

    const prevAttendanceRecords = await prisma.attendance.findMany({
      where: {
        ...whereClause,
        date: {
          gte: prevStartDate,
          lt: prevEndDate,
        },
      },
    });

    // Get total students
    const totalStudents = await prisma.student.count({
      where: {
        status: "ACTIVE",
        ...(classId && classId !== "all" ? { classId } : {}),
      },
    });

    // Calculate status distribution
    const statusCounts = attendanceRecords.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalRecords = attendanceRecords.length;
    const statusDistribution = Object.entries(statusCounts).map(
      ([status, count]) => ({
        status,
        count,
        percentage: (count / totalRecords) * 100,
      })
    );

    // Calculate average presence rate
    const hadirCount = statusCounts.HADIR || 0;
    const averagePresenceRate = (hadirCount / totalRecords) * 100 || 0;

    // Calculate previous period presence rate for trend
    const prevHadirCount =
      prevAttendanceRecords.filter((r) => r.status === "HADIR").length || 0;
    const prevTotalRecords = prevAttendanceRecords.length || 1;
    const prevPresenceRate = (prevHadirCount / prevTotalRecords) * 100;
    const presenceRateTrend = averagePresenceRate - prevPresenceRate;

    // Calculate monthly trend
    const monthlyData = new Map<
      string,
      {
        HADIR: number;
        SAKIT: number;
        IZIN: number;
        ALPA: number;
        total: number;
      }
    >();

    attendanceRecords.forEach((record) => {
      const monthKey = new Date(record.date).toLocaleDateString("id-ID", {
        month: "short",
        year: "numeric",
      });

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          HADIR: 0,
          SAKIT: 0,
          IZIN: 0,
          ALPA: 0,
          total: 0,
        });
      }

      const data = monthlyData.get(monthKey)!;
      data[record.status as keyof typeof data]++;
      data.total++;
    });

    const monthlyTrend = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        HADIR: data.HADIR,
        SAKIT: data.SAKIT,
        IZIN: data.IZIN,
        ALPA: data.ALPA,
        presenceRate: (data.HADIR / data.total) * 100,
      }))
      .slice(-12); // Last 12 months

    // Calculate class summary
    const classData = new Map<
      string,
      {
        classId: string;
        className: string;
        level: string;
        totalStudents: number;
        hadirCount: number;
        sakitCount: number;
        izinCount: number;
        alpaCount: number;
        totalRecords: number;
      }
    >();

    attendanceRecords.forEach((record) => {
      const classKey = record.classId;

      if (!classData.has(classKey)) {
        classData.set(classKey, {
          classId: record.classId,
          className: record.student.class.name,
          level: record.student.class.level,
          totalStudents: 0,
          hadirCount: 0,
          sakitCount: 0,
          izinCount: 0,
          alpaCount: 0,
          totalRecords: 0,
        });
      }

      const data = classData.get(classKey)!;
      data.totalRecords++;

      if (record.status === "HADIR") data.hadirCount++;
      else if (record.status === "SAKIT") data.sakitCount++;
      else if (record.status === "IZIN") data.izinCount++;
      else if (record.status === "ALPA") data.alpaCount++;
    });

    // Get student counts per class
    const classes = await prisma.class.findMany({
      where: classId && classId !== "all" ? { id: classId } : {},
      include: {
        _count: {
          select: {
            students: {
              where: { status: "ACTIVE" },
            },
          },
        },
      },
    });

    // Update class data with student counts
    classes.forEach((cls) => {
      if (classData.has(cls.id)) {
        classData.get(cls.id)!.totalStudents = cls._count.students;
      }
    });

    const classSummary = Array.from(classData.values()).map((cls) => ({
      ...cls,
      presenceRate: (cls.hadirCount / cls.totalRecords) * 100 || 0,
    }));

    // Calculate top students
    const studentData = new Map<
      string,
      {
        studentId: string;
        studentName: string;
        className: string;
        hadirCount: number;
        totalRecords: number;
      }
    >();

    attendanceRecords.forEach((record) => {
      const studentKey = record.studentId;

      if (!studentData.has(studentKey)) {
        studentData.set(studentKey, {
          studentId: record.studentId,
          studentName: record.student.name,
          className: record.student.class.name,
          hadirCount: 0,
          totalRecords: 0,
        });
      }

      const data = studentData.get(studentKey)!;
      data.totalRecords++;
      if (record.status === "HADIR") {
        data.hadirCount++;
      }
    });

    const topStudents = Array.from(studentData.values())
      .map((student) => ({
        ...student,
        presenceRate: (student.hadirCount / student.totalRecords) * 100,
        totalPresent: student.hadirCount,
      }))
      .sort((a, b) => b.presenceRate - a.presenceRate)
      .slice(0, 10);

    // Prepare response
    const analyticsData = {
      overview: {
        totalStudents,
        averagePresenceRate,
        totalAttendanceRecords: totalRecords,
        presenceRateTrend,
      },
      statusDistribution,
      monthlyTrend,
      classSummary,
      topStudents,
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
