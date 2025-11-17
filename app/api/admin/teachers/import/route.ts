// app/api/admin/teachers/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import Papa from "papaparse";
import { createClient } from "@supabase/supabase-js";

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

    // Read and parse CSV file with PapaParse
    const fileContent = await file.text();

    interface CsvRow {
      [key: string]: string; // or any type you expect for CSV values
    }

    const parseResult = Papa.parse<CsvRow>(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    });

    if (parseResult.errors.length > 0) {
      throw new Error(`Error parsing CSV: ${parseResult.errors[0].message}`);
    }

    const records: CsvRow[] = parseResult.data;
    if (records.length === 0) {
      return NextResponse.json({ error: "File CSV kosong" }, { status: 400 });
    }

    // Validate required columns
    const requiredColumns = ["name", "email", "phone", "dateOfBirth"];
    const firstRecord = records[0];
    const missingColumns = requiredColumns.filter(
      (column) => !(column in firstRecord)
    );

    if (missingColumns.length > 0) {
      return NextResponse.json(
        {
          error: `Kolom yang diperlukan tidak ditemukan: ${missingColumns.join(
            ", "
          )}. Kolom yang diperlukan: name, email, phone, dateOfBirth`,
        },
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

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      teachers: [] as any[],
    };

    // Process each record
    for (const [index, record] of records.entries()) {
      try {
        const { name, email, phone, dateOfBirth } = record;

        // Skip empty rows that PapaParse might not filter
        if (!name && !email && !phone && !dateOfBirth) {
          continue;
        }

        // Validation
        if (!name?.trim()) {
          throw new Error("Nama guru wajib diisi");
        }

        if (!email?.trim()) {
          throw new Error("Email wajib diisi");
        }

        if (!phone?.trim()) {
          throw new Error("Nomor telepon wajib diisi");
        }

        if (!dateOfBirth) {
          throw new Error("Tanggal lahir wajib diisi");
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          throw new Error("Format email tidak valid");
        }

        // Validate date format (try to parse)
        const birthDate = new Date(dateOfBirth);
        if (isNaN(birthDate.getTime())) {
          throw new Error(
            "Format tanggal lahir tidak valid. Gunakan format YYYY-MM-DD"
          );
        }

        // Check if teacher already exists
        const existingTeacher = await prisma.teacher.findFirst({
          where: {
            OR: [{ email: email.trim() }, { phone: phone.trim() }],
          },
        });

        if (existingTeacher) {
          throw new Error(
            "Guru dengan email atau nomor telepon ini sudah terdaftar"
          );
        }

        let userId: string | null = null;

        // Send invitation email using Supabase Auth
        try {
          const { data: inviteData, error: inviteError } =
            await supabase.auth.admin.inviteUserByEmail(email.trim(), {
              data: {
                full_name: name.trim(),
                role: "TEACHER",
                phone: phone.trim(),
              },

              redirectTo: "/accept-invitation",
            });

          if (inviteError) {
            console.error(`Supabase invite error for ${email}:`, inviteError);

            // If user already exists, we can still proceed and try to get the user
            if (inviteError.message.includes("already registered")) {
              // Try to get existing user
              const {
                data: { users },
              } = await supabase.auth.admin.listUsers();
              const existingUser = users?.find((u) => u.email === email.trim());
              if (existingUser) {
                userId = existingUser.id;
              }
            } else {
              throw new Error(
                `Gagal mengirim undangan: ${inviteError.message}`
              );
            }
          } else {
            userId = inviteData.user?.id || null;
          }
        } catch (supabaseError) {
          console.error(`Supabase error for ${email}:`, supabaseError);
          // Continue without Supabase user creation
        }

        // Create teacher in database
        const teacher = await prisma.teacher.create({
          data: {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            dateOfBirth: birthDate,
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
          }
        }

        results.success++;
        results.teachers.push(teacher);
      } catch (error) {
        results.failed++;
        const errorMessage = `Baris ${index + 2}: ${
          error instanceof Error ? error.message : "Terjadi kesalahan"
        }`;
        results.errors.push(errorMessage);
        console.error(errorMessage);
      }
    }

    // If all records failed
    if (results.success === 0 && results.failed > 0) {
      return NextResponse.json(
        {
          error: "Import gagal",
          details: results.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: `Import selesai. Berhasil: ${results.success}, Gagal: ${results.failed}`,
      success: results.success,
      failed: results.failed,
      errors: results.errors,
      teachers: results.teachers,
    });
  } catch (error) {
    console.error("Error importing teachers:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
