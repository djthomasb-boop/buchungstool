"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Utensils, MessageSquare, Edit, Trash2, CheckCircle, XCircle, Baby, Lock } from "lucide-react";
import { cancelBookingAdmin, updateBookingAdmin, deleteBookingAdmin, updateBookingStatusAdmin } from "@/app/actions/admin";
import Link from "next/link";

export function AdminBookingCard({ booking, isToday }: { booking: any, isToday: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLanes, setSelectedLanes] = useState<string[]>(() => {
    if (!booking.assignedLanes) return [];
    const matches = booking.assignedLanes.match(/\d+/g);
    return matches ? matches : [];
  });
  const formattedDate = format(new Date(booking.date), "EEEE, dd.MM.yyyy", { locale: de });

  // Sync state if booking prop updates externally
  useEffect(() => {
    if (booking.assignedLanes) {
      const matches = booking.assignedLanes.match(/\d+/g);
      setSelectedLanes(matches ? matches : []);
    } else {
      setSelectedLanes([]);
    }
  }, [booking.assignedLanes]);

  const handleCancel = async () => {
    if (window.confirm("Bist du sicher, dass du diese Buchung stornieren möchtest?")) {
      await cancelBookingAdmin(booking.id);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    if (booking.type === "bowling") {
      const peopleCount = parseInt(data.people as string) || 0;
      const durationHours = parseInt(data.duration as string) || 1;
      const lanesByPeople = Math.ceil(peopleCount / 8);
      const reservedLanes = Math.max(lanesByPeople, selectedLanes.length);

      data.lanes = String(reservedLanes);
      const lanePrice = reservedLanes * durationHours * 15;
      data.totalPrice = String(lanePrice);
    }
    
    await updateBookingAdmin(booking.id, data);
    setIsSubmitting(false);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm("Bist du sicher, dass du diese Buchung unwiderruflich löschen möchtest?")) {
      await deleteBookingAdmin(booking.id);
    }
  };

  const bookingNumber = `BF-${booking.id.slice(-6).toUpperCase()}`;

  const handleMarkNoShow = async () => {
    if (window.confirm("Buchung als 'Nicht erschienen' (No-Show) markieren?")) {
      await updateBookingStatusAdmin(booking.id, "no_show");
    }
  };

  if (booking.status === "cancelled") {
    return (
      <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 opacity-75 relative group">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-red-600 line-through decoration-2">{formattedDate}, {booking.time} Uhr</span>
            <span className="font-mono text-xs text-foreground/40 font-bold">({bookingNumber})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-red-500/10 text-red-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">STORNIERT</span>
            <button onClick={handleDelete} className="p-1.5 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 rounded-lg" title="Endgültig löschen">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        <p className="text-sm">{booking.name} - {booking.type === 'kidsworld' ? 'Kindergeburtstag' : booking.type}</p>
      </div>
    );
  }

  if (booking.status === "no_show") {
    return (
      <div className="p-6 rounded-2xl border border-purple-500/20 bg-purple-500/5 relative group">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-purple-700">{formattedDate}, {booking.time} Uhr</span>
            <span className="font-mono text-xs text-foreground/40 font-bold">({bookingNumber})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-500/10 text-purple-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">NICHT ERSCHIENEN</span>
            <button onClick={() => updateBookingStatusAdmin(booking.id, "confirmed")} className="p-1.5 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-purple-500/20 rounded-lg text-xs font-bold" title="Als wieder bestätigt markieren">
              Reaktivieren
            </button>
            <button onClick={handleDelete} className="p-1.5 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 rounded-lg" title="Endgültig löschen">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        <p className="text-sm font-medium">{booking.name} ({booking.phone}) - {booking.type}</p>
      </div>
    );
  }

  const isKids = booking.type === 'kidsworld';

  return (
    <div className={`p-6 rounded-2xl border transition-all hover:shadow-lg relative overflow-hidden ${isToday ? 'bg-blue-500/5 border-blue-500/30' : 'bg-background border-foreground/10 hover:border-blue-500/20'}`}>
      
      {!isEditing ? (
        <>
          <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-4">
            <div className="flex flex-col gap-2">
              <div className={`w-fit px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                booking.type === 'bowling' ? 'bg-orange-500/10 text-orange-600' :
                isKids ? 'bg-purple-500/10 text-purple-600' :
                booking.type === 'squash' ? 'bg-green-500/10 text-green-600' :
                booking.type === 'event' ? 'bg-blue-500/10 text-blue-600' :
                booking.type === 'dartkegeln' ? 'bg-amber-500/10 text-amber-600' :
                'bg-foreground/10 text-foreground'
              }`}>
                {isKids && <Baby size={14} />}
                {booking.type === 'dartkegeln' ? `Kurs / Event / Kegeln (${booking.package || 'Raum'})` : isKids ? 'Kindergeburtstag' : booking.type}
              </div>
              <div className="font-bold text-[15px] md:text-base leading-tight flex items-center gap-2 flex-wrap">
                {isToday ? (
                  <span className="text-blue-500">HEUTE, {booking.time} Uhr</span>
                ) : (
                  <span>{formattedDate}, {booking.time} Uhr</span>
                )}
                <span className="text-foreground/50 font-normal">({booking.duration}h)</span>
                <span className="font-mono text-xs bg-foreground/5 border border-foreground/10 px-2 py-0.5 rounded text-blue-600 font-bold">{bookingNumber}</span>
              </div>
            </div>
            <div className="font-black text-xl text-foreground/80">
              {booking.totalPrice.toFixed(2)} €
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-foreground">{booking.name}</p>
              <p className="text-foreground/60">{booking.email} • {booking.phone}</p>
            </div>
            <div>
              {isKids ? (
                <div className="text-foreground/80 space-y-1">
                  <p><strong>Kind:</strong> {booking.birthdayChildName} ({booking.birthdayChildAge} Jahre)</p>
                  <p><strong>Gäste:</strong> {booking.kidsCount} Kinder, {booking.adultsCount} Erw.</p>
                  <p><strong>Paket:</strong> {booking.package}</p>
                  {booking.additions && <p><strong>Extras:</strong> {booking.additions}</p>}
                </div>
              ) : booking.type === 'squash' && booking.squashRole ? (
                <div className="text-foreground/80 space-y-1">
                  <p className="text-green-600 font-bold">Interne Reservierung</p>
                  <p><strong>Kurs:</strong> {booking.squashCourseName}</p>
                  <p><strong>Rolle:</strong> {booking.squashRole}</p>
                </div>
              ) : booking.type === 'event' ? (
                <div className="text-foreground/80 space-y-1">
                  <p><strong>Location:</strong> {booking.eventLocation} ({booking.eventType})</p>
                  <p><strong>Gäste:</strong> {booking.people} Personen</p>
                  <p><strong>Paket:</strong> {booking.package}</p>
                  {booking.eventBuffet && <p><strong>Buffet:</strong> {booking.eventBuffet}</p>}
                  {booking.eventServiceStaff > 0 && <p><strong>Servicekräfte:</strong> {booking.eventServiceStaff} (ca. {booking.eventDuration} Std)</p>}
                  {booking.eventMusicTech && <p><strong>Musik/Technik:</strong> {booking.eventMusicTech}</p>}
                  {booking.eventSetupTime && <p className="text-blue-500"><strong>Hinweis:</strong> Früherer Aufbau gewünscht</p>}
                </div>
              ) : booking.type === 'dartkegeln' ? (
                <div className="text-foreground/80 space-y-1">
                  <p><strong>Ressourcen:</strong> {booking.people} Personen</p>
                  <p><strong>Kategorie:</strong> {booking.package}</p>
                  {booking.additions && <p><strong>Details:</strong> {booking.additions}</p>}
                </div>
              ) : (
                <div className="text-foreground/80 space-y-1">
                  <p>
                    <strong>Ressourcen:</strong> {booking.people} Personen 
                    {booking.lanes && ` • ${booking.lanes} Bahnen benötigt`}
                  </p>
                  {booking.type === 'bowling' && (
                    <p>
                      <strong>Zugewiesene Bowlingbahn:</strong> {booking.assignedLanes ? (
                        <span className="font-bold text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded">{booking.assignedLanes}</span>
                      ) : (
                        <span className="text-red-500 font-bold">Noch keine Zuweisung!</span>
                      )}
                    </p>
                  )}
                </div>
              )}
              {booking.wantsFood && !isKids && (
                <p className="text-orange-500 font-medium flex items-center gap-1 mt-2">
                  <Utensils size={14} /> Gastronomie gewünscht {booking.bowlingFoodTiming && `(${booking.bowlingFoodTiming})`}
                </p>
              )}
            </div>
          </div>

          {booking.notes && (
            <div className="mt-4 bg-amber-500/10 border-l-4 border-amber-500 p-3 rounded-r-lg text-sm text-amber-800 flex gap-2">
              <MessageSquare size={16} className="shrink-0 mt-0.5" />
              <div>
                <strong>Kundenwunsch:</strong><br/>
                {booking.notes}
              </div>
            </div>
          )}

          {booking.internalNotes && (
            <div className="mt-2 bg-blue-500/10 border-l-4 border-blue-500 p-3 rounded-r-lg text-sm text-blue-800 flex gap-2">
              <Lock size={16} className="shrink-0 mt-0.5" />
              <div>
                <strong>Interne Info:</strong><br/>
                {booking.internalNotes}
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-foreground/10 flex justify-end gap-3">
            {booking.type === 'event' && (
              <Link 
                href={`/admin/offers/${booking.id}`}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 transition-colors mr-auto"
              >
                Angebot verwalten
              </Link>
            )}
            <button 
              onClick={handleMarkNoShow}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 transition-colors"
              title="Als 'Nicht erschienen' markieren"
            >
              Nicht erschienen
            </button>
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-foreground/5 hover:bg-foreground/10 text-foreground/80 transition-colors"
            >
              <Edit size={16} /> Bearbeiten
            </button>
            <button 
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 transition-colors"
            >
              <Trash2 size={16} /> Stornieren
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={handleUpdate} className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Buchung bearbeiten</h3>
            <button type="button" onClick={() => setIsEditing(false)} className="text-foreground/50 hover:text-foreground">
              <XCircle size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Datum</label>
              <input type="date" name="date" defaultValue={booking.date} className="w-full bg-background border rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Uhrzeit</label>
              <input type="time" name="time" defaultValue={booking.time} className="w-full bg-background border rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Dauer (h)</label>
              <input type="number" name="duration" defaultValue={booking.duration} min="1" max="5" className="w-full bg-background border rounded-lg px-3 py-2 text-sm" required />
            </div>
            {!isKids && (
              <div>
                <label className="block text-xs font-medium mb-1">Personen</label>
                <input type="number" name="people" defaultValue={booking.people} min="1" max="32" className="w-full bg-background border rounded-lg px-3 py-2 text-sm" required />
              </div>
            )}
          </div>

          {isKids && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 border-t pt-4 mt-4 border-foreground/5">
                <div>
                  <label className="block text-xs font-medium mb-1">Geburtstagskind</label>
                  <input type="text" name="birthdayChildName" defaultValue={booking.birthdayChildName || ""} className="w-full bg-background border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Alter (Jahre)</label>
                  <input type="number" name="birthdayChildAge" defaultValue={booking.birthdayChildAge || ""} className="w-full bg-background border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Anzahl Kinder</label>
                  <input type="number" name="kidsCount" defaultValue={booking.kidsCount || ""} className="w-full bg-background border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Anzahl Erwachsene</label>
                  <input type="number" name="adultsCount" defaultValue={booking.adultsCount || ""} className="w-full bg-background border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Paket</label>
                  <input type="text" name="package" defaultValue={booking.package || ""} className="w-full bg-background border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Zusatzoptionen</label>
                  <input type="text" name="additions" defaultValue={booking.additions || ""} className="w-full bg-background border rounded-lg px-3 py-2 text-sm" placeholder="Waltraut, Candybar..." />
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 mt-4 border-foreground/5">
            <div>
              <label className="block text-xs font-medium mb-1">Name Besteller</label>
              <input type="text" name="name" defaultValue={booking.name} className="w-full bg-background border rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">E-Mail</label>
              <input type="email" name="email" defaultValue={booking.email} className="w-full bg-background border rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Telefon</label>
              <input type="tel" name="phone" defaultValue={booking.phone} className="w-full bg-background border rounded-lg px-3 py-2 text-sm" required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {!isKids && (
               <div className="flex flex-col sm:flex-row gap-4">
                 <div className="flex-1">
                  <label className="block text-xs font-medium mb-1">Gastronomie?</label>
                  <select name="wantsFood" defaultValue={booking.wantsFood ? "true" : "false"} className="w-full bg-background border rounded-lg px-3 py-2 text-sm">
                    <option value="true">Ja</option>
                    <option value="false">Nein</option>
                  </select>
                 </div>
                 {booking.type === 'bowling' && (
                   <div className="flex-1">
                    <label className="block text-xs font-medium mb-1">Essens-Zeitpunkt</label>
                    <select name="bowlingFoodTiming" defaultValue={booking.bowlingFoodTiming || ""} className="w-full bg-background border rounded-lg px-3 py-2 text-sm">
                      <option value="">Keine Angabe</option>
                      <option value="vorher">Vor dem Bowling</option>
                      <option value="mittendrin">Mittendrin</option>
                      <option value="nachher">Nach dem Bowling</option>
                    </select>
                   </div>
                 )}
               </div>
             )}
            <div>
              <label className="block text-xs font-medium mb-1">Gesamtpreis (€)</label>
              {booking.type === 'bowling' ? (
                 <input type="text" disabled value="Wird automatisch neu berechnet" className="w-full bg-foreground/5 border rounded-lg px-3 py-2 text-sm text-foreground/50" />
              ) : (
                 <input type="number" step="0.01" name="totalPrice" defaultValue={booking.totalPrice} className="w-full bg-background border rounded-lg px-3 py-2 text-sm" required />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Kundenanmerkung</label>
              <textarea name="notes" defaultValue={booking.notes || ""} rows={2} className="w-full bg-background border rounded-lg px-3 py-2 text-sm resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-blue-500 flex items-center gap-1"><Lock size={12}/> Interne Infos (Nur für Service)</label>
              <textarea name="internalNotes" defaultValue={booking.internalNotes || ""} rows={2} className="w-full bg-background border border-blue-200 rounded-lg px-3 py-2 text-sm resize-none" placeholder="z.B. Tisch reservieren, Extras aufbauen..." />
            </div>
          </div>

          {booking.type === 'bowling' && (
            <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <label className="block text-xs font-bold text-blue-600 mb-2">Bahnen Zuweisung</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(lane => {
                  const laneStr = lane.toString();
                  const isSelected = selectedLanes.includes(laneStr);
                  return (
                    <button
                      key={lane}
                      type="button"
                      onClick={() => {
                        setSelectedLanes(prev => 
                          prev.includes(laneStr) ? prev.filter(l => l !== laneStr) : [...prev, laneStr].sort()
                        );
                      }}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all border ${
                        isSelected 
                          ? 'bg-blue-500 border-blue-500 text-white shadow-md' 
                          : 'bg-background border-foreground/10 text-foreground/70 hover:border-blue-500/50'
                      }`}
                    >
                      Bahn {lane}
                    </button>
                  );
                })}
              </div>
              <input type="hidden" name="assignedLanes" value={selectedLanes.length > 0 ? selectedLanes.map(l => `Bahn ${l}`).join(", ") : ""} />
              <p className="text-[10px] text-foreground/50 mt-2">Klicke auf die Bahnen, um sie dieser Buchung zuzuweisen.</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm rounded-lg bg-foreground/5 hover:bg-foreground/10 font-medium">
              Abbrechen
            </button>
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold transition-all disabled:opacity-50">
              {isSubmitting ? "Speichert..." : <><CheckCircle size={16} /> Speichern</>}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
