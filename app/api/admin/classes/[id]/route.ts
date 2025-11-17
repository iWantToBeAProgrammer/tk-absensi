import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

// Note: params is now a Promise in Next.js App Router
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

    // Await the params Promise
    const { id } = await params;

    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        academicYear: true,
        teacherAssignments: {
          include: {
            teacher: true,
          },
        },
        students: {
          where: { status: "ACTIVE" },
          include: {
            attendances: {
              where: {
                date: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0)),
                  lte: new Date(new Date().setHours(23, 59, 59, 999)),
                },
              },
            },
          },
          orderBy: { name: "asc" },
        },
        _count: {
          select: {
            students: {
              where: { status: "ACTIVE" },
            },
          },
        },
      },
    });

    if (!classData) {
      return NextResponse.json(
        { error: "Kelas tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ class: classData });
  } catch (error) {
    console.error("Error fetching class:", error);
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

    // Await the params Promise first
    const { id } = await params;

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { name, level, academicYearId, teacherIds } = body;

    console.log("Update request data:", {
      name,
      level,
      academicYearId,
      teacherIds,
      id,
    });

    // Validation
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Nama kelas wajib diisi" },
        { status: 400 }
      );
    }

    if (!level) {
      return NextResponse.json(
        { error: "Level kelas wajib diisi" },
        { status: 400 }
      );
    }

    if (!academicYearId) {
      return NextResponse.json(
        { error: "Tahun akademik wajib dipilih" },
        { status: 400 }
      );
    }

    // Check if class exists
    const existingClass = await prisma.class.findUnique({
      where: { id },
    });

    if (!existingClass) {
      return NextResponse.json(
        { error: "Kelas tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if academic year exists
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: academicYearId },
    });

    if (!academicYear) {
      return NextResponse.json(
        { error: "Tahun akademik tidak ditemukan" },
        { status: 404 }
      );
    }

    // Validate teacherIds format
    if (teacherIds && !Array.isArray(teacherIds)) {
      return NextResponse.json(
        { error: "Format teacherIds tidak valid" },
        { status: 400 }
      );
    }

    // Check if teachers exist (if teacherIds provided)
    if (teacherIds && teacherIds.length > 0) {
      // Validate that all teacherIds are strings
      if (!teacherIds.every((id: string) => typeof id === "string")) {
        return NextResponse.json(
          { error: "Format ID guru tidak valid" },
          { status: 400 }
        );
      }

      const teachers = await prisma.teacher.findMany({
        where: { id: { in: teacherIds } },
      });

      if (teachers.length !== teacherIds.length) {
        const foundIds = teachers.map((t) => t.id);
        const missingIds = teacherIds.filter(
          (teacherId: string) => !foundIds.includes(teacherId)
        );
        return NextResponse.json(
          {
            error: `Guru dengan ID berikut tidak ditemukan: ${missingIds.join(
              ", "
            )}`,
          },
          { status: 404 }
        );
      }
    }

    // Use transaction for data consistency
    const updatedClass = await prisma.$transaction(async (tx) => {
      // Remove existing teacher assignments
      await tx.teacherClassAssignment.deleteMany({
        where: { classId: id },
      });

      // Prepare update data
      const updateData: any = {
        name: name.trim(),
        level,
        academicYearId,
      };

      // Add teacher assignments if teacherIds are provided and not empty
      if (teacherIds && teacherIds.length > 0) {
        updateData.teacherAssignments = {
          create: teacherIds.map((teacherId: string) => ({
            teacherId,
          })),
        };
      }

      // Update class
      const classUpdate = await tx.class.update({
        where: { id },
        data: updateData,
        include: {
          academicYear: true,
          teacherAssignments: {
            include: {
              teacher: true,
            },
          },
          _count: {
            select: {
              students: {
                where: { status: "ACTIVE" },
              },
            },
          },
        },
      });

      return classUpdate;
    });

    return NextResponse.json({
      class: updatedClass,
      message: "Kelas berhasil diperbarui",
    });
  } catch (error) {
    console.error("Error updating class:", error);

    // Handle specific Prisma errors
    if (error instanceof Error) {
      // Unique constraint violation
      if (
        error.message.includes("P2002") ||
        error.message.includes("Unique constraint")
      ) {
        return NextResponse.json(
          {
            error:
              "Kelas dengan nama tersebut sudah ada pada tahun akademik yang sama",
          },
          { status: 400 }
        );
      }

      // Foreign key constraint violation
      if (
        error.message.includes("P2003") ||
        error.message.includes("Foreign key constraint")
      ) {
        return NextResponse.json(
          { error: "Data referensi tidak valid" },
          { status: 400 }
        );
      }

      // Other Prisma errors
      if (
        error.message.includes("P2025") ||
        error.message.includes("Record to update not found")
      ) {
        return NextResponse.json(
          { error: "Kelas tidak ditemukan" },
          { status: 404 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server" },
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

    // Await the params Promise
    const { id } = await params;

    // Check if class has students
    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    if (!classData) {
      return NextResponse.json(
        { error: "Kelas tidak ditemukan" },
        { status: 404 }
      );
    }

    if (classData._count.students > 0) {
      return NextResponse.json(
        { error: "Tidak dapat menghapus kelas yang memiliki siswa" },
        { status: 400 }
      );
    }

    await prisma.class.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting class:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
