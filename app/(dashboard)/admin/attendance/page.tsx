"use client";

import { useState, useEffect } from "react";
import {
  getAdminAttendanceStats,
  getStudentAttendanceRecords,
  getTeacherAttendanceRecords,
  getAllClasses,
} from "./actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  GraduationCap,
  CheckCircle,
  AlertCircle,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { id as dateLocaleId } from "date-fns/locale";

const attendanceColors = {
  HADIR: "bg-green-100 text-green-800",
  SAKIT: "bg-yellow-100 text-yellow-800",
  IZIN: "bg-blue-100 text-blue-800",
  ALPA: "bg-red-100 text-red-800",
};

const attendanceLabels = {
  HADIR: "Hadir",
  SAKIT: "Sakit",
  IZIN: "Izin",
  ALPA: "Alpa",
};

interface AttendanceStats {
  student: {
    HADIR: number;
    SAKIT: number;
    IZIN: number;
    ALPA: number;
    total: number;
  };
  teacher: {
    checkins: number;
    total: number;
  };
}

interface StudentAttendance {
  id: string;
  date: Date;
  status: string;
  student: {
    id: string;
    name: string;
  };
  class: {
    id: string;
    name: string;
  };
  teacher: { name: string | null } | null;
}

interface TeacherAttendance {
  id: string;
  date: Date;
  clockIn: Date;
  clockOut: Date | null;
  teacher: {
    id: string;
    name: string;
  };
}

