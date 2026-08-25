"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, ArrowRight, PackageOpen, Users, CalendarIcon, Info, Trees } from "lucide-react";
import { format, addDays } from "date-fns";
import { submitBooking } from "@/app/actions/booking";

export default function OutdoorPage() {
  const [step, setStep] = useState(1);
  
  // Basic Info
  const [eventType, setEventType] = useState("Geburtstag");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("14:00");
  const [eventDuration, setEventDuration] = useState("6");
  const [people, setPeople] = useState("30");

  // Packages
  const [outdoorPackage, setOutdoorPackage] = useState<"basis" | "allin">("basis");
  const [eventBuffet, setEventBuffet] = useState<"schnitzel" | "bunt" | "gross" | "grill">("grill");

  // Contact
  const [contactType, setContactType] = useState<"privat" | "firma">("privat");
  const [companyName, setCompanyName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const totalPrice = useMemo(() => {
    let sum = 0;
    const peopleCount = parseInt(people) || 0;

    if (outdoorPackage === "basis") {
      sum += 250; // Basis Paket
    } else if (outdoorPackage === "allin") {
      sum += 100; // Arealmiete
      if (eventBuffet === "schnitzel") sum += peopleCount * 20;
      if (eventBuffet === "bunt") sum += peopleCount * 25;
      if (eventBuffet === "gross") sum += peopleCount * 30;
      if (eventBuffet === "grill") sum += peopleCount * 35;
    }

    return sum;
  }, [outdoorPackage, eventBuffet, people]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const pkgName = outdoorPackage === "basis" ? "Basis Paket (Selbstversorger)" : "All In Paket";
    let buffetStr = "";
    if (outdoorPackage === "allin") {
      if (eventBuffet === "schnitzel") buffetStr = "Schnitzel Buffet (20 €)";
      if (eventBuffet === "bunt") buffetStr = "Buntes Buffet (25 €)";
      if (eventBuffet === "gross") buffetStr = "Großes Buffet (30 €)";
      if (eventBuffet === "grill") buffetStr = "Grillbuffet (35 €)";
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
      wantsFood: (outdoorPackage === "allin"),
      notes,
      totalPrice,
      eventLocation: "Outdoor Location",
      eventType,
      eventSetupTime: false,
      eventBuffet: buffetStr,
      eventServiceStaff: 0,
      eventMusicTech: "",
      eventDuration: parseInt(eventDuration) || 0,
      package: pkgName,
      contactType,
      companyName: contactType === "firma" ? companyName : undefined,
      billingAddress: contactType === "firma" ? billingAddress : undefined,
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
            Deine Outdoor-Event-Anfrage für den {format(new Date(date), "dd.MM.yyyy")} ist bei uns eingegangen. Wir melden uns in Kürze bei dir unter {email}, um alle Details abzustimmen!
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
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-green-500 hover:underline mb-8 font-medium">
          <ArrowLeft size={16} className="mr-2" /> Zurück zur Übersicht
        </Link>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-green-500/10 p-3 rounded-2xl text-green-500">
            <Trees size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Outdoor Location buchen</h1>
            <p className="text-foreground/60">Kinder spielen und die Erwachsenen feiern. Von 20 bis 100 Personen.</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-foreground/5 -z-10 rounded-full" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-green-500 -z-10 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 3) * 100}%` }} />
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= i ? 'bg-green-500 text-white' : 'bg-background border-2 border-foreground/10 text-foreground/40'}`}>
              {i}
            </div>
          ))}
        </div>

        <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); setStep(s => s + 1); window.scrollTo(0,0); }} className="glass p-6 sm:p-8 rounded-3xl shadow-sm border border-foreground/5">
          
          {/* STEP 1: Basisdaten */}
          {step === 1 && (
            <div className="space-y-8 animate-fade-in">
              <div className="bg-green-500/5 border border-green-500/20 p-5 rounded-2xl text-sm">
                <p className="font-bold text-green-600 mb-2">Grundausstattung inklusive:</p>
                <ul className="list-disc pl-5 text-foreground/70 space-y-1">
                  <li>Minigolf & Klettergerüst</li>
                  <li>Trampolin</li>
                  <li>Partyzelt & Sitzgelegenheiten</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4"><CalendarIcon className="text-green-500" /> Event-Daten</h2>
                
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold mb-2">Art des Events</label>
                    <select value={eventType} onChange={e => setEventType(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" required>
                      <option value="Geburtstag">Geburtstag</option>
                      <option value="Kindergeburtstag">Großer Kindergeburtstag</option>
                      <option value="Firmenfeier">Firmenfeier</option>
                      <option value="Sonstiges">Sonstiges</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">Gästeanzahl</label>
                    <input type="number" value={people} onChange={e => setPeople(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" min="20" max="100" required />
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
                      <input type="number" value={eventDuration} onChange={e => setEventDuration(e.target.value)} min="1" max="24" className="w-full bg-background border rounded-xl px-4 py-3" required />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Packages & Extras */}
          {step === 2 && (
            <div className="space-y-8 animate-fade-in">
              <h2 className="text-xl font-bold flex items-center gap-2"><PackageOpen className="text-green-500" /> Wähle dein Paket</h2>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <label className={`block p-5 rounded-2xl border-2 cursor-pointer transition-all ${outdoorPackage === "basis" ? 'border-green-500 bg-green-500/5' : 'border-foreground/10 hover:border-green-500/30'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <input type="radio" checked={outdoorPackage === "basis"} onChange={() => setOutdoorPackage("basis")} className="w-5 h-5 text-green-600 mt-1" />
                      <span className="font-bold text-lg">Basis Paket</span>
                    </div>
                    <span className="font-black text-green-600 text-lg">250 €</span>
                  </div>
                  <p className="text-sm text-foreground/60 pl-8">Reine Arealmiete inkl. Grundausstattung. Du kümmerst dich selbst um Verpflegung, Deko und Geschirr.</p>
                </label>
                
                <label className={`block p-5 rounded-2xl border-2 cursor-pointer transition-all ${outdoorPackage === "allin" ? 'border-green-500 bg-green-500/5' : 'border-foreground/10 hover:border-green-500/30'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <input type="radio" checked={outdoorPackage === "allin"} onChange={() => setOutdoorPackage("allin")} className="w-5 h-5 text-green-600 mt-1" />
                      <span className="font-bold text-lg">All In Paket</span>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/60 pl-8 mb-2">Arealmiete + Verpflegung sowie Geschirr, Besteck & Deko.</p>
                  <div className="pl-8 text-sm">
                    <div className="font-bold text-green-600">100 € Grundpreis</div>
                    <div className="font-bold text-green-600">+ Preis je nach Buffet pro Person</div>
                  </div>
                </label>
              </div>

              {outdoorPackage === "allin" && (
                <div className="border-t border-foreground/5 pt-6 animate-slide-up">
                  <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-sm mb-6">
                    <strong>Hinweis zu Getränken:</strong> Getränke werden separat nach tatsächlichem Verbrauch berechnet. <br/>
                    <a href="https://befree.world/food-world/" target="_blank" className="text-green-600 underline font-bold mt-1 inline-block">Unsere Getränkekarte ansehen</a>
                  </div>

                  <h3 className="font-bold mb-4">Buffet auswählen (Preis gilt pro Person)</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <label className={`block p-4 rounded-xl border-2 cursor-pointer ${eventBuffet === "schnitzel" ? 'border-green-500 bg-green-500/5' : 'border-foreground/10 hover:border-green-500/30'}`}>
                      <input type="radio" checked={eventBuffet === "schnitzel"} onChange={() => setEventBuffet("schnitzel")} className="hidden" />
                      <div className="font-bold mb-1">Schnitzel Buffet</div>
                      <div className="text-green-600 font-bold mb-2">20 € p.P.</div>
                      <ul className="text-xs text-foreground/60 space-y-1 list-disc pl-4">
                        <li>bunter frischer Salat</li>
                        <li>Brotkorb mit Schmalz</li>
                        <li>Schweineschnitzel</li>
                        <li>Gemüse mit Hollandaise</li>
                        <li>Rahm-Champignons</li>
                        <li>Pommes & Kartoffelspalten</li>
                      </ul>
                    </label>

                    <label className={`block p-4 rounded-xl border-2 cursor-pointer ${eventBuffet === "bunt" ? 'border-green-500 bg-green-500/5' : 'border-foreground/10 hover:border-green-500/30'}`}>
                      <input type="radio" checked={eventBuffet === "bunt"} onChange={() => setEventBuffet("bunt")} className="hidden" />
                      <div className="font-bold mb-1">Buntes Buffet</div>
                      <div className="text-green-600 font-bold mb-2">25 € p.P.</div>
                      <ul className="text-xs text-foreground/60 space-y-1 list-disc pl-4">
                        <li>Alles aus Schnitzel Buffet</li>
                        <li>Hähnchen in Sahnesoße</li>
                        <li>süße Nachspeise</li>
                      </ul>
                    </label>

                    <label className={`block p-4 rounded-xl border-2 cursor-pointer ${eventBuffet === "gross" ? 'border-green-500 bg-green-500/5' : 'border-foreground/10 hover:border-green-500/30'}`}>
                      <input type="radio" checked={eventBuffet === "gross"} onChange={() => setEventBuffet("gross")} className="hidden" />
                      <div className="font-bold mb-1">Großes Buffet</div>
                      <div className="text-green-600 font-bold mb-2">30 € p.P.</div>
                      <ul className="text-xs text-foreground/60 space-y-1 list-disc pl-4">
                        <li>Alles aus Buntes Buffet</li>
                        <li>Hausgemachte Suppe</li>
                        <li>Hackfleischpfanne Toskana</li>
                        <li>Fingerfoodplatte</li>
                        <li>Verschiedene Desserts</li>
                      </ul>
                    </label>

                    <label className={`block p-4 rounded-xl border-2 cursor-pointer ${eventBuffet === "grill" ? 'border-green-500 bg-green-500/5' : 'border-foreground/10 hover:border-green-500/30'}`}>
                      <input type="radio" checked={eventBuffet === "grill"} onChange={() => setEventBuffet("grill")} className="hidden" />
                      <div className="font-bold mb-1">Grillbuffet</div>
                      <div className="text-green-600 font-bold mb-2">35 € p.P.</div>
                      <ul className="text-xs text-foreground/60 space-y-1 list-disc pl-4">
                        <li>Steak & Geflügel</li>
                        <li>Bratwurst & Beef</li>
                        <li>Verschiedene Salate</li>
                        <li>Brot & Dips</li>
                      </ul>
                    </label>
                  </div>
                  <p className="text-sm text-foreground/70 mt-4 bg-green-500/5 p-3 rounded-lg border border-green-500/20">
                    <strong>Hinweis:</strong> Geschirr, Besteck & Deko wird bei jedem Buffet von uns gestellt!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Contact */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold flex items-center gap-2"><Users className="text-green-500" /> Kontaktdaten</h2>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2 flex gap-4 mb-2">
                  <label className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors ${contactType === "privat" ? 'border-green-500 bg-green-500/5' : 'border-foreground/10 hover:border-green-500/30'}`}>
                    <input type="radio" checked={contactType === "privat"} onChange={() => setContactType("privat")} className="w-4 h-4 text-green-600" />
                    <span className="font-bold">Privatperson</span>
                  </label>
                  <label className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors ${contactType === "firma" ? 'border-green-500 bg-green-500/5' : 'border-foreground/10 hover:border-green-500/30'}`}>
                    <input type="radio" checked={contactType === "firma"} onChange={() => setContactType("firma")} className="w-4 h-4 text-green-600" />
                    <span className="font-bold">Firma / Verein</span>
                  </label>
                </div>

                {contactType === "firma" && (
                  <>
                    <div>
                      <label className="block text-sm font-bold mb-2">Firmenname / Vereinsname</label>
                      <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" required />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2">Rechnungsadresse</label>
                      <input type="text" value={billingAddress} onChange={e => setBillingAddress(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" placeholder="Straße, PLZ Ort" required />
                    </div>
                  </>
                )}

                <div className={contactType === "privat" ? "sm:col-span-2" : ""}>
                  <label className="block text-sm font-bold mb-2">Name Ansprechpartner</label>
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
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3 resize-none" rows={3} placeholder="z.B. Besondere Allergien, Getränkewünsche..." />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Summary & Submit */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold flex items-center gap-2"><Info className="text-green-500" /> Zusammenfassung & Anfrage senden</h2>
              
              <div className="bg-green-500/5 border border-green-500/20 p-6 rounded-2xl mt-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span>Location:</span> <strong>Outdoor Location</strong></div>
                  <div className="flex justify-between"><span>Art des Events:</span> <strong>{eventType}</strong></div>
                  <div className="flex justify-between"><span>Termin:</span> <strong>{date ? format(new Date(date), "dd.MM.yyyy") : "-"} ab {time} Uhr</strong></div>
                  <div className="flex justify-between"><span>Dauer (geschätzt):</span> <strong>{eventDuration} Stunden</strong></div>
                  <div className="flex justify-between"><span>Gästeanzahl:</span> <strong>{people} Personen</strong></div>
                  
                  <div className="border-t border-green-500/10 my-3 pt-3"></div>

                  <div className="flex justify-between"><span>Paket:</span> <strong>{outdoorPackage === "basis" ? "Basis Paket" : "All In Paket"}</strong></div>
                  {outdoorPackage === "allin" && (
                     <div className="flex justify-between text-foreground/70 text-xs">
                       <span>Buffet:</span> 
                       <span>
                         {eventBuffet === "schnitzel" ? "Schnitzel Buffet" : eventBuffet === "bunt" ? "Buntes Buffet" : eventBuffet === "gross" ? "Großes Buffet" : "Grillbuffet"}
                       </span>
                     </div>
                  )}
                  {contactType === "firma" && (
                    <div className="flex justify-between text-foreground/70 text-xs mt-2"><span>Firma:</span> <span>{companyName}</span></div>
                  )}

                  <div className="flex justify-between text-xl pt-4 mt-4 border-t border-green-500/20">
                    <span className="font-bold">Geschätzter Gesamtpreis:</span> 
                    <span className="font-black text-green-600">{totalPrice.toFixed(2)} €</span>
                  </div>
                  <p className="text-xs text-foreground/50 text-right mt-1">
                    *Dies ist eine unverbindliche Anfrage. Der endgültige Preis wird im Gespräch abgestimmt.
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
                disabled={step === 1 && !date}
                className="flex items-center px-8 py-3 rounded-full font-bold bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50"
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
