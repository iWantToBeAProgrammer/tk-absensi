import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Teacher {
  id: string;
  name: string;
  email: string | null; // Make email nullable to match your schema
  phone: string;
  dateOfBirth: string;
  userId: string | null;
  classAssignments: Array<{
    id: string;
    class: {
      id: string;
      name: string;
      level: string;
      academicYear: {
        id: string;
        year: string;
        isActive: boolean;
      };
      _count: {
        students: number;
      };
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherFormData {
  name: string;
  email: string; // Make email required for creation
  phone: string;
  dateOfBirth: string;
  userId?: string;
}

export interface ApiResponse {
  teacher?: Teacher;
  teachers?: Teacher[];
  message?: string;
  error?: string;
}

async function handleApiResponse(response: Response): Promise<ApiResponse> {
  if (!response.ok) {
    if (response.status === 401) {
      window.location.href = "/login";
      throw new Error("Silakan login kembali");
    }

    if (response.status === 403) {
      throw new Error("Akses ditolak - Anda bukan admin");
    }

    const error = await response.json();
    throw new Error(error.error || "Terjadi kesalahan");
  }

  return response.json();
}

// GET all teachers
export function useTeachers() {
  return useQuery({
    queryKey: ["teachers"],
    queryFn: async (): Promise<Teacher[]> => {
      const response = await fetch("/api/admin/teachers"); // Keep admin endpoint
      const data = await handleApiResponse(response);
      return data.teachers!;
    },
  });
}

// GET teacher by ID
export function useTeacher(id: string) {
  return useQuery({
    queryKey: ["teachers", id],
    queryFn: async (): Promise<Teacher> => {
      const response = await fetch(`/api/admin/teachers/${id}`); // Keep admin endpoint
      const data = await handleApiResponse(response);
      return data.teacher!;
    },
    enabled: !!id,
  });
}

// IMPORT teachers
// IMPORT teachers
export function useImportTeachers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File): Promise<ApiResponse> => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/teachers/import", {
        method: "POST",
        body: formData,
      });

      const data = await handleApiResponse(response);

      // If there are errors in the response, throw them
      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
  });
}

// CREATE teacher
export function useCreateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TeacherFormData): Promise<ApiResponse> => {
      const response = await fetch("/api/admin/teachers", {
        // Keep admin endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      return handleApiResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
  });
}

// UPDATE teacher
export function useUpdateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: TeacherFormData;
    }): Promise<ApiResponse> => {
      const response = await fetch(`/api/admin/teachers/${id}`, {
        // Keep admin endpoint
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      return handleApiResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
  });
}

// DELETE teacher
export function useDeleteTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<ApiResponse> => {
      const response = await fetch(`/api/admin/teachers/${id}`, {
        // Keep admin endpoint
        method: "DELETE",
      });

      return handleApiResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
  });
}
