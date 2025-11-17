# 📚 Complete Feature Documentation

## Overview

Sistem Absensi TK adalah aplikasi web lengkap untuk manajemen data siswa, guru, kelas, dan pencatatan absensi di Taman Kanak-kanak.

---

## 1. 🔐 Authentication & Authorization

### Fitur:
- Registrasi pengguna baru
- Login dengan email dan password
- Role-based access control (ADMIN/TEACHER)
- Automatic redirect berdasarkan auth status

### File Terkait:
- `/app/login/page.tsx` - Login page
- `/app/register/page.tsx` - Register page
- `/components/auth/auth-form.tsx` - Login form
- `/components/auth/register-form.tsx` - Register form
- `/lib/auth.ts` - Auth utilities
- `/lib/supabase/server.ts` - Server-side Supabase client
- `/middleware.ts` - Route protection middleware

### Alur:
1. User tanpa auth → redirect ke `/login`
2. User login/register → redirect ke `/dashboard`
3. Authenticated user → akses dashboard & fitur sesuai role

---

## 2. 📊 Dashboard

### Fitur:
- Statistik real-time (Total Siswa, Guru, Kelas, Kehadiran Hari Ini)
- Quick actions buttons
- Informasi tahun akademik aktif
- Status sistem

### File Terkait:
- `/app/(dashboard)/dashboard/page.tsx` - Dashboard main page

### Data yang Ditampilkan:
```
Total Siswa Aktif      → Dari model Student (status = ACTIVE)
Total Guru             → Count dari model Teacher
Total Kelas            → Count dari model Class
Kehadiran Hari Ini     → Attendance records status HADIR untuk hari ini
Tahun Akademik Aktif   → AcademicYear dengan isActive = true
```

---

## 3. 👥 Manajemen Siswa

### Fitur:
- View daftar siswa dengan pagination
- Pencarian siswa by name atau phone
- CRUD operations (Create, Read, Update, Delete)
- Filter berdasarkan kelas
- Status siswa (ACTIVE/ALUMNI)
- Foto profil siswa (optional)

### Atribut Siswa:
- Nama lengkap
- Jenis kelamin (MALE/FEMALE)
- Tanggal lahir
- Nomor telepon orang tua
- Alamat
- Foto profil
- Status (ACTIVE/ALUMNI)
- Kelas

### File Terkait:
- `/app/(dashboard)/students/page.tsx` - Students list page
- `/app/(dashboard)/students/actions.ts` - Server actions
- `/app/(dashboard)/students/columns.tsx` - Table columns definition
- `/app/(dashboard)/students/data-table.tsx` - Data table component

### Functions:
```typescript
// Server Actions di: /app/(dashboard)/students/actions.ts
getStudents(params)           // Fetch dengan pagination & search
getStudentById(id)            // Fetch single student
createStudent(data)           // Buat siswa baru
updateStudent(id, data)       // Update siswa
deleteStudent(id)             // Hapus siswa
promoteStudents(from, to)     // Promosi ke tingkat selanjutnya
```

---

## 4. 👨‍🏫 Manajemen Guru

### Fitur:
- View daftar guru
- CRUD operations
- Penugasan guru ke kelas
- Riwayat pengajar

### Atribut Guru:
- Nama lengkap
- Nomor telepon
- Tanggal lahir
- User ID (dari Supabase Auth)
- Daftar kelas yang diampu

### File Terkait:
- `/app/(dashboard)/teachers/page.tsx` - Teachers list page
- `/app/(dashboard)/teachers/actions.ts` - Server actions

### Functions:
```typescript
// Server Actions di: /app/(dashboard)/teachers/actions.ts
getTeachers()                        // Fetch all teachers
createTeacher(userId, name, ...)     // Buat guru baru
updateTeacher(id, name, ...)         // Update guru
deleteTeacher(id)                    // Hapus guru
assignTeacherToClass(teacherId, classId)    // Tugaskan ke kelas
removeTeacherFromClass(teacherId, classId)  // Buka penugasan
```

---

## 5. 📚 Manajemen Kelas

### Fitur:
- View daftar kelas
- CRUD operations
- Filter berdasarkan tingkat (KB, TKA, TKB)
- Asosiasi dengan tahun akademik
- Informasi siswa dan guru per kelas

