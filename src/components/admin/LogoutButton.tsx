"use client";

import { LogOut } from "lucide-react";
import { logoutAdmin } from "@/app/actions/auth";

export function LogoutButton() {
  return (
    <button 
      onClick={() => logoutAdmin()} 
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-foreground/60 hover:bg-red-500/10 hover:text-red-500 transition-all font-medium"
    >
      <LogOut size={18} /> <span>Logout <span className="hidden md:inline">& Website</span></span>
    </button>
  );
}
