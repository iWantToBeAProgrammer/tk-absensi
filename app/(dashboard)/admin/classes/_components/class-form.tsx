"use client";

import { useState, useEffect } from "react";
import {
  useCreateClass,
  useUpdateClass,
  Class,
  ClassFormData,
} from "@/hooks/use-classes";
import { useAcademicYears } from "@/hooks/use-academic-years";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, Users, X } from "lucide-react";
import { toast } from "sonner";

interface Teacher {
  id: string;
  name: string;
  phone: string;
}

interface ClassFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classData?: Class | null;
  onSuccess?: () => void;
}

const levelOptions = [
  { value: "KB", label: "Kelompok Bermain" },
  { value: "TKA", label: "TK A" },
  { value: "TKB", label: "TK B" },
];

export function ClassForm({
  open,
  onOpenChange,
  classData,
  onSuccess,
}: ClassFormProps) {
  const [formData, setFormData] = useState<ClassFormData>({
    name: "",
    level: "KB",
    academicYearId: "",
    teacherIds: [],
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  const { data: academicYears, isLoading: loadingAcademicYears } =
    useAcademicYears();
  const createMutation = useCreateClass();
  const updateMutation = useUpdateClass();

  const isEditing = !!classData;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (classData) {
      setFormData({
        name: classData.name,
        level: classData.level,
        academicYearId: classData.academicYearId,
        teacherIds: classData.teacherAssignments.map((ta) => ta.teacher.id),
      });
    } else {
      setFormData({
        name: "",
        level: "KB",
        academicYearId: "",
        teacherIds: [],
      });
    }
    setErrors({});
  }, [classData, open]);

  useEffect(() => {
    // Load teachers for dropdown
    const loadTeachers = async () => {
      setLoadingTeachers(true);
      try {
        const response = await fetch("/api/teachers");
        if (response.ok) {
          const data = await response.json();
          setTeachers(data.teachers || []);
        }
      } catch (error) {
        console.error("Error loading teachers:", error);
      } finally {
        setLoadingTeachers(false);
      }
    };

    if (open) {
      loadTeachers();
    }
  }, [open]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nama kelas wajib diisi";
    }

    if (!formData.academicYearId) {
      newErrors.academicYearId = "Tahun akademik wajib dipilih";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: classData.id,
          data: formData,
        });
        toast.success("Kelas berhasil diperbarui");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Kelas berhasil dibuat");
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleTeacherToggle = (teacherId: string) => {
    setFormData((prev) => {
      const teacherIds = prev.teacherIds.includes(teacherId)
        ? prev.teacherIds.filter((id) => id !== teacherId)
        : [...prev.teacherIds, teacherId];

      return { ...prev, teacherIds };
    });
  };

  const activeAcademicYears = academicYears?.filter((ay) => ay.isActive) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {isEditing ? "Edit Kelas" : "Tambah Kelas"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Perbarui informasi kelas"
              : "Tambahkan kelas baru ke sistem"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Class Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nama Kelas <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Contoh: KB A, TK A1, TK B2"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              disabled={isLoading}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Level */}
          <div className="space-y-2">
            <Label htmlFor="level">
              Level <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.level}
              onValueChange={(value: "KB" | "TKA" | "TKB") =>
                setFormData((prev) => ({ ...prev, level: value }))
              }
              disabled={isLoading}
            >
              <SelectTrigger className={errors.level ? "border-red-500" : ""}>
                <SelectValue placeholder="Pilih level" />
              </SelectTrigger>
              <SelectContent>
                {levelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.level && (
              <p className="text-sm text-red-500">{errors.level}</p>
            )}
          </div>

          {/* Academic Year */}
          <div className="space-y-2">
            <Label htmlFor="academicYear">
              Tahun Akademik <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.academicYearId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, academicYearId: value }))
              }
              disabled={isLoading || loadingAcademicYears}
            >
              <SelectTrigger
                className={errors.academicYearId ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Pilih tahun akademik" />
              </SelectTrigger>
              <SelectContent>
                {activeAcademicYears.map((academicYear) => (
                  <SelectItem key={academicYear.id} value={academicYear.id}>
                    {academicYear.year}
                  </SelectItem>
                ))}
                {activeAcademicYears.length === 0 && (
                  <SelectItem value="" disabled>
                    Tidak ada tahun akademik aktif
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {errors.academicYearId && (
              <p className="text-sm text-red-500">{errors.academicYearId}</p>
            )}
            {activeAcademicYears.length === 0 && (
              <p className="text-sm text-yellow-600">
                Buat tahun akademik terlebih dahulu dan set sebagai aktif
              </p>
            )}
          </div>

          {/* Teacher Selection */}
          <div className="space-y-3">
            <Label>Guru Pengajar</Label>

            {loadingTeachers ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Memuat daftar guru...
              </div>
            ) : teachers.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg">
                  {teachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => handleTeacherToggle(teacher.id)}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          formData.teacherIds.includes(teacher.id)
                            ? "bg-primary border-primary"
                            : "border-gray-300"
                        }`}
                      >
                        {formData.teacherIds.includes(teacher.id) && (
                          <div className="w-2 h-2 bg-white rounded-sm" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {teacher.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {teacher.phone}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected Teachers */}
                {formData.teacherIds.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">Guru Terpilih:</Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.teacherIds.map((teacherId) => {
                        const teacher = teachers.find(
                          (t) => t.id === teacherId
                        );
                        return teacher ? (
                          <Badge
                            key={teacherId}
                            variant="secondary"
                            className="gap-1 pl-2"
                          >
                            <Users className="h-3 w-3" />
                            {teacher.name}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTeacherToggle(teacherId);
                              }}
                              className="hover:bg-muted-foreground/20 rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Tidak ada guru yang tersedia
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isLoading || activeAcademicYears.length === 0}
              className="flex-1 gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEditing ? "Memperbarui..." : "Membuat..."}
                </>
              ) : (
                <>{isEditing ? "Perbarui" : "Buat Kelas"}</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
