import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Teacher {
  id: string;
  name: string;
  phone: string;
}

export interface Class {
  id: string;
  name: string;
  level: "KB" | "TKA" | "TKB";
  academicYearId: string;
  academicYear: {
    id: string;
    year: string;
    isActive: boolean;
  };
  teacherAssignments: Array<{
    id: string;
    teacher: Teacher;
  }>;
  _count: {
    students: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ClassFormData {
  name: string;
  level: "KB" | "TKA" | "TKB";
  academicYearId: string;
  teacherIds: string[];
}

async function handleApiResponse(response: Response) {
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

// GET all classes
export function useClasses() {
  return useQuery({
    queryKey: ["classes"],
    queryFn: async (): Promise<Class[]> => {
      const response = await fetch("/api/admin/classes");
      const data = await handleApiResponse(response);
      return data.classes;
    },
  });
}

// GET class by ID
export function useClass(id: string) {
  return useQuery({
    queryKey: ["classes", id],
    queryFn: async (): Promise<Class> => {
      const response = await fetch(`/api/admin/classes/${id}`);
      const data = await handleApiResponse(response);
      return data.class;
    },
    enabled: !!id,
  });
}

// CREATE class
export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ClassFormData) => {
      const response = await fetch("/api/admin/classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      return handleApiResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

// UPDATE class
// UPDATE class
export function useUpdateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ClassFormData }) => {
      const response = await fetch(`/api/admin/classes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      return handleApiResponse(response);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["classes", data.class.id] });
    },
    onError: (error: Error) => {
      console.error("Update class error:", error);
      // The error is already thrown and will be caught by the form
    },
  });
}

// DELETE class
export function useDeleteClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/classes/${id}`, {
        method: "DELETE",
      });

      return handleApiResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}
