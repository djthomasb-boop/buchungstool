"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import nodemailer from "nodemailer";

export async function createOfferFromBooking(bookingId: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      return { success: false, error: "Buchung nicht gefunden" };
    }

    // Generate Offer Number: AGB-YYYY-XXXX
    const year = new Date().getFullYear();
    const count = await prisma.offer.count({
      where: {
        offerNumber: {
          startsWith: `AGB-${year}-`
        }
      }
    });
    const offerNumber = `AGB-${year}-${String(count + 1).padStart(3, "0")}`;

    // Calculate initial items based on booking
    const items: { description: string; quantity: number; unitPrice: number; taxRate: number; totalPrice: number }[] = [];
    
    // Attempt basic pre-fill
    if (booking.totalPrice > 0) {
      // Just one generic item for now to match total price
      // The admin can edit this later
      const netPrice = booking.totalPrice / 1.19;
      items.push({
        description: `Leistungen für ${booking.eventType || booking.type}`,
        quantity: 1,
        unitPrice: netPrice,
        taxRate: 19,
        totalPrice: booking.totalPrice
      });
    }

    const subTotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const taxAmount = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice * (item.taxRate / 100)), 0);
    const totalPrice = subTotal + taxAmount;

    // valid for 14 days by default
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 14);

    const offer = await prisma.offer.create({
      data: {
        bookingId,
        offerNumber,
        status: "DRAFT",
        validUntil,
        customText: "Sehr geehrte(r) Herr/Frau " + booking.name + ",\n\nvielen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen folgendes Angebot:\n",
        subTotal,
        taxAmount,
        totalPrice,
        items: {
          create: items
        }
      }
    });

    revalidatePath(`/admin/bookings/${bookingId}`);
    return { success: true, offerId: offer.id };
  } catch (error: any) {
    console.error("Error creating offer:", error);
    return { success: false, error: error.message || "Ein Fehler ist aufgetreten" };
  }
}

export async function getOffer(offerId: string) {
  try {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        items: true,
        booking: true
      }
    });
    return { success: true, offer };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateOffer(
  offerId: string, 
  data: { validUntil: Date; customText: string; status: string },
  items: { id?: string; description: string; quantity: number; unitPrice: number; taxRate: number }[]
) {
  try {
    // Calculate totals
    const subTotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const taxAmount = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice * (item.taxRate / 100)), 0);
    const totalPrice = subTotal + taxAmount;

    // Delete existing items
    await prisma.offerItem.deleteMany({
      where: { offerId }
    });

    // Update offer and recreate items
    const updatedOffer = await prisma.offer.update({
      where: { id: offerId },
      data: {
        validUntil: data.validUntil,
        customText: data.customText,
        status: data.status,
        subTotal,
        taxAmount,
        totalPrice,
        items: {
          create: items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            totalPrice: item.quantity * item.unitPrice * (1 + item.taxRate / 100)
          }))
        }
      }
    });

    revalidatePath(`/admin/offers/${offerId}`);
    return { success: true, offer: updatedOffer };
  } catch (error: any) {
    console.error("Error updating offer:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteOffer(offerId: string, bookingId: string) {
  try {
    await prisma.offer.delete({
      where: { id: offerId }
    });
    revalidatePath(`/admin/bookings/${bookingId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendOfferEmail(offerId: string) {
  try {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { booking: true }
    });

    if (!offer || !offer.booking) {
      return { success: false, error: "Angebot nicht gefunden" };
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // We send a link instead of PDF attachment
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://booking.befree.works";
    const offerUrl = `${baseUrl}/angebot/${offer.id}`;

    const mailOptions = {
      from: `"be free Buchungssystem" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: offer.booking.email,
      subject: `Ihr Angebot Nr. ${offer.offerNumber} von be free`,
      text: `Sehr geehrte(r) Herr/Frau ${offer.booking.name},\n\nvielen Dank für Ihre Anfrage. Wir haben ein Angebot für Sie erstellt.\n\nBitte klicken Sie auf folgenden Link, um das Angebot einzusehen, als PDF herunterzuladen oder direkt anzunehmen:\n\n${offerUrl}\n\nMit freundlichen Grüßen\nIhr be free Team`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto;">
          <h2>Ihr Angebot ist da!</h2>
          <p>Sehr geehrte(r) Herr/Frau <strong>${offer.booking.name}</strong>,</p>
          <p>vielen Dank für Ihre Anfrage. Wir freuen uns, Ihnen heute unser Angebot <strong>${offer.offerNumber}</strong> übermitteln zu dürfen.</p>
          
          <div style="margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <p style="margin:0 0 15px 0;">Sie können Ihr Angebot online einsehen. Dort haben Sie die Möglichkeit, es als PDF herunterzuladen oder direkt mit einem Klick anzunehmen.</p>
            <a href="${offerUrl}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; font-weight: bold; border-radius: 6px;">Zum Angebot</a>
          </div>
          
          <p>Sollten Sie noch Fragen oder Änderungswünsche haben, antworten Sie gerne direkt auf diese E-Mail oder rufen Sie uns an.</p>
          <p>Mit freundlichen Grüßen<br><strong>Ihr be free Team</strong></p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    
    await prisma.offer.update({
      where: { id: offerId },
      data: { status: "SENT" }
    });

    revalidatePath(`/admin/offers/${offer.booking.id}`);
    
    return { success: true };
  } catch (error: any) {
    console.error("Fehler beim Senden des Angebots:", error);
    return { success: false, error: error.message };
  }
}
