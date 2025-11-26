import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Separator } from "./ui/separator";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  School,
  UserCog,
  BookOpen,
  Clock,
  LogOut,
  ChartAreaIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "./providers/auth-provider";

// Navigation data
const navigationData = {
  admin: [
    {
      title: "Main",
      items: [
        {
          title: "Dashboard",
          url: "/admin",
          icon: LayoutDashboard,
        },
        {
          title: "Tahun Akademik",
          url: "/admin/academic-years",
          icon: School,
        },
        {
          title: "Kelas",
          url: "/admin/classes",
          icon: BookOpen,
        },
      ],
    },
    {
      title: "Management",
      items: [
        {
          title: "Siswa",
          url: "/admin/students",
          icon: Users,
        },
        {
          title: "Guru",
          url: "/admin/teachers",
          icon: UserCog,
        },
      ],
    },
    {
      title: "Kehadiran",
      items: [
        {
          title: "Presensi",
          url: "/admin/attendance",
          icon: Calendar,
        },
        {
          title: "Rekap Statistik",
          url: "/admin/attendance/analytics",
          icon: ChartAreaIcon,
        },
      ],
    },
  ],
  teacher: [
    {
      title: "Main",
      items: [
        {
          title: "Dashboard",
          url: "/",
          icon: LayoutDashboard,
        },
        {
          title: "Kelas Saya",
          url: "/my-classes",
          icon: BookOpen,
        },
        {
          title: "Presensi Saya",
          url: "/teacher-attendance",
          icon: Clock,
        },
      ],
    },
    {
      title: "Kehadiran",
      items: [
        {
          title: "Presensi Siswa",
          url: "/attendance",
          icon: Calendar,
        },
        {
          title: "Laporan Presensi",
          url: "/attendance/reports",
          icon: FileText,
        },
      ],
    },
  ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userRole: "ADMIN" | "TEACHER";
}

export function AppSidebar({ userRole, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  const navItems =
    navigationData[userRole.toLowerCase() as keyof typeof navigationData];

  // Function to check if a menu item is active
  const isActive = (url: string) => {
    if (url === "/") {
      return pathname === "/";
    }

    if (url.startsWith("/admin")) {
      return pathname === url;
    }

    if(url.startsWith('/attendance')) {
      return pathname === url;
    }

    return pathname.startsWith(url);
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex h-16 items-center px-4 lg:px-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <School className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">TK Absensi</h1>
              <p className="text-xs font-medium text-muted-foreground">
                {userRole === "ADMIN" ? "Administrator" : "Teacher"}
              </p>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <Separator />

      <SidebarContent>
        {/* Navigation Groups */}
        {navItems.map((group, groupIndex) => (
          <SidebarGroup
            key={groupIndex}
            className="border-b border-border last:border-b-0"
          >
            {group.title && (
              <SidebarGroupLabel className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const IconComponent = item.icon;
                  const active = isActive(item.url);

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        size="lg"
                        className="transition-all duration-200 hover:scale-[0.98]"
                      >
                        <a
                          href={item.url}
                          className="flex items-center gap-3 font-medium px-3 py-3 rounded-lg transition-colors duration-200"
                          style={{
                            backgroundColor: active
                              ? "var(--sidebar-accent)"
                              : "transparent",
                            color: active
                              ? "var(--sidebar-accent-foreground)"
                              : "var(--sidebar-foreground)",
                          }}
                        >
                          <IconComponent
                            className="h-5 w-5 shrink-0"
                            style={{
                              color: active
                                ? "var(--sidebar-primary)"
                                : "var(--muted-foreground)",
                            }}
                          />
                          <span className="text-sm">{item.title}</span>
                          {active && (
                            <div
                              className="ml-auto h-2 w-2 rounded-full"
                              style={{
                                backgroundColor: "var(--sidebar-primary)",
                              }}
                            />
                          )}
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Sign Out Button */}
        <SidebarGroup className="mt-auto border-t border-border">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={async () => await signOut()}
                  size="lg"
                  className="transition-all duration-200 hover:scale-[0.98] text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <div className="flex items-center gap-3 font-medium px-3 py-3 rounded-lg">
                    <LogOut className="h-5 w-5 shrink-0" />
                    <span className="text-sm">Sign Out</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
