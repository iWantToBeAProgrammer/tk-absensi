import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET() {
  try {
    const auth = await requireAdmin();

    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const academicYears = await prisma.academicYear.findMany({
      where: { isActive: true },
      orderBy: { year: "desc" },
      select: {
        id: true,
        year: true,
      },
    });

    return NextResponse.json({ academicYears });
  } catch (error) {
    console.error("Error fetching active academic years:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin();
    const { id } = await params;

    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Check if academic year exists
    const existingYear = await prisma.academicYear.findUnique({
      where: { id: id },
    });

    if (!existingYear) {
      return NextResponse.json(
        { error: "Academic year not found" },
        { status: 404 }
      );
    }

    // Deactivate all other academic years
    await prisma.academicYear.updateMany({
      where: {
        isActive: true,
        id: { not: id },
      },
      data: { isActive: false },
    });

    // Activate the selected academic year
    const academicYear = await prisma.academicYear.update({
      where: { id: id },
      data: { isActive: true },
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
    console.error("Error setting active academic year:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
