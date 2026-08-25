"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Activity, CheckCircle, Save } from "lucide-react";
import { format } from "date-fns";
import { submitBooking, getSquashAvailability } from "@/app/actions/booking";

export default function AdminNewSquashPage() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  
  const [squashRole, setSquashRole] = useState("Kursleiter");
  const [name, setName] = useState("");
  const [squashCourseName, setSquashCourseName] = useState("");

  const [dateStatus, setDateStatus] = useState<{ loading: boolean; isBlocked: boolean; error?: string; availableTimes: string[] }>({ 
    loading: false, isBlocked: false, availableTimes: [] 
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!date) return;
    const checkDate = async () => {
      setDateStatus(prev => ({ ...prev, loading: true, isBlocked: false }));
      setTime(""); 
      const res = await getSquashAvailability(date);
      
      if (res.success) {
        if (res.isBlocked) {
          setDateStatus({ loading: false, isBlocked: true, error: res.blockReason, availableTimes: [] });
        } else {
          setDateStatus({ loading: false, isBlocked: false, availableTimes: res.availableTimes || [] });
        }
      } else {
        setDateStatus({ loading: false, isBlocked: true, error: "Fehler beim Laden.", availableTimes: [] });
      }
    };
    checkDate();
  }, [date]);

  const [recurringUntil, setRecurringUntil] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const datesToBook = [date];
    if (recurringUntil) {
      let current = new Date(date);
      const end = new Date(recurringUntil);
      
      // Calculate next weeks
      while (true) {
        current.setDate(current.getDate() + 7);
        if (current <= end) {
          const yyyy = current.getFullYear();
          const mm = String(current.getMonth() + 1).padStart(2, '0');
          const dd = String(current.getDate()).padStart(2, '0');
          datesToBook.push(`${yyyy}-${mm}-${dd}`);
        } else {
          break;
        }
      }
    }

    let allSuccess = true;
    for (const d of datesToBook) {
      const res = await submitBooking({
        type: "squash",
        date: d,
        time,
        duration: 1, 
        people: 2, 
        shoes: 0,
        lanes: null,
        name,
        email: "intern@befree.de", // Dummy email for internal
        phone: "-", 
        wantsFood: false,
        notes: "Interne Squash-Reservierung",
        totalPrice: 0, // Intern = 0€
        squashRole,
        squashCourseName
      });

      if (!res.success) {
        console.error("Fehler bei Datum", d, res.error);
        allSuccess = false;
      }
    }

    setIsSubmitting(false);
    if (allSuccess) {
      setSuccess(true);
    } else {
      alert("Einige Reservierungen konnten nicht gespeichert werden. Evtl. war der Court schon belegt.");
    }
  };

  if (success) {
    return (
      <main className="p-8">
        <div className="glass p-12 rounded-3xl text-center max-w-lg mx-auto border-green-500/20">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Erfolgreich reserviert!</h1>
          <p className="text-foreground/70 mb-8">
            Der Squash-Court am {format(new Date(date), "dd.MM.yyyy")} um {time} Uhr ist geblockt.
          </p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => { setSuccess(false); setDate(""); setTime(""); setName(""); setSquashCourseName(""); }} className="px-6 py-3 rounded-xl bg-foreground/10 font-bold hover:bg-foreground/20">
              Weitere Reservierung
            </button>
            <Link href="/admin" className="px-6 py-3 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600">
              Zurück zum Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-8 max-w-3xl mx-auto">
      <Link href="/admin" className="inline-flex items-center text-green-500 hover:underline mb-8 font-medium">
        <ArrowLeft size={16} className="mr-2" /> Zurück zum Dashboard
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="bg-green-500/10 p-3 rounded-2xl text-green-500">
          <Activity size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Squash Court intern reservieren</h1>
          <p className="text-foreground/60">Court blocken für Kurse und Trainer.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass p-6 sm:p-8 rounded-3xl shadow-sm border border-foreground/5 space-y-6">
        
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold mb-2">Datum</label>
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              className="w-full bg-background border rounded-xl px-4 py-3" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Uhrzeit (1 Std)</label>
            <select 
              value={time} 
              onChange={e => setTime(e.target.value)} 
              className="w-full bg-background border rounded-xl px-4 py-3 disabled:opacity-50" 
              required
              disabled={!date || dateStatus.isBlocked || dateStatus.loading}
            >
              <option value="">Bitte wählen...</option>
              {dateStatus.availableTimes.map(t => (
                <option key={t} value={t}>{t} Uhr</option>
              ))}
            </select>
            {dateStatus.loading && <p className="text-xs text-blue-500 mt-1">Lade...</p>}
            {dateStatus.isBlocked && <p className="text-xs text-red-500 mt-1">{dateStatus.error}</p>}
            {date && !dateStatus.loading && !dateStatus.isBlocked && dateStatus.availableTimes.length === 0 && (
              <p className="text-xs text-orange-500 mt-1">Keine Zeiten verfügbar.</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-bold mb-2">Wöchentlich blockieren bis zum (optional)</label>
            <input 
              type="date" 
              value={recurringUntil} 
              onChange={e => setRecurringUntil(e.target.value)} 
              className="w-full bg-background border rounded-xl px-4 py-3" 
              min={date || undefined}
            />
            <p className="text-xs text-foreground/50 mt-1">Wenn ein Datum gewählt wird, wird der Court jede Woche am selben Wochentag zur selben Uhrzeit bis zu diesem Datum blockiert.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 border-t border-foreground/5 pt-6">
          <div>
            <label className="block text-sm font-bold mb-2">Name des Buchenden</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full bg-background border rounded-xl px-4 py-3" 
              placeholder="z.B. Max Mustermann"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Funktion</label>
            <select 
              value={squashRole} 
              onChange={e => setSquashRole(e.target.value)} 
              className="w-full bg-background border rounded-xl px-4 py-3" 
              required
            >
              <option value="Kursleiter">Kursleiter</option>
              <option value="Trainer">Trainer</option>
              <option value="externer Kursleiter">externer Kursleiter</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-bold mb-2">Kursname / Bezeichnung</label>
            <input 
              type="text" 
              value={squashCourseName} 
              onChange={e => setSquashCourseName(e.target.value)} 
              className="w-full bg-background border rounded-xl px-4 py-3" 
              placeholder="z.B. Power Squash Anfängerkurs"
              required 
            />
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-foreground/5">
          <button 
            type="submit" 
            disabled={isSubmitting || !date || !time}
            className="flex items-center px-8 py-3 rounded-full font-bold bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Speichert..." : <><Save size={18} className="mr-2" /> Blockierung eintragen</>}
          </button>
        </div>
      </form>
    </main>
  );
}
