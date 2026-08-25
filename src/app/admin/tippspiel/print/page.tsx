export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { PrintButton } from "@/app/admin/kitchen-print/PrintButton";

export default async function TippspielPrintPage() {
  const dbUsers = await prisma.tippUser.findMany({
    include: {
      predictions: {
        where: {
          points: { not: null },
        },
      },
    },
    orderBy: {
      totalPoints: "desc",
    },
  });

  const championSetting = await prisma.setting.findUnique({
    where: { key: "TIPPSPIEL_CHAMPION" },
  });

  const users = dbUsers.map((user) => {
    let exact = 0;
    let diff = 0;
    let tendency = 0;

    user.predictions.forEach((p) => {
      if (p.points === 3) exact++;
      else if (p.points === 2) diff++;
      else if (p.points === 1) tendency++;
    });

    return {
      id: user.id,
      nickname: user.nickname,
      totalPoints: user.totalPoints,
      email: user.email || "-",
      phone: user.phone || "-",
      isMember: user.isMember,
      isMemberVerified: user.isMemberVerified,
      championPrediction: user.championPrediction,
      championPoints: user.championPoints,
      exact,
      diff,
      tendency,
      totalTipps: user.predictions.length,
    };
  });

  const formattedDate = format(new Date(), "dd. MMMM yyyy, HH:mm", { locale: de }) + " Uhr";
  const top1 = users[0];
  const top2 = users[1];
  const top3 = users[2];

  return (
    <main className="min-h-screen bg-white text-black p-8 font-sans max-w-5xl mx-auto print:min-h-0 print:p-0 print:max-w-none">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="mb-8 flex justify-between items-center pb-4 border-b border-gray-300 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-gray-900">WM 2026 Tippspiel – Gewinnerliste & Auswertung</h1>
          <p className="text-sm text-gray-500">Druckansicht & PDF-Export</p>
        </div>
        <div className="flex gap-3">
          <PrintButton />
          <a
            href="/admin/tippspiel"
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-bold rounded-lg transition-colors cursor-pointer"
          >
            Zurück zur Verwaltung
          </a>
        </div>
      </div>

      {/* Header logo & title */}
      <div className="mb-8 pb-4 border-b-2 border-black flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <img src="/logo.png" alt="be free Logo" className="h-10 object-contain" />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-600 border border-gray-400 px-2 py-0.5 rounded">
              be free e.V. Sport & Erholungszentrum
            </span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-black">
            WM 2026 Tippspiel – Offizielle Gewinnerliste
          </h1>
          <p className="text-sm font-bold text-gray-700 mt-0.5">
            Auswertung gedruckt am: {formattedDate} {championSetting?.value ? `• Offizieller Weltmeister: ${championSetting.value}` : ''}
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black">{users.length}</span>
          <span className="block text-xs font-bold uppercase text-gray-500">Teilnehmer</span>
        </div>
      </div>

      {/* TOP 3 Winner Podium Cards */}
      {users.length > 0 && (
        <div className="mb-8 space-y-3">
          <h2 className="text-lg font-black uppercase tracking-wider border-b border-black pb-1 mb-4">
            🏆 Die Sieger (Top 3)
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {/* 1st Place */}
            {top1 && (
              <div className="p-4 border-2 border-black rounded-xl bg-amber-50 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-8 h-8 rounded-full bg-amber-500 text-white font-black flex items-center justify-center text-sm shadow">
                    1
                  </span>
                  <span className="font-black text-sm uppercase tracking-wider text-amber-900">🥇 1. Platz (Gewinner)</span>
                </div>
                <h3 className="text-xl font-black text-black truncate">{top1.nickname}</h3>
                <div className="mt-2 text-xs space-y-1 text-gray-800 border-t border-amber-200 pt-2">
                  <p><strong>Punkte:</strong> <span className="text-base font-black text-amber-700">{top1.totalPoints} Pkt.</span></p>
                  <p><strong>E-Mail:</strong> {top1.email}</p>
                  <p><strong>Telefon:</strong> {top1.phone}</p>
                  <p><strong>Mitglied:</strong> {top1.isMemberVerified ? 'Ja (Verifiziert)' : top1.isMember ? 'Ja (Offen)' : 'Nein'}</p>
                  {top1.championPrediction && <p><strong>WM-Tipp:</strong> {top1.championPrediction}</p>}
                </div>
              </div>
            )}

            {/* 2nd Place */}
            {top2 && (
              <div className="p-4 border-2 border-black rounded-xl bg-slate-50 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-8 h-8 rounded-full bg-slate-400 text-white font-black flex items-center justify-center text-sm shadow">
                    2
                  </span>
                  <span className="font-black text-sm uppercase tracking-wider text-slate-800">🥈 2. Platz</span>
                </div>
                <h3 className="text-xl font-black text-black truncate">{top2.nickname}</h3>
                <div className="mt-2 text-xs space-y-1 text-gray-800 border-t border-slate-200 pt-2">
                  <p><strong>Punkte:</strong> <span className="text-base font-black text-slate-700">{top2.totalPoints} Pkt.</span></p>
                  <p><strong>E-Mail:</strong> {top2.email}</p>
                  <p><strong>Telefon:</strong> {top2.phone}</p>
                  <p><strong>Mitglied:</strong> {top2.isMemberVerified ? 'Ja (Verifiziert)' : top2.isMember ? 'Ja (Offen)' : 'Nein'}</p>
                  {top2.championPrediction && <p><strong>WM-Tipp:</strong> {top2.championPrediction}</p>}
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3 && (
              <div className="p-4 border-2 border-black rounded-xl bg-orange-50 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-8 h-8 rounded-full bg-amber-700 text-white font-black flex items-center justify-center text-sm shadow">
                    3
                  </span>
                  <span className="font-black text-sm uppercase tracking-wider text-amber-900">🥉 3. Platz</span>
                </div>
                <h3 className="text-xl font-black text-black truncate">{top3.nickname}</h3>
                <div className="mt-2 text-xs space-y-1 text-gray-800 border-t border-orange-200 pt-2">
                  <p><strong>Punkte:</strong> <span className="text-base font-black text-amber-800">{top3.totalPoints} Pkt.</span></p>
                  <p><strong>E-Mail:</strong> {top3.email}</p>
                  <p><strong>Telefon:</strong> {top3.phone}</p>
                  <p><strong>Mitglied:</strong> {top3.isMemberVerified ? 'Ja (Verifiziert)' : top3.isMember ? 'Ja (Offen)' : 'Nein'}</p>
                  {top3.championPrediction && <p><strong>WM-Tipp:</strong> {top3.championPrediction}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Participants Table */}
      <div>
        <h2 className="text-lg font-black uppercase tracking-wider border-b border-black pb-1 mb-4">
          📊 Gesamte Rangliste & Teilnehmer
        </h2>
        <table className="w-full text-left border-collapse border border-black text-xs">
          <thead>
            <tr className="bg-gray-100 border-b border-black font-black uppercase">
              <th className="py-2.5 px-3 border-r border-black text-center w-12">Rang</th>
              <th className="py-2.5 px-3 border-r border-black">Nickname</th>
              <th className="py-2.5 px-3 border-r border-black">E-Mail</th>
              <th className="py-2.5 px-3 border-r border-black">Telefon</th>
              <th className="py-2.5 px-2 border-r border-black text-center">Mitglied</th>
              <th className="py-2.5 px-3 border-r border-black">WM-Tipp</th>
              <th className="py-2.5 px-2 border-r border-black text-center">3er</th>
              <th className="py-2.5 px-2 border-r border-black text-center">2er</th>
              <th className="py-2.5 px-2 border-r border-black text-center">1er</th>
              <th className="py-2.5 px-2 border-r border-black text-center">WM-Pkt.</th>
              <th className="py-2.5 px-3 font-black text-right">Gesamt</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, idx) => (
              <tr key={u.id} className="border-b border-gray-300 break-inside-avoid">
                <td className="py-2 px-3 border-r border-black text-center font-bold">{idx + 1}</td>
                <td className="py-2 px-3 border-r border-black font-bold">{u.nickname}</td>
                <td className="py-2 px-3 border-r border-black font-mono text-[11px]">{u.email}</td>
                <td className="py-2 px-3 border-r border-black font-mono text-[11px]">{u.phone}</td>
                <td className="py-2 px-2 border-r border-black text-center">
                  {u.isMemberVerified ? (
                    <span className="font-bold text-green-700">Ja (Verifiziert)</span>
                  ) : u.isMember ? (
                    <span className="font-bold text-amber-700">Ja (Offen)</span>
                  ) : (
                    <span className="text-gray-500">Nein</span>
                  )}
                </td>
                <td className="py-2 px-3 border-r border-black">{u.championPrediction || "-"}</td>
                <td className="py-2 px-2 border-r border-black text-center font-medium">{u.exact}</td>
                <td className="py-2 px-2 border-r border-black text-center font-medium">{u.diff}</td>
                <td className="py-2 px-2 border-r border-black text-center font-medium">{u.tendency}</td>
                <td className="py-2 px-2 border-r border-black text-center font-bold">{u.championPoints > 0 ? `+${u.championPoints}` : "0"}</td>
                <td className="py-2 px-3 text-right font-black text-sm">{u.totalPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-400 text-center text-xs text-gray-500">
        <p>be free e.V. Sport & Erholungszentrum • Offizielle Auswertungsliste WM 2026 Tippspiel</p>
      </div>
    </main>
  );
}
