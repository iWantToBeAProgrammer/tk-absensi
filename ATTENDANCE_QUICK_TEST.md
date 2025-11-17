# Attendance System - Quick Test Guide

## 🎯 5-Minute Quick Start

### Step 1: Start the Application
```bash
npm run dev
```
Open http://localhost:3000

### Step 2: Login
- Email: `teacher@example.com` (or any teacher account from seeded data)
- Password: `password123`
- Role: Select "TEACHER"

### Step 3: Test Attendance Input

**Navigate to:** Dashboard → Absensi → Input
Or directly: `http://localhost:3000/dashboard/attendance/input`

**Quick Test:**
1. ✅ Date field shows today's date
2. ✅ Class "Kelas A" auto-selected
3. ✅ 6 students display (from seeded data)
4. ✅ Click "Hadir" on first student → Green button + "Tercatat" badge
5. ✅ Progress shows "1/6"
6. ✅ Click "Simpan Absensi"
7. ✅ See success message: "✓ Absensi berhasil disimpan"

**Expected Time:** 2 minutes

### Step 4: Test Attendance Reports

**Navigate to:** Dashboard → Absensi → Laporan
Or directly: `http://localhost:3000/dashboard/attendance/reports`

**Quick Test:**
1. ✅ Class "Kelas A" auto-selected
2. ✅ Month defaults to current month
3. ✅ See 4 summary cards (Hadir, Sakit, Izin, Alpa)
4. ✅ If you have seeded data, numbers appear
5. ✅ See distribution bar chart
6. ✅ See student statistics table
7. ✅ See detail attendance records table

**Expected Time:** 1-2 minutes

---

## 📱 Test Different Scenarios

### Scenario 1: Multiple Students
```
1. Mark 3 students with different statuses:
   - Student 1: Hadir (green)
   - Student 2: Sakit (yellow)
   - Student 3: Alpa (red)
2. Progress shows "3/6"
3. Save - should create 3 records
```

### Scenario 2: Mobile Responsive
```
1. Open browser dev tools: F12
2. Toggle device toolbar: Ctrl+Shift+M
3. Select "iPhone 12" or similar
4. Test attendance input:
   ✓ Buttons in 2-column layout
   ✓ Save button sticky at bottom
   ✓ All clickable on touch
```

### Scenario 3: Different Class
```
1. On input page, change class to "Kelas B"
2. New students list should appear
3. Mark some students
4. Go to reports
5. Change to "Kelas B" - shows different data
```

### Scenario 4: Different Month
```
1. On reports page, change month to previous month
2. If seeded data exists from that month, shows records
3. Summary stats update
4. Change back to current month
```

---

## 🔍 Verify Database Changes

### Using Prisma Studio
```bash
npx prisma studio
```
- Navigate to "Attendance" table
- Filter by date = today
- Should see records you just created

### Using SQL
```sql
-- Check attendance records
SELECT * FROM "Attendance" 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- Check by class
SELECT a.*, s.name as student_name, c.name as class_name
FROM "Attendance" a
JOIN "Student" s ON a."studentId" = s.id
JOIN "Class" c ON a."classId" = c.id
WHERE c.name = 'Kelas A'
ORDER BY a.date DESC;
```

---

## ⚙️ Environment Setup for Testing

### Database Seeding (if not done)
```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Or just seed
npx prisma db seed
```

Seeded data includes:
- **4 Classes:** Kelas A, B, C, D
- **24 Students:** 6 per class
- **4 Teachers:** 1-4
- **120+ Attendance Records:** May 2024

### Create Test Teacher Account
If you want fresh account:
```bash
# Open http://localhost:3000/register
# Fill form:
# - Email: testteacher@example.com
# - Password: testpass123
# - Name: Test Teacher
# - Role: TEACHER
```

---

## 🧪 Test Checklist

### Attendance Input Page
- [ ] Page loads without errors
- [ ] Date field works
- [ ] Class dropdown loads with 4 classes
- [ ] Students list shows 6 students
- [ ] Clicking status button highlights it
- [ ] Badge shows "Tercatat" when marked
- [ ] Progress bar updates
- [ ] Progress text shows "X/Y"
- [ ] Clicking again deselects button
- [ ] Save button disabled when 0 marked
- [ ] Save button enabled when ≥1 marked
- [ ] Clicking save shows "Menyimpan..."
- [ ] Success toast appears
- [ ] Records saved to database
- [ ] On mobile: 2-column buttons
- [ ] On tablet: 4-column buttons