### Atribut Kelas:
- Nama kelas
- Tingkat (KB/TKA/TKB)
- Tahun akademik
- Daftar siswa
- Daftar guru

### File Terkait:
- `/app/(dashboard)/classes/page.tsx` - Classes list page
- `/app/(dashboard)/classes/actions.ts` - Server actions

### Functions:
```typescript
// Server Actions di: /app/(dashboard)/classes/actions.ts
getClasses()                    // Fetch all classes
getClassById(id)                // Fetch single class
createClass(name, level, yearId)  // Buat kelas baru
updateClass(id, name, level)    // Update kelas
deleteClass(id)                 // Hapus kelas & data terkait
```

---

## 6. 📅 Manajemen Tahun Akademik

### Fitur:
- View daftar tahun akademik
- CRUD operations
- Aktivasi tahun akademik aktif
- Statistik per tahun akademik

### Atribut Tahun Akademik:
- Tahun (format: 2024/2025)
- Status aktif/tidak aktif
- Daftar kelas

### File Terkait:
- `/app/(dashboard)/academic-years/page.tsx` - Academic years list page
- `/app/(dashboard)/academic-years/actions.ts` - Server actions

### Functions:
```typescript
// Server Actions di: /app/(dashboard)/academic-years/actions.ts
getAcademicYears()                   // Fetch all years
getActiveAcademicYear()              // Fetch tahun yang aktif
createAcademicYear(year, isActive)   // Buat tahun baru
updateAcademicYear(id, year, active) // Update tahun
deleteAcademicYear(id)               // Hapus tahun & data terkait
```

**Penting**: Hanya satu tahun akademik yang dapat aktif sekaligus.

---

## 7. ✅ Sistem Absensi

### Fitur:
- Pencatatan absensi siswa
- Status absensi: HADIR, SAKIT, IZIN, ALPA
- Filter berdasarkan tanggal dan kelas
- Rekapitulasi absensi per bulan
- Export ke Excel (siap diimplementasikan)

### Atribut Absensi:
- Tanggal
- Status
- Siswa
- Kelas
- Guru yang mencatat
- Timestamp pencatatan

### File Terkait:
- `/app/(dashboard)/attendance/page.tsx` - Attendance page
- `/app/(dashboard)/attendance/actions.ts` - Server actions

### Functions:
```typescript
// Server Actions di: /app/(dashboard)/attendance/actions.ts
getAttendanceRecords(classId, date, studentId)  // Fetch attendance
markAttendance(studentId, classId, date, status, createdBy)  // Catat
getAttendanceSummary(classId, month)            // Rekapitulasi
exportAttendanceToExcel(classId, month)         // Export data
```

### Status Colors:
- HADIR → Green (Hijau)
- SAKIT → Yellow (Kuning)
- IZIN → Blue (Biru)
- ALPA → Red (Merah)

---

## 🌱 Data Seeder

### Apa yang Dibuat:

```
Academic Years (1):
├── 2024/2025 (Active)
│
├── Classes (4):
│   ├── Kelas KB A (Level: KB)
│   ├── Kelas KB B (Level: KB)
│   ├── Kelas TK A (Level: TKA)
│   └── Kelas TK B (Level: TKB)
│
├── Teachers (4):
│   ├── Bu Siti Nurhaliza → Kelas KB A
│   ├── Ibu Dewi Lestari → Kelas KB B
│   ├── Ibu Rina Susanti → Kelas TK A
│   └── Ibu Ayu Wijaya → Kelas TK B
│
├── Students (24): 6 siswa per kelas
│   ├── Dengan nama yang realistis
│   ├── Gender acak (MALE/FEMALE)
│   ├── Tanggal lahir: 2019-2021
│   └── Nomor telepon orang tua acak
│
└── Attendance Records (120+):
    ├── 5 hari kerja terakhir
    ├── Status acak: HADIR, SAKIT, IZIN, ALPA
    └── Setiap siswa memiliki record untuk setiap hari
```

### Jalankan Seeder:
```bash
npm run db:seed
```

### File Seeder:
- `/prisma/seed.ts` - Seeder script

---

## 📁 Project Structure

