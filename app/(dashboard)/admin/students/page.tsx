"use client";

import { useState } from "react";
import {
  useStudents,
  useDeleteStudent,
  useImportStudents,
} from "@/hooks/use-students";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Users,
  Phone,
  MapPin,
  Calendar,
  Trash2,
  Edit,
  Loader2,
  User,
  BookOpen,
  Upload,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { StudentForm } from "./_components/student-form";
import { ImportDialog } from "../_components/import-dialog";

const genderLabels = {
  MALE: "Laki-laki",
  FEMALE: "Perempuan",
};

const statusColors = {
  ACTIVE: "bg-green-100 text-green-800",
  ALUMNI: "bg-gray-100 text-gray-800",
};

const statusLabels = {
  ACTIVE: "Aktif",
  ALUMNI: "Alumni",
};

export default function StudentsPage() {
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: students, isLoading, error } = useStudents();
  const deleteMutation = useDeleteStudent();
  const importMutation = useImportStudents();

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Siswa berhasil diarsipkan sebagai alumni");
      setDeleteConfirm(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal mengarsipkan siswa"
      );
    }
  };

  const handleImport = async (file: File) => {
    return await importMutation.mutateAsync(file);
  };

  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const getTodayAttendance = (student: any) => {
    return student.attendances?.[0] || null;
  };

  const attendanceColors = {
    HADIR: "bg-green-100 text-green-800",
    SAKIT: "bg-yellow-100 text-yellow-800",
    IZIN: "bg-blue-100 text-blue-800",
    ALPA: "bg-red-100 text-red-800",
  };

  const attendanceLabels = {
    HADIR: "Hadir",
    SAKIT: "Sakit",
    IZIN: "Izin",
    ALPA: "Alpa",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600">Error: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kelola Siswa</h1>
          <p className="text-muted-foreground">
            Kelola data siswa dan informasi
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowImport(true)}
            variant="outline"
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Impor CSV
          </Button>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah Siswa
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {students && students.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Siswa
                  </p>
                  <p className="text-2xl font-bold">{students.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <User className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Siswa Aktif
                  </p>
                  <p className="text-2xl font-bold">
                    {students.filter((s) => s.status === "ACTIVE").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BookOpen className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Kelas Terisi
                  </p>
                  <p className="text-2xl font-bold">
                    {new Set(students.map((s) => s.classId)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Calendar className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Rata-rata Usia
                  </p>
                  <p className="text-2xl font-bold">
                    {Math.round(
                      students.reduce(
                        (sum, student) =>
                          sum + calculateAge(student.dateOfBirth),
                        0
                      ) / students.length
                    )}{" "}
                    tahun
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Students Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {students?.map((student) => {
          const todayAttendance = getTodayAttendance(student);
          const age = calculateAge(student.dateOfBirth);

          return (
            <Card key={student.id} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{student.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <span>{age} tahun</span>
                      <span>•</span>
                      <span>{genderLabels[student.gender]}</span>
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant="secondary"
                      className={statusColors[student.status]}
                    >
                      {statusLabels[student.status]}
                    </Badge>
                    {todayAttendance && (
                      <Badge
                        variant="default"
                        className={attendanceColors[todayAttendance.status as keyof typeof attendanceColors]}
                      >
                        {attendanceLabels[todayAttendance.status as keyof typeof attendanceLabels]}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Class Info */}
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Kelas:</span>
                  <span className="font-medium">{student.class.name}</span>
                  <Badge variant="default" className="text-xs">
                    {student.class.academicYear.year}
                  </Badge>
                </div>

                {/* Contact Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span className="truncate">{student.parentPhone}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{student.address}</span>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Lahir:{" "}
                    {new Date(student.dateOfBirth).toLocaleDateString("id-ID")}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingStudent(student);
                      setShowForm(true);
                    }}
                    className="flex-1 gap-2"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteConfirm(student.id)}
                    className="px-3"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {students?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum Ada Siswa</h3>
            <p className="text-muted-foreground text-center mb-4">
              Mulai dengan menambahkan siswa pertama Anda.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowImport(true)}
                variant="outline"
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Impor CSV
              </Button>
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Tambah Siswa
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Dialog */}
      <StudentForm
        open={showForm}
        onOpenChange={setShowForm}
        student={editingStudent}
        onSuccess={() => {
          setShowForm(false);
          setEditingStudent(null);
        }}
      />

      {/* Import Dialog */}
      <ImportDialog
        open={showImport}
        onOpenChange={setShowImport}
        onImport={handleImport}
        type="students"
        templateUrl="/templates/students-template.csv"
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arsipkan Siswa?</AlertDialogTitle>
            <AlertDialogDescription>
              Siswa akan diarsipkan sebagai alumni dan tidak akan muncul di
              daftar siswa aktif. Tindakan ini dapat dibatalkan dengan mengubah
              status siswa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-amber-500 text-amber-50 hover:bg-amber-600"
            >
              Arsipkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
