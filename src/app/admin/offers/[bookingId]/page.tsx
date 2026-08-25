import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OfferEditorClient } from "@/components/admin/OfferEditorClient";
import { createOfferFromBooking } from "@/app/actions/offer";

export default async function OfferPage(props: { params: Promise<{ bookingId: string }> }) {
  const params = await props.params;
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: {
      offers: {
        include: { items: true }
      }
    }
  });

  if (!booking) {
    notFound();
  }

  // Auto-create offer if none exists
  let offer = booking.offers[0];
  if (!offer) {
    const res = await createOfferFromBooking(booking.id);
    if (res.success && res.offerId) {
      const newOffer = await prisma.offer.findUnique({
        where: { id: res.offerId },
        include: { items: true }
      });
      if (newOffer) offer = newOffer;
    }
  }

  if (!offer) {
    return <div className="p-8">Fehler beim Erstellen des Angebots.</div>;
  }

  return (
    <div className="p-8 md:p-12 max-w-5xl mx-auto">
      <Link href="/admin" className="inline-flex items-center text-blue-500 hover:underline mb-8 font-medium">
        <ArrowLeft size={16} className="mr-2" /> Zurück zur Übersicht
      </Link>
      
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Angebot: {offer.offerNumber}</h1>
        <p className="text-foreground/60 mt-1">Für: {booking.companyName || booking.name} ({booking.eventLocation || booking.type})</p>
      </div>

      <OfferEditorClient offer={offer} booking={booking} />
    </div>
  );
}
