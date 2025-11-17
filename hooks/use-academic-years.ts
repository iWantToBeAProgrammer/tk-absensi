import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface AcademicYear {
  id: string;
  year: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    classes: number;
  };
}

interface AcademicYearFormData {
  year: string;
  isActive: boolean;
}

// GET all academic years
export function useAcademicYears() {
  return useQuery({
    queryKey: ["academic-years"],
    queryFn: async (): Promise<AcademicYear[]> => {
      const response = await fetch("/api/academic-years");
      if (!response.ok) {
        throw new Error("Failed to fetch academic years");
      }
      const data = await response.json();
      return data.academicYears;
    },
  });
}

// GET academic year by ID
export function useAcademicYear(id: string) {
  return useQuery({
    queryKey: ["academic-years", id],
    queryFn: async (): Promise<AcademicYear> => {
      const response = await fetch(`/api/academic-years/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch academic year");
      }
      const data = await response.json();
      return data.academicYear;
    },
    enabled: !!id,
  });
}

// CREATE academic year
export function useCreateAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AcademicYearFormData) => {
      const response = await fetch("/api/academic-years", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create academic year");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
    },
  });
}

// UPDATE academic year
export function useUpdateAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: AcademicYearFormData;
    }) => {
      const response = await fetch(`/api/academic-years/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update academic year");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
    },
  });
}

// DELETE academic year
export function useDeleteAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/academic-years/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete academic year");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
    },
  });
}

// SET ACTIVE academic year
export function useSetActiveAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/academic-years/${id}/active`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to set active academic year");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
    },
  });
}
