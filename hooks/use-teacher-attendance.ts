import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface TeacherAttendance {
  id: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  workDuration: {
    hours: number;
    minutes: number;
  } | null;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null;
  teacherName: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

async function handleApiResponse(response: Response) {
  if (!response.ok) {
    if (response.status === 401) {
      window.location.href = '/login';
      throw new Error('Silakan login kembali');
    }
    
    const error = await response.json();
    throw new Error(error.error || 'Terjadi kesalahan');
  }
  
  return response.json();
}

// GET today's attendance
export function useTodayAttendance() {
  return useQuery({
    queryKey: ['teacher-attendance', 'today'],
    queryFn: async (): Promise<{ attendance: TeacherAttendance | null }> => {
      const response = await fetch('/api/teacher-attendance/today');
      return handleApiResponse(response);
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// CLOCK IN
export function useClockIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (location?: LocationData) => {
      const response = await fetch('/api/teacher-attendance/clock-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location }),
      });

      return handleApiResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-attendance'] });
    },
  });
}

// CLOCK OUT
export function useClockOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (location?: LocationData) => {
      const response = await fetch('/api/teacher-attendance/clock-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location }),
      });

      return handleApiResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-attendance'] });
    },
  });
}