"use client";

import { useState, useEffect } from "react";
import {
  useCreateStudent,
  useUpdateStudent,
  Student,
  StudentFormData,
} from "@/hooks/use-students";
import { useClasses } from "@/hooks/use-classes";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, User, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface StudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student | null;
  onSuccess?: () => void;
}

const genderOptions = [
  { value: "MALE", label: "Laki-laki" },
  { value: "FEMALE", label: "Perempuan" },
];

const statusOptions = [
  { value: "ACTIVE", label: "Aktif" },
  { value: "ALUMNI", label: "Alumni" },
];

export function StudentForm({
  open,
  onOpenChange,
  student,
  onSuccess,
}: StudentFormProps) {
  const [formData, setFormData] = useState<StudentFormData>({
    name: "",
    gender: "MALE",
    dateOfBirth: "",
    parentPhone: "",
    address: "",
    classId: "",
    status: "ACTIVE",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [date, setDate] = useState<Date>();

  const { data: classes, isLoading: loadingClasses } = useClasses();
  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();

  const isEditing = !!student;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (student) {
      const birthDate = new Date(student.dateOfBirth);
      setFormData({
        name: student.name,
        gender: student.gender,
        dateOfBirth: student.dateOfBirth,
        parentPhone: student.parentPhone,
        address: student.address,
        classId: student.classId,
        photoUrl: student.photoUrl || "",
        status: student.status,
      });
      setDate(birthDate);
    } else {
      setFormData({
        name: "",
        gender: "MALE",
        dateOfBirth: "",
        parentPhone: "",
        address: "",
        classId: "",
        status: "ACTIVE",
      });
      setDate(undefined);
    }
    setErrors({});
  }, [student, open]);

  useEffect(() => {
    if (date) {
      setFormData((prev) => ({
        ...prev,
        dateOfBirth: date.toISOString(),
      }));
    }
  }, [date]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nama siswa wajib diisi";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Nama siswa minimal 2 karakter";
    }

    if (!formData.parentPhone.trim()) {
      newErrors.parentPhone = "Nomor telepon orang tua wajib diisi";
    } else if (!/^[0-9+\-\s()]+$/.test(formData.parentPhone)) {
      newErrors.parentPhone = "Format nomor telepon tidak valid";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Alamat wajib diisi";
    } else if (formData.address.trim().length < 10) {
      newErrors.address = "Alamat minimal 10 karakter";
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Tanggal lahir wajib diisi";
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const minDate = new Date();
      minDate.setFullYear(today.getFullYear() - 10);
      const maxDate = new Date();
      maxDate.setFullYear(today.getFullYear() - 3);

      if (birthDate > maxDate) {
        newErrors.dateOfBirth = "Siswa harus berusia minimal 3 tahun";
      } else if (birthDate < minDate) {
        newErrors.dateOfBirth = "Usia siswa maksimal 10 tahun";
      }
    }

    if (!formData.classId) {
      newErrors.classId = "Kelas wajib dipilih";
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
          id: student.id,
          data: formData,
        });
        toast.success("Siswa berhasil diperbarui");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Siswa berhasil dibuat");
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handlePhoneChange = (value: string) => {
    const formattedValue = value.replace(/[^\d+\-\s()]/g, "");
    setFormData((prev) => ({ ...prev, parentPhone: formattedValue }));

    if (errors.parentPhone) {
      setErrors((prev) => ({ ...prev, parentPhone: "" }));
    }
  };

  const activeClasses =
    classes?.filter((cls) => cls.academicYear.isActive) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isEditing ? "Edit Siswa" : "Tambah Siswa"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Perbarui informasi siswa"
              : "Tambahkan siswa baru ke sistem"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nama Lengkap <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Masukkan nama lengkap siswa"
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

          {/* Gender and Date of Birth */}
          <div className="grid grid-cols-2 gap-4">
            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender">
                Jenis Kelamin <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.gender}
                onValueChange={(value: "MALE" | "FEMALE") =>
                  setFormData((prev) => ({ ...prev, gender: value }))
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis kelamin" />
                </SelectTrigger>
                <SelectContent>
                  {genderOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label>
                Tanggal Lahir <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground",
                      errors.dateOfBirth && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date
                      ? format(date, "PPP", { locale: id })
                      : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    autoFocus={true}
                    captionLayout="dropdown" // 👈 enable month/year dropdowns
                    fromYear={new Date().getFullYear() - 10}
                    toYear={new Date().getFullYear() - 3}
                    disabled={(date) => {
                      const today = new Date();
                      const minDate = new Date();
                      minDate.setFullYear(today.getFullYear() - 10);
                      const maxDate = new Date();
                      maxDate.setFullYear(today.getFullYear() - 3);
                      return date > maxDate || date < minDate;
                    }}
                  />
                </PopoverContent>
              </Popover>
              {errors.dateOfBirth && (
                <p className="text-sm text-red-500">{errors.dateOfBirth}</p>
              )}
            </div>
          </div>

          {/* Parent Phone */}
          <div className="space-y-2">
            <Label htmlFor="parentPhone">
              No. Telepon Orang Tua <span className="text-red-500">*</span>
            </Label>
            <Input
              id="parentPhone"
              placeholder="Contoh: 081234567890"
              value={formData.parentPhone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              disabled={isLoading}
              className={errors.parentPhone ? "border-red-500" : ""}
            />
            {errors.parentPhone && (
              <p className="text-sm text-red-500">{errors.parentPhone}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">
              Alamat <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="address"
              placeholder="Masukkan alamat lengkap"
              value={formData.address}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
              }
              disabled={isLoading}
              className={
                errors.address ? "border-red-500 min-h-20" : "min-h-20"
              }
            />
            {errors.address && (
              <p className="text-sm text-red-500">{errors.address}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="class">
              Kelas <span className="text-red-500">*</span>
            </Label>
            <Select
              // 1. Safe handling for value: if no classes, ensure value is undefined (placeholder shows)
              value={
                formData.classId
                  ? formData.classId
                  : activeClasses.length > 0
                  ? activeClasses[0].id
                  : undefined
              }
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, classId: value }))
              }
              // 2. Disable the dropdown entirely if no classes exist
              disabled={
                isLoading || loadingClasses || activeClasses.length === 0
              }
            >
              <SelectTrigger className={errors.classId ? "border-red-500" : ""}>
                <SelectValue placeholder="Pilih kelas" />
              </SelectTrigger>
              <SelectContent>
                {activeClasses.map((classItem) => (
                  <SelectItem key={classItem.id} value={classItem.id}>
                    {classItem.name} - {classItem.academicYear.year}
                  </SelectItem>
                ))}

                {/* 3. FIX: Change value="" to value="no-classes" */}
                {activeClasses.length === 0 && (
                  <SelectItem value="no-classes" disabled>
                    Tidak ada kelas aktif
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            {errors.classId && (
              <p className="text-sm text-red-500">{errors.classId}</p>
            )}

            {activeClasses.length === 0 && !loadingClasses && (
              <p className="text-sm text-yellow-600">
                Buat kelas terlebih dahulu pada tahun akademik aktif
              </p>
            )}
          </div>
          {/* Status (only for editing) */}
          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "ACTIVE" | "ALUMNI") =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Photo URL (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="photoUrl">URL Foto (Opsional)</Label>
            <Input
              id="photoUrl"
              placeholder="https://example.com/photo.jpg"
              value={formData.photoUrl || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, photoUrl: e.target.value }))
              }
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Link ke foto siswa (opsional)
            </p>
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
              disabled={isLoading || activeClasses.length === 0}
              className="flex-1 gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEditing ? "Memperbarui..." : "Membuat..."}
                </>
              ) : (
                <>{isEditing ? "Perbarui" : "Buat Siswa"}</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
