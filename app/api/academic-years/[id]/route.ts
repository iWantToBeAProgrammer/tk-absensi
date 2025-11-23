import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await requireAdmin();

    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const academicYears = await prisma.academicYear.findMany({
      orderBy: { year: "desc" },
      include: {
        _count: {
          select: {
            classes: true,
          },
        },
      },
    });

    return NextResponse.json({ academicYears });
  } catch (error) {
    console.error("Error fetching academic years:", error);
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

    const { year, isActive } = await request.json();

    if (!year) {
      return NextResponse.json({ error: "Year is required" }, { status: 400 });
    }

    // Validate year format (e.g., 2024/2025)
    const yearRegex = /^\d{4}\/\d{4}$/;
    if (!yearRegex.test(year)) {
      return NextResponse.json(
        { error: "Format tahun akademik harus YYYY/YYYY (contoh: 2024/2025)" },
        { status: 400 }
      );
    }

    // If setting this as active, deactivate others
    if (isActive) {
      await prisma.academicYear.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    const academicYear = await prisma.academicYear.create({
      data: {
        year,
        isActive: isActive || false,
      },
      include: {
        _count: {
          select: {
            classes: true,
          },
        },
      },
    });

    return NextResponse.json({ academicYear });
  } catch (error) {
    console.error("Error creating academic year:", error);

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Tahun akademik sudah ada" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const { year, isActive } = await request.json();

    // Optional: Validation for year format if it is being updated
    if (year) {
      const yearRegex = /^\d{4}\/\d{4}$/;
      if (!yearRegex.test(year)) {
        return NextResponse.json(
          {
            error: "Format tahun akademik harus YYYY/YYYY (contoh: 2024/2025)",
          },
          { status: 400 }
        );
      }
    }

    // Database Logic
    // If we are setting this year to Active, we must use a transaction to
    // set all others to inactive first to ensure only one is active.
    if (isActive === true) {
      await prisma.$transaction([
        prisma.academicYear.updateMany({
          where: {
            isActive: true,
            id: { not: id }, // Don't touch the current one yet
          },
          data: { isActive: false },
        }),
        prisma.academicYear.update({
          where: { id },
          data: { year, isActive: true },
        }),
      ]);
    } else {
      // Standard update if we aren't forcing it to be active
      await prisma.academicYear.update({
        where: { id },
        data: {
          year,
          // If isActive is undefined in body, don't change it.
          // If it is explicitly false, set to false.
          ...(isActive !== undefined && { isActive }),
        },
      });
    }

    // Fetch the updated record to return it
    const updatedAcademicYear = await prisma.academicYear.findUnique({
      where: { id },
      include: {
        _count: { select: { classes: true } },
      },
    });

    return NextResponse.json({ academicYear: updatedAcademicYear });
  } catch (error) {
    console.error("Error updating academic year:", error);

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Tahun akademik sudah ada" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE
export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    // SAFETY CHECK: Do not delete if classes depend on this year
    const countClasses = await prisma.class.count({
      where: { academicYearId: id },
    });

    if (countClasses > 0) {
      return NextResponse.json(
        {
          error:
            "Tidak dapat menghapus tahun akademik karena masih ada kelas yang terdaftar di tahun ini.",
        },
        { status: 400 }
      );
    }

    // Proceed to delete
    await prisma.academicYear.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Tahun akademik berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting academic year:", error);

    // Handle case where ID doesn't exist
    if (
      error instanceof Error &&
      error.message.includes("Record to delete does not exist")
    ) {
      return NextResponse.json(
        { error: "Tahun akademik tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
