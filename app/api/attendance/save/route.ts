import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // CHECK AUTH -----------------------------------
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Unauthorized - Teacher not found" },
        { status: 401 }
      );
    }

    // READ BODY ------------------------------------
    const { classId, date, attendance } = await req.json();

    if (!classId || !attendance) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // SAVE ATTENDANCE -------------------------------
    const saveOps = attendance.map((item: any) =>
      prisma.attendance.upsert({
        where: {
          studentId_date: {
            studentId: item.studentId,
            date: new Date(date),
          },
        },
        update: {
          status: item.status,
        },
        create: {
          createdBy: teacher.id,
          studentId: item.studentId,
          classId,
          date: new Date(date),
          status: item.status,
        },
      })
    );

    await Promise.all(saveOps);

    return NextResponse.json(
      { message: "Attendance saved successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Save attendance API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
