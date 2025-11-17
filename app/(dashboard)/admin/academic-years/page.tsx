"use client";

import { useState } from "react";
import {
  useAcademicYears,
  useDeleteAcademicYear,
  useSetActiveAcademicYear,
} from "@/hooks/use-academic-years";
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
  Calendar,
  School,
  Trash2,
  CheckCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
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
import { AcademicYearForm } from "./_components/academic-years-form";

export default function AcademicYearsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingYear, setEditingYear] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: academicYears, isLoading, error } = useAcademicYears();
  const deleteMutation = useDeleteAcademicYear();
  const setActiveMutation = useSetActiveAcademicYear();

  const handleSetActive = async (id: string) => {
    try {
      await setActiveMutation.mutateAsync(id);
      toast.success("Tahun akademik berhasil diaktifkan");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal mengaktifkan tahun akademik"
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Tahun akademik berhasil dihapus");
      setDeleteConfirm(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal menghapus tahun akademik"
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
          <h1 className="text-3xl font-bold tracking-tight">Tahun Akademik</h1>
          <p className="text-muted-foreground">
            Kelola tahun akademik dan atur tahun yang aktif
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Tambah Tahun Akademik
        </Button>
      </div>

      {/* Academic Years Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {academicYears?.map((year) => (
          <Card
            key={year.id}
            className={`relative overflow-hidden ${
              year.isActive ? "ring-2 ring-primary" : ""
            }`}
          >
            {year.isActive && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg">
                Aktif
              </div>
            )}

            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    year.isActive ? "bg-primary/20" : "bg-muted"
                  }`}
                >
                  <Calendar
                    className={`h-5 w-5 ${
                      year.isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div>
                  <CardTitle className="text-xl">{year.year}</CardTitle>
                  <CardDescription>{year._count.classes} kelas</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Dibuat</span>
                <span>
                  {new Date(year.createdAt).toLocaleDateString("id-ID")}
                </span>
              </div>

              <div className="flex gap-2">
                {!year.isActive && (
                  <Button
                    size="sm"
                    onClick={() => handleSetActive(year.id)}
                    disabled={setActiveMutation.isPending}
                    className="flex-1 gap-2"
                  >
                    {setActiveMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle className="h-3 w-3" />
                    )}
                    Aktifkan
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingYear(year);
                    setShowForm(true);
                  }}
                  className="flex-1"
                >
                  Edit
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeleteConfirm(year.id)}
                  disabled={year._count.classes > 0 || year.isActive}
                  className="px-3"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              {year._count.classes > 0 && (
                <p className="text-xs text-muted-foreground">
                  Tidak dapat dihapus karena memiliki kelas
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {academicYears?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <School className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Belum Ada Tahun Akademik
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              Mulai dengan menambahkan tahun akademik pertama Anda.
            </p>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah Tahun Akademik
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Form Dialog */}
      <AcademicYearForm
        open={showForm}
        onOpenChange={setShowForm}
        academicYear={editingYear}
        onSuccess={() => {
          setShowForm(false);
          setEditingYear(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Tahun Akademik?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Tahun akademik akan dihapus
              secara permanen.
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
