# 🚀 Quick Start Guide

Panduan singkat untuk memulai menggunakan Sistem Absensi TK.

## 5 Langkah Cepat

### 1️⃣ Setup Database & Environment

```bash
# Clone dan install
git clone <repo-url>
cd tk-absensi
npm install

# Buat file .env.local dengan konfigurasi:
# DATABASE_URL="postgresql://..."
# DIRECT_URL="postgresql://..."
# NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="xxx"

# Setup database
npx prisma migrate dev
```

### 2️⃣ Load Data Dummy (PENTING!)

```bash
npm run db:seed
```

✅ Ini akan membuat:
- 1 Tahun Akademik (2024/2025)
- 4 Kelas
- 4 Guru
- 24 Siswa
- 120+ Record Absensi

### 3️⃣ Jalankan Development Server

```bash
npm run dev
```

Akses di: `http://localhost:3000`

### 4️⃣ Registrasi & Login

1. Klik "Daftar di sini" di halaman login
2. Isi form:
   - **Nama Lengkap**: Nama Anda
   - **Email**: email@example.com
   - **Role**: Pilih Guru atau Admin
   - **Password**: Minimal 6 karakter
3. Klik "Daftar"
4. Anda akan otomatis login dan diarahkan ke dashboard

### 5️⃣ Explore Dashboard

Dashboard menampilkan:
- **Statistik**: Total Siswa, Guru, Kelas, Kehadiran Hari Ini
- **Quick Actions**: Navigasi cepat ke fitur utama
- **Informasi Sistem**: Status dan tahun akademik aktif

---

## 🗺️ Navigasi Menu

Dari sidebar, Anda bisa mengakses:

| Menu | URL | Akses | Deskripsi |
|------|-----|-------|-----------|
| Dashboard | `/dashboard/dashboard` | Semua | Statistik & overview |
| Siswa | `/dashboard/students` | Admin | Kelola data siswa |
| Guru | `/dashboard/teachers` | Admin | Kelola data guru |
| Kelas | `/dashboard/classes` | Admin | Kelola kelas |
| Tahun Akademik | `/dashboard/academic-years` | Admin | Atur tahun akademik |
| Absensi | `/dashboard/attendance` | Semua | Pencatatan & rekapitulasi |
| Laporan | `/dashboard/reports` | Semua | (Coming soon) |

---

## 📊 Data Dummy yang Tersedia

### Tahun Akademik
```
📅 2024/2025 (AKTIF)
```

### Kelas (4)
```
📚 Kelas KB A (Level: KB)
   └─ Guru: Bu Siti Nurhaliza
   └─ Siswa: 6 siswa

📚 Kelas KB B (Level: KB)
   └─ Guru: Ibu Dewi Lestari
   └─ Siswa: 6 siswa

📚 Kelas TK A (Level: TKA)
   └─ Guru: Ibu Rina Susanti
   └─ Siswa: 6 siswa

📚 Kelas TK B (Level: TKB)
   └─ Guru: Ibu Ayu Wijaya
   └─ Siswa: 6 siswa
```

### Guru (4)
```
👩‍🏫 Bu Siti Nurhaliza (1985-05-15) - 081234567890
👩‍🏫 Ibu Dewi Lestari (1988-03-22) - 081234567891
👩‍🏫 Ibu Rina Susanti (1990-07-18) - 081234567892
👩‍🏫 Ibu Ayu Wijaya (1987-11-09) - 081234567893
```

### Siswa (24)
```
Di setiap kelas terdapat 6 siswa dengan nama:
Ahmad Rizki Pratama, Bella Putri Anjani, Candra Wijaya,
Dina Nurmalasari, Eka Saputra, Fiona Kusuma,
Gita Handoko, Hanif Maulana, Intan Permata,
Joko Santoso, Kinara Putri, Leo Hartanto,
Maya Sari, Nino Ramadhan, Olivia Kusuma,
Prima Dharma, Qonita Raissa, Raka Suryanto,
Sinta Berliana, Tommy Harahap, Umi Kalsum,
Viky Nurwanto, Wulan Sari, Xander Wijaya
```

### Absensi
```
✅ Status: HADIR, SAKIT, IZIN, ALPA
📅 Periode: 5 hari kerja terakhir (Senin-Jumat)
👥 Total Records: 120+ (6 siswa × 4 kelas × 5 hari)
```

---

