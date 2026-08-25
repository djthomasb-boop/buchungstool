"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveManualText(formData: FormData) {
  const text = formData.get("text") as string;
  await prisma.setting.upsert({ 
    where: { key: "MANUAL_TEXT" }, 
    update: { value: text }, 
    create: { key: "MANUAL_TEXT", value: text } 
  });
  revalidatePath("/admin/manual");
  return { success: true };
}
