"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CircleDot, Clock, Users, CalendarDays, Info, User, Mail, Phone, Utensils, MessageSquare, CheckCircle2, AlertCircle } from "lucide-react";
import { submitBooking, getBowlingAvailability } from "@/app/actions/booking";
import { getBowlingStartHours, getMaxBowlingDuration, isBowlingBookingWithinOpeningHours } from "@/lib/bowlingRules";

export default function BowlingPage() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(1); // in hours
  const [people, setPeople] = useState(2); // max 32
  const [bookingPackage, setBookingPackage] = useState<"standard" | "schnitzel">("standard");
  
  // Kontakt & Extras
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [wantsFood, setWantsFood] = useState<boolean | null>(null);
  const [bowlingFoodTiming, setBowlingFoodTiming] = useState<"vorher" | "mittendrin" | "nachher" | null>(null);
  const [notes, setNotes] = useState("");
  
  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Availability State
  const [availability, setAvailability] = useState<number[]>(Array(96).fill(0));
  const [selectedHour, setSelectedHour] = useState<string>("");
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [capacityWarning, setCapacityWarning] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState("");

  // Helper to check if a date is within the June-September promotion range
  const isPromoDate = useMemo(() => {
    if (!date) return false;
    const month = parseInt(date.split("-")[1]);
    return month >= 6 && month <= 9;
  }, [date]);

  // Handle promotion packages requirements
  useEffect(() => {
    if (bookingPackage === "schnitzel") {
      setDuration(2);
      if (people < 4) {
        setPeople(4);
      }
      setWantsFood(true);
    }
  }, [bookingPackage]);

  useEffect(() => {
    // Reset package to standard if the date is changed to a non-promo date
    if (bookingPackage === "schnitzel" && date && !isPromoDate) {
      setBookingPackage("standard");
      setWantsFood(null);
    }
  }, [date, isPromoDate, bookingPackage]);

  // Calculation
  const pricePerHour = 15;
  
  const lanesNeeded = Math.ceil(people / 8);
  const bookingDuration = bookingPackage === "schnitzel" ? 2 : duration;
  const lanePrice = lanesNeeded * bookingDuration * pricePerHour;
  
  const totalPrice = useMemo(() => {
    if (bookingPackage === "schnitzel") {
      return people * 18.00;
    }
    return lanePrice;
  }, [bookingPackage, people, lanePrice]);

  // Generate dates up to 31.12.2026
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  
  useEffect(() => {
    const dates = [];
    const today = new Date();
    const endOfYear = new Date(2026, 11, 31); // 11 = December
    
    const current = new Date(today);
    // If today is somehow already past 2026, show at least 30 days
    const limit = current > endOfYear ? new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) : endOfYear;
    
    while (current <= limit) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    setAvailableDates(dates);

    // Default to current month YYYY-MM
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
      const monthPart = date.substring(0, 7); // YYYY-MM
      if (monthPart) {
        setSelectedMonth(monthPart);
      }
    }
  }, [date]);

  useEffect(() => {
    if (!date) return;
    let isMounted = true;
    const fetchAvailability = async () => {
      setIsLoadingAvailability(true);
      const res = await getBowlingAvailability(date);
      if (isMounted && res.success) {
        if (res.isBlocked) {
          setIsBlocked(true);
          setBlockReason(res.blockReason || "Geschlossene Gesellschaft / Keine Buchungen möglich");
          setAvailability(Array(96).fill(4));
        } else {
          setIsBlocked(false);
          setBlockReason("");
          if (res.lanesUsed) setAvailability(res.lanesUsed);
        }
      }
      if (isMounted) setIsLoadingAvailability(false);
    };
    fetchAvailability();
    return () => { isMounted = false; };
  }, [date]);

  const getLocalYMD = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  
  const availableTimeslots = useMemo(() => {
    if (!date) return [];
    return getBowlingStartHours(date).map((h) => `${h}:00`);
  }, [date]);

  // Sync selectedHour when time changes or date is reset
  useEffect(() => {
    if (time) {
      const hourPart = time.split(":")[0];
      if (hourPart !== selectedHour) {
        setSelectedHour(hourPart);
      }
    } else if (!date) {
      setSelectedHour("");
    }
  }, [time, date, selectedHour]);

  useEffect(() => {
    if (date && time && !availableTimeslots.includes(time)) {
      setTime("");
    }
  }, [date, availableTimeslots, time]);

  const maxDuration = useMemo(() => {
    if (!time || !date) return 3;
    return getMaxBowlingDuration(date, time);
  }, [time, date]);

  useEffect(() => {
    if (bookingPackage === "schnitzel") {
      if (duration !== 2) setDuration(2);
      if (time && maxDuration < 2) setTime("");
    } else if (duration > maxDuration) {
      setDuration(maxDuration);
    }
  }, [bookingPackage, duration, maxDuration, time]);

  const maxFreeLanes = useMemo(() => {
    if (!time) return 4;
    const [hStr, mStr] = time.split(":");
    const startHour = parseInt(hStr);
    const startMin = parseInt(mStr || "0");
    const startIdx = startHour * 4 + Math.floor(startMin / 15);
    const durationQuarters = bookingDuration * 4;
    
    let minFree = 4;
    for (let i = startIdx; i < startIdx + durationQuarters; i++) {
      if (i < 96) {
        const free = 4 - (availability[i] || 0);
        if (free < minFree) minFree = free;
      } else {
        minFree = 0;
      }
    }
    return minFree;
  }, [time, bookingDuration, availability]);

  // Helpers for 15-minute slot time picker
  const getFreeLanesForSlot = (slotTime: string) => {
    const [startHourStr, startMinStr] = slotTime.split(":");
    const startHour = parseInt(startHourStr);
    const startMin = parseInt(startMinStr || "0");
    const startIdx = startHour * 4 + Math.floor(startMin / 15);
    const durationQuarters = bookingDuration * 4;
    
    let minFree = 4;
    for (let i = startIdx; i < startIdx + durationQuarters; i++) {
      if (i < 96) {
        const free = 4 - (availability[i] || 0);
        if (free < minFree) minFree = free;
      } else {
        minFree = 0;
      }
    }
    return minFree;
  };

  const isSlotWithinOpeningHours = (slotTime: string) => {
    if (!date) return false;
    return isBowlingBookingWithinOpeningHours(date, slotTime, bookingDuration);
  };

  const availableHours = useMemo(() => {
    if (!date) return [];
    return getBowlingStartHours(date);
  }, [date]);

  useEffect(() => {
    if (time && maxFreeLanes === 0) {
      setTime("");
    } else if (time) {
      const allowedPeople = maxFreeLanes * 8;
      if (people > allowedPeople && allowedPeople > 0) {
        setPeople(allowedPeople);
        setCapacityWarning(`Die Personenzahl wurde auf ${allowedPeople} reduziert, da für diesen Zeitraum nur ${maxFreeLanes} ${maxFreeLanes === 1 ? 'Bahn' : 'Bahnen'} frei sind.`);
        setTimeout(() => setCapacityWarning(""), 8000);
      }
    }
  }, [maxFreeLanes, time, people]);

  const canSubmit = date && time && isBowlingBookingWithinOpeningHours(date, time, bookingDuration) && name && email && phone && wantsFood !== null && (wantsFood ? bowlingFoodTiming !== null : true) && lanesNeeded <= maxFreeLanes;

  const handleBooking = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    
    const result = await submitBooking({
      type: "bowling",
      date,
      time,
      duration: bookingDuration,
      people,
      shoes: people,
      lanes: lanesNeeded,
      name,
      email,
      phone,
      wantsFood,
      bowlingFoodTiming: wantsFood ? bowlingFoodTiming : null,
      notes,
      totalPrice,
      package: bookingPackage === "schnitzel" ? "Schnitzel-Bowling" : undefined
    });

    setIsSubmitting(false);
    if (result.success) {
      setIsSuccess(true);
    } else {
      alert("Es gab einen Fehler bei der Buchung. Bitte versuche es später nochmal.");
    }
  };

  if (isSuccess) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="glass p-12 rounded-3xl max-w-lg border border-blue-500/20 animate-slide-up">
          <div className="bg-green-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
            <CheckCircle2 size={48} />
          </div>
          <h1 className="text-4xl font-extrabold mb-4">Buchung erfolgreich!</h1>
          <p className="text-foreground/70 mb-8 leading-relaxed">
            Vielen Dank, <strong>{name}</strong>! Wir haben deine Reservierung für {lanesNeeded} {lanesNeeded === 1 ? 'Bahn' : 'Bahnen'} gespeichert. 
            Eine Bestätigung ist per E-Mail an <strong>{email}</strong> unterwegs.
          </p>
          <Link href="/">
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-blue-500/30 w-full">
              Zurück zur Startseite
            </button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-6 md:p-12 relative overflow-hidden">
      {/* Background Decorators */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <Link href="/" className="inline-flex items-center text-blue-500 hover:text-blue-600 transition-colors mb-8 font-medium">
          <ArrowLeft size={16} className="mr-2" /> Zurück zur Übersicht
        </Link>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-blue-500/10 w-16 h-16 rounded-2xl flex items-center justify-center text-blue-500">
            <CircleDot size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Bowling buchen</h1>
            <p className="text-foreground/60">Schnell & unkompliziert deine Bahn sichern.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formular-Bereich */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Sommer-Aktion Banner */}
            <div className="glass p-6 rounded-3xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-transparent relative overflow-hidden animate-slide-up">
              <div className="absolute top-[-50%] right-[-10%] w-[120px] h-[120px] rounded-full bg-blue-500/20 blur-[40px] pointer-events-none" />
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="bg-gradient-to-tr from-blue-500 to-purple-600 text-white font-extrabold text-xs uppercase tracking-widest px-4 py-2 rounded-2xl shadow-lg shadow-blue-500/20 shrink-0">
                  Sommer-Aktion 🎳
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-foreground mb-1">Schnitzel-Bowling (Juni - September)</h3>
                  <p className="text-sm text-foreground/75 leading-relaxed">
                    2 Stunden Bowling & 1 Schnitzelgericht inkl. Knabberteller für nur <strong className="text-blue-500 font-bold">18,00 € pro Person</strong>. 
                    Gültig ab 4 Personen.
                  </p>
                </div>
                <div className="shrink-0 w-full md:w-auto">
                  {!date ? (
                    <span className="text-xs text-foreground/50 block font-medium">Datum wählen zum Aktivieren</span>
                  ) : !isPromoDate ? (
                    <span className="text-xs text-orange-600/70 block font-medium">Aktion im gewählten Monat nicht aktiv</span>
                  ) : bookingPackage === "schnitzel" ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-green-500 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">Aktiviert</span>
                      <button
                        type="button"
                        onClick={() => {
                          setBookingPackage("standard");
                          setWantsFood(null);
                        }}
                        className="text-xs font-bold text-foreground/60 hover:text-foreground bg-foreground/5 hover:bg-foreground/10 py-1.5 px-3 rounded-lg transition-all cursor-pointer"
                      >
                        Deaktivieren
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setBookingPackage("schnitzel")}
                      className="w-full md:w-auto bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                    >
                      Jetzt aktivieren
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 1. Wann & Wie lange */}
            <div className="glass p-8 rounded-3xl animate-slide-up border border-foreground/5">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <CalendarDays className="text-blue-500" size={20} /> Wann möchtet ihr spielen?
              </h2>
              
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
                        setSelectedHour("");
                      }}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                        selectedMonth === m.key
                          ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
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
                          if (!isSunday) {
                            setDate(ymd);
                            setTime("");
                            setSelectedHour("");
                          }
                        }}
                        disabled={isSunday}
                        className={`flex-none snap-start w-24 h-24 rounded-2xl flex flex-col items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105'
                            : isSunday
                            ? 'bg-foreground/5 text-foreground/30 cursor-not-allowed border border-foreground/5'
                            : 'bg-background border border-foreground/10 text-foreground/80 hover:border-blue-500/50 hover:bg-blue-500/5'
                        }`}
                      >
                        <span className={`text-xs uppercase font-bold tracking-wider ${isSelected ? 'text-blue-100' : 'text-foreground/50'}`}>
                          {labelText}
                        </span>
                        <span className="text-2xl font-black mt-1 mb-0.5">{dayNum}</span>
                        <span className={`text-xs ${isSelected ? 'text-blue-100' : 'text-foreground/50'}`}>{monthName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-6 pt-2">
                <label className="block text-sm font-medium mb-4 text-foreground/80">Uhrzeit</label>
                <div className="min-h-[120px]">
                  {!date ? (
                    <div className="bg-foreground/5 border border-foreground/10 p-8 rounded-xl text-center text-foreground/50">
                      Bitte wählen Sie zuerst ein Datum aus.
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
                  ) : availableHours.length === 0 ? (
                    <div className="bg-foreground/5 border border-foreground/10 p-8 rounded-xl text-center text-foreground/50 animate-fade-in">
                      An diesem Tag haben wir leider geschlossen.
                    </div>
                  ) : (
                    <div className="space-y-6 animate-fade-in relative">
                      {isLoadingAvailability && (
                        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                          <span className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></span>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                        {availableHours.map((h) => {
                          const slotTime = `${h}:00`;
                          const isWithinHours = isSlotWithinOpeningHours(slotTime);
                          const freeLanes = getFreeLanesForSlot(slotTime);
                          const isFull = !isWithinHours || freeLanes === 0;
                          const isSelected = time === slotTime;
                          const notEnoughForCurrentPeople = freeLanes > 0 && freeLanes < lanesNeeded;

                          return (
                            <button
                              key={h}
                              type="button"
                              disabled={isFull}
                              onClick={() => {
                                setTime(slotTime);
                                setSelectedHour(h);
                              }}
                              className={`px-3 py-3.5 rounded-xl transition-all flex flex-col items-center justify-center cursor-pointer min-h-[64px] ${
                                isSelected
                                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105 font-bold'
                                  : isFull
                                  ? 'bg-foreground/5 text-foreground/30 cursor-not-allowed border border-foreground/5'
                                  : notEnoughForCurrentPeople
                                  ? 'bg-orange-500/5 text-orange-700 hover:bg-orange-500/10 border border-orange-500/30 hover:border-orange-500/50'
                                  : 'bg-background text-foreground/80 hover:bg-blue-500/5 border border-foreground/10 hover:border-blue-500/50 font-medium'
                              }`}
                            >
                              <span className="text-sm font-bold">{h}:00 Uhr</span>
                              {freeLanes > 0 && freeLanes < 4 && (
                                <span className={`text-[10px] mt-0.5 opacity-80 font-normal ${isSelected ? 'text-white/80' : ''}`}>
                                  {freeLanes} {freeLanes === 1 ? 'Bahn' : 'Bahnen'} frei
                                </span>
                              )}
                              {freeLanes === 4 && (
                                <span className={`text-[10px] mt-0.5 opacity-60 font-normal ${isSelected ? 'text-white/70' : ''}`}>
                                  4 Bahnen frei
                                </span>
                              )}
                              {isFull && (
                                <span className="text-[10px] mt-0.5 opacity-60 font-normal">Belegt</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-foreground/10">
                <label className="block text-sm font-medium mb-2 text-foreground/80 flex items-center gap-2">
                  <Clock size={16} /> Spieldauer (Stunden)
                </label>
                {bookingPackage === "schnitzel" ? (
                  <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl text-blue-600 text-sm font-semibold flex items-center gap-2">
                    <Clock size={18} className="shrink-0" />
                    <span>2 Stunden (festgelegt für Schnitzel-Bowling)</span>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    {[1, 2, 3].map((h) => {
                      const isDisabled = h > maxDuration;
                      return (
                        <button
                          key={h}
                          onClick={() => setDuration(h)}
                          disabled={isDisabled}
                          className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                            duration === h 
                              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                              : isDisabled
                              ? 'bg-foreground/5 text-foreground/30 cursor-not-allowed border border-foreground/5'
                              : 'bg-foreground/5 text-foreground/80 hover:bg-foreground/10'
                          }`}
                        >
                          {h} {h === 1 ? 'Stunde' : 'Stunden'}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Wer ist dabei */}
            <div className="glass p-8 rounded-3xl animate-slide-up border border-foreground/5" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Users className="text-blue-500" size={20} /> Wer ist dabei?
              </h2>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="text-sm font-medium text-foreground/80">
                      Anzahl Personen (Max. {time ? Math.max(8, maxFreeLanes * 8) : 32})
                      {bookingPackage === "schnitzel" && " - Min. 4 Personen für Sommer-Aktion"}
                    </label>
                    <span className="text-3xl font-black text-blue-500">{people}</span>
                  </div>
                  <input 
                    type="range" 
                    min={bookingPackage === "schnitzel" ? "4" : "1"} 
                    max={time && !isBlocked ? Math.max(8, maxFreeLanes * 8) : 32} 
                    value={people} 
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setPeople(val);
                    }}
                    className="w-full accent-blue-500 mb-2 cursor-pointer"
                    disabled={isBlocked}
                  />
                  {capacityWarning && (
                    <div className="text-orange-600 bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl text-xs font-medium animate-slide-up mt-2 flex items-start gap-2">
                      <span>⚠️</span> <span>{capacityWarning}</span>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3 mt-4 bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl text-blue-600 text-sm">
                    <Info size={18} className="shrink-0 mt-0.5" />
                    <p>
                      <strong>{lanesNeeded} {lanesNeeded === 1 ? 'Bahn' : 'Bahnen'}</strong> werden für euch reserviert. 
                      (Maximal 8 Personen pro Bahn).
                    </p>
                  </div>
                  <p className="text-sm text-foreground/60 mt-4">
                    Hinweis: Leihschuhe können vor Ort für 1,50 € pro Person geliehen werden.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Kontaktdaten & Extras */}
            <div className="glass p-8 rounded-3xl animate-slide-up border border-foreground/5" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <User className="text-blue-500" size={20} /> Deine Daten & Extras
              </h2>
              
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground/80 flex items-center gap-2">
                    <User size={16} /> Kompletter Name
                  </label>
                  <input 
                    type="text" 
                    placeholder="Max Mustermann"
                    className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground/80 flex items-center gap-2">
                      <Mail size={16} /> E-Mail Adresse
                    </label>
                    <input 
                      type="email" 
                      placeholder="mail@beispiel.de"
                      className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground/80 flex items-center gap-2">
                      <Phone size={16} /> Mobilfunknummer
                    </label>
                    <input 
                      type="tel" 
                      placeholder="+49 170 1234567"
                      className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-foreground/10">
                <label className="block text-sm font-medium mb-4 text-foreground/80 flex items-center gap-2">
                  <Utensils size={16} /> Wünscht ihr warme Küche oder Snacks beim Bowling?
                </label>
                {bookingPackage === "schnitzel" ? (
                  <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl text-blue-600 text-sm mb-6 flex flex-col gap-1">
                    <span className="font-bold">Inklusive Schnitzelgericht & Knabberteller 🍕</span>
                    <span className="text-xs text-blue-600/80">
                      Die Verpflegung ist im Schnitzel-Bowling-Paket für alle {people} Personen enthalten.
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <button
                      onClick={() => setWantsFood(true)}
                      className={`p-4 rounded-xl text-left border transition-all flex flex-col gap-1 ${
                        wantsFood === true
                          ? 'bg-blue-500/10 border-blue-500 text-blue-600'
                          : 'bg-background border-foreground/10 hover:border-blue-500/50 text-foreground/80'
                      }`}
                    >
                      <span className="font-bold">Ja, gerne! 🍕</span>
                      <span className="text-xs opacity-70">Wir bereiten die Karten für euch vor.</span>
                    </button>
                    <button
                      onClick={() => setWantsFood(false)}
                      className={`p-4 rounded-xl text-left border transition-all flex flex-col gap-1 ${
                        wantsFood === false
                          ? 'bg-foreground/10 border-foreground/30 text-foreground'
                          : 'bg-background border-foreground/10 hover:border-foreground/30 text-foreground/80'
                      }`}
                    >
                      <span className="font-bold">Nein, danke. 🎳</span>
                      <span className="text-xs opacity-70">Wir möchten nur bowlen.</span>
                    </button>
                  </div>
                )}

                {wantsFood && (
                  <div className="mb-6 animate-slide-up">
                    <label className="block text-sm font-medium mb-3 text-foreground/80">Wann möchtet ihr essen?</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button
                        onClick={() => setBowlingFoodTiming("vorher")}
                        className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                          bowlingFoodTiming === "vorher" ? 'bg-blue-500 text-white border-blue-500' : 'bg-background text-foreground/80 border-foreground/10 hover:border-blue-500/50'
                        }`}
                      >
                        Vor dem Bowling
                      </button>
                      <button
                        onClick={() => setBowlingFoodTiming("mittendrin")}
                        className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                          bowlingFoodTiming === "mittendrin" ? 'bg-blue-500 text-white border-blue-500' : 'bg-background text-foreground/80 border-foreground/10 hover:border-blue-500/50'
                        }`}
                      >
                        Mittendrin
                      </button>
                      <button
                        onClick={() => setBowlingFoodTiming("nachher")}
                        className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                          bowlingFoodTiming === "nachher" ? 'bg-blue-500 text-white border-blue-500' : 'bg-background text-foreground/80 border-foreground/10 hover:border-blue-500/50'
                        }`}
                      >
                        Nach dem Bowling
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground/80 flex items-center gap-2">
                    <MessageSquare size={16} /> Besondere Wünsche & Anmerkungen
                  </label>
                  <textarea 
                    rows={3}
                    className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Zusammenfassung / Checkout */}
          <div className="lg:col-span-1">
            <div className="glass p-8 rounded-3xl sticky top-8 border border-blue-500/20 bg-blue-500/5">
              <h3 className="text-xl font-bold mb-6">Zusammenfassung</h3>
              
              <div className="space-y-4 text-sm mb-8">
                {date && time && (
                  <div className="pb-4 border-b border-foreground/10 text-foreground/80">
                    <div className="font-semibold text-foreground mb-1">Gewählter Termin:</div>
                    {new Date(date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}<br/>
                    um {time} Uhr ({bookingDuration}h)
                  </div>
                )}

                {bookingPackage === "schnitzel" ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-blue-600 font-bold">
                      <span>Sommer-Aktion: Schnitzel-Bowling</span>
                      <span>{totalPrice.toFixed(2)} €</span>
                    </div>
                    <div className="text-xs text-foreground/50">
                      {people} Personen x 18,00 € (inkl. 2h Bowling + Essen)
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-foreground/60">{lanesNeeded} {lanesNeeded === 1 ? 'Bahn' : 'Bahnen'} ({bookingDuration}h)</span>
                    <span className="font-medium">{lanePrice.toFixed(2)} €</span>
                  </div>
                )}
                
                <div className="pt-4 border-t border-foreground/10 flex justify-between items-center">
                  <span className="font-bold text-lg">Gesamtbetrag</span>
                  <span className="font-extrabold text-2xl text-blue-500">{totalPrice.toFixed(2)} €</span>
                </div>
                <p className="text-xs text-foreground/50 text-right">inkl. MwSt.</p>

                {wantsFood !== null && (
                  <div className="mt-4 pt-4 border-t border-foreground/10 text-xs text-foreground/60">
                    <strong>Gewähltes Extra:</strong><br />
                    {bookingPackage === "schnitzel"
                      ? `Schnitzel-Bowling Paket ${bowlingFoodTiming ? `(Essen ${bowlingFoodTiming})` : ''}`
                      : wantsFood ? `Gastronomie gewünscht ${bowlingFoodTiming ? `(${bowlingFoodTiming})` : ''}` : 'Nur Bowling'}
                  </div>
                )}
              </div>

              <button 
                onClick={handleBooking}
                disabled={!canSubmit || isSubmitting}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none flex justify-center items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Bitte warten...
                  </>
                ) : !canSubmit ? 'Bitte alle Felder ausfüllen' : 'Jetzt verbindlich buchen'}
              </button>
              
              <p className="text-xs text-center text-foreground/50 mt-4 flex items-center justify-center gap-1">
                Zahlung erfolgt bequem vor Ort.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
