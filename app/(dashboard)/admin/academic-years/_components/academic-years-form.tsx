"use client";

import { useState, useEffect } from "react";
import {
  useCreateAcademicYear,
  useUpdateAcademicYear,
  AcademicYear,
} from "@/hooks/use-academic-years";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";

interface AcademicYearFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  academicYear?: AcademicYear | null;
  onSuccess?: () => void;
}

export function AcademicYearForm({
  open,
  onOpenChange,
  academicYear,
  onSuccess,
}: AcademicYearFormProps) {
  const [formData, setFormData] = useState({
    year: "",
    isActive: false,
  });
  const [errors, setErrors] = useState<{ year?: string }>({});

  const createMutation = useCreateAcademicYear();
  const updateMutation = useUpdateAcademicYear();

  const isEditing = !!academicYear;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (academicYear) {
      setFormData({
        year: academicYear.year,
        isActive: academicYear.isActive,
      });
    } else {
      setFormData({
        year: "",
        isActive: false,
      });
    }
    setErrors({});
  }, [academicYear, open]);

  const validateForm = () => {
    const newErrors: { year?: string } = {};

    if (!formData.year.trim()) {
      newErrors.year = "Tahun akademik wajib diisi";
    } else if (!/^\d{4}\/\d{4}$/.test(formData.year)) {
      newErrors.year = "Format harus YYYY/YYYY (contoh: 2024/2025)";
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
          id: academicYear.id,
          data: formData,
        });
        toast.success("Tahun akademik berhasil diperbarui");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Tahun akademik berhasil dibuat");
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      // Error is already handled in the mutation
      console.error("Error submitting form:", error);
    }
  };

  const handleYearChange = (value: string) => {
    // Auto-format the year input
    let formattedValue = value.replace(/[^\d/]/g, "");

    // Auto-insert slash after 4 digits
    if (formattedValue.length === 4 && !formattedValue.includes("/")) {
      formattedValue = formattedValue + "/";
    }

    // Limit to 9 characters (YYYY/YYYY)
    if (formattedValue.length <= 9) {
      setFormData((prev) => ({ ...prev, year: formattedValue }));
    }

    // Clear error when user types
    if (errors.year) {
      setErrors((prev) => ({ ...prev, year: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {isEditing ? "Edit Tahun Akademik" : "Tambah Tahun Akademik"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Perbarui informasi tahun akademik"
              : "Tambahkan tahun akademik baru ke sistem"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Year Input */}
          <div className="space-y-2">
            <Label htmlFor="year">
              Tahun Akademik <span className="text-red-500">*</span>
            </Label>
            <Input
              id="year"
              type="text"
              placeholder="2024/2025"
              value={formData.year}
              onChange={(e) => handleYearChange(e.target.value)}
              disabled={isLoading}
              className={errors.year ? "border-red-500" : ""}
            />
            {errors.year && (
              <p className="text-sm text-red-500">{errors.year}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Format: YYYY/YYYY (contoh: 2024/2025)
            </p>
          </div>

          {/* Active Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  isActive: checked as boolean,
                }))
              }
              disabled={isLoading}
            />
            <Label
              htmlFor="isActive"
              className="text-sm font-medium leading-none"
            >
              Jadikan tahun akademik aktif
            </Label>
          </div>

          {formData.isActive && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Perhatian:</strong> Tahun akademik ini akan menjadi yang
                aktif, dan tahun akademik aktif sebelumnya akan dinonaktifkan
                secara otomatis.
              </p>
            </div>
          )}

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
            <Button type="submit" disabled={isLoading} className="flex-1 gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEditing ? "Memperbarui..." : "Membuat..."}
                </>
              ) : (
                <>{isEditing ? "Perbarui" : "Buat"}</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
