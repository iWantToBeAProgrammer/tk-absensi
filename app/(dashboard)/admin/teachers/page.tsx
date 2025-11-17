"use client";

import { useState } from "react";
import { useTeachers, useDeleteTeacher, useImportTeachers } from "@/hooks/use-teachers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, GraduationCap, Users, Trash2, Edit, Loader2, Phone, Calendar, Upload } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { TeacherForm } from "./_components/teacher-form";
import { ImportDialog } from "../_components/import-dialog";

export default function TeachersPage() {
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  const { data: teachers, isLoading, error } = useTeachers();
  const deleteMutation = useDeleteTeacher();
  const importMutation = useImportTeachers();

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Guru berhasil dihapus");
      setDeleteConfirm(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus guru");
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
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
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
          <h1 className="text-3xl font-bold tracking-tight">Kelola Guru</h1>
          <p className="text-muted-foreground">
            Kelola data guru dan pengajar
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
            Tambah Guru
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {teachers && teachers.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <GraduationCap className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Guru</p>
                  <p className="text-2xl font-bold">{teachers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Kelas Diajar</p>
                  <p className="text-2xl font-bold">
                    {teachers.reduce((sum, teacher) => sum + teacher.classAssignments.length, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Siswa Diajar</p>
                  <p className="text-2xl font-bold">
                    {teachers.reduce((sum, teacher) => 
                      sum + teacher.classAssignments.reduce((classSum, assignment) => 
                        classSum + assignment.class._count.students, 0
                      ), 0
                    )}
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
                  <p className="text-sm font-medium text-muted-foreground">Rata-rata Usia</p>
                  <p className="text-2xl font-bold">
                    {Math.round(teachers.reduce((sum, teacher) => sum + calculateAge(teacher.dateOfBirth), 0) / teachers.length)} tahun
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Teachers Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teachers?.map((teacher) => {
          const totalClasses = teacher.classAssignments.length;
          const totalStudents = teacher.classAssignments.reduce(
            (sum, assignment) => sum + assignment.class._count.students, 0
          );

          return (
            <Card key={teacher.id} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{teacher.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <span>{calculateAge(teacher.dateOfBirth)} tahun</span>
                    </CardDescription>
                  </div>
                  {teacher.userId && (
                    <Badge variant="secondary">Akun Terhubung</Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Contact Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{teacher.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(teacher.dateOfBirth).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>Kelas</span>
                    </div>
                    <div className="font-semibold">{totalClasses}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <GraduationCap className="h-3 w-3" />
                      <span>Siswa</span>
                    </div>
                    <div className="font-semibold">{totalStudents}</div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingTeacher(teacher);
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
                    onClick={() => setDeleteConfirm(teacher.id)}
                    disabled={totalClasses > 0}
                    className="px-3"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                
                {totalClasses > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Tidak dapat dihapus karena memiliki penugasan kelas
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {teachers?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum Ada Guru</h3>
            <p className="text-muted-foreground text-center mb-4">
              Mulai dengan menambahkan guru pertama Anda.
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
                Tambah Guru
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Dialog */}
      <TeacherForm
        open={showForm}
        onOpenChange={setShowForm}
        teacher={editingTeacher}
        onSuccess={() => {
          setShowForm(false);
          setEditingTeacher(null);
        }}
      />

      {/* Import Dialog */}
      <ImportDialog
        open={showImport}
        onOpenChange={setShowImport}
        onImport={handleImport}
        type="teachers"
        templateUrl="/templates/teachers-template.csv"
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Guru?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Guru akan dihapus secara permanen.
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