"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calculator, Save } from "lucide-react";

export default function EventCalculatorPage() {
  const [adults, setAdults] = useState<number>(30);
  const [kids, setKids] = useState<number>(0);

  // AUSSTATTUNG & DEKO
  const [room, setRoom] = useState<number>(0); // 0, 300, 500, 1000
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
  const [djPrice, setDjPrice] = useState<number>(0);
  const [customExtras, setCustomExtras] = useState<number>(0);
  const [techPrice, setTechPrice] = useState<number>(0);

  // MANUELLE FELDER (4 Gruppen)
  const [custom1Name, setCustom1Name] = useState<string>("");
  const [custom1Price, setCustom1Price] = useState<number>(0);
  const [custom2Name, setCustom2Name] = useState<string>("");
  const [custom2Price, setCustom2Price] = useState<number>(0);
  const [custom3Name, setCustom3Name] = useState<string>("");
  const [custom3Price, setCustom3Price] = useState<number>(0);
  const [custom4Name, setCustom4Name] = useState<string>("");
  const [custom4Price, setCustom4Price] = useState<number>(0);

  const totalPeople = adults + kids;

  // Berechnungen
  const roomCost = room;
  const hussenCost = hussen * 2.50;
  const dekoCost = totalPeople * dekoPerPerson;

  const buffetAdultsCost = adults * buffet;
  const buffetKidsCost = kids * (buffet / 2); // Assuming kids eat half price or similar, or full price? The image doesn't specify kids buffet, only kids drinks. Let's assume full for now unless drinks.
  const buffetCost = totalPeople * buffet;

  const sektCost = sekts * 3.00;
  const drinksAdultsCost = adults * drinksFlat;
  const drinksKidsCost = kids * (drinksFlat * 0.5); // "Kinder -50%"
  const drinksCost = drinksAdultsCost + drinksKidsCost;
  const waterCost = waterSetup * 4.50;

  const knabberCost = knabberkorb * 5.50;
  const coffeeCost = coffeeCake * 7.00;
  const candyCost = candybar * 100.00;

  const tanzCost = tanzshow ? 200.00 : 0;
  const bowlingCost = bowlingHours * 15.00;
  const indoorCost = indoorKids * 6.00;
  const childCareCost = childcareHours * 25.00;

  const total = roomCost + hussenCost + dekoCost + buffetCost + sektCost + drinksCost + waterCost + knabberCost + coffeeCost + candyCost + tanzCost + bowlingCost + indoorCost + childCareCost + djPrice + customExtras + techPrice + custom1Price + custom2Price + custom3Price + custom4Price;

  return (
    <main className="p-4 sm:p-8 max-w-5xl mx-auto">
      <Link href="/admin" className="inline-flex items-center text-blue-500 hover:underline mb-8 font-medium">
        <ArrowLeft size={16} className="mr-2" /> Zurück zum Dashboard
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="bg-blue-500/10 p-3 rounded-2xl text-blue-500">
          <Calculator size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Event-Kalkulator</h1>
          <p className="text-foreground/60">Kalkuliere Angebote live im Kundengespräch.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Personen */}
          <div className="glass p-6 rounded-2xl border border-foreground/5">
            <h2 className="text-xl font-bold mb-4">Gäste</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Erwachsene</label>
                <input type="number" min="0" value={adults} onChange={e => setAdults(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kinder (50% Rabatt bei Getränken)</label>
                <input type="number" min="0" value={kids} onChange={e => setKids(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2" />
              </div>
            </div>
          </div>

          {/* Ausstattung & Deko */}
          <div className="glass p-6 rounded-2xl border border-foreground/5">
            <h2 className="text-xl font-bold mb-4 text-pink-600">AUSSTATTUNG & DEKO</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Saalmiete</label>
                <select value={room} onChange={e => setRoom(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2">
                  <option value={0}>Keine / Extern</option>
                  <option value={300}>Partyraum (300,00 €)</option>
                  <option value={500}>Halbe Halle (500,00 €)</option>
                  <option value={1000}>Ganze Halle (1.000,00 €)</option>
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
                <option value={0}>Kein Buffet</option>
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
                  <label className="block text-sm font-medium mb-1">Wasser & Gläser (4,50 €)</label>
                  <input type="number" min="0" value={waterSetup} onChange={e => setWaterSetup(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2" placeholder="Anzahl Einheiten" />
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
                <input type="number" min="0" value={knabberkorb} onChange={e => setKnabberkorb(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2" placeholder="Anzahl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kaffee & Kuchen (7,00 €)</label>
                <input type="number" min="0" value={coffeeCake} onChange={e => setCoffeeCake(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2" placeholder="Anzahl Pers." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Candybar (100,00 €)</label>
                <input type="number" min="0" value={candybar} onChange={e => setCandybar(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2" placeholder="Anzahl (je 40 P.)" />
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div className="glass p-6 rounded-2xl border border-foreground/5">
            <h2 className="text-xl font-bold mb-4 text-pink-600">HIGHLIGHTS für Groß & Klein</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <input type="checkbox" id="tanz" checked={tanzshow} onChange={e => setTanzshow(e.target.checked)} className="w-5 h-5" />
                <label htmlFor="tanz" className="text-sm font-medium">Tanzshow ca. 20 min (200,00 €)</label>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Bowlingbahn (15€/h)</label>
                  <input type="number" min="0" value={bowlingHours} onChange={e => setBowlingHours(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2" placeholder="Std" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Indoorspielpl. (6€/K)</label>
                  <input type="number" min="0" value={indoorKids} onChange={e => setIndoorKids(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2" placeholder="Kinder" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kinderbetreuung (25€/h)</label>
                  <input type="number" min="0" value={childcareHours} onChange={e => setChildcareHours(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2" placeholder="Std" />
                </div>
              </div>
            </div>
          </div>

          {/* Optional */}
          <div className="glass p-6 rounded-2xl border border-foreground/5">
            <h2 className="text-xl font-bold mb-4 text-pink-600">OPTIONAL (Externe Anbieter)</h2>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div>
                <label className="block text-sm font-medium mb-1">DJ (Preis in €)</label>
                <input type="number" min="0" value={djPrice} onChange={e => setDjPrice(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2" placeholder="Betrag" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sonstige Extras (€)</label>
                <input type="number" min="0" value={customExtras} onChange={e => setCustomExtras(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2" placeholder="Betrag" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Veranstaltungstechniker (€)</label>
                <input type="number" min="0" value={techPrice} onChange={e => setTechPrice(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2" placeholder="Betrag" />
              </div>
            </div>

            <h3 className="text-sm font-bold mb-3 border-t pt-6">Individuelle Positionen</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-[1fr_150px] gap-4">
                <input type="text" value={custom1Name} onChange={e => setCustom1Name(e.target.value)} className="w-full bg-background border rounded-lg px-3 py-2 text-sm" placeholder="Positionsbezeichnung 1" />
                <div className="relative">
                  <input type="number" min="0" value={custom1Price} onChange={e => setCustom1Price(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2 text-sm pr-8" placeholder="Preis" />
                  <span className="absolute right-3 top-2 text-sm text-foreground/50">€</span>
                </div>
              </div>
              <div className="grid grid-cols-[1fr_150px] gap-4">
                <input type="text" value={custom2Name} onChange={e => setCustom2Name(e.target.value)} className="w-full bg-background border rounded-lg px-3 py-2 text-sm" placeholder="Positionsbezeichnung 2" />
                <div className="relative">
                  <input type="number" min="0" value={custom2Price} onChange={e => setCustom2Price(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2 text-sm pr-8" placeholder="Preis" />
                  <span className="absolute right-3 top-2 text-sm text-foreground/50">€</span>
                </div>
              </div>
              <div className="grid grid-cols-[1fr_150px] gap-4">
                <input type="text" value={custom3Name} onChange={e => setCustom3Name(e.target.value)} className="w-full bg-background border rounded-lg px-3 py-2 text-sm" placeholder="Positionsbezeichnung 3" />
                <div className="relative">
                  <input type="number" min="0" value={custom3Price} onChange={e => setCustom3Price(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2 text-sm pr-8" placeholder="Preis" />
                  <span className="absolute right-3 top-2 text-sm text-foreground/50">€</span>
                </div>
              </div>
              <div className="grid grid-cols-[1fr_150px] gap-4">
                <input type="text" value={custom4Name} onChange={e => setCustom4Name(e.target.value)} className="w-full bg-background border rounded-lg px-3 py-2 text-sm" placeholder="Positionsbezeichnung 4" />
                <div className="relative">
                  <input type="number" min="0" value={custom4Price} onChange={e => setCustom4Price(Number(e.target.value))} className="w-full bg-background border rounded-lg px-3 py-2 text-sm pr-8" placeholder="Preis" />
                  <span className="absolute right-3 top-2 text-sm text-foreground/50">€</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Sidebar Summary */}
        <div className="relative">
          <div className="sticky top-8 glass p-6 rounded-3xl border border-blue-500/20 shadow-xl">
            <h2 className="text-2xl font-black mb-6">Zusammenfassung</h2>
            
            <div className="space-y-3 text-sm mb-6 border-b border-foreground/10 pb-6">
              {roomCost > 0 && <div className="flex justify-between"><span>Saalmiete</span><span>{roomCost.toFixed(2)} €</span></div>}
              {hussenCost > 0 && <div className="flex justify-between"><span>Stretchhussen ({hussen}x)</span><span>{hussenCost.toFixed(2)} €</span></div>}
              {dekoCost > 0 && <div className="flex justify-between"><span>Deko ({totalPeople} P.)</span><span>{dekoCost.toFixed(2)} €</span></div>}
              
              {buffetCost > 0 && <div className="flex justify-between"><span>Buffet ({totalPeople} P.)</span><span>{buffetCost.toFixed(2)} €</span></div>}
              
              {sektCost > 0 && <div className="flex justify-between"><span>Sektempfang ({sekts}x)</span><span>{sektCost.toFixed(2)} €</span></div>}
              {drinksCost > 0 && <div className="flex justify-between"><span>Getränkeflat</span><span>{drinksCost.toFixed(2)} €</span></div>}
              {waterCost > 0 && <div className="flex justify-between"><span>Wasser & Gläser</span><span>{waterCost.toFixed(2)} €</span></div>}
              
              {knabberCost > 0 && <div className="flex justify-between"><span>Knabberkorb ({knabberkorb}x)</span><span>{knabberCost.toFixed(2)} €</span></div>}
              {coffeeCost > 0 && <div className="flex justify-between"><span>Kaffee & Kuchen ({coffeeCake}x)</span><span>{coffeeCost.toFixed(2)} €</span></div>}
              {candyCost > 0 && <div className="flex justify-between"><span>Candybar ({candybar}x)</span><span>{candyCost.toFixed(2)} €</span></div>}
              
              {tanzCost > 0 && <div className="flex justify-between"><span>Tanzshow</span><span>{tanzCost.toFixed(2)} €</span></div>}
              {bowlingCost > 0 && <div className="flex justify-between"><span>Bowling ({bowlingHours}h)</span><span>{bowlingCost.toFixed(2)} €</span></div>}
              {indoorCost > 0 && <div className="flex justify-between"><span>Indoorspielplatz ({indoorKids} K)</span><span>{indoorCost.toFixed(2)} €</span></div>}
              {childCareCost > 0 && <div className="flex justify-between"><span>Kinderbetreuung ({childcareHours}h)</span><span>{childCareCost.toFixed(2)} €</span></div>}
              
              {djPrice > 0 && <div className="flex justify-between"><span>DJ</span><span>{djPrice.toFixed(2)} €</span></div>}
              {customExtras > 0 && <div className="flex justify-between"><span>Extras</span><span>{customExtras.toFixed(2)} €</span></div>}
              {techPrice > 0 && <div className="flex justify-between"><span>Veranstaltungstechniker</span><span>{techPrice.toFixed(2)} €</span></div>}
              
              {custom1Price > 0 && <div className="flex justify-between"><span>{custom1Name || "Manuelle Pos. 1"}</span><span>{custom1Price.toFixed(2)} €</span></div>}
              {custom2Price > 0 && <div className="flex justify-between"><span>{custom2Name || "Manuelle Pos. 2"}</span><span>{custom2Price.toFixed(2)} €</span></div>}
              {custom3Price > 0 && <div className="flex justify-between"><span>{custom3Name || "Manuelle Pos. 3"}</span><span>{custom3Price.toFixed(2)} €</span></div>}
              {custom4Price > 0 && <div className="flex justify-between"><span>{custom4Name || "Manuelle Pos. 4"}</span><span>{custom4Price.toFixed(2)} €</span></div>}

              {total === 0 && <div className="text-foreground/50 italic text-center py-4">Wähle Positionen aus, um den Preis zu berechnen.</div>}
            </div>

            <div className="flex justify-between items-end mb-2">
              <span className="font-bold text-lg">Gesamtbetrag</span>
              <span className="text-3xl font-black text-blue-600">{total.toFixed(2)} €</span>
            </div>
            
            {totalPeople > 0 && total > 0 && (
              <div className="text-right text-xs text-foreground/50">
                (entspricht {(total / totalPeople).toFixed(2)} € pro Person)
              </div>
            )}

            <button onClick={() => window.print()} className="w-full mt-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors">
              Als PDF drucken
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
