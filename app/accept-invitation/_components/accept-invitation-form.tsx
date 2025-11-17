"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Lock, AlertCircle, Loader2, CheckCircle, Mail } from "lucide-react";
import { Label } from "@/components/ui/label";

const formSchema = z
  .object({
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

export default function AcceptInvitationForm() {
  const router = useRouter();
  const supabase = createClient();

  const [isLoading, setIsLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [accessToken, setAccessToken] = React.useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  // Parse hash fragment from URL
  React.useEffect(() => {
    const hash = window.location.hash;
    if (!hash) {
      setErrorMessage("Link undangan tidak valid.");
      return;
    }

    const params = new URLSearchParams(hash.replace("#", ""));
    const token = params.get("access_token");
    const type = params.get("type");

    console.log("URL params:", { token, type });

    if (!token || type !== "invite") {
      setErrorMessage("Link undangan tidak valid atau sudah kedaluwarsa.");
      return;
    }

    setAccessToken(token);

    // Extract email from token payload
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      console.log("Token payload:", payload);

      if (payload.email) {
        setUserEmail(payload.email);
      }
    } catch (err) {
      console.error("Error decoding token:", err);
    }
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!userEmail) {
      setErrorMessage("Email tidak ditemukan.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      console.log("Using admin API approach...");

      // This requires your server-side API route
      const response = await fetch("/api/accept-invitation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          password: values.password,
          access_token: accessToken,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result.error || "Gagal memproses undangan.");
        return;
      }

      console.log("Invitation accepted via admin API");

      setSuccess(true);

      setTimeout(() => {
        router.push("/dashboard?message=invitation-accepted");
      }, 2000);
    } catch (err: any) {
      console.error("Unexpected error:", err);
      setErrorMessage("Terjadi kesalahan sistem. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <h3 className="text-xl font-semibold text-slate-900">
          Undangan Berhasil Diterima!
        </h3>
        <p className="text-slate-600">
          Password berhasil disetel. Anda akan diarahkan ke dashboard...
        </p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-2" />
        <p className="text-red-800 font-medium">Error</p>
        <p className="text-red-700 text-sm mt-1">{errorMessage}</p>
        <div className="flex gap-2 justify-center mt-3">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Terima Undangan</h2>
        <p className="text-slate-600 mt-2">
          {userEmail
            ? `Setel password untuk akun ${userEmail}`
            : "Setel password untuk melanjutkan"}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {userEmail && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-slate-700 font-medium">
                <Mail className="h-4 w-4 text-slate-400" /> Email
              </Label>
              <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-sm text-slate-700">{userEmail}</span>
              </div>
            </div>
          )}

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password Baru</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Konfirmasi Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isLoading || !accessToken}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              "Setel Password & Terima Undangan"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
