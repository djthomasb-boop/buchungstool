"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Target, Clock, Users, CalendarDays, Info, User, Mail, Phone, Utensils, MessageSquare, CheckCircle2, AlertCircle, Sparkles, BookOpen } from "lucide-react";
import { submitBooking, getDartKegelnAvailability } from "@/app/actions/booking";

export default function DartKegelnPage() {
  const [step, setStep] = useState(1);
  const [bookingCategory, setBookingCategory] = useState<"event" | "kurs" | "dart" | "kegeln">("event");
  
  // Event sub-options
  const [eventType, setEventType] = useState<"Firmenfeier" | "Familienfeier" | "Vereinsfeier" | "Sonstiges">("Firmenfeier");
  const [eventDetails, setEventDetails] = useState("");

  // Kurs sub-options
  const [kursType, setKursType] = useState<"intern" | "extern">("intern");
  const [kursName, setKursName] = useState("");

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(1); // in hours
  const [people, setPeople] = useState(4); // default 4

  // Kontakt & Extras
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [wantsFood, setWantsFood] = useState<boolean | null>(null);
  const [foodTiming, setFoodTiming] = useState<"vorher" | "mittendrin" | "nachher" | null>(null);
  const [notes, setNotes] = useState("");

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Availability State
  const [availabilitySlots, setAvailabilitySlots] = useState<string[]>([]);
  const [bookedIntervals, setBookedIntervals] = useState<{ start: number; end: number }[]>([]);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  // Price Calculation
  const pricePerHour = (bookingCategory === "kegeln" || bookingCategory === "dart") ? 10 : 0;
  const totalPrice = bookingCategory === "event" || bookingCategory === "kurs" ? 0 : pricePerHour * duration;

  // Minimum date for Kegeln (must be at least 3 days in advance)
  const minKegelnYMD = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minDate = new Date(today);
    minDate.setDate(minDate.getDate() + 3);
    const yyyy = minDate.getFullYear();
    const mm = String(minDate.getMonth() + 1).padStart(2, '0');
    const dd = String(minDate.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // Generate dates up to 31.12.2026
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  
  useEffect(() => {
    const dates = [];
    const today = new Date();
    const endOfYear = new Date(2026, 11, 31); // 11 = December
    
    const current = new Date(today);
    const limit = current > endOfYear ? new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) : endOfYear;
    
    while (current <= limit) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    setAvailableDates(dates);

    const currentMonthStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(currentMonthStr);
  }, []);

  const uniqueMonths = useMemo(() => {
    const monthsMap = new Map<string, { label: string; year: number; month: number }>();
    availableDates.forEach(d => {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthsMap.has(key)) {
        const label = d.toLocaleDateString('de-DE', { month: 'long' });
        monthsMap.set(key, { label, year: d.getFullYear(), month: d.getMonth() });
      }
    });
    return Array.from(monthsMap.entries()).map(([key, val]) => ({
      key,
      ...val
    }));
  }, [availableDates]);

  const filteredDates = useMemo(() => {
    return availableDates.filter(d => {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === selectedMonth;
    });
  }, [availableDates, selectedMonth]);

  useEffect(() => {
    if (date) {
      const monthPart = date.substring(0, 7);
      if (monthPart) {
        setSelectedMonth(monthPart);
      }
    }
  }, [date]);

  // Reset invalid date when switching to Kegeln
  useEffect(() => {
    if (bookingCategory === "kegeln" && date && date < minKegelnYMD) {
      setDate("");
      setTime("");
    }
  }, [bookingCategory, date, minKegelnYMD]);

  // Fetch Availability
  useEffect(() => {
    if (!date) return;
    let isMounted = true;
    const fetchAvailability = async () => {
      setIsLoadingAvailability(true);
      const res = await getDartKegelnAvailability(date);
      if (isMounted && res.success) {
        if (res.isBlocked) {
          setIsBlocked(true);
          setBlockReason(res.blockReason || "Keine Buchungen möglich");
          setAvailabilitySlots([]);
          setBookedIntervals([]);
          setExistingBookings([]);
        } else {
          setIsBlocked(false);
          setBlockReason("");
          setAvailabilitySlots(res.availableTimes || []);
          setBookedIntervals(res.bookedIntervals || []);
          setExistingBookings(res.existingBookings || []);
        }
      }
      if (isMounted) setIsLoadingAvailability(false);
    };
    fetchAvailability();
    return () => { isMounted = false; };
  }, [date]);

  const timeToMins = (t: string): number => {
    if (!t || t === "Ganztägig") return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  };

  // Filter slots by selected duration & category rules
  const availableSlots = useMemo(() => {
    if (!date) return [];
    if (bookingCategory === "event") return ["Ganztägig"];

    return availabilitySlots.filter(slot => {
      const start = timeToMins(slot);
      const end = start + duration * 60;

      // Check basic overlap with any booking
      const hasBasicOverlap = bookedIntervals.some(b => start < b.end && end > b.start);
      if (hasBasicOverlap) return false;

      // 4. KEGELN RULE: Must end at least 1h before any Kurs OR start at least 1h after any Kurs!
      if (bookingCategory === "kegeln" && existingBookings && existingBookings.length > 0) {
        const hasKursBufferOverlap = existingBookings.some(b => {
          if (!b.isKurs) return false;
          // Buffer: 1 hour (60 min) before kursStart and 1 hour (60 min) after kursEnd
          const bufferStart = b.start - 60;
          const bufferEnd = b.end + 60;
          return start < bufferEnd && end > bufferStart;
        });
        if (hasKursBufferOverlap) return false;
      }

      return true;
    });
  }, [availabilitySlots, bookedIntervals, existingBookings, duration, date, bookingCategory]);

  const getLocalYMD = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const canAdvanceStep1 = useMemo(() => {
    if (!date) return false;
    if (bookingCategory !== "event" && !time) return false;
    if (wantsFood === null) return false;
    if (wantsFood && !foodTiming) return false;
    return true;
  }, [date, bookingCategory, time, wantsFood, foodTiming]);

  const canSubmit = useMemo(() => {
    if (!date) return false;
    if (bookingCategory !== "event" && !time) return false;
    
    if (wantsFood === null) return false;
    if (wantsFood && !foodTiming) return false;

    if (bookingCategory === "kurs") {
      if (!kursName.trim()) return false;
      if (kursType === "extern") {
        return Boolean(name.trim() && email.trim() && phone.trim());
      }
      return true; // intern course only needs kursName
    }

    return Boolean(name.trim() && email.trim() && phone.trim());
  }, [date, bookingCategory, time, wantsFood, foodTiming, kursName, kursType, name, email, phone]);

  const handleBooking = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    const finalName = bookingCategory === "kurs" && kursType === "intern" 
      ? `[Interner Kurs] ${kursName}` 
      : name;

    const finalEmail = bookingCategory === "kurs" && kursType === "intern"
      ? (email || "intern@befree.de")
      : email;

    const finalPhone = bookingCategory === "kurs" && kursType === "intern"
      ? (phone || "Intern")
      : phone;

    const additionsText = bookingCategory === "event" 
      ? `Event Typ: ${eventType}${eventDetails ? `, Details: ${eventDetails}` : ""}`
      : bookingCategory === "kurs"
      ? `Kursname: ${kursName}, Art: ${kursType === "intern" ? "Intern" : "Extern"}`
      : "";

    const packageText = bookingCategory === "event"
      ? "Event"
      : bookingCategory === "kurs"
      ? (kursType === "intern" ? "Kurs (Intern)" : "Kurs (Extern)")
      : bookingCategory === "kegeln"
      ? "Kegeln"
      : "Dart";

    const finalNotes = bookingCategory === "kurs" && kursName
      ? `Kursname: ${kursName}${notes ? ` | Anmerkung: ${notes}` : ""}`
      : notes;

    const result = await submitBooking({
      type: "dartkegeln",
      date,
      time: bookingCategory === "event" ? "Ganztägig" : time,
      duration: bookingCategory === "event" ? 12 : duration,
      people,
      shoes: 0,
      lanes: null,
      name: finalName,
      email: finalEmail,
      phone: finalPhone,
      wantsFood: Boolean(wantsFood),
      bowlingFoodTiming: wantsFood ? foodTiming : null,
      notes: finalNotes,
      totalPrice,
      package: packageText,
      additions: additionsText
    });

    setIsSubmitting(false);
    if (result.success) {
      setIsSuccess(true);
      window.scrollTo(0, 0);
    } else {
      alert(result.error || "Ein Fehler ist aufgetreten.");
    }
  };

  if (isSuccess) {
    return (
      <main className="min-h-screen bg-background p-8 flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-amber-500/15 blur-[120px] pointer-events-none" />
        <div className="glass p-12 rounded-3xl text-center max-w-lg border border-amber-500/20 shadow-2xl relative z-10">
          <CheckCircle2 size={64} className="text-amber-500 mx-auto mb-6" />
          <h1 className="text-3xl font-extrabold tracking-tight mb-4">Buchung erfolgreich!</h1>
          <p className="text-foreground/70 mb-8">
            Vielen Dank für deine Reservierung. Wir haben eine Bestätigungs-E-Mail gesendet.
          </p>
          <div className="bg-foreground/5 rounded-2xl p-6 text-left mb-8 border border-foreground/10">
            <h3 className="font-bold mb-3">Zusammenfassung:</h3>
            <p className="text-sm text-foreground/80 mb-1">
              🎯 Bereich: <span className="font-bold capitalize">{bookingCategory === "event" ? "Event / Feier" : bookingCategory === "kurs" ? "Kursraum" : bookingCategory}</span>
            </p>
            <p className="text-sm text-foreground/80 mb-1">
              📅 Datum: <span className="font-bold">{new Date(date).toLocaleDateString('de-DE')}</span>
            </p>
            <p className="text-sm text-foreground/80 mb-1">
              ⏰ Uhrzeit: <span className="font-bold">{bookingCategory === "event" ? "Ganztägig" : `${time} Uhr (${duration} Std.)`}</span>
            </p>
            <p className="text-sm text-foreground/80">
              💰 Gesamtpreis: <span className="font-extrabold text-amber-500">{totalPrice > 0 ? `${totalPrice.toFixed(2)} €` : "Preis auf Anfrage / Kostenlos"}</span>
            </p>
          </div>
          <Link href="/" className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all shadow-lg shadow-amber-500/20 hover:scale-105">
            <ArrowLeft size={18} className="mr-2" /> Zurück zur Startseite
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-amber-500/15 blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <Link href="/" className="inline-flex items-center text-amber-500 hover:underline mb-8 font-semibold">
          <ArrowLeft size={16} className="mr-2" /> Zurück zur Übersicht
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="bg-amber-500/10 p-3 rounded-2xl text-amber-500">
            <Target size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Kurs- & Eventraum / Kegelbahn</h1>
            <p className="text-foreground/60 mt-1 max-w-2xl text-sm leading-relaxed">
              Dieser Raum ist ideal für Kurse (intern/extern), für Familien- & Firmenfeiern bis zu 80 Personen. Hier ist auch die Kegelbahn und Dart buchbar.
            </p>
          </div>
        </div>

        {/* Stepper Progress */}
        <div className="flex items-center justify-between mb-12 relative max-w-xs mx-auto">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-foreground/10 -z-10 rounded-full" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-amber-500 -z-10 rounded-full transition-all duration-300" style={{ width: `${((step - 1) / 1) * 100}%` }} />
          {[1, 2].map((i) => (
            <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
              step >= i ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 scale-105' : 'bg-background border-2 border-foreground/10 text-foreground/40'
            }`}>
              {i}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {step === 1 ? (
              <div className="glass p-6 sm:p-8 rounded-3xl border border-foreground/5 space-y-8 animate-slide-up">
                
                {/* A. Kategorie wählen */}
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span> 1. Was möchtest du buchen?
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Priority 1: Event */}
                    <button
                      type="button"
                      onClick={() => { setBookingCategory("event"); setPeople(40); setTime("Ganztägig"); }}
                      className={`p-5 rounded-2xl border text-left transition-all relative ${
                        bookingCategory === "event" ? 'border-amber-500 bg-amber-500/10 text-amber-500 ring-2 ring-amber-500/30' : 'border-foreground/10 bg-background/50 hover:border-amber-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-lg">1. Event / Feier</span>
                        <span className="bg-amber-500/20 text-amber-600 font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-full">Vorrang #1</span>
                      </div>
                      <span className="block text-xs text-foreground/60 leading-relaxed">Feiere mit bis zu 80 Personen (Familien-, Firmen- & Vereinsfeiern). Ganztägig belegt.</span>
                      <span className="block text-xs font-bold text-amber-500 mt-2">Preis auf Anfrage</span>
                    </button>

                    {/* Priority 2: Kurs */}
                    <button
                      type="button"
                      onClick={() => { setBookingCategory("kurs"); setPeople(10); setTime(""); }}
                      className={`p-5 rounded-2xl border text-left transition-all relative ${
                        bookingCategory === "kurs" ? 'border-amber-500 bg-amber-500/10 text-amber-500 ring-2 ring-amber-500/30' : 'border-foreground/10 bg-background/50 hover:border-amber-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-lg">2. Kurse</span>
                        <span className="bg-blue-500/20 text-blue-600 font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-full">Vorrang #2</span>
                      </div>
                      <span className="block text-xs text-foreground/60 leading-relaxed">Veranstalte oder besuche Kurse in unserem Kursraum.</span>
                      <span className="block text-xs font-bold text-amber-500 mt-2">Intern / Extern</span>
                    </button>

                    {/* Priority 3: Dart */}
                    <button
                      type="button"
                      onClick={() => { setBookingCategory("dart"); setPeople(4); setTime(""); }}
                      className={`p-5 rounded-2xl border text-left transition-all relative ${
                        bookingCategory === "dart" ? 'border-amber-500 bg-amber-500/10 text-amber-500 ring-2 ring-amber-500/30' : 'border-foreground/10 bg-background/50 hover:border-amber-500/30'
                      }`}
                    >
                      <span className="block font-bold text-lg mb-1">3. Dart</span>
                      <span className="block text-xs text-foreground/60 leading-relaxed">Präzision und Spaß an unseren Dartscheiben.</span>
                      <span className="block text-xs font-bold text-amber-500 mt-2">10,00 € / Stunde</span>
                    </button>

                    {/* Priority 4: Kegeln */}
                    <button
                      type="button"
                      onClick={() => { setBookingCategory("kegeln"); setPeople(8); setTime(""); }}
                      className={`p-5 rounded-2xl border text-left transition-all relative ${
                        bookingCategory === "kegeln" ? 'border-amber-500 bg-amber-500/10 text-amber-500 ring-2 ring-amber-500/30' : 'border-foreground/10 bg-background/50 hover:border-amber-500/30'
                      }`}
                    >
                      <span className="block font-bold text-lg mb-1">4. Kegeln</span>
                      <span className="block text-xs text-foreground/60 leading-relaxed">Gute Stimmung auf unserer Kegelbahn (mind. 3 Tage Vorlauf).</span>
                      <span className="block text-xs font-bold text-amber-500 mt-2">10,00 € / Stunde</span>
                    </button>
                  </div>

                  {bookingCategory === "event" && (
                    <div className="mt-6 p-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-4 animate-slide-up">
                      <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                        <Sparkles size={18} />
                        <span>Events reservieren den Raum ganztägig</span>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold mb-2">Art des Events</label>
                          <select
                            value={eventType}
                            onChange={(e) => setEventType(e.target.value as any)}
                            className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                          >
                            <option value="Firmenfeier">Firmenfeier</option>
                            <option value="Familienfeier">Familienfeier</option>
                            <option value="Vereinsfeier">Vereinsfeier</option>
                            <option value="Sonstiges">Sonstiges</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold mb-2">Details / Anlass</label>
                          <input
                            type="text"
                            placeholder="z.B. runder Geburtstag, Sommerfest..."
                            value={eventDetails}
                            onChange={(e) => setEventDetails(e.target.value)}
                            className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {bookingCategory === "kegeln" && (
                    <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                      <Info size={16} className="shrink-0" />
                      <span>
                        <strong>Hinweis zur Kegelbahn:</strong> Buchungen müssen mindestens 3 Tage im Voraus erfolgen. Um den Auf- und Abbau zu ermöglichen, muss die Buchung mindestens 1 Stunde vor oder nach einem Kurs liegen.
                      </span>
                    </div>
                  )}
                </div>

                {/* B. Wann & Wie lange */}
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span> 2. Wann möchtest du buchen?
                  </h3>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-3 text-foreground/80">Monat auswählen</label>
                    <div className="flex flex-wrap gap-2 mb-6 p-1 bg-foreground/5 rounded-2xl w-fit">
                      {uniqueMonths.map((m) => (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => {
                            setSelectedMonth(m.key);
                            setDate("");
                            setTime("");
                          }}
                          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                            selectedMonth === m.key
                              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                              : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'
                          }`}
                        >
                          {m.label} {m.year}
                        </button>
                      ))}
                    </div>

                    <label className="block text-sm font-medium mb-3 text-foreground/80">Tag auswählen</label>
                    <div className="flex gap-3 overflow-x-auto pb-4 snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {filteredDates.map((d) => {
                        const ymd = getLocalYMD(d);
                        const isSelected = date === ymd;
                        const isSunday = d.getDay() === 0;
                        const isTooSoonForKegeln = bookingCategory === "kegeln" && ymd < minKegelnYMD;
                        const isDisabled = isSunday || isTooSoonForKegeln;
                        
                        const dayName = d.toLocaleDateString('de-DE', { weekday: 'short' });
                        const dayNum = d.getDate();
                        const monthName = d.toLocaleDateString('de-DE', { month: 'short' });

                        const todayStr = getLocalYMD(new Date());
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        const tomorrowStr = getLocalYMD(tomorrow);

                        const labelText = ymd === todayStr ? 'Heute' : ymd === tomorrowStr ? 'Morgen' : dayName;

                        return (
                          <button
                            key={ymd}
                            onClick={() => {
                              if (!isDisabled) {
                                setDate(ymd);
                                setTime(bookingCategory === "event" ? "Ganztägig" : "");
                              }
                            }}
                            disabled={isDisabled}
                            title={isTooSoonForKegeln ? "Kegeln erfordert mind. 3 Tage Vorlaufzeit" : isSunday ? "Sonntags geschlossen" : ""}
                            className={`flex-none snap-start w-24 h-24 rounded-2xl flex flex-col items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105'
                                : isDisabled
                                ? 'bg-foreground/5 text-foreground/30 cursor-not-allowed border border-foreground/5'
                                : 'bg-background border border-foreground/10 text-foreground/80 hover:border-amber-500/50 hover:bg-amber-500/5'
                            }`}
                          >
                            <span className={`text-xs uppercase font-bold tracking-wider ${isSelected ? 'text-amber-100' : 'text-foreground/50'}`}>
                              {labelText}
                            </span>
                            <span className="text-2xl font-black mt-1 mb-0.5">{dayNum}</span>
                            <span className={`text-xs ${isSelected ? 'text-amber-100' : 'text-foreground/50'}`}>{monthName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {bookingCategory !== "event" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                      <div>
                        <label className="block text-sm font-bold mb-2">Dauer (Stunden)</label>
                        <select
                          value={duration}
                          onChange={(e) => {
                            setDuration(parseInt(e.target.value));
                            setTime("");
                          }}
                          className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                        >
                          <option value={1}>1 Stunde</option>
                          <option value={2}>2 Stunden</option>
                          <option value={3}>3 Stunden</option>
                          <option value={4}>4 Stunden</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-bold mb-2">Anzahl Personen</label>
                        <input
                          type="number"
                          min={1}
                          max={80}
                          value={people}
                          onChange={(e) => setPeople(Math.max(1, Math.min(80, parseInt(e.target.value) || 1)))}
                          className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* C. Zeit auswählen */}
                {bookingCategory === "event" ? (
                  <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-800 flex items-center gap-3">
                    <CheckCircle2 size={24} className="shrink-0 text-amber-600" />
                    <div>
                      <strong>Ganztägige Belegung:</strong>
                      <p className="text-xs text-amber-800/80 mt-0.5">
                        Für Events muss keine Uhrzeit ausgewählt werden – der Raum ist am gewählten Tag ganztägig für dich reserviert.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span> 3. Freie Uhrzeit wählen
                    </h3>
                    
                    <div className="min-h-[120px]">
                      {!date ? (
                        <div className="bg-foreground/5 border border-foreground/10 p-8 rounded-xl text-center text-foreground/50">
                          Bitte wähle zuerst ein Datum aus.
                        </div>
                      ) : isBlocked ? (
                        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-xl text-center text-red-600 animate-fade-in shadow-inner">
                          <AlertCircle size={48} className="mx-auto mb-4 opacity-80" />
                          <h3 className="text-xl font-bold mb-2">Online-Buchung nicht möglich</h3>
                          <p className="text-red-600/80">
                            Am gewählten Datum sind leider keine regulären Buchungen möglich.<br/>
                            <strong>Grund:</strong> {blockReason}
                          </p>
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <div className="bg-foreground/5 border border-foreground/10 p-8 rounded-xl text-center text-foreground/50 animate-fade-in">
                          {bookingCategory === "kegeln" 
                            ? "An diesem Tag ist kein Termin für Kegeln frei (beachte den 1-Stunden-Abstand vor/nach Kursen)."
                            : `An diesem Tag ist leider kein passender Termin mehr frei für ${duration} Std.`}
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                          {availableSlots.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setTime(t)}
                              className={`py-3.5 rounded-xl text-sm font-bold transition-all border ${
                                time === t
                                  ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20 scale-105'
                                  : 'bg-background hover:border-amber-500/50 hover:bg-amber-500/5 text-foreground/80 border-foreground/10'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* D. Gastronomie */}
                <div className="pt-6 border-t border-foreground/10">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span> 4. Gastronomie & Snacks
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <button
                      type="button"
                      onClick={() => setWantsFood(true)}
                      className={`p-4 rounded-xl text-left border transition-all flex flex-col gap-1 ${
                        wantsFood === true
                          ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                          : 'bg-background border-foreground/10 hover:border-amber-500/50 text-foreground/80'
                      }`}
                    >
                      <span className="font-bold">Ja, gerne! 🍕</span>
                      <span className="text-xs opacity-70">Wir bereiten die Speisekarten für euch vor.</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWantsFood(false)}
                      className={`p-4 rounded-xl text-left border transition-all flex flex-col gap-1 ${
                        wantsFood === false
                          ? 'bg-foreground/10 border-foreground/30 text-foreground'
                          : 'bg-background border-foreground/10 hover:border-foreground/30 text-foreground/80'
                      }`}
                    >
                      <span className="font-bold">Nein, danke. 🎯</span>
                      <span className="text-xs opacity-70">Wir möchten nur spielen/nutzen.</span>
                    </button>
                  </div>

                  {wantsFood && (
                    <div className="mb-6 animate-slide-up">
                      <label className="block text-sm font-medium mb-3 text-foreground/80 font-bold">Wann möchtet ihr essen?</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {["vorher", "mittendrin", "nachher"].map((timing) => (
                          <button
                            key={timing}
                            type="button"
                            onClick={() => setFoodTiming(timing as any)}
                            className={`p-3 rounded-xl border text-sm font-bold transition-all capitalize ${
                              foodTiming === timing ? 'bg-amber-500 text-white border-amber-500' : 'bg-background text-foreground/80 border-foreground/10 hover:border-amber-500/50'
                            }`}
                          >
                            {timing} dem Nutzen
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-foreground/10">
                  <button
                    type="button"
                    disabled={!canAdvanceStep1}
                    onClick={() => { setStep(2); window.scrollTo(0, 0); }}
                    className="flex items-center px-8 py-4 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
                  >
                    Weiter <ArrowRight size={18} className="ml-2" />
                  </button>
                </div>

              </div>
            ) : (
              <div className="glass p-6 sm:p-8 rounded-3xl border border-foreground/5 space-y-8 animate-slide-up">
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span> 5. Kontaktdaten
                  </h3>
                  
                  {bookingCategory === "kurs" ? (
                    <div className="space-y-6">
                      {/* Kurs Art Selector */}
                      <div className="p-4 bg-foreground/5 border border-foreground/10 rounded-2xl">
                        <label className="block text-sm font-bold mb-3">Art des Kurses</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setKursType("intern")}
                            className={`py-3 px-4 rounded-xl font-bold text-sm transition-all border ${
                              kursType === "intern"
                                ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                                : 'bg-background text-foreground/80 border-foreground/10 hover:border-amber-500/50'
                            }`}
                          >
                            Interner Kurs (be free e.V.)
                          </button>
                          <button
                            type="button"
                            onClick={() => setKursType("extern")}
                            className={`py-3 px-4 rounded-xl font-bold text-sm transition-all border ${
                              kursType === "extern"
                                ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                                : 'bg-background text-foreground/80 border-foreground/10 hover:border-amber-500/50'
                            }`}
                          >
                            Externer Kurs (Fremdanbieter)
                          </button>
                        </div>
                      </div>

                      {/* Name des Kurses */}
                      <div>
                        <label className="block text-sm font-bold mb-2">Name des Kurses *</label>
                        <input
                          type="text"
                          placeholder="z.B. Rückenschule, Zumba, Yoga..."
                          value={kursName}
                          onChange={(e) => setKursName(e.target.value)}
                          className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-bold"
                          required
                        />
                      </div>

                      {kursType === "extern" && (
                        <div className="grid sm:grid-cols-2 gap-6 pt-2 border-t border-foreground/10 animate-slide-up">
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-bold mb-2">Ansprechpartner des Kurses *</label>
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold mb-2">E-Mail Adresse *</label>
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold mb-2">Mobilnummer *</label>
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                              required
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-bold mb-2">Name *</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2">E-Mail *</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2">Mobilnummer *</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                    <MessageSquare size={16} /> Anmerkungen & Sonderwünsche
                  </label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
                    placeholder="Sonderwünsche oder sonstige Details..."
                  />
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-foreground/10">
                  <button
                    type="button"
                    onClick={() => { setStep(1); }}
                    className="px-6 py-4 rounded-xl font-bold bg-foreground/5 hover:bg-foreground/10 transition-colors"
                  >
                    Zurück
                  </button>
                  <button
                    type="button"
                    disabled={!canSubmit || isSubmitting}
                    onClick={handleBooking}
                    className="flex items-center px-8 py-4 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                        Wird gebucht...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={18} className="mr-2" /> Verbindlich buchen
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Sidebar Zusammenfassung */}
          <div className="lg:col-span-1">
            <div className="glass p-8 rounded-3xl border border-amber-500/20 bg-amber-500/5 sticky top-8 space-y-6">
              <h3 className="text-xl font-bold mb-4">Zusammenfassung</h3>

              <div className="space-y-4 text-sm text-foreground/80">
                {date && (
                  <div className="pb-4 border-b border-foreground/10">
                    <span className="block font-semibold text-foreground mb-1">Datum:</span>
                    {new Date(date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                    {bookingCategory === "event" ? " (Ganztägig)" : time ? ` um ${time} Uhr` : ""}
                  </div>
                )}

                <div className="pb-4 border-b border-foreground/10 space-y-2">
                  <div className="flex justify-between">
                    <span>Kategorie:</span>
                    <strong className="capitalize">{bookingCategory === "event" ? "Event / Feier" : bookingCategory === "kurs" ? "Kursraum" : bookingCategory}</strong>
                  </div>
                  {bookingCategory === "kurs" && (
                    <div className="flex justify-between">
                      <span>Kurs-Art:</span>
                      <strong>{kursType === "intern" ? "Intern" : "Extern"}</strong>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Personen:</span>
                    <strong>{people}</strong>
                  </div>
                  {bookingCategory !== "event" && (
                    <div className="flex justify-between">
                      <span>Dauer:</span>
                      <strong>{duration} {duration === 1 ? 'Stunde' : 'Stunden'}</strong>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-between items-center text-lg">
                  <span className="font-bold text-foreground">Gesamtpreis:</span>
                  <span className="font-extrabold text-2xl text-amber-500">
                    {totalPrice > 0 ? `${totalPrice.toFixed(2)} €` : "Auf Anfrage / Intern"}
                  </span>
                </div>
                <p className="text-xs text-foreground/50 text-right">inkl. MwSt.</p>
              </div>

              {wantsFood !== null && (
                <div className="bg-amber-500/10 p-4 rounded-xl text-xs space-y-1">
                  <strong>Gastronomie-Info:</strong>
                  <p>{wantsFood ? `Gewünscht (${foodTiming} dem Nutzen)` : 'Keine Verpflegung gewünscht'}</p>
                </div>
              )}

              <p className="text-xs text-center text-foreground/50 mt-4">
                Zahlung erfolgt bequem vor Ort.
              </p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
