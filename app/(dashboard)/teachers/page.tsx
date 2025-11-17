import { getTeachers } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default async function TeachersPage() {
  const result = await getTeachers();

  if (!result.success) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Guru</h1>
        <div className="text-red-500">{result.error}</div>
      </div>
    );
  }

  const teachers = result.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Guru</h1>
        <Link href="/dashboard/teachers/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah Guru
          </Button>
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Nama</th>
              <th className="px-4 py-3 text-left font-semibold">
                Tanggal Lahir
              </th>
              <th className="px-4 py-3 text-left font-semibold">
                Nomor Telepon
              </th>
              <th className="px-4 py-3 text-left font-semibold">Kelas</th>
              <th className="px-4 py-3 text-left font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {teachers.map((teacher) => (
              <tr key={teacher.id} className="hover:bg-muted/50">
                <td className="px-4 py-3">{teacher.name}</td>
                <td className="px-4 py-3">
                  {format(new Date(teacher.dateOfBirth), "dd MMMM yyyy", {
                    locale: id,
                  })}
                </td>
                <td className="px-4 py-3">{teacher.phone}</td>
                <td className="px-4 py-3">
                  {teacher.classAssignments
                    ?.map((a) => a.class.name)
                    .join(", ") || "-"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link href={`/dashboard/teachers/${teacher.id}`}>
                      <Button size="sm" variant="outline">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {teachers.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Belum ada guru. Silakan buat guru baru.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
