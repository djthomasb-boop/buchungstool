export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { ManageBookingClient } from "./ManageBookingClient";

export default async function ManageBookingPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  
  const booking = await prisma.booking.findUnique({ where: { id } });

  if (!booking) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="glass p-12 rounded-3xl max-w-lg border border-red-500/20 shadow-2xl">
          <h1 className="text-3xl font-extrabold mb-4 text-red-500">Buchung nicht gefunden</h1>
          <p className="text-foreground/70">Der eingegebene Link ist ungültig oder die Buchung existiert nicht mehr.</p>
        </div>
      </main>
    );
  }

  const isAlreadyCancelled = booking.status === "cancelled";
  const bookingDateTime = new Date(`${booking.date}T${booking.time}:00`);
  const now = new Date();
  const hoursDifference = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  const isPast24h = hoursDifference < 24 && !isAlreadyCancelled;

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />

      <div className="glass p-6 sm:p-10 rounded-3xl max-w-2xl w-full border border-foreground/10 relative z-10 animate-slide-up shadow-2xl">
        <ManageBookingClient 
          booking={JSON.parse(JSON.stringify(booking))} 
          isPast24h={isPast24h} 
        />
      </div>
    </main>
  );
}
