"use server";

import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import { headers } from "next/headers";
import { isBowlingBookingWithinOpeningHours } from "@/lib/bowlingRules";

export async function submitBooking(data: {
  type: string;
  date: string;
  time: string;
  duration: number;
  people: number;
  shoes: number;
  lanes: number | null;
  name: string;
  email: string;
  phone: string;
  wantsFood: boolean;
  bowlingFoodTiming?: string | null;
  notes: string;
  totalPrice: number;
  birthdayChildName?: string;
  birthdayChildAge?: number;
  kidsCount?: number;
  adultsCount?: number;
  package?: string;
  additions?: string;
  internalNotes?: string;
  squashRole?: string;
  squashCourseName?: string;
  eventLocation?: string;
  eventType?: string;
  eventSetupTime?: boolean;
  eventBuffet?: string;
  eventServiceStaff?: number;
  eventMusicTech?: string;
  eventDuration?: number;
  contactType?: string;
  companyName?: string;
  billingAddress?: string;
}) {
  try {
    if (data.type === "bowling" && !isBowlingBookingWithinOpeningHours(data.date, data.time, data.duration)) {
      return { success: false, error: "Bowling ist zu dieser Uhrzeit nicht buchbar." };
    }

    // 1. Save to Database
    const booking = await prisma.booking.create({
      data: {
        type: data.type,
        date: data.date,
        time: data.time,
        duration: data.duration,
        people: data.people,
        shoes: data.shoes,
        lanes: data.lanes,
        name: data.name,
        email: data.email,
        phone: data.phone,
        wantsFood: data.wantsFood,
        bowlingFoodTiming: data.bowlingFoodTiming,
        notes: data.notes,
        totalPrice: data.totalPrice,
        birthdayChildName: data.birthdayChildName,
        birthdayChildAge: data.birthdayChildAge,
        kidsCount: data.kidsCount,
        adultsCount: data.adultsCount,
        package: data.package,
        additions: data.additions,
        internalNotes: data.internalNotes,
        contactType: data.contactType || "privat",
        companyName: data.companyName,
        billingAddress: data.billingAddress,
        squashRole: data.squashRole,
        squashCourseName: data.squashCourseName,
        eventLocation: data.eventLocation,
        eventType: data.eventType,
        eventSetupTime: data.eventSetupTime || false,
        eventBuffet: data.eventBuffet,
        eventServiceStaff: data.eventServiceStaff,
        eventMusicTech: data.eventMusicTech,
        eventDuration: data.eventDuration,
      },
    });

    let emailSent = false;

    // 2. Fetch SMTP Settings
    try {
      const smtpHost = await prisma.setting.findUnique({ where: { key: "SMTP_HOST" } });
      const smtpPort = await prisma.setting.findUnique({ where: { key: "SMTP_PORT" } });
      const smtpUser = await prisma.setting.findUnique({ where: { key: "SMTP_USER" } });
      const smtpPass = await prisma.setting.findUnique({ where: { key: "SMTP_PASS" } });
      const smtpFrom = await prisma.setting.findUnique({ where: { key: "SMTP_FROM" } });

      // 3. Send Email (if configured)
      if (smtpHost?.value && smtpUser?.value && smtpPass?.value && smtpFrom?.value) {
        const transporter = nodemailer.createTransport({
          host: smtpHost.value,
          port: parseInt(smtpPort?.value || "587"),
          secure: parseInt(smtpPort?.value || "587") === 465,
          auth: {
            user: smtpUser.value,
            pass: smtpPass.value,
          },
        });

        const dateStr = new Date(data.date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
        
        let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        if (!baseUrl || baseUrl.includes("localhost")) {
          try {
            const reqHeaders = await headers();
            const host = reqHeaders.get("host");
            const proto = reqHeaders.get("x-forwarded-proto") || "http";
            if (host) {
              baseUrl = `${proto}://${host}`;
            }
          } catch (e) {
            // fallback
          }
        }
        if (!baseUrl) baseUrl = "http://localhost:3000";

        const bookingNumber = `BF-${booking.id.slice(-6).toUpperCase()}`;

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1e293b;">
            <div style="background-color: #3b82f6; padding: 32px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px;">Buchungsbestätigung</h1>
              <p style="margin: 8px 0 0 0; opacity: 0.9;">Sport & Erholungszentrum • Nr. ${bookingNumber}</p>
            </div>
            <div style="padding: 32px;">
              <p>Hallo <strong>${data.name}</strong>,</p>
              <p>vielen Dank für deine Buchung! Wir freuen uns auf deinen Besuch.</p>
              
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <h2 style="margin-top: 0; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">Deine Daten im Überblick</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; color: #64748b;">Buchungsnummer:</td><td style="padding: 8px 0; font-weight: bold; font-family: monospace; font-size: 15px; color: #2563eb;">${bookingNumber}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b;">Bereich:</td><td style="padding: 8px 0; font-weight: bold; text-transform: capitalize;">${data.type === 'kidsworld' ? 'Kindergeburtstag' : data.type}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b;">Datum:</td><td style="padding: 8px 0; font-weight: bold;">${dateStr}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b;">Uhrzeit:</td><td style="padding: 8px 0; font-weight: bold;">${data.time} Uhr (${data.duration}h)</td></tr>
                  ${data.type === 'kidsworld' ? `
                  <tr><td style="padding: 8px 0; color: #64748b;">Geburtstagskind:</td><td style="padding: 8px 0; font-weight: bold;">${data.birthdayChildName} (${data.birthdayChildAge} Jahre)</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b;">Paket:</td><td style="padding: 8px 0; font-weight: bold;">${data.package}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b;">Kinder:</td><td style="padding: 8px 0; font-weight: bold;">${data.kidsCount}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b;">Erwachsene:</td><td style="padding: 8px 0; font-weight: bold;">${data.adultsCount}</td></tr>
                  ${data.additions ? `<tr><td style="padding: 8px 0; color: #64748b;">Zusatzoptionen:</td><td style="padding: 8px 0; font-weight: bold;">${data.additions}</td></tr>` : ''}
                  ` : data.type === 'squash' && data.squashRole ? `
                  <tr><td style="padding: 8px 0; color: #64748b;">Kurs:</td><td style="padding: 8px 0; font-weight: bold;">${data.squashCourseName}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b;">Funktion:</td><td style="padding: 8px 0; font-weight: bold;">${data.squashRole}</td></tr>
                  ` : data.type === 'event' ? `
                  <tr><td style="padding: 8px 0; color: #64748b;">Location:</td><td style="padding: 8px 0; font-weight: bold;">${data.eventLocation}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b;">Event-Art:</td><td style="padding: 8px 0; font-weight: bold;">${data.eventType}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b;">Personen:</td><td style="padding: 8px 0; font-weight: bold;">${data.people}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b;">Paket:</td><td style="padding: 8px 0; font-weight: bold;">${data.package}</td></tr>
                  ${data.eventBuffet ? `<tr><td style="padding: 8px 0; color: #64748b;">Buffet:</td><td style="padding: 8px 0; font-weight: bold;">${data.eventBuffet}</td></tr>` : ''}
                  ${data.eventServiceStaff ? `<tr><td style="padding: 8px 0; color: #64748b;">Servicekräfte:</td><td style="padding: 8px 0; font-weight: bold;">${data.eventServiceStaff} (${data.eventDuration} Stunden)</td></tr>` : ''}
                  ${data.eventMusicTech ? `<tr><td style="padding: 8px 0; color: #64748b;">Musik & Ton:</td><td style="padding: 8px 0; font-weight: bold;">${data.eventMusicTech}</td></tr>` : ''}
                  <tr><td style="padding: 8px 0; color: #64748b;">Früher einräumen:</td><td style="padding: 8px 0; font-weight: bold;">${data.eventSetupTime ? 'Ja' : 'Nein'}</td></tr>
                  ` : `
                  <tr><td style="padding: 8px 0; color: #64748b;">Personen:</td><td style="padding: 8px 0; font-weight: bold;">${data.people}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b;">Extras:</td><td style="padding: 8px 0; font-weight: bold;">${data.wantsFood ? 'Gastronomie gewünscht 🍕' : 'Nur Aktivität'}</td></tr>
                  `}
                  <tr><td style="padding: 8px 0; color: #64748b;">Gesamtpreis:</td><td style="padding: 8px 0; font-weight: bold; font-size: 18px; color: #3b82f6;">${data.totalPrice.toFixed(2)} €</td></tr>
                </table>
              </div>

              ${data.notes ? `<div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px; margin-bottom: 24px;"><p style="margin: 0; font-size: 14px;"><strong>Deine Anmerkung:</strong> ${data.notes}</p></div>` : ''}

              <p>Die Bezahlung erfolgt bequem vor Ort.${data.type === 'bowling' ? ' Leihschuhe können vor Ort für 1,50 € pro Person geliehen werden.' : ''}</p>
              
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b;">
                <p style="margin-top: 0;"><strong>Termin verwalten (bearbeiten oder stornieren)?</strong></p>
                <p>Über den folgenden Link können Sie Ihre Buchung jederzeit online einsehen, bearbeiten oder bis zu 24 Stunden vor dem Termin kostenfrei stornieren:</p>
                <a href="${baseUrl}/manage-booking/${booking.id}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 8px;">Buchung verwalten / stornieren</a>
              </div>

              <p style="margin-top: 32px; margin-bottom: 0;">Wir freuen uns auf euch!<br/>Dein Team vom Sport & Erholungszentrum</p>
            </div>
          </div>
        `;

        // 1. E-Mail an den Kunden (nur wenn gültige Mailadresse)
        if (data.email && !data.email.includes("keine@") && !data.email.includes("intern@")) {
          await transporter.sendMail({
            from: `"Sport & Erholungszentrum" <${smtpFrom.value}>`,
            to: data.email,
            subject: `Buchungsbestätigung (${bookingNumber}): ${data.type.toUpperCase()} am ${dateStr}`,
            html: htmlContent,
          });
        }

        // 2. E-Mail an den Admin (als Kopie/Benachrichtigung)
        await transporter.sendMail({
          from: `"System - Buchungstool" <${smtpFrom.value}>`,
          to: smtpFrom.value, // Admin schickt sich selbst eine Info
          subject: `NEUE BUCHUNG: ${data.type.toUpperCase()} am ${dateStr} (${data.name})`,
          html: htmlContent,
        });

        emailSent = true;
      } else {
        console.warn("SMTP Settings incomplete. Email not sent.");
      }
    } catch (emailError) {
      console.error("Email sending failed (but booking was saved):", emailError);
    }

    // Always return success if DB creation was successful
    return { success: true, bookingId: booking.id, emailSent };
  } catch (error) {
    console.error("Database Booking Error:", error);
    return { success: false, error: "Datenbankfehler: Die Buchung konnte nicht gespeichert werden." };
  }
}

function timeToMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function filterTimesByBlock(
  defaultTimes: string[],
  block: { action: string; startTime: string | null; endTime: string | null } | null
): string[] {
  if (!block || (!block.startTime && !block.endTime)) {
    return defaultTimes;
  }
  const start = block.startTime || "00:00";
  const end = block.endTime || "23:59";
  
  if (block.action === "open") {
    // Only keep slots that fall within [start, end]
    return defaultTimes.filter(t => t >= start && t <= end);
  } else {
    // Exclude slots that fall within [start, end]
    return defaultTimes.filter(t => t < start || t > end);
  }
}

export async function getBowlingAvailability(date: string) {
  try {
    // 1. Check if the day is blocked
    const block = await prisma.blockedDay.findFirst({
      where: {
        date: date,
        OR: [
          { type: "all" },
          { type: "bowling" }
        ]
      }
    });

    if (block && block.action === "block" && !block.startTime && !block.endTime) {
      return { success: true, isBlocked: true, blockReason: block.reason, lanesUsed: Array(96).fill(4) };
    }

    // 2. Check regular bookings
    const bookings = await prisma.booking.findMany({
      where: {
        date: date,
        type: "bowling",
        status: "confirmed"
      }
    });

    // Array für jedes 15-Minuten-Intervall des Tages (96 Intervalle)
    const lanesUsed = Array(96).fill(0);

    // Apply block times if present
    if (block) {
      const startMin = timeToMins(block.startTime || "00:00");
      const endMin = timeToMins(block.endTime || "23:59");
      const startIdx = Math.floor(startMin / 15);
      const endIdx = Math.floor(endMin / 15);

      if (block.action === "block") {
        for (let i = startIdx; i < endIdx; i++) {
          if (i >= 0 && i < 96) lanesUsed[i] = 4;
        }
      } else if (block.action === "open") {
        for (let i = 0; i < 96; i++) {
          if (i < startIdx || i >= endIdx) {
            lanesUsed[i] = 4;
          }
        }
      }
    }

    bookings.forEach(booking => {
      if (!booking.time || !booking.lanes) return;
      
      const [hStr, mStr] = booking.time.split(":");
      const startHour = parseInt(hStr);
      const startMin = parseInt(mStr || "0");
      const startIdx = startHour * 4 + Math.floor(startMin / 15);
      const durationQuarters = booking.duration * 4;

      for (let i = startIdx; i < startIdx + durationQuarters; i++) {
        if (i < 96) {
          lanesUsed[i] += booking.lanes;
        }
      }
    });

    return { success: true, isBlocked: false, lanesUsed };
  } catch (error) {
    console.error("Availability Check Error:", error);
    return { success: false, error: "Verfügbarkeit konnte nicht geladen werden.", isBlocked: false, lanesUsed: Array(96).fill(0) };
  }
}

export async function getIndoorCapacity(date: string) {
  const bookings = await prisma.booking.findMany({
    where: {
      date: date,
      status: { not: "cancelled" },
      OR: [
        { type: "indoorspielplatz" },
        { type: "kidsworld", additions: { contains: "Ort: Indoor" } }
      ]
    }
  });

  let kidsBooked = 0;
  let adultsBooked = 0;

  bookings.forEach(b => {
    kidsBooked += (b.kidsCount || 0);
    adultsBooked += (b.adultsCount || 0);
  });

  return { kidsBooked, adultsBooked };
}

export async function getKindergeburtstagAvailability(date: string) {
  try {
    const d = new Date(date);
    const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, etc.
    
    // Default closed on Sun (0), Mon (1), Wed (3)
    let isRegularlyOpen = (dayOfWeek === 2 || dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6);
    const defaultTimes = ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];

    const block = await prisma.blockedDay.findFirst({
      where: {
        date: date,
        OR: [
          { type: "all" },
          { type: "kidsworld" }
        ]
      }
    });

    if (block) {
      if (block.action === "open") {
        isRegularlyOpen = true; // Special opening
      } else {
        if (!block.startTime && !block.endTime) {
          return { success: true, isBlocked: true, blockReason: block.reason || "Geschlossen", availableTimes: [] };
        }
      }
    }

    if (!isRegularlyOpen) {
      return { success: true, isBlocked: true, blockReason: "An diesem Wochentag regulär geschlossen", availableTimes: [] };
    }

    // Filter times based on block times
    let availableTimes = defaultTimes;
    if (block) {
      availableTimes = filterTimesByBlock(defaultTimes, block);
      if (availableTimes.length === 0) {
        return { success: true, isBlocked: true, blockReason: block.reason || "Geschlossen", availableTimes: [] };
      }
    }

    const capacity = await getIndoorCapacity(date);
    if (capacity.kidsBooked >= 60 || capacity.adultsBooked >= 60) {
      return { success: true, isBlocked: true, blockReason: "Indoor-Kapazität für diesen Tag erreicht.", availableTimes: [] };
    }

    return { success: true, isBlocked: false, capacity, availableTimes };
  } catch (error) {
    console.error("Kindergeburtstag Availability Check Error:", error);
    return { success: false, error: "Verfügbarkeit konnte nicht geladen werden.", isBlocked: false, availableTimes: [] };
  }
}

export async function getSquashAvailability(date: string) {
  try {
    const d = new Date(date);
    const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Check for general blocks
    const block = await prisma.blockedDay.findFirst({
      where: {
        date: date,
        OR: [{ type: "all" }, { type: "squash" }]
      }
    });

    let isRegularlyOpen = (dayOfWeek !== 0); // Open Mon-Sat, closed Sun

    if (block) {
      if (block.action === "open") {
        isRegularlyOpen = true;
      } else {
        if (!block.startTime && !block.endTime) {
          return { success: true, isBlocked: true, blockReason: block.reason || "Geschlossen", availableTimes: [] };
        }
      }
    }

    if (!isRegularlyOpen) {
      return { success: true, isBlocked: true, blockReason: "Sonntags ist geschlossen", availableTimes: [] };
    }

    // Generate all possible slots based on weekday or custom times
    const slots: string[] = [];
    const addSlotsForHour = (h: number) => {
      const hh = h.toString().padStart(2, '0');
      slots.push(`${hh}:00`);
      slots.push(`${hh}:15`);
      slots.push(`${hh}:30`);
      slots.push(`${hh}:45`);
    };

    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      // Montag - Freitag: 09:00 - 20:00 (letzter Termin 19:00)
      for (let h = 9; h <= 19; h++) {
        addSlotsForHour(h);
      }
    } else if (dayOfWeek === 6) {
      // Samstag: 14:00 - 20:00 (letzter Termin 19:00)
      for (let h = 14; h <= 19; h++) {
        addSlotsForHour(h);
      }
    } else if (dayOfWeek === 0) {
      // Sonderöffnung am Sonntag
      const startH = block?.startTime ? parseInt(block.startTime.split(":")[0]) : 9;
      const endH = block?.endTime ? parseInt(block.endTime.split(":")[0]) : 19;
      for (let h = startH; h <= endH; h++) {
        addSlotsForHour(h);
      }
    }

    let filteredSlots = slots;
    if (block) {
      filteredSlots = filterTimesByBlock(slots, block);
    }

    // Fetch existing bookings
    const bookings = await prisma.booking.findMany({
      where: {
        date: date,
        type: "squash",
        status: "confirmed"
      }
    });

    const bookedIntervals = bookings.map(b => {
      const start = timeToMins(b.time);
      return { start, end: start + (b.duration || 1) * 60 };
    });

    // Filter available
    const availableTimes = filteredSlots.filter(time => {
      const slotStart = timeToMins(time);
      const slotEnd = slotStart + 60; // Squash bookings are 1 hour
      return !bookedIntervals.some(b => slotStart < b.end && slotEnd > b.start);
    });

    return { success: true, isBlocked: false, availableTimes };
  } catch (error) {
    console.error("Squash Availability Error:", error);
    return { success: false, error: "Verfügbarkeit konnte nicht geladen werden.", isBlocked: false, availableTimes: [] };
  }
}

export async function getDartKegelnAvailability(date: string) {
  try {
    const d = new Date(date);
    const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Check for general blocks or specific dartkegeln blocks
    const block = await prisma.blockedDay.findFirst({
      where: {
        date: date,
        OR: [{ type: "all" }, { type: "dartkegeln" }]
      }
    });

    let isRegularlyOpen = (dayOfWeek !== 0); // Open Mon-Sat, closed Sun

    if (block) {
      if (block.action === "open") {
        isRegularlyOpen = true;
      } else {
        if (!block.startTime && !block.endTime) {
          return { success: true, isBlocked: true, blockReason: block.reason || "Geschlossen", availableTimes: [], bookedIntervals: [] };
        }
      }
    }

    if (!isRegularlyOpen) {
      return { success: true, isBlocked: true, blockReason: "Sonntags ist geschlossen", availableTimes: [], bookedIntervals: [] };
    }

    // Generate all possible slots based on weekday or custom times (same as bowling)
    const slots: string[] = [];
    const addSlotsForHour = (h: number) => {
      const hh = h.toString().padStart(2, '0');
      slots.push(`${hh}:00`);
      slots.push(`${hh}:30`);
    };

    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      // Montag - Freitag: 09:00 - 21:00 (letzter Termin 20:00)
      for (let h = 9; h <= 20; h++) {
        addSlotsForHour(h);
      }
    } else if (dayOfWeek === 6) {
      // Samstag: 14:00 - 22:00 (letzter Termin 21:00)
      for (let h = 14; h <= 21; h++) {
        addSlotsForHour(h);
      }
    } else if (dayOfWeek === 0) {
      // Sonderöffnung am Sonntag
      const startH = block?.startTime ? parseInt(block.startTime.split(":")[0]) : 9;
      const endH = block?.endTime ? parseInt(block.endTime.split(":")[0]) : 20;
      for (let h = startH; h <= endH; h++) {
        addSlotsForHour(h);
      }
    }

    let filteredSlots = slots;
    if (block) {
      filteredSlots = filterTimesByBlock(slots, block);
    }

    // Fetch existing bookings
    const bookings = await prisma.booking.findMany({
      where: {
        date: date,
        type: "dartkegeln",
        status: "confirmed"
      }
    });

    // Check if an all-day Event is booked
    const hasEvent = bookings.some(b => b.package === "Event" || b.time === "Ganztägig" || b.duration >= 10);
    if (hasEvent) {
      return { 
        success: true, 
        isBlocked: true, 
        blockReason: "Ganztägig für Event / Familien- & Firmenfeier belegt", 
        availableTimes: [], 
        bookedIntervals: [],
        existingBookings: []
      };
    }

    const bookedIntervals = bookings.map(b => {
      const start = b.time === "Ganztägig" ? 0 : timeToMins(b.time);
      return { start, end: start + (b.duration || 1) * 60 };
    });

    const existingBookings = bookings.map(b => {
      const isKurs = b.package === "Kurs" || b.package?.toLowerCase().includes("kurs");
      const start = b.time === "Ganztägig" ? 0 : timeToMins(b.time);
      const end = b.time === "Ganztägig" ? 24 * 60 : start + (b.duration || 1) * 60;
      return {
        id: b.id,
        package: b.package,
        time: b.time,
        duration: b.duration || 1,
        start,
        end,
        isKurs
      };
    });

    return { success: true, isBlocked: false, availableTimes: filteredSlots, bookedIntervals, existingBookings };
  } catch (error) {
    console.error("Dart/Kegeln Availability Error:", error);
    return { success: false, error: "Verfügbarkeit konnte nicht geladen werden.", isBlocked: false, availableTimes: [], bookedIntervals: [], existingBookings: [] };
  }
}
