import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  try {
    // Clear existing data
    await prisma.attendance.deleteMany({});
    await prisma.teacherClassAssignment.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.teacher.deleteMany({});
    await prisma.class.deleteMany({});
    await prisma.academicYear.deleteMany({});

    // Create Academic Year
    const academicYear = await prisma.academicYear.create({
      data: {
        year: "2024/2025",
        isActive: true,
      },
    });
    console.log("✓ Created academic year:", academicYear.year);

    // Create Classes
    const classes = await Promise.all([
      prisma.class.create({
        data: {
          name: "Kelas KB A",
          level: "KB",
          academicYearId: academicYear.id,
        },
      }),
      prisma.class.create({
        data: {
          name: "Kelas KB B",
          level: "KB",
          academicYearId: academicYear.id,
        },
      }),
      prisma.class.create({
        data: {
          name: "Kelas TK A",
          level: "TKA",
          academicYearId: academicYear.id,
        },
      }),
      prisma.class.create({
        data: {
          name: "Kelas TK B",
          level: "TKB",
          academicYearId: academicYear.id,
        },
      }),
    ]);
    console.log("✓ Created", classes.length, "classes");

    // Create Teachers
    const teachers = await Promise.all([
      prisma.teacher.create({
        data: {
          userId: "teacher-001", // These should match Supabase user IDs
          name: "Bu Siti Nurhaliza",
          phone: "081234567890",
          dateOfBirth: new Date("1985-05-15"),
        },
      }),
      prisma.teacher.create({
        data: {
          userId: "teacher-002",
          name: "Ibu Dewi Lestari",
          phone: "081234567891",
          dateOfBirth: new Date("1988-03-22"),
        },
      }),
      prisma.teacher.create({
        data: {
          userId: "teacher-003",
          name: "Ibu Rina Susanti",
          phone: "081234567892",
          dateOfBirth: new Date("1990-07-18"),
        },
      }),
      prisma.teacher.create({
        data: {
          userId: "teacher-004",
          name: "Ibu Ayu Wijaya",
          phone: "081234567893",
          dateOfBirth: new Date("1987-11-09"),
        },
      }),
    ]);
    console.log("✓ Created", teachers.length, "teachers");

    // Assign Teachers to Classes
    await Promise.all([
      prisma.teacherClassAssignment.create({
        data: {
          teacherId: teachers[0].id,
          classId: classes[0].id, // Bu Siti -> KB A
        },
      }),
      prisma.teacherClassAssignment.create({
        data: {
          teacherId: teachers[1].id,
          classId: classes[1].id, // Ibu Dewi -> KB B
        },
      }),
      prisma.teacherClassAssignment.create({
        data: {
          teacherId: teachers[2].id,
          classId: classes[2].id, // Ibu Rina -> TK A
        },
      }),
      prisma.teacherClassAssignment.create({
        data: {
          teacherId: teachers[3].id,
          classId: classes[3].id, // Ibu Ayu -> TK B
        },
      }),
    ]);
    console.log("✓ Assigned teachers to classes");

    // Create Students
    const studentNames = [
      { name: "Ahmad Rizki Pratama", class: 0, gender: "MALE" },
      { name: "Bella Putri Anjani", class: 0, gender: "FEMALE" },
      { name: "Candra Wijaya", class: 0, gender: "MALE" },
      { name: "Dina Nurmalasari", class: 0, gender: "FEMALE" },
      { name: "Eka Saputra", class: 0, gender: "MALE" },
      { name: "Fiona Kusuma", class: 0, gender: "FEMALE" },
      { name: "Gita Handoko", class: 1, gender: "FEMALE" },
      { name: "Hanif Maulana", class: 1, gender: "MALE" },
      { name: "Intan Permata", class: 1, gender: "FEMALE" },
      { name: "Joko Santoso", class: 1, gender: "MALE" },
      { name: "Kinara Putri", class: 1, gender: "FEMALE" },
      { name: "Leo Hartanto", class: 1, gender: "MALE" },
      { name: "Maya Sari", class: 2, gender: "FEMALE" },
      { name: "Nino Ramadhan", class: 2, gender: "MALE" },
      { name: "Olivia Kusuma", class: 2, gender: "FEMALE" },
      { name: "Prima Dharma", class: 2, gender: "MALE" },
      { name: "Qonita Raissa", class: 2, gender: "FEMALE" },
      { name: "Raka Suryanto", class: 2, gender: "MALE" },
      { name: "Sinta Berliana", class: 3, gender: "FEMALE" },
      { name: "Tommy Harahap", class: 3, gender: "MALE" },
      { name: "Umi Kalsum", class: 3, gender: "FEMALE" },
      { name: "Viky Nurwanto", class: 3, gender: "MALE" },
      { name: "Wulan Sari", class: 3, gender: "FEMALE" },
      { name: "Xander Wijaya", class: 3, gender: "MALE" },
    ];

    const students = await Promise.all(
      studentNames.map((student) =>
        prisma.student.create({
          data: {
            name: student.name,
            gender: student.gender as "MALE" | "FEMALE",
            dateOfBirth: new Date(
              2019 + Math.floor(Math.random() * 3),
              Math.floor(Math.random() * 12),
              Math.floor(Math.random() * 28) + 1
            ),
            parentPhone: `08${Math.floor(
              Math.random() * 9000000000 + 1000000000
            )}`,
            address: `Jl. Pendidikan No. ${
              Math.floor(Math.random() * 100) + 1
            }`,
            photoUrl: null,
            status: "ACTIVE",
            classId: classes[student.class].id,
          },
        })
      )
    );
    console.log("✓ Created", students.length, "students");

    // Create Attendance Records for the last 7 days
    const attendanceStatuses = ["HADIR", "SAKIT", "IZIN", "ALPA"];
    let attendanceCount = 0;

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const attendanceDate = new Date();
      attendanceDate.setDate(attendanceDate.getDate() - dayOffset);
      attendanceDate.setHours(0, 0, 0, 0);

      // Skip weekends
      if (attendanceDate.getDay() === 0 || attendanceDate.getDay() === 6) {
        continue;
      }

      for (const student of students) {
        const status =
          attendanceStatuses[
            Math.floor(Math.random() * attendanceStatuses.length)
          ];

        try {
          await prisma.attendance.create({
            data: {
              date: attendanceDate,
              status: status as "HADIR" | "SAKIT" | "IZIN" | "ALPA",
              studentId: student.id,
              classId: student.classId,
              createdBy:
                teachers[
                  Math.floor(
                    student.classId === classes[0].id
                      ? 0
                      : student.classId === classes[1].id
                      ? 1
                      : student.classId === classes[2].id
                      ? 2
                      : 3
                  )
                ].id,
            },
          });
          attendanceCount++;
        } catch (error) {
          // Handle unique constraint on (date, studentId)
          // Some records might already exist, that's okay
        }
      }
    }
    console.log("✓ Created", attendanceCount, "attendance records");

    console.log("\n✨ Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`  - Academic Year: ${academicYear.year}`);
    console.log(`  - Classes: ${classes.length}`);
    console.log(`  - Teachers: ${teachers.length}`);
    console.log(`  - Students: ${students.length}`);
    console.log(`  - Attendance Records: ${attendanceCount}`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
