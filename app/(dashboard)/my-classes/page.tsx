import { prisma } from "@/lib/prisma";
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
  BookOpen,
  Users,
  Calendar,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/server";

export default async function MyClassesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <p>Silakan login untuk melihat kelas</p>;
  }

  // Fetch teacher
  const teacher = await prisma.teacher.findFirst({
    where: { userId: user.id },
    include: {
      classAssignments: {
        include: {
          class: {
            include: {
              academicYear: true,
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
              _count: { select: { students: true } },
            },
          },
        },
      },
    },
  });

  const classAssignments = teacher?.classAssignments || [];

  const levelLabels = {
    KB: "Kelompok Bermain",
    TKA: "TK A",
    TKB: "TK B",
  };

  console.log(classAssignments);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Kelas Saya</h1>
        <p className="text-muted-foreground">
          Kelola kelas yang Anda ajar dan lihat statistik kehadiran
        </p>
      </div>

      {classAssignments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum Ada Kelas</h3>
            <p className="text-muted-foreground text-center mb-4">
              Anda belum ditugaskan ke kelas manapun. Silakan hubungi
              administrator.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {/* Class Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {classAssignments.map((assignment) => {
              const classData = assignment.class;
              const todayAttendances = classData.students.flatMap(
                (student) => student.attendances
              );
              const presentToday = todayAttendances.filter(
                (att) => att.status === "HADIR"
              ).length;

              return (
                <Card
                  key={assignment.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">
                          {classData.name}
                        </CardTitle>
                        <CardDescription>
                          {levelLabels[classData.level]}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">
                        {classData.academicYear.year}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>Siswa</span>
                        </div>
                        <div className="font-semibold">
                          {classData._count.students}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Hadir Hari Ini</span>
                        </div>
                        <div className="font-semibold">
                          {presentToday}/{classData._count.students}
                        </div>
                      </div>
                    </div>

                    {/* Attendance Summary */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Kehadiran Hari Ini</span>
                        <span>
                          {Math.round(
                            (presentToday / classData._count.students) * 100
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-green-500 h-full rounded-full transition-all"
                          style={{
                            width: `${
                              (presentToday / classData._count.students) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Link
                        href={`/attendance/input?classId=${classData.id}`}
                        className="flex-1"
                      >
                        <Button size="sm" className="w-full gap-2">
                          <Calendar className="h-3 w-3" />
                          Absensi
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Kelas</CardTitle>
              <CardDescription>
                Statistik keseluruhan dari semua kelas yang Anda ajar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Kelas
                    </p>
                    <p className="text-2xl font-bold">
                      {classAssignments.length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Users className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Siswa
                    </p>
                    <p className="text-2xl font-bold">
                      {classAssignments.reduce(
                        (total, assignment) =>
                          total + assignment.class._count.students,
                        0
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Calendar className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Hadir Hari Ini
                    </p>
                    <p className="text-2xl font-bold">
                      {classAssignments.reduce((total, assignment) => {
                        const todayAttendances =
                          assignment.class.students.flatMap(
                            (student) => student.attendances
                          );
                        return (
                          total +
                          todayAttendances.filter(
                            (att) => att.status === "HADIR"
                          ).length
                        );
                      }, 0)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <GraduationCap className="h-4 w-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Tahun Akademik
                    </p>
                    <p className="text-2xl font-bold">
                      {classAssignments[0]?.class.academicYear.year || "-"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Aktivitas Terkini</CardTitle>
              <CardDescription>
                Update terbaru dari kelas-kelas Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {classAssignments.slice(0, 3).map((assignment) => {
                  const classData = assignment.class;
                  const todayAttendances = classData.students.flatMap(
                    (student) => student.attendances
                  );
                  const presentCount = todayAttendances.filter(
                    (att) => att.status === "HADIR"
                  ).length;

                  return (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{classData.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {presentCount} dari {classData._count.students}{" "}
                            siswa hadir hari ini
                          </p>
                        </div>
                      </div>
                      <Link href={`/attendance?classId=${classData.id}`}>
                        <Button variant="ghost" size="sm" className="gap-2">
                          Input Absensi
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
