import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { parse } from "papaparse";

interface ImportStudent {
  name: string;
  gender: string;
  dateOfBirth: string;
  parentPhone: string;
  address: string;
  className: string;
  academicYear: string;
  photoUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json(
        { error: "File tidak ditemukan" },
        { status: 400 }
      );
    }

    if (!file.name.match(/\.(csv|xlsx|xls)$/)) {
      return NextResponse.json(
        { error: "Format file harus CSV atau Excel" },
        { status: 400 }
      );
    }

    const fileBuffer = await file.arrayBuffer();
    const fileText = new TextDecoder().decode(fileBuffer);

    // Parse CSV synchronously
    const { data, errors } = parse<ImportStudent>(fileText, {
      header: true,
      skipEmptyLines: true,
    });

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: `Error parsing CSV: ${errors
            .map((e) => e.message)
            .join(", ")}`,
        },
        { status: 400 }
      );
    }

    const importResults = {
      success: 0,
      errors: [] as string[],
      details: [] as any[],
    };

    for (let i = 0; i < data.length; i++) {
      const student = data[i];
      const rowNumber = i + 2;

      try {
        // Validate required fields
        if (!student.name?.trim()) {
          importResults.errors.push(`Baris ${rowNumber}: Nama wajib diisi`);
          continue;
        }
        if (!student.gender) {
          importResults.errors.push(
            `Baris ${rowNumber}: Jenis kelamin wajib diisi`
          );
          continue;
        }

        const normalizedGender = student.gender.toUpperCase();
        if (
          !["LAKI-LAKI", "PEREMPUAN", "MALE", "FEMALE"].includes(
            normalizedGender
          )
        ) {
          importResults.errors.push(
            `Baris ${rowNumber}: Jenis kelamin harus 'Laki-laki' atau 'Perempuan'`
          );
          continue;
        }
        const gender =
          normalizedGender === "LAKI-LAKI" || normalizedGender === "MALE"
            ? "MALE"
            : "FEMALE";

        const birthDate = new Date(student.dateOfBirth);
        if (isNaN(birthDate.getTime())) {
          importResults.errors.push(
            `Baris ${rowNumber}: Format tanggal lahir tidak valid`
          );
          continue;
        }

        const age = new Date().getFullYear() - birthDate.getFullYear();
        if (age < 3 || age > 10) {
          importResults.errors.push(
            `Baris ${rowNumber}: Usia siswa harus antara 3-10 tahun`
          );
          continue;
        }

        if (!student.parentPhone?.trim()) {
          importResults.errors.push(
            `Baris ${rowNumber}: Nomor telepon orang tua wajib diisi`
          );
          continue;
        }
        if (!student.address?.trim()) {
          importResults.errors.push(`Baris ${rowNumber}: Alamat wajib diisi`);
          continue;
        }
        if (!student.className?.trim()) {
          importResults.errors.push(
            `Baris ${rowNumber}: Nama kelas wajib diisi`
          );
          continue;
        }
        if (!student.academicYear?.trim()) {
          importResults.errors.push(
            `Baris ${rowNumber}: Tahun akademik wajib diisi`
          );
          continue;
        }

        // Find or create class
        let classData = await prisma.class.findFirst({
          where: {
            name: student.className.trim(),
            academicYear: { year: student.academicYear.trim() },
          },
          include: { academicYear: true },
        });

        if (!classData) {
          let academicYear = await prisma.academicYear.findFirst({
            where: { year: student.academicYear.trim() },
          });
          if (!academicYear) {
            academicYear = await prisma.academicYear.create({
              data: { year: student.academicYear.trim(), isActive: false },
            });
          }
          classData = await prisma.class.create({
            data: {
              name: student.className.trim(),
              level: "KB",
              academicYearId: academicYear.id,
            },
            include: { academicYear: true },
          });
        }

        await prisma.student.create({
          data: {
            name: student.name.trim(),
            gender,
            dateOfBirth: birthDate,
            parentPhone: student.parentPhone.trim(),
            address: student.address.trim(),
            classId: classData.id,
            photoUrl: student.photoUrl?.trim() || null,
            status: "ACTIVE",
          },
        });

        importResults.success++;
        importResults.details.push({
          row: rowNumber,
          name: student.name,
          status: "SUCCESS",
        });
      } catch (error) {
        importResults.errors.push(
          `Baris ${rowNumber}: ${
            error instanceof Error ? error.message : "Terjadi kesalahan"
          }`
        );
      }
    }

    return NextResponse.json({
      message: `Import selesai: ${importResults.success} berhasil, ${importResults.errors.length} gagal`,
      summary: importResults,
    });
  } catch (error) {
    console.error("Error in import endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
