"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Baby, CheckCircle, ArrowRight, PackageOpen, Users, Calendar as CalendarIcon, Info } from "lucide-react";
import { format, addDays } from "date-fns";
import { de } from "date-fns/locale";
import { submitBooking, getKindergeburtstagAvailability } from "@/app/actions/booking";

const PACKAGES = [
  { id: "Lucky Dinner", name: "Lucky Dinner", price: 12.90, desc: "Eintritt, Kiddy Box (Nuggets, Pommes, Überraschung, Trinkpäckchen), Baguettes, 1x Getränk für Eltern" },
  { id: "Tea Time", name: "Tea Time", price: 12.90, desc: "Eintritt, bunte Kaffeetafel, selbst gemachter Kuchen, Kaffeeflat für Eltern, Karaffe Saft o. Kakao" },
  { id: "Happy Day", name: "Happy Day", price: 19.90, desc: "Alles aus Tea Time & Lucky Dinner kombiniert" },
];

const ADDITIONS = [
  { id: "Waltraut", name: "Waltraut", price: 9.50 },
  { id: "Kindersekt", name: "Kindersekt (in leuchtenden Gläsern)", price: 3.00 },
  { id: "Candybar", name: "Candybar", price: 25.00 },
];

export default function KindergeburtstagPage() {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("14:30");
  
  const [birthdayChildName, setBirthdayChildName] = useState("");
  const [birthdayChildAge, setBirthdayChildAge] = useState("");
  const [kidsCount, setKidsCount] = useState("6");
  const [adultsCount, setAdultsCount] = useState("2");
  
  const [selectedPackage, setSelectedPackage] = useState(PACKAGES[0].id);
  const [selectedAdditions, setSelectedAdditions] = useState<string[]>([]);
  const [location, setLocation] = useState<"Indoor" | "Outdoor">("Indoor");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [dateStatus, setDateStatus] = useState<{ loading: boolean; isBlocked: boolean; error?: string; availableTimes: string[] }>({ loading: false, isBlocked: false, availableTimes: ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30"] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validate Date
  useEffect(() => {
    if (!date) return;
    const checkDate = async () => {
      setDateStatus(prev => ({ ...prev, loading: true, isBlocked: false }));
      const res = await getKindergeburtstagAvailability(date);
      if (res.success && res.isBlocked) {
        setDateStatus({ loading: false, isBlocked: true, error: res.blockReason, availableTimes: [] });
      } else {
        const times = res.availableTimes && res.availableTimes.length > 0 
          ? res.availableTimes 
          : ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];
        setDateStatus({ loading: false, isBlocked: false, availableTimes: times });
        
        // Safely set the selected arrival time if the previous selection is no longer available
        setTime(prevTime => {
          if (times.includes(prevTime)) return prevTime;
          return times[0] || "14:30";
        });
      }
    };
    checkDate();
  }, [date]);

  const toggleAddition = (id: string) => {
    setSelectedAdditions(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const totalPrice = useMemo(() => {
    const pkg = PACKAGES.find(p => p.id === selectedPackage);
    const pkgPrice = pkg ? pkg.price : 0;
    const totalPeople = (parseInt(kidsCount) || 0) + (parseInt(adultsCount) || 0);
    
    let sum = totalPeople * pkgPrice;
    
    selectedAdditions.forEach(addId => {
      const a = ADDITIONS.find(x => x.id === addId);
      if (a) sum += a.price;
    });
    
    return sum;
  }, [selectedPackage, kidsCount, adultsCount, selectedAdditions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let additionsString = selectedAdditions.map(id => ADDITIONS.find(a => a.id === id)?.name).filter(Boolean).join(", ");
    additionsString = `Ort: ${location}` + (additionsString ? `, Extras: ${additionsString}` : "");

    const res = await submitBooking({
      type: "kidsworld",
      date,
      time,
      duration: 3, // Pauschal 3 Stunden, oder nach Wunsch
      people: (parseInt(kidsCount) || 0) + (parseInt(adultsCount) || 0),
      shoes: 0,
      lanes: null,
      name,
      email,
      phone,
      wantsFood: true, // Kindergeburtstag hat immer Essen dabei
      notes,
      totalPrice,
      birthdayChildName,
      birthdayChildAge: parseInt(birthdayChildAge),
      kidsCount: parseInt(kidsCount),
      adultsCount: parseInt(adultsCount),
      package: PACKAGES.find(p => p.id === selectedPackage)?.name,
      additions: additionsString,
      internalNotes: ""
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
            Wir freuen uns auf den Geburtstag von {birthdayChildName}! Eine Bestätigung wurde an {email} gesendet.
          </p>
          <Link href="/" className="inline-flex items-center px-6 py-3 rounded-full bg-blue-500 text-white font-bold hover:bg-blue-600 transition-colors">
            <ArrowLeft size={20} className="mr-2" /> Zurück zur Startseite
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center text-purple-500 hover:underline mb-8 font-medium">
          <ArrowLeft size={16} className="mr-2" /> Zurück zur Übersicht
        </Link>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-purple-500/10 p-3 rounded-2xl text-purple-500">
            <Baby size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Kindergeburtstag buchen</h1>
            <p className="text-foreground/60">Feiere einen unvergesslichen Tag bei uns.</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-foreground/5 -z-10 rounded-full" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-purple-500 -z-10 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 3) * 100}%` }} />
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= i ? 'bg-purple-500 text-white' : 'bg-background border-2 border-foreground/10 text-foreground/40'}`}>
              {i}
            </div>
          ))}
        </div>

        <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); setStep(s => s + 1); window.scrollTo(0,0); }} className="glass p-6 sm:p-8 rounded-3xl shadow-sm border border-foreground/5">
          
          {/* STEP 1: Date & Time */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold flex items-center gap-2"><CalendarIcon className="text-purple-500" /> Termin auswählen</h2>
              
              <div className="bg-purple-500/5 p-4 rounded-xl border border-purple-500/20 text-sm">
                <strong>Öffnungszeiten Kindergeburtstag:</strong><br/>
                Dienstag, Donnerstag, Freitag, Samstag: 14:00 - 19:00 Uhr.<br/>
                <em>An Feiertagen/Ferien öffnen wir teilweise zusätzlich, wähle einfach dein Wunschdatum!</em>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold mb-3">Wo möchtet ihr feiern?</label>
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${location === 'Indoor' ? 'border-purple-500 bg-purple-500/10 text-purple-600 font-bold' : 'border-foreground/10 hover:border-purple-500/30 text-foreground/70'}`}>
                    <input type="radio" name="location" value="Indoor" checked={location === 'Indoor'} onChange={() => setLocation('Indoor')} className="hidden" />
                    🏠 Indoor
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${location === 'Outdoor' ? 'border-purple-500 bg-purple-500/10 text-purple-600 font-bold' : 'border-foreground/10 hover:border-purple-500/30 text-foreground/70'}`}>
                    <input type="radio" name="location" value="Outdoor" checked={location === 'Outdoor'} onChange={() => setLocation('Outdoor')} className="hidden" />
                    ☀️ Outdoor
                  </label>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-2">Datum</label>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                    min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                    className="w-full bg-background border rounded-xl px-4 py-3" 
                    required 
                  />
                  {dateStatus.loading && <p className="text-sm text-blue-500 mt-2">Prüfe Verfügbarkeit...</p>}
                  {dateStatus.isBlocked && <p className="text-sm text-red-500 mt-2 font-medium">Leider nicht möglich: {dateStatus.error}</p>}
                  {date && !dateStatus.loading && !dateStatus.isBlocked && <p className="text-sm text-green-500 mt-2 font-medium">Termin ist buchbar!</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-bold mb-2">Ankunftszeit</label>
                  <select value={time} onChange={e => setTime(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" required>
                    {dateStatus.availableTimes.map(t => (
                      <option key={t} value={t}>{t} Uhr</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Birthday details */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold flex items-center gap-2"><Users className="text-purple-500" /> Wer feiert?</h2>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-2">Name des Kindes</label>
                  <input type="text" value={birthdayChildName} onChange={e => setBirthdayChildName(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" placeholder="z.B. Leonie" required />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Wie alt wird das Kind?</label>
                  <input type="number" value={birthdayChildAge} onChange={e => setBirthdayChildAge(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" min="1" max="18" required />
                </div>
              </div>

              <div className="border-t border-foreground/5 pt-6 grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-2">Anzahl Kinder (Gäste)</label>
                  <input type="number" value={kidsCount} onChange={e => setKidsCount(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" min="1" required />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Anzahl Erwachsene</label>
                  <input type="number" value={adultsCount} onChange={e => setAdultsCount(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" min="0" required />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Packages & Additions */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold flex items-center gap-2"><PackageOpen className="text-purple-500" /> Pakete & Optionen</h2>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {PACKAGES.map(pkg => (
                  <label key={pkg.id} className={`block p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedPackage === pkg.id ? 'border-purple-500 bg-purple-500/5' : 'border-foreground/10 hover:border-purple-500/30'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <input type="radio" name="package" checked={selectedPackage === pkg.id} onChange={() => setSelectedPackage(pkg.id)} className="w-4 h-4 text-purple-600" />
                        <span className="font-bold">{pkg.name}</span>
                      </div>
                      <span className="font-bold text-purple-600">{pkg.price.toFixed(2)}€</span>
                    </div>
                    <p className="text-xs text-foreground/60 leading-relaxed pl-6">{pkg.desc}</p>
                  </label>
                ))}
              </div>

              <h3 className="font-bold mt-6 mb-3">Zusatzoptionen</h3>
              <div className="space-y-3">
                {ADDITIONS.map(add => (
                  <label key={add.id} className="flex items-center justify-between p-3 rounded-xl border border-foreground/10 hover:bg-foreground/5 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={selectedAdditions.includes(add.id)} onChange={() => toggleAddition(add.id)} className="w-4 h-4 text-purple-600 rounded" />
                      <span className="text-sm font-medium">{add.name}</span>
                    </div>
                    <span className="text-sm font-bold text-foreground/70">+{add.price.toFixed(2)}€</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Contact & Summary */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold flex items-center gap-2"><Info className="text-purple-500" /> Deine Daten & Abschluss</h2>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold mb-2">Name Besteller/in</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" required />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">E-Mail</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" required />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Handynummer</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold mb-2">Anmerkungen (Optional)</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3 resize-none" rows={2} />
                </div>
              </div>

              {/* Summary Box */}
              <div className="bg-purple-500/5 border border-purple-500/20 p-6 rounded-2xl mt-8">
                <h3 className="font-bold mb-4 border-b border-purple-500/20 pb-2">Zusammenfassung</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Termin:</span> <strong>{date ? format(new Date(date), "dd.MM.yyyy", { locale: de }) : "-"} um {time} Uhr</strong></div>
                  <div className="flex justify-between"><span>Geburtstagskind:</span> <strong>{birthdayChildName} ({birthdayChildAge} J.)</strong></div>
                  <div className="flex justify-between"><span>Personen:</span> <strong>{kidsCount} Kinder, {adultsCount} Erwachsene</strong></div>
                  <div className="flex justify-between"><span>Paket:</span> <strong>{selectedPackage}</strong></div>
                  {selectedAdditions.length > 0 && (
                    <div className="flex justify-between"><span>Extras:</span> <strong className="text-right">{selectedAdditions.map(id => ADDITIONS.find(a => a.id === id)?.name).join(", ")}</strong></div>
                  )}
                  <div className="flex justify-between text-lg pt-2 mt-2 border-t border-purple-500/20">
                    <span className="font-bold">Gesamtpreis:</span> 
                    <span className="font-black text-purple-600">{totalPrice.toFixed(2)} €</span>
                  </div>
                  <p className="text-xs text-foreground/50 text-right mt-1">Zahlung erfolgt vor Ort.</p>
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
            
            {step < 4 ? (
              <button 
                type="submit" 
                disabled={step === 1 && (!date || dateStatus.isBlocked || dateStatus.loading)}
                className="flex items-center px-8 py-3 rounded-full font-bold bg-purple-500 text-white hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