## 🎯 Scenario Testing

### Scenario 1: Admin Setup
```
1. Register sebagai ADMIN
2. Lihat dashboard → Statistik ditampilkan
3. Pergi ke Manajemen Siswa → Lihat 24 siswa
4. Pergi ke Manajemen Guru → Lihat 4 guru
5. Pergi ke Manajemen Kelas → Lihat 4 kelas
6. Pergi ke Tahun Akademik → Lihat 2024/2025 aktif
```

### Scenario 2: Check Attendance
```
1. Pergi ke Absensi
2. Pilih tanggal hari ini
3. Lihat daftar absensi 24 siswa
4. Filter berdasarkan kelas
5. Lihat breakdown status: HADIR, SAKIT, IZIN, ALPA
```

### Scenario 3: Manage Students
```
1. Pergi ke Siswa
2. Search siswa berdasarkan nama
3. Lihat detail siswa
4. Edit data siswa (opsional)
5. Lihat pagination untuk 10 siswa per halaman
```

---

## 🛠️ Troubleshooting

### Error: "Cannot find module '@prisma/client'"
```bash
# Solution:
npm install
npx prisma generate
```

### Error: "Database connection failed"
```bash
# Check:
1. DATABASE_URL & DIRECT_URL di .env.local
2. PostgreSQL service running
3. Database sudah dibuat
4. Network connectivity
```

### Error: "Supabase connection failed"
```bash
# Check:
1. NEXT_PUBLIC_SUPABASE_URL correct
2. NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY correct
3. Supabase project active
```

### Seeder tidak membuat data
```bash
# Make sure:
1. Database sudah migrasi: npx prisma migrate dev
2. Prisma client generated: npx prisma generate
3. Run seeder: npm run db:seed
4. Check database untuk melihat data
```

---

## 📚 Referensi Cepat

### Login Credentials
- **Email**: Gunakan email saat register
- **Password**: Password yang Anda buat
- **Role**: ADMIN atau TEACHER (saat register)

### Default Routes
- `/` → Redirect ke `/login` atau `/dashboard`
- `/login` → Login page
- `/register` → Register page
- `/dashboard` → Dashboard (protected)
- `/dashboard/[feature]` → Feature pages (protected)

### API Server Actions
Semua endpoint adalah Server Actions (Next.js):
- Berjalan di server-side
- Type-safe dengan TypeScript
- Automatic revalidation
- Secure dan aman

---

## ✅ Checklist Sebelum Production

- [ ] Setup Supabase project
- [ ] Setup PostgreSQL database
- [ ] Update environment variables
- [ ] Run database migrations
- [ ] Run seeder untuk test data
- [ ] Test login/register flow
- [ ] Test CRUD operations
- [ ] Test attendance features
- [ ] Setup SSL certificate
- [ ] Configure domain
- [ ] Test email notifications (jika ada)
- [ ] Setup monitoring & logging
- [ ] Create backup strategy
- [ ] Document deployment process

---

## 🎓 Learning Resources

Sistem ini menggunakan teknologi modern:
- **Next.js 16**: Full-stack React framework
- **Prisma ORM**: Database abstraction
- **Supabase Auth**: Authentication service
- **Tailwind CSS**: Utility-first CSS
- **shadcn/ui**: Accessible UI components
- **TypeScript**: Type-safe development

Pelajari lebih lanjut:
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 💡 Tips & Tricks

1. **Gunakan Prisma Studio** untuk explore database:
   ```bash
   npx prisma studio
   ```

2. **Check server logs** saat development:
   ```bash
   # Terminal akan menampilkan request logs
   ```

3. **Force refetch data**:
   ```bash
   # Gunakan revalidatePath() atau revalidateTag()
   ```

4. **Debug authentication**:
   ```typescript
   // Di server component:
   const user = await getUser();
   console.log('Current user:', user);
   ```

---

## 🚀 Next Steps

Setelah familiar dengan basic usage:

1. **Customize Data**: Edit seeder untuk sesuaikan dengan sekolah Anda
2. **Add Features**: Tambah fitur laporan, notifikasi, dll
3. **Deploy**: Deploy ke Vercel, Netlify, atau server sendiri
4. **Optimize**: Setup caching, indexing, monitoring
5. **Extend**: Tambah features sesuai kebutuhan

---

**Ready to go? Start with:** `npm run dev` 🎉
