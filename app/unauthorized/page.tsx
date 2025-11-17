// app/unauthorized/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full space-y-8 p-6">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Akses Ditolak
          </h1>
          <p className="text-slate-600 mb-6">
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </p>
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/">Kembali ke Dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">Masuk dengan Akun Lain</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
