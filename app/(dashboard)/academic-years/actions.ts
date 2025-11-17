"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAcademicYears() {
  try {
    const academicYears = await prisma.academicYear.findMany({
      include: {
        classes: {
          include: {
            students: true,
          },
        },
      },
      orderBy: { year: "desc" },
    });

    return { success: true, data: academicYears };
  } catch (error) {
    console.error("Error fetching academic years:", error);
    return { success: false, error: "Failed to fetch academic years" };
  }
}

export async function createAcademicYear(
  year: string,
  isActive: boolean = false
) {
  try {
    // If setting as active, deactivate other years
    if (isActive) {
      await prisma.academicYear.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    const academicYear = await prisma.academicYear.create({
      data: {
        year,
        isActive,
      },
      include: {
        classes: true,
      },
    });

    revalidatePath("/dashboard/academic-years");
    return { success: true, data: academicYear };
  } catch (error) {
    console.error("Error creating academic year:", error);
    return { success: false, error: "Failed to create academic year" };
  }
}

export async function updateAcademicYear(
  id: string,
  year: string,
  isActive: boolean
) {
  try {
    // If setting as active, deactivate other years
    if (isActive) {
      await prisma.academicYear.updateMany({
        where: { isActive: true, id: { not: id } },
        data: { isActive: false },
      });
    }

    const academicYear = await prisma.academicYear.update({
      where: { id },
      data: {
        year,
        isActive,
      },
      include: {
        classes: {
          include: {
            students: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/academic-years");
    return { success: true, data: academicYear };
  } catch (error) {
    console.error("Error updating academic year:", error);
    return { success: false, error: "Failed to update academic year" };
  }
}

export async function deleteAcademicYear(id: string) {
  try {
    // Get all classes in this academic year
    const classes = await prisma.class.findMany({
      where: { academicYearId: id },
    });

    // Delete all attendances and teacher assignments for these classes
    for (const classItem of classes) {
      await prisma.attendance.deleteMany({
        where: { classId: classItem.id },
      });

      await prisma.teacherClassAssignment.deleteMany({
        where: { classId: classItem.id },
      });

      await prisma.student.deleteMany({
        where: { classId: classItem.id },
      });
    }

    // Delete all classes
    await prisma.class.deleteMany({
      where: { academicYearId: id },
    });

    // Delete the academic year
    await prisma.academicYear.delete({
      where: { id },
    });

    revalidatePath("/dashboard/academic-years");
    return { success: true };
  } catch (error) {
    console.error("Error deleting academic year:", error);
    return { success: false, error: "Failed to delete academic year" };
  }
}

export async function getActiveAcademicYear() {
  try {
    const academicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
      include: {
        classes: {
          include: {
            students: true,
            teacherAssignments: {
              include: {
                teacher: true,
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      data: academicYear,
    };
  } catch (error) {
    console.error("Error fetching active academic year:", error);
    return { success: false, error: "Failed to fetch active academic year" };
  }
}
