"use client";

import { useMemo, useState } from "react";
import { addDays, addMonths, endOfISOWeek, endOfMonth, format, getISOWeek, startOfISOWeek, startOfMonth } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { AdminBookingCard } from "@/components/admin/AdminBookingCard";

const parseDate = (value: string) => new Date(`${value}T00:00:00`);

export function AdminDashboardClient({ 
  initialBookings, 
  initialSchedules = [], 
  today 
}: { 
  initialBookings: any[], 
  initialSchedules?: any[], 
  today: string 
}) {
  const [filter, setFilter] = useState<"all" | "bowling" | "kidsworld" | "squash" | "event" | "dartkegeln">("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedWeek, setSelectedWeek] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"upcoming" | "archive">("upcoming");

  const { monthOptions, weekOptions } = useMemo(() => {
    const bookingDates = initialBookings.map((b) => parseDate(b.date));
    const fallbackDate = parseDate(today);
    const endOfCurrentYear = new Date(fallbackDate.getFullYear(), 11, 31);
    const minDate = bookingDates.reduce((min, d) => d < min ? d : min, fallbackDate);
    const latestBookingDate = bookingDates.reduce((max, d) => d > max ? d : max, fallbackDate);
    const maxDate = latestBookingDate > endOfCurrentYear ? latestBookingDate : endOfCurrentYear;

    const months = [];
    for (let d = startOfMonth(minDate); d <= endOfMonth(maxDate); d = addMonths(d, 1)) {
      months.push({
        value: format(d, "yyyy-MM"),
        label: format(d, "MMMM yyyy", { locale: de }),
      });
    }

    const weeks = [];
    for (let d = startOfISOWeek(minDate); d <= endOfISOWeek(maxDate); d = addDays(d, 7)) {
      const sunday = endOfISOWeek(d);
      weeks.push({
        value: format(d, "yyyy-MM-dd"),
        label: `KW ${getISOWeek(d)} (${format(d, "dd.MM.")} - ${format(sunday, "dd.MM.")})`,
      });
    }

    return { monthOptions: months, weekOptions: weeks };
  }, [initialBookings, today]);

  // Filter-Logik anwenden
  const filteredBookings = initialBookings.filter(b => {
    // 0. Ansichtsfilter (Aktuell/Zukunft vs. Archiv/Vergangenheit)
    const isPast = b.date < today;
    if (viewMode === "upcoming" && isPast) return false;
    if (viewMode === "archive" && !isPast) return false;

    // 1. Kategoriefilter
    const categoryMatch = filter === "all" ? true : b.type === filter;
    if (!categoryMatch) return false;

    // 2. Monatsfilter
    if (selectedMonth !== "all") {
      const bMonth = format(new Date(b.date), "yyyy-MM");
      if (bMonth !== selectedMonth) return false;
    }

    // 3. Wochenfilter
    if (selectedWeek !== "all") {
      const bWeekStart = format(startOfISOWeek(new Date(b.date)), "yyyy-MM-dd");
      if (bWeekStart !== selectedWeek) return false;
    }

    return true;
  });

  // Gruppieren nach Datum
  const groupedBookings = filteredBookings.reduce((acc, booking) => {
    if (!acc[booking.date]) {
      acc[booking.date] = [];
    }
    acc[booking.date].push(booking);
    return acc;
  }, {} as Record<string, any[]>);

  // Im Archiv absteigend sortieren (neueste vergangene zuerst), sonst aufsteigend
  const dates = Object.keys(groupedBookings).sort((a, b) => 
    viewMode === "archive" ? b.localeCompare(a) : a.localeCompare(b)
  );

  return (
    <div>
      {/* View Switcher Tabs (Aktuell vs Archiv) */}
      <div className="mb-6 flex gap-3 border-b border-foreground/10 pb-4">
        <button
          onClick={() => setViewMode("upcoming")}
          className={`px-5 py-3 rounded-2xl font-black text-sm md:text-base transition-all flex items-center gap-2 cursor-pointer ${
            viewMode === "upcoming"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-102"
              : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10"
          }`}
        >
          <span>📅 Aktuelle & Künftige Buchungen</span>
        </button>

        <button
          onClick={() => setViewMode("archive")}
          className={`px-5 py-3 rounded-2xl font-black text-sm md:text-base transition-all flex items-center gap-2 cursor-pointer ${
            viewMode === "archive"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 scale-102"
              : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10"
          }`}
        >
          <span>📁 Archiv (Vergangene 4 Wochen)</span>
        </button>
      </div>
      {/* Filter Tabs */}
      <div className="mb-6 p-1 bg-foreground/5 rounded-2xl inline-flex flex-wrap gap-1">
        <button 
          onClick={() => setFilter("all")}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${filter === "all" ? "bg-red-500 text-white shadow-sm shadow-red-500/20" : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"}`}
        >
          Alle Buchungen
        </button>
        <button 
          onClick={() => setFilter("bowling")}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${filter === "bowling" ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20" : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"}`}
        >
          🎳 Bowling
        </button>
        <button 
          onClick={() => setFilter("kidsworld")}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${filter === "kidsworld" ? "bg-purple-500 text-white shadow-sm shadow-purple-500/20" : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"}`}
        >
          🎈 Kindergeburtstag
        </button>
        <button 
          onClick={() => setFilter("squash")}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${filter === "squash" ? "bg-green-500 text-white shadow-sm shadow-green-500/20" : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"}`}
        >
          🎾 Squash
        </button>
        <button 
          onClick={() => setFilter("event")}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${filter === "event" ? "bg-blue-500 text-white shadow-sm shadow-blue-500/20" : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"}`}
        >
          🎉 Events
        </button>
        <button 
          onClick={() => setFilter("dartkegeln")}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${filter === "dartkegeln" ? "bg-amber-600 text-white shadow-sm shadow-amber-600/20" : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"}`}
        >
          🎯 Kurs, Event & Kegelbahn
        </button>
      </div>

      {/* Zeit-Filter Row */}
      <div className="mb-8 p-4 glass rounded-2xl border border-foreground/5 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-foreground/60 flex items-center gap-1">
            <CalendarDays size={16} /> Monat:
          </span>
          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setSelectedWeek("all"); // Gegenseitiges Zurücksetzen
            }}
            className="bg-background border border-foreground/10 rounded-xl px-3 py-2 text-sm font-bold focus:border-blue-500 outline-none min-w-[160px] cursor-pointer"
          >
            <option value="all">Alle Monate</option>
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-foreground/60 flex items-center gap-1">
            <CalendarDays size={16} /> Kalenderwoche:
          </span>
          <select
            value={selectedWeek}
            onChange={(e) => {
              setSelectedWeek(e.target.value);
              setSelectedMonth("all"); // Gegenseitiges Zurücksetzen
            }}
            className="bg-background border border-foreground/10 rounded-xl px-3 py-2 text-sm font-bold focus:border-blue-500 outline-none min-w-[190px] cursor-pointer"
          >
            <option value="all">Alle Wochen</option>
            {weekOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {(selectedMonth !== "all" || selectedWeek !== "all") && (
          <button
            onClick={() => {
              setSelectedMonth("all");
              setSelectedWeek("all");
            }}
            className="px-4 py-2 text-xs font-black text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl transition-all border border-red-500/20 cursor-pointer"
          >
            Filter zurücksetzen
          </button>
        )}
      </div>

      {dates.length === 0 ? (
        <div className="glass p-12 rounded-3xl text-center text-foreground/50 border border-foreground/5">
          {viewMode === "archive"
            ? "Keine vergangenen Buchungen im Archiv für diese Auswahl gefunden."
            : "Keine anstehenden Buchungen für diese Auswahl gefunden."}
        </div>
      ) : (
        <div className="space-y-12">
          {dates.map((date) => {
            const isToday = date === today;
            const dateObj = new Date(date);
            
            // Get unique employee names scheduled for this date
            const dateSchedules = initialSchedules.filter(s => s.date === date);
            const employeeNames = Array.from(new Set(dateSchedules.map(s => s.employee?.name).filter(Boolean)));
            const shiftText = employeeNames.length > 0 ? ` - Schicht: ${employeeNames.join(", ")}` : "";
            
            const formattedDate = `${format(dateObj, "EEEE, dd. MMMM yyyy", { locale: de })} (KW ${getISOWeek(dateObj)})${shiftText}`;
            const kidsBookingsCount = groupedBookings[date].filter((b: any) => b.type === 'kidsworld' && b.status !== 'cancelled').length;
            
            return (
              <div key={date}>
                <h2 className="text-xl font-extrabold mb-4 pb-2 border-b border-foreground/10 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    {isToday ? (
                      <span className="text-blue-500 bg-blue-500/10 px-3 py-1 rounded-lg text-xs">HEUTE</span>
                    ) : null}
                    {formattedDate}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.open(`/admin/kitchen-print?date=${date}`, '_blank')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 border border-orange-500/20 transition-all cursor-pointer"
                    >
                      🍳 Küchen-PDF
                    </button>
                    {kidsBookingsCount > 0 && (
                      <div className="text-sm font-medium bg-purple-500/10 text-purple-600 px-3 py-1 rounded-full">
                        {kidsBookingsCount} Kindergeburtstag{kidsBookingsCount !== 1 ? 'e' : ''}
                      </div>
                    )}
                  </div>
                </h2>
                
                <div className="grid gap-4">
                  {groupedBookings[date].map((booking: any) => (
                    <AdminBookingCard 
                      key={booking.id} 
                      booking={booking} 
                      isToday={isToday} 
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
