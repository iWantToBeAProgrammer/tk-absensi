"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Helper function to generate breadcrumb from pathname
function generateBreadcrumbs(pathname: string) {
  if (pathname === "/") {
    return [
      {
        title: "Dashboard",
        href: "/",
        isCurrent: true,
      },
    ];
  }

  const paths = pathname.split("/").filter((path) => path);

  const breadcrumbs = paths.map((path, index) => {
    const href = "/" + paths.slice(0, index + 1).join("/");
    const title =
      path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");

    return {
      title,
      href,
      isCurrent: index === paths.length - 1,
    };
  });

  breadcrumbs.unshift({
    title: "Dashboard",
    href: "/",
    isCurrent: false,
  });

  return breadcrumbs;
}

// Page titles mapping
const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/admin/dashboard": "Admin Dashboard",
  "/my-classes": "Kelas Saya",
  "/teacher-attendance": "Presensi Saya", // Add this
  "/attendance": "Presensi Siswa",
  "/attendance/reports": "Laporan Presensi",
  "/students": "Kelola Siswa",
  "/classes": "Kelola Kelas",
  "/teachers": "Kelola Guru",
  "/academic-years": "Tahun Akademik",
};

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  image: string | null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<
    Array<{ title: string; href: string; isCurrent: boolean }>
  >([]);
  const [pageTitle, setPageTitle] = useState("Dashboard");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/user/role");

        if (response.ok) {
          const data = await response.json();
          setUserData(data.user);
        } else {
          console.error("Failed to fetch user role");
          setUserData(null);
        }
      } catch (error) {
        console.error("Error loading user:", error);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  useEffect(() => {
    const crumbs = generateBreadcrumbs(pathname);
    setBreadcrumbs(crumbs);

    const title =
      pageTitles[pathname] || crumbs[crumbs.length - 1]?.title || "Dashboard";
    setPageTitle(title);

    document.title = `${title} - TK Absensi`;
  }, [pathname]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Akses Ditolak</h1>
          <p className="text-muted-foreground mt-2">
            Silakan login terlebih dahulu
          </p>
        </div>
      </div>
    );
  }

  const roleDisplay = userData.role === "ADMIN" ? "Administrator" : "Guru";
  const userDisplayName = userData.name || userData.email || "User";

  return (
    <SidebarProvider>
      <AppSidebar userRole={userData.role as "ADMIN" | "TEACHER"} />
      <SidebarInset>
        {/* Header Section */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 px-4 lg:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 h-9 w-9 hover:bg-accent hover:text-accent-foreground transition-colors" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />

            {/* Page Title for Mobile */}
            <div className="block lg:hidden">
              <h1 className="text-lg font-semibold truncate max-w-[200px]">
                {pageTitle}
              </h1>
            </div>

            {/* Breadcrumb for Desktop */}
            <div className="hidden lg:block">
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, index) => (
                    <div key={crumb.href} className="flex items-center">
                      {index > 0 && <BreadcrumbSeparator />}
                      <BreadcrumbItem>
                        {crumb.isCurrent ? (
                          <BreadcrumbPage className="text-foreground font-medium">
                            {crumb.title}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink
                            href={crumb.href}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {crumb.title}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </div>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>

          {/* User Info/Status Area */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Sistem Aktif</span>
            </div>
            <Separator orientation="vertical" className="h-4 hidden sm:block" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="hidden md:flex flex-col text-right">
                <span className="font-medium text-foreground">
                  {userDisplayName}
                </span>
                <span>{roleDisplay}</span>
              </div>
              {userData.image && (
                <img
                  src={userData.image}
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {/* Page Header - Only show if not on dashboard */}
          {pathname !== "/" && pathname !== "/admin" && (
            <div className="border-b bg-muted/40">
              <div className="px-4 lg:px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                      {pageTitle}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      {getPageDescription(pathname)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderActionButtons(pathname)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Page Content */}
          <div className="p-4 lg:p-6">
            <div className="max-w-7xl mx-auto space-y-6">{children}</div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

// Helper function to get page descriptions
function getPageDescription(pathname: string): string {
  const descriptions: Record<string, string> = {
    "/": "Ringkasan aktivitas dan statistik sekolah",
    "/admin": "Overview lengkap sistem manajemen sekolah",
    "/my-classes": "Kelola kelas yang Anda ajar dan lihat statistik kehadiran",
    "/teacher-attendance": "Catat kehadiran Anda dengan verifikasi lokasi", // Add this
    "/attendance": "Rekam dan kelola kehadiran siswa",
    "/attendance/reports": "Lihat dan analisis laporan kehadiran",
    "/students": "Kelola data siswa dan informasi",
    "/classes": "Atur kelas dan penempatan siswa",
    "/teachers": "Kelola data guru dan pengajar",
    "/academic-years": "Kelola tahun akademik aktif",
  };

  return descriptions[pathname] || "Kelola data sekolah";
}

// Helper function to render action buttons based on current page
function renderActionButtons(pathname: string) {
  if (pathname === "/attendance") {
    return null; // Add specific buttons for attendance page
  }

  return null;
}
