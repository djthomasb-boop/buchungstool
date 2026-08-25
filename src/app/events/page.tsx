"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Music, CheckCircle, ArrowRight, PackageOpen, Users, CalendarIcon, Info, Warehouse, Presentation } from "lucide-react";
import { format, addDays } from "date-fns";
import { de } from "date-fns/locale";
import { submitBooking } from "@/app/actions/booking";

export default function EventsPage() {
  const [step, setStep] = useState(1);
  
  // Basic Info
  const [eventLocation, setEventLocation] = useState<"Halle" | "Kursraum">("Halle");
  const [eventType, setEventType] = useState("Geburtstag");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:00");
  const [eventDuration, setEventDuration] = useState("6");
  const [people, setPeople] = useState("50");
  const [eventSetupTime, setEventSetupTime] = useState(false);

  // Halle Packages
  const [hallePackage, setHallePackage] = useState<"pur" | "komplett">("pur");
  
  // Kursraum Packages
  const [kursraumPackage, setKursraumPackage] = useState<"pur" | "basic" | "allin">("pur");
  const [eventBuffet, setEventBuffet] = useState<"schnitzel" | "bunt" | "gross">("schnitzel");

  // Extras
  const [eventServiceStaff, setEventServiceStaff] = useState("0");
  const [eventMusicTech, setEventMusicTech] = useState(""); // For Halle: "Tontechniker", For Kursraum: "DJ"
  const [wantsDJ, setWantsDJ] = useState(false); // Kursraum
  const [wantsTontechniker, setWantsTontechniker] = useState(false); // Halle

  // Contact
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Enforce min people for All IN
  useEffect(() => {
    if (eventLocation === "Kursraum" && kursraumPackage === "allin") {
      if (parseInt(people) < 30) {
        setPeople("30");
      }
    }
  }, [eventLocation, kursraumPackage, people]);

  // Max service staff for Kursraum / Eventlocation
  useEffect(() => {
    if (eventLocation === "Kursraum" && parseInt(eventServiceStaff) > 3) {
      setEventServiceStaff("3");
    }
  }, [eventLocation, eventServiceStaff]);

  const totalPrice = useMemo(() => {
    let sum = 0;
    const duration = parseInt(eventDuration) || 0;
    const staffCount = parseInt(eventServiceStaff) || 0;
    const peopleCount = parseInt(people) || 0;

    // Servicekräfte: 85 € / h / staff
    const staffCost = staffCount * duration * 85;
    sum += staffCost;

    if (eventLocation === "Halle") {
      if (hallePackage === "pur") {
        sum += 1200; // Halle pur
      } else {
        sum += 4850; // Komplettpaket (4500 + 350)
      }
      if (wantsTontechniker) sum += 350;
    } 
    else if (eventLocation === "Kursraum") {
      if (kursraumPackage === "pur") {
        sum += 250;
      } else if (kursraumPackage === "basic") {
        sum += 300;
      } else if (kursraumPackage === "allin") {
        // Only per person, no base fee
        if (eventBuffet === "schnitzel") sum += peopleCount * 35;
        if (eventBuffet === "bunt") sum += peopleCount * 40;
        if (eventBuffet === "gross") sum += peopleCount * 50;
      }
      
      if (wantsDJ) sum += 400;
    }

    return sum;
  }, [eventLocation, hallePackage, kursraumPackage, eventBuffet, eventServiceStaff, eventDuration, people, wantsDJ, wantsTontechniker]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let pkgName = "";
    let musicTechStr = "";
    
    if (eventLocation === "Halle") {
      pkgName = hallePackage === "pur" ? "Halle pur" : "Komplettpaket";
      musicTechStr = wantsTontechniker ? "Tontechniker" : "";
    } else {
      pkgName = kursraumPackage === "pur" ? "Location pur" : kursraumPackage === "basic" ? "Location Basic" : "All IN";
      musicTechStr = wantsDJ ? "Haus DJ" : "";
    }

    let buffetStr = "";
    if (eventLocation === "Kursraum" && kursraumPackage === "allin") {
      buffetStr = eventBuffet === "schnitzel" ? "Schnitzelbuffet" : eventBuffet === "bunt" ? "Buntes Buffet" : "Großes Buffet";
    }

    const res = await submitBooking({
      type: "event",
      date,
      time,
      duration: parseInt(eventDuration) || 0,
      people: parseInt(people) || 0,
      shoes: 0,
      lanes: null,
      name,
      email,
      phone,
      wantsFood: (eventLocation === "Kursraum" && kursraumPackage === "allin"),
      notes,
      totalPrice,
      eventLocation: eventLocation === "Halle" ? "Große Halle" : "Kursraum 1",
      eventType,
      eventSetupTime,
      eventBuffet: buffetStr,
      eventServiceStaff: parseInt(eventServiceStaff) || 0,
      eventMusicTech: musicTechStr,
      eventDuration: parseInt(eventDuration) || 0,
      package: pkgName
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
        <div className="glass p-12 rounded-3xl text-center max-w-lg border-purple-500/20">
          <CheckCircle size={64} className="text-purple-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Anfrage erfolgreich!</h1>
          <p className="text-foreground/70 mb-8">
            Deine Event-Anfrage für den {format(new Date(date), "dd.MM.yyyy")} ist bei uns eingegangen. Wir melden uns in Kürze bei dir unter {email}, um alle Details abzustimmen!
          </p>
          <Link href="/" className="inline-flex items-center px-6 py-3 rounded-full bg-purple-500 text-white font-bold hover:bg-purple-600 transition-colors">
            <ArrowLeft size={20} className="mr-2" /> Zurück zur Startseite
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-purple-500 hover:underline mb-8 font-medium">
          <ArrowLeft size={16} className="mr-2" /> Zurück zur Übersicht
        </Link>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-purple-500/10 p-3 rounded-2xl text-purple-500">
            <Music size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Event Location buchen</h1>
            <p className="text-foreground/60">Finde den perfekten Raum für dein nächstes Event.</p>
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
          
          {/* STEP 1: Basisdaten & Location */}
          {step === 1 && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4"><Warehouse className="text-purple-500" /> Wähle deine Location</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className={`block p-5 rounded-2xl border-2 cursor-pointer transition-all ${eventLocation === "Halle" ? 'border-purple-500 bg-purple-500/5' : 'border-foreground/10 hover:border-purple-500/30'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <input type="radio" checked={eventLocation === "Halle"} onChange={() => setEventLocation("Halle")} className="w-5 h-5 text-purple-600" />
                      <span className="font-bold text-lg">Große Halle</span>
                    </div>
                    <p className="text-sm text-foreground/60 pl-8">Bis 1000 Personen. Ideal für Konzerte, Disco Nights & große Events. Inklusive Bühne & LED Leinwand.</p>
                  </label>
                  
                  <label className={`block p-5 rounded-2xl border-2 cursor-pointer transition-all ${eventLocation === "Kursraum" ? 'border-purple-500 bg-purple-500/5' : 'border-foreground/10 hover:border-purple-500/30'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <input type="radio" checked={eventLocation === "Kursraum"} onChange={() => setEventLocation("Kursraum")} className="w-5 h-5 text-purple-600" />
                      <span className="font-bold text-lg">Eventlocation (für max 150 Personen)</span>
                    </div>
                    <p className="text-sm text-foreground/60 pl-8">Bis 150 Personen. Perfekt für Hochzeiten, Geburtstage, Firmen- oder Vereinsfeiern.</p>
                  </label>
                </div>
              </div>

              <div className="border-t border-foreground/5 pt-6">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4"><CalendarIcon className="text-purple-500" /> Event-Daten</h2>
                
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold mb-2">Art des Events</label>
                    <select value={eventType} onChange={e => setEventType(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" required>
                      <option value="Geburtstag">Geburtstag</option>
                      <option value="Hochzeit">Hochzeit</option>
                      <option value="Firmenfeier">Firmenfeier</option>
                      <option value="Kommerzielles Event">Kommerzielles Event (Konzert etc.)</option>
                      <option value="Sonstiges">Sonstiges</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">Gästeanzahl</label>
                    <input type="number" value={people} onChange={e => setPeople(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" min="10" required />
                    {eventLocation === "Kursraum" && kursraumPackage === "allin" && parseInt(people) < 30 && (
                       <p className="text-xs text-red-500 mt-1">Für 'All IN' sind mind. 30 Personen erforderlich.</p>
                    )}
                    {eventLocation === "Halle" && parseInt(people) < 150 && (
                       <p className="text-xs text-red-500 mt-1">Die Große Halle ist erst ab 150 Personen buchbar.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">Wunsch-Datum</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} min={format(addDays(new Date(), 3), 'yyyy-MM-dd')} className="w-full bg-background border rounded-xl px-4 py-3" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-2">Start (Uhrzeit)</label>
                      <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" required />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2">Dauer (ca. Std)</label>
                      <input type="number" value={eventDuration} onChange={e => setEventDuration(e.target.value)} min="1" max="48" className="w-full bg-background border rounded-xl px-4 py-3" required />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3 p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                  <input type="checkbox" id="setup" checked={eventSetupTime} onChange={e => setEventSetupTime(e.target.checked)} className="w-5 h-5 text-purple-600 rounded" />
                  <label htmlFor="setup" className="font-medium cursor-pointer">Wir möchten am Vortag oder früher einräumen / dekorieren.</label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Packages & Extras */}
          {step === 2 && (
            <div className="space-y-8 animate-fade-in">
              <h2 className="text-xl font-bold flex items-center gap-2"><PackageOpen className="text-purple-500" /> Pakete & Optionen</h2>
              
              {eventLocation === "Halle" ? (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className={`block p-5 rounded-2xl border-2 cursor-pointer transition-all ${hallePackage === "pur" ? 'border-purple-500 bg-purple-500/5' : 'border-foreground/10 hover:border-purple-500/30'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <input type="radio" checked={hallePackage === "pur"} onChange={() => setHallePackage("pur")} className="w-5 h-5 text-purple-600 mt-1" />
                          <span className="font-bold text-lg">Halle pur</span>
                        </div>
                        <span className="font-black text-purple-600 text-lg">1.200 €</span>
                      </div>
                      <p className="text-sm text-foreground/60 pl-8">Reine Hallenmiete ohne Servicekräfte, Techniker oder Sitzinventar. Bar und Bühne können mitbenutzt werden.</p>
                    </label>
                    
                    <label className={`block p-5 rounded-2xl border-2 cursor-pointer transition-all ${hallePackage === "komplett" ? 'border-purple-500 bg-purple-500/5' : 'border-foreground/10 hover:border-purple-500/30'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <input type="radio" checked={hallePackage === "komplett"} onChange={() => setHallePackage("komplett")} className="w-5 h-5 text-purple-600 mt-1" />
                          <span className="font-bold text-lg">Komplettpaket</span>
                        </div>
                        <span className="font-black text-purple-600 text-lg">4.850 €</span>
                      </div>
                      <p className="text-sm text-foreground/60 pl-8">Inklusive bis zu 6 Servicekräfte, 1x Tontechniker, Inventar (z.B. Hussen) und Endreinigung (350€).</p>
                    </label>
                  </div>

                  {hallePackage === "pur" && (
                     <div className="border-t border-foreground/5 pt-6 space-y-4">
                       <h3 className="font-bold">Zubuchbare Optionen</h3>
                       <div className="grid sm:grid-cols-2 gap-4">
                         <div className="p-4 border border-foreground/10 rounded-xl bg-background">
                           <label className="block text-sm font-bold mb-2">Servicekräfte (85 € / Std)</label>
                           <input type="number" value={eventServiceStaff} onChange={e => setEventServiceStaff(e.target.value)} min="0" max="10" className="w-full bg-foreground/5 border rounded-lg px-4 py-2" />
                         </div>
                         <label className="flex items-center justify-between p-4 border border-foreground/10 rounded-xl bg-background cursor-pointer hover:bg-foreground/5">
                           <div className="flex items-center gap-3">
                             <input type="checkbox" checked={wantsTontechniker} onChange={e => setWantsTontechniker(e.target.checked)} className="w-5 h-5 text-purple-600 rounded" />
                             <span className="font-bold">Tontechniker</span>
                           </div>
                           <span className="font-bold text-purple-600">+350 €</span>
                         </label>
                       </div>
                     </div>
                  )}
                </>
              ) : (
                <>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <label className={`block p-4 rounded-2xl border-2 cursor-pointer transition-all ${kursraumPackage === "pur" ? 'border-purple-500 bg-purple-500/5' : 'border-foreground/10 hover:border-purple-500/30'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <input type="radio" checked={kursraumPackage === "pur"} onChange={() => setKursraumPackage("pur")} className="w-4 h-4 text-purple-600" />
                          <span className="font-bold">Location pur</span>
                        </div>
                      </div>
                      <p className="text-xs text-foreground/60 pl-6 mb-2">Miete pur. Du bringst Getränke, Essen etc. selbst mit.</p>
                      <div className="pl-6 font-black text-purple-600">250 €</div>
                    </label>
                    
                    <label className={`block p-4 rounded-2xl border-2 cursor-pointer transition-all ${kursraumPackage === "basic" ? 'border-purple-500 bg-purple-500/5' : 'border-foreground/10 hover:border-purple-500/30'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <input type="radio" checked={kursraumPackage === "basic"} onChange={() => setKursraumPackage("basic")} className="w-4 h-4 text-purple-600" />
                          <span className="font-bold">Location Basic</span>
                        </div>
                      </div>
                      <p className="text-xs text-foreground/60 pl-6 mb-2">Inkl. thematisch ausgestattetem Inventar (z.B. Hochzeit).</p>
                      <div className="pl-6 font-black text-purple-600">300 €</div>
                    </label>

                    <label className={`block p-4 rounded-2xl border-2 cursor-pointer transition-all ${kursraumPackage === "allin" ? 'border-purple-500 bg-purple-500/5' : 'border-foreground/10 hover:border-purple-500/30'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <input type="radio" checked={kursraumPackage === "allin"} onChange={() => setKursraumPackage("allin")} className="w-4 h-4 text-purple-600" />
                          <span className="font-bold">All IN</span>
                        </div>
                      </div>
                      <p className="text-xs text-foreground/60 pl-6 mb-2">Location Basic + Service + tolles Buffet. (Ab 30 Personen)</p>
                      <div className="pl-6 font-black text-purple-600">ab 35 € p.P.</div>
                    </label>
                  </div>

                  {kursraumPackage === "allin" && (
                    <div className="border-t border-foreground/5 pt-6 animate-slide-up">
                      <h3 className="font-bold mb-4">Buffet auswählen (Preis gilt pro Person)</h3>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <label className={`block p-4 rounded-xl border-2 cursor-pointer ${eventBuffet === "schnitzel" ? 'border-purple-500 bg-purple-500/5' : 'border-foreground/10 hover:border-purple-500/30'}`}>
                          <input type="radio" checked={eventBuffet === "schnitzel"} onChange={() => setEventBuffet("schnitzel")} className="hidden" />
                          <div className="font-bold mb-1">Schnitzelbuffet</div>
                          <div className="text-purple-600 font-bold mb-2">35 € p.P.</div>
                          <ul className="text-xs text-foreground/60 space-y-1 list-disc pl-4">
                            <li>Salat & Brotkorb</li>
                            <li>Schweineschnitzel</li>
                            <li>Gemüse mit Hollandaise</li>
                            <li>Pommes & Spalten</li>
                          </ul>
                        </label>
                        <label className={`block p-4 rounded-xl border-2 cursor-pointer ${eventBuffet === "bunt" ? 'border-purple-500 bg-purple-500/5' : 'border-foreground/10 hover:border-purple-500/30'}`}>
                          <input type="radio" checked={eventBuffet === "bunt"} onChange={() => setEventBuffet("bunt")} className="hidden" />
                          <div className="font-bold mb-1">Buntes Buffet</div>
                          <div className="text-purple-600 font-bold mb-2">40 € p.P.</div>
                          <ul className="text-xs text-foreground/60 space-y-1 list-disc pl-4">
                            <li>Alles aus Schnitzelbuffet</li>
                            <li>Hähnchen in Sahnesoße</li>
                            <li>Süße Nachspeise</li>
                          </ul>
                        </label>
                        <label className={`block p-4 rounded-xl border-2 cursor-pointer ${eventBuffet === "gross" ? 'border-purple-500 bg-purple-500/5' : 'border-foreground/10 hover:border-purple-500/30'}`}>
                          <input type="radio" checked={eventBuffet === "gross"} onChange={() => setEventBuffet("gross")} className="hidden" />
                          <div className="font-bold mb-1">Großes Buffet</div>
                          <div className="text-purple-600 font-bold mb-2">50 € p.P.</div>
                          <ul className="text-xs text-foreground/60 space-y-1 list-disc pl-4">
                            <li>Alles aus Buntes Buffet</li>
                            <li>Hausgemachte Suppe</li>
                            <li>Hackfleischpfanne</li>
                            <li>Fingerfoodplatte</li>
                          </ul>
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-foreground/5 pt-6 space-y-4">
                     <h3 className="font-bold">Zusatzoptionen</h3>
                     <div className="grid sm:grid-cols-2 gap-4">
                       <div className="p-4 border border-foreground/10 rounded-xl bg-background">
                         <label className="block text-sm font-bold mb-2">Servicekräfte (85 € / Std, max 3)</label>
                         <input type="number" value={eventServiceStaff} onChange={e => setEventServiceStaff(e.target.value)} min="0" max="3" className="w-full bg-foreground/5 border rounded-lg px-4 py-2" />
                       </div>
                       <label className="flex items-center justify-between p-4 border border-foreground/10 rounded-xl bg-background cursor-pointer hover:bg-foreground/5">
                         <div className="flex items-center gap-3">
                           <input type="checkbox" checked={wantsDJ} onChange={e => setWantsDJ(e.target.checked)} className="w-5 h-5 text-purple-600 rounded" />
                           <span className="font-bold">Haus DJ (für den Abend)</span>
                         </div>
                         <span className="font-bold text-purple-600">+400 €</span>
                       </label>
                     </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 3: Contact */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold flex items-center gap-2"><Users className="text-purple-500" /> Kontaktdaten</h2>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold mb-2">Name / Firma</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" required />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">E-Mail</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" required />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Telefon</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold mb-2">Besondere Wünsche oder Anmerkungen</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3 resize-none" rows={3} placeholder="z.B. Wir brauchen einen Beamer, Vegetarisches Essen..." />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Summary & Submit */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold flex items-center gap-2"><Info className="text-purple-500" /> Zusammenfassung & Anfrage senden</h2>
              
              <div className="bg-purple-500/5 border border-purple-500/20 p-6 rounded-2xl mt-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span>Location:</span> <strong>{eventLocation === "Halle" ? "Große Halle" : "Eventlocation"}</strong></div>
                  <div className="flex justify-between"><span>Art des Events:</span> <strong>{eventType}</strong></div>
                  <div className="flex justify-between"><span>Termin:</span> <strong>{date ? format(new Date(date), "dd.MM.yyyy") : "-"} ab {time} Uhr</strong></div>
                  <div className="flex justify-between"><span>Dauer (geschätzt):</span> <strong>{eventDuration} Stunden</strong></div>
                  <div className="flex justify-between"><span>Gästeanzahl:</span> <strong>{people} Personen</strong></div>
                  <div className="flex justify-between"><span>Früher einräumen:</span> <strong>{eventSetupTime ? "Ja" : "Nein"}</strong></div>
                  
                  <div className="border-t border-purple-500/10 my-3 pt-3"></div>

                  {eventLocation === "Halle" ? (
                    <>
                      <div className="flex justify-between"><span>Paket:</span> <strong>{hallePackage === "pur" ? "Halle pur" : "Komplettpaket"}</strong></div>
                      {hallePackage === "pur" && wantsTontechniker && <div className="flex justify-between"><span>Tontechniker:</span> <strong>Ja (+350 €)</strong></div>}
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between"><span>Paket:</span> <strong>{kursraumPackage === "pur" ? "Location pur" : kursraumPackage === "basic" ? "Location Basic" : "All IN"}</strong></div>
                      {kursraumPackage === "allin" && (
                         <div className="flex justify-between"><span>Buffet:</span> <strong>{eventBuffet === "schnitzel" ? "Schnitzelbuffet" : eventBuffet === "bunt" ? "Buntes Buffet" : "Großes Buffet"}</strong></div>
                      )}
                      {wantsDJ && <div className="flex justify-between"><span>Haus DJ:</span> <strong>Ja (+400 €)</strong></div>}
                    </>
                  )}
                  
                  {parseInt(eventServiceStaff) > 0 && (
                    <div className="flex justify-between"><span>Servicekräfte:</span> <strong>{eventServiceStaff} (à 85 €/Std)</strong></div>
                  )}

                  <div className="flex justify-between text-xl pt-4 mt-4 border-t border-purple-500/20">
                    <span className="font-bold">Geschätzter Gesamtpreis:</span> 
                    <span className="font-black text-purple-600">{totalPrice.toFixed(2)} €</span>
                  </div>
                  <p className="text-xs text-foreground/50 text-right mt-1">
                    *Dies ist eine unverbindliche Anfrage. Der endgültige Preis (insbesondere für Verpflegung & Dauer) wird im Gespräch abgestimmt.
                  </p>
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
                disabled={(step === 1 && !date) || (step === 1 && eventLocation === "Halle" && parseInt(people) < 150)}
                className="flex items-center px-8 py-3 rounded-full font-bold bg-purple-500 text-white hover:bg-purple-600 transition-colors disabled:opacity-50"
              >
                Weiter <ArrowRight size={18} className="ml-2" />
              </button>
            ) : (
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex items-center px-8 py-3 rounded-full font-bold bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50 shadow-lg shadow-green-500/20"
              >
                {isSubmitting ? "Wird gesendet..." : <><CheckCircle size={18} className="mr-2" /> Anfrage absenden</>}
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