```
tk-absensi/
├── app/
│   ├── login/                          # Login page
│   ├── register/                       # Register page
│   ├── page.tsx                        # Root redirect
│   └── (dashboard)/
│       ├── dashboard/page.tsx          # Main dashboard
│       ├── students/
│       │   ├── page.tsx                # Students list
│       │   ├── actions.ts              # Server actions
│       │   ├── columns.tsx             # Table columns
│       │   └── data-table.tsx          # Table component
│       ├── teachers/
│       │   ├── page.tsx                # Teachers list
│       │   └── actions.ts              # Server actions
│       ├── classes/
│       │   ├── page.tsx                # Classes list
│       │   └── actions.ts              # Server actions
│       ├── attendance/
│       │   ├── page.tsx                # Attendance page
│       │   └── actions.ts              # Server actions
│       ├── academic-years/
│       │   ├── page.tsx                # Academic years list
│       │   └── actions.ts              # Server actions
│       └── layout.tsx                  # Dashboard layout
│
├── components/
│   ├── auth/
│   │   ├── auth-form.tsx               # Login form
│   │   └── register-form.tsx           # Register form
│   ├── ui/                             # shadcn/ui components
│   ├── header.tsx                      # Top header
│   ├── sidebar.tsx                     # Left sidebar
│   ├── main-nav.tsx                    # Navigation menu
│   └── providers/
│       └── auth-provider.tsx           # Auth context
│
├── lib/
│   ├── auth.ts                         # Auth utilities
│   ├── prisma.ts                       # Prisma singleton
│   ├── utils.ts                        # Utility functions
│   └── supabase/
│       ├── client.ts                   # Browser client
│       └── server.ts                   # Server client
│
├── prisma/
│   ├── schema.prisma                   # Database schema
│   └── seed.ts                         # Data seeder
│
├── middleware.ts                       # Next.js middleware
├── package.json                        # Dependencies
└── .env.local                          # Environment variables
```

---

## 🔄 Data Flow

### Login Flow:
```
User Visit / → Check Auth → No Auth → /login
                                    ↓
                        User Enter Credentials
                                    ↓
                        Supabase Validates
                                    ↓
                        Create Session
                                    ↓
                        Redirect to /dashboard
```

### Register Flow:
```
User Visit /register → Form Input
                        ↓
                    Validate with Zod
                        ↓
                    Call registerUser() Server Action
                        ↓
                    Supabase Auth signUp()
                        ↓
                    Auto Login
                        ↓
                    Redirect to /dashboard
```

### Data CRUD Flow:
```
User Interacts → Client Component
                        ↓
                    Call Server Action
                        ↓
                    Prisma Query Database
                        ↓
                    Revalidate Cache (if needed)
                        ↓
                    Return Result to Client
                        ↓
                    Update UI
```

---

## 🎯 Role-Based Features

### ADMIN Role Access:
- ✅ Dashboard
- ✅ Manajemen Siswa
- ✅ Manajemen Guru
- ✅ Manajemen Kelas
- ✅ Manajemen Tahun Akademik
- ✅ Absensi
- ✅ Laporan

### TEACHER Role Access:
- ✅ Dashboard
- ✅ Absensi
- ✅ Laporan (read-only)
- ❌ Manajemen Siswa
- ❌ Manajemen Guru
- ❌ Manajemen Kelas
- ❌ Manajemen Tahun Akademik

---

## 📊 Database Relations

```
AcademicYear (1) ──→ (Many) Class
                               ↓
                           (1)↓↓(Many)
                               ↓
                            Student
                               ↓
                          Attendance

Teacher (1) ──→ (Many) TeacherClassAssignment ←── (1) Class
                               ↓
                           (1)↓↓(Many)
                               ↓
                          Attendance
```

---

## ⚙️ Configuration

### Environment Variables:
```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="xxx"
```

### Prisma Config:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

---

## 🧪 Testing dengan Seed Data

Setelah menjalankan seeder, Anda dapat langsung:

1. Login dengan akun yang Anda buat saat register
2. Akses dashboard dengan statistik dummy
3. Lihat daftar siswa, guru, kelas
4. Check absensi dengan data 5 hari terakhir
5. Filter dan search data

---

## 📈 Future Enhancements

Fitur yang dapat ditambahkan:
- 📈 Advanced Reports & Analytics
- 📧 Email Notifications
- 📱 Mobile App Version
- 🔔 Push Notifications
- 📊 Data Export (PDF, Excel)
- 🎓 Progress Tracking
- 👨‍👩‍👧‍👦 Parent Portal
- 📋 Digital Report Card

---

**Dokumentasi Lengkap ✅**
