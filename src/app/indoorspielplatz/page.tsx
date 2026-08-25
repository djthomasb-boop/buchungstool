"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Calendar as CalendarIcon, Users, Castle } from "lucide-react";
import { format, addDays } from "date-fns";
import { de } from "date-fns/locale";
import { submitBooking, getKindergeburtstagAvailability } from "@/app/actions/booking"; // getKindergeburtstagAvailability already checks the indoor capacity

export default function IndoorspielplatzPage() {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("14:30");
  
  const [kidsCount, setKidsCount] = useState("1");
  const [adultsCount, setAdultsCount] = useState("1");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [dateStatus, setDateStatus] = useState<{ loading: boolean; isBlocked: boolean; error?: string; capacity?: any }>({ loading: false, isBlocked: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validate Date & Check Capacity
  useEffect(() => {
    if (!date) return;
    const checkDate = async () => {
      setDateStatus({ loading: true, isBlocked: false });
      const res = await getKindergeburtstagAvailability(date);
      if (res.success && res.isBlocked) {
        setDateStatus({ loading: false, isBlocked: true, error: res.blockReason });
      } else {
        setDateStatus({ loading: false, isBlocked: false, capacity: res.capacity });
      }
    };
    checkDate();
  }, [date]);

  const totalPrice = useMemo(() => {
    const k = parseInt(kidsCount) || 0;
    const a = parseInt(adultsCount) || 0;
    return (k * 6.00) + (a * 2.00);
  }, [kidsCount, adultsCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const k = parseInt(kidsCount) || 0;
    const a = parseInt(adultsCount) || 0;

    const res = await submitBooking({
      type: "indoorspielplatz",
      date,
      time,
      duration: 3, // Pauschal
      people: k + a,
      shoes: 0,
      lanes: null,
      name,
      email,
      phone,
      wantsFood: false,
      notes: "Indoorspielplatz Reservierung",
      totalPrice,
      kidsCount: k,
      adultsCount: a,
      package: "Eintritt",
      additions: "",
      internalNotes: ""
    });

    setIsSubmitting(false);
    if (res.success) {
      setSuccess(true);
      window.scrollTo(0, 0);
    } else {
      alert(res.error || "Es gab ein Problem bei der Reservierung.");
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="glass p-12 rounded-3xl text-center max-w-lg border-green-500/20">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Reservierung erfolgreich!</h1>
          <p className="text-foreground/70 mb-8">
            Wir freuen uns auf euren Besuch im Indoorspielplatz! Eine Bestätigung wurde an {email} gesendet.
          </p>
          <Link href="/" className="inline-flex items-center px-6 py-3 rounded-full bg-blue-500 text-white font-bold hover:bg-blue-600 transition-colors">
            <ArrowLeft size={20} className="mr-2" /> Zurück zur Startseite
          </Link>
        </div>
      </main>
    );
  }

  const availableTimeOptions = useMemo(() => {
    const defaultTimes = ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];
    if (!date) return defaultTimes;
    const isToday = date === format(new Date(), 'yyyy-MM-dd');
    if (!isToday) return defaultTimes;

    const now = new Date();
    const currentHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return defaultTimes.filter(t => t > currentHM);
  }, [date]);

  useEffect(() => {
    if (availableTimeOptions.length > 0 && !availableTimeOptions.includes(time)) {
      setTime(availableTimeOptions[0]);
    }
  }, [availableTimeOptions, time]);

  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center text-blue-500 hover:underline mb-8 font-medium">
          <ArrowLeft size={16} className="mr-2" /> Zurück zur Übersicht
        </Link>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-blue-500/10 p-3 rounded-2xl text-blue-500">
            <Castle size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Indoorspielplatz reservieren</h1>
            <p className="text-foreground/60">Sichere dir und deinen Kindern Plätze zum Toben.</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-foreground/5 -z-10 rounded-full" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 -z-10 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }} />
          {[1, 2, 3].map(i => (
            <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= i ? 'bg-blue-500 text-white' : 'bg-background border-2 border-foreground/10 text-foreground/40'}`}>
              {i}
            </div>
          ))}
        </div>

        <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); setStep(s => s + 1); window.scrollTo(0,0); }} className="glass p-6 sm:p-8 rounded-3xl shadow-sm border border-foreground/5">
          
          {/* STEP 1: Date & Time */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold flex items-center gap-2"><CalendarIcon className="text-blue-500" /> Termin auswählen</h2>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-2">Datum</label>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full bg-background border rounded-xl px-4 py-3" 
                    required 
                  />
                  {dateStatus.loading && <p className="text-sm text-blue-500 mt-2">Prüfe Verfügbarkeit...</p>}
                  {dateStatus.isBlocked && <p className="text-sm text-red-500 mt-2 font-medium">Leider nicht möglich: {dateStatus.error}</p>}
                  {date && !dateStatus.loading && !dateStatus.isBlocked && <p className="text-sm text-green-500 mt-2 font-medium">Termin ist buchbar!</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-bold mb-2">Ankunftszeit</label>
                  {availableTimeOptions.length === 0 ? (
                    <p className="text-sm text-red-500 font-medium py-3">Für den heutigen Tag sind alle Ankunftszeiten bereits vergangen.</p>
                  ) : (
                    <select value={time} onChange={e => setTime(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" required>
                      {availableTimeOptions.map(t => (
                        <option key={t} value={t}>{t} Uhr</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Persons */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold flex items-center gap-2"><Users className="text-blue-500" /> Wer kommt mit?</h2>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl border border-foreground/10">
                  <label className="block text-sm font-bold mb-2">Anzahl Kinder (je 6,00 €)</label>
                  <input type="number" value={kidsCount} onChange={e => setKidsCount(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" min="1" max={60 - (dateStatus.capacity?.kidsBooked || 0)} required />
                  <p className="text-xs text-foreground/50 mt-2">Maximal noch {Math.max(0, 60 - (dateStatus.capacity?.kidsBooked || 0))} Plätze frei.</p>
                </div>
                <div className="p-4 rounded-xl border border-foreground/10">
                  <label className="block text-sm font-bold mb-2">Anzahl Erwachsene (je 2,00 €)</label>
                  <input type="number" value={adultsCount} onChange={e => setAdultsCount(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" min="0" max={60 - (dateStatus.capacity?.adultsBooked || 0)} required />
                  <p className="text-xs text-foreground/50 mt-2">Maximal noch {Math.max(0, 60 - (dateStatus.capacity?.adultsBooked || 0))} Plätze frei.</p>
                </div>
              </div>

              <div className="mt-8 p-6 bg-blue-500/10 rounded-2xl flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-blue-600">Zusammenfassung</h3>
                  <p className="text-sm text-foreground/60">{kidsCount} Kinder, {adultsCount} Erwachsene</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-blue-600">{totalPrice.toFixed(2)} €</div>
                  <p className="text-xs text-foreground/50 mt-1">Bezahlung vor Ort</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Contact */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold flex items-center gap-2"><CheckCircle className="text-blue-500" /> Kontaktdaten</h2>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-2">Vor- & Nachname</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" required />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">E-Mail Adresse</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" required />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Handynummer</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" required />
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-foreground/5">
            {step > 1 ? (
              <button type="button" onClick={() => setStep(s => s - 1)} className="px-6 py-3 rounded-full font-bold text-foreground/60 hover:bg-foreground/5 transition-colors">
                Zurück
              </button>
            ) : <div></div>}
            
            <button 
              type="submit" 
              disabled={isSubmitting || (step === 1 && (dateStatus.loading || dateStatus.isBlocked || !date))}
              className="flex items-center px-8 py-3 rounded-full font-bold bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Wird gesendet..." : step === 3 ? "Verbindlich reservieren" : "Weiter"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
