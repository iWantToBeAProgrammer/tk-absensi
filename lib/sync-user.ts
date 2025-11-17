// lib/sync-user.js
import { prisma } from "@/lib/prisma";

export async function syncUserWithSupabase(authUser: any) {
  try {
    // Check if user already exists by auth_id
    let dbUser = await prisma.user.findUnique({
      where: { auth_id: authUser.id },
    });

    if (!dbUser) {
      // Check if user exists by email (for existing users)
      dbUser = await prisma.user.findUnique({
        where: { email: authUser.email },
      });

      if (dbUser) {
        // Update existing user with auth_id
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { auth_id: authUser.id },
        });
      } else {
        // Create new user
        dbUser = await prisma.user.create({
          data: {
            auth_id: authUser.id,
            email: authUser.email,
            name:
              authUser.user_metadata?.full_name || authUser.email.split("@")[0],
            role: "USER", // default role
            image: authUser.user_metadata?.avatar_url || null,
          },
        });
      }
    }

    return dbUser;
  } catch (error) {
    console.error("Error syncing user:", error);
    throw error;
  }
}
