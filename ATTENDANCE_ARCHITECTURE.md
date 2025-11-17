# Attendance System - Architecture & Flow Diagrams

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/Next.js)                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐          ┌──────────────────┐        │
│  │  Attendance      │          │  Attendance      │        │
│  │  Input Page      │          │  Reports Page    │        │
│  │  (input/)        │          │  (reports/)      │        │
│  └────────┬─────────┘          └────────┬─────────┘        │
│           │                             │                   │
│           └─────────────────┬───────────┘                   │
│                             │                               │
│                    ┌────────▼────────┐                      │
│                    │  Server Actions │                      │
│                    │  (actions.ts)   │                      │
│                    └────────┬────────┘                      │
│                             │                               │
│                    ┌────────▼──────────────┐               │
│                    │  markAttendance()     │               │
│                    │  getAttendanceRecords │               │
│                    │  getAttendanceSummary │               │
│                    │  getClasses()         │               │
│                    └────────┬──────────────┘               │
└─────────────────────────────┼─────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   API Routes       │
                    │ /api/classes/...   │
                    └─────────┬──────────┘
                              │
┌─────────────────────────────▼──────────────────────────────┐
│                    Backend (Prisma/PostgreSQL)              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │            Prisma ORM                            │      │
│  ├──────────────────────────────────────────────────┤      │
│  │  Models:                                         │      │
│  │  - Attendance ─── Student (FK)                   │      │
│  │  - Attendance ─── Class (FK)                     │      │
│  │  - Attendance ─── Teacher (FK createdBy)         │      │
│  │  - Student ─── Class (FK)                        │      │
│  │  - Teacher ─── Class (through assignment)        │      │
│  └──────────────────────────────────────────────────┘      │
│                             │                               │
│           ┌─────────────────▼─────────────────┐             │
│           │   PostgreSQL Database             │             │
│           │                                   │             │
│           │ Tables:                           │             │
│           │ - Attendance                      │             │
│           │ - Student                         │             │
│           │ - Class                           │             │
│           │ - Teacher                         │             │
│           │ - AcademicYear                    │             │
│           │ - TeacherClassAssignment          │             │
│           └───────────────────────────────────┘             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow - Attendance Input

```
┌─────────────────┐
│  Teacher Opens  │
│  Input Page     │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────┐
│  Page Component Mounts       │
│  - useState(date, class, ...)│
│  - useEffect() calls         │
└────────┬─────────────────────┘
         │
         ├─► Call getClasses()
         │   Server Action
         │
         └─► Fetch API:
             GET /api/classes/{classId}/students
         
         ▼
┌──────────────────────────────┐
│  Render UI                   │
│  - Date picker               │
│  - Class selector            │
│  - Student list              │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Teacher Interactions        │
│  - Select date ✓             │
│  - Select class ✓            │
│  - Click status button ✓      │
│  - Track in state {}         │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Click "Simpan Absensi"      │
│  - Validate marked count > 0 │
│  - Loop through marked       │
└────────┬─────────────────────┘
         │
         ├─► For each marked student:
         │   Call markAttendance()
         │   Server Action
         │   
         │   Parameters:
         │   - studentId
         │   - classId
         │   - date
         │   - status (HADIR/SAKIT/...)
         │   - createdBy (teacher ID)
         │
         └─► Execute Promise.all()
         
         ▼
┌──────────────────────────────┐
│  Database Operation          │
│  - UPSERT attendance record  │
│  - Unique: (date, studentId) │
│  - Create if new             │
│  - Update if exists          │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Success Response            │
│  - { success: true, data: }  │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Show Toast Notification     │
│  "✓ Absensi berhasil disimpan"
└──────────────────────────────┘
```

---

## 📊 Data Flow - Attendance Reports

```
┌──────────────────────┐
│  Teacher Opens       │
│  Reports Page        │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────┐
│  Page Component Mounts           │
│  - useState(class, month, ...)   │
│  - useEffect() calls             │
└──────────┬───────────────────────┘
           │
           ├─► Call getClasses()
           │   Server Action
           │   ↓
           │   Auto-select first class
           │
           └─► Trigger useEffect
               (selectedClass changed)
           
           ▼
┌──────────────────────────────────┐
│  Load Data                       │
│  1. getAttendanceSummary()       │
│     Server Action                │
│     ↓                            │
│     Returns:                     │
│     { HADIR: n, SAKIT: n, ... }  │
│                                  │
│  2. getAttendanceRecords()       │
│     Server Action                │
│     ↓                            │
│     Returns:                     │
│     Attendance[] with relations  │
│                                  │
│  3. Filter by date range:        │
│     startDate = 1st of month     │
│     endDate = last of month      │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│  Transform Data                  │
│  - Aggregate by student          │
│  - Count each status             │
│  - Create student stats {}       │
│  - Create chart data             │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│  Render UI                       │
│  - Summary stats cards           │
│  - Distribution bar chart        │
│  - Student stats table           │
│  - Detail records table          │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│  User Changes Filter             │
│  - Selects different class OR    │
│  - Selects different month       │
│  ↓                               │
│  Trigger useEffect again         │
│  (repeat Data Loading)           │
└──────────────────────────────────┘
```

