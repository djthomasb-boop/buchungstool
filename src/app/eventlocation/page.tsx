"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Calculator, Presentation } from "lucide-react";
import { submitBooking } from "@/app/actions/booking";
import { format, addDays } from "date-fns";

export default function EventLocationPage() {
  const [step, setStep] = useState(1);
  
  // BASIC
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:00");
  const [adults, setAdults] = useState<number>(50);
  const [kids, setKids] = useState<number>(0);

  // AUSSTATTUNG & DEKO
  const [room, setRoom] = useState<number>(300); // 300, 500, 1000
  const [hussen, setHussen] = useState<number>(0);
  const [dekoPerPerson, setDekoPerPerson] = useState<number>(0);

  // BUFFET
  const [buffet, setBuffet] = useState<number>(0); // 0, 20, 25, 30

  // GETRÄNKE
  const [sekts, setSekts] = useState<number>(0);
  const [drinksFlat, setDrinksFlat] = useState<number>(0); // 0, 50, 65, 75
  const [waterSetup, setWaterSetup] = useState<number>(0);

  // SÜßES & KNABBEREIEN
  const [knabberkorb, setKnabberkorb] = useState<number>(0);
  const [coffeeCake, setCoffeeCake] = useState<number>(0);
  const [candybar, setCandybar] = useState<number>(0);

  // HIGHLIGHTS
  const [tanzshow, setTanzshow] = useState<boolean>(false);
  const [bowlingHours, setBowlingHours] = useState<number>(0);
  const [indoorKids, setIndoorKids] = useState<number>(0);
  const [childcareHours, setChildcareHours] = useState<number>(0);

  // OPTIONAL
  const [dj, setDj] = useState<boolean>(false);

  // CONTACT
  const [contactType, setContactType] = useState<"privat" | "firma">("privat");
  const [companyName, setCompanyName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const totalPeople = adults + kids;

  // BERECHNUNGEN
  const roomCost = room;
  const hussenCost = hussen * 2.50;
  const dekoCost = totalPeople * dekoPerPerson;

  const buffetAdultsCost = adults * buffet;
  const buffetKidsCost = kids * (buffet / 2); // Kids generally pay half? Standard behavior: backend just did totalPeople * buffet, but let's stick to totalPeople * buffet for simplicity unless specified
  const buffetCost = totalPeople * buffet;

  const sektCost = sekts * 3.00;
  const drinksAdultsCost = adults * drinksFlat;
  const drinksKidsCost = kids * (drinksFlat * 0.5);
  const drinksCost = drinksAdultsCost + drinksKidsCost;
  const waterCost = waterSetup * 4.50;

  const knabberCost = knabberkorb * 5.50;
  const coffeeCost = coffeeCake * 7.00;
  const candyCost = candybar * 100.00;

  const tanzCost = tanzshow ? 200.00 : 0;
  const bowlingCost = bowlingHours * 15.00;
  const indoorCost = indoorKids * 6.00;
  const childCareCost = childcareHours * 25.00;

  const djCost = dj ? 450.00 : 0;

  const total = roomCost + hussenCost + dekoCost + buffetCost + sektCost + drinksCost + waterCost + knabberCost + coffeeCost + candyCost + tanzCost + bowlingCost + indoorCost + childCareCost + djCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const roomName = room === 300 ? "Kursraum (Partyraum)" : room === 500 ? "Halbe Halle (Saal)" : "Ganze Halle";
    
    // Create additions string for the backend
    const items = [];
    items.push(`Location: ${roomName}`);
    if (hussen > 0) items.push(`${hussen}x Stretchhussen`);
    if (dekoPerPerson > 0) items.push(`Deko (Stufe ${dekoPerPerson}€/P)`);
    if (buffet > 0) items.push(`Buffet (${buffet}€/P)`);
    if (sekts > 0) items.push(`${sekts}x Sektempfang`);
    if (drinksFlat > 0) items.push(`Getränkeflat (${drinksFlat}€/Erw)`);
    if (waterSetup > 0) items.push(`${waterSetup}x Wasser & Gläser`);
    if (knabberkorb > 0) items.push(`${knabberkorb}x Knabberkorb`);
    if (coffeeCake > 0) items.push(`${coffeeCake}x Kaffee & Kuchen`);
    if (candybar > 0) items.push(`${candybar}x Candybar`);
    if (tanzshow) items.push(`Tanzshow`);
    if (bowlingHours > 0) items.push(`${bowlingHours}h Bowling`);
    if (indoorKids > 0) items.push(`${indoorKids} K. Indoorspielplatz`);
    if (childcareHours > 0) items.push(`${childcareHours}h Kinderbetreuung`);
    if (dj) items.push(`DJ THOMAS B.`);

    const res = await submitBooking({
      type: "event",
      date,
      time,
      duration: 6, // Default length
      people: totalPeople,
      shoes: 0,
      lanes: null,
      name,
      email,
      phone,
      wantsFood: buffet > 0 || knabberkorb > 0 || coffeeCake > 0,
      notes: notes,
      totalPrice: total,
      contactType,
      companyName,
      billingAddress,
      kidsCount: kids,
      adultsCount: adults,
      package: roomName,
      additions: items.join(", "),
      internalNotes: "Erstellt über den Frontend Konfigurator"
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
          <h1 className="text-3xl font-bold mb-4">Anfrage erfolgreich!</h1>
          <p className="text-foreground/70 mb-8">
            Vielen Dank für deine Event-Anfrage. Wir haben dir eine Zusammenfassung an {email} gesendet und melden uns in Kürze bei dir.
          </p>
          <Link href="/" className="inline-flex items-center px-6 py-3 rounded-full bg-pink-500 text-white font-bold hover:bg-pink-600 transition-colors">
            <ArrowLeft size={20} className="mr-2" /> Zurück zur Startseite
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-8 max-w-7xl mx-auto">
      <Link href="/" className="inline-flex items-center text-pink-500 hover:underline mb-8 font-medium">
        <ArrowLeft size={16} className="mr-2" /> Zurück zur Übersicht
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="bg-pink-500/10 p-3 rounded-2xl text-pink-500">
          <Presentation size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Event Konfigurator</h1>
          <p className="text-foreground/60">Stelle dein perfektes Event zusammen und frage es direkt bei uns an.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-8">
          
          {/* STEP 1: Basisdaten */}
          <div className="glass p-6 rounded-2xl border border-foreground/5">
            <h2 className="text-xl font-bold mb-4 text-pink-600">BASISDATEN</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Datum</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} min={format(addDays(new Date(), 3), 'yyyy-MM-dd')} className="w-full bg-background border rounded-lg px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Uhrzeit</label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-background border rounded-lg px-3 py-2" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Erwachsene</label>
                <input type="number" min="1" value={adults} onChange={e => setAdults(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kinder (50% Rabatt auf Getränkeflat)</label>
                <input type="number" min="0" value={kids} onChange={e => setKids(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2" />
              </div>
            </div>
          </div>

          {/* Ausstattung & Deko */}
          <div className="glass p-6 rounded-2xl border border-foreground/5">
            <h2 className="text-xl font-bold mb-4 text-pink-600">AUSSTATTUNG & DEKO</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Raumauswahl</label>
                <select value={room} onChange={e => setRoom(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2">
                  <option value={300}>Kursraum / Partyraum (bis 80 Personen) - 300,00 €</option>
                  <option value={500}>Halbe Halle / Saal (ab 100 Personen) - 500,00 €</option>
                  <option value={1000}>Ganze Halle - 1.000,00 €</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Stretchhussen (2,50 € / Stk)</label>
                  <input type="number" min="0" value={hussen} onChange={e => setHussen(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Deko (1,00 - 4,00 € / Person)</label>
                  <select value={dekoPerPerson} onChange={e => setDekoPerPerson(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2">
                    <option value={0}>Keine Deko</option>
                    <option value={1}>Basis (1,00 € / P)</option>
                    <option value={2}>Standard (2,00 € / P)</option>
                    <option value={3}>Premium (3,00 € / P)</option>
                    <option value={4}>Exklusiv (4,00 € / P)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Buffet */}
          <div className="glass p-6 rounded-2xl border border-foreground/5">
            <h2 className="text-xl font-bold mb-4 text-pink-600">BUFFET</h2>
            <div>
              <select value={buffet} onChange={e => setBuffet(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2">
                <option value={0}>Kein Buffet / Selbstverpflegung</option>
                <option value={20}>Kleines Schnitzelbuffet (20,00 € / P)</option>
                <option value={25}>Buntes Buffet (25,00 € / P)</option>
                <option value={30}>Großes Buffet (30,00 € / P)</option>
              </select>
              <p className="text-xs text-foreground/50 mt-2">Wird für alle {totalPeople} Personen berechnet.</p>
            </div>
          </div>

          {/* Getränke */}
          <div className="glass p-6 rounded-2xl border border-foreground/5">
            <h2 className="text-xl font-bold mb-4 text-pink-600">GETRÄNKE</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Getränkeflatrate</label>
                <select value={drinksFlat} onChange={e => setDrinksFlat(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2">
                  <option value={0}>A la Carte / Abrechnung nach Verzehr</option>
                  <option value={50}>4 Stunden (50,00 € / Erw.)</option>
                  <option value={65}>6 Stunden (65,00 € / Erw.)</option>
                  <option value={75}>8 Stunden (75,00 € / Erw.)</option>
                </select>
                {drinksFlat > 0 && <p className="text-xs text-green-600 mt-1">Kinder werden automatisch mit 50% berechnet.</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Sektempfang (3,00 € / P)</label>
                  <input type="number" min="0" value={sekts} onChange={e => setSekts(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2" placeholder="Anzahl" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Wasser & Gläser (4,50 € / Setup)</label>
                  <input type="number" min="0" value={waterSetup} onChange={e => setWaterSetup(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2" placeholder="Anzahl" />
                </div>
              </div>
            </div>
          </div>

          {/* Süßes */}
          <div className="glass p-6 rounded-2xl border border-foreground/5">
            <h2 className="text-xl font-bold mb-4 text-pink-600">SÜßES & KNABBEREIEN</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Knabberkorb (5,50 €)</label>
                <input type="number" min="0" value={knabberkorb} onChange={e => setKnabberkorb(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kaffee & Kuchen (7,00 €)</label>
                <input type="number" min="0" value={coffeeCake} onChange={e => setCoffeeCake(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Candybar (100,00 € / 40 P)</label>
                <input type="number" min="0" value={candybar} onChange={e => setCandybar(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2" />
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div className="glass p-6 rounded-2xl border border-foreground/5">
            <h2 className="text-xl font-bold mb-4 text-pink-600">HIGHLIGHTS & OPTIONAL</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <input type="checkbox" id="tanz" checked={tanzshow} onChange={e => setTanzshow(e.target.checked)} className="w-5 h-5" />
                <label htmlFor="tanz" className="text-sm font-medium">Tanzshow ca. 20 min (200,00 €)</label>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <input type="checkbox" id="dj" checked={dj} onChange={e => setDj(e.target.checked)} className="w-5 h-5" />
                <label htmlFor="dj" className="text-sm font-medium">DJ THOMAS B. (450,00 €)</label>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Bowlingbahn (15€/h)</label>
                  <input type="number" min="0" value={bowlingHours} onChange={e => setBowlingHours(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Indoorspielpl. (6€/K)</label>
                  <input type="number" min="0" value={indoorKids} onChange={e => setIndoorKids(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kinderbetreuung (25€/h)</label>
                  <input type="number" min="0" value={childcareHours} onChange={e => setChildcareHours(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2" />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Data */}
          <div className="glass p-6 rounded-2xl border border-foreground/5">
            <h2 className="text-xl font-bold mb-4 text-pink-600">KONTAKTDATEN</h2>
            <div className="flex gap-4 mb-6">
              <label className="flex items-center gap-2">
                <input type="radio" checked={contactType === "privat"} onChange={() => setContactType("privat")} className="text-pink-600 w-4 h-4" /> Privat
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={contactType === "firma"} onChange={() => setContactType("firma")} className="text-pink-600 w-4 h-4" /> Firma / Verein
              </label>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              {contactType === "firma" && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold mb-2">Firmen- / Vereinsname</label>
                  <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" required={contactType === "firma"} />
                </div>
              )}
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
              {contactType === "firma" && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold mb-2">Rechnungsadresse</label>
                  <input type="text" value={billingAddress} onChange={e => setBillingAddress(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" required={contactType === "firma"} />
                </div>
              )}
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold mb-2">Nachricht / Wünsche</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3 h-24" />
              </div>
            </div>

            <button type="submit" disabled={isSubmitting || !date || !time || totalPeople < 1} className="w-full mt-4 py-4 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50">
              {isSubmitting ? "Wird gesendet..." : "Unverbindlich anfragen"}
            </button>
          </div>

        </form>

        {/* Sidebar Summary */}
        <div className="relative">
          <div className="sticky top-8 glass p-6 rounded-3xl border border-pink-500/20 shadow-xl">
            <h2 className="text-2xl font-black mb-6">Zusammenfassung</h2>
            
            <div className="space-y-3 text-sm mb-6 border-b border-foreground/10 pb-6">
              <div className="flex justify-between"><span>Gäste</span><span>{totalPeople} Personen</span></div>
              
              {roomCost > 0 && <div className="flex justify-between font-bold mt-4"><span>Location</span><span>{roomCost.toFixed(2)} €</span></div>}
              {hussenCost > 0 && <div className="flex justify-between"><span>Stretchhussen ({hussen}x)</span><span>{hussenCost.toFixed(2)} €</span></div>}
              {dekoCost > 0 && <div className="flex justify-between"><span>Deko ({totalPeople} P.)</span><span>{dekoCost.toFixed(2)} €</span></div>}
              
              {buffetCost > 0 && <div className="flex justify-between mt-2"><span>Buffet ({totalPeople} P.)</span><span>{buffetCost.toFixed(2)} €</span></div>}
              
              {sektCost > 0 && <div className="flex justify-between mt-2"><span>Sektempfang ({sekts}x)</span><span>{sektCost.toFixed(2)} €</span></div>}
              {drinksCost > 0 && <div className="flex justify-between"><span>Getränkeflat</span><span>{drinksCost.toFixed(2)} €</span></div>}
              {waterCost > 0 && <div className="flex justify-between"><span>Wasser & Gläser</span><span>{waterCost.toFixed(2)} €</span></div>}
              
              {knabberCost > 0 && <div className="flex justify-between mt-2"><span>Knabberkorb ({knabberkorb}x)</span><span>{knabberCost.toFixed(2)} €</span></div>}
              {coffeeCost > 0 && <div className="flex justify-between"><span>Kaffee & Kuchen ({coffeeCake}x)</span><span>{coffeeCost.toFixed(2)} €</span></div>}
              {candyCost > 0 && <div className="flex justify-between"><span>Candybar ({candybar}x)</span><span>{candyCost.toFixed(2)} €</span></div>}
              
              {tanzCost > 0 && <div className="flex justify-between mt-2"><span>Tanzshow</span><span>{tanzCost.toFixed(2)} €</span></div>}
              {bowlingCost > 0 && <div className="flex justify-between"><span>Bowling ({bowlingHours}h)</span><span>{bowlingCost.toFixed(2)} €</span></div>}
              {indoorCost > 0 && <div className="flex justify-between"><span>Indoorspielplatz ({indoorKids} K)</span><span>{indoorCost.toFixed(2)} €</span></div>}
              {childCareCost > 0 && <div className="flex justify-between"><span>Kinderbetreuung ({childcareHours}h)</span><span>{childCareCost.toFixed(2)} €</span></div>}
              
              {djCost > 0 && <div className="flex justify-between mt-2"><span>DJ THOMAS B.</span><span>{djCost.toFixed(2)} €</span></div>}

              {total === 0 && <div className="text-foreground/50 italic py-4 text-center">Noch keine Positionen gewählt.</div>}
            </div>

            <div className="flex justify-between items-end mb-2">
              <span className="font-bold text-lg">Ca. Gesamtbetrag</span>
              <span className="text-3xl font-black text-pink-600">{total.toFixed(2)} €</span>
            </div>
            
            {totalPeople > 0 && total > 0 && (
              <div className="text-right text-xs text-foreground/50">
                (entspricht {(total / totalPeople).toFixed(2)} € pro Person)
              </div>
            )}
            <p className="text-xs text-foreground/40 mt-4 text-center">
              Dies ist eine unverbindliche Kostenschätzung. Der finale Preis kann abweichen.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
