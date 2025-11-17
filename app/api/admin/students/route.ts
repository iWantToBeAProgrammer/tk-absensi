import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser, requireAdmin } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await authenticateUser();

    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const students = await prisma.student.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      include: {
        class: {
          include: {
            academicYear: true,
          },
        },
        attendances: {
          where: {
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lte: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
          take: 1,
        },
      },
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();

    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const {
      name,
      gender,
      dateOfBirth,
      parentPhone,
      address,
      classId,
      photoUrl,
    } = await request.json();

    // Validation
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Nama siswa wajib diisi" },
        { status: 400 }
      );
    }

    if (!gender) {
      return NextResponse.json(
        { error: "Jenis kelamin wajib diisi" },
        { status: 400 }
      );
    }

    if (!dateOfBirth) {
      return NextResponse.json(
        { error: "Tanggal lahir wajib diisi" },
        { status: 400 }
      );
    }

    if (!parentPhone?.trim()) {
      return NextResponse.json(
        { error: "Nomor telepon orang tua wajib diisi" },
        { status: 400 }
      );
    }

    if (!address?.trim()) {
      return NextResponse.json(
        { error: "Alamat wajib diisi" },
        { status: 400 }
      );
    }

    if (!classId) {
      return NextResponse.json(
        { error: "Kelas wajib dipilih" },
        { status: 400 }
      );
    }

    // Check if class exists
    const classData = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classData) {
      return NextResponse.json(
        { error: "Kelas tidak ditemukan" },
        { status: 404 }
      );
    }

    const student = await prisma.student.create({
      data: {
        name: name.trim(),
        gender,
        dateOfBirth: new Date(dateOfBirth),
        parentPhone: parentPhone.trim(),
        address: address.trim(),
        classId,
        photoUrl: photoUrl?.trim() || null,
        status: "ACTIVE",
      },
      include: {
        class: {
          include: {
            academicYear: true,
          },
        },
      },
    });

    return NextResponse.json({ student });
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
