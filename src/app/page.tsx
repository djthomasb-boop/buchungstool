import Link from 'next/link';
import { ArrowRight, CircleDot, Baby, Activity, Music, Warehouse, Presentation, Trees, Castle, Trophy, Target } from 'lucide-react';
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";


export default async function Home() {
  let isTippActive = false;
  try {
    const tippActiveSetting = await prisma.setting.findUnique({ where: { key: "TIPPSPIEL_ACTIVE" } });
    isTippActive = tippActiveSetting?.value === "true";
  } catch (error) {
    console.error("Fehler beim Laden der Tippspiel-Einstellung:", error);
  }

  return (
    <main className="min-h-screen relative overflow-hidden bg-background">
      {/* Background Decorators */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#f23529]/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#b70000]/15 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 pt-32 pb-24 relative z-10">
        <header className="text-center mb-24 animate-slide-up">
          <div className="flex items-center justify-center gap-4 mb-8">
            <img src="/logo.png" alt="be free Logo" className="h-16 md:h-20 object-contain drop-shadow-sm block dark:hidden" />
            <img src="/logo_white.png" alt="be free Logo White" className="h-16 md:h-20 object-contain drop-shadow-sm hidden dark:block" />
            <div className="px-4 py-1.5 rounded-full border border-[#f23529]/30 bg-[#f23529]/10 text-[#cd1212] dark:text-[#f23529] text-sm font-bold tracking-wide">
              Sport & Erholungszentrum
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 hyphens-auto">
            Erlebe <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#cd1212] to-[#f23529] break-words md:break-normal">unvergessliche</span><br />
            Momente.
          </h1>
          <p className="text-xl text-foreground/60 max-w-2xl mx-auto">
            Wähle deine Aktivität und buche in wenigen Sekunden. Einfach, schnell und direkt online.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Card 1: Bowling */}
          <Link href="/bowling" className="group">
            <div className="glass p-8 rounded-3xl h-full transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 border border-foreground/5 hover:border-blue-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <CircleDot size={80} />
              </div>
              <div className="bg-blue-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-blue-500">
                <CircleDot size={28} />
              </div>
              <h2 className="text-2xl font-bold mb-3">Bowling</h2>
              <p className="text-foreground/60 mb-8 leading-relaxed">
                4 Bahnen - bis zu 8 Personen pro Bahn, schnapp Dir deine Crew und los gehts!
              </p>
              <div className="flex items-center text-sm font-semibold text-blue-500 mt-auto">
                Jetzt buchen <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card 2: Squash */}
          <Link href="/squash" className="group">
            <div className="glass p-8 rounded-3xl h-full transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20 border border-foreground/5 hover:border-green-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Activity size={80} />
              </div>
              <div className="bg-green-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-green-500">
                <Activity size={28} />
              </div>
              <h2 className="text-2xl font-bold mb-3">Squash</h2>
              <p className="text-foreground/60 mb-8 leading-relaxed">
                Auspowern im Court. Buche dir deinen Squash-Raum für die nächste Session.
              </p>
              <div className="flex items-center text-sm font-semibold text-green-500 mt-auto">
                Jetzt buchen <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card 3: Indoorspielplatz */}
          <Link href="/indoorspielplatz" className="group">
            <div className="glass p-8 rounded-3xl h-full transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 border border-foreground/5 hover:border-blue-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Castle size={80} />
              </div>
              <div className="bg-blue-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-blue-500">
                <Castle size={28} />
              </div>
              <h2 className="text-2xl font-bold mb-3">Indoorspielplatz</h2>
              <p className="text-foreground/60 mb-8 leading-relaxed">
                Reserviere dir und deinen Kindern einen Platz zum Toben und Spielen.
              </p>
              <div className="flex items-center text-sm font-semibold text-blue-500 mt-auto">
                Platz reservieren <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card 4: Kindergeburtstag */}
          <Link href="/kidsworld" className="group">
            <div className="glass p-8 rounded-3xl h-full transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/20 border border-foreground/5 hover:border-orange-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Baby size={80} />
              </div>
              <div className="bg-orange-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-orange-500">
                <Baby size={28} />
              </div>
              <h2 className="text-2xl font-bold mb-3">Kindergeburtstag</h2>
              <p className="text-foreground/60 mb-8 leading-relaxed">
                Kindergeburtstag mit Spiel, Spaß, Abenteuer und Verpflegung.
              </p>
              <div className="flex items-center text-sm font-semibold text-orange-500 mt-auto">
                Jetzt anfragen <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card 5: Outdoor Location */}
          <Link href="/outdoor" className="group">
            <div className="glass p-8 rounded-3xl h-full transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20 border border-foreground/5 hover:border-green-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Trees size={80} />
              </div>
              <div className="bg-green-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-green-500">
                <Trees size={28} />
              </div>
              <h2 className="text-2xl font-bold mb-3">Outdoor Party</h2>
              <p className="text-foreground/60 mb-8 leading-relaxed">
                Kinder spielen und die Erwachsenen feiern. Mit Minigolf, Trampolin & Partyzelt.
              </p>
              <div className="flex items-center text-sm font-semibold text-green-500 mt-auto">
                Jetzt anfragen <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card 6: Event Konfigurator */}
          <Link href="/eventlocation" className="group">
            <div className="glass p-8 rounded-3xl h-full transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/20 border border-foreground/5 hover:border-pink-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Presentation size={80} />
              </div>
              <div className="bg-pink-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-pink-500">
                <Presentation size={28} />
              </div>
              <h2 className="text-2xl font-bold mb-3">Event Konfigurator (Indoor & Halle)</h2>
              <p className="text-foreground/60 mb-8 leading-relaxed">
                Stelle dir dein perfektes Event zusammen. Ob Kursraum, Saal oder die große Halle - berechne dein Event live online.
              </p>
              <div className="flex items-center text-sm font-semibold text-pink-500 mt-auto">
                Zum Konfigurator <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card 7: Kurs- & Eventraum / Kegelbahn */}
          <Link href="/dartkegeln" className="group">
            <div className="glass p-8 rounded-3xl h-full transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/20 border border-foreground/5 hover:border-amber-500/30 relative overflow-hidden bg-gradient-to-br from-amber-500/5 to-transparent">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Target size={80} />
              </div>
              <div className="bg-amber-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-amber-500">
                <Target size={28} />
              </div>
              <h2 className="text-2xl font-bold mb-3">Kurs- & Eventraum / Kegelbahn</h2>
              <p className="text-foreground/60 mb-8 leading-relaxed text-sm">
                Dieser Raum ist ideal für Kurse (intern/extern), für Familien- & Firmenfeiern bis zu 80 Personen. Hier ist auch die Kegelbahn und Dart buchbar.
              </p>
              <div className="flex items-center text-sm font-semibold text-amber-500 mt-auto">
                Jetzt buchen <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card 7: Tippspiel (Conditional) */}
          {isTippActive && (
            <Link href="/tippspiel" className="group">
              <div className="glass p-8 rounded-3xl h-full transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/20 border border-foreground/5 hover:border-amber-500/30 relative overflow-hidden bg-gradient-to-br from-amber-500/5 to-transparent">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Trophy size={80} />
                </div>
                <div className="bg-amber-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-amber-500">
                  <Trophy size={28} />
                </div>
                <h2 className="text-2xl font-bold mb-3">WM 2026 Tippspiel</h2>
                <p className="text-foreground/60 mb-8 leading-relaxed">
                  Gib deine Tipps für die Spiele ab und gewinne tolle Preise. Jetzt kostenlos teilnehmen!
                </p>
                <div className="flex items-center text-sm font-semibold text-amber-500 mt-auto">
                  Mitspielen & Tippen <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          )}
        </div>

        <div className="mt-16 text-center">
          <a 
            href="tel:+493977960806" 
            className="inline-flex items-center gap-2 bg-foreground/5 hover:bg-foreground/10 text-foreground px-6 py-4 rounded-2xl font-bold transition-colors border border-foreground/10"
          >
            <span className="text-xl">☎</span> +49 39779 60806 - Telefonisch buchen
          </a>
        </div>
      </div>
    </main>
  );
}
