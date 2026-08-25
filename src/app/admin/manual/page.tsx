export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { BookOpen } from "lucide-react";
import { ManualClient } from "./ManualClient";

export default async function ManualPage() {
  const manual = await prisma.setting.findUnique({ where: { key: "MANUAL_TEXT" } });

  const defaultText = `Willkommen in der be free Buchungstool-Verwaltung!

1. Tagesübersicht
Hier siehst du alle anstehenden Buchungen und Events für den ausgewählten Tag. Du kannst Buchungen bearbeiten oder stornieren.

2. Sperrzeiten
Falls die Anlage (oder bestimmte Bereiche wie Bowling, Kidsworld, Squash) geschlossen ist, kannst du hier Sperrzeiten eintragen. An diesen Tagen sind keine Online-Buchungen möglich.

3. Neuer Kindergeburtstag
Lege hier manuell einen neuen Kindergeburtstag an. Wähle das entsprechende Paket (z.B. Tea Time), die Anzahl der Kinder/Erwachsenen und eventuelle Extras.

4. Squash Blockieren
Blockiere hier Squash-Courts für Kurse, Turniere oder interne Zwecke.

5. Event-Kalkulator
Erstelle hier Angebote und Kalkulationen für größere Events.

6. Features vorschlagen
Hast du eine Idee oder fehlt dir eine Funktion? Klicke links im Menü auf "Features vorschlagen", um eine direkte E-Mail an die Entwickler zu senden.`;

  const currentText = manual?.value || defaultText;

  return (
    <div className="p-8 md:p-12 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Bedienungsanleitung</h1>
        <p className="text-foreground/60 mt-1">Hilfe und Anleitung für die Mitarbeiter.</p>
      </div>

      <div className="glass p-8 rounded-3xl border border-foreground/5">
        <div className="flex justify-between items-center mb-6 pb-6 border-b border-foreground/10">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 p-3 rounded-xl text-blue-500">
              <BookOpen size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Handbuch</h2>
              <p className="text-sm text-foreground/50">Informationen zur Nutzung des Tools.</p>
            </div>
          </div>
        </div>

        <ManualClient initialText={currentText} />
      </div>
    </div>
  );
}
