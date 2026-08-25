"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Activity, CheckCircle, Clock, CalendarIcon, User } from "lucide-react";
import { format, addDays } from "date-fns";
import { de } from "date-fns/locale";
import { submitBooking, getSquashAvailability } from "@/app/actions/booking";

export default function SquashPage() {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [dateStatus, setDateStatus] = useState<{ loading: boolean; isBlocked: boolean; error?: string; availableTimes: string[] }>({ 
    loading: false, isBlocked: false, availableTimes: [] 
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validate Date
  useEffect(() => {
    if (!date) return;
    const checkDate = async () => {
      setDateStatus(prev => ({ ...prev, loading: true, isBlocked: false }));
      setTime(""); // reset time on date change
      const res = await getSquashAvailability(date);
      
      if (res.success) {
        if (res.isBlocked) {
          setDateStatus({ loading: false, isBlocked: true, error: res.blockReason, availableTimes: [] });
        } else {
          setDateStatus({ loading: false, isBlocked: false, availableTimes: res.availableTimes || [] });
        }
      } else {
        setDateStatus({ loading: false, isBlocked: true, error: "Fehler beim Laden der Zeiten.", availableTimes: [] });
      }
    };
    checkDate();
  }, [date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const res = await submitBooking({
      type: "squash",
      date,
      time,
      duration: 1, 
      people: 2, // Standardmäßig geht man von 2 Spielern aus, ist für Squash zweitrangig.
      shoes: 0,
      lanes: null,
      name,
      email,
      phone,
      wantsFood: false,
      notes: "",
      totalPrice: 12.00,
    });

    setIsSubmitting(false);
    if (res.success) {
      setSuccess(true);
      window.scrollTo(0, 0);
    } else {
      alert(res.error || "Es gab ein Problem bei der Buchung.");
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="glass p-12 rounded-3xl text-center max-w-lg border-green-500/20">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Buchung erfolgreich!</h1>
          <p className="text-foreground/70 mb-8">
            Dein Squash-Court am {format(new Date(date), "dd.MM.yyyy")} um {time} Uhr ist reserviert. Eine Bestätigung wurde an {email} gesendet.
          </p>
          <Link href="/" className="inline-flex items-center px-6 py-3 rounded-full bg-green-500 text-white font-bold hover:bg-green-600 transition-colors">
            <ArrowLeft size={20} className="mr-2" /> Zurück zur Startseite
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center text-green-500 hover:underline mb-8 font-medium">
          <ArrowLeft size={16} className="mr-2" /> Zurück zur Übersicht
        </Link>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-green-500/10 p-3 rounded-2xl text-green-500">
            <Activity size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Squash Court reservieren</h1>
            <p className="text-foreground/60">Schwitzen, duellieren und Spaß haben. Dafür steht SQUASH!</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-green-500/5 border border-green-500/20 p-5 rounded-2xl mb-8 flex gap-4 text-sm text-foreground/80">
          <Activity size={24} className="text-green-500 shrink-0" />
          <div>
            <strong>Du bekommst von uns Schläger und Bälle geliehen - (1,00 € je Schläger)!</strong><br/>
            Auf die Schläger.. Fertig… Los gehts!<br/><br/>
            <em>Montag - Freitag: 09:00 - 20:00 Uhr | Samstag: 14:00 - 20:00 Uhr</em><br/>
            <strong>Preis: 12,00 € pro Stunde.</strong>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8 relative max-w-sm mx-auto">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-foreground/5 -z-10 rounded-full" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-green-500 -z-10 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 1) * 100}%` }} />
          {[1, 2].map(i => (
            <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= i ? 'bg-green-500 text-white' : 'bg-background border-2 border-foreground/10 text-foreground/40'}`}>
              {i}
            </div>
          ))}
        </div>

        <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); setStep(2); window.scrollTo(0,0); }} className="glass p-6 sm:p-8 rounded-3xl shadow-sm border border-foreground/5">
          
          {/* STEP 1: Date & Time */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold flex items-center gap-2"><CalendarIcon className="text-green-500" /> Wann möchtest du spielen?</h2>

              <div>
                <label className="block text-sm font-bold mb-2">Datum</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full sm:w-1/2 bg-background border rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none" 
                  required 
                />
                {dateStatus.loading && <p className="text-sm text-blue-500 mt-2">Prüfe Verfügbarkeit...</p>}
                {dateStatus.isBlocked && <p className="text-sm text-red-500 mt-2 font-medium">Leider nicht möglich: {dateStatus.error}</p>}
                {date && !dateStatus.loading && !dateStatus.isBlocked && dateStatus.availableTimes.length === 0 && (
                  <p className="text-sm text-orange-500 mt-2 font-medium">An diesem Tag sind leider alle Termine ausgebucht.</p>
                )}
              </div>
              
              {date && !dateStatus.loading && !dateStatus.isBlocked && dateStatus.availableTimes.length > 0 && (
                <div className="pt-4 border-t border-foreground/5">
                  <label className="block text-sm font-bold mb-4">Verfügbare Uhrzeiten (1 Stunde)</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {dateStatus.availableTimes.map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTime(t)}
                        className={`py-3 rounded-xl text-sm font-bold transition-all border ${
                          time === t 
                            ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/20' 
                            : 'bg-background hover:border-green-500/50 hover:bg-green-500/5 text-foreground/80'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Contact Details */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold flex items-center gap-2"><User className="text-green-500" /> Deine Kontaktdaten</h2>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold mb-2">Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">E-Mail</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Mobilnummer</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none" required />
                </div>
              </div>

              {/* Summary Box */}
              <div className="bg-green-500/5 border border-green-500/20 p-6 rounded-2xl mt-8">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Termin:</span> <strong>{format(new Date(date), "dd.MM.yyyy")} um {time} Uhr</strong></div>
                  <div className="flex justify-between"><span>Dauer:</span> <strong>1 Stunde</strong></div>
                  <div className="flex justify-between text-lg pt-2 mt-2 border-t border-green-500/20">
                    <span className="font-bold">Gesamtpreis:</span> 
                    <span className="font-black text-green-600">12,00 €</span>
                  </div>
                  <p className="text-xs text-foreground/50 text-right mt-1">Zahlung erfolgt bequem vor Ort.</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-foreground/5">
            {step > 1 ? (
              <button type="button" onClick={() => setStep(s => s - 1)} className="px-6 py-3 rounded-full font-bold bg-foreground/5 hover:bg-foreground/10 transition-colors">
                Zurück
              </button>
            ) : <div />}
            
            {step === 1 ? (
              <button 
                type="submit" 
                disabled={!date || !time}
                className="flex items-center px-8 py-3 rounded-full font-bold bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/20"
              >
                Weiter <ArrowRight size={18} className="ml-2" />
              </button>
            ) : (
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex items-center px-8 py-3 rounded-full font-bold bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50 shadow-lg shadow-green-500/20"
              >
                {isSubmitting ? "Wird gebucht..." : <><CheckCircle size={18} className="mr-2" /> Verbindlich buchen</>}
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
