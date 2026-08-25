"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Trophy, Calendar, LogOut, ShieldAlert } from "lucide-react";
import { logoutTippUser } from "@/app/actions/tipp";

interface TippNavProps {
  user: {
    nickname: string;
    totalPoints: number;
  } | null;
}

export default function TippNav({ user }: TippNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logoutTippUser();
    router.push("/tippspiel");
    router.refresh();
  };

  return (
    <header className="w-full max-w-6xl mx-auto px-4 py-6 print-hidden">
      <div className="glass p-4 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 border border-foreground/5 shadow-lg backdrop-blur-xl">
        {/* Left: Brand/Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#cd1212] to-[#f23529] flex items-center justify-center text-white shadow-md shadow-[#f23529]/20">
            <Trophy size={20} />
          </div>
          <div>
            <h1 className="font-black text-lg leading-tight tracking-tight">WM 2026 Tippspiel</h1>
            <p className="text-xs text-foreground/50 font-medium">be free Sportzentrum</p>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <nav className="flex items-center gap-1 bg-foreground/5 p-1 rounded-2xl">
          <Link
            href="/tippspiel/dashboard"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              pathname === "/tippspiel/dashboard"
                ? "bg-background text-foreground shadow-sm"
                : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
            }`}
          >
            <Calendar size={16} />
            Spiele
          </Link>
          <Link
            href="/tippspiel/leaderboard"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              pathname === "/tippspiel/leaderboard"
                ? "bg-background text-foreground shadow-sm"
                : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
            }`}
          >
            <Trophy size={16} />
            Rangliste
          </Link>
        </nav>

        {/* Right: User Stats & Logout */}
        <div className="flex items-center gap-4">
          {user && (
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-foreground">{user.nickname}</p>
              <p className="text-xs font-bold text-blue-500">{user.totalPoints} Punkte</p>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2.5 bg-foreground/5 hover:bg-red-500/10 text-foreground/60 hover:text-red-500 rounded-xl transition-all border border-transparent hover:border-red-500/20"
            title="Abmelden"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
