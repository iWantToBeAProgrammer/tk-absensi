"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  BookOpen,
  GraduationCap,
  CheckCircle,
  School,
  UserPlus,
  BarChart3,
  Loader2,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useStudents } from "@/hooks/use-students";
import { useTeachers } from "@/hooks/use-teachers";
import { useClasses } from "@/hooks/use-classes";
import { useAttendanceStats } from "@/hooks/use-attendance-stats";

export default function AdminDashboardPage() {
  // 1. Fetch data from all hooks
  const { data: students, isLoading: studentsLoading } = useStudents();
  const { data: teachers, isLoading: teachersLoading } = useTeachers();
  const { data: classes, isLoading: classesLoading } = useClasses();
  const { stats: attendanceStats, loading: statsLoading } =
    useAttendanceStats();

  const isLoading =
    studentsLoading || teachersLoading || classesLoading || statsLoading;

  // 2. Client-side Calculations

  // Calculate Active Students
  const activeStudents = students?.filter((s) => s.status === "ACTIVE") || [];

  // Recent Students (Sort by createdAt descending)
  // Ensure your student object has 'createdAt' and 'class' relation loaded
  const recentStudents = activeStudents
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  // Class Distribution (Count active students per class)
  const classDistribution =
    classes?.map((cls) => {
      const studentCount = activeStudents.filter(
        (s) => s.classId === cls.id
      ).length;
      return {
        ...cls,
        studentCount,
      };
    }) || [];

  const quickActions = [
    {
      title: "Kelola Siswa",
      description: "Tambah atau edit data siswa",
      href: "/admin/students",
      icon: Users,
      variant: "default" as const,
    },
    {
      title: "Kelola Guru",
      description: "Kelola data pengajar",
      href: "/admin/teachers",
      icon: GraduationCap,
      variant: "outline" as const,
    },
    {
      title: "Kelola Kelas",
      description: "Atur kelas dan penempatan",
      href: "/admin/classes",
      icon: BookOpen,
      variant: "outline" as const,
    },
    {
      title: "Tahun Akademik",
      description: "Kelola tahun akademik",
      href: "/admin/academic-years",
      icon: School,
      variant: "outline" as const,
    },
  ];

  const levelLabels: Record<string, string> = {
    KB: "KB",
    TKA: "TK A",
    TKB: "TK B",
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Overview lengkap sistem manajemen sekolah
            </p>
          </div>
          <div className="flex items-center gap-2">
            {attendanceStats?.activeYear && (
              <Badge variant="secondary" className="px-3 py-1">
                <School className="w-3 h-3 mr-1" />
                Tahun Aktif: {attendanceStats.activeYear.year}
              </Badge>
            )}
            <Badge variant="default" className="px-3 py-1">
              Admin Mode
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeStudents.length}</div>
            <p className="text-xs text-muted-foreground">Siswa aktif</p>
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full -translate-y-8 translate-x-8" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Guru</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Guru terdaftar</p>
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-full -translate-y-8 translate-x-8" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Kelas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Kelas aktif</p>
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full -translate-y-8 translate-x-8" />
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
              {attendanceStats?.todayAttendance.present || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {attendanceStats?.todayAttendance.attendanceRate.toFixed(1)}% dari{" "}
              {attendanceStats?.todayAttendance.total || 0}
            </p>
            <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/10 rounded-full -translate-y-8 translate-x-8" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Akses cepat ke fitur manajemen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {quickActions.map((action) => (
                <Link key={action.title} href={action.href}>
                  <Button
                    variant={action.variant}
                    className="w-full h-auto p-4 flex flex-col items-start gap-2 hover:scale-[0.98] transition-transform"
                  >
                    <div className="flex items-center gap-2">
                      <action.icon className="h-4 w-4" />
                      <span className="font-semibold text-sm">
                        {action.title}
                      </span>
                    </div>
                    <p className="text-xs text-left text-muted-foreground leading-relaxed">
                      {action.description}
                    </p>
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Attendance Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Statistik Kehadiran</CardTitle>
            <CardDescription>Hari ini</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Tingkat Kehadiran</span>
                <span className="font-semibold">
                  {attendanceStats?.todayAttendance.attendanceRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div
                  className="bg-green-500 h-full rounded-full transition-all"
                  style={{
                    width: `${
                      attendanceStats?.todayAttendance.attendanceRate || 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <div>
                  <div className="font-semibold">
                    {attendanceStats?.todayAttendance.present || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Hadir</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <div>
                  <div className="font-semibold">
                    {attendanceStats?.todayAttendance.sick || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Sakit</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <div>
                  <div className="font-semibold">
                    {attendanceStats?.todayAttendance.excused || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Izin</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <div>
                  <div className="font-semibold">
                    {attendanceStats?.todayAttendance.absent || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Alpa</div>
                </div>
              </div>
            </div>

            <Link href="/attendance/reports">
              <Button variant="ghost" className="w-full gap-2">
                <BarChart3 className="h-3 w-3" />
                Lihat Laporan Lengkap
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Class Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Kelas</CardTitle>
            <CardDescription>Jumlah siswa per kelas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {classDistribution.length > 0 ? (
                classDistribution.map((classItem: any) => (
                  <div
                    key={classItem.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{classItem.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {levelLabels[classItem.level] || classItem.level} •{" "}
                          {attendanceStats?.activeYear?.year || "-"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {classItem.studentCount} Siswa
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">
                  Tidak ada data kelas
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Students */}
        <Card>
          <CardHeader>
            <CardTitle>Siswa Baru</CardTitle>
            <CardDescription>5 siswa terbaru yang terdaftar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentStudents.length > 0 ? (
                recentStudents.map((student: any) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <UserPlus className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {student.class?.name || "Belum ada kelas"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="default">
                      {student.gender === "MALE" ? "L" : "P"}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">
                  Tidak ada siswa baru
                </p>
              )}
            </div>
            <Link href="/admin/students" className="mt-4 block">
              <Button variant="ghost" className="w-full gap-2">
                <Users className="h-3 w-3" />
                Lihat Semua Siswa
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Overview Sistem</CardTitle>
          <CardDescription>Informasi dan status sistem</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">
                Status Sistem
              </div>
              <Badge
                variant="default"
                className="bg-green-100 text-green-800 hover:bg-green-100"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Aktif
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">
                Tahun Akademik
              </div>
              <div className="font-semibold">
                {attendanceStats?.activeYear?.year || "Belum diatur"}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">
                Total Data
              </div>
              <div className="font-semibold">
                {(students?.length || 0) + (teachers?.length || 0)} Entri
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">
                Versi
              </div>
              <div className="font-semibold">1.0.0</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
