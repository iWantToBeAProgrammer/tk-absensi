"use client";

import { useState } from "react";
import { useClasses, useDeleteClass } from "@/hooks/use-classes";
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
  BookOpen,
  Users,
  Trash2,
  Edit,
  Loader2,
  GraduationCap,
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
import { ClassForm } from "./_components/class-form";

const levelLabels = {
  KB: "Kelompok Bermain",
  TKA: "TK A",
  TKB: "TK B",
};

const levelColors = {
  KB: "bg-blue-100 text-blue-800",
  TKA: "bg-green-100 text-green-800",
  TKB: "bg-purple-100 text-purple-800",
};

export default function ClassesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: classes, isLoading, error } = useClasses();
  const deleteMutation = useDeleteClass();

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Kelas berhasil dihapus");
      setDeleteConfirm(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menghapus kelas"
      );
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Kelola Kelas</h1>
          <p className="text-muted-foreground">
            Kelola kelas dan penempatan siswa
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Tambah Kelas
        </Button>
      </div>

      {/* Classes Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {classes?.map((classItem) => (
          <Card key={classItem.id} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{classItem.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <span>{classItem.academicYear.year}</span>
                    <span>•</span>
                    <Badge
                      variant="secondary"
                      className={levelColors[classItem.level]}
                    >
                      {levelLabels[classItem.level]}
                    </Badge>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Teachers */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <GraduationCap className="h-3 w-3" />
                  <span>Guru Pengajar:</span>
                </div>
                {classItem.teacherAssignments.length > 0 ? (
                  <div className="space-y-1">
                    {classItem.teacherAssignments.map((assignment) => (
                      <div key={assignment.id} className="text-sm">
                        {assignment.teacher.name}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Belum ada guru
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>Siswa:</span>
                </div>
                <span className="font-semibold">
                  {classItem._count.students}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingClass(classItem);
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
                  onClick={() => setDeleteConfirm(classItem.id)}
                  disabled={classItem._count.students > 0}
                  className="px-3"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              {classItem._count.students > 0 && (
                <p className="text-xs text-muted-foreground">
                  Tidak dapat dihapus karena memiliki siswa
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {classes?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum Ada Kelas</h3>
            <p className="text-muted-foreground text-center mb-4">
              Mulai dengan menambahkan kelas pertama Anda.
            </p>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah Kelas
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Form Dialog */}
      <ClassForm
        open={showForm}
        onOpenChange={setShowForm}
        classData={editingClass}
        onSuccess={() => {
          setShowForm(false);
          setEditingClass(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kelas?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Kelas akan dihapus secara
              permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