export default function AdminAttendancePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [classes, setClasses] = useState<any[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [studentRecords, setStudentRecords] = useState<StudentAttendance[]>([]);
  const [teacherRecords, setTeacherRecords] = useState<TeacherAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);

  const pageSize = 20;

  // Initialize date range (last 7 days)
  useEffect(() => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    setDateFrom(format(sevenDaysAgo, "yyyy-MM-dd"));
    setDateTo(format(today, "yyyy-MM-dd"));

    // Load classes
    loadClasses();
  }, []);

  // Load data when filters change
  useEffect(() => {
    loadStats();
    loadRecords();
  }, [dateFrom, dateTo, selectedClass, activeTab]);

  async function loadClasses() {
    try {
      const result = await getAllClasses();
      if (result.success) {
        setClasses(result.data || []);
      }
    } catch (error) {
      console.error("Error loading classes:", error);
    }
  }

  async function loadStats() {
    if (!dateFrom || !dateTo) return;

    setStatsLoading(true);
    try {
      const result = await getAdminAttendanceStats(
        new Date(dateFrom),
        new Date(dateTo),
        selectedClass !== "all" ? selectedClass : undefined
      );

      if (result.success) {
        setStats(result.data as AttendanceStats);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }

  async function loadRecords() {
    if (!dateFrom || !dateTo) return;

    setLoading(true);
    try {
      if (activeTab === "students") {
        const result = await getStudentAttendanceRecords(
          selectedClass !== "all" ? selectedClass : undefined,
          new Date(dateFrom),
          new Date(dateTo),
          pageSize,
          page * pageSize
        );

        if (result.success && result.data) {
          setStudentRecords(result.data.records);
          setTotalRecords(result.data.total);
        }
      } else if (activeTab === "teachers") {
        const result = await getTeacherAttendanceRecords(
          new Date(dateFrom),
          new Date(dateTo),
          pageSize,
          page * pageSize
        );

        if (result.success && result.data) {
          setTeacherRecords(result.data.records);
          setTotalRecords(result.data.total);
        }
      }
    } catch (error) {
      console.error("Error loading records:", error);
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.ceil(totalRecords / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kelola Absensi</h1>
          <p className="text-muted-foreground">
            Pantau dan kelola data absensi siswa dan guru
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Dari Tanggal</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(0);
                }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sampai Tanggal</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(0);
                }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Kelas</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name} ({classItem._count.students} siswa)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {statsLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : stats ? (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Total Absensi
                  </p>
                  <p className="text-2xl font-bold">{stats.student.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Hadir
                  </p>
                  <p className="text-2xl font-bold">{stats.student.HADIR}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-yellow-100 p-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Sakit/Izin
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.student.SAKIT + stats.student.IZIN}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-100 p-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Alpa
                  </p>
                  <p className="text-2xl font-bold">{stats.student.ALPA}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2">
                  <GraduationCap className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Guru Masuk
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.teacher.checkins}/{stats.teacher.total}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Data Records */}
      <Card>
        <CardHeader>
          <CardTitle>Data Absensi</CardTitle>
          <CardDescription>
            Kelola dan lihat detail absensi siswa dan guru
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tab Navigation */}
          <div className="flex gap-2 border-b">
            <Button
              variant={activeTab === "overview" ? "default" : "ghost"}
              onClick={() => setActiveTab("overview")}
              className="rounded-b-none"
            >
              Ringkasan
            </Button>
            <Button
              variant={activeTab === "students" ? "default" : "ghost"}
              onClick={() => setActiveTab("students")}
              className="rounded-b-none"
            >
              Absensi Siswa
            </Button>
            <Button
              variant={activeTab === "teachers" ? "default" : "ghost"}
              onClick={() => setActiveTab("teachers")}
              className="rounded-b-none"
            >
              Absensi Guru
            </Button>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-4 pt-4">
              {statsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : stats ? (
                <>
                  <div>
                    <h3 className="font-semibold mb-3">Absensi Siswa</h3>
                    <div className="grid gap-3 sm:grid-cols-4">
                      {Object.entries(attendanceLabels).map(([key, label]) => (
                        <div
                          key={key}
                          className={`rounded-lg p-3 text-center ${
                            attendanceColors[
                              key as keyof typeof attendanceColors
                            ]
                          }`}
                        >
                          <p className="font-semibold">
                            {stats.student[key as keyof typeof stats.student]}
                          </p>
                          <p className="text-sm">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-3">Absensi Guru</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg bg-green-50 p-4">
                        <p className="text-sm text-green-600 font-medium">
                          Guru Masuk
                        </p>
                        <p className="text-3xl font-bold text-green-900">
                          {stats.teacher.checkins}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          dari {stats.teacher.total} guru
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-4">
                        <p className="text-sm text-slate-600 font-medium">
                          Presentase Kehadiran
                        </p>
                        <p className="text-3xl font-bold text-slate-900">
                          {stats.teacher.total > 0
                            ? Math.round(
                                (stats.teacher.checkins / stats.teacher.total) *
                                  100
                              )
                            : 0}
                          %
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* Student Records Tab */}
          {activeTab === "students" && (
            <div className="space-y-4 pt-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : studentRecords.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Belum ada data absensi siswa
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">
                            Tanggal
                          </th>
                          <th className="text-left py-3 px-4 font-semibold">
                            Nama Siswa
                          </th>
                          <th className="text-left py-3 px-4 font-semibold">
                            Kelas
                          </th>
                          <th className="text-left py-3 px-4 font-semibold">
                            Status
                          </th>
                          <th className="text-left py-3 px-4 font-semibold">
                            Dicatat oleh
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentRecords.map((record) => (
                          <tr
                            key={record.id}
                            className="border-b hover:bg-slate-50 transition"
                          >
                            <td className="py-3 px-4">
                              {format(new Date(record.date), "dd MMM yyyy", {
                                locale: dateLocaleId,
                              })}
                            </td>
                            <td className="py-3 px-4">{record.student.name}</td>
                            <td className="py-3 px-4">{record.class.name}</td>
                            <td className="py-3 px-4">
                              <Badge
                                className={
                                  attendanceColors[
                                    record.status as keyof typeof attendanceColors
                                  ]
                                }
                              >
                                {
                                  attendanceLabels[
                                    record.status as keyof typeof attendanceLabels
                                  ]
                                }
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              {record.teacher?.name ??
                                "Data guru tidak ditemukan"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Menampilkan {page * pageSize + 1} hingga{" "}
                      {Math.min((page + 1) * pageSize, totalRecords)} dari{" "}
                      {totalRecords} data
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPage(Math.min(totalPages - 1, page + 1))
                        }
                        disabled={page >= totalPages - 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Teacher Records Tab */}
          {activeTab === "teachers" && (
            <div className="space-y-4 pt-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : teacherRecords.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Belum ada data absensi guru
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">
                            Tanggal
                          </th>
                          <th className="text-left py-3 px-4 font-semibold">
                            Nama Guru
                          </th>
                          <th className="text-left py-3 px-4 font-semibold">
                            Jam Masuk
                          </th>
                          <th className="text-left py-3 px-4 font-semibold">
                            Jam Keluar
                          </th>
                          <th className="text-left py-3 px-4 font-semibold">
                            Durasi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {teacherRecords.map((record) => {
                          const duration = record.clockOut
                            ? Math.round(
                                (new Date(record.clockOut).getTime() -
                                  new Date(record.clockIn).getTime()) /
                                  (1000 * 60)
                              )
                            : null;

                          return (
                            <tr
                              key={record.id}
                              className="border-b hover:bg-slate-50 transition"
                            >
                              <td className="py-3 px-4">
                                {format(new Date(record.date), "dd MMM yyyy", {
                                  locale: dateLocaleId,
                                })}
                              </td>
                              <td className="py-3 px-4">
                                {record.teacher.name}
                              </td>
                              <td className="py-3 px-4">
                                {format(new Date(record.clockIn), "HH:mm:ss")}
                              </td>
                              <td className="py-3 px-4">
                                {record.clockOut
                                  ? format(
                                      new Date(record.clockOut),
                                      "HH:mm:ss"
                                    )
                                  : "-"}
                              </td>
                              <td className="py-3 px-4">
                                {duration ? `${duration} menit` : "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Menampilkan {page * pageSize + 1} hingga{" "}
                      {Math.min((page + 1) * pageSize, totalRecords)} dari{" "}
                      {totalRecords} data
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPage(Math.min(totalPages - 1, page + 1))
                        }
                        disabled={page >= totalPages - 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
