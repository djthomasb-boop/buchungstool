"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { isBowlingBookingWithinOpeningHours } from "@/lib/bowlingRules";

export async function cancelBookingAdmin(id: string) {
  try {
    await prisma.booking.update({
      where: { id },
      data: { status: "cancelled" }
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Cancel Error:", error);
    return { success: false, error: "Fehler beim Stornieren." };
  }
}

export async function deleteBookingAdmin(id: string) {
  try {
    await prisma.booking.delete({
      where: { id }
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Delete Error:", error);
    return { success: false, error: "Fehler beim Löschen." };
  }
}

export async function updateBookingAdmin(id: string, data: any) {
  try {
    await prisma.booking.update({
      where: { id },
      data: {
        date: data.date,
        time: data.time,
        duration: parseInt(data.duration),
        people: parseInt(data.people) || 0,
        lanes: data.lanes ? parseInt(data.lanes) : null,
        assignedLanes: data.assignedLanes || null,
        name: data.name,
        email: data.email,
        phone: data.phone,
        wantsFood: data.wantsFood === "true" || data.wantsFood === true,
        bowlingFoodTiming: data.bowlingFoodTiming || null,
        notes: data.notes || null,
        totalPrice: parseFloat(data.totalPrice) || 0,
        birthdayChildName: data.birthdayChildName || null,
        birthdayChildAge: data.birthdayChildAge ? parseInt(data.birthdayChildAge) : null,
        kidsCount: data.kidsCount ? parseInt(data.kidsCount) : null,
        adultsCount: data.adultsCount ? parseInt(data.adultsCount) : null,
        package: data.package || null,
        additions: data.additions || null,
        internalNotes: data.internalNotes || null,
      }
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Update Error:", error);
    return { success: false, error: "Fehler beim Speichern der Änderungen." };
  }
}

export async function cancelBookingCustomer(id: string) {
  try {
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return { success: false, error: "Buchung nicht gefunden." };
    if (booking.status === "cancelled") return { success: false, error: "Buchung ist bereits storniert." };

    const bookingDateTime = new Date(`${booking.date}T${booking.time}:00`);
    const now = new Date();
    const hoursDifference = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDifference < 24) {
      return { success: false, error: "Eine Stornierung ist leider nur bis 24 Stunden vor dem Termin online möglich. Bitte rufen Sie uns an." };
    }

    await prisma.booking.update({
      where: { id },
      data: { status: "cancelled" }
    });
    
    // revalidatePath in case admin is looking
    revalidatePath("/admin");
    
    return { success: true };
  } catch (error) {
    console.error("Cancel Error:", error);
    return { success: false, error: "Systemfehler bei der Stornierung." };
  }
}

export async function getBlockedDays() {
  try {
    const days = await prisma.blockedDay.findMany({
      orderBy: { date: 'asc' }
    });
    return { success: true, days };
  } catch (error) {
    console.error("Get Blocked Days Error:", error);
    return { success: false, error: "Fehler beim Laden der Sperrzeiten." };
  }
}

export async function addBlockedDay(data: { 
  date: string; 
  type: string; 
  action?: string; 
  reason?: string;
  startTime?: string;
  endTime?: string;
}) {
  try {
    // Check if already exists for this exact date and type
    const existing = await prisma.blockedDay.findFirst({
      where: { date: data.date, type: data.type }
    });
    
    if (existing) {
      return { success: false, error: "Für dieses Datum und diesen Bereich existiert bereits ein Eintrag." };
    }

    await prisma.blockedDay.create({
      data: {
        date: data.date,
        type: data.type,
        action: data.action || "block",
        reason: data.reason || null,
        startTime: data.startTime || null,
        endTime: data.endTime || null
      }
    });
    revalidatePath("/admin/blocks");
    return { success: true };
  } catch (error) {
    console.error("Add Blocked Day Error:", error);
    return { success: false, error: "Fehler beim Hinzufügen der Sperrzeit." };
  }
}

export async function addBlockedDayRange(data: {
  startDate: string;
  endDate: string;
  weekdays: number[];
  type: string;
  action?: string;
  reason?: string;
  startTime?: string;
  endTime?: string;
}) {
  try {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return { success: false, error: "Ungültiger Datumsbereich." };
    }

    let createdCount = 0;
    let current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay(); // 0 = Sunday, 1 = Monday, etc.

      if (data.weekdays.includes(dayOfWeek)) {
        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, '0');
        const dd = String(current.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        const existing = await prisma.blockedDay.findFirst({
          where: { date: dateStr, type: data.type }
        });

        if (!existing) {
          await prisma.blockedDay.create({
            data: {
              date: dateStr,
              type: data.type,
              action: data.action || "block",
              reason: data.reason || null,
              startTime: data.startTime || null,
              endTime: data.endTime || null
            }
          });
          createdCount++;
        } else {
          // Update to match new rule
          await prisma.blockedDay.update({
            where: { id: existing.id },
            data: {
              action: data.action || "block",
              reason: data.reason || null,
              startTime: data.startTime || null,
              endTime: data.endTime || null
            }
          });
          createdCount++;
        }
      }
      current.setDate(current.getDate() + 1);
    }

    revalidatePath("/admin/blocks");
    return { success: true, message: `${createdCount} Tage erfolgreich aktualisiert/angelegt.` };
  } catch (error) {
    console.error("Add Blocked Day Range Error:", error);
    return { success: false, error: "Fehler beim Hinzufügen des Datumsbereichs." };
  }
}

export async function deleteBlockedDay(id: string) {
  try {
    await prisma.blockedDay.delete({ where: { id } });
    revalidatePath("/admin/blocks");
    return { success: true };
  } catch (error) {
    console.error("Delete Blocked Day Error:", error);
    return { success: false, error: "Fehler beim Löschen." };
  }
}

export async function updateBookingStatusAdmin(id: string, status: string) {
  try {
    await prisma.booking.update({
      where: { id },
      data: { status }
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Status Update Error:", error);
    return { success: false, error: "Fehler beim Aktualisieren des Status." };
  }
}

export async function updateBookingCustomer(id: string, data: {
  date: string;
  time: string;
  people: number;
  wantsFood?: boolean;
  bowlingFoodTiming?: string | null;
  notes?: string | null;
}) {
  try {
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return { success: false, error: "Buchung nicht gefunden." };
    if (booking.status === "cancelled") return { success: false, error: "Stornierte Buchungen können nicht bearbeitet werden." };

    const bookingDateTime = new Date(`${booking.date}T${booking.time}:00`);
    const now = new Date();
    const hoursDifference = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDifference < 24) {
      return { success: false, error: "Änderungen sind online nur bis 24 Stunden vor dem Termin möglich. Bitte rufen Sie uns an." };
    }

    if (booking.type === "bowling" && !isBowlingBookingWithinOpeningHours(data.date, data.time, booking.duration || 1)) {
      return { success: false, error: "Bowling ist zu dieser Uhrzeit nicht buchbar." };
    }

    // Recalculate price if bowling or dartkegeln
    let totalPrice = booking.totalPrice;
    if (booking.type === "bowling") {
      const durationHours = booking.duration || 1;
      const hourlyRate = 15;
      const calculatedLanes = Math.ceil(data.people / 8);
      totalPrice = calculatedLanes * hourlyRate * durationHours;
    } else if (booking.type === "dartkegeln") {
      const durationHours = booking.duration || 1;
      if (booking.package === "Kegeln" || booking.package === "Dart") {
        totalPrice = 10 * durationHours;
      }
    }

    await prisma.booking.update({
      where: { id },
      data: {
        date: data.date,
        time: data.time,
        people: data.people,
        wantsFood: data.wantsFood !== undefined ? data.wantsFood : booking.wantsFood,
        bowlingFoodTiming: data.bowlingFoodTiming !== undefined ? data.bowlingFoodTiming : booking.bowlingFoodTiming,
        notes: data.notes !== undefined ? data.notes : booking.notes,
        totalPrice: totalPrice,
        lanes: Math.ceil(data.people / 8)
      }
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Customer Update Error:", error);
    return { success: false, error: "Fehler beim Aktualisieren der Buchung." };
  }
}
