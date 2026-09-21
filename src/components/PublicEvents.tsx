import { CalendarDays, Clock3, ImageIcon, MapPin, Ticket } from "lucide-react";
import type { PublicTaskcenterEvent } from "@/lib/taskcenter";

function formatEventDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const parsedDate = new Date(year, month - 1, day);

  return {
    day: String(day).padStart(2, "0"),
    month: parsedDate.toLocaleDateString("de-DE", { month: "short" }).replace(".", "").toUpperCase(),
    full: parsedDate.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }),
  };
}

export function PublicEvents({ events }: { events: PublicTaskcenterEvent[] }) {
  const ticketShopUrl = process.env.NEXT_PUBLIC_TICKET_SHOP_URL || "https://befree.world/event-tickets";

  return (
    <section className="max-w-6xl mx-auto mt-20" aria-labelledby="events-heading">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-sm font-bold uppercase text-[#f23529] mb-2">Veranstaltungen</p>
          <h2 id="events-heading" className="text-3xl md:text-4xl font-black">Alle Events</h2>
        </div>
        <CalendarDays className="text-[#f23529]" size={32} aria-hidden="true" />
      </div>

      {events.length === 0 ? (
        <div className="border-y border-foreground/10 py-10 text-center text-foreground/60">
          Aktuell sind keine kommenden Veranstaltungen veröffentlicht.
        </div>
      ) : (
        <div className="divide-y divide-foreground/10 border-y border-foreground/10">
          {events.map((event) => {
            const eventDate = formatEventDate(event.date);

            return (
              <article key={event.id} className="grid grid-cols-1 md:grid-cols-[110px_minmax(0,1fr)_260px_150px] items-stretch gap-0 py-6 md:py-5">
                <div className="flex md:flex-col items-baseline md:items-center justify-center gap-2 md:gap-0 border-l-4 border-[#f23529] md:border-l-0 md:border-r md:border-foreground/10 pl-4 md:pl-0">
                  <span className="text-4xl font-black text-[#f23529] leading-none">{eventDate.day}</span>
                  <span className="text-sm font-black text-foreground/60">{eventDate.month}</span>
                </div>

                <div className="min-w-0 px-0 md:px-7 py-5 md:py-2">
                  <h3 className="text-xl md:text-2xl font-extrabold mb-2">{event.name}</h3>
                  {event.description && <p className="text-foreground/65 leading-relaxed line-clamp-2 mb-3">{event.description}</p>}
                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground/55">
                    <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} />{eventDate.full}</span>
                    {event.startTime && <span className="inline-flex items-center gap-1.5"><Clock3 size={15} />{event.startTime} Uhr</span>}
                    {event.location && <span className="inline-flex items-center gap-1.5"><MapPin size={15} />{event.location}</span>}
                  </div>
                </div>

                <div className="relative min-h-36 md:min-h-32 overflow-hidden bg-foreground/5">
                  {event.bannerUrl ? (
                    // Images are managed in Taskcenter, so their host cannot be known at build time.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={event.bannerUrl} alt={`Veranstaltungsbild zu ${event.name}`} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-foreground/35">
                      <ImageIcon size={32} />
                      <span className="text-xs font-bold uppercase">Veranstaltungsbild</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-start md:justify-end pt-5 md:pt-0 md:pl-5">
                  {event.ticketSalesActive ? (
                    <a href={ticketShopUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 bg-[#f23529] hover:bg-[#cd1212] text-white px-5 py-3 font-bold transition-colors">
                      <Ticket size={18} /> Tickets
                    </a>
                  ) : (
                    <span className="text-sm font-bold text-foreground/45">Vorverkauf pausiert</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
