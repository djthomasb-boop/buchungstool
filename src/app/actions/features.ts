"use server";

import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export async function submitFeatureSuggestion(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const priority = formData.get("priority") as string;

    const smtpHost = await prisma.setting.findUnique({ where: { key: "SMTP_HOST" } });
    const smtpPort = await prisma.setting.findUnique({ where: { key: "SMTP_PORT" } });
    const smtpUser = await prisma.setting.findUnique({ where: { key: "SMTP_USER" } });
    const smtpPass = await prisma.setting.findUnique({ where: { key: "SMTP_PASS" } });
    const smtpFrom = await prisma.setting.findUnique({ where: { key: "SMTP_FROM" } });

    if (!smtpHost?.value || !smtpUser?.value || !smtpPass?.value || !smtpFrom?.value) {
      return { success: false, error: "SMTP-Einstellungen fehlen. E-Mail kann nicht gesendet werden." };
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost.value,
      port: parseInt(smtpPort?.value || "587"),
      secure: parseInt(smtpPort?.value || "587") === 465,
      auth: {
        user: smtpUser.value,
        pass: smtpPass.value,
      },
    });

    const priorityColors: Record<string, string> = {
      normal: "#3b82f6", // blue
      mittel: "#f59e0b", // yellow/orange
      hoch: "#ef4444", // red
    };

    const color = priorityColors[priority] || priorityColors.normal;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1e293b;">
        <div style="background-color: ${color}; padding: 32px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">Neuer Feature-Vorschlag</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">Buchungstool Sport & Erholungszentrum</p>
        </div>
        <div style="padding: 32px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #64748b; width: 150px;">Mitarbeiter:</td><td style="padding: 8px 0; font-weight: bold;">${name}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Priorität:</td><td style="padding: 8px 0; font-weight: bold; text-transform: capitalize; color: ${color};">${priority}</td></tr>
          </table>
          
          <h2 style="margin-top: 24px; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">Gewünschtes Feature</h2>
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-top: 12px; white-space: pre-wrap;">${description}</div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Feature Suggestion" <${smtpFrom.value}>`,
      to: "mail@dtbmediamix.de",
      subject: `[Feature-Vorschlag] ${name} (Prio: ${priority})`,
      html: htmlContent,
    });

    return { success: true };
  } catch (error) {
    console.error("Feature Submission Error:", error);
    return { success: false, error: "Fehler beim Senden der E-Mail." };
  }
}
