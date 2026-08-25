export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { format, getISOWeek, subDays } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export default async function AdminDashboardPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const fourWeeksAgo = format(subDays(new Date(), 28), "yyyy-MM-dd");
  
  // Lade alle Buchungen der letzten 4 Wochen sowie kommende Buchungen
  const allBookings = await prisma.booking.findMany({
    where: {
      date: {
        gte: fourWeeksAgo
      }
    },
    orderBy: [
      { date: 'asc' },
      { time: 'asc' }
    ]
  });

  // Lade alle Schichteinteilungen der letzten 4 Wochen sowie kommende
  const allSchedules = await prisma.gastroSchedule.findMany({
    where: {
      date: {
        gte: fourWeeksAgo
      }
    },
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
        <p className="text-foreground/60 mt-1 mb-4">Aktuelle Buchungen sowie Archiv der letzten 4 Wochen im Überblick.</p>
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
