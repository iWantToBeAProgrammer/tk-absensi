// app/api/teachers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateUser, requireAdmin } from "@/lib/api-auth";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const auth = await authenticateUser();

    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const teachers = await prisma.teacher.findMany({
      orderBy: { name: "asc" },
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

    return NextResponse.json({ teachers });
  } catch (error) {
    console.error("Error fetching teachers:", error);
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

    const { name, phone, dateOfBirth, email } = await request.json();

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

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
    }

    // Check if teacher with this email or phone already exists
    const existingTeacher = await prisma.teacher.findFirst({
      where: {
        OR: [{ email: email.trim() }, { phone: phone.trim() }],
      },
    });

    if (existingTeacher) {
      return NextResponse.json(
        { error: "Guru dengan email atau nomor telepon ini sudah terdaftar" },
        { status: 400 }
      );
    }

    // Initialize Supabase
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

    let userId: string | null = null;

    try {
      // Send invitation email using Supabase Auth
      const { data: inviteData, error: inviteError } =
        await supabase.auth.admin.inviteUserByEmail(email.trim(), {
          data: {
            full_name: name.trim(),
            role: "TEACHER",
            phone: phone.trim(),
          },

          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation`,
        });

      if (inviteError) {
        console.error("Supabase invite error:", inviteError);

        // If user already exists but not confirmed, we can still proceed
        if (inviteError.message.includes("already registered")) {
          // User already exists, will be linked via the database
          // No need to fetch existing user ID since we'll get it from inviteData if successful
        } else {
          return NextResponse.json(
            { error: `Gagal mengirim undangan: ${inviteError.message}` },
            { status: 400 }
          );
        }
      } else {
        userId = inviteData.user?.id || null;
      }
    } catch (supabaseError) {
      console.error("Supabase error:", supabaseError);
      // Continue without Supabase user creation if there's an error
      // The teacher will still be created in the database
    }

    // Create teacher in database
    const teacher = await prisma.teacher.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        dateOfBirth: new Date(dateOfBirth),
        userId: userId,
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

    // Update or create user in your users table for role management
    if (userId) {
      try {
        await prisma.user.upsert({
          where: { id: userId },
          update: {
            email: email.trim(),
            role: "TEACHER",
            name: name.trim(),
          },
          create: {
            id: userId,
            email: email.trim(),
            role: "TEACHER",
            name: name.trim(),
          },
        });
      } catch (userError) {
        console.error("Error updating user table:", userError);
        // Continue even if user table update fails
      }
    }

    return NextResponse.json({
      teacher,
      message: userId
        ? "Guru berhasil ditambahkan dan undangan login telah dikirim via email"
        : "Guru berhasil ditambahkan (tanpa akses login)",
    });
  } catch (error) {
    console.error("Error creating teacher:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
