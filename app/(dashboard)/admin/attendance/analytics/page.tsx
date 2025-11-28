"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Award,
  AlertCircle,
  BarChart3,
  PieChart,
  Filter,
  RefreshCcw,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = {
  HADIR: "#10b981", // emerald-500
  SAKIT: "#3b82f6", // blue-500
  IZIN: "#f59e0b", // amber-500
  ALPA: "#ef4444", // red-500
};

interface AnalyticsData {
  overview: {
    totalStudents: number;
    averagePresenceRate: number;
    totalAttendanceRecords: number;
    presenceRateTrend: number;
  };
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    HADIR: number;
    SAKIT: number;
    IZIN: number;
    ALPA: number;
    presenceRate: number;
  }>;
  classSummary: Array<{
    classId: string;
    className: string;
    level: string;
    totalStudents: number;
    presenceRate: number;
    hadirCount: number;
    sakitCount: number;
    izinCount: number;
    alpaCount: number;
  }>;
  topStudents: Array<{
    studentId: string;
    studentName: string;
    className: string;
    presenceRate: number;
    totalPresent: number;
    totalRecords: number;
  }>;
}

export default function AttendanceAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("3");
  const [selectedClass, setSelectedClass] = useState("all");

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod, selectedClass]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        months: selectedPeriod,
        ...(selectedClass !== "all" && { classId: selectedClass }),
      });

      const response = await fetch(`/api/admin/attendance/analytics?${params}`);

      if (!response.ok) {
        throw new Error("Gagal memuat data analitik");
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      HADIR: "Hadir",
      SAKIT: "Sakit",
      IZIN: "Izin",
      ALPA: "Alpa",
    };
    return labels[status] || status;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Loading Skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[350px] rounded-xl" />
          <Skeleton className="h-[350px] rounded-xl" />
        </div>
        <Skeleton className="h-[200px] rounded-xl" />
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <div className="bg-red-50 p-4 rounded-full">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-red-900">
          Gagal Memuat Data
        </h3>
        <p className="text-red-600">{error}</p>
        <Button onClick={fetchAnalytics} variant="outline" className="gap-2">
          <RefreshCcw className="h-4 w-4" /> Coba Lagi
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Analitik Kehadiran
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualisasi data dan insight kehadiran siswa periode{" "}
            {selectedPeriod} bulan terakhir
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 bg-muted/30 p-1.5 rounded-lg border">
          <div className="flex items-center gap-2 px-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Filter:
            </span>
          </div>

          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full sm:w-[160px] h-8 bg-background">
              <SelectValue placeholder="Pilih Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Bulan Terakhir</SelectItem>
              <SelectItem value="3">3 Bulan Terakhir</SelectItem>
              <SelectItem value="6">6 Bulan Terakhir</SelectItem>
              <SelectItem value="12">1 Tahun Terakhir</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-full sm:w-[180px] h-8 bg-background">
              <SelectValue placeholder="Pilih Kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelas</SelectItem>
              {data.classSummary.map((cls) => (
                <SelectItem key={cls.classId} value={cls.classId}>
                  {cls.className}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tingkat Kehadiran
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatPercentage(data.overview.averagePresenceRate)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {data.overview.presenceRateTrend >= 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                  <span className="text-xs text-emerald-600 font-medium">
                    +{formatPercentage(data.overview.presenceRateTrend)}
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-rose-600" />
                  <span className="text-xs text-rose-600 font-medium">
                    {formatPercentage(data.overview.presenceRateTrend)}
                  </span>
                </>
              )}
              <span className="text-xs text-muted-foreground ml-1">
                vs periode lalu
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Siswa
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {data.overview.totalStudents}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Siswa aktif terdaftar saat ini
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Rekaman
            </CardTitle>
            <Calendar className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {data.overview.totalAttendanceRecords.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total data presensi tercatat
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tingkat Alpha
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatPercentage(
                data.statusDistribution.find((s) => s.status === "ALPA")
                  ?.percentage || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ketidakhadiran tanpa keterangan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Monthly Trend (Takes up 4 columns) */}
        <Card className="lg:col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Tren Kehadiran
            </CardTitle>
            <CardDescription>
              Grafik pergerakan tingkat kehadiran siswa per bulan
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.monthlyTrend}
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value: number) => [
                      formatPercentage(value),
                      "Tingkat Kehadiran",
                    ]}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <Line
                    type="monotone"
                    dataKey="presenceRate"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: "#10b981",
                      strokeWidth: 2,
                      stroke: "#fff",
                    }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="Kehadiran (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution (Takes up 3 columns) */}
        <Card className="lg:col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieChart className="h-5 w-5 text-primary" />
              Distribusi Status
            </CardTitle>
            <CardDescription>
              Proporsi kehadiran berdasarkan status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={data.statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {data.statusDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[entry.status as keyof typeof COLORS]}
                        strokeWidth={0}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {data.statusDistribution.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between bg-muted/30 p-2 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shadow-sm"
                      style={{
                        backgroundColor:
                          COLORS[item.status as keyof typeof COLORS],
                      }}
                    />
                    <span className="text-sm font-medium text-foreground">
                      {getStatusLabel(item.status)}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {formatPercentage(item.percentage)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart Breakdown */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Detail Status Bulanan
          </CardTitle>
          <CardDescription>
            Perbandingan jumlah status kehadiran (Hadir, Sakit, Izin, Alpha)
            setiap bulan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.monthlyTrend}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  fontSize={12}
                  stroke="#888888"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  fontSize={12}
                  stroke="#888888"
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Bar
                  dataKey="HADIR"
                  fill={COLORS.HADIR}
                  name="Hadir"
                  radius={[4, 4, 0, 0]}
                  stackId="a"
                />
                <Bar
                  dataKey="SAKIT"
                  fill={COLORS.SAKIT}
                  name="Sakit"
                  radius={[4, 4, 0, 0]}
                  stackId="a"
                />
                <Bar
                  dataKey="IZIN"
                  fill={COLORS.IZIN}
                  name="Izin"
                  radius={[4, 4, 0, 0]}
                  stackId="a"
                />
                <Bar
                  dataKey="ALPA"
                  fill={COLORS.ALPA}
                  name="Alpa"
                  radius={[4, 4, 0, 0]}
                  stackId="a"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Punctual Class */}
        <Card className="shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-amber-500" />
              Leaderboard Kelas
            </CardTitle>
            <CardDescription>
              Peringkat kelas berdasarkan tingkat kehadiran tertinggi
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-4">
              {data.classSummary
                .sort((a, b) => b.presenceRate - a.presenceRate)
                .slice(0, 5)
                .map((cls, index) => (
                  <div
                    key={cls.classId}
                    className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-accent/50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shadow-sm transition-transform group-hover:scale-110 ${
                          index === 0
                            ? "bg-amber-100 text-amber-700 ring-2 ring-amber-200"
                            : index === 1
                            ? "bg-slate-100 text-slate-700 ring-2 ring-slate-200"
                            : index === 2
                            ? "bg-orange-100 text-orange-700 ring-2 ring-orange-200"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">
                          {cls.className}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {cls.totalStudents} Siswa Terdaftar
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600 text-lg">
                        {formatPercentage(cls.presenceRate)}
                      </div>
                      <div className="text-xs text-muted-foreground font-medium">
                        Kehadiran
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Students */}
        <Card className="shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-blue-500" />
              Siswa Terrajin
            </CardTitle>
            <CardDescription>
              Siswa dengan konsistensi kehadiran terbaik
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-4">
              {data.topStudents.slice(0, 5).map((student, index) => (
                <div
                  key={student.studentId}
                  className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-accent/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-10 w-10 border-2 border-background shadow-sm group-hover:border-primary/20 transition-colors">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                          {getInitials(student.studentName)}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold shadow-sm ${
                          index === 0
                            ? "bg-amber-400 text-white"
                            : index === 1
                            ? "bg-slate-400 text-white"
                            : index === 2
                            ? "bg-orange-400 text-white"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {index + 1}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-sm">
                        {student.studentName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {student.className}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant="default"
                      className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold mb-1"
                    >
                      {formatPercentage(student.presenceRate)}
                    </Badge>
                    <div className="text-[10px] text-muted-foreground">
                      {student.totalPresent} dari {student.totalRecords} hari
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Detail Performa Kelas</CardTitle>
          <CardDescription>
            Data lengkap kehadiran untuk analisis mendalam per kelas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[200px]">Kelas & Tingkat</TableHead>
                  <TableHead className="text-center">Total Siswa</TableHead>
                  <TableHead className="text-center">Rate Kehadiran</TableHead>
                  <TableHead className="text-center text-emerald-600">
                    Hadir
                  </TableHead>
                  <TableHead className="text-center text-blue-600">
                    Sakit
                  </TableHead>
                  <TableHead className="text-center text-amber-600">
                    Izin
                  </TableHead>
                  <TableHead className="text-center text-red-600">
                    Alpa
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.classSummary
                  .sort((a, b) => b.presenceRate - a.presenceRate)
                  .map((cls) => (
                    <TableRow key={cls.classId} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">
                            {cls.className}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {cls.level}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="rounded-md">
                          {cls.totalStudents}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`font-bold ${
                            cls.presenceRate >= 90
                              ? "text-emerald-600"
                              : cls.presenceRate >= 80
                              ? "text-blue-600"
                              : cls.presenceRate >= 70
                              ? "text-amber-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatPercentage(cls.presenceRate)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {cls.hadirCount}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {cls.sakitCount}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {cls.izinCount}
                      </TableCell>
                      <TableCell className="text-center font-medium text-red-600/80 bg-red-50/50 rounded-lg">
                        {cls.alpaCount > 0 ? cls.alpaCount : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
