import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { AuthProvider } from "@/components/providers/auth-provider";
import "./globals.css";
import { QueryClientProvider } from "@/components/query-client-provider";

export const metadata: Metadata = {
  title: "TK Absensi",
  description: "Sistem Absensi TK",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} antialiased`}>
        <QueryClientProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