---

## 🗄️ Database Schema Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Student                                  │
├─────────────────────────────────────────────────────────────┤
│ PK: id                                                      │
│ - name                                                      │
│ - parentPhone                                               │
│ FK: classId → Class.id                                      │
│ - createdAt, updatedAt                                      │
└────────────────────┬────────────────────────────────────────┘
                     │ 1:N
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Attendance                                │
├─────────────────────────────────────────────────────────────┤
│ PK: id                                                      │
│ - date (DATE)                                               │
│ - status: HADIR | SAKIT | IZIN | ALPA                      │
│ FK: studentId → Student.id                                  │
│ FK: classId → Class.id                                      │
│ FK: createdBy → Teacher.id                                  │
│ UNIQUE: (date, studentId)  ◄─── Prevents duplicates        │
│ INDEX: classId, studentId, date                             │
│ - createdAt, updatedAt                                      │
└────────────────────┬──────────────────────────────────────┬─┘
                     │                                      │
                     │                                      │
                   1:N                                    1:N
                     │                                      │
                     ▼                                      ▼
            ┌──────────────────────┐        ┌──────────────────────┐
            │      Class           │        │      Teacher         │
            ├──────────────────────┤        ├──────────────────────┤
            │ PK: id               │        │ PK: id               │
            │ - name               │        │ - name               │
            │ FK: academicYearId   │        │ - email              │
            │ - createdAt,updatedAt│        │ - createdAt,updatedAt
            └──────────────────────┘        └──────────────────────┘
                     ▲
                     │
                   1:N (students)
                     │
            ┌────────────────────────────────────┐
            │   TeacherClassAssignment           │
            ├────────────────────────────────────┤
            │ PK: id                             │
            │ FK: teacherId → Teacher.id         │
            │ FK: classId → Class.id             │
            │ - createdAt, updatedAt             │
            └────────────────────────────────────┘
```

---

## 🔐 Data Security Flow

```
┌─────────────────────────────────────────┐
│   Input Request from Client             │
│   (attendance data to save)              │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   Server Action (Secure by Default)     │
│   - Runs only on server                 │
│   - Cannot be called from client code   │
│   - Input validation with Zod (ready)   │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   Prisma Client (Type-Safe)             │
│   - Prepared statements prevent SQL inj │
│   - Type validation                     │
│   - Auto-generated query builder        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   Database Constraints                  │
│   - UNIQUE(date, studentId)             │
│   - Foreign key constraints             │
│   - NOT NULL constraints                │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   Response to Client                    │
│   - Only requested data returned        │
│   - Sensitive data filtered             │
│   - Error messages safe                 │
└─────────────────────────────────────────┘
```

---

## 📈 Attendance Input - Component State Diagram

```
                      ┌─────────────────┐
                      │ Initial State   │
                      │                 │
                      │ classes: []     │
                      │ students: []    │
                      │ attendance: {}  │
                      │ loading: false  │
                      └────────┬────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Classes Loaded      │
                    │ via getClasses()    │
                    │                     │
                    │ classes: [...]      │
                    │ selectedClass set   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Students Loaded     │
                    │ for selected class  │
                    │                     │
                    │ students: [...]    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────────────┐
                    │ User Marks Student          │
                    │                             │
                    │ attendance[studentId] =     │
                    │   "HADIR"|"SAKIT"|...       │
                    │                             │
                    │ Button highlighted          │
                    │ Badge shown                 │
                    │ Progress updated            │
                    └──────────┬───────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            │                                     │
     ┌──────▼──────┐                      ┌──────▼──────┐
     │Toggle OFF   │                      │ Save Clicked│
     │(click again)│                      │             │
     │             │                      │ saving: true│
     │Deselected   │                      │ Loop &      │
     │Badge gone   │                      │ markAttend()│
     │Progress--  │                      │             │
     └──────┬──────┘                      └──────┬──────┘
            │                                    │
            │                            ┌───────▼─────┐
            │                            │ Save Success│
            │                            │             │
            │                            │ saved: true │
            │                            │ Toast shown │
            │                            │ After 3s:   │
            │                            │ saved: false│
            │                            └─────────────┘
            │
            └────────────────────┬─────────────────────┘
                                 │
                        ┌────────▼────────┐
                        │  Ready for      │
                        │  Next Date/Class│
                        └─────────────────┘
