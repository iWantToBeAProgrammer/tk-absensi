import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser, requireAdmin } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await authenticateUser();
    
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const classes = await prisma.class.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        academicYear: true,
        teacherAssignments: {
          include: {
            teacher: true
          }
        },
        _count: {
          select: {
            students: {
              where: { status: "ACTIVE" }
            }
          }
        }
      }
    });

    return NextResponse.json({ classes });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const { name, level, academicYearId, teacherIds } = await request.json();

    // Validation
    if (!name || !level || !academicYearId) {
      return NextResponse.json(
        { error: "Nama, level, dan tahun akademik wajib diisi" },
        { status: 400 }
      );
    }

    // Check if academic year exists
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: academicYearId }
    });

    if (!academicYear) {
      return NextResponse.json(
        { error: "Tahun akademik tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if teachers exist
    if (teacherIds && teacherIds.length > 0) {
      const teachers = await prisma.teacher.findMany({
        where: { id: { in: teacherIds } }
      });

      if (teachers.length !== teacherIds.length) {
        return NextResponse.json(
          { error: "Beberapa guru tidak ditemukan" },
          { status: 404 }
        );
      }
    }

    // Create class with teacher assignments
    const newClass = await prisma.class.create({
      data: {
        name,
        level,
        academicYearId,
        teacherAssignments: teacherIds && teacherIds.length > 0 ? {
          create: teacherIds.map((teacherId: string) => ({
            teacherId
          }))
        } : undefined
      },
      include: {
        academicYear: true,
        teacherAssignments: {
          include: {
            teacher: true
          }
        },
        _count: {
          select: {
            students: {
              where: { status: "ACTIVE" }
            }
          }
        }
      }
    });

    return NextResponse.json({ class: newClass });
  } catch (error) {
    console.error("Error creating class:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}