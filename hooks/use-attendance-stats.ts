import { useState, useEffect } from "react";

interface AttendanceStats {
  activeYear: {
    id: string;
    year: string;
    semester: string;
    isActive: boolean;
  } | null;
  todayAttendance: {
    present: number;
    sick: number;
    excused: number;
    absent: number;
    total: number;
    attendanceRate: number;
  };
  attendanceTrend: Array<{
    date: string;
    _count: number;
  }>;
}

export function useAttendanceStats() {
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/admin/attendance");
        if (!response.ok) throw new Error("Failed to fetch stats");
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return { stats, loading, error };
}