```

---

## 📑 Attendance Reports - Data Aggregation

```
Raw Attendance Records:
┌─────────────────────────────────────────────────────────┐
│ Date    │ Student  │ Class   │ Status │ CreatedBy      │
├─────────────────────────────────────────────────────────┤
│ 2024-05 │ Akira    │ Kelas A │ HADIR  │ teacher1       │
│ 2024-05 │ Budi     │ Kelas A │ SAKIT  │ teacher1       │
│ 2024-05 │ Citra    │ Kelas A │ HADIR  │ teacher1       │
│ 2024-05 │ Diana    │ Kelas A │ ALPA   │ teacher1       │
│ 2024-05 │ Eka      │ Kelas A │ IZIN   │ teacher1       │
│ 2024-05 │ Fauzi    │ Kelas A │ HADIR  │ teacher1       │
│ ...     │ ...      │ ...     │ ...    │ ...            │
└─────────────────────────────────────────────────────────┘

                            │
                            ▼

Aggregated by Status:
┌─────────────────────────────────┐
│ Summary Stats                   │
│                                 │
│ HADIR: 14                       │
│ SAKIT: 4                        │
│ IZIN: 3                         │
│ ALPA: 3                         │
│ ─────────                       │
│ Total: 24                       │
└─────────────────────────────────┘

                            │
                            ▼

Aggregated by Student:
┌────────────────────────────────────────┐
│ Student Stats Table                    │
├────────────────────────────────────────┤
│ Student │ Hadir │ Sakit │ Izin │ Alpa │
├────────────────────────────────────────┤
│ Akira   │  4    │  0    │  0   │  0   │
│ Budi    │  3    │  1    │  0   │  0   │
│ Citra   │  4    │  0    │  0   │  0   │
│ Diana   │  2    │  1    │  1   │  0   │
│ Eka     │  3    │  0    │  1   │  0   │
│ Fauzi   │  2    │  2    │  0   │  0   │
└────────────────────────────────────────┘

                            │
                            ▼

Distribution Chart:
┌──────────────────────────────────┐
│ Hadir    ░░░░░░░░░░░░░░░░░░ 58%  │
│ Sakit    ░░░░░░░░                 17%  │
│ Izin     ░░░░                      13%  │
│ Alpa     ░░░░                      13%  │
└──────────────────────────────────┘
```

---

## 🎯 Component Hierarchy

```
Input Page (/attendance/input)
├── Header (h1 "Pencatatan Absensi")
├── Filter Card
│   ├── Date Input
│   └── Class Select
├── Progress Card
│   ├── Progress Counter (X/Y)
│   └── Progress Bar
├── Student List (map)
│   └── Student Card (for each student)
│       ├── Student Name
│       ├── Marked Badge (conditional)
│       └── Status Buttons Grid
│           ├── Hadir Button
│           ├── Sakit Button
│           ├── Izin Button
│           └── Alpa Button
└── Save Section
    ├── Save Button
    └── Success Toast (conditional)

Reports Page (/attendance/reports)
├── Header (h1 "Laporan Absensi")
├── Filter Card
│   ├── Class Select
│   └── Month Input
├── Summary Stats Grid
│   ├── Hadir Card
│   ├── Sakit Card
│   ├── Izin Card
│   └── Alpa Card
├── Distribution Chart Card
│   └── Progress Bars (one per status)
├── Student Stats Card
│   └── Statistics Table
└── Detail Records Card
    ├── Records Table
    └── Export Button (placeholder)
```

---

## 🔄 State Management Flow

```
Input Page State:
┌──────────────────────────────────────┐
│ selectedDate: Date                   │
│ selectedClass: string (classId)      │
│ classes: Class[]                     │
│ students: Student[]                  │
│ attendance: {                        │
│   [studentId]: "HADIR"|"SAKIT"|...   │
│ }                                    │
│ loading: boolean                     │
│ saving: boolean                      │
│ saved: boolean                       │
└──────────────────────────────────────┘
         │
         ├─ User changes date
         │  → onChange event
         │  → setSelectedDate()
         │
         ├─ User changes class
         │  → onChange event
         │  → setSelectedClass()
         │  → useEffect fires
         │  → loadStudents()
         │
         ├─ User clicks status button
         │  → onClick event
         │  → handleMarkAttendance()
         │  → setAttendance()
         │
         └─ User clicks save
            → onClick event
            → handleSaveAttendance()
            → Promise.all(markAttendance calls)
            → setAttendance({}) (clear)
            → setSaved(true)
            → setTimeout(...) clear saved
```

---

**Diagram Notes:**
- All diagrams show production implementation
- Arrows (→, ▼) show data/control flow
- FK = Foreign Key, PK = Primary Key, UNIQUE = Database constraint
- Server Actions are always secure (no exceptions)
- All components are typed with TypeScript
