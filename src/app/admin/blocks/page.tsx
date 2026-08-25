export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { AdminBlockForm } from "@/components/admin/AdminBlockForm";

export default async function AdminBlocksPage() {
  // Lade alle zukünftigen und aktuellen Sperrzeiten
  const today = new Date().toISOString().split('T')[0];
  const blockedDays = await prisma.blockedDay.findMany({
    where: {
      date: {
        gte: today
      }
    },
    orderBy: {
      date: 'asc'
    }
  });

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Sperrzeiten & Blockaden</h1>
        <p className="text-foreground/60 mt-1">Hier kannst du ganze Tage oder einzelne Bereiche für Buchungen blockieren (z.B. für Firmen-Events).</p>
      </div>

      <AdminBlockForm blockedDays={blockedDays} />
    </div>
  );
}
