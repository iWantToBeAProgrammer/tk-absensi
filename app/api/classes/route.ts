import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const user = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const classes = await prisma.class.findMany({
    orderBy: { createdAt: "desc" },
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

  return NextResponse.json(classes);
}
