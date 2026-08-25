"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveSmtpSettings(formData: FormData) {
  const host = formData.get("host") as string;
  const port = formData.get("port") as string;
  const user = formData.get("user") as string;
  const pass = formData.get("pass") as string;
  const from = formData.get("from") as string;

  await prisma.setting.upsert({ where: { key: "SMTP_HOST" }, update: { value: host }, create: { key: "SMTP_HOST", value: host } });
  await prisma.setting.upsert({ where: { key: "SMTP_PORT" }, update: { value: port }, create: { key: "SMTP_PORT", value: port } });
  await prisma.setting.upsert({ where: { key: "SMTP_USER" }, update: { value: user }, create: { key: "SMTP_USER", value: user } });
  await prisma.setting.upsert({ where: { key: "SMTP_PASS" }, update: { value: pass }, create: { key: "SMTP_PASS", value: pass } });
  await prisma.setting.upsert({ where: { key: "SMTP_FROM" }, update: { value: from }, create: { key: "SMTP_FROM", value: from } });

  revalidatePath("/admin/settings");
  
  return { success: true };
}
