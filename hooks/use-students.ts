import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Student {
  id: string;
  name: string;
  gender: "MALE" | "FEMALE";
  dateOfBirth: string;
  parentPhone: string;
  address: string;
  photoUrl: string | null;
  status: "ACTIVE" | "ALUMNI";
  classId: string;
  class: {
    id: string;
    name: string;
    level: string;
    academicYear: {
      id: string;
      year: string;
      isActive: boolean;
    };
  };
  attendances?: Array<{
    id: string;
    date: string;
    status: "HADIR" | "SAKIT" | "IZIN" | "ALPA";
    teacher?: {
      name: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface StudentFormData {
  name: string;
  gender: "MALE" | "FEMALE";
  dateOfBirth: string;
  parentPhone: string;
  address: string;
  classId: string;
  photoUrl?: string;
  status?: "ACTIVE" | "ALUMNI";
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

// GET all students
export function useStudents() {
  return useQuery({
    queryKey: ["students"],
    queryFn: async (): Promise<Student[]> => {
      const response = await fetch("/api/admin/students");
      const data = await handleApiResponse(response);
      return data.students;
    },
  });
}

// IMPORT students
export function useImportStudents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/students/import", {
        method: "POST",
        body: formData,
      });

      return handleApiResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}
// GET student by ID
export function useStudent(id: string) {
  return useQuery({
    queryKey: ["students", id],
    queryFn: async (): Promise<Student> => {
      const response = await fetch(`/api/admin/students/${id}`);
      const data = await handleApiResponse(response);
      return data.student;
    },
    enabled: !!id,
  });
}

// CREATE student
export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: StudentFormData) => {
      const response = await fetch("/api/admin/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      return handleApiResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

// UPDATE student
export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: StudentFormData }) => {
      const response = await fetch(`/api/admin/students/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      return handleApiResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

// DELETE student (soft delete to ALUMNI)
export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/students/${id}`, {
        method: "DELETE",
      });

      return handleApiResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}
