// app/api/auth/user/route.js
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { syncUserWithSupabase } from "@/lib/sync-user";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Sync user with database
    const dbUser = await syncUserWithSupabase(authUser);

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return safe user data
    const safeUser = {
      id: dbUser.id,
      auth_id: dbUser?.auth_id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      image: dbUser.image,
    };

    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
