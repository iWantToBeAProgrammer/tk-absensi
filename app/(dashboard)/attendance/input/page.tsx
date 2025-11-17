"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { Class } from "@prisma/client";

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
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  Calendar,
  Check,
  X,
  AlertCircle,
  Clock,
  Users,
  Save,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useParams } from "next/navigation";

interface Student {
  id: string;
  name: string;
}

type AttendanceStatus = "HADIR" | "SAKIT" | "IZIN" | "ALPA";

interface AttendanceState {
  [studentId: string]: AttendanceStatus | null;
}

const STATUS_CONFIG: {
  value: AttendanceStatus;
  label: string;
  emoji: string;
  colorClass: string;
  borderClass: string;
  lightBg: string;
  textClass: string;
}[] = [
  {
    value: "HADIR",
    label: "Hadir",
    emoji: "✓",
    colorClass: "bg-emerald-500",
    borderClass: "border-emerald-500",
    lightBg: "bg-emerald-50",
    textClass: "text-emerald-700",
  },
  {
    value: "SAKIT",
    label: "Sakit",
    emoji: "🤒",
    colorClass: "bg-amber-500",
    borderClass: "border-amber-500",
    lightBg: "bg-amber-50",
    textClass: "text-amber-700",
  },
  {
    value: "IZIN",
    label: "Izin",
    emoji: "📝",
    colorClass: "bg-blue-500",
    borderClass: "border-blue-500",
    lightBg: "bg-blue-50",
    textClass: "text-blue-700",
  },
  {
    value: "ALPA",
    label: "Alpa",
    emoji: "✗",
    colorClass: "bg-rose-500",
    borderClass: "border-rose-500",
    lightBg: "bg-rose-50",
    textClass: "text-rose-700",
  },
];

// Reusable Button for Attendance Status
const StatusButton = ({
  status,
  isSelected,
  onClick,
}: {
  status: (typeof STATUS_CONFIG)[number];
  isSelected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`group relative overflow-hidden rounded-lg border-2 p-3 transition-all duration-200 ${
      isSelected
        ? `${status.colorClass} ${status.borderClass} scale-105 text-white shadow-lg`
        : `${status.lightBg} ${status.borderClass} hover:scale-105 hover:shadow-md`
    }`}
  >
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-2xl">{status.emoji}</span>
      <span
        className={`text-xs font-bold ${
          isSelected ? "text-white" : status.textClass
        }`}
      >
        {status.label}
      </span>
    </div>
    {isSelected && (
      <div className="absolute inset-0 bg-white/20 animate-pulse" />
    )}
  </button>
);

