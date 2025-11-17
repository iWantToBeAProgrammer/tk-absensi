import { getAcademicYears } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Edit2, Check } from "lucide-react";

export default async function AcademicYearsPage() {
  const result = await getAcademicYears();

  if (!result.success) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Tahun Akademik</h1>
        <div className="text-red-500">{result.error}</div>
      </div>
    );
  }

  const academicYears = result.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tahun Akademik</h1>
        <Link href="/dashboard/academic-years/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah Tahun
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {academicYears.map((year) => (
          <Card key={year.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{year.year}</CardTitle>
              </div>
              {year.isActive && (
                <div className="flex items-center gap-2 rounded bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                  <Check className="h-4 w-4" />
                  Aktif
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-semibold">Jumlah Kelas:</span>{" "}
                  {year.classes?.length || 0}
                </p>
                <p>
                  <span className="font-semibold">Jumlah Siswa:</span>{" "}
                  {year.classes?.reduce(
                    (acc, cls) => acc + (cls.students?.length || 0),
                    0
                  ) || 0}
                </p>
              </div>
              <Link href={`/dashboard/academic-years/${year.id}`}>
                <Button size="sm" variant="outline" className="gap-2">
                  <Edit2 className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {academicYears.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Belum ada tahun akademik. Silakan buat tahun akademik baru.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
