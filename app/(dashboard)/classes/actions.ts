"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getClasses() {
  try {
    const classes = await prisma.class.findMany({
      include: {
        academicYear: true,
        students: true,
        teacherAssignments: {
          include: {
            teacher: true,
          },
        },
        attendances: true,
      },
      orderBy: { name: "asc" },
    });

    return { success: true, data: classes };
  } catch (error) {
    console.error("Error fetching classes:", error);
    return { success: false, error: "Failed to fetch classes" };
  }
}

export async function getClassById(id: string) {
  try {
    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        academicYear: true,
        students: true,
        teacherAssignments: {
          include: {
            teacher: true,
          },
        },
        attendances: true,
      },
    });

    if (!classData) {
      return { success: false, error: "Class not found" };
    }

    return { success: true, data: classData };
  } catch (error) {
    console.error("Error fetching class:", error);
    return { success: false, error: "Failed to fetch class" };
  }
}

export async function createClass(
  name: string,
  level: "KB" | "TKA" | "TKB",
  academicYearId: string
) {
  try {
    const newClass = await prisma.class.create({
      data: {
        name,
        level,
        academicYearId,
      },
      include: {
        academicYear: true,
        students: true,
        teacherAssignments: {
          include: {
            teacher: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/classes");
    return { success: true, data: newClass };
  } catch (error) {
    console.error("Error creating class:", error);
    return { success: false, error: "Failed to create class" };
  }
}

export async function updateClass(
  id: string,
  name: string,
  level: "KB" | "TKA" | "TKB"
) {
  try {
    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        name,
        level,
      },
      include: {
        academicYear: true,
        students: true,
        teacherAssignments: {
          include: {
            teacher: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/classes");
    return { success: true, data: updatedClass };
  } catch (error) {
    console.error("Error updating class:", error);
    return { success: false, error: "Failed to update class" };
  }
}

export async function deleteClass(id: string) {
  try {
    // Delete all dependencies first
    await prisma.attendance.deleteMany({
      where: { classId: id },
    });

    await prisma.teacherClassAssignment.deleteMany({
      where: { classId: id },
    });

    await prisma.student.deleteMany({
      where: { classId: id },
    });

    await prisma.class.delete({
      where: { id },
    });

    revalidatePath("/dashboard/classes");
    return { success: true };
  } catch (error) {
    console.error("Error deleting class:", error);
    return { success: false, error: "Failed to delete class" };
  }
}
