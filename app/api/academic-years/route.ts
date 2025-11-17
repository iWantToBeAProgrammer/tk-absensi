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
