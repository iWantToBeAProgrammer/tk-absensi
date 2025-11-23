// app/auth/accept-invitation/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2, AlertCircle } from "lucide-react";
import AcceptInvitationForm from "./_components/accept-invitation-form";
import Image from "next/image";

export default function AcceptInvitationPage() {
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
          <p className="text-slate-600 text-center mt-2">Setel Password Akun</p>
        </div>

        {/* Accept Invitation Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Selamat Datang
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Setel password untuk akun Anda
            </p>
          </div>

          <AcceptInvitationForm />
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-slate-600">
          <p>Password harus minimal 6 karakter</p>
        </div>
      </div>
    </div>
  );
}
