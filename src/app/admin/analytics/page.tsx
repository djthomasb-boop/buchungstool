export const dynamic = "force-dynamic";

import { BarChart3 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { BookingAnalyticsClient } from "@/components/admin/BookingAnalyticsClient";

export default async function BookingAnalyticsPage() {
  const bookings = await prisma.booking.findMany({
    select: {
      id: true,
      type: true,
      date: true,
      time: true,
      duration: true,
      people: true,
      totalPrice: true,
      status: true,
      createdAt: true,
      name: true,
      email: true,
      phone: true,
    },
    orderBy: [
      { date: "desc" },
      { time: "desc" },
    ],
  });

  const serializableBookings = bookings.map((booking) => ({
    ...booking,
    createdAt: booking.createdAt.toISOString(),
  }));

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 py-6 md:px-8 md:py-10 lg:px-12">
      <header className="mb-8 flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
          <BarChart3 size={23} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Booking Analytics</h1>
          <p className="mt-1 text-sm md:text-base text-foreground/60">
            Alle Buchungen seit Aufzeichnungsbeginn, nach Zeitraum und Sektion auswertbar.
          </p>
        </div>
      </header>

      <BookingAnalyticsClient bookings={serializableBookings} />
    </div>
  );
}