### Attendance Reports Page
- [ ] Page loads without errors
- [ ] Class dropdown shows 4 classes
- [ ] Month picker works
- [ ] Class auto-selects first option
- [ ] Month defaults to current
- [ ] 4 summary cards appear
- [ ] Distribution bar chart shows
- [ ] Student statistics table loads
- [ ] Detail records table loads
- [ ] Filter by class works
- [ ] Filter by month works
- [ ] Counts are accurate
- [ ] Status badges color-coded correctly
- [ ] Empty state message shows when appropriate
- [ ] On mobile: responsive layout

---

## 🐛 Common Issues & Solutions

### Issue: "Students Not Loading"
```
Solution:
1. Check database has students
   npx prisma studio → Student table
2. Verify they have classId assigned
3. Check API route works:
   curl http://localhost:3000/api/classes/CLASS_ID/students
```

### Issue: "Save Not Working"
```
Solution:
1. Check browser console for errors (F12)
2. Check terminal for server errors
3. Verify DATABASE_URL is set
4. Check Prisma can connect:
   npx prisma db execute --stdin < check.sql
```

### Issue: "Progress Not Updating"
```
Solution:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Restart dev server
3. Check React dev tools for state changes
```

### Issue: "Reports Show No Data"
```
Solution:
1. Run seed: npm run prisma:seed
2. Check Prisma Studio for Attendance records
3. Verify selected month matches record dates
4. Try May 2024 (seeded data month)
```

---

## 📊 Seeded Test Data Reference

### Classes
| ID | Name |
|----|------|
| 1 | Kelas A |
| 2 | Kelas B |
| 3 | Kelas C |
| 4 | Kelas D |

### Sample Students (Kelas A)
- Akira Tanaka
- Budi Santoso
- Citra Dewi
- Diana Rahmawati
- Eka Putri
- Fauzi Maulana

### Attendance Dates (Seeded)
- Multiple dates in May 2024
- Various statuses (HADIR, SAKIT, IZIN, ALPA)
- Use reports page to view all

---

## 💡 Pro Tips

1. **Keyboard Shortcuts**
   - F12: Open dev tools
   - Ctrl+Shift+M: Mobile view
   - Ctrl+Shift+C: Inspect element

2. **Testing Efficiently**
   - Use same browser tab for consistency
   - Test mobile BEFORE desktop
   - Check console errors as you go

3. **Database Inspection**
   - Prisma Studio is your friend
   - Use it to verify saves worked
   - Check timestamps match

4. **Performance Testing**
   - Network tab shows API calls
   - Check response times
   - Monitor for errors

---

## ✅ Success Criteria

✅ **Passing If:**
- [ ] Both pages load without 500 errors
- [ ] Attendance input saves successfully
- [ ] Reports display filtered data correctly
- [ ] Database records are accurate
- [ ] Mobile layout is responsive
- [ ] UI matches design specs
- [ ] No console errors

❌ **Failing If:**
- [ ] Pages show error messages
- [ ] Data doesn't save
- [ ] Charts/tables are empty when they shouldn't be
- [ ] Mobile layout breaks
- [ ] Console has TypeScript errors

---

## 📞 Need Help?

1. **Check Documentation**
   - `ATTENDANCE_IMPLEMENTATION.md` - Full guide
   - `ATTENDANCE_TEST_CASES.md` - Detailed test cases
   - `SETUP.md` - Initial setup

2. **Review Code**
   - Input page: `app/(dashboard)/attendance/input/page.tsx`
   - Reports page: `app/(dashboard)/attendance/reports/page.tsx`
   - Actions: `app/(dashboard)/attendance/actions.ts`
   - API: `app/api/classes/[classId]/students/route.ts`

3. **Check Logs**
   - Terminal: Server errors
   - Browser console (F12): Client errors
   - Prisma Studio: Database issues

---

**Estimated Total Test Time:** 5-10 minutes  
**Last Updated:** 2024  
**Version:** 1.0