// Reusable Student Card
const StudentCard = ({
  student,
  attendance,
  setAttendance,
  index,
}: {
  student: Student;
  attendance: AttendanceState;
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceState>>;
  index: number;
}) => {
  const currentStatus = attendance[student.id] as AttendanceStatus | null;

  const handleMark = (status: AttendanceStatus) => {
    setAttendance((prev) => ({
      ...prev,
      [student.id]: prev[student.id] === status ? null : status,
    }));
  };

  const statusConfig = STATUS_CONFIG.find((s) => s.value === currentStatus);

  return (
    <Card
      className={`transform border-2 shadow-sm transition-all duration-200 hover:shadow-md ${
        currentStatus
          ? `${statusConfig?.lightBg} ${statusConfig?.borderClass}`
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-md">
                {index + 1}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{student.name}</h3>
                {currentStatus && (
                  <Badge
                    className={`mt-0.5 gap-1 ${statusConfig?.colorClass} border-0 text-white`}
                  >
                    <span>{statusConfig?.emoji}</span>
                    {statusConfig?.label}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STATUS_CONFIG.map((btn) => (
              <StatusButton
                key={btn.value}
                status={btn}
                isSelected={currentStatus === btn.value}
                onClick={() => handleMark(btn.value)}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function EnhancedAttendancePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [attendance, setAttendance] = useState<AttendanceState>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const params = useParams();
  const classId = params.classId as string;

  useEffect(() => {
    if (classId) setSelectedClass(classId);
  }, [classId]);

  const { data: classes, isLoading } = useQuery<Class[]>({
    queryKey: ["classes"],
    queryFn: async () => {
      const res = await fetch("/api/classes");
      if (!res.ok) throw new Error("Failed to fetch classes");
      return res.json();
    },
  });

  const { data: students, isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ["students", selectedClass],
    queryFn: async () => {
      const res = await fetch(`/api/classes/${selectedClass}/students`);
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
    enabled: !!selectedClass,
  });

  // Attendance statistics
  const stats = useMemo(() => {
    if (!students)
      return {
        total: 0,
        marked: 0,
        hadir: 0,
        sakit: 0,
        izin: 0,
        alpa: 0,
        progressPercent: 0,
      };
    const total = students.length;
    const hadir = Object.values(attendance).filter((s) => s === "HADIR").length;
    const sakit = Object.values(attendance).filter((s) => s === "SAKIT").length;
    const izin = Object.values(attendance).filter((s) => s === "IZIN").length;
    const alpa = Object.values(attendance).filter((s) => s === "ALPA").length;
    const marked = hadir + sakit + izin + alpa;
    return {
      total,
      marked,
      hadir,
      sakit,
      izin,
      alpa,
      progressPercent: total ? Math.round((marked / total) * 100) : 0,
    };
  }, [attendance, students]);

  // Set initial class
  useEffect(() => {
    if (classes?.length && !selectedClass) setSelectedClass(classes[0].id);
  }, [classes, selectedClass]);

  // Reset attendance when class or date changes
  useEffect(() => {
    setAttendance({});
    setSaved(false);
  }, [selectedClass, selectedDate]);

  if (isLoading || isLoadingStudents) {
    return (
      <div className="min-h-screen flex w-full justify-center items-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  const handleQuickMarkAll = (status: AttendanceStatus) => {
    if (!students) return;
    const newAttendance: AttendanceState = {};
    students.forEach((s) => (newAttendance[s.id] = status));
    setAttendance(newAttendance);
  };

  const handleReset = () => setAttendance({});

  const handleSaveAttendance = async () => {
    try {
      setSaving(true);
      const attendanceArray = Object.entries(attendance).map(
        ([studentId, status]) => ({
          studentId,
          status,
        })
      );

      const res = await fetch("/api/attendance/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId: selectedClass,
          date: new Date().toISOString(),
          attendance: attendanceArray, // array of studentId + status
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save attendance");
      }

      setSaved(true);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Save attendance failed:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-3 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 p-2.5 shadow-lg">
            <Users className="h-6 w-6 text-white sm:h-7 sm:w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Absensi Siswa
            </h1>
            <p className="text-sm text-slate-600">
              {format(selectedDate, "EEEE, dd MMMM yyyy", { locale: id })}
            </p>
          </div>
        </div>

        {/* Success Alert */}
        {showSuccess && (
          <Alert className="border-emerald-200 bg-emerald-50 animate-in slide-in-from-top duration-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-800 font-medium">
              Absensi berhasil disimpan!
            </AlertDescription>
          </Alert>
        )}

        {/* Class & Date Selection */}
        <Card className="border-slate-200 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="h-5 w-5 text-blue-600" /> Pengaturan Absensi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={format(selectedDate, "yyyy-MM-dd")}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="w-full rounded-lg border-2 border-slate-200 px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Kelas
                </label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="border-2 border-slate-200 py-2.5 text-sm font-medium">
                    <SelectValue placeholder="Pilih Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes?.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Tandai Semua Sebagai
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {STATUS_CONFIG.map((status) => (
                  <Button
                    key={status.value}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickMarkAll(status.value)}
                    className={`gap-1.5 border-2 ${status.borderClass} ${status.lightBg} hover:text-black hover:${status.colorClass} transition-all`}
                  >
                    <span className="text-base">{status.emoji}</span>
                    <span className="text-xs font-semibold">
                      {status.label}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card className="border-slate-200 bg-linear-to-br from-white to-slate-50 shadow-md">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">
                Progress Pencatatan
              </span>
              <span className="text-lg font-bold text-blue-600">
                {stats.marked}/{stats.total}
              </span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-500 ease-out"
                style={{ width: `${stats.progressPercent}%` }}
              />
              {stats.progressPercent === 100 && (
                <Sparkles className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-pulse text-yellow-300" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {STATUS_CONFIG.map((status) => (
                <div
                  key={status.value}
                  className={`rounded-xl ${status.lightBg} border-2 ${status.borderClass} p-3 transition-transform hover:scale-105`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{status.emoji}</span>
                    <span className={`text-2xl font-bold ${status.textClass}`}>
                      {stats[status.value.toLowerCase() as keyof typeof stats]}
                    </span>
                  </div>
                  <p
                    className={`mt-1 text-xs font-semibold ${status.textClass}`}
                  >
                    {status.label}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Students */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Daftar Siswa ({students?.length ?? 0})
            </h2>
            {Object.keys(attendance).length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="gap-2 text-slate-600 hover:text-slate-900"
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
            )}
          </div>
          {students?.map((student, index) => (
            <StudentCard
              key={student.id}
              student={student}
              attendance={attendance}
              setAttendance={setAttendance}
              index={index}
            />
          ))}
        </div>

        {/* Save / Reset */}
        <div className="sticky bottom-3 z-10 space-y-3 sm:static">
          <Card className="border-2 border-slate-200 bg-white/95 shadow-xl backdrop-blur-sm sm:bg-white">
            <CardContent className="p-4 flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={handleSaveAttendance}
                disabled={stats.marked === 0 || saving}
                className="flex-1 gap-2 bg-linear-to-r from-blue-600 to-indigo-600 py-6 text-base font-bold text-white shadow-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 sm:py-4"
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Save className="h-5 w-5" /> Simpan Absensi ({stats.marked}{" "}
                    siswa)
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={Object.keys(attendance).length === 0}
                className="gap-2 border-2 py-6 font-semibold sm:py-4 sm:w-auto"
              >
                <RotateCcw className="h-4 w-4" />{" "}
                <span className="sm:inline">Reset Semua</span>
              </Button>
            </CardContent>
          </Card>

          {saved && (
            <Alert className="border-emerald-200 bg-emerald-50 shadow-lg animate-in slide-in-from-bottom duration-300">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <AlertDescription className="font-semibold text-emerald-800">
                ✓ Data absensi berhasil tersimpan pada{" "}
                {format(new Date(), "HH:mm:ss")}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
