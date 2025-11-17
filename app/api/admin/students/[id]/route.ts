import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin();

    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        class: {
          include: {
            academicYear: true,
            teacherAssignments: {
              include: {
                teacher: true,
              },
            },
          },
        },
        attendances: {
          orderBy: { date: "desc" },
          take: 10,
          include: {
            teacher: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Siswa tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ student });
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin();

    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const {
      name,
      gender,
      dateOfBirth,
      parentPhone,
      address,
      classId,
      photoUrl,
      status,
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

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { error: "Siswa tidak ditemukan" },
        { status: 404 }
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

    const student = await prisma.student.update({
      where: { id },
      data: {
        name: name.trim(),
        gender,
        dateOfBirth: new Date(dateOfBirth),
        parentPhone: parentPhone.trim(),
        address: address.trim(),
        classId,
        photoUrl: photoUrl?.trim() || null,
        status: status || "ACTIVE",
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
    console.error("Error updating student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin();

    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    // Soft delete by setting status to ALUMNI
    const student = await prisma.student.update({
      where: { id },
      data: { status: "ALUMNI" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
