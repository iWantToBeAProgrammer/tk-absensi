import { getClasses } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Trash2, Edit2 } from "lucide-react";

export default async function ClassesPage() {
  const result = await getClasses();

  if (!result.success) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Kelas</h1>
        <div className="text-red-500">{result.error}</div>
      </div>
    );
  }

  const classes = result.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Kelas</h1>
        <Link href="/dashboard/classes/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah Kelas
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((classItem) => (
          <Card key={classItem.id}>
            <CardHeader>
              <CardTitle>{classItem.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-semibold">Level:</span>{" "}
                  {classItem.level}
                </p>
                <p>
                  <span className="font-semibold">Jumlah Siswa:</span>{" "}
                  {classItem.students?.length || 0}
                </p>
                <p>
                  <span className="font-semibold">Guru:</span>{" "}
                  {classItem.teacherAssignments?.length || 0}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/classes/${classItem.id}`}>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {classes.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Belum ada kelas. Silakan buat kelas baru.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
