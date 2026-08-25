"use client";

import { useState } from "react";
import { Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { loginAdmin } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const res = await loginAdmin(password);
    if (res.success) {
      router.push("/admin");
    } else {
      setError(res.error || "Ein Fehler ist aufgetreten.");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Ornaments */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 blur-[120px] rounded-full z-0 pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 blur-[120px] rounded-full z-0 pointer-events-none" />

      <div className="w-full max-w-md z-10 animate-fade-in">
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="be free" className="h-20 mx-auto object-contain mb-6 drop-shadow-xl" />
          <h1 className="text-3xl font-black text-foreground">Admin Login</h1>
          <p className="text-foreground/60 mt-2 font-medium">Bitte autorisiere dich für das Dashboard.</p>
        </div>

        <form onSubmit={handleLogin} className="glass p-8 rounded-3xl shadow-2xl border border-foreground/10 backdrop-blur-xl">
          
          <div className="mb-6 relative">
            <label className="block text-sm font-bold mb-3 text-foreground/80">Admin Passwort</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={20} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Passwort eingeben..."
                className="w-full bg-background/50 border-2 border-foreground/10 rounded-2xl py-4 pl-12 pr-4 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all font-medium backdrop-blur-sm"
                required
              />
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-bold text-center animate-shake">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 group"
          >
            {isLoading ? "Prüfe..." : (
              <>
                <ShieldCheck size={22} /> Login
                <ArrowRight size={20} className="ml-1 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
        
        <p className="text-center text-xs text-foreground/40 mt-8 font-medium">
          be free Sport & Erholungszentrum &copy; {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}
