"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TeacherAttendance {
  id: string;
  clockIn: Date;
  clockOut: Date | null;
}

interface TeacherAttendanceButtonsProps {
  todayAttendance: TeacherAttendance | null;
  teacherId: string;
}

export function TeacherAttendanceButtons({ todayAttendance, teacherId }: TeacherAttendanceButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number; accuracy?: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation tidak didukung"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          let errorMessage = "Gagal mendapatkan lokasi";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Izinkan akses lokasi untuk verifikasi kehadiran";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Informasi lokasi tidak tersedia";
              break;
            case error.TIMEOUT:
              errorMessage = "Timeout mendapatkan lokasi";
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  const handleClockIn = async () => {
    try {
      setIsLoading(true);
      setLocationError(null);
      
      const location = await getCurrentLocation();
      
      const response = await fetch('/api/teacher-attendance/clock-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location }),
      });

      if (response.ok) {
        toast.success("Clock in berhasil! Selamat bekerja.");
        window.location.reload();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal melakukan clock in";
      setLocationError(errorMessage);
      
      const shouldContinue = window.confirm(
        `${errorMessage}\n\nApakah Anda ingin tetap clock in tanpa verifikasi lokasi?`
      );
      
      if (shouldContinue) {
        try {
          const response = await fetch('/api/teacher-attendance/clock-in', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            toast.success("Clock in berhasil! Selamat bekerja.");
            window.location.reload();
          } else {
            const error = await response.json();
            toast.error(error.error || "Gagal melakukan clock in");
          }
        } catch (secondError) {
          toast.error("Gagal melakukan clock in");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setIsLoading(true);
      setLocationError(null);
      
      const location = await getCurrentLocation();
      
      const response = await fetch('/api/teacher-attendance/clock-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location }),
      });

      if (response.ok) {
        toast.success("Clock out berhasil! Sampai jumpa besok.");
        window.location.reload();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal melakukan clock out";
      setLocationError(errorMessage);
      
      const shouldContinue = window.confirm(
        `${errorMessage}\n\nApakah Anda ingin tetap clock out tanpa verifikasi lokasi?`
      );
      
      if (shouldContinue) {
        try {
          const response = await fetch('/api/teacher-attendance/clock-out', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            toast.success("Clock out berhasil! Sampai jumpa besok.");
            window.location.reload();
          } else {
            const error = await response.json();
            toast.error(error.error || "Gagal melakukan clock out");
          }
        } catch (secondError) {
          toast.error("Gagal melakukan clock out");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Presensi Guru
        </CardTitle>
        <CardDescription>
          Catat kehadiran Anda hari ini
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex justify-center">
          {!todayAttendance ? (
            <Badge variant="default" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <AlertCircle className="h-3 w-3 mr-1" />
              Belum Clock In
            </Badge>
          ) : todayAttendance.clockOut ? (
            <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Selesai Bekerja
            </Badge>
          ) : (
            <Badge variant="default" className="bg-blue-50 text-blue-700 border-blue-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Sedang Bekerja
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!todayAttendance ? (
            <Button
              onClick={handleClockIn}
              disabled={isLoading}
              className="flex-1 gap-2"
              size="lg"
            >
              {isLoading ? (
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
          ) : !todayAttendance.clockOut ? (
            <Button
              onClick={handleClockOut}
              disabled={isLoading}
              variant="outline"
              className="flex-1 gap-2"
              size="lg"
            >
              {isLoading ? (
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
            <div className="text-center text-muted-foreground w-full py-2">
              Anda sudah menyelesaikan pekerjaan hari ini.
            </div>
          )}
        </div>

        {/* Today's Record */}
        {todayAttendance && (
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Clock In:
              </span>
              <span className="font-medium">
                {formatTime(todayAttendance.clockIn)}
              </span>
            </div>
            {todayAttendance.clockOut && (
              <div className="flex items-center justify-between text-sm">
                <span>Clock Out:</span>
                <span className="font-medium">
                  {formatTime(todayAttendance.clockOut)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Location Error */}
        {locationError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{locationError}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}