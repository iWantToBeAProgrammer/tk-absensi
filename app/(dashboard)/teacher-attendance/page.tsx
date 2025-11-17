"use client";

import { useState, useEffect } from "react";
import {
  useTodayAttendance,
  useClockIn,
  useClockOut,
} from "@/hooks/use-teacher-attendance";
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
  Loader2,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

export default function TeacherAttendancePage() {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [loadingWeekly, setLoadingWeekly] = useState(false);

  const { data: todayData, isLoading, error } = useTodayAttendance();
  const clockInMutation = useClockIn();
  const clockOutMutation = useClockOut();

  const attendance = todayData?.attendance;

  useEffect(() => {
    const fetchWeeklyData = async () => {
      try {
        setLoadingWeekly(true);
        const response = await fetch("/api/teacher-attendance/weekly");
        if (response.ok) {
          const data = await response.json();
          setWeeklyData(data.attendance);
        }
      } catch (error) {
        console.error("Error fetching weekly data:", error);
      } finally {
        setLoadingWeekly(false);
      }
    };

    fetchWeeklyData();
  }, [attendance]); // Refetch when today's attendance changes

  const weeklyStats = {
    totalDays: weeklyData.length,
    presentDays: weeklyData.filter((day) => day.status === "present").length,
    incompleteDays: weeklyData.filter((day) => day.status === "incomplete")
      .length,
    absentDays: weeklyData.filter((day) => day.status === "absent").length,
    totalHours: weeklyData.reduce(
      (total, day) =>
        total +
        (day.workDuration
          ? day.workDuration.hours + day.workDuration.minutes / 60
          : 0),
      0
    ),
  };

  const getCurrentLocation = (): Promise<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation tidak didukung oleh browser ini"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          let errorMessage = "Gagal mendapatkan lokasi";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage =
                "Akses lokasi ditolak. Izinkan akses lokasi untuk verifikasi kehadiran.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Informasi lokasi tidak tersedia.";
              break;
            case error.TIMEOUT:
              errorMessage = "Permintaan lokasi timeout.";
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const handleClockIn = async () => {
    try {
      setIsGettingLocation(true);
      setLocationError(null);

      const location = await getCurrentLocation();

      await clockInMutation.mutateAsync(location);
      toast.success("Clock in berhasil! Selamat bekerja.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Gagal melakukan clock in";
      setLocationError(errorMessage);

      // Ask if they want to continue without location
      const shouldContinue = window.confirm(
        `${errorMessage}\n\nApakah Anda ingin tetap clock in tanpa verifikasi lokasi?`
      );

      if (shouldContinue) {
        try {
          await clockInMutation.mutateAsync({
            latitude: 0,
            longitude: 0,
            accuracy: 0,
          });
          toast.success("Clock in berhasil! Selamat bekerja.");
        } catch (secondError) {
          toast.error("Gagal melakukan clock in");
        }
      }
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setIsGettingLocation(true);
      setLocationError(null);

      const location = await getCurrentLocation();

      await clockOutMutation.mutateAsync(location);
      toast.success("Clock out berhasil! Sampai jumpa besok.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Gagal melakukan clock out";
      setLocationError(errorMessage);

      // Ask if they want to continue without location
      const shouldContinue = window.confirm(
        `${errorMessage}\n\nApakah Anda ingin tetap clock out tanpa verifikasi lokasi?`
      );

      if (shouldContinue) {
        try {
          await clockOutMutation.mutateAsync({
            latitude: 0,
            longitude: 0,
            accuracy: 0,
          });
          toast.success("Clock out berhasil! Sampai jumpa besok.");
        } catch (secondError) {
          toast.error("Gagal melakukan clock out");
        }
      }
    } finally {
      setIsGettingLocation(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
          <p className="text-red-600">Error: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Presensi Guru</h1>
        <p className="text-muted-foreground mt-2">
          Catat kehadiran Anda dengan verifikasi lokasi
        </p>
        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(new Date().toISOString())}</span>
        </div>
      </div>

      {/* Attendance Status Card */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Clock className="h-6 w-6" />
            Status Kehadiran Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Badge */}
          <div className="flex justify-center">
            {!attendance ? (
              <Badge
                variant="default"
                className="bg-yellow-50 text-yellow-700 border-yellow-200"
              >
                <XCircle className="h-3 w-3 mr-1" />
                Belum Clock In
              </Badge>
            ) : attendance.clockOut ? (
              <Badge
                variant="default"
                className="bg-gray-50 text-gray-700 border-gray-200"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Selesai Bekerja
              </Badge>
            ) : (
              <Badge
                variant="default"
                className="bg-green-50 text-green-700 border-green-200"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Sedang Bekerja
              </Badge>
            )}
          </div>

          {/* Attendance Details */}
          {attendance && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Clock In:</span>
                  <span className="font-medium">
                    {formatTime(attendance.clockIn)}
                  </span>
                </div>
                {attendance.clockOut && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Clock Out:</span>
                    <span className="font-medium">
                      {formatTime(attendance.clockOut)}
                    </span>
                  </div>
                )}
                {attendance.workDuration && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Durasi Kerja:</span>
                    <span className="font-medium">
                      {attendance.workDuration.hours} jam{" "}
                      {attendance.workDuration.minutes} menit
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Lokasi:</span>
                </div>
                {attendance.location ? (
                  <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                    ✓ Tervalidasi dengan lokasi
                    {attendance.location.accuracy && (
                      <div>
                        Akurasi: ±{Math.round(attendance.location.accuracy)}{" "}
                        meter
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                    ⚠ Tanpa verifikasi lokasi
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            {!attendance ? (
              <Button
                onClick={handleClockIn}
                disabled={isGettingLocation || clockInMutation.isPending}
                className="gap-2 min-w-32"
                size="lg"
              >
                {isGettingLocation || clockInMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4" />
                    Clock In
                  </>
                )}
              </Button>
            ) : !attendance.clockOut ? (
              <Button
                onClick={handleClockOut}
                disabled={isGettingLocation || clockOutMutation.isPending}
                variant="outline"
                className="gap-2 min-w-32"
                size="lg"
              >
                {isGettingLocation || clockOutMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4" />
                    Clock Out
                  </>
                )}
              </Button>
            ) : (
              <div className="text-center text-muted-foreground">
                Anda sudah menyelesaikan pekerjaan hari ini. Sampai jumpa besok!
              </div>
            )}
          </div>

          {/* Location Error */}
          {locationError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{locationError}</span>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 text-sm mb-2">
              Petunjuk Presensi:
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>
                • Pastikan Anda berada di area sekolah saat melakukan presensi
              </li>
              <li>• Izinkan akses lokasi ketika diminta oleh browser</li>
              <li>• Clock in di pagi hari saat tiba di sekolah</li>
              <li>• Clock out di sore hari saat pulang dari sekolah</li>
              <li>• Presensi akan tervalidasi secara otomatis dengan lokasi</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Recent Attendance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Ringkasan Minggu Ini
          </CardTitle>
          <CardDescription>Catatan kehadiran 7 hari terakhir</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingWeekly ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : weeklyData.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              <p>Belum ada data kehadiran minggu ini</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Weekly Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-blue-600">
                    {weeklyStats.presentDays}
                  </div>
                  <div className="text-xs text-muted-foreground">Hadir</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-amber-600">
                    {weeklyStats.incompleteDays}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Belum Clock Out
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-red-600">
                    {weeklyStats.absentDays}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Tidak Hadir
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.floor(weeklyStats.totalHours)}j{" "}
                    {Math.round((weeklyStats.totalHours % 1) * 60)}m
                  </div>
                  <div className="text-xs text-muted-foreground">Total Jam</div>
                </div>
              </div>

              {/* Daily Breakdown */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Detail Harian:</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {weeklyData.map((day, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            day.status === "present"
                              ? "bg-green-500"
                              : day.status === "incomplete"
                              ? "bg-amber-500"
                              : "bg-gray-300"
                          }`}
                        />
                        <span className="font-medium">
                          {new Date(day.date).toLocaleDateString("id-ID", {
                            weekday: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="text-right">
                        {day.status === "present" && day.workDuration && (
                          <span className="text-green-600 font-medium">
                            {day.workDuration.hours}j {day.workDuration.minutes}
                            m
                          </span>
                        )}
                        {day.status === "incomplete" && (
                          <Badge
                            variant="default"
                            className="bg-amber-50 text-amber-700 border-amber-200 text-xs"
                          >
                            Belum Clock Out
                          </Badge>
                        )}
                        {day.status === "absent" && (
                          <span className="text-gray-500 text-xs">
                            Tidak hadir
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
