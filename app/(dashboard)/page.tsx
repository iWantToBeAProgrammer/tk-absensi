import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  BookOpen,
  GraduationCap,
  CheckCircle,
  ArrowRight,
  Plus,
  Calendar,
  School,
  Clock,
  MapPin,
  AlertCircle,
  TrendingUp,
  Cake,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/server";
import { TeacherAttendanceButtons } from "@/components/teacher-attendance-buttons";
import { BirthdayNotification } from "@/components/birthday-notification";

async function getTeacherStats(teacherId: string) {
  try {
    const [
      myClasses,
      totalStudents,
      todayAttendance,
      activeYear,
      teacherAttendance,
      weeklySummary,
    ] = await Promise.all([
      // Get teacher's classes
      prisma.teacherClassAssignment.findMany({
        where: { teacherId },
        include: {
          class: {
            include: {
              academicYear: true,
              _count: {
                select: {
                  students: {
                    where: { status: "ACTIVE" },
                  },
                },
              },
              students: {
                where: { status: "ACTIVE" },
                include: {
                  attendances: {
                    where: {
                      date: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        lte: new Date(new Date().setHours(23, 59, 59, 999)),
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),

      // Total students across all classes
      prisma.student.count({
        where: {
          status: "ACTIVE",
          class: {
            teacherAssignments: {
              some: { teacherId },
            },
          },
        },
      }),

      // Today's attendance summary for teacher's classes
      (async () => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const [present, sick, excused, absent] = await Promise.all([
          prisma.attendance.count({
            where: {
              date: { gte: todayStart, lte: todayEnd },
              status: "HADIR",
              student: {
                class: {
                  teacherAssignments: {
                    some: { teacherId },
                  },
                },
              },
            },
          }),
          prisma.attendance.count({
            where: {
              date: { gte: todayStart, lte: todayEnd },
              status: "SAKIT",
              student: {
                class: {
                  teacherAssignments: {
                    some: { teacherId },
                  },
                },
              },
            },
          }),
          prisma.attendance.count({
            where: {
              date: { gte: todayStart, lte: todayEnd },
              status: "IZIN",
              student: {
                class: {
                  teacherAssignments: {
                    some: { teacherId },
                  },
                },
              },
            },
          }),
          prisma.attendance.count({
            where: {
              date: { gte: todayStart, lte: todayEnd },
              status: "ALPA",
              student: {
                class: {
                  teacherAssignments: {
                    some: { teacherId },
                  },
                },
              },
            },
          }),
        ]);

        const total = present + sick + excused + absent;
        const attendanceRate = total > 0 ? (present / total) * 100 : 0;

        return { present, sick, excused, absent, total, attendanceRate };
      })(),

      // Active academic year
      prisma.academicYear.findFirst({ where: { isActive: true } }),

      // Teacher's today attendance
      prisma.teacherAttendance.findFirst({
        where: {
          teacherId,
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),

      // Weekly attendance summary
      (async () => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 6); // Last 7 days

        const weeklyData = await prisma.teacherAttendance.findMany({
          where: {
            teacherId,
            date: {
              gte: startDate,
              lte: new Date(),
            },
          },
          orderBy: {
            date: "desc",
          },
        });

        const presentDays = weeklyData.filter(
          (day) => day.clockOut !== null
        ).length;
        const incompleteDays = weeklyData.filter(
          (day) => day.clockOut === null
        ).length;

        const totalHours = weeklyData.reduce((total, day) => {
          if (day.clockOut) {
            const diffMs = day.clockOut.getTime() - day.clockIn.getTime();
            return total + diffMs / (1000 * 60 * 60);
          }
          return total;
        }, 0);

        return {
          presentDays,
          incompleteDays,
          totalHours,
          totalDays: weeklyData.length,
        };
      })(),
    ]);

    return {
      myClasses,
      totalStudents,
      todayAttendance,
      activeYear,
      teacherAttendance,
      weeklySummary,
    };
  } catch (error) {
    console.error("Error fetching teacher stats:", error);
    return {
      myClasses: [],
      totalStudents: 0,
      todayAttendance: {
        present: 0,
        sick: 0,
        excused: 0,
        absent: 0,
        total: 0,
        attendanceRate: 0,
      },
      activeYear: null,
      teacherAttendance: null,
      weeklySummary: {
        presentDays: 0,
        incompleteDays: 0,
        totalHours: 0,
        totalDays: 0,
      },
    };
  }
}

async function getUpcomingBirthdays(teacherId: string) {
  try {
    // Get all students in teacher's classes
    const students = await prisma.student.findMany({
      where: {
        status: "ACTIVE",
        class: {
          teacherAssignments: {
            some: { teacherId },
          },
        },
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

    // Get all teachers
    const teachers = await prisma.teacher.findMany({
      select: {
        id: true,
        name: true,
        dateOfBirth: true,
      },
    });

    const today = new Date();
    const currentYear = today.getFullYear();

    function isTodayBirthday(dob: string | Date) {
      const date = new Date(dob);
      const today = new Date();

      return (
        date.getUTCDate() === today.getDate() &&
        date.getUTCMonth() === today.getMonth()
      );
    }

    // Calculate days until birthday
    function calculateDaysUntilBirthday(dob: string | Date) {
      const date = new Date(dob);
      const today = new Date();

      const birthMonth = date.getMonth();
      const birthDay = date.getDate();

      let nextBirthday = new Date(today.getFullYear(), birthMonth, birthDay);

      if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
      }

      const diff =
        (nextBirthday.getTime() - today.setHours(0, 0, 0, 0)) /
        (1000 * 60 * 60 * 24);

      return Math.ceil(diff);
    }

    // Combine and sort birthdays
    const allBirthdays = [
      ...students.map((student) => ({
        id: student.id,
        name: student.name,
        dateOfBirth: student.dateOfBirth!,
        type: "student" as const,
        className: student.class.name,
        daysUntil: isTodayBirthday(student.dateOfBirth)
          ? 0
          : calculateDaysUntilBirthday(student.dateOfBirth),
      })),
      ...teachers.map((teacher) => ({
        id: teacher.id,
        name: teacher.name,
        dateOfBirth: teacher.dateOfBirth!,
        type: "teacher" as const,
        className: null,
        daysUntil: isTodayBirthday(teacher.dateOfBirth)
          ? 0
          : calculateDaysUntilBirthday(teacher.dateOfBirth),
      })),
    ]
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 4); // Get nearest 4 birthdays

    return allBirthdays;
  } catch (error) {
    console.error("Error fetching birthdays:", error);
    return [];
  }
}

async function getCurrentTeacher() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const teacher = await prisma.teacher.findFirst({
    where: { userId: user.id },
    select: { id: true, name: true },
  });

  return teacher;
}

export default async function Home() {
  const teacher = await getCurrentTeacher();

  if (!teacher) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Data guru tidak ditemukan</p>
        </div>
      </div>
    );
  }

  const [stats, upcomingBirthdays] = await Promise.all([
    getTeacherStats(teacher.id),
    getUpcomingBirthdays(teacher.id),
  ]);

  const quickActions = [
    {
      title: "Input Absensi Siswa",
      description: "Rekam kehadiran siswa hari ini",
      href: "/attendance",
      icon: CheckCircle,
      variant: "default" as const,
    },
    {
      title: "Kelas Saya",
      description: "Lihat dan kelola kelas yang diajar",
      href: "/my-classes",
      icon: BookOpen,
      variant: "outline" as const,
    },
    {
      title: "Laporan Presensi",
      description: "Lihat laporan kehadiran siswa",
      href: "/attendance/reports",
      icon: Calendar,
      variant: "outline" as const,
    },
    {
      title: "Presensi Saya",
      description: "Lihat riwayat kehadiran saya",
      href: "/teacher-attendance",
      icon: Clock,
      variant: "outline" as const,
    },
  ];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatBirthday = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
    });
  };

  return (
    <div className="space-y-8">
      {/* Birthday Notification */}
      <BirthdayNotification birthdays={upcomingBirthdays} />

      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Selamat Datang, {teacher.name}!
            </h1>
            <p className="text-muted-foreground">
              Ringkasan aktivitas mengajar dan kehadiran
            </p>
          </div>
          <div className="flex items-center gap-2">
            {stats.activeYear && (
              <Badge variant="secondary" className="px-3 py-1">
                <School className="w-3 h-3 mr-1" />
                {stats.activeYear.year}
              </Badge>
            )}
            <Badge variant="default" className="px-3 py-1">
              Guru
            </Badge>
          </div>
        </div>

        {/* Quick Clock In/Out */}
        <TeacherAttendanceButtons
          todayAttendance={stats.teacherAttendance}
          teacherId={teacher.id}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Kelas Saya</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.myClasses.length}</div>
            <p className="text-xs text-muted-foreground">Kelas yang diajar</p>
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full -translate-y-8 translate-x-8" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Siswa di kelas saya</p>
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-full -translate-y-8 translate-x-8" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Kehadiran Hari Ini
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.todayAttendance.present}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.todayAttendance.attendanceRate.toFixed(1)}% hadir
            </p>
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-full -translate-y-8 translate-x-8" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Minggu Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.weeklySummary.presentDays}/5
            </div>
            <p className="text-xs text-muted-foreground">Hari hadir</p>
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full -translate-y-8 translate-x-8" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Akses cepat ke fitur-fitur utama</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {quickActions.map((action) => (
                <Link key={action.title} href={action.href}>
                  <Button
                    variant={action.variant}
                    className="w-full h-auto p-4 flex flex-col items-start gap-2 hover:scale-[0.98] transition-transform border-2"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          action.variant === "default"
                            ? "bg-primary-foreground/20"
                            : "bg-secondary-foreground/10"
                        }`}
                      >
                        <action.icon
                          className={`h-4 w-4 ${
                            action.variant === "default"
                              ? "text-primary-foreground"
                              : "text-foreground"
                          }`}
                        />
                      </div>
                      <span
                        className={`font-semibold text-sm ${
                          action.variant === "default"
                            ? "text-primary-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {action.title}
                      </span>
                    </div>
                    <p
                      className={`text-xs text-left leading-relaxed ${
                        action.variant === "default"
                          ? "text-primary-foreground/90"
                          : "text-muted-foreground"
                      }`}
                    >
                      {action.description}
                    </p>
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Birthdays */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cake className="h-5 w-5 text-pink-500" />
              Birthdays
            </CardTitle>
            <CardDescription>Ulang tahun terdekat</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingBirthdays.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                <Cake className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Tidak ada ulang tahun terdekat</p>
              </div>
            ) : (
              upcomingBirthdays.map((birthday) => (
                <div
                  key={`${birthday.type}-${birthday.id}`}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        birthday.daysUntil === 0 ? "bg-pink-100" : "bg-blue-50"
                      }`}
                    >
                      <Cake
                        className={`h-4 w-4 ${
                          birthday.daysUntil === 0
                            ? "text-pink-600"
                            : "text-blue-600"
                        }`}
                      />
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-medium text-sm">{birthday.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {birthday.type === "student"
                          ? birthday.className
                          : "Guru"}{" "}
                        • {formatBirthday(birthday.dateOfBirth)}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={birthday.daysUntil === 0 ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {birthday.daysUntil === 0
                      ? "Hari ini! 🎉"
                      : `${birthday.daysUntil} hari`}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Classes Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Kelas Saya</CardTitle>
          <CardDescription>Kelas yang Anda ajar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.myClasses.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada kelas yang ditugaskan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.myClasses.slice(0, 3).map((assignment) => {
                const classData = assignment.class;
                const todayPresent = classData.students.filter((student) =>
                  student.attendances.some((att) => att.status === "HADIR")
                ).length;

                return (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="font-medium">{classData.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {classData._count.students} siswa • {todayPresent} hadir
                        hari ini
                      </div>
                    </div>
                    <Link href={`/attendance?classId=${classData.id}`}>
                      <Button size="sm" variant="outline">
                        Absensi
                      </Button>
                    </Link>
                  </div>
                );
              })}

              {stats.myClasses.length > 3 && (
                <Link href="/my-classes">
                  <Button variant="ghost" className="w-full gap-2">
                    Lihat Semua Kelas
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Statistik Kehadiran Siswa</CardTitle>
          <CardDescription>Hari ini di semua kelas Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Attendance Progress */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Tingkat Kehadiran</span>
                  <span className="font-semibold">
                    {stats.todayAttendance.attendanceRate.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={stats.todayAttendance.attendanceRate}
                  className="h-3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <div>
                    <div className="font-semibold">
                      {stats.todayAttendance.present}
                    </div>
                    <div className="text-xs text-muted-foreground">Hadir</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <div>
                    <div className="font-semibold">
                      {stats.todayAttendance.sick}
                    </div>
                    <div className="text-xs text-muted-foreground">Sakit</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <div>
                    <div className="font-semibold">
                      {stats.todayAttendance.excused}
                    </div>
                    <div className="text-xs text-muted-foreground">Izin</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <div>
                    <div className="font-semibold">
                      {stats.todayAttendance.absent}
                    </div>
                    <div className="text-xs text-muted-foreground">Alpa</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Teacher Attendance */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Kehadiran Anda Minggu Ini</span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.weeklySummary.presentDays}
                  </div>
                  <div className="text-xs text-muted-foreground">Hadir</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-amber-600">
                    {stats.weeklySummary.incompleteDays}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Belum Selesai
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.floor(stats.weeklySummary.totalHours)}j
                  </div>
                  <div className="text-xs text-muted-foreground">Total Jam</div>
                </div>
              </div>

              {stats.teacherAttendance && (
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Clock In:</span>
                    <span className="font-medium">
                      {formatTime(stats.teacherAttendance.clockIn)}
                    </span>
                  </div>
                  {stats.teacherAttendance.clockOut ? (
                    <div className="flex justify-between text-sm">
                      <span>Clock Out:</span>
                      <span className="font-medium">
                        {formatTime(stats.teacherAttendance.clockOut)}
                      </span>
                    </div>
                  ) : (
                    <div className="text-sm text-amber-600">
                      ⚠ Belum clock out
                    </div>
                  )}
                </div>
              )}

              <Link href="/teacher-attendance">
                <Button variant="outline" className="w-full gap-2">
                  <Calendar className="h-3 w-3" />
                  Lihat Detail Presensi Saya
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
