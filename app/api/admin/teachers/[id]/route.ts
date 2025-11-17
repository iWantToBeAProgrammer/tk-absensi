import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

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

    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        classAssignments: {
          include: {
            class: {
              include: {
                academicYear: true,
                _count: {
                  select: {
                    students: {
                      where: { status: "ACTIVE" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Guru tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ teacher });
  } catch (error) {
    console.error("Error fetching teacher:", error);
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
    const { name, phone, dateOfBirth, email, userId } = await request.json();

    // Validation
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Nama guru wajib diisi" },
        { status: 400 }
      );
    }

    if (!phone?.trim()) {
      return NextResponse.json(
        { error: "Nomor telepon wajib diisi" },
        { status: 400 }
      );
    }

    if (!dateOfBirth) {
      return NextResponse.json(
        { error: "Tanggal lahir wajib diisi" },
        { status: 400 }
      );
    }

    // Check if teacher exists
    const existingTeacher = await prisma.teacher.findUnique({
      where: { id },
    });

    if (!existingTeacher) {
      return NextResponse.json(
        { error: "Guru tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if email is being changed and if it's already taken by another teacher
    if (email && email !== existingTeacher.email) {
      const emailExists = await prisma.teacher.findFirst({
        where: {
          email: email.trim(),
          id: { not: id },
        },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "Email sudah digunakan oleh guru lain" },
          { status: 400 }
        );
      }
    }

    // Check if user exists and is not already assigned to another teacher
    if (userId && userId !== existingTeacher.userId) {
      const userTeacher = await prisma.teacher.findUnique({
        where: { userId },
      });

      if (userTeacher && userTeacher.id !== id) {
        return NextResponse.json(
          { error: "User sudah terdaftar sebagai guru lain" },
          { status: 400 }
        );
      }
    }

    const teacher = await prisma.teacher.update({
      where: { id },
      data: {
        name: name.trim(),
        phone: phone.trim(),
        dateOfBirth: new Date(dateOfBirth),
        email: email?.trim() || existingTeacher.email,
        userId: userId || existingTeacher.userId,
      },
      include: {
        classAssignments: {
          include: {
            class: {
              include: {
                academicYear: true,
                _count: {
                  select: {
                    students: {
                      where: { status: "ACTIVE" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Update user record if userId exists
    if (teacher.userId) {
      try {
        await prisma.user.upsert({
          where: { id: teacher.userId },
          update: {
            name: name.trim(),
            email: teacher.email,
          },
          create: {
            id: teacher.userId,
            name: name.trim(),
            email: teacher.email!,
            role: "TEACHER",
          },
        });
      } catch (userError) {
        console.error("Error updating user table:", userError);
        // Continue even if user table update fails
      }
    }

    return NextResponse.json({ teacher });
  } catch (error) {
    console.error("Error updating teacher:", error);
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

    // Check if teacher exists and get their data
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            classAssignments: true,
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Guru tidak ditemukan" },
        { status: 404 }
      );
    }

    if (teacher._count.classAssignments > 0) {
      return NextResponse.json(
        { error: "Tidak dapat menghapus guru yang memiliki penugasan kelas" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Delete from Supabase Auth if userId exists
    if (teacher.userId) {
      try {
        const { error: authError } = await supabase.auth.admin.deleteUser(
          teacher.userId
        );

        if (authError) {
          console.error("Error deleting user from Supabase Auth:", authError);
          // We can still proceed with database deletion even if auth deletion fails
          // This might happen if the user was already deleted from auth
        } else {
          console.log(
            `Successfully deleted user ${teacher.userId} from Supabase Auth`
          );
        }
      } catch (authError) {
        console.error("Exception when deleting from Supabase Auth:", authError);
        // Continue with database deletion even if auth deletion fails
      }
    }

    // Delete teacher from database
    await prisma.teacher.delete({
      where: { id },
    });

    // Also delete from users table if it exists
    if (teacher.userId) {
      try {
        await prisma.user.deleteMany({
          where: { id: teacher.userId },
        });
      } catch (userError) {
        console.error("Error deleting from users table:", userError);
        // Continue even if users table deletion fails
      }
    }

    return NextResponse.json({
      success: true,
      message: teacher.userId
        ? "Guru berhasil dihapus dari database dan sistem autentikasi"
        : "Guru berhasil dihapus dari database",
    });
  } catch (error) {
    console.error("Error deleting teacher:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
