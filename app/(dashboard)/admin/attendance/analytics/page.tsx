"use client";

import { useState, useEffect } from "react";
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
  Loader2,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Award,
  AlertCircle,
  BarChart3,
  PieChart,
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
  HADIR: "#10b981",
  SAKIT: "#3b82f6",
  IZIN: "#f59e0b",
  ALPA: "#ef4444",
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

      const response = await fetch(
        `/api/admin/attendance/analytics?${params}`
      );

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchAnalytics} className="mt-4">
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Analitik Kehadiran
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualisasi dan insight data kehadiran siswa
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="1">1 Bulan Terakhir</option>
            <option value="3">3 Bulan Terakhir</option>
            <option value="6">6 Bulan Terakhir</option>
            <option value="12">1 Tahun Terakhir</option>
          </select>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="all">Semua Kelas</option>
            {data.classSummary.map((cls) => (
              <option key={cls.classId} value={cls.classId}>
                {cls.className}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Tingkat Kehadiran
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPercentage(data.overview.averagePresenceRate)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {data.overview.presenceRateTrend >= 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">
                    +{formatPercentage(data.overview.presenceRateTrend)}
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-600" />
                  <span className="text-xs text-red-600">
                    {formatPercentage(data.overview.presenceRateTrend)}
                  </span>
                </>
              )}
              <span className="text-xs text-muted-foreground ml-1">
                dari periode sebelumnya
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overview.totalStudents}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Siswa aktif terdaftar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Rekaman
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overview.totalAttendanceRecords.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Catatan kehadiran
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Tingkat Ketidakhadiran
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatPercentage(
                data.statusDistribution.find((s) => s.status === "ALPA")
                  ?.percentage || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Alpa tanpa keterangan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribusi Status Kehadiran
            </CardTitle>
            <CardDescription>
              Breakdown status kehadiran siswa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={data.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) =>
                    `${getStatusLabel(entry.status)}: ${formatPercentage(
                      entry.percentage
                    )}`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.statusDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[entry.status as keyof typeof COLORS]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [
                    `${value.toLocaleString("id-ID")} rekaman`,
                    "Total",
                  ]}
                />
              </RePieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {data.statusDistribution.map((item) => (
                <div key={item.status} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        COLORS[item.status as keyof typeof COLORS],
                    }}
                  />
                  <span className="text-sm">
                    {getStatusLabel(item.status)}: {item.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tren Kehadiran Bulanan
            </CardTitle>
            <CardDescription>
              Pergerakan tingkat kehadiran per bulan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [
                    formatPercentage(value),
                    "Tingkat Kehadiran",
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="presenceRate"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Kehadiran (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Status Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Detail Status per Bulan
          </CardTitle>
          <CardDescription>
            Breakdown semua status kehadiran per bulan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="HADIR" fill={COLORS.HADIR} name="Hadir" />
              <Bar dataKey="SAKIT" fill={COLORS.SAKIT} name="Sakit" />
              <Bar dataKey="IZIN" fill={COLORS.IZIN} name="Izin" />
              <Bar dataKey="ALPA" fill={COLORS.ALPA} name="Alpa" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Class Leaderboard and Top Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Punctual Class Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Leaderboard Kelas Terbaik
            </CardTitle>
            <CardDescription>
              Kelas dengan tingkat kehadiran tertinggi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.classSummary
                .sort((a, b) => b.presenceRate - a.presenceRate)
                .slice(0, 5)
                .map((cls, index) => (
                  <div
                    key={cls.classId}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                          index === 0
                            ? "bg-yellow-100 text-yellow-700"
                            : index === 1
                            ? "bg-gray-100 text-gray-700"
                            : index === 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{cls.className}</div>
                        <div className="text-xs text-muted-foreground">
                          {cls.totalStudents} siswa
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        {formatPercentage(cls.presenceRate)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {cls.hadirCount} hadir
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Siswa Paling Rajin
            </CardTitle>
            <CardDescription>
              Siswa dengan kehadiran terbaik
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topStudents.slice(0, 5).map((student, index) => (
                <div
                  key={student.studentId}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                        index === 0
                          ? "bg-yellow-100 text-yellow-700"
                          : index === 1
                          ? "bg-gray-100 text-gray-700"
                          : index === 2
                          ? "bg-orange-100 text-orange-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{student.studentName}</div>
                      <div className="text-xs text-muted-foreground">
                        {student.className}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      {formatPercentage(student.presenceRate)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {student.totalPresent}/{student.totalRecords} hari
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Semua Kelas</CardTitle>
          <CardDescription>
            Ringkasan kehadiran untuk setiap kelas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Kelas</th>
                  <th className="text-center p-3 font-medium">Siswa</th>
                  <th className="text-center p-3 font-medium">Kehadiran</th>
                  <th className="text-center p-3 font-medium">Hadir</th>
                  <th className="text-center p-3 font-medium">Sakit</th>
                  <th className="text-center p-3 font-medium">Izin</th>
                  <th className="text-center p-3 font-medium">Alpa</th>
                </tr>
              </thead>
              <tbody>
                {data.classSummary
                  .sort((a, b) => b.presenceRate - a.presenceRate)
                  .map((cls) => (
                    <tr
                      key={cls.classId}
                      className="border-b hover:bg-accent transition-colors"
                    >
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{cls.className}</div>
                          <Badge variant="default" className="text-xs mt-1">
                            {cls.level}
                          </Badge>
                        </div>
                      </td>
                      <td className="text-center p-3">{cls.totalStudents}</td>
                      <td className="text-center p-3">
                        <span className="font-bold text-green-600">
                          {formatPercentage(cls.presenceRate)}
                        </span>
                      </td>
                      <td className="text-center p-3">{cls.hadirCount}</td>
                      <td className="text-center p-3">{cls.sakitCount}</td>
                      <td className="text-center p-3">{cls.izinCount}</td>
                      <td className="text-center p-3">
                        <span className="text-red-600 font-medium">
                          {cls.alpaCount}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}