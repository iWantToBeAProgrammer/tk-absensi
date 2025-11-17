"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@/lib/supabase/client";

interface AuthContextType {
  user: User | null;
  role: "ADMIN" | "TEACHER" | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"ADMIN" | "TEACHER" | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // Get user role from profiles table
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile) {
          setRole(profile.role);
        }
      }
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);

      if (event === "SIGNED_OUT") {
        setUser(null);
        setRole(null);
        router.refresh(); // Refresh the router to update middleware
      } else if (session?.user) {
        setUser(session.user);
        // Get user role from profiles table
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          setRole(profile.role);
        }
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const signOut = async () => {
    try {
      setLoading(true);

      // Option 1: Use API route
      const response = await fetch("/api/signout", { method: "POST" });

      if (!response.ok) {
        throw new Error("Sign out failed");
      }

      // Clear local state
      setUser(null);
      setRole(null);

      // Redirect to login
      window.location.href = "/login";
    } catch (error) {
      console.error("Sign out error:", error);
      // Fallback to client-side sign out
      await supabase.auth.signOut();
      setUser(null);
      setRole(null);
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
