export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { SettingsTabsClient } from "./SettingsTabsClient";
import { getShiftMetadata } from "@/app/actions/shifts";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const resolvedParams = await searchParams;
  const initialTab =
    resolvedParams.tab === "dienstplan" || resolvedParams.tab === "update"
      ? resolvedParams.tab
      : "smtp";

  // Load SMTP Settings
  const host = await prisma.setting.findUnique({ where: { key: "SMTP_HOST" } });
  const port = await prisma.setting.findUnique({ where: { key: "SMTP_PORT" } });
  const user = await prisma.setting.findUnique({ where: { key: "SMTP_USER" } });
  const pass = await prisma.setting.findUnique({ where: { key: "SMTP_PASS" } });
  const from = await prisma.setting.findUnique({ where: { key: "SMTP_FROM" } });

  // Load Shift Metadata
  const rosterData = await getShiftMetadata();

  const smtpData = {
    host: host?.value || "",
    port: port?.value || "587",
    user: user?.value || "",
    pass: pass?.value || "",
    from: from?.value || ""
  };

  return (
    <div className="p-4 sm:p-6 md:p-12 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">System Einstellungen</h1>
        <p className="text-foreground/60 mt-1">Konfiguriere E-Mail-Dienste und verwalte den Roster-Dienstplan.</p>
      </div>

      <SettingsTabsClient 
        key={initialTab}
        initialTab={initialTab}
        smtpData={smtpData}
        rosterData={{
          employees: rosterData.employees || [],
          shiftTimes: rosterData.shiftTimes || [],
          areas: rosterData.areas || [],
          schedules: rosterData.schedules || []
        }}
      />
    </div>
  );
}
