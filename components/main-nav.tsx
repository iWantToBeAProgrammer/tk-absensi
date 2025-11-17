"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  role: "ADMIN" | "TEACHER" | "ALL";
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    role: "ALL",
  },
  {
    title: "Siswa",
    href: "/students",
    role: "ADMIN",
  },
  {
    title: "Guru",
    href: "/teachers",
    role: "ADMIN",
  },
  {
    title: "Kelas",
    href: "/classes",
    role: "ADMIN",
  },
  {
    title: "Tahun Akademik",
    href: "/academic-years",
    role: "ADMIN",
  },
  {
    title: "Absensi",
    href: "/attendance",
    role: "ALL",
  },
  {
    title: "Laporan",
    href: "/reports",
    role: "ALL",
  },
];

export function MainNav() {
  const { user } = useAuth();
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2">
      {navItems
        .filter((item) => item.role === "ALL" || item.role === user?.role)
        .map((item) => (
          <Button
            key={item.href}
            variant={pathname === item.href ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start",
              pathname === item.href ? "bg-muted font-medium" : "hover:bg-muted"
            )}
            asChild
          >
            <Link href={item.href}>{item.title}</Link>
          </Button>
        ))}
    </nav>
  );
}
