# 🎓 Sistem Absensi TK (Kindergarten Attendance System)

Sistem manajemen dan absensi siswa untuk Taman Kanak-kanak dengan fitur lengkap untuk admin dan guru.

## 🌟 Fitur Utama

### 📊 Dashboard
- Statistik real-time (Total Siswa, Guru, Kelas, Kehadiran Hari Ini)
- Quick actions untuk navigasi cepat
- Informasi sistem dan tahun akademik aktif

### 👥 Manajemen Siswa
- CRUD lengkap untuk data siswa
- Filter dan pencarian siswa
- Kelompok siswa berdasarkan kelas
- Status siswa (Aktif/Alumni)
- Promosi siswa otomatis antar tingkat

### 👨‍🏫 Manajemen Guru
- CRUD lengkap untuk data guru
- Penugasan guru ke kelas
- Riwayat pengajar per kelas
- Kontak dan data pribadi guru

### 📚 Manajemen Kelas
- CRUD lengkap untuk kelas
- Pengelompokan berdasarkan tingkat (KB, TKA, TKB)
- Asosiasi dengan tahun akademik
- Informasi siswa dan guru per kelas

### 📅 Manajemen Tahun Akademik
- Buat dan kelola tahun akademik
- Aktivasi tahun akademik aktif
- Kelola kelas per tahun akademik
- Statistik per tahun akademik

### ✅ Sistem Absensi
- Pencatatan absensi dengan status (Hadir, Sakit, Izin, Alpa)
- Filter berdasarkan tanggal dan kelas
- Rekapitulasi absensi bulanan
- Export ke Excel

### 🔐 Sistem Autentikasi
- Autentikasi dengan Supabase Auth
- Registrasi pengguna baru
- Login dengan email dan password
- Role-based access control (Admin/Teacher)

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL dengan Prisma ORM
- **Authentication**: Supabase Auth
- **State Management**: React Context (Auth)
- **Form Handling**: React Hook Form + Zod

## 📋 Persyaratan

- Node.js 18+
- npm atau yarn
- PostgreSQL database
- Akun Supabase

## 🚀 Instalasi

### 1. Clone Repository
```bash
git clone <repository-url>
cd tk-absensi
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Buat file `.env.local` di root project:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/tk_absensi"
DIRECT_URL="postgresql://user:password@localhost:5432/tk_absensi"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-supabase-publishable-key"
```

### 4. Setup Database
```bash
# Jalankan migrasi Prisma
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate
```

## 🌱 Seed Database dengan Data Dummy

Kami menyediakan seeder lengkap dengan data dummy untuk testing:

### Jalankan Seeder
```bash
npm run db:seed
```

### Data yang Dibuat oleh Seeder:
- **1 Tahun Akademik**: 2024/2025 (Aktif)
- **4 Kelas**: 
  - Kelas KB A (KB)
  - Kelas KB B (KB)
  - Kelas TK A (TKA)
  - Kelas TK B (TKB)
- **4 Guru**:
  - Bu Siti Nurhaliza → Kelas KB A
  - Ibu Dewi Lestari → Kelas KB B
  - Ibu Rina Susanti → Kelas TK A
  - Ibu Ayu Wijaya → Kelas TK B
- **24 Siswa**: Tersebar di 4 kelas (6 siswa per kelas)
- **Attendance Records**: Data absensi untuk 5 hari kerja terakhir (120+ records)

### Data Seeder Aman
- Tidak menghapus data auth dari Supabase
- Hanya mengelola data di PostgreSQL
- Dapat dijalankan berkali-kali tanpa masalah

## 🏃 Menjalankan Aplikasi

### Development Mode
```bash
npm run dev
```
Akses aplikasi di `http://localhost:3000`

### Production Build
```bash
npm run build
npm start
```

## 📖 Panduan Penggunaan

### 1. Registrasi & Login
- Akses halaman login di `/login`
- Klik "Daftar di sini" untuk membuat akun baru
- Pilih role (Guru/Admin)
- Login dengan email dan password Anda

### 2. Mengakses Dashboard
Setelah login, Anda akan diarahkan ke dashboard dengan:
- Statistik sistem
- Quick actions untuk navigasi
- Informasi tahun akademik aktif

### 3. Mengelola Data
- **Siswa**: `/dashboard/students` - Tambah, edit, hapus siswa
- **Guru**: `/dashboard/teachers` - Kelola data dan penugasan guru
- **Kelas**: `/dashboard/classes` - Buat dan kelola kelas
- **Tahun Akademik**: `/dashboard/academic-years` - Atur tahun akademik
- **Absensi**: `/dashboard/attendance` - Pencatatan dan rekapitulasi absensi

## 🔌 API Endpoints

Semua endpoint diimplementasikan sebagai Server Actions Next.js:

### Students
- `getStudents(params)` - Fetch daftar siswa dengan pagination
- `getStudentById(id)` - Fetch siswa by ID
- `createStudent(data)` - Buat siswa baru
- `updateStudent(id, data)` - Update data siswa
- `deleteStudent(id)` - Hapus siswa
- `promoteStudents(fromLevel, toLevel)` - Promosi siswa antar tingkat

### Teachers
- `getTeachers()` - Fetch semua guru
- `createTeacher(...)` - Buat guru baru
- `updateTeacher(id, ...)` - Update data guru
- `deleteTeacher(id)` - Hapus guru
- `assignTeacherToClass(...)` - Tugaskan guru ke kelas
- `removeTeacherFromClass(...)` - Buka penugasan guru dari kelas

### Classes
- `getClasses()` - Fetch semua kelas
- `getClassById(id)` - Fetch kelas by ID
- `createClass(...)` - Buat kelas baru
- `updateClass(id, ...)` - Update kelas
- `deleteClass(id)` - Hapus kelas dan data terkait

### Attendance
- `getAttendanceRecords(...)` - Fetch records absensi dengan filter
- `markAttendance(...)` - Catat absensi siswa
- `getAttendanceSummary(...)` - Rekapitulasi absensi
- `exportAttendanceToExcel(...)` - Export absensi ke Excel

### Academic Years
- `getAcademicYears()` - Fetch semua tahun akademik
- `createAcademicYear(...)` - Buat tahun akademik
- `updateAcademicYear(...)` - Update tahun akademik
- `deleteAcademicYear(id)` - Hapus tahun akademik
- `getActiveAcademicYear()` - Fetch tahun akademik aktif

## 📊 Database Schema

### Models Utama:
- **AcademicYear**: Tahun akademik
- **Class**: Kelas
- **Student**: Siswa
- **Teacher**: Guru
- **TeacherClassAssignment**: Penugasan guru ke kelas
- **Attendance**: Record absensi

Lihat `prisma/schema.prisma` untuk detail lengkap.

## 🔒 Keamanan

- Autentikasi dengan Supabase Auth
- Authorization berbasis role (ADMIN/TEACHER)
- Server Actions untuk operasi database yang aman
- Environment variables untuk konfigurasi sensitif
- Password hashing otomatis oleh Supabase

## 🤝 Kontribusi

Contribution welcome! Silakan:
1. Fork repository
2. Buat branch fitur (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buka Pull Request

## 📝 Lisensi

Project ini dilisensikan di bawah MIT License.

## 📞 Support

Jika ada pertanyaan atau masalah, silakan buat issue di repository ini.

---

**Happy Coding! 🎉**
