// app/api/accept-invitation/route.js
import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password, access_token } = await request.json();

    // Use your Supabase service role key for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );


    // Verify the access token first
    const {
      data: { user },
      error: verifyError,
    } = await supabaseAdmin.auth.getUser(access_token);

    if (verifyError || !user) {
      return Response.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Update user password using admin API
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password }
    );

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ success: true, user: data.user });
  } catch (error) {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
