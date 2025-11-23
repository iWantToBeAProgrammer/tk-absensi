"use client";

import { useState, useEffect } from "react";
import { getAttendanceRecords, getAttendanceSummary } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, Download, Home, PlusCircle, List } from "lucide-react";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  HADIR: "Hadir",
  SAKIT: "Sakit",
  IZIN: "Izin",
  ALPA: "Alpa",
};

const getClasses = async () => {
  const response = await fetch("/api/classes", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch classes");
  }

  return response.json();
};

export default function AttendanceReportsPage() {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), "yyyy-MM")
  );
  const [stats, setStats] = useState<Record<string, number>>({
    HADIR: 0,
    SAKIT: 0,
    IZIN: 0,
    ALPA: 0,
  });
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [studentStats, setStudentStats] = useState<
    Record<string, Record<string, number>>
  >({});

  // Load classes on mount
  useEffect(() => {
    loadClasses();
  }, []);

  // Load data when class or month changes
  useEffect(() => {
    if (selectedClass) {
      loadData();
    }
  }, [selectedClass, selectedMonth]);

  async function loadClasses() {
    setLoading(true);
    try {
      const result = await getClasses();
      if (result.success) {
        setClasses(result.data || []);
        if (result.data && result.data.length > 0) {
          setSelectedClass(result.data[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      // Parse month to get year and month
      const [year, month] = selectedMonth.split("-");
      const monthNum = parseInt(month);

      // Get summary stats
      const summaryResult = await getAttendanceSummary(selectedClass, monthNum);
      if (summaryResult.success) {
        setStats(summaryResult.data || {});
      }

      // Get all records for the month
      const startDate = new Date(parseInt(year), monthNum - 1, 1);
      const endDate = new Date(parseInt(year), monthNum, 0);

      const recordsResult = await getAttendanceRecords(selectedClass);
      if (recordsResult.success) {
        const filtered = (recordsResult.data || []).filter((record: any) => {
          const recordDate = new Date(record.date);
          return recordDate >= startDate && recordDate <= endDate;
        });

        // Group by student for statistics
        const studentStatsMap: Record<string, Record<string, number>> = {};
        filtered.forEach((record: any) => {
          const studentName = record.student?.name || "Unknown";
          if (!studentStatsMap[studentName]) {
            studentStatsMap[studentName] = {
              HADIR: 0,
              SAKIT: 0,
              IZIN: 0,
              ALPA: 0,
            };
          }
          studentStatsMap[studentName][record.status]++;
        });

        setStudentStats(studentStatsMap);
        setRecords(filtered);
      }
    } finally {
      setLoading(false);
    }
  }

  const selectedClassData = classes.find((c) => c.id === selectedClass);
  const totalRecords = records.length;
  const hadir = stats.HADIR || 0;
  const sakit = stats.SAKIT || 0;
  const izin = stats.IZIN || 0;
  const alpa = stats.ALPA || 0;

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 p-4">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        {/* Navigation Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/attendance/input">
            <Button variant="outline" size="sm" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Input Absensi
            </Button>
          </Link>
          <Link href="/attendance">
            <Button variant="outline" size="sm" className="gap-2">
              <List className="h-4 w-4" />
              Lihat Riwayat
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Laporan Absensi
          </h1>
          <p className="text-sm text-slate-600">
            Lihat statistik dan ringkasan kehadiran siswa
          </p>
        </div>

        {/* Filters */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Filter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Kelas
                </label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id}>
                        {classItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Bulan
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-slate-400" />
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  />
                </div>
              </div>
            </div>

            {selectedClassData && (
              <div className="rounded-lg bg-blue-50 p-3 text-sm">
                <p className="text-slate-600">
                  <span className="font-semibold text-blue-900">
                    Kelas Terpilih:
                  </span>{" "}
                  {selectedClassData.name}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-2 text-center">
                <div className="text-2xl font-bold text-green-600">{hadir}</div>
                <p className="text-xs font-medium text-slate-600">Hadir</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-2 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {sakit}
                </div>
                <p className="text-xs font-medium text-slate-600">Sakit</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-2 text-center">
                <div className="text-2xl font-bold text-blue-600">{izin}</div>
                <p className="text-xs font-medium text-slate-600">Izin</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-2 text-center">
                <div className="text-2xl font-bold text-red-600">{alpa}</div>
                <p className="text-xs font-medium text-slate-600">Alpa</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Distribution - Simple Bar */}
        {hadir + sakit + izin + alpa > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Distribusi Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: "Hadir", value: hadir, color: "bg-green-500" },
                  { label: "Sakit", value: sakit, color: "bg-yellow-500" },
                  { label: "Izin", value: izin, color: "bg-blue-500" },
                  { label: "Alpa", value: alpa, color: "bg-red-500" },
                ]
                  .filter((item) => item.value > 0)
                  .map((item) => {
                    const total = hadir + sakit + izin + alpa;
                    const percent = ((item.value / total) * 100).toFixed(1);
                    return (
                      <div key={item.label}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">
                            {item.label}
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {item.value} ({percent}%)
                          </span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={`h-full ${item.color} transition-all duration-300`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Student Statistics Table */}
        {Object.keys(studentStats).length > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Statistik per Siswa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Nama Siswa
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-700">
                        Hadir
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-700">
                        Sakit
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-700">
                        Izin
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-700">
                        Alpa
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(studentStats).map(([name, s]) => (
                      <tr
                        key={name}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 text-slate-900 font-medium">
                          {name}
                        </td>
                        <td className="px-4 py-3 text-center text-green-600 font-semibold">
                          {s.HADIR}
                        </td>
                        <td className="px-4 py-3 text-center text-yellow-600 font-semibold">
                          {s.SAKIT}
                        </td>
                        <td className="px-4 py-3 text-center text-blue-600 font-semibold">
                          {s.IZIN}
                        </td>
                        <td className="px-4 py-3 text-center text-red-600 font-semibold">
                          {s.ALPA}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Records Table */}
        {records.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Detail Absensi</CardTitle>
              <Button variant="outline" size="sm" className="gap-2" disabled>
                <Download className="h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Siswa
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Tanggal
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr
                        key={record.id}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 text-slate-900">
                          {record.student?.name}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {format(new Date(record.date), "dd/MM/yyyy")}
                        </td>
                        <td className="px-4 py-3">
                          {(() => {
                            const statusKey =
                              record.status as keyof typeof STATUS_LABELS;
                            const colorMap: Record<string, string> = {
                              HADIR: "bg-green-100 text-green-800",
                              SAKIT: "bg-yellow-100 text-yellow-800",
                              IZIN: "bg-blue-100 text-blue-800",
                              ALPA: "bg-red-100 text-red-800",
                            };
                            return (
                              <Badge
                                className={`border-0 font-medium ${
                                  colorMap[record.status] || ""
                                }`}
                              >
                                {STATUS_LABELS[statusKey]}
                              </Badge>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                <p>
                  Total Records:{" "}
                  <span className="font-semibold text-slate-900">
                    {totalRecords}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!selectedClass && (
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <p className="text-center text-sm text-slate-500">
                Pilih kelas terlebih dahulu untuk melihat laporan
              </p>
            </CardContent>
          </Card>
        )}

        {selectedClass && totalRecords === 0 && (
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <p className="text-center text-sm text-slate-500">
                Belum ada data absensi untuk periode ini
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
