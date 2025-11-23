import { Metadata } from "next";
import { redirect } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Login - TK Absensi",
  description: "Login ke Sistem Absensi TK",
};

export default async function LoginPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-slate-50 to-purple-50 flex flex-col items-center justify-center p-4">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src={"/assets/logo.webp"}
            width={100}
            height={100}
            alt="website_logo"
          />
          <p className="text-slate-600 text-center mt-2">
            Sistem Manajemen Kehadiran Terpadu
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Selamat Datang
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Masuk menggunakan kredensial Anda untuk melanjutkan
            </p>
          </div>

          <LoginForm />
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-slate-600">
          <p>Untuk bantuan teknis, hubungi admin sekolah Anda</p>
        </div>
      </div>
    </div>
  );
}
