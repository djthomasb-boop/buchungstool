"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, CheckCircle, Save, Calendar, Clock, Users, Euro, FileText, Info } from "lucide-react";
import { format, getDay } from "date-fns";
import { de } from "date-fns/locale";
import { submitBooking } from "@/app/actions/booking";

export default function AdminNewEventPage() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState("3");
  const [people, setPeople] = useState("20");
  
  const [eventType, setEventType] = useState("Schulklasse"); // Schulklasse, Firmenfeier, Sonstiges
  const [wantsFood, setWantsFood] = useState(true);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  const [notes, setNotes] = useState("Schulklasse möchte Hüpfburg und Essen"); // prefill with standard example
  const [internalNotes, setInternalNotes] = useState("");
  const [totalPrice, setTotalPrice] = useState("250.00");

  const [dateError, setDateError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validation logic whenever date, time, or eventType changes
  useEffect(() => {
    if (!date) {
      setDateError("");
      return;
    }

    const d = new Date(date);
    const dayOfWeek = getDay(d); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    if (dayOfWeek === 0) {
      setDateError("Allgemeine Buchungen sind nur von Montag bis Samstag möglich. Sonntags ist geschlossen.");
    } else {
      setDateError("");
    }
  }, [date]);

  // Time limits removed in admin area as school classes can book anytime (e.g. 8:00 or 9:00).

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dateError) {
      alert("Bitte korrigiere die Fehler vor dem Absenden.");
      return;
    }

    setIsSubmitting(true);

    const res = await submitBooking({
      type: "event",
      date,
      time,
      duration: parseInt(duration) || 3,
      people: parseInt(people) || 0,
      shoes: 0,
      lanes: null,
      name,
      email: email || "keine@email.de",
      phone,
      wantsFood,
      notes,
      totalPrice: parseFloat(totalPrice) || 0,
      eventType: eventType === "Schulklasse" ? "Schulklasse / Kindergarten" : eventType,
      eventDuration: parseInt(duration) || 3,
      eventLocation: "Allgemeiner Bereich",
      internalNotes
    });

    setIsSubmitting(false);
    if (res.success) {
      setSuccess(true);
      window.scrollTo(0, 0);
    } else {
      alert(res.error || "Es gab ein Problem beim Speichern.");
    }
  };

  if (success) {
    return (
      <main className="p-8">
        <div className="glass p-12 rounded-3xl text-center max-w-lg mx-auto border-blue-500/20">
          <CheckCircle size={64} className="text-blue-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Erfolgreich angelegt!</h1>
          <p className="text-foreground/70 mb-8">
            Die Veranstaltung am {format(new Date(date), "dd.MM.yyyy")} um {time} Uhr wurde erfolgreich eingetragen.
          </p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => { 
                setSuccess(false); 
                setDate(""); 
                setName(""); 
                setEmail(""); 
                setPhone(""); 
                setNotes("Schulklasse möchte Hüpfburg und Essen"); 
                setTotalPrice("250.00");
              }} 
              className="px-6 py-3 rounded-xl bg-foreground/10 font-bold hover:bg-foreground/20"
            >
              Neue Buchung
            </button>
            <Link href="/admin" className="px-6 py-3 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600">
              Zurück zur Tagesübersicht
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-8 max-w-4xl mx-auto">
      <Link href="/admin" className="inline-flex items-center text-blue-500 hover:underline mb-8 font-medium">
        <ArrowLeft size={16} className="mr-2" /> Zurück zum Dashboard
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="bg-blue-500/10 p-3 rounded-2xl text-blue-500">
          <Sparkles size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Veranstaltungen Allgemein buchen</h1>
          <p className="text-foreground/60">Manuelle Buchungen für Schulklassen, Firmenfeiern und andere Events (Montag - Samstag).</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass p-6 sm:p-8 rounded-3xl shadow-sm border border-foreground/5 space-y-8">
        
        {/* Event-Typ & Details */}
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b pb-2"><FileText size={18} className="text-blue-500" /> Event-Details</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold mb-2">Art der Veranstaltung</label>
              <select 
                value={eventType} 
                onChange={e => setEventType(e.target.value)} 
                className="w-full bg-background border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none"
              >
                <option value="Schulklasse">Schulklasse / Kindergarten</option>
                <option value="Firmenfeier">Firmenfeier</option>
                <option value="Verein">Verein / Institution</option>
                <option value="Sonstiges">Sonstige Feier / Veranstaltung</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Gastronomie / Essen erwünscht?</label>
              <div className="flex items-center h-12">
                <label className="relative flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={wantsFood} 
                    onChange={e => setWantsFood(e.target.checked)} 
                    className="w-5 h-5 text-blue-500 border-foreground/10 rounded focus:ring-blue-500" 
                  />
                  <span className="ml-3 text-sm font-medium">Ja, Essen und Getränke buchen</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Datum & Zeit */}
        <div className="border-t border-foreground/5 pt-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b pb-2"><Calendar size={18} className="text-blue-500" /> Datum & Uhrzeit</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold mb-2">Datum (Mon - Sam)</label>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                className={`w-full bg-background border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none ${dateError ? 'border-red-500 ring-2 ring-red-500/10' : ''}`} 
                required 
              />
              {dateError && <p className="text-xs text-red-500 mt-2 flex items-start gap-1"><Info size={12} className="shrink-0 mt-0.5" />{dateError}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Uhrzeit</label>
              <input 
                type="time" 
                value={time} 
                onChange={e => setTime(e.target.value)} 
                className="w-full bg-background border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Dauer (in Stunden)</label>
              <select 
                value={duration} 
                onChange={e => setDuration(e.target.value)} 
                className="w-full bg-background border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none"
              >
                {["1", "2", "3", "4", "5", "6", "7", "8"].map(h => <option key={h} value={h}>{h} Std</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Gruppe & Personen */}
        <div className="border-t border-foreground/5 pt-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b pb-2"><Users size={18} className="text-blue-500" /> Teilnehmer & Besteller</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold mb-2">Name der Gruppe / Schule / Firma</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="z.B. Grundschule Nord - Klasse 4b" 
                className="w-full bg-background border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Personenanzahl</label>
              <input 
                type="number" 
                value={people} 
                onChange={e => setPeople(e.target.value)} 
                min="1" 
                className="w-full bg-background border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none" 
                required 
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 mt-4">
            <div>
              <label className="block text-sm font-bold mb-2">Telefonnummer Ansprechpartner</label>
              <input 
                type="tel" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                placeholder="z.B. 0170 1234567" 
                className="w-full bg-background border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">E-Mail (Optional)</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="z.B. info@schule.de" 
                className="w-full bg-background border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none" 
              />
            </div>
          </div>
        </div>

        {/* Beschreibung & Preis */}
        <div className="border-t border-foreground/5 pt-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b pb-2"><Euro size={18} className="text-blue-500" /> Leistungen & Preis</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold mb-2">Buchungsbeschreibung / Gewünschtes Paket</label>
              <textarea 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                rows={3} 
                className="w-full bg-background border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none resize-none" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Gesamtpreis (€)</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01" 
                  value={totalPrice} 
                  onChange={e => setTotalPrice(e.target.value)} 
                  className="w-full bg-background border rounded-xl px-4 py-3 pr-8 focus:ring-2 focus:ring-blue-500/50 outline-none" 
                  required 
                />
                <span className="absolute right-4 top-3 text-foreground/50">€</span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-bold mb-2 text-blue-500 flex items-center gap-1"><Info size={14}/> Interne Infos (Nur für Mitarbeiter sichtbar)</label>
            <textarea 
              value={internalNotes} 
              onChange={e => setInternalNotes(e.target.value)} 
              rows={2} 
              placeholder="z.B. Hüpfburg in Halle 2 aufbauen, extra Betreuung bereitstellen..." 
              className="w-full bg-background border border-blue-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none resize-none" 
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-6 border-t border-foreground/5">
          <div className="text-xl">
            Gesamtpreis: <span className="font-black text-blue-600">{parseFloat(totalPrice || "0").toFixed(2)} €</span>
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting || !!dateError || !date}
            className="flex items-center px-8 py-4 rounded-full font-bold bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Speichert..." : <><Save size={18} className="mr-2" /> Veranstaltung buchen</>}
          </button>
        </div>

      </form>
    </main>
  );
}
