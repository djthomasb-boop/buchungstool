export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { format, getISOWeek } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export default async function AdminDashboardPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  
  // Das Archiv zeigt den vollstaendigen Datenbestand seit Aufzeichnungsbeginn.
  const allBookings = await prisma.booking.findMany({
    orderBy: [
      { date: 'asc' },
      { time: 'asc' }
    ]
  });

  const allSchedules = await prisma.gastroSchedule.findMany({
    include: {
      employee: true,
      shiftTime: true,
      area: true
    },
    orderBy: {
      date: 'asc'
    }
  });

  return (
    <div className="p-4 md:p-8 lg:p-12 max-w-[1400px] mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Tagesübersicht & Archiv</h1>
        <p className="text-foreground/60 mt-1 mb-4">Aktuelle Buchungen und das vollständige Archiv seit Aufzeichnungsbeginn.</p>
        <div className="inline-flex bg-blue-500/10 text-blue-600 px-4 py-2 rounded-xl font-bold items-center gap-2">
          <CalendarDays size={18} /> Heute ist der {format(new Date(), "dd. MMMM yyyy", { locale: de })} (KW {getISOWeek(new Date())})
        </div>
      </div>

      <AdminDashboardClient 
        initialBookings={JSON.parse(JSON.stringify(allBookings))} 
        initialSchedules={JSON.parse(JSON.stringify(allSchedules))}
        today={today} 
      />
    </div>
  );
}
