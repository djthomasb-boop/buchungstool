import Link from "next/link";
import { LayoutDashboard, Settings, CalendarDays, PlusCircle, Baby, Calculator, BookOpen, Lightbulb, CircleDot, Trophy, Sparkles, Target, Printer, RefreshCw } from "lucide-react";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row h-screen bg-background print:h-auto print:block print:bg-white print:overflow-visible">
      {/* Sidebar / Header on Mobile */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-foreground/10 bg-foreground/5 flex flex-col flex-none print:hidden">
        <div className="p-4 md:p-6 flex justify-between items-center md:block pr-14 md:pr-6">
          <div>
            <h2 className="text-xl font-black text-blue-500">Admin Area</h2>
            <p className="text-xs text-foreground/50">Sport & Erholungszentrum</p>
          </div>
          <div className="md:hidden">
            <LogoutButton />
          </div>
        </div>
        
        {/* Top Navigation */}
        <nav className="flex-none md:flex-1 px-4 pb-4 md:pb-0 space-y-0 md:space-y-2 flex gap-2 md:block overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <Link href="/admin" className="flex-none flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl text-foreground/80 hover:bg-blue-500/10 hover:text-blue-500 transition-all font-medium text-sm md:text-base">
            <LayoutDashboard size={18} /> <span className="whitespace-nowrap">Tagesübersicht</span>
          </Link>
          <Link href="/admin/settings?tab=dienstplan" className="flex-none flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 transition-all font-bold text-sm md:text-base">
            <CalendarDays size={18} /> <span className="whitespace-nowrap">📋 Dienstplan</span>
          </Link>
          <Link href="/admin/blocks" className="flex-none flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl text-foreground/80 hover:bg-blue-500/10 hover:text-blue-500 transition-all font-medium text-sm md:text-base">
            <CalendarDays size={18} /> <span className="whitespace-nowrap">Sperrzeiten</span>
          </Link>
          <Link href="/admin/tippspiel" className="flex-none flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl text-foreground/80 hover:bg-blue-500/10 hover:text-blue-500 transition-all font-medium text-sm md:text-base">
            <Trophy size={18} /> <span className="whitespace-nowrap">WM Tippspiel</span>
          </Link>

          <div className="hidden md:block text-[10px] uppercase font-bold text-foreground/40 mb-2 px-4 mt-6">Aktionen</div>
          <Link href="/admin/new-event" className="flex-none flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 transition-all font-medium text-sm md:text-base">
            <Sparkles size={18} /> <span className="whitespace-nowrap">Allgemein</span>
          </Link>
          <Link href="/admin/new-kidsworld" className="flex-none flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl text-purple-600 bg-purple-500/10 hover:bg-purple-500/20 transition-all font-medium text-sm md:text-base">
            <Baby size={18} /> <span className="whitespace-nowrap">Neuer Kindergeburtstag</span>
          </Link>
          <Link href="/bowling" className="flex-none flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl text-orange-600 bg-orange-500/10 hover:bg-orange-500/20 transition-all font-medium text-sm md:text-base">
            <CircleDot size={18} /> <span className="whitespace-nowrap">Bowling Reservierung</span>
          </Link>
          <Link href="/admin/new-squash" className="flex-none flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl text-green-600 bg-green-500/10 hover:bg-green-500/20 transition-all font-medium text-sm md:text-base">
            <PlusCircle size={18} /> <span className="whitespace-nowrap">Squash Blockieren</span>
          </Link>
          <Link href="/dartkegeln" className="flex-none flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 transition-all font-medium text-sm md:text-base">
            <Target size={18} /> <span className="whitespace-nowrap">Kurs- & Eventraum / Kegelbahn</span>
          </Link>
          <Link href="/admin/event-calculator" className="flex-none flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 transition-all font-medium text-sm md:text-base">
            <Calculator size={18} /> <span className="whitespace-nowrap">Event-Kalkulator</span>
          </Link>
          <Link href="/admin/settings" className="flex-none md:hidden flex items-center gap-2 px-4 py-2 rounded-xl text-foreground/80 hover:bg-blue-500/10 hover:text-blue-500 transition-all font-medium text-sm">
            <Settings size={18} /> <span className="whitespace-nowrap">Einstellungen</span>
          </Link>
          <Link href="/admin/settings?tab=update" className="flex-none md:hidden flex items-center gap-2 px-4 py-2 rounded-xl text-foreground/80 hover:bg-blue-500/10 hover:text-blue-500 transition-all font-medium text-sm">
            <RefreshCw size={18} /> <span className="whitespace-nowrap">Update</span>
          </Link>
          <Link href="/admin/tippspiel/print" target="_blank" className="flex-none flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl text-red-600 bg-red-500/10 hover:bg-red-500/20 transition-all font-medium text-sm md:text-base">
            <Printer size={18} /> <span className="whitespace-nowrap">Tippspiel PDF Export</span>
          </Link>
        </nav>

        {/* Bottom Navigation */}
        <div className="hidden md:flex flex-col p-4 border-t border-foreground/10 space-y-2">
          <Link href="/admin/features" className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-all font-medium text-sm md:text-base">
            <Lightbulb size={18} /> <span className="whitespace-nowrap font-bold">Features vorschlagen</span>
          </Link>
          <Link href="/admin/manual" className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground/80 hover:bg-blue-500/10 hover:text-blue-500 transition-all font-medium text-sm md:text-base">
            <BookOpen size={18} /> <span className="whitespace-nowrap">Bedienungsanleitung</span>
          </Link>
          <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground/80 hover:bg-blue-500/10 hover:text-blue-500 transition-all font-medium text-sm md:text-base">
            <Settings size={18} /> <span className="whitespace-nowrap">Einstellungen</span>
          </Link>
          <Link href="/admin/settings?tab=dienstplan" className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground/80 hover:bg-blue-500/10 hover:text-blue-500 transition-all font-medium text-sm md:text-base">
            <CalendarDays size={18} /> <span className="whitespace-nowrap">Dienstplan</span>
          </Link>
          <Link href="/admin/settings?tab=update" className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground/80 hover:bg-blue-500/10 hover:text-blue-500 transition-all font-medium text-sm md:text-base">
            <RefreshCw size={18} /> <span className="whitespace-nowrap">System-Update</span>
          </Link>
          <LogoutButton />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-background p-4 md:p-0 print:overflow-visible print:h-auto print:p-0 print:bg-white print:block">
        {children}
      </div>
    </div>
  );
}
