"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Search,
  Users,
  XCircle,
} from "lucide-react";

export type AnalyticsBooking = {
  id: string;
  type: string;
  date: string;
  time: string;
  duration: number;
  people: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
};

type SectionStat = {
  type: string;
  total: number;
  confirmed: number;
  cancelled: number;
  noShow: number;
  people: number;
  value: number;
};

type MonthStat = {
  key: string;
  confirmed: number;
  cancelled: number;
  noShow: number;
  total: number;
};

const typeLabels: Record<string, string> = {
  bowling: "Bowling",
  squash: "Squash",
  kidsworld: "Kindergeburtstag",
  indoorspielplatz: "Indoorspielplatz",
  event: "Event",
  dartkegeln: "Kurs / Eventraum / Kegelbahn",
  outdoor: "Outdoor Party",
};

const typeColors: Record<string, { bar: string; text: string; background: string }> = {
  bowling: { bar: "bg-orange-500", text: "text-orange-600", background: "bg-orange-500/10" },
  squash: { bar: "bg-emerald-500", text: "text-emerald-600", background: "bg-emerald-500/10" },
  kidsworld: { bar: "bg-fuchsia-500", text: "text-fuchsia-600", background: "bg-fuchsia-500/10" },
  indoorspielplatz: { bar: "bg-cyan-500", text: "text-cyan-600", background: "bg-cyan-500/10" },
  event: { bar: "bg-blue-500", text: "text-blue-600", background: "bg-blue-500/10" },
  dartkegeln: { bar: "bg-amber-500", text: "text-amber-600", background: "bg-amber-500/10" },
  outdoor: { bar: "bg-lime-500", text: "text-lime-600", background: "bg-lime-500/10" },
};

const statusLabels: Record<string, string> = {
  confirmed: "Bestätigt",
  cancelled: "Storniert",
  no_show: "Nicht erschienen",
};

const preferredTypeOrder = [
  "bowling",
  "squash",
  "kidsworld",
  "indoorspielplatz",
  "event",
  "dartkegeln",
  "outdoor",
];

const currencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const monthFormatter = new Intl.DateTimeFormat("de-DE", {
  month: "short",
  year: "2-digit",
});

const formatBookingDate = (date: string) => dateFormatter.format(new Date(`${date}T12:00:00`));
const formatMonth = (month: string) => monthFormatter.format(new Date(`${month}-01T12:00:00`));
const bookingNumber = (id: string) => `BF-${id.slice(-6).toUpperCase()}`;

