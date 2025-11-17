import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function authenticateUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: "Unauthorized", status: 401 };
  }

  // Get user role from database
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, id: true },
  });

  if (!dbUser) {
    return { error: "User not found", status: 404 };
  }

  return { user: dbUser };
}

export async function requireAdmin() {
  const auth = await authenticateUser();

  if ("error" in auth) {
    return auth;
  }

  if (auth.user.role !== "ADMIN") {
    return { error: "Forbidden - Admin access required", status: 403 };
  }

  return { user: auth.user };
}
