"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Metadata (Employees, Shift Times, Areas, and Schedules)
export async function getShiftMetadata() {
  try {
    const employees = await prisma.gastroEmployee.findMany({
      orderBy: { name: "asc" },
    });
    const shiftTimes = await prisma.gastroShiftTime.findMany({
      orderBy: { name: "asc" },
    });
    const areas = await prisma.gastroArea.findMany({
      orderBy: { name: "asc" },
    });
    const schedules = await prisma.gastroSchedule.findMany({
      include: {
        employee: true,
        shiftTime: true,
        area: true,
      },
      orderBy: [
        { date: "asc" },
        { shiftTime: { name: "asc" } },
      ],
    });

    return {
      success: true,
      employees,
      shiftTimes,
      areas,
      schedules,
    };
  } catch (error) {
    console.error("Failed to load shift metadata:", error);
    return {
      success: false,
      error: "Fehler beim Laden der Roster-Stammdaten.",
      employees: [],
      shiftTimes: [],
      areas: [],
      schedules: [],
    };
  }
}

// Gastro Employee Actions
export async function addGastroEmployee(name: string) {
  if (!name || name.trim() === "") {
    return { success: false, error: "Name darf nicht leer sein." };
  }
  try {
    const existing = await prisma.gastroEmployee.findUnique({
      where: { name: name.trim() },
    });
    if (existing) {
      return { success: false, error: "Mitarbeiter existiert bereits." };
    }
    const employee = await prisma.gastroEmployee.create({
      data: { name: name.trim() },
    });
    revalidatePath("/admin/settings");
    return { success: true, employee };
  } catch (error) {
    console.error("Add employee error:", error);
    return { success: false, error: "Fehler beim Hinzufügen des Mitarbeiters." };
  }
}

export async function deleteGastroEmployee(id: string) {
  try {
    await prisma.gastroEmployee.delete({
      where: { id },
    });
    revalidatePath("/admin/settings");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Delete employee error:", error);
    return { success: false, error: "Fehler beim Löschen des Mitarbeiters." };
  }
}

// Gastro Shift Time Actions
export async function addGastroShiftTime(name: string) {
  if (!name || name.trim() === "") {
    return { success: false, error: "Schichtzeit darf nicht leer sein." };
  }
  try {
    const existing = await prisma.gastroShiftTime.findUnique({
      where: { name: name.trim() },
    });
    if (existing) {
      return { success: false, error: "Schichtzeit existiert bereits." };
    }
    const shiftTime = await prisma.gastroShiftTime.create({
      data: { name: name.trim() },
    });
    revalidatePath("/admin/settings");
    return { success: true, shiftTime };
  } catch (error) {
    console.error("Add shift time error:", error);
    return { success: false, error: "Fehler beim Hinzufügen der Schichtzeit." };
  }
}

export async function deleteGastroShiftTime(id: string) {
  try {
    await prisma.gastroShiftTime.delete({
      where: { id },
    });
    revalidatePath("/admin/settings");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Delete shift time error:", error);
    return { success: false, error: "Fehler beim Löschen der Schichtzeit." };
  }
}

// Gastro Area Actions
export async function addGastroArea(name: string) {
  if (!name || name.trim() === "") {
    return { success: false, error: "Bereich darf nicht leer sein." };
  }
  try {
    const existing = await prisma.gastroArea.findUnique({
      where: { name: name.trim() },
    });
    if (existing) {
      return { success: false, error: "Bereich existiert bereits." };
    }
    const area = await prisma.gastroArea.create({
      data: { name: name.trim() },
    });
    revalidatePath("/admin/settings");
    return { success: true, area };
  } catch (error) {
    console.error("Add area error:", error);
    return { success: false, error: "Fehler beim Hinzufügen des Bereichs." };
  }
}

export async function deleteGastroArea(id: string) {
  try {
    await prisma.gastroArea.delete({
      where: { id },
    });
    revalidatePath("/admin/settings");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Delete area error:", error);
    return { success: false, error: "Fehler beim Löschen des Bereichs." };
  }
}

// Gastro Schedule (Daily Shift Assignment) Actions
export async function addGastroSchedule(
  date: string,
  employeeId: string,
  shiftTimeId: string,
  areaId: string
) {
  if (!date || !employeeId || !shiftTimeId || !areaId) {
    return { success: false, error: "Bitte fülle alle Pflichtfelder aus." };
  }
  try {
    // Check if the exact entry already exists
    const existing = await prisma.gastroSchedule.findFirst({
      where: {
        date,
        employeeId,
        shiftTimeId,
        areaId,
      },
    });
    if (existing) {
      return { success: false, error: "Diese Einteilung existiert bereits für diesen Tag." };
    }

    const schedule = await prisma.gastroSchedule.create({
      data: {
        date,
        employeeId,
        shiftTimeId,
        areaId,
      },
    });

    revalidatePath("/admin/settings");
    revalidatePath("/admin");
    return { success: true, schedule };
  } catch (error) {
    console.error("Add schedule error:", error);
    return { success: false, error: "Fehler beim Eintragen der Schicht." };
  }
}

export async function deleteGastroSchedule(id: string) {
  try {
    await prisma.gastroSchedule.delete({
      where: { id },
    });
    revalidatePath("/admin/settings");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Delete schedule error:", error);
    return { success: false, error: "Fehler beim Löschen der Schicht." };
  }
}
