"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Baby, CheckCircle, Save } from "lucide-react";
import { format } from "date-fns";
import { submitBooking, getKindergeburtstagAvailability } from "@/app/actions/booking";

const PACKAGES = [
  { id: "Lucky Dinner", name: "Lucky Dinner", price: 12.90 },
  { id: "Tea Time", name: "Tea Time", price: 12.90 },
  { id: "Happy Day", name: "Happy Day", price: 19.90 },
];

const ADDITIONS = [
  { id: "Waltraut", name: "Waltraut", price: 9.50 },
  { id: "Kindersekt", name: "Kindersekt", price: 3.00 },
  { id: "Candybar", name: "Candybar", price: 25.00 },
];

export default function AdminNewKidsworldPage() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("14:30");
  
  const [birthdayChildName, setBirthdayChildName] = useState("");
  const [birthdayChildAge, setBirthdayChildAge] = useState("");
  const [kidsCount, setKidsCount] = useState("6");
  const [adultsCount, setAdultsCount] = useState("2");
  
  const [selectedPackage, setSelectedPackage] = useState(PACKAGES[0].id);
  const [selectedAdditions, setSelectedAdditions] = useState<string[]>([]);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const [dateStatus, setDateStatus] = useState<{ loading: boolean; isBlocked: boolean; error?: string }>({ loading: false, isBlocked: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!date) return;
    const checkDate = async () => {
      setDateStatus({ loading: true, isBlocked: false });
      const res = await getKindergeburtstagAvailability(date);
      if (res.success && res.isBlocked) {
        setDateStatus({ loading: false, isBlocked: true, error: res.blockReason });
      } else {
        setDateStatus({ loading: false, isBlocked: false });
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

    const additionsString = selectedAdditions.map(id => ADDITIONS.find(a => a.id === id)?.name).filter(Boolean).join(", ");

    const res = await submitBooking({
      type: "kidsworld",
      date,
      time,
      duration: 3,
      people: (parseInt(kidsCount) || 0) + (parseInt(adultsCount) || 0),
      shoes: 0,
      lanes: null,
      name,
      email: email || "keine@email.de", // fallback for phone booking
      phone,
      wantsFood: true,
      notes,
      totalPrice,
      birthdayChildName,
      birthdayChildAge: parseInt(birthdayChildAge),
      kidsCount: parseInt(kidsCount),
      adultsCount: parseInt(adultsCount),
      package: PACKAGES.find(p => p.id === selectedPackage)?.name,
      additions: additionsString,
      internalNotes
    });

    setIsSubmitting(false);
    if (res.success) {
      setSuccess(true);
      window.scrollTo(0, 0);
    } else {
      alert(res.error || "Es gab ein Problem.");
    }
  };

  if (success) {
    return (
      <main className="p-8">
        <div className="glass p-12 rounded-3xl text-center max-w-lg mx-auto border-purple-500/20">
          <CheckCircle size={64} className="text-purple-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Erfolgreich angelegt!</h1>
          <p className="text-foreground/70 mb-8">
            Der Geburtstag am {format(new Date(date), "dd.MM.yyyy")} für {birthdayChildName} ist gespeichert.
          </p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => { setSuccess(false); setDate(""); setBirthdayChildName(""); setName(""); }} className="px-6 py-3 rounded-xl bg-foreground/10 font-bold hover:bg-foreground/20">
              Neue Buchung
            </button>
            <Link href="/admin" className="px-6 py-3 rounded-xl bg-purple-500 text-white font-bold hover:bg-purple-600">
              Zurück zum Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-8 max-w-4xl mx-auto">
      <Link href="/admin" className="inline-flex items-center text-purple-500 hover:underline mb-8 font-medium">
        <ArrowLeft size={16} className="mr-2" /> Zurück zum Dashboard
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="bg-purple-500/10 p-3 rounded-2xl text-purple-500">
          <Baby size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Kindergeburtstag anlegen</h1>
          <p className="text-foreground/60">Telefonische Buchung eintragen.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass p-6 sm:p-8 rounded-3xl shadow-sm border border-foreground/5 space-y-8">
        
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold mb-2">Datum</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" required />
            {dateStatus.loading && <p className="text-sm text-blue-500 mt-2">Prüfe...</p>}
            {dateStatus.isBlocked && <p className="text-sm text-red-500 mt-2">Achtung: Regulär geschlossen ({dateStatus.error})</p>}
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Ankunftszeit</label>
            <select value={time} onChange={e => setTime(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" required>
              {["14:00", "14:30", "15:00", "15:30", "16:00", "16:30"].map(t => <option key={t} value={t}>{t} Uhr</option>)}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 border-t border-foreground/5 pt-8">
          <div>
            <label className="block text-sm font-bold mb-2">Geburtstagskind</label>
            <input type="text" value={birthdayChildName} onChange={e => setBirthdayChildName(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" required />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Alter</label>
            <input type="number" value={birthdayChildAge} onChange={e => setBirthdayChildAge(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" min="1" required />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Kinder (Gäste)</label>
            <input type="number" value={kidsCount} onChange={e => setKidsCount(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" min="1" required />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Erwachsene</label>
            <input type="number" value={adultsCount} onChange={e => setAdultsCount(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" min="0" required />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-8 border-t border-foreground/5 pt-8">
          <div>
            <h3 className="font-bold mb-4">Paket wählen</h3>
            <div className="grid grid-cols-2 gap-3">
              {PACKAGES.map(pkg => (
                <label key={pkg.id} className={`p-3 rounded-xl border cursor-pointer ${selectedPackage === pkg.id ? 'border-purple-500 bg-purple-500/5' : 'border-foreground/10 hover:border-purple-500/30'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <input type="radio" checked={selectedPackage === pkg.id} onChange={() => setSelectedPackage(pkg.id)} className="text-purple-600" />
                    <span className="font-bold text-sm">{pkg.name}</span>
                  </div>
                  <span className="text-xs text-purple-600 font-bold ml-6">{pkg.price.toFixed(2)}€ p.P.</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-bold mb-4">Zusatzoptionen</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ADDITIONS.map(add => (
                <label key={add.id} className="flex items-center gap-2 p-2 rounded-lg border border-foreground/10 cursor-pointer hover:bg-foreground/5">
                  <input type="checkbox" checked={selectedAdditions.includes(add.id)} onChange={() => toggleAddition(add.id)} className="text-purple-600 rounded" />
                  <span className="text-sm">{add.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 border-t border-foreground/5 pt-8">
          <div>
            <label className="block text-sm font-bold mb-2">Kundenname (Elternteil)</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" required />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Telefon</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" required />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">E-Mail (Optional)</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" placeholder="Für Bestätigung..." />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 border-t border-foreground/5 pt-8">
          <div>
            <label className="block text-sm font-bold mb-2">Kunden-Anmerkung</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3 resize-none" rows={2} />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-blue-500">Interne Info (nur für uns)</label>
            <textarea value={internalNotes} onChange={e => setInternalNotes(e.target.value)} className="w-full bg-background border border-blue-200 rounded-xl px-4 py-3 resize-none" rows={2} />
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-foreground/5">
          <div className="text-xl">
            Gesamtpreis: <span className="font-black text-purple-600">{totalPrice.toFixed(2)} €</span>
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting || !date || dateStatus.isBlocked}
            className="flex items-center px-8 py-4 rounded-full font-bold bg-purple-500 text-white hover:bg-purple-600 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Speichert..." : <><Save size={18} className="mr-2" /> Buchung anlegen</>}
          </button>
        </div>
      </form>
    </main>
  );
}
