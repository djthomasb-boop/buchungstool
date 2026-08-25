export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { redirect } from "next/navigation";
import { PrintButton } from "./PrintButton";

export default async function KitchenPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  if (!date) {
    redirect("/admin");
  }

  // Lade alle bestätigten Buchungen für diesen Tag, die für die Küche relevant sind
  // (Kindergeburtstage, Events oder Bowling mit Verpflegung)
  const bookings = await prisma.booking.findMany({
    where: {
      date: date,
      status: "confirmed",
      OR: [
        { type: "kidsworld" },
        { type: "event" },
        { type: "bowling", wantsFood: true }
      ]
    },
    orderBy: {
      time: "asc"
    }
  });

  const formattedDate = format(new Date(date), "EEEE, dd. MMMM yyyy", { locale: de });

  return (
    <main className="min-h-screen bg-white text-black p-8 font-sans max-w-4xl mx-auto">
      {/* Aktionsleiste für den Admin (wird beim Drucken ausgeblendet) */}
      <div className="mb-8 flex justify-between items-center pb-4 border-b border-gray-300 print-hidden">
        <div>
          <h1 className="text-xl font-bold">Küchenzettel Druckansicht</h1>
          <p className="text-sm text-gray-500">Ausdruck für den {formattedDate}</p>
        </div>
        <div className="flex gap-3">
          <PrintButton />
          <a
            href="/admin"
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-bold rounded-lg transition-colors cursor-pointer"
          >
            Zurück zur Tagesübersicht
          </a>
        </div>
      </div>

      {/* Druck-Kopfzeile (wird NUR beim Drucken angezeigt) */}
      <div className="hidden print:block mb-6 pb-4 border-b-2 border-black">
        <h1 className="text-3xl font-black uppercase tracking-wider">Küchen-Plan</h1>
        <p className="text-lg font-bold">{formattedDate}</p>
      </div>

      {bookings.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-gray-300 rounded-2xl text-gray-500">
          Keine küchenrelevanten Veranstaltungen oder Kindergeburtstage für diesen Tag eingetragen.
        </div>
      ) : (
        <div className="space-y-8">
          {bookings.map((b) => {
            const isKids = b.type === "kidsworld";
            const isEvent = b.type === "event";
            const isBowling = b.type === "bowling";

            return (
              <div 
                key={b.id} 
                className="p-6 border-2 border-black rounded-xl bg-white space-y-4 break-inside-avoid"
              >
                {/* Header der Buchung */}
                <div className="flex justify-between items-start pb-2 border-b border-gray-300">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 border border-black rounded bg-gray-100">
                      {isKids ? "Kindergeburtstag" : isEvent ? "Event / Veranstaltung" : "Bowling mit Küche"}
                    </span>
                    <h2 className="text-xl font-black mt-1">
                      {b.time} Uhr (Dauer: {b.duration} Std.)
                    </h2>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 font-mono">ID: {b.id.substring(b.id.length - 6).toUpperCase()}</span>
                    <p className="font-bold text-sm">{b.name}</p>
                    {b.phone && <p className="text-xs text-gray-500">{b.phone}</p>}
                  </div>
                </div>

                {/* Details je nach Buchungstyp */}
                {isKids ? (
                  <div className="space-y-2 text-base">
                    <div>
                      <span className="font-bold">Kindergeburtstag</span>
                    </div>
                    <div>
                      <span className="font-bold">Anzahl Gäste:</span> {b.kidsCount ? `${b.kidsCount} Kinder` : ""}
                      {b.kidsCount && b.adultsCount ? " und " : ""}
                      {b.adultsCount ? `${b.adultsCount} Erwachsene` : ""}
                      {!b.kidsCount && !b.adultsCount ? "Keine Angabe" : ""}
                    </div>
                    <div>
                      <span className="font-bold">Paket:</span> {b.package || "Keines"}
                    </div>
                    <div>
                      <span className="font-bold">Kind:</span> {b.birthdayChildName || "Unbekannt"} 
                      {b.birthdayChildAge ? ` (${b.birthdayChildAge} Jahre)` : ""}
                    </div>
                    <div>
                      <span className="font-bold">Zusatzinfos:</span> {b.additions || "Keine"}
                    </div>
                  </div>
                ) : isEvent ? (
                  <div className="space-y-2 text-base">
                    <div>
                      <span className="font-bold">Veranstaltung / Event</span>
                    </div>
                    <div>
                      <span className="font-bold">Anzahl Gäste:</span> {b.people} Personen
                    </div>
                    <div>
                      <span className="font-bold">Ort:</span> {b.eventLocation || "Hauptraum"} ({b.eventType || "Event"})
                    </div>
                    <div>
                      <span className="font-bold">Paket/Buffet:</span> {b.package || b.eventBuffet || "Keines"}
                    </div>
                  </div>
                ) : (
                  // Bowling mit Küche
                  <div className="space-y-2 text-base">
                    <div>
                      <span className="font-bold">Bowling-Reservierung mit Speisen</span>
                    </div>
                    {b.package && (
                      <div>
                        <span className="font-bold">Paket:</span> <span className="text-blue-600 font-extrabold uppercase">{b.package}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-bold">Anzahl Gäste:</span> {b.people} Personen ({b.lanes} {b.lanes === 1 ? "Bahn" : "Bahnen"})
                    </div>
                    <div>
                      <span className="font-bold">Essenszeitpunkt:</span> <span className="uppercase font-bold">{b.bowlingFoodTiming === "vorher" ? "Vor dem Bowling" : b.bowlingFoodTiming === "mittendrin" ? "Mittendrin" : b.bowlingFoodTiming === "nachher" ? "Nach dem Bowling" : "Nicht spezifiziert"}</span>
                    </div>
                    <div>
                      <span className="font-bold">Ressourcen:</span> {b.assignedLanes || "Keine bestimmten Bahnen zugewiesen"}
                    </div>
                  </div>
                )}

                {/* Kundenwünsche (Besondere Infos) */}
                {b.notes && (
                  <div className="p-3 border border-black bg-gray-50 rounded-lg text-sm">
                    <strong className="font-bold block mb-1">Kundenwunsch / Anmerkungen:</strong>
                    <p className="whitespace-pre-line text-base text-gray-800">{b.notes}</p>
                  </div>
                )}

                {/* Interne Notizen */}
                {b.internalNotes && (
                  <div className="p-3 border border-dashed border-red-400 bg-red-50/20 rounded-lg text-sm">
                    <strong className="font-bold text-red-700 block mb-1">Interne Info (Service & Küche):</strong>
                    <p className="whitespace-pre-line text-base text-red-900">{b.internalNotes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
