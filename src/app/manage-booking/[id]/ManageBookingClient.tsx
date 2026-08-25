"use client";

import { useState } from "react";
import { cancelBookingCustomer, updateBookingCustomer } from "@/app/actions/admin";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarDays, Clock, Users, Utensils, FileText, Check, AlertCircle, Trash2, Edit3, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ManageBookingClientProps {
  booking: any;
  isPast24h: boolean;
}

export function ManageBookingClient({ booking: initialBooking, isPast24h }: ManageBookingClientProps) {
  const [booking, setBooking] = useState(initialBooking);
  const [isEditing, setIsEditing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit Form State
  const [date, setDate] = useState(booking.date);
  const [time, setTime] = useState(booking.time);
  const [people, setPeople] = useState(booking.people || 1);
  const [wantsFood, setWantsFood] = useState(booking.wantsFood || false);
  const [bowlingFoodTiming, setBowlingFoodTiming] = useState(booking.bowlingFoodTiming || "vorher");
  const [notes, setNotes] = useState(booking.notes || "");

  const bookingNumber = `BF-${booking.id.slice(-6).toUpperCase()}`;
  const isCancelled = booking.status === "cancelled";
  const isNoShow = booking.status === "no_show";

  const handleCancel = async () => {
    setLoading(true);
    setMessage(null);
    const result = await cancelBookingCustomer(booking.id);
    setLoading(false);
    if (result.success) {
      setBooking({ ...booking, status: "cancelled" });
      setIsCancelling(false);
      setMessage({ type: "success", text: "Deine Buchung wurde erfolgreich storniert." });
    } else {
      setMessage({ type: "error", text: result.error || "Fehler beim Stornieren." });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await updateBookingCustomer(booking.id, {
      date,
      time,
      people,
      wantsFood,
      bowlingFoodTiming: wantsFood ? bowlingFoodTiming : null,
      notes
    });

    setLoading(false);

    if (result.success) {
      setBooking({
        ...booking,
        date,
        time,
        people,
        wantsFood,
        bowlingFoodTiming: wantsFood ? bowlingFoodTiming : null,
        notes
      });
      setIsEditing(false);
      setMessage({ type: "success", text: "Deine Änderungen wurden erfolgreich gespeichert!" });
    } else {
      setMessage({ type: "error", text: result.error || "Fehler beim Speichern der Änderungen." });
    }
  };

  const formattedDate = format(new Date(booking.date), "EEEE, dd. MMMM yyyy", { locale: de });

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-foreground/10">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full">
            Buchungs-Nr: {bookingNumber}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 capitalize">
            {booking.type === 'kidsworld' ? 'Kindergeburtstag' : booking.type === 'dartkegeln' ? 'Dart & Kegeln' : booking.type} Buchung
          </h1>
        </div>

        <div>
          {isCancelled ? (
            <span className="px-4 py-2 bg-red-500/10 text-red-600 font-bold rounded-xl border border-red-500/20 text-sm">
              Storniert
            </span>
          ) : isNoShow ? (
            <span className="px-4 py-2 bg-purple-500/10 text-purple-600 font-bold rounded-xl border border-purple-500/20 text-sm">
              Nicht erschienen
            </span>
          ) : (
            <span className="px-4 py-2 bg-emerald-500/10 text-emerald-600 font-bold rounded-xl border border-emerald-500/20 text-sm">
              Bestätigt
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-2xl border text-sm font-medium animate-fade-in flex items-center gap-3 ${
          message.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" 
            : "bg-red-500/10 border-red-500/20 text-red-600"
        }`}>
          {message.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Booking Details Card or Edit Form */}
      {!isEditing ? (
        <div className="glass p-6 sm:p-8 rounded-3xl border border-foreground/5 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-foreground/80">
                <CalendarDays size={18} className="text-blue-500 flex-none" />
                <div>
                  <span className="text-xs text-foreground/50 font-bold block">Datum & Uhrzeit</span>
                  <span className="font-bold text-sm sm:text-base">{formattedDate}, {booking.time} Uhr ({booking.duration} Std.)</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-foreground/80">
                <Users size={18} className="text-blue-500 flex-none" />
                <div>
                  <span className="text-xs text-foreground/50 font-bold block">Personen</span>
                  <span className="font-bold text-sm sm:text-base">{booking.people} Person(en)</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-foreground/80">
                <Utensils size={18} className="text-blue-500 flex-none" />
                <div>
                  <span className="text-xs text-foreground/50 font-bold block">Gastronomie</span>
                  <span className="font-bold text-sm sm:text-base">
                    {booking.wantsFood ? `Ja (${booking.bowlingFoodTiming || 'Gastro'})` : 'Nein'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-foreground/80">
                <FileText size={18} className="text-blue-500 flex-none" />
                <div>
                  <span className="text-xs text-foreground/50 font-bold block">Gesamtpreis</span>
                  <span className="font-extrabold text-blue-500 text-lg sm:text-xl">
                    {booking.totalPrice.toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>
          </div>

          {booking.notes && (
            <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/10 text-xs sm:text-sm">
              <span className="font-bold block mb-1">Anmerkung:</span>
              <span className="text-foreground/75">{booking.notes}</span>
            </div>
          )}

          {/* Action Buttons for Active Bookings */}
          {!isCancelled && !isNoShow && (
            <div className="pt-4 border-t border-foreground/10 flex flex-col sm:flex-row gap-3">
              {!isPast24h ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-sm"
                  >
                    <Edit3 size={16} /> Buchung bearbeiten
                  </button>

                  <button
                    onClick={() => setIsCancelling(true)}
                    className="py-3 px-5 bg-red-500/10 hover:bg-red-500/20 text-red-600 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-sm"
                  >
                    <Trash2 size={16} /> Buchung stornieren
                  </button>
                </>
              ) : (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs sm:text-sm">
                  Eine Online-Stornierung oder -Bearbeitung ist leider nur bis 24 Stunden vor dem Termin möglich. Bitte kontaktiere uns bei kurzfristigen Änderungen telefonisch.
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Edit Form */
        <form onSubmit={handleUpdate} className="glass p-6 sm:p-8 rounded-3xl border border-foreground/5 space-y-6">
          <h3 className="font-bold text-lg border-b border-foreground/10 pb-3 flex items-center gap-2">
            <Edit3 size={18} className="text-blue-500" /> Buchungsdaten anpassen
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2">Datum</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-background border border-foreground/10 rounded-xl p-3 text-sm font-medium focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2">Uhrzeit</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full bg-background border border-foreground/10 rounded-xl p-3 text-sm font-medium focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2">Personen</label>
              <input
                type="number"
                min="1"
                max="50"
                value={people}
                onChange={(e) => setPeople(parseInt(e.target.value) || 1)}
                required
                className="w-full bg-background border border-foreground/10 rounded-xl p-3 text-sm font-medium focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2">Gastronomie-Wunsch</label>
              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={wantsFood}
                    onChange={(e) => setWantsFood(e.target.checked)}
                    className="w-4 h-4 accent-blue-500 rounded"
                  />
                  Gastro-Verpflegung gewünscht
                </label>
              </div>
            </div>
          </div>

          {wantsFood && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2">Zeitpunkt für Essen</label>
              <select
                value={bowlingFoodTiming}
                onChange={(e) => setBowlingFoodTiming(e.target.value)}
                className="w-full bg-background border border-foreground/10 rounded-xl p-3 text-sm font-medium focus:border-blue-500 outline-none"
              >
                <option value="vorher">Vor dem Spielen</option>
                <option value="mittendrin">Während des Spielens</option>
                <option value="nachher">Nach dem Spielen</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2">Anmerkung / Wünsche</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-background border border-foreground/10 rounded-xl p-3 text-sm font-medium focus:border-blue-500 outline-none resize-none"
              placeholder="Besondere Hinweise..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-foreground/10">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all cursor-pointer text-sm"
            >
              {loading ? "Wird gespeichert..." : "Änderungen speichern"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="py-3 px-5 bg-foreground/10 hover:bg-foreground/20 text-foreground font-bold rounded-xl transition-all cursor-pointer text-sm"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {/* Cancellation Confirmation Modal */}
      {isCancelling && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass p-6 sm:p-8 rounded-3xl max-w-md w-full border border-foreground/10 space-y-4 animate-scale-in">
            <h3 className="text-xl font-bold text-red-600 flex items-center gap-2">
              <Trash2 size={20} /> Buchung wirklich stornieren?
            </h3>
            <p className="text-foreground/70 text-sm">
              Möchtest du die Buchung für den <strong>{formattedDate}</strong> um <strong>{booking.time} Uhr</strong> wirklich kostenfrei stornieren?
            </p>
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all cursor-pointer text-sm"
              >
                {loading ? "Wird storniert..." : "Ja, Stornieren"}
              </button>
              <button
                onClick={() => setIsCancelling(false)}
                className="py-3 px-5 bg-foreground/10 hover:bg-foreground/20 text-foreground font-bold rounded-xl transition-all cursor-pointer text-sm"
              >
                Zurück
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
