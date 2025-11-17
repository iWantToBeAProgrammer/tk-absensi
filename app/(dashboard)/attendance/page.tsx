"use client";

import { useState, useEffect } from "react";
import { useStudents } from "@/hooks/use-students";
import { useClasses } from "@/hooks/use-classes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar as CalendarIcon, Search, Filter, Users, BookOpen, Download, Plus } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA';
  student: {
    id: string;
    name: string;
    class: {
      id: string;
      name: string;
    };
  };
  teacher?: {
    name: string;
  };
}

const statusConfig = {
  HADIR: {
    label: "Hadir",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: "✓"
  },
  SAKIT: {
    label: "Sakit", 
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: "🤒"
  },
  IZIN: {
    label: "Izin",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: "📝"
  },
  ALPA: {
    label: "Alpa",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: "❌"
  }
};

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const { data: students, isLoading: loadingStudents } = useStudents();
  const { data: classes, isLoading: loadingClasses } = useClasses();

  // Filter classes to only show active ones
  const activeClasses = classes?.filter(cls => 
    cls.academicYear.isActive
  ) || [];

  // Load attendance data
  useEffect(() => {
    loadAttendanceData();
  }, [selectedDate, selectedClass, students]);

  const loadAttendanceData = async () => {
    if (!students) return;

    setLoading(true);
    try {
      // Simulate API call - in real app, you'd fetch from your API
      const response = await fetch(`/api/attendance?date=${selectedDate.toISOString()}&classId=${selectedClass}`);
      if (response.ok) {
        const data = await response.json();
        setAttendanceData(data.attendance);
      } else {
        // Fallback: Generate mock data based on students
        const mockData = students
          .filter(student => 
            selectedClass === "all" || student.classId === selectedClass
          )
          .map(student => ({
            id: `att-${student.id}-${selectedDate.getTime()}`,
            date: selectedDate.toISOString(),
            status: ['HADIR', 'SAKIT', 'IZIN', 'ALPA'][Math.floor(Math.random() * 4)] as 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA',
            student: {
              id: student.id,
              name: student.name,
              class: {
                id: student.class.id,
                name: student.class.name
              }
            },
            teacher: {
              name: "Guru Kelas"
            }
          }));
        setAttendanceData(mockData);
      }
    } catch (error) {
      console.error("Error loading attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter attendance data based on search and filters
  const filteredAttendance = attendanceData.filter(record => {
    const matchesSearch = record.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.student.class.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    const matchesClass = selectedClass === "all" || record.student.class.id === selectedClass;
    
    return matchesSearch && matchesStatus && matchesClass;
  });

  // Calculate statistics
  const stats = {
    total: filteredAttendance.length,
    present: filteredAttendance.filter(a => a.status === 'HADIR').length,
    sick: filteredAttendance.filter(a => a.status === 'SAKIT').length,
    excused: filteredAttendance.filter(a => a.status === 'IZIN').length,
    absent: filteredAttendance.filter(a => a.status === 'ALPA').length,
    attendanceRate: filteredAttendance.length > 0 ? 
      (filteredAttendance.filter(a => a.status === 'HADIR').length / filteredAttendance.length) * 100 : 0
  };

  const handleExport = () => {
    // Simple CSV export
    const headers = ['Nama Siswa', 'Kelas', 'Status', 'Tanggal'];
    const csvData = filteredAttendance.map(record => [
      record.student.name,
      record.student.class.name,
      statusConfig[record.status].label,
      format(new Date(record.date), 'dd/MM/yyyy')
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `absensi-${format(selectedDate, 'dd-MM-yyyy')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loadingStudents || loadingClasses) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Absensi</h1>
          <p className="text-muted-foreground">
            Kelola dan lihat data kehadiran siswa
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Link href="/attendance/input">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Input Absensi
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <div className="h-4 w-4 text-green-600">✓</div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hadir</p>
                <p className="text-2xl font-bold">{stats.present}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <div className="h-4 w-4 text-yellow-600">🤒</div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sakit</p>
                <p className="text-2xl font-bold">{stats.sick}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <div className="h-4 w-4 text-blue-600">📝</div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Izin</p>
                <p className="text-2xl font-bold">{stats.excused}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <div className="h-4 w-4 text-red-600">❌</div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alpa</p>
                <p className="text-2xl font-bold">{stats.absent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Data
          </CardTitle>
          <CardDescription>
            Saring data absensi berdasarkan kriteria tertentu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {/* Date Picker */}
            <div className="space-y-2">
              <Label htmlFor="date">Tanggal</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP", { locale: id }) : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Class Filter */}
            <div className="space-y-2">
              <Label htmlFor="class">Kelas</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {activeClasses.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="HADIR">Hadir</SelectItem>
                  <SelectItem value="SAKIT">Sakit</SelectItem>
                  <SelectItem value="IZIN">Izin</SelectItem>
                  <SelectItem value="ALPA">Alpa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Cari</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari siswa atau kelas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Absensi</CardTitle>
          <CardDescription>
            Data kehadiran siswa per {format(selectedDate, "dd MMMM yyyy", { locale: id })}
            {selectedClass !== "all" && ` • Kelas ${activeClasses.find(c => c.id === selectedClass)?.name}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Memuat data absensi...</p>
              </div>
            </div>
          ) : filteredAttendance.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Tidak Ada Data</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {searchQuery || statusFilter !== "all" || selectedClass !== "all" 
                  ? "Tidak ada data yang sesuai dengan filter yang dipilih."
                  : "Belum ada data absensi untuk tanggal ini."
                }
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Dicatat Oleh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.student.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="text-xs">
                          {record.student.class.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={cn("text-xs", statusConfig[record.status].color)}
                        >
                          <span className="mr-1">{statusConfig[record.status].icon}</span>
                          {statusConfig[record.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(record.date), "dd MMM yyyy", { locale: id })}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {record.teacher?.name || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Summary */}
          {filteredAttendance.length > 0 && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Menampilkan {filteredAttendance.length} dari {attendanceData.length} data
                </span>
                <span className="font-medium">
                  Tingkat kehadiran: {stats.attendanceRate.toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Simple Link component for navigation
function Link({ href, children, ...props }: any) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}