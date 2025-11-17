"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTeachers() {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        classAssignments: {
          include: {
            class: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return { success: true, data: teachers };
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return { success: false, error: "Failed to fetch teachers" };
  }
}

export async function createTeacher(
  userId: string,
  name: string,
  phone: string,
  dateOfBirth: Date
) {
  try {
    const teacher = await prisma.teacher.create({
      data: {
        userId,
        name,
        phone,
        dateOfBirth,
      },
      include: {
        classAssignments: {
          include: {
            class: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/teachers");
    return { success: true, data: teacher };
  } catch (error) {
    console.error("Error creating teacher:", error);
    return { success: false, error: "Failed to create teacher" };
  }
}

export async function updateTeacher(
  id: string,
  name: string,
  phone: string,
  dateOfBirth: Date
) {
  try {
    const teacher = await prisma.teacher.update({
      where: { id },
      data: {
        name,
        phone,
        dateOfBirth,
      },
      include: {
        classAssignments: {
          include: {
            class: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/teachers");
    return { success: true, data: teacher };
  } catch (error) {
    console.error("Error updating teacher:", error);
    return { success: false, error: "Failed to update teacher" };
  }
}

export async function deleteTeacher(id: string) {
  try {
    await prisma.teacherClassAssignment.deleteMany({
      where: { teacherId: id },
    });

    await prisma.teacher.delete({
      where: { id },
    });

    revalidatePath("/dashboard/teachers");
    return { success: true };
  } catch (error) {
    console.error("Error deleting teacher:", error);
    return { success: false, error: "Failed to delete teacher" };
  }
}

export async function assignTeacherToClass(teacherId: string, classId: string) {
  try {
    const assignment = await prisma.teacherClassAssignment.create({
      data: {
        teacherId,
        classId,
      },
      include: {
        teacher: true,
        class: true,
      },
    });

    revalidatePath("/dashboard/teachers");
    revalidatePath("/dashboard/classes");
    return { success: true, data: assignment };
  } catch (error) {
    console.error("Error assigning teacher:", error);
    return { success: false, error: "Failed to assign teacher to class" };
  }
}

export async function removeTeacherFromClass(
  teacherId: string,
  classId: string
) {
  try {
    await prisma.teacherClassAssignment.deleteMany({
      where: {
        teacherId,
        classId,
      },
    });

    revalidatePath("/dashboard/teachers");
    revalidatePath("/dashboard/classes");
    return { success: true };
  } catch (error) {
    console.error("Error removing teacher assignment:", error);
    return {
      success: false,
      error: "Failed to remove teacher from class",
    };
  }
}
