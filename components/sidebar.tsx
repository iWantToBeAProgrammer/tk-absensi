import { MainNav } from "@/components/main-nav";

export function Sidebar() {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex h-14 items-center border-b pb-4">
        <h1 className="text-lg font-semibold">TK Absensi</h1>
      </div>
      <MainNav />
    </div>
  );
}
