import { prisma } from "@/lib/prisma";
import { getTippSettings, getUniqueTeams } from "@/app/actions/tipp";
import TippAdminClient from "@/components/admin/TippAdminClient";
import { Printer } from "lucide-react";

export const revalidate = 0; // Fresh settings on every load

export default async function AdminTippspielPage() {
  // Fetch all matches
  const matches = await prisma.match.findMany({
    orderBy: {
      dateTime: "asc",
    },
  });

  // Fetch current Tippspiel settings
  const settings = await getTippSettings();

  // Fetch unique teams list for champion evaluation
  const uniqueTeams = await getUniqueTeams();

  // Fetch all users with their predictions
  const users = await prisma.tippUser.findMany({
    include: {
      predictions: true,
    },
    orderBy: {
      totalPoints: "desc",
    },
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-foreground/10 pb-6">
        <div>
          <h1 className="text-3xl font-black text-foreground">WM 2026 Tippspiel Verwaltung</h1>
          <p className="text-foreground/60 mt-1">
            Steuere die Synchronisation, passe die Einstellungen an oder drucke die Auswertung aus.
          </p>
        </div>
        <a
          href="/admin/tippspiel/print"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 px-5 py-3 bg-[#f23529] hover:bg-[#d02015] text-white font-black rounded-2xl shadow-lg hover:scale-105 transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base"
        >
          <Printer size={20} />
          <span>🖨️ Gewinnerliste (PDF / Drucken)</span>
        </a>
      </div>

      <TippAdminClient 
        initialMatches={JSON.parse(JSON.stringify(matches))} 
        initialSettings={settings} 
        uniqueTeams={uniqueTeams}
        initialUsers={JSON.parse(JSON.stringify(users))}
      />
    </div>
  );
}
