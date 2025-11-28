"use client";

import { useState, useEffect } from "react";
import {
  useCreateTeacher,
  useUpdateTeacher,
  Teacher,
  TeacherFormData,
} from "@/hooks/use-teachers";
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
  Loader2,
  GraduationCap,
  Calendar as CalendarIcon,
  Mail,
  User,
  Phone,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
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

interface TeacherFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher?: Teacher | null;
  onSuccess?: () => void;
}

export function TeacherForm({
  open,
  onOpenChange,
  teacher,
  onSuccess,
}: TeacherFormProps) {
  const [formData, setFormData] = useState<TeacherFormData>({
    name: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    userId: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [date, setDate] = useState<Date>();
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const createMutation = useCreateTeacher();
  const updateMutation = useUpdateTeacher();

  const isEditing = !!teacher;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (teacher) {
      const birthDate = new Date(teacher.dateOfBirth);
      setFormData({
        name: teacher.name,
        phone: teacher.phone,
        dateOfBirth: teacher.dateOfBirth,
        email: teacher.email || "",
        userId: teacher.userId || "",
      });
      setDate(birthDate);
    } else {
      setFormData({
        name: "",
        phone: "",
        dateOfBirth: "",
        email: "",
        userId: "",
      });
      setDate(undefined);
    }
    setErrors({});
    setResult(null);
  }, [teacher, open]);

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
      newErrors.name = "Nama guru wajib diisi";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Nama guru minimal 2 karakter";
    }

    if (!formData.email?.trim()) {
      newErrors.email = "Email wajib diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Nomor telepon wajib diisi";
    } else if (!/^[0-9+\-\s()]+$/.test(formData.phone)) {
      newErrors.phone = "Format nomor telepon tidak valid";
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Tanggal lahir wajib diisi";
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const minDate = new Date();
      minDate.setFullYear(today.getFullYear() - 65);
      const maxDate = new Date();
      maxDate.setFullYear(today.getFullYear() - 21);

      if (birthDate > maxDate) {
        newErrors.dateOfBirth = "Guru harus berusia minimal 21 tahun";
      } else if (birthDate < minDate) {
        newErrors.dateOfBirth = "Usia guru maksimal 65 tahun";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // In your TeacherForm handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      let response;

      if (isEditing) {
        response = await updateMutation.mutateAsync({
          id: teacher.id,
          data: formData,
        });
        toast.success("Guru berhasil diperbarui");
      } else {
        response = await createMutation.mutateAsync(formData);

        // Show success message with invitation info from API response
        if (response.message) {
          setResult({
            success: true,
            message: response.message,
          });
          toast.success("Guru berhasil dibuat dan undangan dikirim");
        } else {
          toast.success("Guru berhasil dibuat");
        }
      }

      // Only close immediately if editing or if no special message
      if (isEditing || !response.message) {
        onSuccess?.();
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);
      setResult({
        success: false,
        message: error.message || "Terjadi kesalahan. Silakan coba lagi.",
      });
    }
  };

  const handlePhoneChange = (value: string) => {
    // Allow only numbers, plus, hyphen, space, and parentheses
    const formattedValue = value.replace(/[^\d+\-\s()]/g, "");
    setFormData((prev) => ({ ...prev, phone: formattedValue }));

    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: "" }));
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    if (result?.success) {
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            {isEditing ? "Edit Guru" : "Tambah Guru"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Perbarui informasi guru"
              : "Tambahkan guru baru ke sistem"}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <div
              className={`flex gap-3 items-start rounded-lg p-4 ${
                result.success
                  ? "bg-green-50 border border-green-200 text-green-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              {result.success ? (
                <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              )}
              <p className="text-sm">{result.message}</p>
            </div>

            {result.success && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">Info:</span> Guru akan
                  menerima email undangan untuk menyetel password dan mengakses
                  sistem.
                </p>
              </div>
            )}

            <Button onClick={handleClose} className="w-full">
              Tutup
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-1">
                <User className="h-4 w-4 text-muted-foreground" />
                Nama Lengkap <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Masukkan nama lengkap guru"
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

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                placeholder="guru@sekolah.id"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                disabled={isLoading || isEditing}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
              {!isEditing && (
                <p className="text-xs text-muted-foreground">
                  Undangan login akan dikirim ke email ini
                </p>
              )}
            </div>

            {/* Phone Input */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Nomor Telepon <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                placeholder="Contoh: 081234567890"
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                disabled={isLoading}
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
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
                    disabled={isLoading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date
                      ? format(date, "PPP", { locale: id })
                      : "Pilih tanggal lahir"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    captionLayout="dropdown"
                    locale={id}
                    disabled={{
                      before: new Date(
                        new Date().getFullYear() - 65,
                        new Date().getMonth(),
                        new Date().getDate()
                      ),
                      after: new Date(
                        new Date().getFullYear() - 21,
                        new Date().getMonth(),
                        new Date().getDate()
                      ),
                    }}
                  />
                </PopoverContent>
              </Popover>
              {errors.dateOfBirth && (
                <p className="text-sm text-red-500">{errors.dateOfBirth}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Usia minimal 21 tahun dan maksimal 65 tahun
              </p>
            </div>

            {/* User ID (Optional) - Only show when editing */}
            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  placeholder="ID user dari sistem auth"
                  value={formData.userId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, userId: e.target.value }))
                  }
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Hubungkan dengan akun user yang sudah ada
                </p>
              </div>
            )}

            {/* Info Message for New Teachers */}
            {!isEditing && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">Sistem Undangan:</span> Guru
                  akan menerima email untuk menyetel password dan mengakses
                  sistem.
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
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isEditing ? "Memperbarui..." : "Membuat..."}
                  </>
                ) : (
                  <>{isEditing ? "Perbarui" : "Buat Guru"}</>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
