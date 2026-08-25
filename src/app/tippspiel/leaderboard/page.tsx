import { redirect } from "next/navigation";
import { getCurrentTippUser } from "@/app/actions/tipp";
import { prisma } from "@/lib/prisma";
import TippNav from "@/components/TippNav";
import { Trophy, Medal, Star, Printer } from "lucide-react";

export const revalidate = 0; // Fresh standings on every load

export default async function TippspielLeaderboardPage() {
  const currentUser = await getCurrentTippUser();

  if (!currentUser) {
    redirect("/tippspiel");
  }

  // Fetch users with their predictions
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

  // Calculate detailed stats
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
      exact,
      diff,
      tendency,
      totalTipps: user.predictions.length,
      championPrediction: user.championPrediction,
      championPoints: user.championPoints,
    };
  });

  // Helper to render medals/ranks
  const renderRankBadge = (index: number) => {
    const rank = index + 1;
    if (rank === 1) {
      return (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
          <Trophy size={16} />
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-300/20 text-slate-400 border border-slate-300/30">
          <Medal size={16} />
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-700/20 text-amber-700 border border-amber-700/30">
          <Medal size={16} />
        </span>
      );
    }
    return <span className="font-bold text-foreground/40 text-sm">{rank}</span>;
  };

  return (
    <div className="pb-16">
      <TippNav user={currentUser} />
      
      <main className="max-w-6xl mx-auto px-4 mt-6 animate-slide-up">
        <div className="glass p-8 rounded-3xl border border-foreground/5 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-8 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20">
                <Trophy size={26} />
              </div>
              <div>
                <h2 className="text-2xl font-black">Rangliste</h2>
                <p className="text-sm text-foreground/60">Aktueller Punktestand aller Teilnehmer</p>
              </div>
            </div>
            <a
              href="/admin/tippspiel/print"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-foreground/10 hover:bg-foreground/20 text-foreground font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              <Printer size={16} /> PDF / Druckansicht
            </a>
          </div>

          {/* Leaderboard Table */}
          <div className="overflow-x-auto rounded-2xl border border-foreground/5 bg-background/30">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-foreground/5 bg-foreground/5 text-foreground/70 font-bold text-xs uppercase tracking-wider">
                  <th className="py-4 px-6 text-center w-16">Platz</th>
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-4">WM-Tipp</th>
                  <th className="py-4 px-4 text-center">3 Pkt. (Exakt)</th>
                  <th className="py-4 px-4 text-center">2 Pkt. (Diff.)</th>
                  <th className="py-4 px-4 text-center">1 Pkt. (Tend.)</th>
                  <th className="py-4 px-4 text-center">WM-Pkt.</th>
                  <th className="py-4 px-6 text-right">Punkte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/5">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-foreground/50 font-medium">
                      Bisher haben sich noch keine Tipper registriert.
                    </td>
                  </tr>
                ) : (
                  users.map((user, idx) => {
                    const isMe = user.id === currentUser.id;
                    return (
                      <tr
                        key={user.id}
                        className={`transition-colors hover:bg-foreground/5 ${
                          isMe ? "bg-blue-500/5 font-black" : ""
                        }`}
                      >
                        <td className="py-4 px-6 text-center">{renderRankBadge(idx)}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className="text-sm sm:text-base">{user.nickname}</span>
                            {isMe && (
                              <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-black uppercase rounded-md flex items-center gap-0.5">
                                <Star size={10} className="fill-blue-500" /> Du
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-foreground/60 font-semibold">
                          {user.championPrediction || "-"}
                        </td>
                        <td className="py-4 px-4 text-center text-sm font-medium text-foreground/75">
                          {user.exact}
                        </td>
                        <td className="py-4 px-4 text-center text-sm font-medium text-foreground/75">
                          {user.diff}
                        </td>
                        <td className="py-4 px-4 text-center text-sm font-medium text-foreground/75">
                          {user.tendency}
                        </td>
                        <td className="py-4 px-4 text-center text-sm font-black text-amber-500">
                          {user.championPoints > 0 ? `+${user.championPoints}` : "0"}
                        </td>
                        <td className="py-4 px-6 text-right font-black text-base sm:text-lg text-blue-500">
                          {user.totalPoints}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