export function BookingAnalyticsClient({ bookings }: { bookings: AnalyticsBooking[] }) {
  const availableTypes = useMemo(() => {
    const types = Array.from(new Set(bookings.map((booking) => booking.type)));
    return types.sort((a, b) => {
      const aIndex = preferredTypeOrder.indexOf(a);
      const bIndex = preferredTypeOrder.indexOf(b);
      return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
    });
  }, [bookings]);

  const firstDate = useMemo(
    () => bookings.reduce((earliest, booking) => booking.date < earliest ? booking.date : earliest, bookings[0]?.date ?? ""),
    [bookings],
  );
  const lastDate = useMemo(
    () => bookings.reduce((latest, booking) => booking.date > latest ? booking.date : latest, bookings[0]?.date ?? ""),
    [bookings],
  );

  const [fromDate, setFromDate] = useState(firstDate);
  const [toDate, setToDate] = useState(lastDate);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const filteredBookings = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("de");
    return bookings.filter((booking) => {
      if (fromDate && booking.date < fromDate) return false;
      if (toDate && booking.date > toDate) return false;
      if (typeFilter !== "all" && booking.type !== typeFilter) return false;
      if (statusFilter !== "all" && booking.status !== statusFilter) return false;
      if (!needle) return true;

      return [booking.id, booking.name, booking.email, booking.phone, typeLabels[booking.type] || booking.type]
        .some((value) => value.toLocaleLowerCase("de").includes(needle));
    });
  }, [bookings, fromDate, search, statusFilter, toDate, typeFilter]);

  const totals = useMemo(() => {
    const confirmed = filteredBookings.filter((booking) => booking.status === "confirmed");
    const cancelled = filteredBookings.filter((booking) => booking.status === "cancelled");
    const noShow = filteredBookings.filter((booking) => booking.status === "no_show");
    const active = filteredBookings.filter((booking) => booking.status !== "cancelled");
    const firstRecorded = filteredBookings.reduce<string | null>((earliest, booking) => (
      earliest === null || booking.createdAt < earliest ? booking.createdAt : earliest
    ), null);

    return {
      total: filteredBookings.length,
      confirmed: confirmed.length,
      cancelled: cancelled.length,
      noShow: noShow.length,
      people: active.reduce((sum, booking) => sum + booking.people, 0),
      value: confirmed.reduce((sum, booking) => sum + booking.totalPrice, 0),
      firstRecorded,
    };
  }, [filteredBookings]);

  const sectionStats = useMemo<SectionStat[]>(() => {
    const groups = new Map<string, SectionStat>();
    for (const booking of filteredBookings) {
      const current = groups.get(booking.type) ?? {
        type: booking.type,
        total: 0,
        confirmed: 0,
        cancelled: 0,
        noShow: 0,
        people: 0,
        value: 0,
      };
      current.total += 1;
      if (booking.status === "confirmed") {
        current.confirmed += 1;
        current.value += booking.totalPrice;
      } else if (booking.status === "cancelled") {
        current.cancelled += 1;
      } else if (booking.status === "no_show") {
        current.noShow += 1;
      }
      if (booking.status !== "cancelled") current.people += booking.people;
      groups.set(booking.type, current);
    }
    return Array.from(groups.values()).sort((a, b) => {
      const aIndex = preferredTypeOrder.indexOf(a.type);
      const bIndex = preferredTypeOrder.indexOf(b.type);
      return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
    });
  }, [filteredBookings]);

  const monthStats = useMemo<MonthStat[]>(() => {
    const groups = new Map<string, MonthStat>();
    for (const booking of filteredBookings) {
      const key = booking.date.slice(0, 7);
      const current = groups.get(key) ?? { key, confirmed: 0, cancelled: 0, noShow: 0, total: 0 };
      current.total += 1;
      if (booking.status === "confirmed") current.confirmed += 1;
      if (booking.status === "cancelled") current.cancelled += 1;
      if (booking.status === "no_show") current.noShow += 1;
      groups.set(key, current);
    }
    return Array.from(groups.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [filteredBookings]);

  const maxSectionTotal = Math.max(...sectionStats.map((section) => section.total), 1);
  const maxMonthTotal = Math.max(...monthStats.map((month) => month.total), 1);
  const pageCount = Math.max(1, Math.ceil(filteredBookings.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visibleBookings = filteredBookings.slice((safePage - 1) * pageSize, safePage * pageSize);

  const clearFilters = () => {
    setFromDate(firstDate);
    setToDate(lastDate);
    setTypeFilter("all");
    setStatusFilter("all");
    setSearch("");
    setPage(1);
  };

  return (
    <div className="space-y-10">
      <section aria-label="Analytics Filter" className="border-y border-foreground/10 py-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1.2fr_1.2fr_1.7fr_auto] xl:items-end">
          <label className="space-y-1.5 text-sm font-bold text-foreground/70">
            <span>Von</span>
            <input type="date" value={fromDate} min={firstDate} max={toDate || lastDate} onChange={(event) => { setFromDate(event.target.value); setPage(1); }} className="h-11 w-full rounded-lg border border-foreground/15 bg-background px-3 text-foreground outline-none transition-colors focus:border-blue-500" />
          </label>
          <label className="space-y-1.5 text-sm font-bold text-foreground/70">
            <span>Bis</span>
            <input type="date" value={toDate} min={fromDate || firstDate} max={lastDate} onChange={(event) => { setToDate(event.target.value); setPage(1); }} className="h-11 w-full rounded-lg border border-foreground/15 bg-background px-3 text-foreground outline-none transition-colors focus:border-blue-500" />
          </label>
          <label className="space-y-1.5 text-sm font-bold text-foreground/70">
            <span>Sektion</span>
            <select value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); setPage(1); }} className="h-11 w-full rounded-lg border border-foreground/15 bg-background px-3 text-foreground outline-none transition-colors focus:border-blue-500">
              <option value="all">Alle Sektionen</option>
              {availableTypes.map((type) => <option key={type} value={type}>{typeLabels[type] || type}</option>)}
            </select>
          </label>
          <label className="space-y-1.5 text-sm font-bold text-foreground/70">
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="h-11 w-full rounded-lg border border-foreground/15 bg-background px-3 text-foreground outline-none transition-colors focus:border-blue-500">
              <option value="all">Alle Status</option>
              <option value="confirmed">Bestätigt</option>
              <option value="cancelled">Storniert</option>
              <option value="no_show">Nicht erschienen</option>
            </select>
          </label>
          <label className="space-y-1.5 text-sm font-bold text-foreground/70">
            <span>Suche</span>
            <span className="relative block">
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Name, E-Mail, Telefon oder Buchungsnummer" className="h-11 w-full rounded-lg border border-foreground/15 bg-background pl-10 pr-3 text-foreground outline-none transition-colors placeholder:text-foreground/35 focus:border-blue-500" />
            </span>
          </label>
          <button type="button" onClick={clearFilters} className="h-11 rounded-lg border border-foreground/15 px-4 text-sm font-bold text-foreground/70 transition-colors hover:border-blue-500/40 hover:bg-blue-500/5 hover:text-blue-600">
            Zurücksetzen
          </button>
        </div>
      </section>

      <section aria-label="Kennzahlen" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Alle Buchungen" value={totals.total.toLocaleString("de-DE")} icon={<CalendarDays size={19} />} color="blue" />
        <Metric label="Bestätigt" value={totals.confirmed.toLocaleString("de-DE")} icon={<CircleCheck size={19} />} color="green" />
        <Metric label="Storniert" value={totals.cancelled.toLocaleString("de-DE")} note={`${totals.noShow.toLocaleString("de-DE")} nicht erschienen`} icon={<XCircle size={19} />} color="red" />
        <Metric label="Personen, nicht storniert" value={totals.people.toLocaleString("de-DE")} icon={<Users size={19} />} color="purple" />
        <Metric label="Bestätigter Buchungswert" value={currencyFormatter.format(totals.value)} note="Kein Zahlungsnachweis" icon={<BarChart3Icon />} color="amber" />
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-foreground/10 pb-3">
          <div>
            <h2 className="text-lg font-extrabold">Buchungen je Sektion</h2>
            <p className="mt-1 text-sm text-foreground/50">Tabellarischer Vergleich des ausgewählten Zeitraums.</p>
          </div>
          {totals.firstRecorded && <p className="text-xs font-bold text-foreground/45">Erste Aufzeichnung: {dateTimeFormatter.format(new Date(totals.firstRecorded))}</p>}
        </div>
        <div className="overflow-x-auto rounded-lg border border-foreground/10">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-foreground/5 text-left text-xs uppercase text-foreground/55">
              <tr>
                <th className="px-4 py-3 font-extrabold">Sektion</th>
                <th className="px-4 py-3 text-right font-extrabold">Gesamt</th>
                <th className="px-4 py-3 text-right font-extrabold">Bestätigt</th>
                <th className="px-4 py-3 text-right font-extrabold">Storniert</th>
                <th className="px-4 py-3 text-right font-extrabold">Nicht erschienen</th>
                <th className="px-4 py-3 text-right font-extrabold">Personen</th>
                <th className="px-4 py-3 text-right font-extrabold">Bestätigter Buchungswert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/10">
              {sectionStats.map((section) => {
                const colors = typeColors[section.type] || { bar: "bg-slate-500", text: "text-slate-600", background: "bg-slate-500/10" };
                return (
                  <tr key={section.type} className="hover:bg-foreground/[0.025]">
                    <td className="px-4 py-3.5 font-bold">
                      <span className={`inline-flex rounded-md px-2.5 py-1 ${colors.background} ${colors.text}`}>{typeLabels[section.type] || section.type}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-extrabold">{section.total}</td>
                    <td className="px-4 py-3.5 text-right">{section.confirmed}</td>
                    <td className="px-4 py-3.5 text-right">{section.cancelled}</td>
                    <td className="px-4 py-3.5 text-right">{section.noShow}</td>
                    <td className="px-4 py-3.5 text-right">{section.people.toLocaleString("de-DE")}</td>
                    <td className="px-4 py-3.5 text-right font-bold">{currencyFormatter.format(section.value)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]">
        <div>
          <div className="mb-4 border-b border-foreground/10 pb-3">
            <h2 className="text-lg font-extrabold">Verteilung nach Sektion</h2>
            <p className="mt-1 text-sm text-foreground/50">Anteil an allen gefilterten Buchungen.</p>
          </div>
          <div className="space-y-4">
            {sectionStats.map((section) => {
              const colors = typeColors[section.type] || { bar: "bg-slate-500", text: "text-slate-600", background: "bg-slate-500/10" };
              return (
                <div key={section.type}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                    <span className="font-bold">{typeLabels[section.type] || section.type}</span>
                    <span className="tabular-nums text-foreground/55">{section.total} ({totals.total ? Math.round(section.total / totals.total * 100) : 0} %)</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-sm bg-foreground/8">
                    <div className={`h-full ${colors.bar}`} style={{ width: `${section.total / maxSectionTotal * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-foreground/10 pb-3">
            <div>
              <h2 className="text-lg font-extrabold">Buchungen nach Terminmonat</h2>
              <p className="mt-1 text-sm text-foreground/50">Bestätigte, stornierte und nicht erschienene Buchungen.</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-foreground/55">
              <Legend color="bg-blue-500" label="Bestätigt" />
              <Legend color="bg-red-500" label="Storniert" />
              <Legend color="bg-amber-500" label="Nicht erschienen" />
            </div>
          </div>
          <div className="overflow-x-auto pb-2">
            <div className="flex h-56 min-w-max items-end gap-3 border-b border-foreground/15 px-2 pt-5">
              {monthStats.map((month) => {
                const scale = 164 / maxMonthTotal;
                const confirmedHeight = month.confirmed ? Math.max(month.confirmed * scale, 3) : 0;
                const cancelledHeight = month.cancelled ? Math.max(month.cancelled * scale, 3) : 0;
                const noShowHeight = month.noShow ? Math.max(month.noShow * scale, 3) : 0;
                return (
                  <div key={month.key} className="flex w-12 shrink-0 flex-col items-center">
                    <span className="mb-2 text-xs font-extrabold tabular-nums text-foreground/65">{month.total}</span>
                    <div className="flex h-[164px] w-7 flex-col-reverse justify-start overflow-hidden rounded-t-sm bg-foreground/5" title={`${formatMonth(month.key)}: ${month.total} Buchungen`}>
                      <div className="w-full bg-blue-500" style={{ height: confirmedHeight }} />
                      <div className="w-full bg-red-500" style={{ height: cancelledHeight }} />
                      <div className="w-full bg-amber-500" style={{ height: noShowHeight }} />
                    </div>
                    <span className="mt-2 whitespace-nowrap text-[11px] font-bold text-foreground/50">{formatMonth(month.key)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-foreground/10 pb-3">
          <div>
            <h2 className="text-lg font-extrabold">Alle Buchungen</h2>
            <p className="mt-1 text-sm text-foreground/50">{filteredBookings.length.toLocaleString("de-DE")} Datensätze im ausgewählten Zeitraum.</p>
          </div>
          <p className="text-xs font-bold text-foreground/45">Seite {safePage} von {pageCount}</p>
        </div>
        <div className="overflow-x-auto rounded-lg border border-foreground/10">
          <table className="w-full min-w-[1050px] text-sm">
            <thead className="bg-foreground/5 text-left text-xs uppercase text-foreground/55">
              <tr>
                <th className="px-4 py-3 font-extrabold">Termin</th>
                <th className="px-4 py-3 font-extrabold">Sektion</th>
                <th className="px-4 py-3 font-extrabold">Besteller</th>
                <th className="px-4 py-3 font-extrabold">Status</th>
                <th className="px-4 py-3 text-right font-extrabold">Personen</th>
                <th className="px-4 py-3 text-right font-extrabold">Dauer</th>
                <th className="px-4 py-3 text-right font-extrabold">Buchungswert</th>
                <th className="px-4 py-3 font-extrabold">Buchungsnummer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/10">
              {visibleBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-foreground/[0.025]">
                  <td className="px-4 py-3 whitespace-nowrap font-bold">{formatBookingDate(booking.date)}, {booking.time}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{typeLabels[booking.type] || booking.type}</td>
                  <td className="px-4 py-3 max-w-[260px] truncate" title={booking.name}>{booking.name}</td>
                  <td className="px-4 py-3"><StatusBadge status={booking.status} /></td>
                  <td className="px-4 py-3 text-right tabular-nums">{booking.people}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{booking.duration} h</td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums">{currencyFormatter.format(booking.totalPrice)}</td>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-blue-600">{bookingNumber(booking.id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleBookings.length === 0 && <div className="px-6 py-12 text-center text-sm text-foreground/50">Keine Buchungen für diese Filter gefunden.</div>}
        </div>
        {pageCount > 1 && (
          <div className="mt-4 flex items-center justify-end gap-2">
            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={safePage === 1} title="Vorherige Seite" className="flex h-10 w-10 items-center justify-center rounded-lg border border-foreground/15 text-foreground/70 transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-35">
              <ChevronLeft size={18} />
            </button>
            <span className="min-w-28 text-center text-sm font-bold text-foreground/60">{(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filteredBookings.length)} von {filteredBookings.length}</span>
            <button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={safePage === pageCount} title="Nächste Seite" className="flex h-10 w-10 items-center justify-center rounded-lg border border-foreground/15 text-foreground/70 transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-35">
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value, note, icon, color }: { label: string; value: string; note?: string; icon: React.ReactNode; color: "blue" | "green" | "red" | "purple" | "amber" }) {
  const colors = {
    blue: "bg-blue-500/10 text-blue-600",
    green: "bg-emerald-500/10 text-emerald-600",
    red: "bg-red-500/10 text-red-600",
    purple: "bg-fuchsia-500/10 text-fuchsia-600",
    amber: "bg-amber-500/10 text-amber-600",
  }[color];

  return (
    <div className="rounded-lg border border-foreground/10 bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase text-foreground/45">{label}</p>
          <p className="mt-2 break-words text-xl font-black tabular-nums text-foreground">{value}</p>
          {note && <p className="mt-1 text-xs font-medium text-foreground/40">{note}</p>}
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colors}`}>{icon}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes = status === "cancelled"
    ? "bg-red-500/10 text-red-600"
    : status === "no_show"
      ? "bg-amber-500/10 text-amber-700"
      : "bg-emerald-500/10 text-emerald-600";
  return <span className={`inline-flex whitespace-nowrap rounded-md px-2 py-1 text-xs font-extrabold ${classes}`}>{statusLabels[status] || status}</span>;
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><span className={`h-2.5 w-2.5 rounded-sm ${color}`} />{label}</span>;
}

function BarChart3Icon() {
  return <BarChart3 size={19} />;
}
